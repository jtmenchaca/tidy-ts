import { BigNano } from './bigNano.ts';
import { DateTimeFields } from './fields.ts';
import { IsoDateTimeFields } from './isoFields.ts';
import { EpochDisambig, OffsetDisambig } from './options.ts';
import { ZonedDateTimeSlots, ZonedEpochSlots } from './slots.ts';
import { NativeTimeZone } from './timeZoneNative.ts';
export type OffsetNanosecondsOp = (epochNano: BigNano) => number;
export type PossibleInstantsOp = (isoFields: IsoDateTimeFields) => BigNano[];
export type TimeZoneOps = {
    getOffsetNanosecondsFor: OffsetNanosecondsOp;
    getPossibleInstantsFor: PossibleInstantsOp;
};
export type TimeZoneOffsetOps = {
    getOffsetNanosecondsFor: OffsetNanosecondsOp;
};
export type FixedIsoFields = IsoDateTimeFields & {
    calendar: string;
    offsetNanoseconds: number;
};
export type ZonedIsoFields = IsoDateTimeFields & {
    calendar: string;
    timeZone: string;
    offset: string;
};
export type ZonedDateTimeFields = DateTimeFields & {
    offset: string;
};
export declare const zonedEpochSlotsToIso: typeof _zonedEpochSlotsToIso;
declare function _zonedEpochSlotsToIso(slots: ZonedEpochSlots, getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps): FixedIsoFields;
declare function _zonedEpochSlotsToIso(slots: ZonedEpochSlots, timeZoneOps: TimeZoneOffsetOps): FixedIsoFields;
export declare function buildZonedIsoFields(getTimeZoneOps: (timeZoneId: string) => TimeZoneOffsetOps, zonedDateTimeSlots: ZonedDateTimeSlots): ZonedIsoFields;
export declare function getMatchingInstantFor(timeZoneOps: TimeZoneOps, isoFields: IsoDateTimeFields, offsetNano: number | undefined, offsetDisambig?: OffsetDisambig, epochDisambig?: EpochDisambig, epochFuzzy?: boolean, hasZ?: boolean): BigNano;
export declare function getSingleInstantFor(timeZoneOps: TimeZoneOps, isoFields: IsoDateTimeFields, disambig?: EpochDisambig, possibleEpochNanos?: BigNano[]): BigNano;
export declare function getStartOfDayInstantFor(timeZoneOps: NativeTimeZone, isoFields: IsoDateTimeFields): BigNano;
export declare function validateTimeZoneOffset(offsetNano: number): number;
export declare function validateTimeZoneGap(gapNano: number): number;
export {};
