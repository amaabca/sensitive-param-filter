/* eslint-disable max-len, max-lines, no-empty-function, @typescript-eslint/no-empty-function */

import {
  CustomError,
  PlainJsObject,
  VeryUnusualClass,
  keysToFilter,
  plainJsInputObject,
  whitelist,
} from './sensitiveParamFilter.fixture'
import { SensitiveParamFilter } from '../src/'

describe('SensitiveParamFilter', () => {
  describe('#constructor()', () => {
    const input = {
      auth: 'auth',
      data: 'data',
      moredata: 'moredata',
      pass: 'pass',
      someFunction: () => {},
    }

    it('uses default values when no arguments are given', () => {
      const paramFilter = new SensitiveParamFilter()
      const output = paramFilter.filter(input)

      expect(output.auth).toBe('FILTERED')
      expect(output.data).toBe('data')
      expect(output.moredata).toBe('moredata')
      expect(output.pass).toBe('FILTERED')
      expect(output.someFunction).toBe('FILTERED')
    })

    it('uses arguments when they are provided', () => {
      const paramFilter = new SensitiveParamFilter({
        filterUnknown: false,
        keysToFilter: ['data'],
        replacement: '***',
        whitelist: ['moredata'],
      })
      const output = paramFilter.filter(input)

      expect(output.auth).toBe('auth')
      expect(output.data).toBe('***')
      expect(output.moredata).toBe('moredata')
      expect(output.pass).toBe('pass')
      expect(output.someFunction).toBe(input.someFunction)
    })
  })

  describe('filter()', () => {
    const paramFilter = new SensitiveParamFilter({ keysToFilter, whitelist })

    describe('filtering a plain JS object', () => {
      const input = plainJsInputObject

      const numInputKeys = Object.keys(input).length
      const numBodyKeys = Object.keys(input.body).length

      let output: PlainJsObject = input
      beforeEach(() => {
        output = paramFilter.filter(input)
      })

      it('does not modify the original object', () => {
        expect(Object.keys(input).length).toBe(numInputKeys)
        expect(Object.keys(input.body).length).toBe(numBodyKeys)

        expect(input.password).toBe('asecurepassword1234')
        expect(input.username).toBe('bob.bobbington')
        expect(input.Authorization).toBe('Bearer somedatatoken')
        expect(input.method).toBe('POST')
        expect(input.body['Private-Data']).toBe('somesecretstuff')
        expect(input.body.info).toBe(
          '{ "first_name": "Bob", "last_name": "Bobbington", "PASSWORD": "asecurepassword1234", "amount": 4 }',
        )
        expect(input.body.notes).toBe(
          'Use https://login.example.com?username=jon.smith&password=qwerty/?authentic=true to login.',
        )
        expect(input.body.parent).toBe(input)
        expect(input.numRetries).toBe(6)
        expect(input.stageVariables).toBe(null)
      })

      it('maintains non-sensitive data in the output object, including circular references', () => {
        expect(Object.keys(output).length).toBe(numInputKeys)
        expect(Object.keys(output.body).length).toBe(numBodyKeys)

        expect(output.username).toBe('bob.bobbington')
        expect(output.method).toBe('POST')
        expect(output.body.parent).toBe(output)
        expect(output.numRetries).toBe(6)
        expect(output.stageVariables).toBe(null)
      })

      it('filters out object keys in a case-insensitive, partial-matching manner', () => {
        expect(output.password).toBe('FILTERED')
        expect(output.Authorization).toBe('FILTERED')
        expect(output.body['Private-Data']).toBe('FILTERED')
        expect(output._header).toBe('FILTERED')
      })

      it('filters out JSON keys (case-insensitive) and matches partials while maintaining non-sensitive data', () => {
        const outputInfoObject = JSON.parse(output.body.info)
        expect(Object.keys(outputInfoObject).length).toBe(4)

        expect(outputInfoObject.PASSWORD).toBe('FILTERED')
        expect(outputInfoObject.first_name).toBe('Bob')
        expect(outputInfoObject.last_name).toBe('Bobbington')
        expect(outputInfoObject.amount).toBe(4)
      })

      it('filters out url params in query strings while maintaining non-sensitive data', () => {
        expect(output.body.notes).toBe(
          'Use https://login.example.com?username=jon.smith&password=FILTERED/?authentic=true to login.',
        )
      })
    })

    describe('filtering a custom object with read-only and non-enumerable properties', () => {
      const input = {
        message: 'hello',
        veryUnusualObject: new VeryUnusualClass(),
      }

      const numInputKeys = Object.keys(input).length
      const numveryUnusualObjectKeys = Object.keys(input.veryUnusualObject).length
      const veryUnusualObjectType = typeof input.veryUnusualObject
      const veryUnusualObjectConstructor = input.veryUnusualObject.constructor

      let output: typeof input = input
      beforeEach(() => {
        output = paramFilter.filter(input)
      })

      it('does not modify the original object', () => {
        expect(Object.keys(input).length).toBe(numInputKeys)
        expect(Object.keys(input.veryUnusualObject).length).toBe(numveryUnusualObjectKeys)
        expect(typeof input.veryUnusualObject).toBe(veryUnusualObjectType)
        expect(input.veryUnusualObject.constructor).toBe(veryUnusualObjectConstructor)

        expect(input.message).toBe('hello')
        expect(input.veryUnusualObject.password).toBe('hunter12')
        expect(input.veryUnusualObject.readonly).toBe(42)
        expect(input.veryUnusualObject.hidden).toBe('You cannot see me')
        expect(input.veryUnusualObject.doSomething()).toBe('42 You cannot see me')
      })

      it('maintains non-sensitive, enumerable data in the output object', () => {
        expect(Object.keys(output).length).toBe(numInputKeys)
        expect(Object.keys(output.veryUnusualObject).length).toBe(numveryUnusualObjectKeys)

        expect(output.message).toBe('hello')
        expect(input.veryUnusualObject.readonly).toBe(42)
      })

      it('filters out object keys in a case-insensitive, partial-matching manner', () => {
        expect(output.veryUnusualObject.password).toBe('FILTERED')
      })

      it('does not maintain hidden properties, methods, or type information from the original object', () => {
        expect(output.veryUnusualObject.hidden).toBeUndefined()
        expect(output.veryUnusualObject.doSomething).toBeUndefined()
        expect(output.veryUnusualObject.constructor).not.toBe(veryUnusualObjectConstructor)
      })
    })

    // describe('filtering errors with a code', () => {
    //   const input = new Error('Something broke')
    //   input.code = 'ERR_BROKEN'

    //   let output = null
    //   beforeEach(() => {
    //     output = paramFilter.filter(input)
    //   })

    //   it('maintains the error code and type', () => {
    //     expect(output).toBeInstanceOf(Error)
    //     expect(output.code).toBe(input.code)
    //   })

    //   it('preprends error type to the message', () => {
    //     expect(output.message).toBe(input.message)
    //   })
    // })

    describe('filtering a custom error with non-standard fields', () => {
      const inputMessage = 'Super broken'
      const inputPassword = 'hunter12'
      const inputReadonly = 42
      const inputHidden = 'You cannot see me'

      const input = new CustomError(inputMessage, inputPassword, inputReadonly, inputHidden)
      const inputKeyCount = Object.keys(input).length
      const inputType = typeof input
      const inputConstructor = input.constructor

      let output = new CustomError('', '', 0, '')
      beforeEach(() => {
        output = paramFilter.filter(input)
      })

      it('does not modify the original error', () => {
        expect(Object.keys(input).length).toBe(inputKeyCount)
        expect(typeof input).toBe(inputType)
        expect(input.constructor).toBe(inputConstructor)

        expect(input.message).toBe(inputMessage)
        expect(input.password).toBe(inputPassword)
        expect(input.readonly).toBe(inputReadonly)
        expect(input.hidden).toBe(inputHidden)
      })

      it('preprends error type to the message', () => {
        expect(output.message).toBe(inputMessage)
      })

      it('maintains non-sensitive, enumerable data in the output error', () => {
        expect(output.readonly).toBe(inputReadonly)
      })

      it('does not maintain sensitive data in the output error', () => {
        expect(output.password).toBe('FILTERED')
      })

      it('maintains name and stack values', () => {
        expect(output.name).toBe('CustomError')
        expect(output.stack).toBe(input.stack)
      })

      it('converts to a plain Error', () => {
        expect(output.constructor).toBe(Error)
      })

      it('does not maintain hidden properties from the original error', () => {
        expect(output.hidden).toBeUndefined()
      })
    })

    // describe('filtering a JSON parse error', () => {
    //   let input = null
    //   try {
    //     JSON.parse('This is not a JSON string.  Do not parse it.')
    //   } catch (error) {
    //     input = error
    //   }
    //   input.Authorization = 'Username: Bob, Password: pa$$word'
    //   input.customData = {
    //     error: input,
    //     info: '{ "json": false, "veryPrivateInfo": "credentials" }',
    //   }

    //   const inputMessage = input.message
    //   const inputStack = input.stack
    //   const inputCode = input.code

    //   const numInputKeys = Object.keys(input).length
    //   const numCustomDataKeys = Object.keys(input.customData).length
    //   const inputType = typeof input
    //   const inputConstructor = input.constructor

    //   let output = null
    //   beforeEach(() => {
    //     output = paramFilter.filter(input)
    //   })

    //   it('does not modify the original error', () => {
    //     expect(Object.keys(input).length).toBe(numInputKeys)
    //     expect(Object.keys(input.customData).length).toBe(numCustomDataKeys)
    //     expect(typeof input).toBe(inputType)
    //     expect(input.constructor).toBe(inputConstructor)

    //     expect(input.message).toBe(inputMessage)
    //     expect(input.stack).toBe(inputStack)
    //     expect(input.code).toBe(inputCode)

    //     expect(input.Authorization).toBe('Username: Bob, Password: pa$$word')
    //     expect(input.customData.info).toBe('{ "json": false, "veryPrivateInfo": "credentials" }')
    //     expect(input.customData.error).toBe(input)
    //   })

    //   it('converts to a plain Error', () => {
    //     expect(output.constructor).toBe(Error)
    //   })

    //   it('maintains non-sensitive data in the output, including circular references', () => {
    //     expect(Object.keys(output).length).toBe(numInputKeys)
    //     expect(typeof output).toBe(inputType)

    //     expect(output.stack).toBe(inputStack)
    //     expect(output.code).toBe(inputCode)

    //     expect(output.customData.error).toBe(output)
    //   })

    //   it('filters out error keys in a case-insensitive, partial-matching manner', () => {
    //     expect(output.Authorization).toBe('FILTERED')
    //   })

    //   it('filters out JSON keys (case-insensitive) and matches partials while maintaining non-sensitive data', () => {
    //     const outputInfoObject = JSON.parse(output.customData.info)
    //     expect(Object.keys(outputInfoObject).length).toBe(2)

    //     expect(outputInfoObject.veryPrivateInfo).toBe('FILTERED')
    //     expect(outputInfoObject.json).toBe(false)
    //   })
    // })

    describe('filtering nested arrays', () => {
      const input = [
        { Authorization: 'Bearer somedatatoken', method: 'GET', url: 'https://some.url.org' },
        12345,
        [{ password: 'qwery123456', username: 'alice.smith' }, 'Hello World'],
        '{ "amount": 9.75, "credit_card_number": "4551201891449281" }',
      ]
      input[2].push(input)

      const inputLength = input.length
      const inputIndex2Length = input[2].length

      let output = null
      beforeEach(() => {
        output = paramFilter.filter(input)
      })

      it('does not modify the original object', () => {
        expect(input.length).toBe(inputLength)
        expect(input[2].length).toBe(inputIndex2Length)

        expect(input[0].Authorization).toBe('Bearer somedatatoken')
        expect(input[0].method).toBe('GET')
        expect(input[0].url).toBe('https://some.url.org')
        expect(input[1]).toBe(12345)
        expect(input[2][0].password).toBe('qwery123456')
        expect(input[2][0].username).toBe('alice.smith')
        expect(input[2][1]).toBe('Hello World')
        expect(input[2][2]).toBe(input)
        expect(input[3]).toBe('{ "amount": 9.75, "credit_card_number": "4551201891449281" }')
      })

      it('maintains non-sensitive data in the output object, including circular references', () => {
        expect(output.length).toBe(inputLength)
        expect(output[2].length).toBe(inputIndex2Length)

        expect(output[0].method).toBe('GET')
        expect(output[0].url).toBe('https://some.url.org')
        expect(output[1]).toBe(12345)
        expect(output[2][0].username).toBe('alice.smith')
        expect(output[2][1]).toBe('Hello World')
        expect(output[2][2]).toBe(output)
      })

      it('filters out object keys in a case-insensitive, partial-matching manner', () => {
        expect(output[0].Authorization).toBe('FILTERED')
        expect(output[2][0].password).toBe('FILTERED')
      })

      it('filters out JSON keys and matches partials while maintaining non-sensitive data', () => {
        const outputIndex3Object = JSON.parse(output[3])
        expect(Object.keys(outputIndex3Object).length).toBe(2)

        expect(outputIndex3Object.amount).toBe(9.75)
        expect(outputIndex3Object.credit_card_number).toBe('FILTERED')
      })
    })

    // describe('filtering Maps and Sets', () => {
    //   const complexKey = { privateStuff: 'aKeyThing', public: 'anotherKeyThing' }
    //   const complexValue = { privateStuff: 'aValueThing', public: complexKey }
    //   const input = {
    //     map: new Map([
    //       ['someNumber', 1234567],
    //       ['password', 'aSecurePassword'],
    //       [complexKey, complexValue],
    //     ]),
    //     set: new Set(['apple', 'banana', complexKey]),
    //   }

    //   let output = null
    //   beforeEach(() => {
    //     output = paramFilter.filter(input)
    //   })

    //   it('does not modify the original object', () => {
    //     expect(input.map.get('someNumber')).toBe(1234567)
    //     expect(input.map.get('password')).toBe('aSecurePassword')
    //     expect(input.map.get(complexKey)).toBe(complexValue)

    //     expect(input.set).toContain('apple')
    //     expect(input.set).toContain('banana')
    //     expect(input.set).toContain(complexKey)
    //   })

    //   it('maintains non-sensitive data in the output object', () => {
    //     expect(output.map.get('someNumber')).toBe(1234567)

    //     expect(output.set).toContain('apple')
    //     expect(output.set).toContain('banana')
    //   })

    //   it('filters out object keys in a case-insensitive, partial-matching manner', () => {
    //     const filteredComplexKey = { privateStuff: 'FILTERED', public: 'anotherKeyThing' }
    //     const filteredComplexValue = { privateStuff: 'FILTERED', public: filteredComplexKey }

    //     expect(output.map.get('password')).toBe('FILTERED')
    //     expect(output.map.get(complexKey)).toBeUndefined()
    //     expect(Array.from(output.map)).toContainEqual([filteredComplexKey, filteredComplexValue])

    //     expect(output.set).not.toContain(complexKey)
    //     expect(output.set).toContainEqual({ privateStuff: 'FILTERED', public: 'anotherKeyThing' })
    //   })
    // })

    // describe('filtering large integers in strings', () => {
    //   it('returns the same value without rounding it', () => {
    //     const bigInt = '987654321987654321'
    //     const output = paramFilter.filter(bigInt)
    //     expect(output).toEqual(bigInt)
    //   })
    // })
  })
})
