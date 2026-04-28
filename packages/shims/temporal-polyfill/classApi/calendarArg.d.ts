import { PlainDate } from './plainDate.ts';
import { PlainDateTime } from './plainDateTime.ts';
import { PlainMonthDay } from './plainMonthDay.ts';
import { PlainYearMonth } from './plainYearMonth.ts';
import { ZonedDateTime } from './zonedDateTime.ts';
export type CalendarArg = string | PlainDate | PlainDateTime | ZonedDateTime | PlainMonthDay | PlainYearMonth;
export declare function getCalendarIdFromBag(bag: {
    calendar?: CalendarArg;
}): string;
export declare function extractCalendarIdFromBag(bag: {
    calendar?: CalendarArg;
}): string | undefined;
export declare function refineCalendarArg(arg: CalendarArg): string;
