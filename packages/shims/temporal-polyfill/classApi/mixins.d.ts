import { getEpochMilli, getEpochNano } from '../internal/slots.ts';
export declare const dateGetters: {
    dayOfWeek: () => any;
    dayOfYear: () => any;
    weekOfYear: () => any;
    yearOfWeek: () => any;
    daysInWeek: () => any;
    day: () => any;
    monthCode: () => any;
    era: () => any;
    eraYear: () => any;
    year: () => any;
    month: () => any;
    daysInMonth: () => any;
    daysInYear: () => any;
    inLeapYear: () => any;
    monthsInYear: () => any;
};
export declare const yearMonthGetters: {
    monthCode: () => any;
    era: () => any;
    eraYear: () => any;
    year: () => any;
    month: () => any;
    daysInMonth: () => any;
    daysInYear: () => any;
    inLeapYear: () => any;
    monthsInYear: () => any;
};
export declare const monthDayGetters: {
    day: () => any;
    monthCode: () => any;
};
export declare const calendarIdGetters: {
    calendarId(slots: any): string;
};
export declare const durationGetters: {
    sign: (this: any, slots: any) => any;
    years: (this: any, slots: any) => any;
    months: (this: any, slots: any) => any;
    weeks: (this: any, slots: any) => any;
    days: (this: any, slots: any) => any;
    hours: (this: any, slots: any) => any;
    minutes: (this: any, slots: any) => any;
    seconds: (this: any, slots: any) => any;
    milliseconds: (this: any, slots: any) => any;
    microseconds: (this: any, slots: any) => any;
    nanoseconds: (this: any, slots: any) => any;
    branding: (this: any, slots: any) => any;
};
export declare const timeGetters: {
    nanosecond: (this: any, slots: any) => any;
    microsecond: (this: any, slots: any) => any;
    millisecond: (this: any, slots: any) => any;
    second: (this: any, slots: any) => any;
    minute: (this: any, slots: any) => any;
    hour: (this: any, slots: any) => any;
};
export declare const epochGetters: {
    epochMilliseconds: typeof getEpochMilli;
    epochNanoseconds: typeof getEpochNano;
};
export declare function neverValueOf(): void;
