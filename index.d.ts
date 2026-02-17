export interface SensitiveParamFilterOptions {
  params?: string[]
  replacement?: string
  filterUnknown?: boolean
  whitelist?: string[]
}

export class SensitiveParamFilter {
  constructor(options?: SensitiveParamFilterOptions)
  filter<T>(obj: T): T
}

export const SPFDefaultParams: string[]
export const SPFDefaultReplacement: string

declare const defaultExport: {
  SensitiveParamFilter: typeof SensitiveParamFilter
  SPFDefaultParams: typeof SPFDefaultParams
  SPFDefaultReplacement: typeof SPFDefaultReplacement
}

export default defaultExport
