import { OffsetDisplay } from './options.ts';
import { CalendarDisplayOptions, DateTimeDisplayOptions, InstantDisplayOptions, TimeDisplayOptions, ZonedDateTimeDisplayOptions } from './optionsRefine.ts';
import { DurationSlots, InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from './slots.ts';
import { TimeZoneOffsetOps } from './timeZoneOps.ts';
export declare function formatInstantIso(refineTimeZoneString: (timeZoneString: string) => string, // to timeZoneId
getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps, instantSlots: InstantSlots, options?: InstantDisplayOptions): string;
export declare function formatZonedDateTimeIso(getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps, zonedDateTimeSlots0: ZonedDateTimeSlots, options?: ZonedDateTimeDisplayOptions): string;
export declare function formatPlainDateTimeIso(plainDateTimeSlots0: PlainDateTimeSlots, options?: DateTimeDisplayOptions): string;
export declare function formatPlainDateIso(plainDateSlots: PlainDateSlots, options?: CalendarDisplayOptions): string;
export declare function formatPlainYearMonthIso(plainYearMonthSlots: PlainYearMonthSlots, options?: CalendarDisplayOptions): string;
export declare function formatPlainMonthDayIso(plainMonthDaySlots: PlainMonthDaySlots, options?: CalendarDisplayOptions): string;
export declare function formatPlainTimeIso(slots: PlainTimeSlots, options?: TimeDisplayOptions): string;
export declare function formatDurationIso(slots: DurationSlots, options?: TimeDisplayOptions): string;
export declare function formatOffsetNano(offsetNano: number, offsetDisplay?: OffsetDisplay): string;
