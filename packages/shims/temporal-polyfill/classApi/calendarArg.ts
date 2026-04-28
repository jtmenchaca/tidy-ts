import { isoCalendarId } from '../internal/calendarConfig.ts'
import { resolveCalendarId } from '../internal/calendarId.ts'
import { requireString } from '../internal/cast.ts'
import * as errorMessages from '../internal/errorMessages.ts'
import { parseCalendarId } from '../internal/isoParse.ts'
import { isObjectLike } from '../internal/utils.ts'
import { PlainDate } from './plainDate.ts'
import { PlainDateTime } from './plainDateTime.ts'
import { PlainMonthDay } from './plainMonthDay.ts'
import { PlainYearMonth } from './plainYearMonth.ts'
import { getSlots } from './slotClass.ts'
import { ZonedDateTime } from './zonedDateTime.ts'

export type CalendarArg =
  | string
  | PlainDate
  | PlainDateTime
  | ZonedDateTime
  | PlainMonthDay
  | PlainYearMonth

/*
Falls back to ISO
*/
export function getCalendarIdFromBag(bag: {
  calendar?: CalendarArg
}): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

/*
Can return undefined
*/
export function extractCalendarIdFromBag(bag: { calendar?: CalendarArg }):
  | string
  | undefined {
  const { calendar: calendarArg } = bag
  if (calendarArg !== undefined) {
    return refineCalendarArg(calendarArg)
  }
}

/*
Returns a calendarId
*/
export function refineCalendarArg(arg: CalendarArg): string {
  if (isObjectLike(arg)) {
    const { calendar } = (getSlots(arg) || {}) as { calendar?: string }
    if (!calendar) {
      // TODO: better message how non-Temporal objects aren't allowed
      throw new TypeError(errorMessages.invalidCalendar(arg as any))
    }
    return calendar // other object already refined it
  }
  return refineCalendarString(arg)
}

/*
Like refineCalendarId, but allows different string formats, like datetime string
*/
function refineCalendarString(arg: string): string {
  return resolveCalendarId(parseCalendarId(requireString(arg)))
}
