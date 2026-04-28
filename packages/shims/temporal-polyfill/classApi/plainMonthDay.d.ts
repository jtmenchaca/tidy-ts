import { PlainMonthDayBag } from '../internal/bagRefine.ts';
import { MonthDayFields } from '../internal/fields.ts';
import { OverflowOptions } from '../internal/optionsRefine.ts';
import { PlainMonthDaySlots } from '../internal/slots.ts';
export type PlainMonthDay = any & MonthDayFields;
export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag | string;
export declare const PlainMonthDay: any, createPlainMonthDay: any, getPlainMonthDaySlots: any;
export declare function toPlainMonthDaySlots(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDaySlots;
