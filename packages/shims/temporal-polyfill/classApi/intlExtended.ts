import { createPropDescriptors } from '../internal/utils.ts'
import { DateTimeFormat } from './intlDateTimeFormat.ts'

/*
An extended version of the Intl global namespace
*/
export const IntlExtended = Object.defineProperties(
  Object.create(Intl),
  createPropDescriptors({ DateTimeFormat }),
)
