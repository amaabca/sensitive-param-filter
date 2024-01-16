# Sensitive Param Filter

[![Build Status](https://travis-ci.org/amaabca/sensitive-param-filter.svg?branch=master)](https://travis-ci.org/amaabca/sensitive-param-filter)

`sensitive-param-filter` is a zero-dependency package designed to filter sensitive values from JavaScript objects.
This package can be used to scrub logs, filter data before outputting to a UI, etc.
The defaults provided with sensitive-param-filter should work well for most applications.

## Installation

`npm install @amaabca/sensitive-param-filter`

## Usage

```typescript
import { SensitiveParamFilter } from '@amaabca/sensitive-param-filter'
const paramFilter = new SensitiveParamFilter()
const rawObject = {
  Authorization: 'Bearer somedatatoken',
  body: {
    info: '{ "amount": 28.64, "credit_card": "4242424242424242", "cvv": "123" }',
  },
  method: 'POST',
  url: 'https://pay.example.com?user=bob.bobbington&password=asecurepassword1234',
}
const filteredObject = paramFilter.filter(rawObject)
// filteredObject = {
//   Authorization: 'FILTERED',
//   body: {
//     info: '{ "amount": 28.64, "credit_card": "FILTERED", "cvv": "FILTERED" }'
//   },
//   method: 'POST',
//   url: 'https://pay.example.com?user=bob.bobbington&password=FILTERED'
// }
```

### Details

sensitive-param-filter examines keys to determine which values to filter.
Partial matches and case-insensitive matches are filtered - if the key `AUTH` is provided, `Authorization`, `AUTHENTICATION`, etc. will be filtered.

### Key Features

- Does not modify input objects
- Performs a deep copy of the input object
- Can be configued to filter out or leave "unexpected" objects (such as functions)
- Handles circular references
- Filters valid JSON strings
- Filters valid and malformed URL query params
- Filters Errors, Arrays, Maps, Sets, and simple objects

### Options

```typescript
import { SPFDefaultFilteredKeys, SensitiveParamFilter } from '@amaabca/sensitive-param-filter'
const filter = new SensitiveParamFilter({
  filterUnknown: false,
  keysToFilter: SPFDefaultFilteredKeys.concat(['data', 'email']),
  replacement: '***',
  whitelist: ['authentic', 'encryption_standard'],
})
```

- **filterUnknown:**
  Indicates whether "unexpected" objects (such as functions) should be filtered or returned as-is.
  Defaults to `true`

- **keysToFilter:**
  An array of string keys to filter.
  These entries will be combined into a regex that is used by sensitive-param-filter.
  Setting this option overwrites the default array (`SPFDefaultFilteredKeys`).

- **replacement:**
  The object to replace filtered values with.
  Defaults to `'FILTERED'`.

- **whitelist:**
  An array of strings to exclude from filtering.
  For example, if `pass_through` is including in the whitelist, the key `pass_through` will not be filtered.
  Note that entries must match keys exactly to prevent filtering - that is, whitelisting `secrets` still causes `secrets_store` to be filtered.

## Default Values

See [defaults](src/defaults.ts).
Note that all of these values can be overridden via the options.

The default keys that are filtered are:

- auth
- bearer
- credit
- CVD
- CVV
- encrypt
- PAN
- pass
- secret
- token
