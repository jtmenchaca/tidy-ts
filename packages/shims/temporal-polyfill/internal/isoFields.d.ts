import { DayTimeUnit } from './units.ts';
export interface IsoDateFields {
    isoDay: number;
    isoMonth: number;
    isoYear: number;
}
export interface IsoTimeFields {
    isoNanosecond: number;
    isoMicrosecond: number;
    isoMillisecond: number;
    isoSecond: number;
    isoMinute: number;
    isoHour: number;
}
export type IsoDateTimeFields = IsoDateFields & IsoTimeFields;
export declare const isoTimeFieldNamesAsc: (keyof IsoTimeFields)[];
export declare const isoDateFieldNamesAsc: (keyof IsoDateFields)[];
export declare const isoDateTimeFieldNamesAsc: (keyof IsoDateTimeFields)[];
export declare const isoDateFieldNamesAlpha: (keyof IsoDateFields)[];
export declare const isoTimeFieldNamesAlpha: (keyof IsoTimeFields)[];
export declare const isoDateTimeFieldNamesAlpha: (keyof IsoTimeFields | keyof IsoDateFields)[];
export declare const isoTimeFieldDefaults: {
    isoNanosecond: number;
    isoMicrosecond: number;
    isoMillisecond: number;
    isoSecond: number;
    isoMinute: number;
    isoHour: number;
};
export declare const clearIsoFields: (unit: DayTimeUnit, isoFields: IsoDateTimeFields) => IsoDateTimeFields;
