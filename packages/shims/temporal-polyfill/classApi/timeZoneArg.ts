import { requireString } from '../internal/cast.ts'
import * as errorMessages from '../internal/errorMessages.ts'
import { parseTimeZoneId } from '../internal/isoParse.ts'
import { resolveTimeZoneId } from '../internal/timeZoneId.ts'
import { isObjectLike } from '../internal/utils.ts'
import { getSlots } from './slotClass.ts'
import { ZonedDateTime } from './zonedDateTime.ts'

export type TimeZoneArg = string | ZonedDateTime

/*
Returns a timeZoneId
*/
export function refineTimeZoneArg(arg: TimeZoneArg): string {
  if (isObjectLike(arg)) {
    const { timeZone } = (getSlots(arg) || {}) as { timeZone?: string }
    if (!timeZone) {
      // TODO: better message how non-Temporal objects aren't allowed
      throw new TypeError(errorMessages.invalidTimeZone(arg as any)) // !!!
    }
    return timeZone
  }
  return refineTimeZoneString(arg)
}

/*
Like refineTimeZoneId, but allows different string formats, like datetime string
*/
function refineTimeZoneString(arg: string): string {
  return resolveTimeZoneId(parseTimeZoneId(requireString(arg)))
}
