# Temporal Compatibility

## Problem

The TC39 Temporal API is supported natively in Deno 2.7+ and via `temporal-polyfill` for Node.js/Bun. However, the TypeScript type declarations from Deno's built-in `Temporal` namespace and `temporal-polyfill` (which depends on `temporal-spec@0.3.1`) are **not assignable to each other** due to deep signature differences:

- `Duration.round()`: Deno uses two overloads, `temporal-spec` uses a single union type `DurationRoundTo`
- `PlainDate.withCalendar()`: parameter named `calendarLike` (Deno) vs `calendar` (temporal-spec)
- `Instant.equals()`: takes `InstantLike` (Deno) vs `string | Instant` (temporal-spec)

This means `import type { Temporal } from "temporal-polyfill"` in our type signatures would reject native Deno `Temporal` values from consumers, and vice versa.

## Temporal Type Categories

The TC39 Temporal API has two fundamentally different categories of types:

### Exact-time types (have epoch values)
- **`Temporal.Instant`** — a fixed point on the universal timeline, no calendar or timezone. Has `epochMilliseconds` and `epochNanoseconds`.
- **`Temporal.ZonedDateTime`** — an exact moment viewed through a specific timezone. Has `epochMilliseconds` and `epochNanoseconds`, plus calendar properties (year, month, day, hour, etc.).

### Wall-clock / calendar types (no epoch values)
- **`Temporal.PlainDate`** — a calendar date ("March 25, 2026") with no time or timezone. Has `year`, `month`, `day`.
- **`Temporal.PlainDateTime`** — a calendar date + wall-clock time with no timezone. Has `year`, `month`, `day`, `hour`, `minute`, `second`.
- **`Temporal.PlainTime`** — a wall-clock time ("3:30 PM") with no date or timezone. Has `hour`, `minute`, `second`.

**Critical distinction**: Wall-clock types intentionally have no epoch. Converting them to epoch requires assuming a timezone, which the spec explicitly warns against — "preventing bugs caused by incorrectly assuming 0, UTC, or the local time zone for values that are actually unknown."

### What all types share
- **`constructor.compare(a, b)`** — static method returning -1 | 0 | 1 (works for all 5 types + Duration)
- **`[Symbol.toStringTag]`** — e.g. `"Temporal.PlainDate"` (Date objects do NOT have this)
- **`toString()`** — ISO 8601 string representation (deterministic, lexicographically orderable)
- **`toJSON()`** — same as toString() (Map/Set/Promise do NOT have this)
- **`with()`** — create modified copy with specific fields set (used for floor bucketing)
- **`add()` / `subtract()`** — calendar-aware arithmetic (used for bucket iteration)
- **`since()` / `until()`** — compute Duration between two values (used for numeric spacing)

### Runtime detection
- **Is it Temporal?** — `typeof obj.constructor?.compare === "function"` (duck-typed via `isComparable()`)
- **Is it epoch-capable?** — `"epochMilliseconds" in obj` (only true for Instant and ZonedDateTime)
- **Is it a calendar type?** — `isComparable(obj) && !("epochMilliseconds" in obj) && "year" in obj` (PlainDate, PlainDateTime)

## Solution: Structural Typing

Instead of importing types from any specific Temporal source, we use a shallow structural interface:

```typescript
export interface TemporalComparable {
  readonly [Symbol.toStringTag]: string;
  toString(): string;
  toJSON(): string;
}
```

This interface:
- **Matches all Temporal types**: PlainDate, PlainDateTime, PlainTime, Instant, ZonedDateTime (native and polyfill)
- **Excludes Date**: `Date` does not have `[Symbol.toStringTag]`
- **Excludes primitives**: `number`, `string`, `boolean` do not have `[Symbol.toStringTag]`
- **Excludes Map/Set/Promise**: These have `[Symbol.toStringTag]` but lack `toJSON()`
- **Preserves return types**: Generic overloads `<T extends TemporalComparable>` return `T`, so callers get their specific Temporal type back

At runtime, comparison uses duck-typed `constructor.compare()` via the `isComparable()` helper in `stats/helpers.ts`.

## Temporal Support by Verb Category

### Comparison-based verbs (all 5 Temporal types supported)

These verbs only need ordering/equality, so they use `constructor.compare()` which works for all Temporal types:

- `packages/dataframe/ts/stats/aggregate/min.ts` — structural `TemporalComparable`, `comparableMinMax()` helper
- `packages/dataframe/ts/stats/aggregate/max.ts` — same
- `packages/dataframe/ts/stats/helpers.ts` — `isComparable()` runtime duck-type check, `comparableMinMax()` helper
- `packages/dataframe/ts/verbs/filtering/slice.verb.ts` — `slice_min`, `slice_max` comparators use `isComparable()`
- `packages/dataframe/ts/verbs/sorting/arrange.verb.ts` — `encodeStringCol` encodes Temporal via `String(v)` (ISO), rank lookup handles Temporal
- `packages/dataframe/ts/verbs/selection/extract-nth-where-sorted.verb.ts` — sort comparator uses `isComparable()`
- `packages/dataframe/ts/verbs/grouping/group-by.verb.ts` — `normalizeKey()` uses `String(val)` for Temporal grouping keys

### Time-series verbs — dual path

Time-series verbs use two strategies depending on the column type:

