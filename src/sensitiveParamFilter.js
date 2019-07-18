const {
  DEFAULT_PARAMS,
  DEFAULT_REPLACEMENT
} = require('./defaults')

const {
  constructParamRegex,
  constructWhitelistRegex,
  generateRandomString,
  parseUrlParams
} = require('./helpers')

class SensitiveParamFilter {
  constructor(...args) {
    this.paramRegex = constructParamRegex(args[0] || DEFAULT_PARAMS)
    this.replacement = args[1] || DEFAULT_REPLACEMENT
    this.whitelistRegex = constructWhitelistRegex(args[2])
    this.objectIdKey = generateRandomString()
    this.examinedObjects = null
  }

  filter(inputObject) {
    this.examinedObjects = []
    const output = this.recursiveFilter(inputObject)
    this.cleanupIdKeys()
    return output
  }

  recursiveFilter(input) {
    if (!input || typeof input === 'number' || typeof input === 'boolean') {
      return input
    } else if (typeof input === 'string' || input instanceof String) {
      return this.filterString(input)
    } else if (input instanceof Error) {
      return this.filterError(input)
    } else if (Array.isArray(input)) {
      return this.filterArray(input)
    } else if (typeof input === 'object') {
      return this.filterObject(input)
    }

    return null
  }

  filterString(input) {
    try {
      const parsed = JSON.parse(input)
      const filtered = this.recursiveFilter(parsed)
      return JSON.stringify(filtered)
    } catch (error) {
      const parsedUrlParams = parseUrlParams(input)
      let filtered = ''
      parsedUrlParams.forEach((result, index) => {
        if (index % 2 === 0) {
          filtered += result
        } else {
          const { key, value } = result
          if (!this.whitelistRegex.test(key) && this.paramRegex.test(key)) {
            filtered += `${key}=${this.replacement}`
          } else {
            filtered += `${key}=${value}`
          }
        }
      })
      return filtered
    }
  }

  filterError(input) {
    const id = input[this.objectIdKey]
    if (id || id === 0) {
      return this.examinedObjects[id].copy
    }

    const copy = new Error(input.message)
    Object.defineProperties(copy, {
      name: {
        configurable: true,
        enumerable: false,
        value: input.name,
        writable: true
      },
      stack: {
        configurable: true,
        enumerable: false,
        value: input.stack,
        writable: true
      }
    })
    if (input.code) {
      copy.code = input.code
    }

    for (const key in input) { // eslint-disable-line guard-for-in
      copy[key] = input[key]
    }
    this.saveCopy(input, copy)
    this.recursivelyFilterAttributes(copy)
    return copy
  }

  filterObject(input) {
    const id = input[this.objectIdKey]
    if (id || id === 0) {
      return this.examinedObjects[id].copy
    }
    const copy = { ...input }
    this.saveCopy(input, copy)
    this.recursivelyFilterAttributes(copy)
    return copy
  }

  filterArray(input) {
    const id = input[this.objectIdKey]
    if (id || id === 0) {
      return this.examinedObjects[id].copy
    }
    const copy = []
    this.saveCopy(input, copy)
    for (const item of input) {
      copy.push(this.recursiveFilter(item))
    }
    return copy
  }

  saveCopy(original, copy) {
    const id = this.examinedObjects.length
    original[this.objectIdKey] = id
    this.examinedObjects.push({
      copy,
      original
    })
  }

  recursivelyFilterAttributes(copy) {
    for (const key in copy) {
      if (!this.whitelistRegex.test(key) && this.paramRegex.test(key)) {
        copy[key] = this.replacement
      } else {
        copy[key] = this.recursiveFilter(copy[key])
      }
    }
  }

  cleanupIdKeys() {
    for (const examinedObject of this.examinedObjects) {
      Reflect.deleteProperty(examinedObject.original, this.objectIdKey)
    }
  }
}

module.exports = SensitiveParamFilter
