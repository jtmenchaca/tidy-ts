import { DurationSlots, InstantSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from './slots.ts';
export declare function constructInstantSlots(epochNano: bigint): InstantSlots;
export declare function constructZonedDateTimeSlots<CA, TA>(refineCalendarArg: (calendarArg: CA) => string, // to calendarId
refineTimeZoneArg: (timeZoneArg: TA) => string, epochNano: bigint, timeZoneArg: TA, calendarArg?: CA): ZonedDateTimeSlots;
export declare function constructPlainDateTimeSlots<CA>(refineCalendarArg: (calendarArg: CA) => string, // to calendarId
isoYear: number, isoMonth: number, isoDay: number, isoHour?: number, isoMinute?: number, isoSecond?: number, isoMillisecond?: number, isoMicrosecond?: number, isoNanosecond?: number, calendarArg?: CA): PlainDateTimeSlots;
export declare function constructPlainDateSlots<CA>(refineCalendarArg: (calendarArg: CA) => string, // to calendarId
isoYear: number, isoMonth: number, isoDay: number, calendarArg?: CA): PlainDateSlots;
export declare function constructPlainYearMonthSlots<CA>(refineCalendarArg: (calendarArg: CA) => string, // to calendarId
isoYear: number, isoMonth: number, calendarArg?: CA, referenceIsoDay?: number): PlainYearMonthSlots;
export declare function constructPlainMonthDaySlots<CA>(refineCalendarArg: (calendarArg: CA) => string, // to calendarId
isoMonth: number, isoDay: number, calendarArg?: CA, referenceIsoYear?: number): PlainMonthDaySlots;
export declare function constructPlainTimeSlots(isoHour?: number, isoMinute?: number, isoSecond?: number, isoMillisecond?: number, isoMicrosecond?: number, isoNanosecond?: number): PlainTimeSlots;
export declare function constructDurationSlots(years?: number, months?: number, weeks?: number, days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number, microseconds?: number, nanoseconds?: number): DurationSlots;
