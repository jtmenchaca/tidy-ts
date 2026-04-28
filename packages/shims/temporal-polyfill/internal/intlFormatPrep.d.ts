import { LocalesArg } from './intlFormatUtils.ts';
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './isoFields.ts';
import { EpochAndZoneSlots, EpochSlots } from './slots.ts';
export type OptionsTransformer = (options: Intl.DateTimeFormatOptions, strictOptions: boolean) => Intl.DateTimeFormatOptions;
export type ClassFormatConfig<S> = [
    optionsTransformer: OptionsTransformer,
    slotsToEpochMilli: EpochNanoConverter<S>,
    strictCalendarChecks?: boolean,
    getForcedTimeZoneId?: (...slotsList: S[]) => string
];
export type EpochNanoConverter<S> = (slots: S, resolvedOptions: Intl.ResolvedDateTimeFormatOptions) => number;
export type FormatPrepper<S> = (locales: LocalesArg | undefined, options: Intl.DateTimeFormatOptions | undefined, ...slotsList: S[]) => [Intl.DateTimeFormat, ...number[]];
export type FormatQuerier = (forcedTimeZoneId: string | undefined, locales: LocalesArg | undefined, options: Intl.DateTimeFormatOptions, transformOptions: OptionsTransformer, strictOptions: boolean) => Intl.DateTimeFormat;
export declare function createFormatPrepper<S>(config: ClassFormatConfig<S>, queryFormat?: FormatQuerier, strictOptions?: boolean): FormatPrepper<S>;
export declare function createFormatForPrep(forcedTimeZoneId: string | undefined, // data-dependent
locales: LocalesArg | undefined, options: Intl.DateTimeFormatOptions, transformOptions: OptionsTransformer, strictOptions: boolean): Intl.DateTimeFormat;
export declare const instantConfig: ClassFormatConfig<EpochSlots>;
export declare const zonedConfig: ClassFormatConfig<EpochAndZoneSlots>;
export declare const dateTimeConfig: ClassFormatConfig<IsoDateTimeFields>;
export declare const dateConfig: ClassFormatConfig<IsoDateFields>;
export declare const timeConfig: ClassFormatConfig<IsoTimeFields>;
export declare const yearMonthConfig: ClassFormatConfig<IsoDateFields>;
export declare const monthDayConfig: ClassFormatConfig<IsoDateFields>;
