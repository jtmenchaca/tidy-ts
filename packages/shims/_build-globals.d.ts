// Auto-generated at build time — provides globals that exist at runtime but not in @types/node
declare const Deno: any;
declare namespace Temporal {
  type ComparisonResult = -1 | 0 | 1;
  class PlainDate { constructor(y: number, m: number, d: number); static from(item: any, options?: any): PlainDate; static compare(a: PlainDate, b: PlainDate): ComparisonResult; readonly year: number; readonly month: number; readonly day: number; toString(): string; toJSON(): string; equals(other: PlainDate): boolean; }
  class PlainTime { constructor(h?: number, m?: number, s?: number, ms?: number, us?: number, ns?: number); static from(item: any, options?: any): PlainTime; static compare(a: PlainTime, b: PlainTime): ComparisonResult; readonly hour: number; readonly minute: number; readonly second: number; toString(): string; toJSON(): string; }
  class PlainDateTime { constructor(y: number, m: number, d: number, h?: number, min?: number, s?: number, ms?: number, us?: number, ns?: number); static from(item: any, options?: any): PlainDateTime; static compare(a: PlainDateTime, b: PlainDateTime): ComparisonResult; toString(): string; toJSON(): string; }
  class PlainMonthDay { static from(item: any, options?: any): PlainMonthDay; toString(): string; toJSON(): string; }
  class PlainYearMonth { static from(item: any, options?: any): PlainYearMonth; toString(): string; toJSON(): string; }
  class ZonedDateTime { static from(item: any, options?: any): ZonedDateTime; static compare(a: ZonedDateTime, b: ZonedDateTime): ComparisonResult; toString(): string; toJSON(): string; }
  class Instant { constructor(epochNanoseconds: bigint); static from(item: any): Instant; static fromEpochMilliseconds(ms: number): Instant; static fromEpochNanoseconds(ns: bigint): Instant; static compare(a: Instant, b: Instant): ComparisonResult; readonly epochMilliseconds: number; readonly epochNanoseconds: bigint; toString(): string; toJSON(): string; }
  class Duration { constructor(y?: number, mo?: number, w?: number, d?: number, h?: number, min?: number, s?: number, ms?: number, us?: number, ns?: number); static from(item: any): Duration; static compare(a: Duration, b: Duration): ComparisonResult; readonly sign: ComparisonResult; readonly blank: boolean; toString(): string; toJSON(): string; }
  const Now: { instant(): Instant; zonedDateTimeISO(tz?: string): ZonedDateTime; plainDateTimeISO(tz?: string): PlainDateTime; plainDateISO(tz?: string): PlainDate; plainTimeISO(tz?: string): PlainTime; timeZoneId(): string; };
}
