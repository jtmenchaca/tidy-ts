import { isoCalendarId } from '../internal/calendarConfig.ts'
import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current.ts'
import {
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from '../internal/slots.ts'
import { queryNativeTimeZone } from '../internal/timeZoneNative.ts'
import {
  createPropDescriptors,
  createStringTagDescriptors,
} from '../internal/utils.ts'
import { Instant, createInstant } from './instant.ts'
import { PlainDate, createPlainDate } from './plainDate.ts'
import { PlainDateTime, createPlainDateTime } from './plainDateTime.ts'
import { PlainTime, createPlainTime } from './plainTime.ts'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg.ts'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime.ts'

export const Now = Object.defineProperties(
  {},
  {
    ...createStringTagDescriptors('Temporal.Now'),
    ...createPropDescriptors({
      timeZoneId() {
        return getCurrentTimeZoneId() // we call separately to return function.name
      },

      instant(): Instant {
        return createInstant(createInstantSlots(getCurrentEpochNano()))
      },

      zonedDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): ZonedDateTime {
        return createZonedDateTime(
          createZonedDateTimeSlots(
            getCurrentEpochNano(),
            refineTimeZoneArg(timeZoneArg),
            isoCalendarId,
          ),
        )
      },

      plainDateTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDateTime {
        return createPlainDateTime(
          createPlainDateTimeSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
            isoCalendarId,
          ),
        )
      },

      plainDateISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainDate {
        return createPlainDate(
          createPlainDateSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
            isoCalendarId,
          ),
        )
      },

      plainTimeISO(
        timeZoneArg: TimeZoneArg = getCurrentTimeZoneId(),
      ): PlainTime {
        return createPlainTime(
          createPlainTimeSlots(
            getCurrentIsoDateTime(
              queryNativeTimeZone(refineTimeZoneArg(timeZoneArg)),
            ),
          ),
        )
      },
    }),
  },
)
