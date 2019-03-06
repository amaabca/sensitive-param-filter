const {
  DEFAULT_PARAMS,
  DEFAULT_REPLACEMENT
} = require('./defaults')

const {
  constructParamRegex,
  constructWhitelistRegex,
  generateRandomString
} = require('./helpers')

class SensitiveParamFilter {
  constructor(...args) {
    this.paramRegex = constructParamRegex(args[0] || DEFAULT_PARAMS)
    this.replacement = args[1] || DEFAULT_REPLACEMENT
    this.whitelistRegex = constructWhitelistRegex(args[2])
    this.objectIdKey = generateRandomString(32)
    this.examinedObjects = null
  }

  filter(inputObject) {
    this.examinedObjects = []
    const output = this.recursiveFilter(inputObject)
    this.cleanupIdKeys()
    return output
  }

  recursiveFilter(input) {
    if (typeof input === 'string' || input instanceof String) {
      return this.filterString(input)
    } else if (input instanceof Error) {
      return this.filterError(input)
    } else if (input && typeof input === 'object' && input.constructor === Object) {
      return this.filterObject(input)
    }
    return input
  }

  filterString(input) {
    try {
      const parsed = JSON.parse(input)
      const filtered = this.recursiveFilter(parsed)
      return JSON.stringify(filtered, null, 1)
    } catch (error) {
      return input
    }
  }

  filterError(input) {
    const id = input[this.objectIdKey]
    if (id || id === 0) {
      return this.examinedObjects[id].copy
    }
    let copy = null
    try {
      copy = new input.constructor(input.message)
    } catch (error) {
      copy = new Error(input.message)
    }
    copy.stack = input.stack
    if (input.code) {
      copy.code = input.code
    }
    for (const key in input) { // eslint-disable-line guard-for-in
      copy[key] = input[key]
    }
    this.saveCopyAndRecursivelyFilter(input, copy)
    return copy
  }

  filterObject(input) {
    const id = input[this.objectIdKey]
    if (id || id === 0) {
      return this.examinedObjects[id].copy
    }
    const copy = { ...input }
    this.saveCopyAndRecursivelyFilter(input, copy)
    return copy
  }

  saveCopyAndRecursivelyFilter(original, copy) {
    const id = this.examinedObjects.length
    original[this.objectIdKey] = id
    this.examinedObjects.push({
      copy,
      original
    })
    for (const key in copy) {
      if (this.whitelistRegex.test(key)) {
        copy[key] = this.recursiveFilter(copy[key])
      } else if (this.paramRegex.test(key)) {
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
