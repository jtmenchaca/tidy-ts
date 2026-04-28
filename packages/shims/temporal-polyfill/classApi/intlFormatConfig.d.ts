import { ClassFormatConfig } from '../internal/intlFormatPrep.ts';
export declare const classFormatConfigs: Record<string, ClassFormatConfig<any>>;
export declare const prepInstantFormat: import("../internal/intlFormatPrep.ts").FormatPrepper<import("../internal/slots.ts").EpochSlots>;
export declare const prepZonedDateTimeFormat: import("../internal/intlFormatPrep.ts").FormatPrepper<import("../internal/slots.ts").EpochAndZoneSlots>;
export declare const prepPlainDateTimeFormat: import("../internal/intlFormatPrep.ts").FormatPrepper<import("../internal/isoFields.ts").IsoDateTimeFields>;
export declare const prepPlainDateFormat: import("../internal/intlFormatPrep.ts").FormatPrepper<import("../internal/isoFields.ts").IsoDateFields>;
export declare const prepPlainTimeFormat: import("../internal/intlFormatPrep.ts").FormatPrepper<import("../internal/isoFields.ts").IsoTimeFields>;
export declare const prepPlainYearMonthFormat: import("../internal/intlFormatPrep.ts").FormatPrepper<import("../internal/isoFields.ts").IsoDateFields>;
export declare const prepPlainMonthDayFormat: import("../internal/intlFormatPrep.ts").FormatPrepper<import("../internal/isoFields.ts").IsoDateFields>;