#### Epoch path (Date, number, string, Instant, ZonedDateTime)
Uses `epochMilliseconds` for arithmetic. Bucket keys are epoch ms numbers. Sequence generation steps by `+= frequencyMs`.

#### Calendar path (PlainDate, PlainDateTime)
Uses native Temporal calendar operations — no epoch conversion, no timezone assumptions. All operations use methods that already exist on the Temporal API:

| Operation | Temporal API used |
|---|---|
| **Floor to bucket** | `with()` — e.g. `date.with({ day: 1 })` for monthly, `dt.with({ hour: 0, minute: 0, ... })` for hourly |
| **Weekly floor** | `subtract()` + `dayOfWeek` — `date.subtract({ days: date.dayOfWeek - 1 })` |
| **Quarter floor** | `with()` + arithmetic — `date.with({ month: qMonth, day: 1 })` |
| **Iterate buckets** | `add()` + `compare()` — `current.add({ days: 1 })` until `compare(current, end) > 0` |
| **Numeric spacing** | `until().total()` — `a.until(b).total({ unit: "days" })` for interpolation distances |
| **Bucket keys** | `toString()` — deterministic ISO strings that sort lexicographically |
| **Ordering** | `constructor.compare()` — same as comparison-based verbs |

**PlainTime is rejected** — it has no date component, so calendar bucketing by days/weeks/months is meaningless.

#### Files

- `packages/dataframe/ts/stats/helpers.ts` — `hasEpochMilliseconds()`, `temporalToEpochMs()`, `toEpochMs()`, `isCalendarTemporal()`, `isWallClockTemporalWithoutCalendar()`, `floorCalendarTemporal()`, `addCalendarTemporalPeriod()`, `generateCalendarTemporalSequence()`, `calendarTemporalDistance()`
- `packages/dataframe/ts/verbs/utility/time-bucket.ts` — `getTimeBucket()` (epoch path) + `getCalendarTemporalBucket()` (calendar path)
- `packages/dataframe/ts/verbs/utility/downsample.verb.ts` — detects CalendarTemporal and routes to `downsampleCalendarTemporal()` using string bucket keys
- `packages/dataframe/ts/verbs/utility/upsample.verb.ts` — detects CalendarTemporal and routes to `upsampleCalendarTemporal()` using `add()`/`compare()` for sequence generation
- `packages/dataframe/ts/verbs/missing-data/interpolate.verb.ts` — uses `calendarTemporalDistance()` with `until().total()` for x-spacing on calendar types
- `packages/dataframe/ts/verbs/join/asof-join.verb.ts` — uses `calendarTemporalDistance()` for distance computation on calendar types

## Testing Strategy

All Temporal functionality must be tested with **both** sources:
- **Native**: `Temporal.PlainDate.from(...)` (Deno global)
- **Polyfill**: `import { Temporal } from "temporal-polyfill"`

### Test files

| File | Purpose |
|---|---|
| `temporal-api-testing.test.ts` | API surface exploration: comparison, epoch access, type detection, since/until, properties for all 5 types + Duration, native and polyfill |
| `temporal-calendar-ops.test.ts` | Calendar operations: `with()` floor bucketing, `add()` iteration, `subtract()` weekly floor, `until().total()` spacing, string key ordering |
| `temporal-structural-type.test.ts` | Validates structural `TemporalComparable` interface against all 5 types, native and polyfill |
| `temporal-type-compat.test.ts` | Demonstrates native/polyfill type incompatibility (expected type errors) |
| `temporal-min-max.test.ts` | min/max with PlainDate, PlainDateTime, Instant; clean arrays, nullable with removal flags |
| `temporal-arrange.test.ts` | `arrange` with all 5 types, asc/desc, grouped, native and polyfill |
| `temporal-slice.test.ts` | `sliceMin`/`sliceMax` with PlainDate, PlainDateTime, Instant, ZonedDateTime, native and polyfill |
| `temporal-group-by.test.ts` | `groupBy` with PlainDate, PlainDateTime, Instant as grouping keys |
| `temporal-extract-nth.test.ts` | `extractNthWhereSorted` with all 5 types, asc/desc |
| `temporal-downsample.test.ts` | `downsample` with Instant, ZonedDateTime (epoch path); PlainDate daily/monthly, PlainDateTime hourly (calendar path); polyfill; PlainTime rejection |
| `temporal-upsample.test.ts` | `upsample` with Instant (epoch path); PlainDate daily forward/backward fill, PlainDateTime hourly (calendar path); polyfill; PlainTime rejection |
| `temporal-time-bucket.test.ts` | `getTimeBucket` with Instant, ZonedDateTime; `getCalendarTemporalBucket` with PlainDate (D/W/M/Q/Y), PlainDateTime (D/H/M); polyfill; PlainTime rejection |
| `temporal-interpolate.test.ts` | `interpolate` with Instant (epoch path); PlainDate, PlainDateTime (calendar path via `until().total()`); polyfill; PlainTime rejection |
| `temporal-asof-join.test.ts` | `asofJoin` with Instant (epoch path); PlainDate backward/forward, PlainDateTime (calendar path via `until().total()`); polyfill; PlainTime rejection |
| `temporal-type-exploration.test.ts` | Runtime property exploration of all 5 types: `in` checks for year/month/day/hour, `until().total()` behavior, type narrowing patterns |
