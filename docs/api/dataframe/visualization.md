# Visualization

> Auto-generated from tidy-ts MCP documentation

## graph

Create an interactive Vega-Lite visualization from the DataFrame. Supports scatter plots, line charts, bar charts, and area charts. The widget can be displayed in Jupyter notebooks, web applications, or saved as SVG/PNG. Automatically infers axis types (temporal for Date, quantitative for numbers, ordinal otherwise).

### Signature

```typescript
graph(spec: GraphOptions<T>): TidyGraphWidget
```

### Import

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";
```

### Parameters

- spec: Graph specification object with:
-   - type: Chart type - 'scatter', 'line', 'bar', or 'area'
-   - mappings: Column mappings - { x, y, color?, series?, size?, shape? }
-     * x: Column name, accessor function, or array for X-axis (required)
-     * y: Column name, accessor function, or array for Y-axis (required)
-     * color: Optional column/accessor/array for color encoding (categorical or continuous)
-       - If not specified but series is provided, series is used for color
-     * series: Optional column/accessor/array for grouping multiple lines/bars/areas
-     * size: Optional column/accessor/array for point size encoding (scatter only, numeric)
-     * shape: Optional column/accessor/array for point shape encoding (scatter only, categorical)
-   - config: Optional styling configuration:
-     * layout: { title?, description?, width?: number | 'container', height?: number }
-       - width defaults to 'container' (fills parent), height defaults to 400
-     * xAxis/yAxis: { label?, domain?: [min, max]?, tickFormat?, hide? }
-       - domain filters data to only show points within range and enables clipping
-       - For Date axes, tickFormat defaults to '%b %Y'
-       - Non-quantitative x-axes get -45° label angle automatically
-     * grid: { show?: boolean (default: true), vertical?, horizontal? }
-     * color: { scheme?, colors?: string[] }
-       - schemes: 'default', 'blue', 'green', 'red', 'purple', 'orange', 'vibrant', 'professional', 'high_contrast'
-       - colors: Custom array of hex/rgb/hsl color strings
-     * legend: { show?: boolean (default: true when color/series used), position?, fontSize?, titleFontSize? }
-       - positions: 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
-       - fontSize defaults to 12, titleFontSize defaults to 13
-     * tooltip: { show?: boolean (default: true) }
-     * interactivity: { zoom?: boolean, pan?: boolean }
-       - Enables zoom/pan via interval selection bound to scales
-     * accessibility: { layer?: boolean } - Adds accessibility layer for screen readers
-     * animation: { duration?: number } - Animation duration in milliseconds
-     * scatter: { pointSize?: number (default: 60), pointOpacity?: number (default: 0.8) }
-     * line: { style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), dots?: boolean (default: false), strokeWidth?: number (default: 2), connectNulls?: boolean (default: false) }
-     * bar: { stacked?: boolean (default: false), radius?: number (default: 4) }
-     * area: { stacked?: boolean (default: false), style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), strokeWidth?: number (default: 1), opacity?: number (default: 0.7) }
-   - tooltip: Optional tooltip customization - { fields?: string[], format?: Record<string, (v: unknown) => string> }
-     - fields: Array of column names to show in tooltip (default: all columns)
-     - format: Custom formatter functions for specific fields

### Returns

TidyGraphWidget with display() and save methods:
  - savePNG({ filename, width?, height?, background?, scale? }): Promise<void>
    - scale: Resolution multiplier 1-4 (default: 1, clamped to 1-4)
  - saveSVG({ filename, width?, height?, background? }): Promise<void>
    - width/height default to 700x400 if not specified in layout or save options

### Examples

```typescript
// Scatter plot with color encoding
df.graph({
  type: "scatter",
  mappings: { x: "age", y: "income", color: "category" }
})
// Using accessor functions
const chart = df.graph({
  type: "scatter",
  mappings: {
    x: (row) => row.age,
    y: (row) => row.income * 1.1,
    color: "category"
  }
})
// Complex accessor function with conditional logic
const chart = df.graph({
  type: "scatter",
  mappings: {
    x: "date",
    y: (row) => row.value * (row.adjustment || 1),
    color: (row) => row.status === "active" ? "Active" : "Inactive",
    size: (row) => Math.sqrt(row.volume) * 10,
  }
})
// Handling missing/null data - filter before visualization
const cleanData = df.filter(row => 
  row.x != null && row.y != null && !isNaN(row.y)
);

cleanData.graph({
  type: "line",
  mappings: { x: "date", y: "value" },
  config: {
    line: { connectNulls: false } // Don't connect across null values
  }
})
// Best practice: Validate data before visualization
// Note: graph() will create an empty chart for empty DataFrames or missing columns,
// but validating upfront provides better error messages
if (df.nrows() === 0) {
  console.warn("DataFrame is empty - chart will have no data points");
}

