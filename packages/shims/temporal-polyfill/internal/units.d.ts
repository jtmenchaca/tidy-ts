import { BigNano } from './bigNano.ts';
import { DurationDateFieldName, DurationDayTimeFieldName, DurationFieldName, DurationTimeFieldName, DurationYearMonthFieldName } from './durationFields.ts';
export declare const enum Unit {
    Nanosecond = 0,
    Microsecond = 1,
    Millisecond = 2,
    Second = 3,
    Minute = 4,
    Hour = 5,
    Day = 6,
    Week = 7,
    Month = 8,
    Year = 9
}
export type TimeUnit = Unit.Nanosecond | Unit.Microsecond | Unit.Millisecond | Unit.Second | Unit.Minute | Unit.Hour;
export type DayTimeUnit = Unit.Day | TimeUnit;
export type StrictYearMonthUnitName = 'year' | 'month';
export type StrictDateUnitName = StrictYearMonthUnitName | 'week' | 'day';
export type StrictTimeUnitName = 'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond';
export type StrictDayTimeUnitName = 'day' | StrictTimeUnitName;
export type StrictUnitName = StrictDateUnitName | StrictTimeUnitName;
export type YearMonthUnitName = StrictYearMonthUnitName | DurationYearMonthFieldName;
export type DateUnitName = StrictDateUnitName | DurationDateFieldName;
export type TimeUnitName = StrictTimeUnitName | DurationTimeFieldName;
export type DayTimeUnitName = StrictDayTimeUnitName | DurationDayTimeFieldName;
export type UnitName = StrictUnitName | DurationFieldName;
export declare const unitNameMap: {
    nanosecond: Unit;
    microsecond: Unit;
    millisecond: Unit;
    second: Unit;
    minute: Unit;
    hour: Unit;
    day: Unit;
    week: Unit;
    month: Unit;
    year: Unit;
};
export declare const unitNamesAsc: (keyof typeof unitNameMap)[];
export declare const secInDay = 86400;
export declare const milliInDay = 86400000;
export declare const milliInSec = 1000;
export declare const nanoInMicro = 1000;
export declare const nanoInMilli = 1000000;
export declare const nanoInSec = 1000000000;
export declare const nanoInMinute = 60000000000;
export declare const nanoInHour = 3600000000000;
export declare const nanoInUtcDay = 86400000000000;
export declare const unitNanoMap: number[];
export declare function givenFieldsToBigNano<K extends string>(fields: Record<K, number>, largestUnit: DayTimeUnit, fieldNames: K[]): BigNano;
export declare function nanoToGivenFields<F>(nano: number, largestUnit: DayTimeUnit, // stops populating at this unit
fieldNames: (keyof F)[]): {
    [Key in keyof F]?: number;
};
