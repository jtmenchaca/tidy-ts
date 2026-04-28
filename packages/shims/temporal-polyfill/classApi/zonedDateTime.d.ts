import { ZonedDateTimeBag } from '../internal/bagRefine.ts';
import { ZonedFieldOptions } from '../internal/optionsRefine.ts';
import { ZonedDateTimeSlots } from '../internal/slots.ts';
export type ZonedDateTime = any;
export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag | string;
export declare const ZonedDateTime: any, createZonedDateTime: any;
export declare function toZonedDateTimeSlots(arg: ZonedDateTimeArg, options?: ZonedFieldOptions): ZonedDateTimeSlots;
