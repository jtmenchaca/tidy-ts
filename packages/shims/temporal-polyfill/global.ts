import { toTemporalInstant } from './classApi/instant.ts'
import { DateTimeFormat } from './classApi/intlDateTimeFormat.ts'
import { Temporal } from './classApi/temporal.ts'
import { createPropDescriptors } from './internal/utils.ts'

Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
Object.defineProperties(
  Date.prototype,
  createPropDescriptors({ toTemporalInstant }),
)
