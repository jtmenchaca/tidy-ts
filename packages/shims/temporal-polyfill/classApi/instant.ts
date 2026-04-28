import { numberToBigNano } from '../internal/bigNano.ts'
import { requireNumberIsInteger } from '../internal/cast.ts'
import { compareInstants, instantsEqual } from '../internal/compare.ts'
import { constructInstantSlots } from '../internal/construct.ts'
import {
  epochMilliToInstant,
  epochNanoToInstant,
  instantToZonedDateTime,
} from '../internal/convert.ts'
import { diffInstants } from '../internal/diff.ts'
import { LocalesArg } from '../internal/intlFormatUtils.ts'
import { formatInstantIso } from '../internal/isoFormat.ts'
import { parseInstant } from '../internal/isoParse.ts'
import { moveInstant } from '../internal/move.ts'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../internal/optionsRefine.ts'
import { roundInstant } from '../internal/round.ts'
import {
  InstantBranding,
  InstantSlots,
  ZonedDateTimeBranding,
  ZonedDateTimeSlots,
  createInstantSlots,
} from '../internal/slots.ts'
import { queryNativeTimeZone } from '../internal/timeZoneNative.ts'
import { TimeUnitName, nanoInMilli } from '../internal/units.ts'
import { NumberSign, isObjectLike } from '../internal/utils.ts'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration.ts'
import { prepInstantFormat } from './intlFormatConfig.ts'
import { epochGetters, neverValueOf } from './mixins.ts'
import { createSlotClass, getSlots } from './slotClass.ts'
import { TimeZoneArg, refineTimeZoneArg } from './timeZoneArg.ts'
import { ZonedDateTime, createZonedDateTime } from './zonedDateTime.ts'

export type Instant = any
export type InstantArg = Instant | string

export const [Instant, createInstant, getInstantSlots] = createSlotClass(
  InstantBranding,
  constructInstantSlots,
  epochGetters,
  {
    add(slots: InstantSlots, durationArg: DurationArg): Instant {
      return createInstant(
        moveInstant(false, slots, toDurationSlots(durationArg)),
      )
    },
    subtract(slots: InstantSlots, durationArg: DurationArg): Instant {
      return createInstant(
        moveInstant(true, slots, toDurationSlots(durationArg)),
      )
    },
    until(
      slots: InstantSlots,
      otherArg: InstantArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffInstants(false, slots, toInstantSlots(otherArg), options),
      )
    },
    since(
      slots: InstantSlots,
      otherArg: InstantArg,
      options?: DiffOptions<TimeUnitName>,
    ): Duration {
      return createDuration(
        diffInstants(true, slots, toInstantSlots(otherArg), options),
      )
    },
    round(
      slots: InstantSlots,
      options: TimeUnitName | RoundingOptions<TimeUnitName>,
    ): Instant {
      return createInstant(roundInstant(slots, options))
    },
    equals(slots: InstantSlots, otherArg: InstantArg): boolean {
      return instantsEqual(slots, toInstantSlots(otherArg))
    },
    toZonedDateTimeISO(
      slots: InstantSlots,
      timeZoneArg: TimeZoneArg,
    ): ZonedDateTime {
      return createZonedDateTime(
        instantToZonedDateTime(slots, refineTimeZoneArg(timeZoneArg)),
      )
    },
    toLocaleString(
      slots: InstantSlots,
      locales?: LocalesArg,
      options?: Intl.DateTimeFormatOptions,
    ): string {
      const [format, epochMilli] = prepInstantFormat(locales, options, slots)
      return format.format(epochMilli)
    },
    toString(slots: InstantSlots, options?: InstantDisplayOptions): string {
      return formatInstantIso(
        refineTimeZoneArg,
        queryNativeTimeZone,
        slots,
        options,
      )
    },
    toJSON(slots: InstantSlots): string {
      return formatInstantIso(refineTimeZoneArg, queryNativeTimeZone, slots)
    },
    valueOf: neverValueOf,
  },
  {
    from(arg: InstantArg) {
      return createInstant(toInstantSlots(arg))
    },
    fromEpochMilliseconds(epochMilli: number): Instant {
      return createInstant(epochMilliToInstant(epochMilli))
    },
    fromEpochNanoseconds(epochNano: bigint): Instant {
      return createInstant(epochNanoToInstant(epochNano))
    },
    compare(a: InstantArg, b: InstantArg): NumberSign {
      return compareInstants(toInstantSlots(a), toInstantSlots(b))
    },
  },
  (slots: InstantSlots) =>
    formatInstantIso(refineTimeZoneArg, queryNativeTimeZone, slots),
)

// Utils
// -----------------------------------------------------------------------------

export function toInstantSlots(arg: InstantArg): InstantSlots {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)
    if (slots) {
      switch (slots.branding) {
        case InstantBranding:
          return slots as InstantSlots

        case ZonedDateTimeBranding:
          return createInstantSlots(
            (slots as ZonedDateTimeSlots).epochNanoseconds,
          )
      }
    }
  }
  return parseInstant(arg as any)
}

// Legacy Date
// -----------------------------------------------------------------------------

export function toTemporalInstant(this: Date): Instant {
  const epochMilli = Date.prototype.valueOf.call(this) // will error if not Date

  // TODO: better error message instead of "non-integer number" or whatever?

  return createInstant(
    createInstantSlots(
      numberToBigNano(requireNumberIsInteger(epochMilli), nanoInMilli),
    ),
  )
}
