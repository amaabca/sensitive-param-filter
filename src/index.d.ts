/**
 * Options for configuring the SensitiveParamFilter.
 */
export interface SensitiveParamFilterOptions {
  /**
   * Indicates whether "unexpected" objects (such as functions) should be filtered or returned as-is.
   * Defaults to `true`.
   */
  filterUnknown?: boolean;

  /**
   * An array of string params to filter.
   * These entries will be combined into a regex that is used by sensitive-param-filter.
   * Setting this option overwrites the default array (`SPFDefaultParams`).
   */
  params?: string[];

  /**
   * The object to replace filtered values with.
   * Defaults to `'FILTERED'`.
   */
  replacement?: string;

  /**
   * An array of strings to exclude from filtering.
   * For example, if `pass_through` is included in the whitelist, the key `pass_through` will not be filtered.
   * Note that entries must match keys exactly to prevent filtering.
   */
  whitelist?: string[];
}

/**
 * Class for filtering sensitive parameters from objects.
 */
export class SensitiveParamFilter {
  constructor(args?: SensitiveParamFilterOptions);

  /**
   * Filters sensitive parameters from the input object.
   * @param inputObject The object to filter.
   * @returns A new object with sensitive parameters filtered.
   */
  filter<T = any>(inputObject: T): T;

  /**
   * Checks if a given text should be filtered based on the configured parameters and whitelist.
   * @param text The text to check.
   * @returns True if the text should be filtered, false otherwise.
   */
  shouldFilter(text: string): boolean;
}

/**
 * Default parameters to filter.
 */
export const SPFDefaultParams: string[];

/**
 * Default replacement value for filtered parameters.
 */
export const SPFDefaultReplacement: string;