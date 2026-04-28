import {
  PlainTimeBag,
  plainTimeWithFields,
  refinePlainTimeBag,
} from '../internal/bagRefine.ts'
import { compareIsoTimeFields, plainTimesEqual } from '../internal/compare.ts'
import { constructPlainTimeSlots } from '../internal/construct.ts'
import { zonedDateTimeToPlainTime } from '../internal/convert.ts'
import { diffPlainTimes } from '../internal/diff.ts'
import { TimeBag, TimeFields } from '../internal/fields.ts'
import { LocalesArg } from '../internal/intlFormatUtils.ts'
import { IsoTimeFields } from '../internal/isoFields.ts'
import { formatPlainTimeIso } from '../internal/isoFormat.ts'
import { parsePlainTime } from '../internal/isoParse.ts'
import { movePlainTime } from '../internal/move.ts'
import {
  DiffOptions,
  OverflowOptions,
  RoundingOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine.ts'
import { roundPlainTime } from '../internal/round.ts'
import {
  BrandingSlots,
  PlainDateTimeBranding,
  PlainDateTimeSlots,
  PlainTimeBranding,
  PlainTimeSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createPlainTimeSlots,
} from '../internal/slots.ts'
import { queryNativeTimeZone } from '../internal/timeZoneNative.ts'
import { TimeUnitName } from '../internal/units.ts'
import { NumberSign, isObjectLike } from '../internal/utils.ts'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration.ts'
import { prepPlainTimeFormat } from './intlFormatConfig.ts'
import { neverValueOf, timeGetters } from './mixins.ts'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass.ts'

export type PlainTime = any & TimeFields
export type PlainTimeArg = PlainTime | PlainTimeBag | string

export const [PlainTime, createPlainTime] = createSlotClass(
  PlainTimeBranding,
  constructPlainTimeSlots,
  timeGetters,
  {
    with(
      _slots: PlainTimeSlots,
      mod: TimeBag,
      options?: OverflowOptions,
    ): PlainTime {
      return createPlainTime(
        plainTimeWithFields(this, rejectInvalidBag(mod), options),
      )
    },
    add(slots: PlainTimeSlots, durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(false, slots, toDurationSlots(durationArg)),
      )
    },
    subtract(slots: PlainTimeSlots, durationArg: DurationArg): PlainTime {
      return createPlainTime(
        movePlainTime(true, slots, toDurationSlots(durationArg)),
      )
    },
    until(
      slots: PlainTimeSlots,
      otherArg: PlainTimeArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffPlainTimes(false, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    since(
      slots: PlainTimeSlots,
      otherArg: PlainTimeArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffPlainTimes(true, slots, toPlainTimeSlots(otherArg), options),
      )
    },
    round(
      slots: PlainTimeSlots,
      options: TimeUnitName | RoundingOptions<TimeUnitName>,
    ): PlainTime {
      return createPlainTime(roundPlainTime(slots, options))
    },
    equals(slots: PlainTimeSlots, other: PlainTimeArg): boolean {
      return plainTimesEqual(slots, toPlainTimeSlots(other))
    },
    toLocaleString(
      slots: PlainTimeSlots,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ): string {
      const [format, epochMilli] = prepPlainTimeFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toString: formatPlainTimeIso,
    toJSON(slots: PlainTimeSlots): string {
      return formatPlainTimeIso(slots)
    },
    valueOf: neverValueOf,
  },
  {
    from(arg: PlainTimeArg, options?: OverflowOptions): PlainTime {
      return createPlainTime(toPlainTimeSlots(arg, options))
    },
    compare(arg0: PlainTimeArg, arg1: PlainTimeArg): NumberSign {
      return compareIsoTimeFields(
        toPlainTimeSlots(arg0),
        toPlainTimeSlots(arg1),
      )
    },
  },
  formatPlainTimeIso,
)

// Utils
// -----------------------------------------------------------------------------

export function toPlainTimeSlots(
  arg: PlainTimeArg,
  options?: OverflowOptions,
): PlainTimeSlots {
  if (isObjectLike(arg)) {
    const slots = (getSlots(arg) || {}) as Partial<BrandingSlots>

    switch (slots.branding) {
      case PlainTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return slots as PlainTimeSlots

      case PlainDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return createPlainTimeSlots(slots as PlainDateTimeSlots)

      case ZonedDateTimeBranding:
        refineOverflowOptions(options) // parse unused options
        return zonedDateTimeToPlainTime(
          queryNativeTimeZone,
          slots as ZonedDateTimeSlots,
        )
    }

    return refinePlainTimeBag(arg as PlainTimeBag, options)
  }

  const timeSlots = parsePlainTime(arg)

  // parse unused options, but AFTER time-string parsing
  refineOverflowOptions(options)

  return timeSlots
}

export function optionalToPlainTimeFields(
  timeArg: PlainTimeArg | undefined,
): IsoTimeFields | undefined {
  return timeArg === undefined ? undefined : toPlainTimeSlots(timeArg)
}
