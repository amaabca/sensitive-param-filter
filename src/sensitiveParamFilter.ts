import { DEFAULT_FILTERED_KEYS, DEFAULT_REPLACEMENT } from './defaults'

import {
  circularReferenceKey,
  constructFitleredKeyRegex,
  constructWhitelistRegex,
  parseUrlParams,
} from './helpers'

export type SPFConstructorArgs = {
  filterUnknown?: boolean
  keysToFilter?: string[]
  replacement?: string
  whitelist?: string[]
}

export class SensitiveParamFilter {
  private filteredKeyRegex: RegExp

  private filterUnknown: boolean

  private replacement: string

  private whitelistRegex: {
    test: (text: string) => boolean
  }

  private examinedObjects: Array<{ copy: unknown; original: unknown }>

  constructor(args: SPFConstructorArgs = {}) {
    if (args.filterUnknown === false) {
      this.filterUnknown = false
    } else {
      this.filterUnknown = true
    }
    this.filteredKeyRegex = constructFitleredKeyRegex(args.keysToFilter ?? DEFAULT_FILTERED_KEYS)
    this.replacement = args.replacement ?? DEFAULT_REPLACEMENT
    this.whitelistRegex = constructWhitelistRegex(args.whitelist)
    this.examinedObjects = []
  }

  public filter<T>(inputObject: T): T {
    this.examinedObjects = []
    const output = this.recursiveFilter(inputObject)
    this.cleanupIdKeys()
    return output
  }

  private shouldFilter(text: string) {
    return !this.whitelistRegex.test(text) && this.filteredKeyRegex.test(text)
  }

  private recursiveFilter<T>(input: T): T {
    if (input == null || typeof input === 'number' || typeof input === 'boolean') {
      return input
    }
    // @ts-expect-error temporarily modifying input objects to avoid infinite recursion
    const id: number? = input[circularReferenceKey]
    if (id != null || id === 0) {
      return this.examinedObjects[id].copy as T
    }

    if (typeof input === 'string' || input instanceof String) {
      return this.filterString(input as string) as T
    } else if (input instanceof Error) {
      return this.filterError(input as Error) as T
    } else if (Array.isArray(input)) {
      return this.filterArray(input as unknown[]) as T
    } else if (input instanceof Map) {
      return this.filterMap(input as Map<unknown, unknown>) as T
    } else if (input instanceof Set) {
      return this.filterSet(input as Set<unknown>) as T
    } else if (typeof input === 'object') {
      return this.filterObject(input) as T
    }

    if (this.filterUnknown) {
      return this.replacement as T
    }
    return input
  }

  private filterString(input: string) {
    try {
      const parsed = JSON.parse(input)
      if (typeof parsed === 'number') {
        return input
      }
      const filtered = this.recursiveFilter(parsed)
      return JSON.stringify(filtered)
    } catch (error) {
      const parsedUrlParams = parseUrlParams(input)

      const filtered = parsedUrlParams.map(({ key, value }) => {
        if (key == null) {
          if (this.shouldFilter(value)) {
            return this.replacement
          }

          return value
        }

        if (this.shouldFilter(key)) {
          return `${key}=${this.replacement}`
        }

        return `${key}=${value}`
      })

      return filtered.join('')
    }
  }

  private filterError(input: Error) {
    const copy = new Error(input.message)
    Object.defineProperties(copy, {
      name: {
        configurable: true,
        enumerable: false,
        value: input.name,
        writable: true,
      },
      stack: {
        configurable: true,
        enumerable: false,
        value: input.stack,
        writable: true,
      },
    })
    // @ts-expect-error we handle specific errors that have codes
    if (input.code != null) {
      // @ts-expect-error we handle specific errors that have codes
      copy.code = input.code
    }

    // eslint-disable-next-line guard-for-in
    for (const key in input) {
      // @ts-expect-error we're literally iterating through attributes, these will exist
      copy[key] = input[key]
    }
    this.saveCopy(input, copy)
    this.recursivelyFilterAttributes(copy)
    return copy
  }

  private filterObject(input: object) {
    const copy = { ...input }
    this.saveCopy(input, copy)
    this.recursivelyFilterAttributes(copy)
    return copy
  }

  private filterArray(input: unknown[]) {
    const copy: unknown[] = []
    this.saveCopy(input, copy)
    for (const item of input) {
      copy.push(this.recursiveFilter(item))
    }
    return copy
  }

  private filterMap(input: Map<unknown, unknown>) {
    const copy = new Map()
    const iterator = input.entries()
    let result = iterator.next()
    while (result.done != null && !result.done) {
      const [key, value] = result.value
      if (typeof key === 'string' || key instanceof String) {
        if (this.shouldFilter(key as string)) {
          copy.set(key, this.replacement)
        } else {
          copy.set(key, this.recursiveFilter(value))
        }
      } else {
        copy.set(this.recursiveFilter(key), this.recursiveFilter(value))
      }
      result = iterator.next()
    }
    this.saveCopy(input, copy)
    return copy
  }

  private filterSet(input: Set<unknown>) {
    const copy = new Set()
    const iterator = input.values()
    let result = iterator.next()
    while (result.done != null && !result.done) {
      copy.add(this.recursiveFilter(result.value))
      result = iterator.next()
    }
    this.saveCopy(input, copy)
    return copy
  }

  private saveCopy(original: unknown, copy: unknown) {
    const id = this.examinedObjects.length
    // @ts-expect-error temporarily modifying input objects to avoid infinite recursion
    original[circularReferenceKey] = id
    this.examinedObjects.push({
      copy,
      original,
    })
  }

  private recursivelyFilterAttributes(copy: object) {
    for (const key in copy) {
      if (this.shouldFilter(key)) {
        // @ts-expect-error we're literally iterating through attributes, these will exist
        copy[key] = this.replacement
      } else {
        // @ts-expect-error we're literally iterating through attributes, these will exist
        copy[key] = this.recursiveFilter(copy[key])
      }
    }
  }

  private cleanupIdKeys() {
    for (const examinedObject of this.examinedObjects) {
      // @ts-expect-error temporarily modifying input objects to avoid infinite recursion
      Reflect.deleteProperty(examinedObject.original, circularReferenceKey)
    }
  }
}
