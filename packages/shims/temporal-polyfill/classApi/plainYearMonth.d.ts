import { PlainYearMonthBag } from '../internal/bagRefine.ts';
import { YearMonthFields } from '../internal/fields.ts';
import { OverflowOptions } from '../internal/optionsRefine.ts';
import { PlainYearMonthSlots } from '../internal/slots.ts';
export type PlainYearMonth = any & YearMonthFields;
export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag | string;
export declare const PlainYearMonth: any, createPlainYearMonth: any, getPlainYearMonthSlots: any;
export declare function toPlainYearMonthSlots(arg: PlainYearMonthArg, options?: OverflowOptions): PlainYearMonthSlots;
