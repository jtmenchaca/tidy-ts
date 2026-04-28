import { DateRefineOps, DayOps, DiffOps, MergeFieldsOp, MonthDayRefineOps, MoveOps, YearMonthRefineOps } from './calendarOps.ts';
import { IsoDateFields } from './isoFields.ts';
export type DateParts = [year: number, month: number, day: number];
export type EraParts = [era: string | undefined, eraYear: number | undefined];
export type MonthCodeParts = [monthCodeNumber: number, isLeapMonth: boolean];
export type YearMonthParts = [year: number, month: number];
export type WeekParts = [
    weekOfYear: number | undefined,
    yearOfWeek: number | undefined,
    weeksInYear: number | undefined
];
export type DatePartsOp = (isoFields: IsoDateFields) => DateParts;
export type EraOp = (isoFields: IsoDateFields) => string | undefined;
export type EraYearOp = (isoFields: IsoDateFields) => number | undefined;
export type EraPartsOp = (isoFields: IsoDateFields) => EraParts;
export type MonthCodeOp = (isoFields: IsoDateFields) => string;
export type MonthCodePartsOp = (year: number, month: number) => MonthCodeParts;
export type YearMonthForMonthDayOp = (monthCodeNumber: number, isLeapMonth: boolean, day: number) => YearMonthParts | undefined;
export type InLeapYearOp = (isoFields: IsoDateFields) => boolean;
export type InLeapYearPartOp = (year: number) => boolean;
export type LeapMonthOp = (year: number) => number | undefined;
export type MonthsInYearOp = (isoDateFields: IsoDateFields) => number;
export type MonthsInYearPartOp = (year: number) => number;
export type MonthsInYearSpanOp = (yearDelta: number, yearStart: number) => number;
export type DaysInMonthOp = (isoFields: IsoDateFields) => number;
export type DaysInMonthPartsOp = (year: number, month: number) => number;
export type DaysInYearOp = (isoFields: IsoDateFields) => number;
export type DaysInYearPartOp = (year: number) => number;
export type DayOfYearOp = (isoFields: IsoDateFields) => number;
export type WeekOfYearOp = (isoFields: IsoDateFields) => number | undefined;
export type YearOfWeekOp = (isoFields: IsoDateFields) => number | undefined;
export type WeekPartsOp = (isoFields: IsoDateFields) => WeekParts;
export type EpochMilliOp = (year: number, month?: number, day?: number) => number;
export type IsoFieldsOp = (year: number, month: number, day: number) => IsoDateFields;
export type MonthAddOp = (year: number, month: number, monthDelta: number) => YearMonthParts;
export type GetEraOrigins = () => Record<string, number> | undefined;
export type GetLeapMonthMeta = () => number | undefined;
export interface NativeCalendar {
    id?: string;
}
export type NativeYearMonthRefineDeps = NativeCalendar & {
    leapMonth: LeapMonthOp;
    monthsInYearPart: MonthsInYearPartOp;
    isoFields: IsoFieldsOp;
};
export type NativeDateRefineDeps = NativeYearMonthRefineDeps & {
    daysInMonthParts: DaysInMonthPartsOp;
};
export type NativeMonthDayRefineDeps = NativeDateRefineDeps & {
    yearMonthForMonthDay: YearMonthForMonthDayOp;
};
export type NativeYearMonthRefineOps = YearMonthRefineOps & NativeYearMonthRefineDeps;
export type NativeDateRefineOps = DateRefineOps & NativeDateRefineDeps;
export type NativeMonthDayRefineOps = MonthDayRefineOps & NativeMonthDayRefineDeps;
export type NativeYearMonthModOps = NativeYearMonthRefineOps & {
    mergeFields: MergeFieldsOp;
};
export type NativeDateModOps = NativeDateRefineOps & {
    mergeFields: MergeFieldsOp;
};
export type NativeMonthDayModOps = NativeMonthDayRefineOps & {
    mergeFields: MergeFieldsOp;
};
export type NativeConvertOps = {
    dateParts: DatePartsOp;
    epochMilli: EpochMilliOp;
    monthAdd: MonthAddOp;
};
export type NativeMoveOpsOnly = NativeConvertOps & {
    monthCodeParts: MonthCodePartsOp;
    monthsInYearPart: MonthsInYearPartOp;
    daysInMonthParts: DaysInMonthPartsOp;
    leapMonth: LeapMonthOp;
};
export type NativeMoveOps = MoveOps & NativeMoveOpsOnly;
export type NativeDiffOps = DiffOps & NativeMoveOpsOnly & {
    monthsInYearSpan: MonthsInYearSpanOp;
};
export type NativeYearMonthMoveOps = NativeMoveOps & DayOps;
export type NativeYearMonthDiffOps = NativeDiffOps & DayOps;
export interface NativeEraOps {
    era: EraOp;
    eraParts: EraPartsOp;
}
export interface NativeEraYearOps {
    eraYear: EraYearOp;
    eraParts: EraPartsOp;
}
export interface NativeMonthCodeOps {
    monthCode: MonthCodeOp;
    monthCodeParts: MonthCodePartsOp;
    dateParts: DatePartsOp;
}
export interface NativePartOps {
    dateParts: DatePartsOp;
    eraParts: EraPartsOp;
    monthCodeParts: MonthCodePartsOp;
}
export interface NativeInLeapYearOps {
    inLeapYear: InLeapYearOp;
    dateParts: DatePartsOp;
    inLeapYearPart: InLeapYearPartOp;
}
export interface NativeMonthsInYearOps {
    monthsInYear: MonthsInYearOp;
    dateParts: DatePartsOp;
    monthsInYearPart: MonthsInYearPartOp;
}
export interface NativeDaysInMonthOps {
    daysInMonth: DaysInMonthOp;
    dateParts: DatePartsOp;
    daysInMonthParts: DaysInMonthPartsOp;
}
export interface NativeDaysInYearOps {
    daysInYear: DaysInYearOp;
    dateParts: DatePartsOp;
    daysInYearPart: DaysInYearPartOp;
}
export interface NativeDayOfYearOps {
    dayOfYear: DayOfYearOp;
    dateParts: DatePartsOp;
    epochMilli: EpochMilliOp;
}
export interface NativeWeekOps extends NativeDayOfYearOps {
    weekOfYear: WeekOfYearOp;
    yearOfWeek: YearOfWeekOp;
    weekParts: WeekPartsOp;
}
export declare function computeNativeWeekOfYear(this: NativeWeekOps, isoFields: IsoDateFields): number | undefined;
export declare function computeNativeYearOfWeek(this: NativeWeekOps, isoFields: IsoDateFields): number | undefined;
export interface NativeMonthDayParseOps {
    dateParts: DatePartsOp;
    monthCodeParts: MonthCodePartsOp;
    yearMonthForMonthDay: YearMonthForMonthDayOp;
    isoFields: IsoFieldsOp;
}
export type NativeStandardOps = NativeYearMonthRefineOps & NativeDateRefineOps & NativeMonthDayRefineOps & NativeMoveOps & NativeDiffOps & NativeYearMonthModOps & NativeYearMonthDiffOps & NativeInLeapYearOps & NativeMonthsInYearOps & NativeDaysInMonthOps & NativeDaysInYearOps & NativeDayOfYearOps & NativeEraOps & NativeEraYearOps & NativeMonthCodeOps & NativePartOps & DayOps & // for PlainYearMonth parsing
NativeMonthDayParseOps & NativeWeekOps & {
    mergeFields: MergeFieldsOp;
    dayOfWeek(isoFields: IsoDateFields): number;
    daysInWeek(isoFields: IsoDateFields): number;
    year(isoFields: IsoDateFields): number;
    month(isoFields: IsoDateFields): number;
    day(isoFields: IsoDateFields): number;
};
export declare function computeNativeInLeapYear(this: NativeInLeapYearOps, isoFields: IsoDateFields): boolean;
export declare function computeNativeMonthsInYear(this: NativeMonthsInYearOps, isoFields: IsoDateFields): number;
export declare function computeNativeDaysInMonth(this: NativeDaysInMonthOps, isoFields: IsoDateFields): number;
export declare function computeNativeDaysInYear(this: NativeDaysInYearOps, isoFields: IsoDateFields): number;
export declare function computeNativeDayOfYear(this: NativeDayOfYearOps, isoFields: IsoDateFields): number;
export declare function computeNativeEra(this: NativeEraOps, isoFields: IsoDateFields): string | undefined;
export declare function computeNativeEraYear(this: NativeEraYearOps, isoFields: IsoDateFields): number | undefined;
export declare function computeNativeMonthCode(this: NativeMonthCodeOps, isoFields: IsoDateFields): string;
export declare function parseMonthCode(monthCode: string): [monthCodeNumber: number, isLeapMonth: boolean];
export declare function formatMonthCode(monthCodeNumber: number, isLeapMonth: boolean): string;
export declare function monthCodeNumberToMonth(monthCodeNumber: number, isLeapMonth: boolean | undefined, leapMonth: number | undefined): number;
export declare function monthToMonthCodeNumber(month: number, leapMonth?: number): number;
export declare function eraYearToYear(eraYear: number, eraOrigin: number): number;
export declare function getCalendarEraOrigins(native: NativeCalendar): Record<string, number> | undefined;
export declare function getCalendarLeapMonthMeta(native: NativeCalendar): number | undefined;
