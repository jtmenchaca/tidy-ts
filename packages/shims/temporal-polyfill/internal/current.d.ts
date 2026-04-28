import { BigNano } from './bigNano.ts';
import { IsoDateTimeFields } from './isoFields.ts';
import { TimeZoneOffsetOps } from './timeZoneOps.ts';
export declare function getCurrentIsoDateTime(timeZoneOps: TimeZoneOffsetOps): IsoDateTimeFields;
export declare function getCurrentEpochNano(): BigNano;
export declare function getCurrentTimeZoneId(): string;
