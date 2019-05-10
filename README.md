# Sensitive Param Filter

`sensitive-param-filter` is a zero-dependency (in production) package designed to filter sensitive values from JavaScript objects.
This package can be used to scrub logs, filer data before outputting to a UI, etc.
The defaults provided with sensitive-param-filter should work well for most applications.

## Installation

Install sensitive-param-filter to your project via either npm:

`npm install sensitive-param-filter`

or yarn:

`yarn add sensitive-param-filter`

## Usage

```js
const { SensitiveParamFilter } = require('sensitive-param-filter')
const filter = new SensitiveParamFilter()
const rawObject = {
  Authorization: 'Bearer somedatatoken',
  body: {
    info: '{ "amount": 28.64, "credit_card": "4242424242424242", "cvv": "123" }'
  },
  method: 'POST',
  url: 'https://pay.example.com?user=bob.bobbington&password=asecurepassword1234'
}
const filteredObject = filter.filter(rawObject)
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

### Key Features:

 * Does not modify input objects
 * Performs a deep copy of the input object (note that booleans, numbers, and strings - which are immutable - are technically copied by reference)
 * Handles circular references
 * Filters valid JSON strings
 * Filters valid and malformed URL query params

## Default Values

See [defaults](src/defaults.js).
Note that all of these values can be overridden.

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
Please follow our [PR Template](.github/PULL_REQUEST_TEMPLATE.md) when opening a pull request.
Understand that it may take several days for your PR to be reviewed (in particular if you open it on a weekend).
