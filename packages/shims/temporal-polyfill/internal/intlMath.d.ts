import { DateParts, EraParts, MonthCodeParts, NativeCalendar, YearMonthParts } from './calendarNative.ts';
import { IsoDateFields } from './isoFields.ts';
interface IntlDateFields {
    era: string | undefined;
    eraYear: number | undefined;
    year: number;
    monthString: string;
    day: number;
}
interface IntlYearData {
    monthEpochMillis: number[];
    monthStringToIndex: Record<string, number>;
}
export interface IntlCalendar extends NativeCalendar {
    queryFields: (isoFields: IsoDateFields) => IntlDateFields;
    queryYearData: (year: number) => IntlYearData;
}
export declare const queryIntlCalendar: (key: string) => IntlCalendar;
export declare function parseIntlYear(intlParts: Record<string, string>, calendarIdBase: string): {
    era: string | undefined;
    eraYear: number | undefined;
    year: number;
};
export declare function parseIntlPartsYear(intlParts: Record<string, string>): number;
/**
 * @param id Expects already-normalized
 */
export declare const queryCalendarIntlFormat: (key: string) => Intl.DateTimeFormat;
export declare function computeIntlYear(this: IntlCalendar, isoFields: IsoDateFields): number;
export declare function computeIntlMonth(this: IntlCalendar, isoFields: IsoDateFields): number;
export declare function computeIntlDay(this: IntlCalendar, isoFields: IsoDateFields): number;
export declare function computeIntlDateParts(this: IntlCalendar, isoFields: IsoDateFields): DateParts;
export declare function computeIsoFieldsFromIntlParts(this: IntlCalendar, year: number, month?: number, day?: number): IsoDateFields;
export declare function computeIntlEpochMilli(this: IntlCalendar, year: number, month?: number, day?: number): number;
export declare function computeIntlMonthCodeParts(this: IntlCalendar, year: number, month: number): MonthCodeParts;
export declare function computeIntlLeapMonth(this: IntlCalendar, year: number): number | undefined;
export declare function computeIntlInLeapYear(this: IntlCalendar, year: number): boolean;
export declare function computeIntlDaysInYear(this: IntlCalendar, year: number): number;
export declare function computeIntlDaysInMonth(this: IntlCalendar, year: number, month: number): number;
export declare function computeIntlMonthsInYear(this: IntlCalendar, year: number): number;
export declare function computeIntlEraParts(this: IntlCalendar, isoFields: IsoDateFields): EraParts;
export declare function computeIntlYearMonthForMonthDay(this: IntlCalendar, monthCodeNumber: number, isLeapMonth: boolean, day: number): YearMonthParts | undefined;
export {};
