import {
  DEFAULT_PARAMS,
  DEFAULT_REPLACEMENT
} from './defaults'

import {
  constructParamRegex,
  constructWhitelistRegex,
  generateRandomString,
  parseUrlParams
} from './helpers'

import { ExaminedObjects, SpfInterface, WhiteListRegex } from './interfaces'

class SpfError extends Error {
  code: string
}

class SensitiveParamFilter {
  examinedObjects: ExaminedObjects[]

  objectIdKey: string

  paramRegex: RegExp

  replacement: string

  whitelistRegex: RegExp | WhiteListRegex

  constructor(args = {} as SpfInterface) {
    this.paramRegex = constructParamRegex(args.params || DEFAULT_PARAMS)
    this.replacement = args.replacement || DEFAULT_REPLACEMENT
    this.whitelistRegex = constructWhitelistRegex(args.whitelist)
    this.objectIdKey = generateRandomString()
    this.examinedObjects = null
  }

  filter(inputObject): any {
    this.examinedObjects = []
    const output = this.recursiveFilter(inputObject)
    this.cleanupIdKeys()
    return output
  }

  recursiveFilter(input: any): any {
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

  filterString(input: string): string {
    try {
      const parsed = JSON.parse(input)
      const filtered = this.recursiveFilter(parsed)
      return JSON.stringify(filtered)
    } catch (error) {
      const parsedUrlParams = parseUrlParams(input)
      let filtered = ''
      parsedUrlParams.forEach((result) => {
        const { key, value } = result
        if (!key) {
          filtered += value
        } else if (!this.whitelistRegex.test(key) && this.paramRegex.test(key)) {
          filtered += `${key}=${this.replacement}`
        } else {
          filtered += `${key}=${value}`
        }
      })
      return filtered
    }
  }

  filterError(input: Error): SpfError {
    const id = input[this.objectIdKey]
    if (id || id === 0) {
      return this.examinedObjects[id].copy
    }

    const copy = new SpfError(input.message)
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

  filterObject(input: object): object {
    const id = input[this.objectIdKey]
    if (id || id === 0) {
      return this.examinedObjects[id].copy
    }
    const copy = { ...input }
    this.saveCopy(input, copy)
    this.recursivelyFilterAttributes(copy)
    return copy
  }

  filterArray(input: Array<any>): Array<any> {
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

  saveCopy(original: string, copy: string): void {
    const id = this.examinedObjects.length
    original[this.objectIdKey] = id
    this.examinedObjects.push({
      copy,
      original
    })
  }

  recursivelyFilterAttributes(copy: object): void {
    for (const key in copy) {
      if (!this.whitelistRegex.test(key) && this.paramRegex.test(key)) {
        copy[key] = this.replacement
      } else {
        copy[key] = this.recursiveFilter(copy[key])
      }
    }
  }

  cleanupIdKeys(): void {
    for (const examinedObject of this.examinedObjects) {
      Reflect.deleteProperty(examinedObject.original, this.objectIdKey)
    }
  }
}

export default SensitiveParamFilter