const requiredCols = ["x", "y"];
const missing = requiredCols.filter(col => !df.columns().includes(col));
if (missing.length > 0) {
  console.error(`Missing required columns: ${missing.join(", ")}`);
  // graph() will return empty chart if columns are missing
}

df.graph({ type: "scatter", mappings: { x: "x", y: "y" } });
// Line chart with custom styling and domain filtering
df.graph({
  type: "line",
  mappings: { x: "date", y: "value", series: "category" },
  config: {
    layout: { title: "Sales Over Time", width: 800, height: 400 },
    line: { style: "monotone", strokeWidth: 3, dots: true },
    yAxis: { domain: [0, 1000], label: "Sales ($)" }
  }
})
// Bar chart with stacking
const chart = df.graph({
  type: "bar",
  mappings: { x: "category", y: "count", series: "region" },
  config: {
    color: { scheme: "vibrant" },
    bar: { stacked: true, radius: 8 }
  }
})
// Area chart with custom tooltip fields
df.graph({
  type: "area",
  mappings: { x: "date", y: "value", series: "region" },
  config: { area: { stacked: true, opacity: 0.7 } },
  tooltip: { fields: ["date", "value", "region"] }
})
// Save as PNG with high resolution
const chart = df.graph({ type: "scatter", mappings: { x: "x", y: "y" } })
await chart.savePNG({ filename: "chart.png", width: 800, height: 600, scale: 2 })
await chart.saveSVG({ filename: "chart.svg", width: 800, height: 600 })
// Scatter plot with multiple aesthetics and custom tooltip formatting
salesData
  .mutate({
    revenue: (r) => r.quantity * r.price,
    profit: (r) => r.quantity * r.price * 0.2,
  })
  .graph({
    type: "scatter",
    mappings: {
      x: "revenue",
      y: "quantity",
      color: "region",
      size: "profit",
    },
    config: {
      layout: { title: "Sales Analysis", width: 700, height: 400 },
      scatter: { pointSize: 100, pointOpacity: 0.8 },
      color: { scheme: "professional" },
      legend: { show: true, position: "right" },
      xAxis: { domain: [0, 5000], label: "Revenue ($)" },
    },
    tooltip: {
      fields: ["revenue", "quantity", "region", "profit"],
      format: { revenue: (v) => `$${Number(v).toFixed(2)}` }
    }
  })
// Date axis with automatic temporal formatting
df.graph({
  type: "line",
  mappings: { x: "date", y: "value" },
  config: {
    layout: { title: "Time Series" },
    // Date axis automatically gets "%b %Y" format
  }
})
```

### Best Practices

- ✓ GOOD: Use scatter plots for correlation analysis and multi-dimensional data
- ✓ GOOD: Use line charts for trends and time series data
- ✓ GOOD: Use bar charts for categorical comparisons
- ✓ GOOD: Use area charts for cumulative data and part-to-whole relationships
- ✓ GOOD: Chain with mutate() to create derived columns for visualization
- ✓ GOOD: Use color schemes like 'professional' or 'vibrant' for better aesthetics
- ✓ GOOD: Export charts as PNG/SVG for reports and presentations
- ✓ GOOD: Use series mapping for multiple lines/bars/areas
- ✓ GOOD: Configure tooltip.fields to show only relevant columns
- ✓ GOOD: Use domain filtering to focus on specific data ranges
- ✓ GOOD: Use scale: 2-4 for high-resolution PNG exports
- ✓ GOOD: All row fields are automatically available in tooltips unless filtered
- ✓ GOOD: Date columns are automatically detected and formatted as temporal axes
- ✓ GOOD: Filter out null/NaN values before visualization to avoid rendering issues
- ✓ GOOD: Validate DataFrame has required columns before calling graph()
- ✓ GOOD: Use accessor functions for computed values or conditional logic
- ✓ GOOD: Set connectNulls: false in line config to avoid connecting across missing data
- Charts are interactive in Jupyter notebooks with hover tooltips
- Backed by Vega-Lite for high-quality visualizations
- When domain is specified, data is filtered and chart is clipped to that range

### Anti-patterns

- ❌ BAD: Using scatter plots for time series (use line charts instead)
- ❌ BAD: Using bar charts for continuous numeric data (use line charts)
- ❌ BAD: Not specifying mappings.x and mappings.y (required)
- ❌ BAD: Using 'container' width in savePNG/saveSVG (use numeric width)
- ❌ BAD: Using scale > 4 (will be clamped to 4)
- ❌ BAD: Visualizing DataFrames with null/NaN values without filtering first
- ❌ BAD: Not validating DataFrame has required columns before graph()
- ❌ BAD: Using graph() on empty DataFrames without checking

### Related

`mutate`, `filter`, `groupBy`

---
