export const keysToFilter = ['password', 'auth', 'PrIvAtE', 'credit_card']
export const whitelist = ['authentic']

export type PlainJsObject = {
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
