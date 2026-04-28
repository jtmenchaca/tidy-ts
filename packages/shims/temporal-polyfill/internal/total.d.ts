import { BigNano } from './bigNano.ts';
import { DiffOps, MoveOps } from './calendarOps.ts';
import { DurationFields } from './durationFields.ts';
import { Marker, MarkerToEpochNano, MoveMarker, RelativeToSlots } from './markerSystem.ts';
import { DurationTotalOptions } from './optionsRefine.ts';
import { DurationSlots } from './slots.ts';
import { TimeZoneOps } from './timeZoneOps.ts';
import { Unit, UnitName } from './units.ts';
export declare function totalDuration<RA>(refineRelativeTo: (relativeToArg?: RA) => RelativeToSlots | undefined, getCalendarOps: (calendarId: string) => DiffOps, getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, slots: DurationSlots, options: UnitName | DurationTotalOptions<RA>): number;
export declare function totalRelativeDuration(durationFields: DurationFields, endEpochNano: BigNano, totalUnit: Unit, // always >=Day
calendarOps: MoveOps, marker: Marker, markerToEpochNano: MarkerToEpochNano, moveMarker: MoveMarker): number;
export declare function clampRelativeDuration(calendarOps: MoveOps, durationFields: DurationFields, clampUnit: Unit, // always >=Day
clampDistance: number, marker: Marker, markerToEpochNano: MarkerToEpochNano, moveMarker: MoveMarker): BigNano[];
export declare function computeEpochNanoFrac(epochNanoProgress: BigNano, epochNano0: BigNano, epochNano1: BigNano): number;
