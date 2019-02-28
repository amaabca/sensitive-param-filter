const { SensitiveParamFilter } = require('../src')

describe('SensitiveParamFilter', () => {
  describe('#constructor()', () => {
    const input = {
      auth: 'auth',
      data: 'data',
      moredata: 'moredata',
      pass: 'pass'
    }

    it('uses default values when no arguments are given', () => {
      const paramFilter = new SensitiveParamFilter()
      const output = paramFilter.filter(input)
      expect(output.auth).toBe('FILTERED')
      expect(output.data).toBe('data')
      expect(output.moredata).toBe('moredata')
      expect(output.pass).toBe('FILTERED')
    })

    it('uses arguments when they are provided', () => {
      const paramFilter = new SensitiveParamFilter(['data'], '***', ['moredata'])
      const output = paramFilter.filter(input)
      expect(output.auth).toBe('auth')
      expect(output.data).toBe('***')
      expect(output.moredata).toBe('moredata')
      expect(output.pass).toBe('pass')
    })

    it('throws an error when no params are provided', () => {
      expect(() => new SensitiveParamFilter([])).toThrow()
    })
  })

  describe('filter()', () => {
    const paramList = ['password', 'auth', 'PrIvAtE']
    const replacement = 'FILTERED'
    const paramFilter = new SensitiveParamFilter(paramList, replacement)

    describe('filtering a plain JS object', () => {
      const input = {
        Authorization: 'Bearer somedatatoken',
        body: {
          'Private-Data': 'somesecretstuff',
          info: '{ "first_name": "Bob", "last_name": "Bobbington", "PASSWORD": "asecurepassword1234", "amount": 4 }'
        },
        method: 'POST',
        numRetries: 6,
        password: 'asecurepassword1234',
        username: 'bob.bobbington'
      }
      input.body.parent = input

      const numInputKeys = Object.keys(input).length
      const numBodyKeys = Object.keys(input.body).length

      const output = paramFilter.filter(input)

      it('does not modify the original object', () => {
        expect(Object.keys(input).length).toBe(numInputKeys)
        expect(Object.keys(input.body).length).toBe(numBodyKeys)

        expect(input.password).toBe('asecurepassword1234')
        expect(input.username).toBe('bob.bobbington')
        expect(input.Authorization).toBe('Bearer somedatatoken')
        expect(input.method).toBe('POST')
        expect(input.body['Private-Data']).toBe('somesecretstuff')
        expect(input.body.info).toBe('{ "first_name": "Bob", "last_name": "Bobbington", "PASSWORD": "asecurepassword1234", "amount": 4 }') // eslint-disable-line max-len
        expect(input.body.parent).toBe(input)
        expect(input.numRetries).toBe(6)
      })

      it('maintains non-sensitive data in the output object, including circular references', () => {
        expect(Object.keys(output).length).toBe(numInputKeys)
        expect(Object.keys(output.body).length).toBe(numBodyKeys)

        expect(output.username).toBe('bob.bobbington')
        expect(output.method).toBe('POST')
        expect(output.body.parent).toBe(output)
        expect(output.numRetries).toBe(6)
      })

      it('filters out object keys in a case-insensitive, partial-matching manner', () => {
        expect(output.password).toBe('FILTERED')
        expect(output.Authorization).toBe('FILTERED')
        expect(output.body['Private-Data']).toBe('FILTERED')
      })

      it('filters out JSON keys (case-insensitive) and matches partials while maintaining non-sensitive data', () => {
        const outputInfoObject = JSON.parse(output.body.info)
        expect(Object.keys(outputInfoObject).length).toBe(4)

        expect(outputInfoObject.PASSWORD).toBe('FILTERED')
        expect(outputInfoObject.first_name).toBe('Bob')
        expect(outputInfoObject.last_name).toBe('Bobbington')
        expect(outputInfoObject.amount).toBe(4)
      })
    })

    describe('filtering a JSON parse error', () => {
      let input = null
      try {
        JSON.parse('This is not a JSON string.  Do not parse it.')
      } catch (error) {
        input = error
      }
      input.Authorization = 'Username: Bob, Password: pa$$word'
      input.customData = {
        error: input,
        info: '{ "json": false, "veryPrivateInfo": "credentials" }'
      }

      const inputMessage = input.message
      const inputStack = input.stack
      const inputCode = input.code

      const numInputKeys = Object.keys(input).length
      const numCustomDataKeys = Object.keys(input.customData).length
      const inputType = typeof input
      const inputConstructor = input.constructor

      const output = paramFilter.filter(input)

      it('does not modify the original error', () => {
        expect(Object.keys(input).length).toBe(numInputKeys)
        expect(Object.keys(input.customData).length).toBe(numCustomDataKeys)
        expect(typeof input).toBe(inputType)
        expect(input.constructor).toBe(inputConstructor)

        expect(input.message).toBe(inputMessage)
        expect(input.stack).toBe(inputStack)
        expect(input.code).toBe(inputCode)

        expect(input.Authorization).toBe('Username: Bob, Password: pa$$word')
        expect(input.customData.info).toBe('{ "json": false, "veryPrivateInfo": "credentials" }')
        expect(input.customData.error).toBe(input)
      })

      it('maintains non-sensitive data and error type in the output, including circular references', () => {
        expect(Object.keys(output).length).toBe(numInputKeys)
        expect(typeof output).toBe(inputType)
        expect(output.constructor).toBe(inputConstructor)

        expect(output.message).toBe(inputMessage)
        expect(output.stack).toBe(inputStack)
        expect(output.code).toBe(inputCode)

        expect(output.customData.error).toBe(output)
      })

      it('filters out error keys in a case-insensitive, partial-matching manner', () => {
        expect(output.Authorization).toBe('FILTERED')
      })

      it('filters out JSON keys (case-insensitive) and matches partials while maintaining non-sensitive data', () => {
        const outputInfoObject = JSON.parse(output.customData.info)
        expect(Object.keys(outputInfoObject).length).toBe(2)

        expect(outputInfoObject.veryPrivateInfo).toBe('FILTERED')
        expect(outputInfoObject.json).toBe(false)
      })
    })

    describe('filtering a custom error with a non-standard constructor', () => {
      class VeryUnusualError extends Error {
        constructor (...args) {
          super(...args)
          this.weirdAttribute = args[1].name
          this.code = 'VERY_UNUSUAL_ERROR'
        }
      }

      let input = null
      try {
        throw new VeryUnusualError(
          'Something went wrong',
          { name: 'Unexpected' }
        )
      } catch (error) {
        input = error
      }
      input.password = 'hunter12'

      const inputMessage = input.message
      const inputStack = input.stack
      const inputCode = input.code

      const numInputKeys = Object.keys(input).length
      const inputType = typeof input
      const inputConstructor = input.constructor

      const output = paramFilter.filter(input)

      it('does not modify the original error', () => {
        expect(Object.keys(input).length).toBe(numInputKeys)
        expect(typeof input).toBe(inputType)
        expect(input.constructor).toBe(inputConstructor)

        expect(input.message).toBe(inputMessage)
        expect(input.stack).toBe(inputStack)
        expect(input.code).toBe(inputCode)

        expect(input.weirdAttribute).toBe('Unexpected')
        expect(input.password).toBe('hunter12')
      })

      it('maintains non-sensitive data in the output error, but cannot maintain the exact error type', () => {
        expect(Object.keys(output).length).toBe(numInputKeys)
        expect(typeof output).toBe(inputType)
        expect(output.constructor).not.toBe(inputConstructor)

        expect(output.message).toBe(inputMessage)
        expect(output.stack).toBe(inputStack)
        expect(output.code).toBe(inputCode)

        expect(output.weirdAttribute).toBe('Unexpected')
      })

      it('filters out JSON keys (case-insensitive) and matches partials', () => {
        expect(output.password).toBe('FILTERED')
      })
    })
  })
})
