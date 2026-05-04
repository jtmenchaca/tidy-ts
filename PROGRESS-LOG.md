# Progress Log

## Session: 2026-05-03

### Filter negation — proper optimization instead of bail-out

**Problem:** The filter verb's optimized paths (napi raw mask, columnar scan, compound predicate optimizer) parsed predicate source code but didn't handle `!(...)` wrappers. A predicate like `!(r.id === "P2" && r.val === 110)` was parsed as the positive expression, returning the exact opposite rows.

**Initial fix** (previous session): Added `body.startsWith("!")` bail-outs in 4 locations, falling back to the JS row-by-row path. This was correct but left performance on the table.

**Proper fix** (this session):
- Added `flipOp()` helper that inverts comparison operators (`>` → `<=`, `===` → `!==`, etc.)
- `detectSimplePredicate` now detects `!(r.col op val)`, unwraps the negation, and flips the operator — simple negated predicates take the optimized columnar path
- `tryRawMaskFilterPath` similarly detects `!(r.col op num)`, flips the op, produces correct napi mask directly
- Compound `!(a && b)` still falls through to JS — this is correct because De Morgan's law turns it into `!a || !b` (an OR), which the AND-only optimized paths can't represent

**Files changed:**
- `packages/dataframe/ts/verbs/filtering/filter.verb.ts` — `flipOp()`, updated `detectSimplePredicate`, `tryRawMaskFilterPath`

### innerJoin Temporal bug — valueOf crash

**Problem:** `innerJoin` (and all join types) crashed when join keys contained `Temporal.PlainDateTime` or `Temporal.PlainDate` values. The hash key builder in `convertToTypedArrays` used `"" + v` for string coercion, which calls `.valueOf()`. Temporal types throw on `.valueOf()` by spec to prevent implicit coercion.

**Fix:** Changed `"" + v` → `String(v)` in `column-helpers.ts:288`. `String()` calls `.toString()` instead of `.valueOf()`, which Temporal types support. This was the only instance of `"" + v` in the dataframe package.

**Files changed:**
- `packages/dataframe/ts/dataframe/implementation/column-helpers.ts` — line 288

**Tests added:**
- `packages/dataframe/ts/verbs/join/inner-join-temporal.test.ts` — 5 tests covering innerJoin/leftJoin on PlainDateTime and PlainDate join keys, multi-patient scenarios, and hash equality for separately-constructed Temporal values

**Test results:** 1235 passed, 0 failed. No type errors.
