const crypto = require('crypto')

const constructParamRegex = (params) => {
  if (!params || !params.length) {
    throw new Error('Provide an array of params to filter.')
  }
  return new RegExp(params.join('|'), 'i')
}

const constructWhitelistRegex = (whitelist) => {
  if (whitelist && whitelist.length) {
    const whitelistRegexGroups = whitelist.map((entry) => `(\\b${entry}\\b)`)
    return new RegExp(whitelistRegexGroups.join('|'))
  }
  return { test: () => false }
}

const generateRandomString = (length) => crypto.randomBytes(length).toString('hex')

module.exports = {
  constructParamRegex,
  constructWhitelistRegex,
  generateRandomString
}
