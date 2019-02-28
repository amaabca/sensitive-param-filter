const {
  DEFAULT_PARAMS,
  DEFAULT_REPLACEMENT
} = require('./defaults')

const SensitiveParamFilter = require('./sensitiveParamFilter')

module.exports = {
  SPFDefaultParams: DEFAULT_PARAMS,
  SPFDefaultReplacement: DEFAULT_REPLACEMENT,
  SensitiveParamFilter
}
