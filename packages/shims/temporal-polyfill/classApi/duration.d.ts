import { DurationFields } from '../internal/durationFields.ts';
import { DurationBag } from '../internal/fields.ts';
import { DurationSlots } from '../internal/slots.ts';
export type Duration = any & DurationFields;
export type DurationArg = Duration | DurationBag | string;
export declare const Duration: any, createDuration: any, getDurationSlots: any;
export declare function toDurationSlots(arg: DurationArg): DurationSlots;
