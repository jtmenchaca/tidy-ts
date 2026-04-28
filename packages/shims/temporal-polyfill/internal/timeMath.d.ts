import { BigNano } from './bigNano.ts';
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './isoFields.ts';
export declare const maxMilli: number;
export declare function checkIsoYearMonthInBounds<T extends IsoDateFields>(isoFields: T): T;
export declare function checkIsoDateInBounds<T extends IsoDateFields>(isoFields: T): T;
export declare function checkIsoDateInBoundsStrict<T extends IsoDateFields>(isoFields: T): T;
export declare function checkIsoDateTimeInBounds<T extends IsoDateTimeFields>(isoFields: T): T;
export declare function checkEpochNanoInBounds(epochNano: BigNano | undefined): BigNano;
export declare function isoTimeFieldsToNano(isoTimeFields: IsoTimeFields): number;
export declare function nanoToIsoTimeAndDay(nano: number): [IsoTimeFields, number];
export declare function epochNanoToSec(epochNano: BigNano): number;
export declare function epochNanoToSecMod(epochNano: BigNano): [number, number];
export declare function epochNanoToMilli(epochNano: BigNano): number;
export declare function epochNanoToMicro(epochNano: BigNano): bigint;
export declare function epochMilliToNano(epochMilli: number): BigNano;
export declare function isoToEpochSec(isoDateTimeFields: IsoDateTimeFields): [number, number];
export declare function isoToEpochMilli(isoDateTimeFields: IsoDateTimeFields | IsoDateFields): number | undefined;
export declare function isoToEpochNano(isoFields: IsoDateTimeFields | IsoDateFields): BigNano | undefined;
export declare function isoToEpochNanoWithOffset(isoFields: IsoDateTimeFields, offsetNano: number): BigNano;
export type IsoTuple = [
    isoYear: number,
    isoMonth?: number,
    isoDay?: number,
    isoHour?: number,
    isoMinute?: number,
    isoSecond?: number,
    isoMilli?: number
];
export declare function isoArgsToEpochSec(...args: IsoTuple): number;
export declare function isoArgsToEpochMilli(...args: IsoTuple): number | undefined;
export declare function isoToLegacyDate(isoYear: number, isoMonth?: number, isoDay?: number, isoHour?: number, isoMinute?: number, isoSec?: number, isoMilli?: number): [Date, number];
export declare function epochNanoToIso(epochNano: BigNano, offsetNano: number): IsoDateTimeFields;
export declare function epochMilliToIso(epochMilli: number, isoMicrosecond?: number, isoNanosecond?: number): IsoDateTimeFields;
