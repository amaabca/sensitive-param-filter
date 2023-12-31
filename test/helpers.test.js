/* eslint-disable max-len */

const { constructParamRegex, constructWhitelistRegex, parseUrlParams } = require('../src/helpers')

describe('helpers', () => {
  describe('constructParamRegex()', () => {
    it('constructs a case-insensitive regex when provided with a param array', () => {
      const regex = constructParamRegex(['AUTH', 'bearer', 'Password', 'Token'])

      expect(regex.test('auth')).toBeTruthy()
      expect(regex.test('BEARER')).toBeTruthy()
      expect(regex.test('password')).toBeTruthy()
      expect(regex.test('tOkEn')).toBeTruthy()

      expect(regex.test('Hello World')).toBeFalsy()
      expect(regex.test('Some data string')).toBeFalsy()
    })

    it('throws an error when provided with invalid params', () => {
      expect(() => constructParamRegex()).toThrow()
      expect(() => constructParamRegex([])).toThrow()
      expect(() => constructParamRegex('Testing, testing, 1, 2, 3')).toThrow()
    })
  })

  describe('constructWhitelistRegex()', () => {
    it('constructs a exact-matching regex when provided with a whitelist array', () => {
      const regex = constructWhitelistRegex(['Authorization', 'public-data-token'])

      expect(regex.test('Authorization')).toBeTruthy()
      expect(regex.test('public-data-token')).toBeTruthy()

      expect(regex.test('Auth')).toBeFalsy()
      expect(regex.test('AuthorizationToken')).toBeFalsy()
      expect(regex.test('token')).toBeFalsy()
      expect(regex.test('another-public-data-token')).toBeFalsy()
    })

    it('constructs an object that fails all regex tests when not passed a whitelist', () => {
      const regex = constructWhitelistRegex()

      expect(regex.test('Safe string')).toBeFalsy()
      expect(regex.test('')).toBeFalsy()
      expect(regex.test(3)).toBeFalsy()
      expect(regex.test()).toBeFalsy()
    })
  })

  describe('parseUrlParams()', () => {
    it('parses urls embedded in strings', () => {
      const parsedUrlParams = parseUrlParams(
        'Product link: www.spfshoppingcartsite.com?product_id=432543538&color=yellow&size=small',
      )
      expect(parsedUrlParams).toHaveLength(6)

      expect(parsedUrlParams[0]).toMatchObject({
        key: null,
        value: 'Product link: www.spfshoppingcartsite.com?',
      })
      expect(parsedUrlParams[1]).toMatchObject({ key: 'product_id', value: '432543538' })
      expect(parsedUrlParams[2]).toMatchObject({ key: null, value: '&' })
      expect(parsedUrlParams[3]).toMatchObject({ key: 'color', value: 'yellow' })
      expect(parsedUrlParams[4]).toMatchObject({ key: null, value: '&' })
      expect(parsedUrlParams[5]).toMatchObject({ key: 'size', value: 'small' })
    })

    it('partially parses malformed urls', () => {
      const parsedUrlParams = parseUrlParams(
        'www.example.com?#/blarg/key/name=bob&/smith/password?&qwerty',
      )
      expect(parsedUrlParams).toHaveLength(3)

      expect(parsedUrlParams[0]).toEqual({ key: null, value: 'www.example.com?#/blarg/key/' })
      expect(parsedUrlParams[1]).toMatchObject({ key: 'name', value: 'bob' })
      expect(parsedUrlParams[2]).toEqual({ key: null, value: '&/smith/password?&qwerty' })
    })
  })
})
