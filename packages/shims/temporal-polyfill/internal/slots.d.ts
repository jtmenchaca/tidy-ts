import { BigNano } from './bigNano.ts';
import { DurationFields } from './durationFields.ts';
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields } from './isoFields.ts';
import { NumberSign } from './utils.ts';
export declare const PlainYearMonthBranding: "PlainYearMonth";
export declare const PlainMonthDayBranding: "PlainMonthDay";
export declare const PlainDateBranding: "PlainDate";
export declare const PlainDateTimeBranding: "PlainDateTime";
export declare const PlainTimeBranding: "PlainTime";
export declare const ZonedDateTimeBranding: "ZonedDateTime";
export declare const InstantBranding: "Instant";
export declare const DurationBranding: "Duration";
export declare function createInstantSlots(epochNano: BigNano): InstantSlots;
export declare function createZonedDateTimeSlots(epochNano: BigNano, timeZoneId: string, calendarId: string): ZonedDateTimeSlots;
export declare function createPlainDateTimeSlots(isoFields: IsoDateTimeFields & {
    calendar: string;
}): PlainDateTimeSlots;
export declare function createPlainDateTimeSlots(isoFields: IsoDateTimeFields, calendar: string): PlainDateTimeSlots;
export declare function createPlainDateSlots(isoFields: IsoDateFields & {
    calendar: string;
}): PlainDateSlots;
export declare function createPlainDateSlots(isoFields: IsoDateFields, calendar: string): PlainDateSlots;
export declare function createPlainYearMonthSlots(isoFields: IsoDateFields & {
    calendar: string;
}): PlainYearMonthSlots;
export declare function createPlainYearMonthSlots(isoFields: IsoDateFields, calendar: string): PlainYearMonthSlots;
export declare function createPlainMonthDaySlots(isoFields: IsoDateFields & {
    calendar: string;
}): PlainMonthDaySlots;
export declare function createPlainMonthDaySlots(isoFields: IsoDateFields, calendar: string): PlainMonthDaySlots;
export declare function createPlainTimeSlots(isoFields: IsoTimeFields): PlainTimeSlots;
export declare function createDurationSlots(durationFields: DurationFields): DurationSlots;
export type BrandingSlots = {
    branding: string;
};
export type EpochSlots = {
    epochNanoseconds: BigNano;
};
export type EpochAndZoneSlots = EpochSlots & {
    timeZone: string;
};
export type ZonedEpochSlots = EpochAndZoneSlots & {
    calendar: string;
};
export type DateSlots = IsoDateFields & {
    calendar: string;
};
export type DateTimeSlots = IsoDateTimeFields & {
    calendar: string;
};
export type PlainDateSlots = DateSlots & {
    branding: typeof PlainDateBranding;
};
export type PlainTimeSlots = IsoTimeFields & {
    branding: typeof PlainTimeBranding;
};
export type PlainDateTimeSlots = DateTimeSlots & {
    branding: typeof PlainDateTimeBranding;
};
export type ZonedDateTimeSlots = ZonedEpochSlots & {
    branding: typeof ZonedDateTimeBranding;
};
export type PlainMonthDaySlots = DateSlots & {
    branding: typeof PlainMonthDayBranding;
};
export type PlainYearMonthSlots = DateSlots & {
    branding: typeof PlainYearMonthBranding;
};
export type DurationSlots = DurationFields & {
    branding: typeof DurationBranding;
    sign: NumberSign;
};
export type InstantSlots = {
    branding: typeof InstantBranding;
    epochNanoseconds: BigNano;
};
export declare function getEpochSec(slots: EpochSlots): number;
export declare function getEpochMilli(slots: EpochSlots): number;
export declare function getEpochMicro(slots: EpochSlots): bigint;
export declare function getEpochNano(slots: EpochSlots): bigint;
export declare function extractEpochNano(slots: EpochSlots): BigNano;
