import { BigNano } from './bigNano.ts';
import { MoveOps } from './calendarOps.ts';
import { DurationFields } from './durationFields.ts';
import { IsoDateTimeFields, IsoTimeFields } from './isoFields.ts';
import { Marker, MarkerToEpochNano, MoveMarker } from './markerSystem.ts';
import { RoundingMode } from './options.ts';
import { RoundingOptions } from './optionsRefine.ts';
import { DateTimeSlots, InstantSlots, PlainDateTimeSlots, PlainTimeSlots, ZonedDateTimeSlots, ZonedEpochSlots } from './slots.ts';
import { TimeZoneOps } from './timeZoneOps.ts';
import { DayTimeUnit, DayTimeUnitName, TimeUnitName, Unit } from './units.ts';
export declare function roundInstant(instantSlots: InstantSlots, options: TimeUnitName | RoundingOptions<TimeUnitName>): InstantSlots;
export declare function roundZonedDateTime(getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, slots: ZonedDateTimeSlots, options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>): ZonedDateTimeSlots;
export declare function roundPlainDateTime(slots: PlainDateTimeSlots, options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>): PlainDateTimeSlots;
export declare function roundPlainTime(slots: PlainTimeSlots, options: TimeUnitName | RoundingOptions<TimeUnitName>): PlainTimeSlots;
export declare function computeZonedHoursInDay(getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, slots: ZonedDateTimeSlots): number;
export declare function computeZonedStartOfDay(getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, slots: ZonedDateTimeSlots): ZonedDateTimeSlots;
export declare function alignZonedEpoch(computeAlignment: (slots: DateTimeSlots) => IsoDateTimeFields, timeZoneOps: TimeZoneOps, slots: ZonedDateTimeSlots): BigNano;
export declare function roundZonedEpochToInterval(computeInterval: (slots: DateTimeSlots) => IsoDateTimeInterval, timeZoneOps: TimeZoneOps, slots: ZonedEpochSlots, roundingMode: RoundingMode): BigNano;
export declare function roundDateTimeToNano(isoFields: IsoDateTimeFields, nanoInc: number, roundingMode: RoundingMode): IsoDateTimeFields;
export declare function roundTimeToNano(isoFields: IsoTimeFields, nanoInc: number, roundingMode: RoundingMode): [IsoTimeFields, number];
export declare function roundToMinute(offsetNano: number): number;
export declare function computeNanoInc(smallestUnit: DayTimeUnit, roundingInc: number): number;
export type IsoDateTimeInterval = [IsoDateTimeFields, IsoDateTimeFields];
export declare function computeDayInterval(isoFields: IsoDateTimeFields): IsoDateTimeInterval;
export declare function computeDayFloor(isoFields: IsoDateTimeFields): IsoDateTimeFields;
export declare function roundDayTimeDurationByInc(durationFields: DurationFields, nanoInc: number, roundingMode: RoundingMode): Partial<DurationFields>;
export declare function roundDayTimeDuration(durationFields: DurationFields, largestUnit: DayTimeUnit, smallestUnit: DayTimeUnit, roundingInc: number, roundingMode: RoundingMode): DurationFields;
export declare function roundRelativeDuration(durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
endEpochNano: BigNano, largestUnit: Unit, smallestUnit: Unit, roundingInc: number, roundingMode: RoundingMode, calendarOps: MoveOps, marker: Marker, markerToEpochNano: MarkerToEpochNano, moveMarker: MoveMarker): DurationFields;
export declare function roundBigNano(bigNano: BigNano, smallestUnit: DayTimeUnit, roundingInc: number, roundingMode: RoundingMode, useDayOrigin?: boolean): BigNano;
export declare function roundBigNanoByInc(bigNano: BigNano, nanoInc: number, // REQUIRED: a single day must be divisible by this!
roundingMode: RoundingMode, useDayOrigin?: boolean): BigNano;
export declare function roundByInc(num: number, inc: number, roundingMode: RoundingMode): number;
export declare function roundWithMode(num: number, roundingMode: RoundingMode): number;
export declare function nudgeRelativeDuration(durationFields: DurationFields, // must be balanced & top-heavy in day or larger (so, small time-fields)
endEpochNano: BigNano, _largestUnit: Unit, smallestUnit: Unit, // always >Day
roundingInc: number, roundingMode: RoundingMode, calendarOps: MoveOps, marker: Marker, markerToEpochNano: MarkerToEpochNano, moveMarker: MoveMarker): [
    durationFields: DurationFields,
    movedEpochNano: BigNano,
    expandedBigUnit: boolean
];
