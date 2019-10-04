# Sensitive Param Filter

[![Build Status](https://travis-ci.org/amaabca/sensitive-param-filter.svg?branch=master)](https://travis-ci.org/amaabca/sensitive-param-filter)

`sensitive-param-filter` is a zero-dependency package designed to filter sensitive values from JavaScript objects.
This package can be used to scrub logs, filer data before outputting to a UI, etc.
The defaults provided with sensitive-param-filter should work well for most applications.

## Installation

Install sensitive-param-filter to your project via either npm:

`npm install @amaabca/sensitive-param-filter`

or yarn:

`yarn add @amaabca/sensitive-param-filter`

## Usage

```js
const { SensitiveParamFilter } = require('@amaabca/sensitive-param-filter')
const paramFilter = new SensitiveParamFilter()
const rawObject = {
  Authorization: 'Bearer somedatatoken',
  body: {
    info: '{ "amount": 28.64, "credit_card": "4242424242424242", "cvv": "123" }'
  },
  method: 'POST',
  url: 'https://pay.example.com?user=bob.bobbington&password=asecurepassword1234'
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
Key matching is done in a case-insensitive, partial-macthing manner (that is, if the param `AUTH` is provided, `Authorization`, `AUTHENTICATION`, etc. will be filtered).

### Key Features

 * Does not modify input objects
 * Performs a deep copy of the input object (note that booleans, numbers, and strings - which are immutable - are technically copied by reference)
 * Does not copy functions
 * Handles circular references
 * Filters valid JSON strings
 * Filters valid and malformed URL query params

### Options

```js
const { SPFDefaultParams, SensitiveParamFilter } = require('@amaabca/sensitive-param-filter')
const filter = new SensitiveParamFilter({
  params: SPFDefaultParams.concat(['data', 'email']),
  replacement: '***',
  whitelist: ['authentic', 'encryption_standard']
})
```

* **params:**
An array of string params to filter.
These entries will be combined into a regex that is used by sensitive-param-filter.
Setting this option overwrites the default array (`SPFDefaultParams`).

* **replacement:**
The object to replace filtered values with.
By default, replacement is `'FILTERED'`.

* **whitelist:**
An array of strings to exclude from filtering.
For example, if `pass_through` is including in the whitelist, the key `pass_through` will not be filtered.
Note that entries must match keys exactly to prevent filtering - that is, whitelisting `secrets` still causes `secrets_store` to be filtered.

## Default Values

See [defaults](src/defaults.js).
Note that all of these values can be overridden via the options.

The default keys that are filtered are:

* auth
* bearer
* credit
* CVD
* CVV
* encrypt
* PAN
* pass
* secret
* token

## License & Contributing

`sensitive-param-filter` uses the MIT license.
See the [license](LICENSE).

We welcome contributions.
See [contributing](CONTRIBUTING.md).
