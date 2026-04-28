export declare function refineTimeZoneId(id: string): string;
export declare function resolveTimeZoneId(id: string): string;
export declare function getTimeZoneAtomic(id: string): string | number;
/**
 * @returns Undefined means `utcTimeZoneId`
 */
export declare function getTimeZoneEssence(id: string): number | Intl.DateTimeFormat | undefined;
