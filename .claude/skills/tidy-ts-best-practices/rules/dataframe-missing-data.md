---
name: dataframe-missing-data
description: Null/undefined handling — removeNull, removeUndefined, replaceNull, replaceUndefined, fillForward, fillBackward, interpolate. Prefer removeNull/removeUndefined over filter for type narrowing.
metadata:
  tags: dataframe, null, undefined, missing, fillForward, fillBackward, interpolate
---

# Missing data

Tidy-ts distinguishes `null` from `undefined` (joins produce `undefined`; CSV/JSON readers usually produce `null`). Different verbs target each.

## Remove rows (narrows types)

```typescript
df.removeNull("score")                  // drop rows where score is null
df.removeNull("age", "name")            // drop rows null in either field
df.removeUndefined("email")             // drop rows where email is undefined
df.removeUndefined("age", "name")
```

**Prefer `removeNull` / `removeUndefined` over `filter(r => r.x != null)`** — only the former narrows the row type so TypeScript knows the fields are non-null downstream.

## Replace values (no type change)

```typescript
df.replaceNull({ name: "Unknown", age: 0 })
df.replaceUndefined({ email: "" })
```

Only replaces the targeted kind (null vs undefined). Chain both if you need to handle both. Use `removeNull` / `removeUndefined` instead if you want to drop the rows entirely (and get type narrowing).

## Forward / backward fill (time series)

Replace null/undefined with the last (or next) non-null value. Values at the boundary (start for forward fill, end for backward fill) remain null.

```typescript
df.fillForward("price")                 // single column
df.fillForward("price", "volume")       // multiple
df.fillBackward("price")
```

Typical use: time series with sporadic missing values.

## Interpolate (linear / spline)

Linear or spline interpolation using a numeric / Date x-axis column. Only fills nulls that have **both** a previous and a next non-null value — leading/trailing nulls remain null.

```typescript
df.interpolate("value", "timestamp", "linear")
df.interpolate("temperature", "timestamp", "spline")  // needs ≥4 points; otherwise falls back to linear
df.interpolate("price", "date", "linear")              // Date x-axis works
```

## When to use what

| Want                                                | Use                                      |
|-----------------------------------------------------|------------------------------------------|
| Drop rows with null, narrow row type                | `removeNull` / `removeUndefined`         |
| Substitute a fixed value (e.g. `0`, `"Unknown"`)    | `replaceNull` / `replaceUndefined`       |
| Carry forward last known value in time series       | `fillForward`                            |
| Carry backward next known value                     | `fillBackward`                           |
| Estimate intermediate values between known points   | `interpolate(col, xCol, "linear" \| "spline")` |

## Anti-patterns

- ❌ `filter(r => r.x != null)` then assuming `r.x` is non-null in the next verb — `filter` doesn't narrow types. Use `removeNull`.
- ❌ Expecting `fillForward` / `fillBackward` to fill across both ends — they only fill where a same-direction non-null value exists.
- ❌ Using `interpolate` with spline on fewer than 4 points — it silently falls back to linear.
