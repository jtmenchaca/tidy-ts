import { Unit } from './units.ts';
export interface DurationDateFields {
    days: number;
    weeks: number;
    months: number;
    years: number;
}
export interface DurationTimeFields {
    nanoseconds: number;
    microseconds: number;
    milliseconds: number;
    seconds: number;
    minutes: number;
    hours: number;
}
export type DurationFields = DurationDateFields & DurationTimeFields;
export type DurationYearMonthFieldName = 'years' | 'months';
export type DurationDateFieldName = DurationYearMonthFieldName | 'weeks' | 'days';
export type DurationTimeFieldName = 'hours' | 'minutes' | 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds';
export type DurationDayTimeFieldName = 'day' | DurationTimeFieldName;
export type DurationFieldName = DurationDateFieldName | DurationTimeFieldName;
export declare const durationFieldNamesAsc: DurationFieldName[];
export declare const durationFieldNamesAlpha: DurationFieldName[];
export declare const durationTimeFieldNamesAsc: DurationTimeFieldName[];
export declare const durationDateFieldNamesAsc: DurationFieldName[];
export declare const durationCalendarFieldNamesAsc: DurationFieldName[];
export declare const durationFieldIndexes: {
    years: number;
    months: number;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    microseconds: number;
    nanoseconds: number;
};
export declare const durationFieldDefaults: {
    years: number;
    months: number;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    microseconds: number;
    nanoseconds: number;
};
export declare const durationTimeFieldDefaults: {
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    microseconds: number;
    nanoseconds: number;
};
export declare const clearDurationFields: (unit: Unit, durationFields: DurationFields) => DurationFields;
