import { BigNano } from './bigNano.ts';
import { IsoDateTimeFields } from './isoFields.ts';
export interface NativeTimeZone {
    getOffsetNanosecondsFor(epochNano: BigNano): number;
    getPossibleInstantsFor(isoFields: IsoDateTimeFields): BigNano[];
    getTransition(epochNano: BigNano, direction: -1 | 1): BigNano | undefined;
}
export declare const queryNativeTimeZone: (key: string) => NativeTimeZone;
export declare class FixedTimeZone implements NativeTimeZone {
    offsetNano: number;
    constructor(offsetNano: number);
    getOffsetNanosecondsFor(): number;
    getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): BigNano[];
    getTransition(): BigNano | undefined;
}
interface IntlTimeZoneStore {
    getPossibleEpochSec: (zonedEpochSec: number) => number[];
    getOffsetSec: (epochSec: number) => number;
    getTransition: (epochSec: number, direction: -1 | 1) => number | undefined;
}
export declare class IntlTimeZone implements NativeTimeZone {
    tzStore: IntlTimeZoneStore;
    constructor(format: Intl.DateTimeFormat);
    getOffsetNanosecondsFor(epochNano: BigNano): number;
    getPossibleInstantsFor(isoFields: IsoDateTimeFields): BigNano[];
    getTransition(epochNano: BigNano, direction: -1 | 1): BigNano | undefined;
}
export {};
