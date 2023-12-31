// See https://tools.ietf.org/html/rfc1738#section-2.2 and https://tools.ietf.org/html/rfc3986#section-2.2
const urlDelimiters = '#;/?:@&'
const urlParamRegex = new RegExp(
  `([${urlDelimiters}][^${urlDelimiters}=\\s]+=[^${urlDelimiters}=\\s]*)`,
  'g',
)

export const circularReferenceKey = '__spf_1337_c1rc1ul4r_r3f3r3nc3_k3y__'

export const constructFitleredKeyRegex = (filteredKeys: string[]) => {
  if (filteredKeys == null || filteredKeys.length == null) {
    throw new Error('Provide an array of keys to filter.')
  }
  return new RegExp(filteredKeys.join('|'), 'i')
}

export const constructWhitelistRegex = (whitelist?: string[]) => {
  if (whitelist != null && whitelist.length != null) {
    const whitelistRegexGroups = whitelist.map((entry) => `^(${entry})$`)
    return new RegExp(whitelistRegexGroups.join('|'))
  }
  return { test: () => false }
}

export const parseUrlParams = (input: string) => {
  const segments = []
  let previousEndIndex = 0
  urlParamRegex.lastIndex = 0

  let match = urlParamRegex.exec(input)
  while (match != null) {
    const { 0: text, index } = match

    segments.push({
      key: null,
      value: input.slice(previousEndIndex, index + 1),
    })
    previousEndIndex = index + text.length
    segments.push({
      key: text.slice(1, text.indexOf('=')),
      value: text.slice(text.indexOf('=') + 1, text.length),
    })
    match = urlParamRegex.exec(input)
  }

  const lastSegment = input.slice(previousEndIndex, input.length)
  if (lastSegment.length > 0) {
    segments.push({
      key: null,
      value: lastSegment,
    })
  }
  return segments
}
