import { PlainDateBag } from '../internal/bagRefine.ts';
import { DateFields } from '../internal/fields.ts';
import { OverflowOptions } from '../internal/optionsRefine.ts';
import { PlainDateSlots } from '../internal/slots.ts';
export type PlainDate = any & DateFields;
export type PlainDateArg = PlainDate | PlainDateBag | string;
export declare const PlainDate: any, createPlainDate: any, getPlainDateSlots: any;
export declare function toPlainDateSlots(arg: PlainDateArg, options?: OverflowOptions): PlainDateSlots;
