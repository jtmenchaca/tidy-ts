import { IsoTimeFields } from './isoFields.ts';
import { PlainDateSlots, PlainDateTimeSlots, ZonedDateTimeSlots } from './slots.ts';
import { TimeZoneOps } from './timeZoneOps.ts';
export declare function zonedDateTimeWithPlainTime(getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, zonedDateTimeSlots: ZonedDateTimeSlots, plainTimeSlots: IsoTimeFields | undefined): ZonedDateTimeSlots;
export declare function zonedDateTimeWithPlainDate(getTimeZoneOps: (timeZoneId: string) => TimeZoneOps, zonedDateTimeSlots: ZonedDateTimeSlots, plainDateSlots: PlainDateSlots): ZonedDateTimeSlots;
export declare function plainDateTimeWithPlainTime(plainDateTimeSlots: PlainDateTimeSlots, plainTimeSlots?: IsoTimeFields): PlainDateTimeSlots;
export declare function plainDateTimeWithPlainDate(plainDateTimeSlots: PlainDateTimeSlots, plainDateSlots: PlainDateSlots): PlainDateTimeSlots;
export declare function slotsWithCalendarId<S extends {
    calendar: string;
}>(slots: S, calendarId: string): S;
export declare function slotsWithTimeZoneId<S extends {
    timeZone: string;
}>(slots: S, timeZoneId: string): S;
