import {
  ZonedDateTimeBag,
  refineZonedDateTimeBag,
  zonedDateTimeWithFields,
} from '../internal/bagRefine.ts'
import { refineCalendarId } from '../internal/calendarId.ts'
import { createNativeStandardOps } from '../internal/calendarNativeQuery.ts'
import { compareZonedDateTimes, zonedDateTimesEqual } from '../internal/compare.ts'
import { constructZonedDateTimeSlots } from '../internal/construct.ts'
import {
  zonedDateTimeToInstant,
  zonedDateTimeToPlainDate,
  zonedDateTimeToPlainDateTime,
  zonedDateTimeToPlainTime,
} from '../internal/convert.ts'
import { diffZonedDateTimes } from '../internal/diff.ts'
import { DateTimeBag } from '../internal/fields.ts'
import { LocalesArg } from '../internal/intlFormatUtils.ts'
import { formatOffsetNano, formatZonedDateTimeIso } from '../internal/isoFormat.ts'
import { parseZonedDateTime } from '../internal/isoParse.ts'
import {
  slotsWithCalendarId,
  slotsWithTimeZoneId,
  zonedDateTimeWithPlainTime,
} from '../internal/modify.ts'
import { moveZonedDateTime } from '../internal/move.ts'
import {
  DiffOptions,
  DirectionOptions,
  OverflowOptions,
  RoundingOptions,
  ZonedDateTimeDisplayOptions,
  ZonedFieldOptions,
  refineDirectionOptions,
  refineZonedFieldOptions,
} from '../internal/optionsRefine.ts'
import {
  computeZonedHoursInDay,
  computeZonedStartOfDay,
  roundZonedDateTime,
} from '../internal/round.ts'
import {
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createDurationSlots,
} from '../internal/slots.ts'
import { refineTimeZoneId } from '../internal/timeZoneId.ts'
import { queryNativeTimeZone } from '../internal/timeZoneNative.ts'
import { FixedIsoFields, zonedEpochSlotsToIso } from '../internal/timeZoneOps.ts'
import { DayTimeUnitName, UnitName } from '../internal/units.ts'
import { NumberSign, bindArgs, isObjectLike, mapProps } from '../internal/utils.ts'
import {
  CalendarArg,
  getCalendarIdFromBag,
  refineCalendarArg,
} from './calendarArg.ts'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration.ts'
import { Instant, createInstant } from './instant.ts'
import { prepZonedDateTimeFormat } from './intlFormatConfig.ts'
import {
  calendarIdGetters,
  dateGetters,
  epochGetters,
  neverValueOf,
  timeGetters,
} from './mixins.ts'
import { PlainDate, createPlainDate } from './plainDate.ts'
import { PlainDateTime, createPlainDateTime } from './plainDateTime.ts'
import {
  PlainTime,
  PlainTimeArg,
  createPlainTime,
  optionalToPlainTimeFields,
} from './plainTime.ts'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass.ts'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg.ts'

export type ZonedDateTime = any
export type ZonedDateTimeArg = ZonedDateTime | ZonedDateTimeBag | string

