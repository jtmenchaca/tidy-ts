import { DurationFields } from './durationFields.ts';
export interface EraYearFields {
    era: string;
    eraYear: number;
}
export type YearFields = Partial<EraYearFields> & {
    year: number;
};
export interface MonthFields {
    monthCode: string;
    month: number;
}
export interface DayFields {
    day: number;
}
export type YearMonthFields = YearFields & MonthFields;
export type DateFields = YearMonthFields & DayFields;
export type MonthDayFields = MonthFields & DayFields;
export interface TimeFields {
    hour: number;
    microsecond: number;
    millisecond: number;
    minute: number;
    nanosecond: number;
    second: number;
}
export type DateTimeFields = DateFields & TimeFields;
export type YearMonthBag = Partial<YearMonthFields>;
export type DateBag = Partial<DateFields>;
export type MonthDayBag = Partial<MonthDayFields>;
export type DurationBag = Partial<DurationFields>;
export type TimeBag = Partial<TimeFields>;
export type DateTimeBag = DateBag & TimeBag;
export type EraYearOrYear = EraYearFields | {
    year: number;
};
export type MonthCodeOrMonthAndYear = {
    monthCode: string;
} | ({
    month: number;
} & EraYearOrYear);
export type MonthCodeOrMonth = {
    monthCode: string;
} | {
    month: number;
};
export type YearMonthBagStrict = EraYearOrYear & MonthCodeOrMonth;
export type DateBagStrict = EraYearOrYear & MonthCodeOrMonth & DayFields;
export type MonthDayBagStrict = MonthCodeOrMonthAndYear & DayFields;
export interface YearStats {
    daysInYear: number;
    inLeapYear: boolean;
    monthsInYear: number;
}
export interface YearMonthStats extends YearStats {
    daysInMonth: number;
}
export interface DateStats extends YearMonthStats {
    dayOfWeek: number;
    dayOfYear: number;
    weekOfYear: number;
    yearOfWeek: number;
    daysInWeek: number;
}
export declare const timeFieldNamesAsc: (keyof TimeFields)[];
export declare const timeFieldNamesAlpha: (keyof TimeFields)[];
export declare const offsetFieldNames: string[];
export declare const timeZoneFieldNames: string[];
export declare const timeAndOffsetFieldNames: string[];
export declare const timeAndZoneFieldNames: string[];
export declare const eraYearFieldNames: string[];
export declare const allYearFieldNames: string[];
export declare const yearFieldNames: string[];
export declare const monthCodeFieldNames: string[];
export declare const monthFieldNames: string[];
export declare const dayFieldNames: string[];
export declare const yearMonthFieldNames: string[];
export declare const yearMonthCodeFieldNames: string[];
export declare const dateFieldNamesAlpha: string[];
export declare const monthDayFieldNames: string[];
export declare const monthCodeDayFieldNames: string[];
export declare const timeFieldDefaults: {
    nanosecond: number;
    microsecond: number;
    millisecond: number;
    second: number;
    minute: number;
    hour: number;
};
