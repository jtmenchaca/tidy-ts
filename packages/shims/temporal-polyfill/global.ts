import { toTemporalInstant } from './classApi/instant.ts'
import { DateTimeFormat } from './classApi/intlDateTimeFormat.ts'
import { Temporal } from './classApi/temporal.ts'
import { createPropDescriptors } from './internal/utils.ts'

// Only install polyfill if Temporal is not natively available (Node.js, Bun)
if (typeof (globalThis as Record<string, unknown>).Temporal === 'undefined') {
  Object.defineProperties(globalThis, createPropDescriptors({ Temporal }))
  Object.defineProperties(Intl, createPropDescriptors({ DateTimeFormat }))
  Object.defineProperties(
    Date.prototype,
    createPropDescriptors({ toTemporalInstant }),
  )
}
