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
    const paramList = ['password', 'auth', 'PrIvAtE', 'credit_card']
    const replacement = 'FILTERED'
    const paramFilter = new SensitiveParamFilter(paramList, replacement)

    describe('filtering a plain JS object', () => {
      const input = {
        Authorization: 'Bearer somedatatoken',
        body: {
          'Private-Data': 'somesecretstuff',
          info: '{ "first_name": "Bob", "last_name": "Bobbington", "PASSWORD": "asecurepassword1234", "amount": 4 }'
        },
        dump: 'This string is not JSON-parseable, and my password is "h54(@jfd54#@".',
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
        expect(input.dump).toBe('This string is not JSON-parseable, and my password is "h54(@jfd54#@".')
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

      it('filters out non-JSON strings if they contain sensitive keys', () => {
        expect(output.dump).toBe('FILTERED')
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

    describe('filtering nested arrays', () => {
      const input = [
        { Authorization: 'Bearer somedatatoken', method: 'GET', url: 'https://some.url.org' },
        12345,
        [
          { password: 'qwery123456', username: 'alice.smith' },
          'Hello World'
        ],
        '{ "amount": 9.75, "credit_card_number": "4551201891449281" }'
      ]
      input[2].push(input)

      const inputLength = input.length
      const inputIndex2Length = input[2].length

      const output = paramFilter.filter(input)

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
  })
})
