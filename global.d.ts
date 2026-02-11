declare module '@amaabca/sensitive-param-filter' {
  export const SPFDefaultParams: string[]
  export const SPFDefaultReplacement: string
  export class SensitiveParamFilter {
    constructor(options?: { params?: string[], replacement?: string, filterUnknown?: boolean, whiteList?: string[] })
    filter<T>(obj: T): T
  }
}