export const [ZonedDateTime, createZonedDateTime] = createSlotClass(
  ZonedDateTimeBranding,
  bindArgs(constructZonedDateTimeSlots, refineCalendarId, refineTimeZoneId),
  {
    ...epochGetters,
    ...calendarIdGetters,
    ...adaptDateMethods(dateGetters),
    ...adaptDateMethods(timeGetters),
    offset(slots: ZonedDateTimeSlots): string {
      return formatOffsetNano(slotsToIso(slots).offsetNanoseconds)
    },
    offsetNanoseconds(slots: ZonedDateTimeSlots) {
      return slotsToIso(slots).offsetNanoseconds
    },
    timeZoneId(slots: ZonedDateTimeSlots): string {
      return slots.timeZone
    },
    hoursInDay(slots: ZonedDateTimeSlots): number {
      return computeZonedHoursInDay(queryNativeTimeZone, slots)
    },
  },
  {
    with(
      slots: ZonedDateTimeSlots,
      mod: DateTimeBag,
      options?: ZonedFieldOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithFields(
          createNativeStandardOps,
          queryNativeTimeZone,
          slots,
          rejectInvalidBag(mod),
          options,
        ),
      )
    },
    withCalendar(
      slots: ZonedDateTimeSlots,
      calendarArg: CalendarArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        slotsWithCalendarId(slots, refineCalendarArg(calendarArg)),
      )
    },
    withTimeZone(
      slots: ZonedDateTimeSlots,
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        slotsWithTimeZoneId(slots, refineTimeZoneArg(timeZoneArg)),
      )
    },
    withPlainTime(
      slots: ZonedDateTimeSlots,
      plainTimeArg?: PlainTimeArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        zonedDateTimeWithPlainTime(
          queryNativeTimeZone,
          slots,
          optionalToPlainTimeFields(plainTimeArg),
        ),
      )
    },
    add(
      slots: ZonedDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createNativeStandardOps,
          queryNativeTimeZone,
          false,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    subtract(
      slots: ZonedDateTimeSlots,
      durationArg: DurationArg,
      options?: OverflowOptions,
    ): ZonedDateTime {
      return createZonedDateTime(
        moveZonedDateTime(
          createNativeStandardOps,
          queryNativeTimeZone,
          true,
          slots,
          toDurationSlots(durationArg),
          options,
        ),
      )
    },
    until(
      slots: ZonedDateTimeSlots,
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createNativeStandardOps,
            queryNativeTimeZone,
            false,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
          ),
        ),
      )
    },
    since(
      slots: ZonedDateTimeSlots,
      otherArg: ZonedDateTimeArg,
      options?: DiffOptions<UnitName>,
    ): Duration {
      return createDuration(
        createDurationSlots(
          diffZonedDateTimes(
            createNativeStandardOps,
            queryNativeTimeZone,
            true,
            slots,
            toZonedDateTimeSlots(otherArg),
            options,
          ),
        ),
      )
    },
    round(
      slots: ZonedDateTimeSlots,
      options: DayTimeUnitName | RoundingOptions<DayTimeUnitName>,
    ): ZonedDateTime {
      return createZonedDateTime(
        roundZonedDateTime(queryNativeTimeZone, slots, options),
      )
    },
    startOfDay(slots: ZonedDateTimeSlots): ZonedDateTime {
      return createZonedDateTime(
        computeZonedStartOfDay(queryNativeTimeZone, slots),
      )
    },
    equals(slots: ZonedDateTimeSlots, otherArg: ZonedDateTimeArg): boolean {
      return zonedDateTimesEqual(slots, toZonedDateTimeSlots(otherArg))
    },
    toInstant(slots: ZonedDateTimeSlots): Instant {
      return createInstant(zonedDateTimeToInstant(slots))
    },
    toPlainDateTime(slots: ZonedDateTimeSlots): PlainDateTime {
      return createPlainDateTime(
        zonedDateTimeToPlainDateTime(queryNativeTimeZone, slots),
      )
    },
    toPlainDate(slots: ZonedDateTimeSlots): PlainDate {
      return createPlainDate(
        zonedDateTimeToPlainDate(queryNativeTimeZone, slots),
      )
    },
    toPlainTime(slots: ZonedDateTimeSlots): PlainTime {
      return createPlainTime(
        zonedDateTimeToPlainTime(queryNativeTimeZone, slots),
      )
    },
    toLocaleString(
      slots: ZonedDateTimeSlots,
      locales: LocalesArg,
      options: Intl.DateTimeFormatOptions = {},
    ): string {
      const [format, epochMilli] = prepZonedDateTimeFormat(
        locales,
        options,
        slots,
      )
      return format.format(epochMilli)
    },
    toString(
      slots: ZonedDateTimeSlots,
      options?: ZonedDateTimeDisplayOptions,
    ): string {
      return formatZonedDateTimeIso(queryNativeTimeZone, slots, options)
    },
    toJSON(slots: ZonedDateTimeSlots): string {
      return formatZonedDateTimeIso(queryNativeTimeZone, slots)
    },
    valueOf: neverValueOf,

    // TODO: optimize minification of this method
    getTimeZoneTransition(
      slots: ZonedDateTimeSlots,
      options: DirectionOptions,
    ): ZonedDateTime | null {
      const { timeZone: timeZoneId, epochNanoseconds: epochNano } = slots

      const direction = refineDirectionOptions(options)
      const timeZoneOps = queryNativeTimeZone(timeZoneId)
      const newEpochNano = timeZoneOps.getTransition(epochNano, direction)

      if (newEpochNano) {
        return createZonedDateTime({
          ...slots,
          epochNanoseconds: newEpochNano,
        })
      }

      return null
    },
  },
  {
    from(arg: any, options?: ZonedFieldOptions) {
      return createZonedDateTime(toZonedDateTimeSlots(arg, options))
    },
    compare(arg0: ZonedDateTimeArg, arg1: ZonedDateTimeArg): NumberSign {
      return compareZonedDateTimes(
        toZonedDateTimeSlots(arg0),
        toZonedDateTimeSlots(arg1),
      )
    },
  },
  (slots: ZonedDateTimeSlots) =>
    formatZonedDateTimeIso(queryNativeTimeZone, slots),
)

// Utils
// -----------------------------------------------------------------------------

export function toZonedDateTimeSlots(
  arg: ZonedDateTimeArg,
  options?: ZonedFieldOptions,
): ZonedDateTimeSlots {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === ZonedDateTimeBranding) {
      refineZonedFieldOptions(options) // parse unused options
      return slots as ZonedDateTimeSlots
    }

    const calendarId = getCalendarIdFromBag(arg as any)

    return refineZonedDateTimeBag(
      refineTimeZoneArg,
      queryNativeTimeZone,
      createNativeStandardOps(calendarId),
      calendarId,
      arg as any, // !!!
      options,
    )
  }

  return parseZonedDateTime(arg, options)
}

function adaptDateMethods(methods: any) {
  return mapProps((method: any) => {
    return (slots: ZonedDateTimeSlots) => {
      return method(slotsToIso(slots))
    }
  }, methods)
}

function slotsToIso(slots: ZonedDateTimeSlots): FixedIsoFields {
  return zonedEpochSlotsToIso(slots, queryNativeTimeZone)
}
