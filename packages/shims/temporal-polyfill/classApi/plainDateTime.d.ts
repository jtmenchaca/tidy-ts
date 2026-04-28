import { PlainDateTimeBag } from '../internal/bagRefine.ts';
import { DateTimeFields } from '../internal/fields.ts';
import { OverflowOptions } from '../internal/optionsRefine.ts';
import { PlainDateTimeSlots } from '../internal/slots.ts';
export type PlainDateTime = any & DateTimeFields;
export type PlainDateTimeArg = PlainDateTime | PlainDateTimeBag | string;
export declare const PlainDateTime: any, createPlainDateTime: any;
export declare function toPlainDateTimeSlots(arg: PlainDateTimeArg, options?: OverflowOptions): PlainDateTimeSlots;
