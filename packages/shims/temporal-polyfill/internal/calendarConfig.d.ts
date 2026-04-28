export declare const isoCalendarId = "iso8601";
export declare const gregoryCalendarId = "gregory";
export declare const japaneseCalendarId = "japanese";
export declare const eraOriginsByCalendarId: {
    [calendarId: string]: Record<string, number>;
};
export declare const eraRemapsByCalendarId: {
    [calendarId: string]: Record<string, string>;
};
export declare const leapMonthMetas: Record<string, number>;
export declare function getRequiredYearMonthFields(calendarId: string): string[];
export declare function getRequiredMonthDayFields(calendarId: string): string[];
export declare function getRequiredDateFields(calendarId: string): string[];
