const crypto = require('crypto')

const urlParamRegex = /([#;/?:@&][^#;/?:@&=\s]+=[^#;/?:@&=\s]*)/g

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

const parseUrlParams = (input) => {
  const segmentedString = []
  let previousEndIndex = 0
  urlParamRegex.lastIndex = 0
  let match = urlParamRegex.exec(input)
  while (match) {
    const { 0: text, index } = match
    segmentedString.push(input.slice(previousEndIndex, index + 1))
    previousEndIndex = index + text.length
    segmentedString.push({
      key: text.slice(1, text.indexOf('=')),
      value: text.slice(text.indexOf('=') + 1, text.length)
    })
    match = urlParamRegex.exec(input)
  }
  segmentedString.push(input.slice(previousEndIndex, input.length))
  return segmentedString
}

module.exports = {
  constructParamRegex,
  constructWhitelistRegex,
  generateRandomString,
  parseUrlParams
}
