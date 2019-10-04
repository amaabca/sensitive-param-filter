const crypto = require('crypto')

// See https://tools.ietf.org/html/rfc1738#section-2.2 and https://tools.ietf.org/html/rfc3986#section-2.2
const urlDelimiters = '#;/?:@&'
const urlParamRegex = new RegExp(`([${urlDelimiters}][^${urlDelimiters}=\\s]+=[^${urlDelimiters}=\\s]*)`, 'g')

const constructParamRegex = (params) => {
  if (!params || !params.length) {
    throw new Error('Provide an array of params to filter.')
  }
  return new RegExp(params.join('|'), 'i')
}

const constructWhitelistRegex = (whitelist) => {
  if (whitelist && whitelist.length) {
    const whitelistRegexGroups = whitelist.map((entry) => `^(${entry})$`)
    return new RegExp(whitelistRegexGroups.join('|'))
  }
  return { test: () => false }
}

const findUniqueMatches = (input, regularExpression) => {
  const matches = []
  const uniqueMatches = {}

  let match = regularExpression.exec(input)
  while (match) {
    const { 0: text } = match

    if (!uniqueMatches[text]) {
      matches.push(text)
      uniqueMatches[text] = true
    }

    match = urlParamRegex.exec(input)
  }

  matches.sort()
  return matches
}

const generateRandomString = () => crypto.randomBytes(32).toString('hex')

const parseUrlParams = (input) => {
  const segments = []
  let previousEndIndex = 0
  urlParamRegex.lastIndex = 0

  let match = urlParamRegex.exec(input)
  while (match) {
    const { 0: text, index } = match

    segments.push({
      key: null,
      value: input.slice(previousEndIndex, index + 1)
    })
    previousEndIndex = index + text.length
    segments.push({
      key: text.slice(1, text.indexOf('=')),
      value: text.slice(text.indexOf('=') + 1, text.length)
    })
    match = urlParamRegex.exec(input)
  }

  const lastSegment = input.slice(previousEndIndex, input.length)
  if (lastSegment.length > 0) {
    segments.push({
      key: null,
      value: lastSegment
    })
  }
  return segments
}

module.exports = {
  constructParamRegex,
  constructWhitelistRegex,
  findUniqueMatches,
  generateRandomString,
  parseUrlParams
}
