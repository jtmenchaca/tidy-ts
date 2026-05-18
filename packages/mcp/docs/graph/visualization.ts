import type { DocEntry } from "../mcp-types.ts";

export const visualizationDocs: Record<string, DocEntry> = {
  graph: {
    name: "graph",
    category: "graph",
    signature:
      "graph({ df, type, mappings, config?, tooltip? }): TidyGraphWidget",
    description:
      "Create an interactive Vega-Lite visualization from a DataFrame. The `graph` function lives in the separate `@tidy-ts/graph` package (it is no longer a method on DataFrame). Pass the DataFrame as `df` alongside the chart spec. Supports scatter plots, line charts, bar charts, and area charts. The widget can be displayed in Jupyter notebooks, web applications, or saved as SVG/PNG. Automatically infers axis types (temporal for Date, quantitative for numbers, ordinal otherwise).",
    imports: [
      'import { createDataFrame } from "@tidy-ts/dataframe";',
      'import { graph } from "@tidy-ts/graph";',
    ],
    parameters: [
      "Single argument object with:",
      "  - df: The source DataFrame (required)",
      "  - type: Chart type - 'scatter', 'line', 'bar', or 'area'",
      "  - mappings: Column mappings - { x, y, color?, series?, size?, shape? }",
      "    * x: Column name, accessor function, or array for X-axis (required)",
      "    * y: Column name, accessor function, or array for Y-axis (required)",
      "    * color: Optional column/accessor/array for color encoding (categorical or continuous)",
      "      - If not specified but series is provided, series is used for color",
      "    * series: Optional column/accessor/array for grouping multiple lines/bars/areas",
      "    * size: Optional column/accessor/array for point size encoding (scatter only, numeric)",
      "    * shape: Optional column/accessor/array for point shape encoding (scatter only, categorical)",
      "  - config: Optional styling configuration:",
      "    * layout: { title?, description?, width?: number | 'container', height?: number }",
      "      - width defaults to 'container' (fills parent), height defaults to 400",
      "    * xAxis/yAxis: { label?, domain?: [min, max]?, tickFormat?, hide? }",
      "      - domain filters data to only show points within range and enables clipping",
      "      - For Date axes, tickFormat defaults to '%b %Y'",
      "      - Non-quantitative x-axes get -45° label angle automatically",
      "    * grid: { show?: boolean (default: true), vertical?, horizontal? }",
      "    * color: { scheme?, colors?: string[] }",
      "      - schemes: 'default', 'blue', 'green', 'red', 'purple', 'orange', 'vibrant', 'professional', 'high_contrast'",
      "      - colors: Custom array of hex/rgb/hsl color strings",
      "    * legend: { show?: boolean (default: true when color/series used), position?, fontSize?, titleFontSize? }",
      "      - positions: 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'",
      "      - fontSize defaults to 12, titleFontSize defaults to 13",
      "    * tooltip: { show?: boolean (default: true) }",
      "    * interactivity: { zoom?: boolean, pan?: boolean }",
      "      - Enables zoom/pan via interval selection bound to scales",
      "    * accessibility: { layer?: boolean } - Adds accessibility layer for screen readers",
      "    * animation: { duration?: number } - Animation duration in milliseconds",
      "    * scatter: { pointSize?: number (default: 60), pointOpacity?: number (default: 0.8) }",
      "    * line: { style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), dots?: boolean (default: false), strokeWidth?: number (default: 2), connectNulls?: boolean (default: false) }",
      "    * bar: { stacked?: boolean (default: false), radius?: number (default: 4) }",
      "    * area: { stacked?: boolean (default: false), style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), strokeWidth?: number (default: 1), opacity?: number (default: 0.7) }",
      "  - tooltip: Optional tooltip customization - { fields?: string[], format?: Record<string, (v: unknown) => string> }",
      "    - fields: Array of column names to show in tooltip (default: all columns)",
      "    - format: Custom formatter functions for specific fields",
    ],
    returns:
      "TidyGraphWidget with display() and save methods:\n  - savePNG({ filename, width?, height?, background?, scale? }): Promise<void>\n    - scale: Resolution multiplier 1-4 (default: 1, clamped to 1-4)\n  - saveSVG({ filename, width?, height?, background? }): Promise<void>\n    - width/height default to 700x400 if not specified in layout or save options",
    examples: [
      `// Scatter plot with color encoding
import { graph } from "@tidy-ts/graph";

graph({
  df,
  type: "scatter",
  mappings: { x: "age", y: "income", color: "category" }
});`,
      `// Using accessor functions
const chart = graph({
  df,
  type: "scatter",
  mappings: {
    x: (row) => row.age,
    y: (row) => row.income * 1.1,
    color: "category"
  }
});`,
      `// Complex accessor function with conditional logic
const chart = graph({
  df,
  type: "scatter",
  mappings: {
    x: "date",
    y: (row) => row.value * (row.adjustment || 1),
    color: (row) => row.status === "active" ? "Active" : "Inactive",
    size: (row) => Math.sqrt(row.volume) * 10,
  }
});`,
      `// Handling missing/null data - filter before visualization
const cleanData = df.filter(row =>
  row.x != null && row.y != null && !isNaN(row.y)
);

graph({
  df: cleanData,
  type: "line",
  mappings: { x: "date", y: "value" },
  config: {
    line: { connectNulls: false } // Don't connect across null values
  }
});`,
      `// Best practice: Validate data before visualization
// Note: graph() will create an empty chart for empty DataFrames or missing columns,
// but validating upfront provides better error messages
if (df.nrows() === 0) {
  console.warn("DataFrame is empty - chart will have no data points");
}

const requiredCols = ["x", "y"];
const missing = requiredCols.filter(col => !df.columns().includes(col));
if (missing.length > 0) {
  console.error(\`Missing required columns: \${missing.join(", ")}\`);
}

graph({ df, type: "scatter", mappings: { x: "x", y: "y" } });`,
      `// Line chart with custom styling and domain filtering
graph({
  df,
  type: "line",
  mappings: { x: "date", y: "value", series: "category" },
  config: {
    layout: { title: "Sales Over Time", width: 800, height: 400 },
    line: { style: "monotone", strokeWidth: 3, dots: true },
    yAxis: { domain: [0, 1000], label: "Sales ($)" }
  }
});`,
      `// Bar chart with stacking
const chart = graph({
  df,
  type: "bar",
  mappings: { x: "category", y: "count", series: "region" },
  config: {
    color: { scheme: "vibrant" },
    bar: { stacked: true, radius: 8 }
  }
});`,
      `// Area chart with custom tooltip fields
graph({
  df,
  type: "area",
  mappings: { x: "date", y: "value", series: "region" },
  config: { area: { stacked: true, opacity: 0.7 } },
  tooltip: { fields: ["date", "value", "region"] }
});`,
      `// Save as PNG with high resolution
const chart = graph({ df, type: "scatter", mappings: { x: "x", y: "y" } });
await chart.savePNG({ filename: "chart.png", width: 800, height: 600, scale: 2 });
await chart.saveSVG({ filename: "chart.svg", width: 800, height: 600 });`,
      `// Scatter plot with multiple aesthetics and custom tooltip formatting
const enriched = salesData.mutate({
  revenue: (r) => r.quantity * r.price,
  profit: (r) => r.quantity * r.price * 0.2,
});

graph({
  df: enriched,
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
    format: { revenue: (v) => \`$\${Number(v).toFixed(2)}\` }
  }
});`,
      `// Date axis with automatic temporal formatting
graph({
  df,
  type: "line",
  mappings: { x: "date", y: "value" },
  config: {
    layout: { title: "Time Series" },
    // Date axis automatically gets "%b %Y" format
  }
});`,
    ],
    related: ["graphReact", "mutate", "filter", "groupBy"],
    bestPractices: [
      "✓ GOOD: Import `graph` from `@tidy-ts/graph` (not from `@tidy-ts/dataframe`)",
      "✓ GOOD: Pass the DataFrame as `df` in the options object — there is no `.graph()` method on DataFrame",
      "✓ GOOD: Use scatter plots for correlation analysis and multi-dimensional data",
      "✓ GOOD: Use line charts for trends and time series data",
      "✓ GOOD: Use bar charts for categorical comparisons",
      "✓ GOOD: Use area charts for cumulative data and part-to-whole relationships",
      "✓ GOOD: Chain DataFrame transforms first (e.g. mutate), then pass the result to graph()",
      "✓ GOOD: Use color schemes like 'professional' or 'vibrant' for better aesthetics",
      "✓ GOOD: Export charts as PNG/SVG for reports and presentations",
      "✓ GOOD: Use series mapping for multiple lines/bars/areas",
      "✓ GOOD: Configure tooltip.fields to show only relevant columns",
      "✓ GOOD: Use domain filtering to focus on specific data ranges",
      "✓ GOOD: Use scale: 2-4 for high-resolution PNG exports",
      "✓ GOOD: All row fields are automatically available in tooltips unless filtered",
      "✓ GOOD: Date columns are automatically detected and formatted as temporal axes",
      "✓ GOOD: Filter out null/NaN values before visualization to avoid rendering issues",
      "✓ GOOD: Validate DataFrame has required columns before calling graph()",
      "✓ GOOD: Use accessor functions for computed values or conditional logic",
      "✓ GOOD: Set connectNulls: false in line config to avoid connecting across missing data",
      "Charts are interactive in Jupyter notebooks with hover tooltips",
      "Backed by Vega-Lite for high-quality visualizations",
      "When domain is specified, data is filtered and chart is clipped to that range",
    ],
    antiPatterns: [
      "❌ BAD: Calling `df.graph(...)` — the method no longer exists; use `graph({ df, ... })`",
      "❌ BAD: Importing `graph` from `@tidy-ts/dataframe` — it lives in `@tidy-ts/graph`",
      "❌ BAD: Using scatter plots for time series (use line charts instead)",
      "❌ BAD: Using bar charts for continuous numeric data (use line charts)",
      "❌ BAD: Not specifying mappings.x and mappings.y (required)",
      "❌ BAD: Using 'container' width in savePNG/saveSVG (use numeric width)",
      "❌ BAD: Using scale > 4 (will be clamped to 4)",
      "❌ BAD: Visualizing DataFrames with null/NaN values without filtering first",
      "❌ BAD: Not validating DataFrame has required columns before graph()",
      "❌ BAD: Using graph() on empty DataFrames without checking",
    ],
  },

  graphReact: {
    name: "graphReact",
    category: "graph",
    signature:
      "graphReact({ df, type, mappings, config?, tooltip? }): { spec, data }",
    description:
      "Build a Vega-Lite chart and return its spec + data separately for use with React (e.g. via react-vega). Same options as `graph()`, but instead of producing a widget, returns `{ spec, data }` so the caller can render the chart with their own React integration. The `spec` has its `data` removed since the caller passes `data` independently.",
    imports: [
      'import { createDataFrame } from "@tidy-ts/dataframe";',
      'import { graphReact } from "@tidy-ts/graph";',
    ],
    parameters: [
      "Same shape as `graph()` — see the `graph` topic for the full parameter list.",
    ],
    returns:
      "{ spec: Record<string, any>, data: any[] } — `spec` is the Vega-Lite spec (sans inline data), `data` is the array of row objects to be passed alongside it (e.g. to react-vega's <VegaLite>).",
    examples: [
      `// Use with react-vega
import { graphReact } from "@tidy-ts/graph";
import { VegaLite } from "react-vega";

function MyChart({ df }) {
  const { spec, data } = graphReact({
    df,
    type: "scatter",
    mappings: { x: "x", y: "y", color: "group" },
  });
  return <VegaLite spec={spec} data={{ source: data }} />;
}`,
    ],
    related: ["graph"],
    bestPractices: [
      "✓ Use `graphReact` when integrating with React (returns spec + data separately)",
      "✓ Use `graph` for Jupyter / server-side file export workflows",
    ],
    antiPatterns: [
      "❌ Calling `graphReact` and then trying to call `.savePNG`/`.saveSVG` — that's `graph`'s API",
    ],
  },

  graphAccessorsAndValidation: {
    name: "graph: Accessors vs column names, error handling, edge cases",
    category: "graph",
    signature:
      "When to use column names vs accessors; validation and error handling",
    description:
      "Use column names (strings) in mappings when the axis or encoding maps directly to an existing DataFrame column; use accessor functions when you need computed values, conditional logic, or values derived from multiple columns. Validate data and required columns before calling graph(); handle empty or invalid data to avoid silent empty charts. Edge cases include empty DataFrames, single-row data, all-null columns, and numeric columns that are actually strings.",
    imports: [
      'import { createDataFrame } from "@tidy-ts/dataframe";',
      'import { graph } from "@tidy-ts/graph";',
    ],
    parameters: [],
    returns: "N/A (guidance)",
    examples: [
      `// WHEN TO USE COLUMN NAMES (prefer when possible)
// Use a string when the column already exists and needs no transformation.
graph({
  df,
  type: "scatter",
  mappings: { x: "date", y: "value", color: "category" }  // column names
});

// WHEN TO USE ACCESSOR FUNCTIONS
// Use (row) => value when you need: computed value, conditional logic, or multiple columns.
graph({
  df,
  type: "scatter",
  mappings: {
    x: "date",
    y: (row) => row.quantity * row.price,           // computed
    color: (row) => row.status === "active" ? "Active" : "Inactive",  // conditional
    size: (row) => Math.sqrt(row.volume)           // transformed
  }
});

// Rule of thumb: column name = direct mapping, accessor = derived or conditional.`,
      `// ERROR HANDLING: validate then render
function safeGraph(df, spec) {
  const required = ["x", "y"].filter(k => spec.mappings?.[k] == null);
  if (required.length > 0) {
    throw new Error(\`graph requires mappings.\${required.join(" and .")}\`);
  }
  const colNames = df.columns();
  const resolve = (v) => typeof v === "string" ? v : null;
  const xCol = resolve(spec.mappings.x);
  const yCol = resolve(spec.mappings.y);
  if (xCol && !colNames.includes(xCol)) {
    throw new Error(\`Column "\${xCol}" not found. Available: \${colNames.join(", ")}\`);
  }
  if (yCol && !colNames.includes(yCol)) {
    throw new Error(\`Column "\${yCol}" not found. Available: \${colNames.join(", ")}\`);
  }
  if (df.nrows() === 0) {
    console.warn("DataFrame is empty; chart will have no data points");
  }
  return graph({ df, ...spec });
}

const chart = safeGraph(df, { type: "scatter", mappings: { x: "age", y: "income" } });`,
      `// EDGE CASES AND DATA VALIDATION
// 1. Empty DataFrame: graph() returns a valid widget with no marks; check nrows() for UX.
if (df.nrows() === 0) console.warn("No data to display");

// 2. Single row: line/area may show a point; bar shows one bar. No error.
// 3. All null/NaN in a mapped column: filter first or use replaceNull/replaceUndefined.
const clean = df.filter(r => r.x != null && r.y != null && !Number.isNaN(r.y));
graph({ df: clean, type: "scatter", mappings: { x: "x", y: "y" } });

// 4. Column exists but wrong type (e.g. numbers as strings): mutate to number first.
const coerced = df.mutate({ valueNum: (r) => Number(r.value) });
graph({ df: coerced, type: "line", mappings: { x: "date", y: "valueNum" } });

// 5. savePNG/saveSVG: use try/catch for filesystem errors.
try {
  await chart.savePNG({ filename: "out.png" });
} catch (e) {
  console.error("Failed to save chart:", e);
}`,
    ],
    bestPractices: [
      "✓ Use column names for x, y, color, series when mapping existing columns; simpler and avoids per-row function calls",
      "✓ Use accessor functions when you need computed values (e.g. row.a * row.b), conditional encoding, or type coercion",
      "✓ Validate required columns (df.columns().includes(...)) before graph() when spec uses string mappings",
      "✓ Check df.nrows() === 0 and handle in UI (message or skip chart) instead of relying on empty chart",
      "✓ Filter or replace null/undefined/NaN in mapped columns before visualization",
      "✓ Wrap savePNG/saveSVG in try/catch when writing to disk or when dimensions may be invalid",
    ],
    antiPatterns: [
      "❌ Using accessors for every mapping when column names would suffice (reduces clarity and can affect performance)",
      "❌ Using column names for derived values (e.g. mappings.y = 'total' when 'total' does not exist; use mutate first or an accessor)",
      "❌ Calling graph() without checking for missing columns when mappings use strings",
    ],
    related: ["graph", "graphReact", "mutate", "filter", "replaceNull", "replaceUndefined"],
  },
};
