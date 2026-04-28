import type { Temporal as TemporalSpec } from '../../temporal-spec/index.d.ts';
import { CalendarDisplay, Direction, EpochDisambig, OffsetDisambig, OffsetDisplay, Overflow, RoundingMode, SubsecDigits, TimeZoneDisplay } from './options.ts';
import { DateUnitName, DayTimeUnit, DayTimeUnitName, TimeUnit, TimeUnitName, Unit, UnitName } from './units.ts';
export type ZonedFieldOptions = OverflowOptions & EpochDisambigOptions & OffsetDisambigOptions;
export type ZonedFieldTuple = [Overflow, OffsetDisambig, EpochDisambig];
export type RoundingMathOptions = RoundingIncOptions & RoundingModeOptions;
export type DiffOptions<UN extends UnitName> = LargestUnitOptions<UN> & SmallestUnitOptions<UN> & RoundingMathOptions;
export type RoundingMathTuple = [
    roundingInc: number,
    roundingMode: RoundingMode
];
export type RoundingTuple = [smallestUnit: Unit, ...RoundingMathTuple];
export type DiffTuple = [larestUnit: Unit, ...RoundingTuple];
export type RoundingOptions<UN extends DayTimeUnitName> = Required<SmallestUnitOptions<UN>> & RoundingMathOptions;
export type DurationRoundingOptions<RA> = Required<SmallestUnitOptions<UnitName>> & LargestUnitOptions<UnitName> & RoundingMathOptions & RelativeToOptions<RA>;
export type DurationRoundingTuple<R> = [...DiffTuple, R];
export type TimeDisplayTuple = [
    roundingMode: RoundingMode,
    nanoInc: number,
    subsecDigits: SubsecDigits | -1 | undefined
];
export type TimeDisplayOptions = SmallestUnitOptions<TimeUnitName> & RoundingModeOptions & SubsecDigitsOptions;
export type ZonedDateTimeDisplayOptions = CalendarDisplayOptions & TimeZoneDisplayOptions & OffsetDisplayOptions & TimeDisplayOptions;
export type ZonedDateTimeDisplayTuple = [
    CalendarDisplay,
    TimeZoneDisplay,
    OffsetDisplay,
    ...TimeDisplayTuple
];
export type RelativeToOptions<RA> = {
    relativeTo?: RA;
};
export type DurationTotalOptions<RA> = TotalUnitOptions & RelativeToOptions<RA>;
export type DateTimeDisplayOptions = CalendarDisplayOptions & TimeDisplayOptions;
export type DateTimeDisplayTuple = [CalendarDisplay, ...TimeDisplayTuple];
export interface SmallestUnitOptions<UN extends UnitName> {
    smallestUnit?: UN;
}
export interface LargestUnitOptions<UN extends UnitName> {
    largestUnit?: UN;
}
export interface TotalUnitOptions {
    unit: UnitName;
}
export type InstantDisplayOptions = {
    timeZone?: string;
} & TimeDisplayOptions;
export type InstantDisplayTuple = [string | undefined, ...TimeDisplayTuple];
export interface OverflowOptions {
    overflow?: TemporalSpec.AssignmentOptions['overflow'];
}
export interface EpochDisambigOptions {
    disambiguation?: TemporalSpec.ToInstantOptions['disambiguation'];
}
export interface OffsetDisambigOptions {
    offset?: TemporalSpec.OffsetDisambiguationOptions['offset'];
}
export interface CalendarDisplayOptions {
    calendarName?: TemporalSpec.ShowCalendarOption['calendarName'];
}
export interface TimeZoneDisplayOptions {
    timeZoneName?: TemporalSpec.ZonedDateTimeToStringOptions['timeZoneName'];
}
export interface OffsetDisplayOptions {
    offset?: TemporalSpec.ZonedDateTimeToStringOptions['offset'];
}
export type RoundingModeName = TemporalSpec.DifferenceOptions<any>['roundingMode'];
export interface RoundingModeOptions {
    roundingMode?: RoundingModeName;
}
export interface RoundingIncOptions {
    roundingIncrement?: TemporalSpec.DifferenceOptions<any>['roundingIncrement'];
}
export interface SubsecDigitsOptions {
    fractionalSecondDigits?: SubsecDigits;
}
export type DirectionName = TemporalSpec.TransitionDirection;
export interface DirectionOptions {
    direction: DirectionName;
}
declare const overflowMap: {
    constrain: Overflow;
    reject: Overflow;
};
export declare const overflowMapNames: (keyof typeof overflowMap)[];
export declare function refineOverflowOptions(options: OverflowOptions | undefined): Overflow;
export declare function refineZonedFieldOptions(options: ZonedFieldOptions | undefined, defaultOffsetDisambig?: OffsetDisambig): ZonedFieldTuple;
export declare function refineEpochDisambigOptions(options: EpochDisambigOptions | undefined): EpochDisambig;
export declare function refineDateDiffOptions(options: LargestUnitOptions<DateUnitName> | undefined): Unit;
export declare function refineDiffOptions<UN extends UnitName>(roundingModeInvert: boolean | undefined, options: DiffOptions<UN> | undefined, defaultLargestUnit: Unit, maxUnit?: Unit, minUnit?: Unit, defaultRoundingMode?: RoundingMode): DiffTuple;
export declare function refineDurationRoundOptions<RA, R>(options: DurationRoundingOptions<RA> | UnitName, defaultLargestUnit: Unit, refineRelativeTo: (relativeTo?: RA) => R): DurationRoundingTuple<R>;
export declare function refineRoundingOptions<UN extends DayTimeUnitName>(options: RoundingOptions<UN> | UN, maxUnit?: DayTimeUnit, solarMode?: boolean): RoundingTuple;
export declare function refineUnitDiffOptions(smallestUnit: Unit, options: RoundingModeName | RoundingMathOptions): RoundingMathTuple | [undefined, undefined];
export declare function refineUnitRoundOptions(smallestUnit: Unit, options: RoundingModeName | RoundingMathOptions): RoundingMathTuple;
export declare function refineTotalOptions<RA, R>(options: UnitName | DurationTotalOptions<RA>, refineRelativeTo: (relativeTo?: RA) => R | undefined): [Unit, R | undefined];
export declare function refineDateTimeDisplayOptions(options: DateTimeDisplayOptions | undefined): DateTimeDisplayTuple;
export declare function refineDateDisplayOptions(options: CalendarDisplayOptions | undefined): CalendarDisplay;
export declare function refineTimeDisplayOptions(options: TimeDisplayOptions | undefined, maxSmallestUnit?: TimeUnit): TimeDisplayTuple;
export declare function refineZonedDateTimeDisplayOptions(options: ZonedDateTimeDisplayOptions | undefined): ZonedDateTimeDisplayTuple;
export declare function refineInstantDisplayOptions(options: InstantDisplayOptions | undefined): InstantDisplayTuple;
export declare function refineDirectionOptions(options: DirectionOptions | DirectionName): Direction;
export declare function normalizeOptions<O extends {}>(options: O | undefined): O;
export declare function fabricateOverflowOptions(overflow: Overflow): OverflowOptions;
export {};
