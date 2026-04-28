import {
  PlainMonthDayBag,
  plainMonthDayWithFields,
  refinePlainMonthDayBag,
} from '../internal/bagRefine.ts'
import { isoCalendarId } from '../internal/calendarConfig.ts'
import { refineCalendarId } from '../internal/calendarId.ts'
import { createNativeStandardOps } from '../internal/calendarNativeQuery.ts'
import { plainMonthDaysEqual } from '../internal/compare.ts'
import { constructPlainMonthDaySlots } from '../internal/construct.ts'
import { plainMonthDayToPlainDate } from '../internal/convert.ts'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/fields.ts'
import { LocalesArg } from '../internal/intlFormatUtils.ts'
import { formatPlainMonthDayIso } from '../internal/isoFormat.ts'
import { parsePlainMonthDay } from '../internal/isoParse.ts'
import {
  OverflowOptions,
  refineOverflowOptions,
} from '../internal/optionsRefine.ts'
import { PlainMonthDayBranding, PlainMonthDaySlots } from '../internal/slots.ts'
import { bindArgs, isObjectLike } from '../internal/utils.ts'
import { extractCalendarIdFromBag } from './calendarArg.ts'
import { prepPlainMonthDayFormat } from './intlFormatConfig.ts'
import { calendarIdGetters, monthDayGetters, neverValueOf } from './mixins.ts'
import { PlainDate, createPlainDate } from './plainDate.ts'
import { createSlotClass, getSlots, rejectInvalidBag } from './slotClass.ts'

export type PlainMonthDay = any & MonthDayFields
export type PlainMonthDayArg = PlainMonthDay | PlainMonthDayBag | string

export const [PlainMonthDay, createPlainMonthDay, getPlainMonthDaySlots] =
  createSlotClass(
    PlainMonthDayBranding,
    bindArgs(constructPlainMonthDaySlots, refineCalendarId),
    {
      ...calendarIdGetters,
      ...monthDayGetters,
    },
    {
      with(
        slots: PlainMonthDaySlots,
        mod: MonthDayBag,
        options?: OverflowOptions,
      ): PlainMonthDay {
        return createPlainMonthDay(
          plainMonthDayWithFields(
            createNativeStandardOps,
            slots,
            rejectInvalidBag(mod),
            options,
          ),
        )
      },
      equals(slots: PlainMonthDaySlots, otherArg: PlainMonthDayArg): boolean {
        return plainMonthDaysEqual(slots, toPlainMonthDaySlots(otherArg))
      },
      toPlainDate(slots: PlainMonthDaySlots, bag: YearFields): PlainDate {
        return createPlainDate(
          plainMonthDayToPlainDate(createNativeStandardOps, slots, this, bag),
        )
      },
      toLocaleString(
        slots: PlainMonthDaySlots,
        locales?: LocalesArg,
        options?: Intl.DateTimeFormatOptions,
      ): string {
        const [format, epochMilli] = prepPlainMonthDayFormat(
          locales,
          options,
          slots,
        )
        return format.format(epochMilli)
      },
      toString: formatPlainMonthDayIso,
      toJSON(slots: PlainMonthDaySlots): string {
        return formatPlainMonthDayIso(slots)
      },
      valueOf: neverValueOf,
    },
    {
      from(arg: PlainMonthDayArg, options?: OverflowOptions): PlainMonthDay {
        return createPlainMonthDay(toPlainMonthDaySlots(arg, options))
      },
    },
    formatPlainMonthDayIso,
  )

// Utils
// -----------------------------------------------------------------------------

export function toPlainMonthDaySlots(
  arg: PlainMonthDayArg,
  options?: OverflowOptions,
): PlainMonthDaySlots {
  if (isObjectLike(arg)) {
    const slots = getSlots(arg)

    if (slots && slots.branding === PlainMonthDayBranding) {
      refineOverflowOptions(options) // parse unused options
      return slots as PlainMonthDaySlots
    }

    const calendarIdMaybe = extractCalendarIdFromBag(arg as PlainMonthDaySlots)
    const calendarId = calendarIdMaybe || isoCalendarId

    return refinePlainMonthDayBag(
      createNativeStandardOps(calendarId),
      !calendarIdMaybe,
      arg as MonthDayBag,
      options,
    )
  }

  const res = parsePlainMonthDay(createNativeStandardOps, arg)
  refineOverflowOptions(options) // parse unused options
  return res
}
