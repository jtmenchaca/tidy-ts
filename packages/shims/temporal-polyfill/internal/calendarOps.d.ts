import { DurationFields } from './durationFields.ts';
import { DateBag, YearMonthBag } from './fields.ts';
import { IsoDateFields } from './isoFields.ts';
import { DiffOptions, OverflowOptions } from './optionsRefine.ts';
import { PlainDateSlots, PlainMonthDaySlots, PlainYearMonthSlots } from './slots.ts';
import { DateUnitName, Unit } from './units.ts';
export type DateFromFieldsOp = (fields: DateBag, options?: OverflowOptions) => PlainDateSlots;
export type YearMonthFromFieldsOp = (fields: YearMonthBag, options?: OverflowOptions) => PlainYearMonthSlots;
export type MonthDayFromFieldsOp = (fields: DateBag, options?: OverflowOptions) => PlainMonthDaySlots;
export type FieldsOp = (fieldNames: string[]) => string[];
export type MergeFieldsOp = (fields: DateBag, additionalFields: DateBag) => DateBag;
export type DateAddOp = (isoFields: IsoDateFields, durationFields: DurationFields, options?: OverflowOptions) => IsoDateFields;
export type DateUntilOp = (isoFields0: IsoDateFields, isoFields1: IsoDateFields, largestUnit: Unit, origOptions?: DiffOptions<DateUnitName>) => DurationFields;
export type DayOp = (isoFields: IsoDateFields) => number;
export type DateRefineOps = {
    dateFromFields: DateFromFieldsOp;
    fields: FieldsOp;
};
export type YearMonthRefineOps = {
    yearMonthFromFields: YearMonthFromFieldsOp;
    fields: FieldsOp;
};
export type MonthDayRefineOps = {
    monthDayFromFields: MonthDayFromFieldsOp;
    fields: FieldsOp;
};
export type YearMonthModOps = YearMonthRefineOps & {
    mergeFields: MergeFieldsOp;
};
export type DateModOps = DateRefineOps & {
    mergeFields: MergeFieldsOp;
};
export type MonthDayModOps = MonthDayRefineOps & {
    mergeFields: MergeFieldsOp;
};
export type MoveOps = {
    dateAdd: DateAddOp;
};
export type DiffOps = {
    dateAdd: DateAddOp;
    dateUntil: DateUntilOp;
};
export type DayOps = {
    day: DayOp;
};
export type YearMonthMoveOps = MoveOps & DayOps;
export type YearMonthDiffOps = DiffOps & DayOps;
