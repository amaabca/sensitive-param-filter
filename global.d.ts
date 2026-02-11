declare module '@amaabca/sensitive-param-filter' {
  export const SPFDefaultParams: string[]
  export const SPFDefaultReplacement: string
  export class SensitiveParamFilter {
    constructor(options?: { params?: string[], replacement?: string })
    filterObject<T>(obj: T): T
    filterString(str: string): string
  }
}
