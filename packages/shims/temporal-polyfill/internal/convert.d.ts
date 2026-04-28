import { DateModOps, MonthDayRefineOps, YearMonthRefineOps } from './calendarOps.ts';
import { EraYearOrYear, MonthDayFields, YearMonthFields } from './fields.ts';
import { IsoTimeFields } from './isoFields.ts';
import { EpochDisambigOptions } from './optionsRefine.ts';
import { InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from './slots.ts';
import { TimeZoneOffsetOps, TimeZoneOps } from './timeZoneOps.ts';
export declare function instantToZonedDateTime(instantSlots: InstantSlots, timeZoneId: string, calendarId?: string): ZonedDateTimeSlots;
export declare function zonedDateTimeToInstant(zonedDateTimeSlots0: ZonedDateTimeSlots): InstantSlots;
export declare function zonedDateTimeToPlainDateTime(getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps, zonedDateTimeSlots0: ZonedDateTimeSlots): PlainDateTimeSlots;
export declare function zonedDateTimeToPlainDate(getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps, zonedDateTimeSlots0: ZonedDateTimeSlots): PlainDateSlots;
export declare function zonedDateTimeToPlainYearMonth(getCalendarOps: (calendarId: string) => YearMonthRefineOps, zonedDateTimeSlots0: ZonedDateTimeSlots, zonedDateTimeFields: {
    year: number;
    monthCode: string;
}): PlainYearMonthSlots;
export declare function zonedDateTimeToPlainMonthDay(getCalendarOps: (calendarId: string) => MonthDayRefineOps, zonedDateTimeSlots0: ZonedDateTimeSlots, zonedDateTimeFields: {
    monthCode: string;
    day: number;
}): PlainMonthDaySlots;
export declare function zonedDateTimeToPlainTime(getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps, zonedDateTimeSlots0: ZonedDateTimeSlots): PlainTimeSlots;
export declare function plainDateTimeToZonedDateTime(getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, plainDateTimeSlots: PlainDateTimeSlots, timeZoneId: string, options?: EpochDisambigOptions): ZonedDateTimeSlots;
export declare function plainDateTimeToPlainYearMonth(getCalendarOps: (calendarId: string) => YearMonthRefineOps, plainDateTimeSlots: PlainDateTimeSlots, plainDateFields: {
    year: number;
    monthCode: string;
}): PlainYearMonthSlots;
export declare function plainDateTimeToPlainMonthDay(getCalendarOps: (calendarId: string) => MonthDayRefineOps, plainDateTimeSlots: PlainDateTimeSlots, plainDateFields: {
    monthCode: string;
    day: number;
}): PlainMonthDaySlots;
export declare function plainDateToZonedDateTime<PA>(refineTimeZoneString: (timeZoneString: string) => string, refinePlainTimeArg: (plainTimeArg: PA) => IsoTimeFields, getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, plainDateSlots: PlainDateSlots, options: {
    timeZone: string;
    plainTime?: PA;
}): ZonedDateTimeSlots;
export declare function plainDateToPlainDateTime(plainDateSlots: PlainDateSlots, plainTimeFields?: IsoTimeFields): PlainDateTimeSlots;
export declare function plainDateToPlainYearMonth(getCalendarOps: (calendarId: string) => YearMonthRefineOps, plainDateSlots: {
    calendar: string;
}, plainDateFields: {
    year: number;
    monthCode: string;
}): PlainYearMonthSlots;
export declare function plainDateToPlainMonthDay(getCalendarOps: (calendarId: string) => MonthDayRefineOps, plainDateSlots: {
    calendar: string;
}, plainDateFields: {
    monthCode: string;
    day: number;
}): PlainMonthDaySlots;
export declare function plainYearMonthToPlainDate(getCalendarOps: (calendar: string) => DateModOps, plainYearMonthSlots: PlainYearMonthSlots, plainYearMonthFields: YearMonthFields, bag: {
    day: number;
}): PlainDateSlots;
export declare function plainMonthDayToPlainDate(getCalendarOps: (calendar: string) => DateModOps, plainMonthDaySlots: PlainMonthDaySlots, plainMonthDayFields: MonthDayFields, bag: EraYearOrYear): PlainDateSlots;
export declare function plainTimeToZonedDateTime<PA>(refineTimeZoneString: (timeZoneString: string) => string, refinePlainDateArg: (plainDateArg: PA) => PlainDateSlots, getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, slots: PlainTimeSlots, options: {
    timeZone: string;
    plainDate: PA;
}): ZonedDateTimeSlots;
export declare function plainTimeToPlainDateTime(plainTimeSlots0: PlainTimeSlots, plainDateSlots1: PlainDateSlots): PlainDateTimeSlots;
export declare function epochSecToInstant(epochSec: number): InstantSlots;
export declare function epochMilliToInstant(epochMilli: number): InstantSlots;
export declare function epochMicroToInstant(epochMicro: bigint): InstantSlots;
export declare function epochNanoToInstant(epochNano: bigint): InstantSlots;
