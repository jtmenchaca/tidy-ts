import { BigNano } from './bigNano.ts'
import { RawDateTimeFormat } from './intlFormatUtils.ts'
import { IsoDateTimeFields } from './isoFields.ts'
import { epochMilliToNano, epochNanoToIso } from './timeMath.ts'
import { TimeZoneOffsetOps } from './timeZoneOps.ts'

export function getCurrentIsoDateTime(
  timeZoneOps: TimeZoneOffsetOps,
): IsoDateTimeFields {
  const epochNano = getCurrentEpochNano()
  const offsetNano = timeZoneOps.getOffsetNanosecondsFor(epochNano)
  return epochNanoToIso(epochNano, offsetNano)
}

export function getCurrentEpochNano(): BigNano {
  return epochMilliToNano(Date.now())
}

// -----------------------------------------------------------------------------

export function getCurrentTimeZoneId(): string {
  return new RawDateTimeFormat().resolvedOptions().timeZone
}
