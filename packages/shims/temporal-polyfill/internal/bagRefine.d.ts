import { NativeDateRefineDeps, NativeMonthDayRefineOps, NativeYearMonthRefineDeps } from './calendarNative.ts';
import { DateModOps, DateRefineOps, MonthDayModOps, MonthDayRefineOps, YearMonthModOps, YearMonthRefineOps } from './calendarOps.ts';
import { DateBag, DateTimeBag, DayFields, DurationBag, EraYearOrYear, MonthDayBag, TimeBag, TimeFields, YearMonthBag, YearMonthFields } from './fields.ts';
import { IsoTimeFields } from './isoFields.ts';
import { RelativeToSlotsNoCalendar } from './markerSystem.ts';
import { OverflowOptions, ZonedFieldOptions } from './optionsRefine.ts';
import { DurationSlots, PlainDateSlots, PlainDateTimeSlots, PlainMonthDaySlots, PlainTimeSlots, PlainYearMonthSlots, ZonedDateTimeSlots } from './slots.ts';
import { TimeZoneOps } from './timeZoneOps.ts';
export type PlainDateBag = DateBag & {
    calendar?: string;
};
export type PlainDateTimeBag = DateBag & TimeBag & {
    calendar?: string;
};
export type ZonedDateTimeBag = PlainDateTimeBag & {
    timeZone: string;
    offset?: string;
};
export type PlainTimeBag = TimeBag;
export type PlainYearMonthBag = YearMonthBag & {
    calendar?: string;
};
export type PlainMonthDayBag = MonthDayBag & {
    calendar?: string;
};
export declare function refineMaybeZonedDateTimeBag(refineTimeZoneString: (timeZoneString: string) => string, // to timeZoneId
getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, calendarOps: DateRefineOps, bag: ZonedDateTimeBag): RelativeToSlotsNoCalendar;
export declare function refineZonedDateTimeBag(refineTimeZoneString: (timeZoneString: string) => string, // to timeZoneId
getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, calendarOps: DateRefineOps, calendarId: string, bag: ZonedDateTimeBag, options: ZonedFieldOptions | undefined): ZonedDateTimeSlots;
export declare function refinePlainDateTimeBag(calendarOps: DateRefineOps, bag: DateTimeBag, options: OverflowOptions | undefined): PlainDateTimeSlots;
export declare function refinePlainDateBag(calendarOps: DateRefineOps, bag: DateBag, options: OverflowOptions | undefined, requireFields?: string[]): PlainDateSlots;
export declare function refinePlainYearMonthBag(calendarOps: YearMonthRefineOps, bag: YearMonthBag, options: OverflowOptions | undefined, requireFields?: string[]): PlainYearMonthSlots;
export declare function refinePlainMonthDayBag(calendarOps: MonthDayRefineOps, calendarAbsent: boolean, bag: MonthDayBag, options?: OverflowOptions): PlainMonthDaySlots;
export declare function refinePlainTimeBag(bag: TimeBag, options?: OverflowOptions): PlainTimeSlots;
export declare function refineDurationBag(bag: DurationBag): DurationSlots;
export declare const isoTimeFieldsToCal: (oldProps: IsoTimeFields) => TimeFields;
export declare function zonedDateTimeWithFields(getCalendarOps: (calendarId: string) => DateModOps, getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, zonedDateTimeSlots: ZonedDateTimeSlots, modFields: DateTimeBag, options?: ZonedFieldOptions): ZonedDateTimeSlots;
export declare function plainDateTimeWithFields(getCalendarOps: (calendarId: string) => DateModOps, plainDateTimeSlots: PlainDateTimeSlots, modFields: DateTimeBag, options?: OverflowOptions): PlainDateTimeSlots;
export declare function plainDateWithFields(getCalendarOps: (calendarId: string) => DateModOps, plainDateSlots: PlainDateSlots, modFields: DateBag, options?: OverflowOptions): PlainDateSlots;
export declare function plainYearMonthWithFields(getCalendarOps: (calendar: string) => YearMonthModOps, plainYearMonthSlots: PlainYearMonthSlots, modFields: YearMonthBag, options?: OverflowOptions): PlainYearMonthSlots;
export declare function plainMonthDayWithFields(getCalendarOps: (calendarId: string) => MonthDayModOps, plainMonthDaySlots: PlainMonthDaySlots, modFields: MonthDayBag, options?: OverflowOptions): PlainMonthDaySlots;
export declare function plainTimeWithFields(initialFields: TimeFields, mod: TimeBag, options?: OverflowOptions): PlainTimeSlots;
export declare function durationWithFields(slots: DurationSlots, fields: DurationBag): DurationSlots;
export declare function convertToPlainMonthDay(calendarOps: MonthDayRefineOps, input: {
    monthCode: string;
    day: number;
}): PlainMonthDaySlots;
export declare function convertToPlainYearMonth(calendarOps: YearMonthRefineOps, input: {
    year: number;
    monthCode: string;
}, options?: OverflowOptions): PlainYearMonthSlots;
export declare function convertPlainMonthDayToDate(calendarOps: DateModOps, input: {
    monthCode: string;
    day: number;
}, bag: EraYearOrYear): PlainDateSlots;
export declare function convertPlainYearMonthToDate(calendarOps: DateModOps, input: YearMonthFields, bag: DayFields): PlainDateSlots;
export declare function nativeDateFromFields(this: NativeDateRefineDeps, fields: DateBag, options?: OverflowOptions): PlainDateSlots;
export declare function nativeYearMonthFromFields(this: NativeYearMonthRefineDeps, fields: YearMonthBag, options?: OverflowOptions): PlainYearMonthSlots;
export declare function nativeMonthDayFromFields(this: NativeMonthDayRefineOps, fields: DateBag, // guaranteed `day`
options?: OverflowOptions): PlainMonthDaySlots;
export declare function nativeFieldsMethod(this: NativeYearMonthRefineDeps, fieldNames: string[]): string[];
export declare function nativeMergeFields(this: NativeYearMonthRefineDeps, baseFields: Record<string, unknown>, additionalFields: Record<string, unknown>): Record<string, unknown>;
