export const keysToFilter = ['password', 'auth', 'PrIvAtE', 'credit_card']
export const whitelist = ['authentic']

// -- filtering a plain JS object --

type PlainJsObject = {
  Authorization: string
  _header: string
  body: {
    'Private-Data': string
    info: string
    notes: string
    parent?: PlainJsObject
  }
  method: string
  numRetries: number
  password: string
  stageVariables: null
  username: string
}

export const plainJsInputObject: PlainJsObject = {
  Authorization: 'Bearer somedatatoken',
  _header: 'GET /some/items\\nAuthorization: Bearer someheadertoken',
  body: {
    'Private-Data': 'somesecretstuff',
    info: '{ "first_name": "Bob", "last_name": "Bobbington", "PASSWORD": "asecurepassword1234", "amount": 4 }',
    notes:
      'Use https://login.example.com?username=jon.smith&password=qwerty/?authentic=true to login.',
  },
  method: 'POST',
  numRetries: 6,
  password: 'asecurepassword1234',
  stageVariables: null,
  username: 'bob.bobbington',
}
plainJsInputObject.body.parent = plainJsInputObject

// -- filtering a custom object with read-only and non-enumerable properties --

export class VeryUnusualClass {
  public password: string

  // @ts-expect-error created in constructor with Reflect.defineProperty()
  public readonly: string

  // @ts-expect-error created in constructor with Reflect.defineProperty()
  public hidden: string

  constructor() {
    this.password = 'hunter12'
    Reflect.defineProperty(this, 'readonly', {
      enumerable: true,
      value: 42,
      writable: false,
    })
    Reflect.defineProperty(this, 'hidden', {
      enumerable: false,
      value: 'You cannot see me',
      writable: true,
    })
  }

  doSomething() {
    return `${this.readonly} ${this.hidden}`
  }
}

// -- filtering errors with a code --

export class ErrorWithCode extends Error {
  public code: string

  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

// -- filtering a custom error with non-standard fields --

export class CustomError extends Error {
  public password: string

  // @ts-expect-error created in constructor with Reflect.defineProperty()
  public readonly: number

  // @ts-expect-error created in constructor with Reflect.defineProperty()
  public hidden: string

  constructor(message: string, password: string, readonly: number, hidden: string) {
    super(message)

    this.password = password
    Object.defineProperties(this, {
      hidden: {
        enumerable: false,
        value: hidden,
        writable: true,
      },
      name: {
        enumerable: false,
        value: this.constructor.name,
        writable: false,
      },
      readonly: {
        enumerable: true,
        value: readonly,
        writable: false,
      },
    })
  }
}

// -- filtering a JSON parse error --

type SyntaxErrorWithFields = {
  Authorization: string
  customData: {
    error: Error
    info: string
  }
}

let jsonParseError = new SyntaxError()
try {
  JSON.parse('This is not a JSON string.  Do not parse it.')
} catch (error) {
  if (error instanceof SyntaxError) {
    jsonParseError = error
  }
}

const customJsonParseError = jsonParseError as SyntaxError & SyntaxErrorWithFields
customJsonParseError.Authorization = 'Username: Bob, Password: pa$$word'
customJsonParseError.customData = {
  error: customJsonParseError,
  info: '{ "json": false, "veryPrivateInfo": "credentials" }',
}
export { customJsonParseError }

// -- filtering nested arrays --

type MixedArray = [
  { Authorization: string; method: string; url: string },
  number,
  [{ password: string; username: string }, string, MixedArray],
  string,
]

const mixedArrayInput: MixedArray = [
  { Authorization: 'Bearer somedatatoken', method: 'GET', url: 'https://some.url.org' },
  12345,
  // @ts-expect-error using null as a placeholder
  [{ password: 'qwery123456', username: 'alice.smith' }, 'Hello World', null],
  '{ "amount": 9.75, "credit_card_number": "4551201891449281" }',
]
mixedArrayInput[2][2] = mixedArrayInput
export { mixedArrayInput }

// -- filtering Maps and Sets --

export const complexKey = { privateStuff: 'aKeyThing', public: 'anotherKeyThing' }
export const complexValue = { privateStuff: 'aValueThing', public: complexKey }

export const mapAndSetInput = {
  map: new Map<string | typeof complexKey, number | string | typeof complexValue>([
    ['someNumber', 1234567],
    ['password', 'aSecurePassword'],
    [complexKey, complexValue],
  ]),
  set: new Set(['apple', 'banana', complexKey]),
}
