import { requireInteger, requireIntegerOrUndefined, requirePositiveInteger, requirePositiveIntegerOrUndefined, requireStringOrUndefined } from '../internal/cast.ts';
export declare const yearMonthOnlyRefiners: {
    era: typeof requireStringOrUndefined;
    eraYear: typeof requireIntegerOrUndefined;
    year: typeof requireInteger;
    month: typeof requirePositiveInteger;
    daysInMonth: typeof requirePositiveInteger;
    daysInYear: typeof requirePositiveInteger;
    inLeapYear: (arg: boolean, entityName?: string) => boolean;
    monthsInYear: typeof requirePositiveInteger;
};
export declare const monthOnlyRefiners: {
    monthCode: (arg: string, entityName?: string) => string;
};
export declare const dayOnlyRefiners: {
    day: typeof requirePositiveInteger;
};
export declare const dateOnlyRefiners: {
    dayOfWeek: typeof requirePositiveInteger;
    dayOfYear: typeof requirePositiveInteger;
    weekOfYear: typeof requirePositiveIntegerOrUndefined;
    yearOfWeek: typeof requireIntegerOrUndefined;
    daysInWeek: typeof requirePositiveInteger;
};
export declare const dateRefiners: {
    dayOfWeek: typeof requirePositiveInteger;
    dayOfYear: typeof requirePositiveInteger;
    weekOfYear: typeof requirePositiveIntegerOrUndefined;
    yearOfWeek: typeof requireIntegerOrUndefined;
    daysInWeek: typeof requirePositiveInteger;
    day: typeof requirePositiveInteger;
    monthCode: (arg: string, entityName?: string) => string;
    era: typeof requireStringOrUndefined;
    eraYear: typeof requireIntegerOrUndefined;
    year: typeof requireInteger;
    month: typeof requirePositiveInteger;
    daysInMonth: typeof requirePositiveInteger;
    daysInYear: typeof requirePositiveInteger;
    inLeapYear: (arg: boolean, entityName?: string) => boolean;
    monthsInYear: typeof requirePositiveInteger;
};
