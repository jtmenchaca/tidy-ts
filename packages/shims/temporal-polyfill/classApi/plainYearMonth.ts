import {
  PlainYearMonthBag,
  plainYearMonthWithFields,
  refinePlainYearMonthBag,
} from '../internal/bagRefine.ts'
import { refineCalendarId } from '../internal/calendarId.ts'
import { createNativeStandardOps } from '../internal/calendarNativeQuery.ts'
import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare.ts'
import { constructPlainYearMonthSlots } from '../internal/construct.ts'
import { plainYearMonthToPlainDate } from '../internal/convert.ts'
import { diffPlainYearMonth } from '../internal/diff.ts'
import { YearMonthBag, YearMonthFields } from '../internal/fields.ts'
import { LocalesArg } from '../internal/intlFormatUtils.ts'
import { formatPlainYearMonthIso } from '../internal/isoFormat.ts'
import { parsePlainYearMonth } from '../internal/isoParse.ts'
import { movePlainYearMonth } from '../internal/move.ts'
import {
  DiffOptions,
  OverflowOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine.ts'
import { PlainYearMonthBranding, PlainYearMonthSlots } from '../internal/slots.ts'
import { YearMonthUnitName } from '../internal/units.ts'
import { NumberSign, bindArgs, isObjectLike } from '../internal/utils.ts'
import { getCalendarIdFromBag } from './calendarArg.ts'
import {
  Duration,
  DurationArg,
  createDuration,
  toDurationSlots,
} from './duration.ts'
import { prepPlainYearMonthFormat } from './intlFormatConfig.ts'
import { calendarIdGetters, neverValueOf, yearMonthGetters } from './mixins.ts'
import { PlainDate, createPlainDate } from './plainDate.ts'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass.ts'

export type PlainYearMonth = any & YearMonthFields
export type PlainYearMonthArg = PlainYearMonth | PlainYearMonthBag | string

export const [PlainYearMonth, createPlainYearMonth, getPlainYearMonthSlots] =
  createSlotClass(
    PlainYearMonthBranding,
    bindArgs(constructPlainYearMonthSlots, refineCalendarId),
    {
      ...calendarIdGetters,
      ...yearMonthGetters,
    },
    {
      with(
        slots: PlainYearMonthSlots,
        mod: YearMonthBag,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          plainYearMonthWithFields(
            createNativeStandardOps,
            slots,
            rejectInvalidBag(mod),
            options,
          ),
        )
      },
      add(
        slots: PlainYearMonthSlots,
        durationArg: DurationArg,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          movePlainYearMonth(
            createNativeStandardOps,
            false,
            slots,
            toDurationSlots(durationArg),
            options,
          ),
        )
      },
      subtract(
        slots: PlainYearMonthSlots,
        durationArg: DurationArg,
        options?: OverflowOptions,
      ): PlainYearMonth {
        return createPlainYearMonth(
          movePlainYearMonth(
            createNativeStandardOps,
            true,
            slots,
            toDurationSlots(durationArg),
            options,
          ),
        )
      },
      until(
        slots: PlainYearMonthSlots,
        otherArg: PlainYearMonthArg,
        options?: DiffOptions<YearMonthUnitName>,
      ): Duration {
        return createDuration(
          diffPlainYearMonth(
            createNativeStandardOps,
            false,
            slots,
            toPlainYearMonthSlots(otherArg),
            options,
          ),
        )
      },
      since(
        slots: PlainYearMonthSlots,
        otherArg: PlainYearMonthArg,
        options?: DiffOptions<YearMonthUnitName>,
      ): Duration {
        return createDuration(
          diffPlainYearMonth(
            createNativeStandardOps,
            true,
            slots,
            toPlainYearMonthSlots(otherArg),
            options,
          ),
        )
      },
      equals(slots: PlainYearMonthSlots, otherArg: PlainYearMonthArg): boolean {
        return plainYearMonthsEqual(slots, toPlainYearMonthSlots(otherArg))
      },
      toPlainDate(slots: PlainYearMonthSlots, bag: { day: number }): PlainDate {
        return createPlainDate(
          plainYearMonthToPlainDate(createNativeStandardOps, slots, this, bag),
        )
      },
      toLocaleString(
        slots: PlainYearMonthSlots,
        locales?: LocalesArg,
        options?: Intl.DateTimeFormatOptions,
      ): string {
        const [format, epochMilli] = prepPlainYearMonthFormat(
          locales,
          options,
          slots,
        )
        return format.format(epochMilli)
      },
      toString: formatPlainYearMonthIso,
      toJSON(slots: PlainYearMonthSlots) {
        return formatPlainYearMonthIso(slots)
      },
      valueOf: neverValueOf,
    },
    {
      from(arg: PlainYearMonthArg, options?: OverflowOptions): PlainYearMonth {
        return createPlainYearMonth(toPlainYearMonthSlots(arg, options))
      },
      compare(arg0: PlainYearMonthArg, arg1: PlainYearMonthArg): NumberSign {
        return compareIsoDateFields(
          toPlainYearMonthSlots(arg0),
          toPlainYearMonthSlots(arg1),
        )
      },
    },
    formatPlainYearMonthIso,
  )

// Utils
// -----------------------------------------------------------------------------

export function toPlainYearMonthSlots(
  arg: PlainYearMonthArg,
  options?: OverflowOptions,
) {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainYearMonthBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainYearMonthSlots
    }

    return refinePlainYearMonthBag(
      createNativeStandardOps(getCalendarIdFromBag(arg as any)), // !!!
      arg as any, // !!!
      options,
    )
  }

  const res = parsePlainYearMonth(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
