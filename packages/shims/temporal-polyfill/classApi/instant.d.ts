import { InstantSlots } from '../internal/slots.ts';
export type Instant = any;
export type InstantArg = Instant | string;
export declare const Instant: any, createInstant: any, getInstantSlots: any;
export declare function toInstantSlots(arg: InstantArg): InstantSlots;
export declare function toTemporalInstant(this: Date): Instant;
