import { ZonedDateTime } from './zonedDateTime.ts';
export type TimeZoneArg = string | ZonedDateTime;
export declare function refineTimeZoneArg(arg: TimeZoneArg): string;
