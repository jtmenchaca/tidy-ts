export type LocalesArg = string | string[];
export type OptionNames = (keyof Intl.DateTimeFormatOptions)[];
export type RawFormattable = Date | number;
export declare const RawDateTimeFormat: Intl.DateTimeFormatConstructor;
export declare function hashIntlFormatParts(intlFormat: Intl.DateTimeFormat, epochMilli: number): Record<string, string>;
