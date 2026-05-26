---
name: graph
description: Interactive Vega-Lite charts via @tidy-ts/graph — graph({ df, type, mappings, config?, tooltip? }). Types scatter / line / bar / area. graphReact for react-vega integration. Save with .savePNG / .saveSVG.
metadata:
  tags: graph, charts, visualization, vega-lite, scatter, line, bar, area, react
---

# Charts (`@tidy-ts/graph`)

```typescript
import { graph } from "@tidy-ts/graph";          // <- separate package, not @tidy-ts/dataframe
import { createDataFrame } from "@tidy-ts/dataframe";
```

`graph()` is **not** a method on DataFrame. Pass the DataFrame as `df` in the options object.

## Basic shape

```typescript
graph({
  df,
  type: "scatter" | "line" | "bar" | "area",
  mappings: { x, y, color?, series?, size?, shape? },
  config?: { /* styling */ },
  tooltip?: { fields?: string[], format?: Record<string, (v: unknown) => string> },
});
```

Returns a `TidyGraphWidget` with `.savePNG(...)` and `.saveSVG(...)`.

## Mappings — column names vs accessor functions

Prefer column names when the encoding maps directly to an existing column. Use an accessor `(row) => value` when you need computed values, conditional logic, or values derived from multiple columns.

```typescript
// Column names — simple
graph({
  df,
  type: "scatter",
  mappings: { x: "age", y: "income", color: "category" },
});

// Accessors — computed / conditional
graph({
  df,
  type: "scatter",
  mappings: {
    x: "date",
    y: (row) => row.quantity * row.price,                        // computed
    color: (row) => row.status === "active" ? "Active" : "Off",   // conditional
    size: (row) => Math.sqrt(row.volume) * 10,                    // transformed
  },
});
```

For scatter only: `size` (numeric → point size) and `shape` (categorical → point shape).

## Chart types — when to use which

- **scatter** — correlations, multi-dimensional data (use `size` / `shape` / `color` for extra encodings)
- **line** — time series, trends
- **bar** — categorical comparisons (use `series` + `bar: { stacked: true }` for stacked)
- **area** — cumulative data, part-to-whole over time

## Common configurations

```typescript
graph({
  df,
  type: "line",
  mappings: { x: "date", y: "value", series: "category" },
  config: {
    layout: { title: "Sales Over Time", width: 800, height: 400 },
    line: { style: "monotone", strokeWidth: 3, dots: true, connectNulls: false },
    xAxis: { label: "Date" },                       // Date axes auto-format as "%b %Y"
    yAxis: { domain: [0, 1000], label: "Sales ($)" },  // domain filters and clips
    color: { scheme: "professional" },              // 'default' | 'blue' | 'green' | 'red'
                                                    // 'purple' | 'orange' | 'vibrant'
                                                    // 'professional' | 'high_contrast'
    legend: { show: true, position: "right" },
    grid: { show: true },
    interactivity: { zoom: true, pan: true },
  },
});

// Bar chart with stacking
graph({
  df,
  type: "bar",
  mappings: { x: "category", y: "count", series: "region" },
  config: { color: { scheme: "vibrant" }, bar: { stacked: true, radius: 8 } },
});

// Area chart, stacked
graph({
  df,
  type: "area",
  mappings: { x: "date", y: "value", series: "region" },
  config: { area: { stacked: true, opacity: 0.7 } },
});
```

Default width is `'container'` (fills parent); default height is 400.

## Custom tooltip

```typescript
graph({
  df,
  type: "scatter",
  mappings: { x: "revenue", y: "quantity", color: "region" },
  tooltip: {
    fields: ["revenue", "quantity", "region"],         // omit to show all columns
    format: { revenue: (v) => `$${Number(v).toFixed(2)}` },
  },
});
```

## Save to file

```typescript
const chart = graph({ df, type: "scatter", mappings: { x: "x", y: "y" } });

await chart.savePNG({ filename: "chart.png", width: 800, height: 600, scale: 2 });
await chart.saveSVG({ filename: "chart.svg", width: 800, height: 600 });
```

`scale` is clamped to 1-4. Pass numeric `width` / `height` in save (not `'container'`).

## React integration — `graphReact`

Returns `{ spec, data }` for use with `react-vega`. Type the `df` prop with the row schema so consumers get full autocomplete on `mappings`:

```tsx
import { graphReact } from "@tidy-ts/graph";
import type { DataFrame } from "@tidy-ts/dataframe";
import { VegaLite } from "react-vega";

type Row = { x: number; y: number; group: string };

function MyChart({ df }: { df: DataFrame<Row> }) {
  const { spec, data } = graphReact({
    df,
    type: "scatter",
    mappings: { x: "x", y: "y", color: "group" },
  });
  return <VegaLite spec={spec} data={{ source: data }} />;
}
```

`graphReact` does NOT have `.savePNG` / `.saveSVG` — those live on `graph`.

Consumers need `react`, `react-vega`, `@tidy-ts/graph`, and `@tidy-ts/dataframe` resolvable from their toolchain — `npm install` for Node/Vite/Next bundlers, or an import map entry for Deno-direct consumers.

## Pre-flight validation (recommended)

```typescript
// Empty data → empty chart (no error). Validate upfront for better UX.
if (df.nrows() === 0) {
  console.warn("DataFrame is empty — chart will have no data points");
}

// Required columns
const requiredCols = ["x", "y"];
const missing = requiredCols.filter((c) => !df.columns().includes(c));
if (missing.length > 0) throw new Error(`Missing: ${missing.join(", ")}`);

// Drop nulls before plotting (use removeNull / removeUndefined, not filter —
// they narrow the row type so the rest of the pipeline knows x/y are non-null).
const clean = df.removeNull("x", "y").removeUndefined("x", "y");
graph({ df: clean, type: "scatter", mappings: { x: "x", y: "y" } });
```

## Anti-patterns

- ❌ `df.graph(...)` — there is no such method. Use `graph({ df, ... })`.
- ❌ Importing `graph` from `@tidy-ts/dataframe` — it lives in `@tidy-ts/graph`.
- ❌ Scatter for time series — use `line`.
- ❌ Bar for continuous numeric data — use `line`.
- ❌ Missing `mappings.x` / `mappings.y` (required).
- ❌ `'container'` width in `savePNG` / `saveSVG` — must be numeric.
- ❌ `scale > 4` in `savePNG` — clamped to 4.
- ❌ Plotting null / NaN values without filtering — produces silent gaps or rendering glitches.
- ❌ Accessor functions for every mapping when column names suffice — adds per-row function-call overhead and reduces clarity.
- ❌ Column name reference to a column that doesn't exist — use `mutate` first, or use an accessor.
- ❌ Trying to call `.savePNG` / `.saveSVG` on `graphReact` output — that's `graph`'s widget API.
