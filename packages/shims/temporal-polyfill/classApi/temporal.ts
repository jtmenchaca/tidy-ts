import {
  createPropDescriptors,
  createStringTagDescriptors,
} from '../internal/utils.ts'

import { Duration } from './duration.ts'
import { Instant } from './instant.ts'
import { Now } from './now.ts'
import { PlainDate } from './plainDate.ts'
import { PlainDateTime } from './plainDateTime.ts'
import { PlainMonthDay } from './plainMonthDay.ts'
import { PlainTime } from './plainTime.ts'
import { PlainYearMonth } from './plainYearMonth.ts'
import { ZonedDateTime } from './zonedDateTime.ts'

export const Temporal = Object.defineProperties(
  {},
  {
    ...createStringTagDescriptors('Temporal'),
    ...createPropDescriptors({
      PlainYearMonth,
      PlainMonthDay,
      PlainDate,
      PlainTime,
      PlainDateTime,
      ZonedDateTime,
      Instant,
      Duration,
      Now,
    }),
  },
) as any // !!! (for tests)
