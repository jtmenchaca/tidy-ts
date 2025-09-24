// deno-lint-ignore-file no-explicit-any
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../dataframe/index.ts";
import type { TidyGraphWidget } from "./graph-types.ts";
import { vegaLiteWidget } from "./scatter-widget.ts";
import { saveGraphAsPNG, saveGraphAsSVG } from "./export-utils.ts";

/* ──────────────────────────────────────────────────────────────────────────
   Typed column selectors & top-level options
   ────────────────────────────────────────────────────────────────────────── */

export type ColumnName<T> = Extract<keyof T, string>;
export type Accessor<T, U> = (row: T) => U;
export type ColumnSpec<T, U = unknown> =
  | ColumnName<T>
  | Accessor<T, U>
  | readonly U[];

export type TooltipOptions<T> = {
  fields?: Array<ColumnName<T>>;
  format?: Record<string, (v: unknown) => string>;
};

/**
 * Axis configuration options for charts.
 */
export type AxisConfig = Prettify<{
  /** Label text for the axis */
  label?: string;
  /** Fixed domain range [min, max] */
  domain?: readonly [unknown, unknown];
  /** Custom formatter function for tick labels */
  tickFormat?: (v: unknown) => string;
  /** Hide this axis completely */
  hide?: boolean;
}>;

/**
 * Grid configuration options for charts.
 */
export type GridConfig = Prettify<{
  /** Show/hide grid lines (default: true) */
  show?: boolean;
  /** Show/hide vertical grid lines */
  vertical?: boolean;
  /** Show/hide horizontal grid lines */
  horizontal?: boolean;
}>;

/**
 * Layout configuration options for charts.
 */
export type LayoutConfig = Prettify<{
  /** Chart title displayed at the top */
  title?: string;
  /** Subtitle/description text displayed below the title */
  description?: string;
  /** Chart width in pixels, or "container" to fill parent */
  width?: number | "container";
  /** Chart height in pixels */
  height?: number;
}>;

/**
 * Color and theming configuration options for charts.
 */
export type ColorConfig = Prettify<{
  /** Custom color palette as array of hex/rgb/hsl colors */
  colors?: string[];
  /**
   * Predefined color schemes:
   * - "default": Standard blue/green/orange palette
   * - "blue"/"green"/"red"/"purple"/"orange": Monochromatic schemes
   * - "oklch_vibrant": High-contrast vibrant colors
   * - "oklch_professional": Muted professional colors
   * - "oklch_accessible": WCAG-compliant accessible colors
   */
  scheme?:
    | "default"
    | "blue"
    | "green"
    | "red"
    | "purple"
    | "orange"
    | "oklch_vibrant"
    | "oklch_professional"
    | "oklch_accessible";
}>;

/**
 * Legend configuration options for charts.
 */
export type LegendConfig = Prettify<{
  /** Show/hide legend (default: true when using color/series) */
  show?: boolean;
  /**
   * Legend position:
   * - "top"/"bottom"/"left"/"right": Edge positions
   * - "top-left"/"top-right"/"bottom-left"/"bottom-right": Corner positions
   */
  position?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
}>;

/**
 * Tooltip configuration options for charts.
 */
export type TooltipConfig = Prettify<{
  /** Show/hide interactive tooltips on hover (default: true) */
  show?: boolean;
}>;

/**
 * Interactivity configuration options for charts.
 */
export type InteractivityConfig = Prettify<{
  /** Enable zoom functionality (mouse wheel/pinch) */
  zoom?: boolean;
  /** Enable pan functionality (click and drag) */
  pan?: boolean;
}>;

/**
 * Accessibility configuration options for charts.
 */
export type AccessibilityConfig = Prettify<{
  /** Add accessibility layer for screen readers */
  layer?: boolean;
}>;

/**
 * Animation configuration options for charts.
 */
export type AnimationConfig = Prettify<{
  /** Animation duration in milliseconds for transitions */
  duration?: number;
}>;

/**
 * Line chart specific configuration options.
 */
export type LineChartConfig = Prettify<{
  /**
   * Line interpolation style:
   * - "linear": Straight lines between points
   * - "monotone": Smooth curves that preserve monotonicity
   * - "step": Step function (horizontal then vertical)
   * - "basis": Smooth B-spline curves
   * - "cardinal": Smooth cardinal spline curves
   */
  style?: "monotone" | "linear" | "step" | "basis" | "cardinal";
  /** Show dots/points at data points along the line (default: false) */
  dots?: boolean;
  /** Line thickness in pixels (default: 2) */
  strokeWidth?: number;
  /** Connect points across null/undefined values (default: false) */
  connectNulls?: boolean;
}>;

/**
 * Scatter plot specific configuration options.
 */
export type ScatterChartConfig = Prettify<{
  /** Size of scatter plot points in pixels (default: 60) */
  pointSize?: number;
  /** Opacity of scatter plot points from 0-1 (default: 0.8) */
  pointOpacity?: number;
}>;

/**
 * Bar chart specific configuration options.
 */
export type BarChartConfig = Prettify<{
  /** Stack bars on top of each other when using series (default: false) */
  stacked?: boolean;
  /** Corner radius for bar ends in pixels (default: 4) */
  radius?: number;
}>;

/**
 * Area chart specific configuration options.
 */
export type AreaChartConfig = Prettify<{
  /** Stack areas on top of each other when using series (default: false) */
  stacked?: boolean;
  /**
   * Line interpolation style for area boundaries:
   * - "linear": Straight lines between points
   * - "monotone": Smooth curves that preserve monotonicity
   * - "step": Step function (horizontal then vertical)
   * - "basis": Smooth B-spline curves
   * - "cardinal": Smooth cardinal spline curves
   */
  style?: "monotone" | "linear" | "step" | "basis" | "cardinal";
  /** Thickness of the area boundary line in pixels (default: 1) */
  strokeWidth?: number;
}>;

/**
 * Common configuration options available for all chart types.
 * These are shared across all chart types but don't include chart-specific sections.
 */
export type CommonConfig = Prettify<{
  /** Layout and sizing options */
  layout?: LayoutConfig;
  /** X-axis configuration */
  xAxis?: AxisConfig;
  /** Y-axis configuration */
  yAxis?: AxisConfig;
  /** Grid line configuration */
  grid?: GridConfig;
  /** Color and theming options */
  color?: ColorConfig;
  /** Legend configuration */
  legend?: LegendConfig;
  /** Tooltip configuration */
  tooltip?: TooltipConfig;
  /** Interactivity options */
  interactivity?: InteractivityConfig;
  /** Accessibility options */
  accessibility?: AccessibilityConfig;
  /** Animation options */
  animation?: AnimationConfig;
}>;

/**
 * Internal config type used for runtime - includes all chart options.
 * Not exposed to users to maintain type safety.
 */
type InternalConfig = Prettify<
  CommonConfig & {
    /** Line chart specific options */
    line?: LineChartConfig;
    /** Scatter plot specific options */
    scatter?: ScatterChartConfig;
    /** Bar chart specific options */
    bar?: BarChartConfig;
    /** Area chart specific options */
    area?: AreaChartConfig;
  }
>;

/* chart-specific mappings + configs */

/**
 * Column mappings for scatter plots.
 * Defines which data columns map to visual properties.
 */
export type ScatterMappings<T> = Prettify<{
  /** Column name or accessor function for X-axis position */
  x: ColumnSpec<T>;
  /** Column name or accessor function for Y-axis position */
  y: ColumnSpec<T, number | null | undefined>;
  /** Optional: Column for color encoding (categorical or continuous) */
  color?: ColumnSpec<T, string | number>;
  /** Optional: Column for point size encoding (numeric values) */
  size?: ColumnSpec<T, number | null | undefined>;
  /** Optional: Column for point shape encoding (categorical values) */
  shape?: ColumnSpec<T, string | number>;
}>;
/**
 * Configuration options specific to scatter plots.
 * Includes common options plus scatter-specific options only.
 */
export type ScatterConfig = Prettify<
  CommonConfig & {
    /** Scatter plot specific options */
    scatter?: ScatterChartConfig;
  }
>;

/**
 * Column mappings for line charts.
 * Defines which data columns map to visual properties.
 */
export type LineMappings<T> = Prettify<{
  /** Column name or accessor function for X-axis position */
  x: ColumnSpec<T>;
  /** Column name or accessor function for Y-axis position */
  y: ColumnSpec<T, number | null | undefined>;
  /** Optional: Column for grouping multiple lines/series */
  series?: ColumnSpec<T, string | number>;
  /** Optional: Column for line color encoding (alternative to series) */
  color?: ColumnSpec<T, string | number>;
}>;

/**
 * Configuration options specific to line charts.
 * Includes common options plus line-specific options only.
 */
export type LineConfig = Prettify<
  CommonConfig & {
    /** Line chart specific options */
    line?: LineChartConfig;
  }
>;

/**
 * Column mappings for bar charts.
 * Defines which data columns map to visual properties.
 */
export type BarMappings<T> = Prettify<{
  /** Column name or accessor function for X-axis categories */
  x: ColumnSpec<T>;
  /** Column name or accessor function for Y-axis values (bar heights) */
  y: ColumnSpec<T, number | null | undefined>;
  /** Optional: Column for grouping multiple bar series */
  series?: ColumnSpec<T, string | number>;
  /** Optional: Column for bar color encoding (alternative to series) */
  color?: ColumnSpec<T, string | number>;
}>;

/**
 * Configuration options specific to bar charts.
 * Includes common options plus bar-specific options only.
 */
export type BarConfig = Prettify<
  CommonConfig & {
    /** Bar chart specific options */
    bar?: BarChartConfig;
  }
>;

/**
 * Column mappings for area charts.
 * Defines which data columns map to visual properties.
 */
export type AreaMappings<T> = Prettify<{
  /** Column name or accessor function for X-axis position */
  x: ColumnSpec<T>;
  /** Column name or accessor function for Y-axis values (area heights) */
  y: ColumnSpec<T, number | null | undefined>;
  /** Optional: Column for grouping multiple area series */
  series?: ColumnSpec<T, string | number>;
  /** Optional: Column for area color encoding (alternative to series) */
  color?: ColumnSpec<T, string | number>;
}>;

/**
 * Configuration options specific to area charts.
 * Includes common options plus area-specific options only.
 */
export type AreaConfig = Prettify<
  CommonConfig & {
    /** Area chart specific options */
    area?: AreaChartConfig;
  }
>;

/**
 * Scatter plot configuration options.
 * For analyzing correlations and multi-dimensional data relationships.
 */
export type ScatterOptions<T> = {
  /** Chart type identifier */
  type: "scatter";
  /** Column mappings for scatter plot aesthetics */
  mappings: ScatterMappings<T>;
  /**
   * Scatter plot configuration options.
   * Includes all BaseConfig options plus scatter-specific settings in config.scatter:
   * - pointSize?: number - Size of points in pixels (default: 60)
   * - pointOpacity?: number - Point opacity 0-1 (default: 0.8)
   */
  config?: ScatterConfig;
  /** Tooltip customization options */
  tooltip?: TooltipOptions<T>;
};

/**
 * Line chart configuration options.
 * For displaying trends, time series, and continuous data.
 */
export type LineOptions<T> = {
  /** Chart type identifier */
  type: "line";
  /** Column mappings for line chart aesthetics */
  mappings: LineMappings<T>;
  /**
   * Line chart configuration options.
   * Includes all BaseConfig options plus line-specific settings in config.line:
   * - style?: "monotone" | "linear" | "step" | "basis" | "cardinal" - Line interpolation
   * - dots?: boolean - Show points along the line (default: false)
   * - strokeWidth?: number - Line thickness in pixels (default: 2)
   * - connectNulls?: boolean - Connect across null values (default: false)
   */
  config?: LineConfig;
  /** Tooltip customization options */
  tooltip?: TooltipOptions<T>;
};

/**
 * Bar chart configuration options.
 * For categorical comparisons and discrete data visualization.
 */
export type BarOptions<T> = {
  /** Chart type identifier */
  type: "bar";
  /** Column mappings for bar chart aesthetics */
  mappings: BarMappings<T>;
  /**
   * Bar chart configuration options.
   * Includes all BaseConfig options plus bar-specific settings in config.bar:
   * - stacked?: boolean - Stack bars when using series (default: false)
   * - radius?: number - Corner radius in pixels (default: 4)
   */
  config?: BarConfig;
  /** Tooltip customization options */
  tooltip?: TooltipOptions<T>;
};

/**
 * Area chart configuration options.
 * For cumulative data and part-to-whole relationships.
 */
export type AreaOptions<T> = {
  /** Chart type identifier */
  type: "area";
  /** Column mappings for area chart aesthetics */
  mappings: AreaMappings<T>;
  /**
   * Area chart configuration options.
   * Includes all BaseConfig options plus area-specific settings in config.area:
   * - stacked?: boolean - Stack areas when using series (default: false)
   * - style?: "monotone" | "linear" | "step" | "basis" | "cardinal" - Border line style
   * - strokeWidth?: number - Border line thickness in pixels (default: 1)
   */
  config?: AreaConfig;
  /** Tooltip customization options */
  tooltip?: TooltipOptions<T>;
};

export type GraphOptions<T> =
  | ScatterOptions<T>
  | LineOptions<T>
  | BarOptions<T>
  | AreaOptions<T>;

/* palettes (unchanged) */

const COLOR_SCHEMES = {
  default: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"],
  blue: ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"],
  green: ["#34d399", "#10b981", "#059669", "#047857", "#065f46"],
  red: ["#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b"],
  purple: ["#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
  orange: ["#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412"],
  oklch_vibrant: [
    "oklch(0.7 0.25 240)",
    "oklch(0.75 0.25 120)",
    "oklch(0.7 0.25 60)",
    "oklch(0.7 0.25 300)",
    "oklch(0.7 0.25 0)",
  ],
  oklch_professional: [
    "oklch(0.6 0.15 240)",
    "oklch(0.65 0.15 150)",
    "oklch(0.6 0.15 270)",
    "oklch(0.55 0.15 30)",
    "oklch(0.5 0.15 0)",
  ],
  oklch_accessible: [
    "oklch(0.55 0.2 240)",
    "oklch(0.6 0.2 120)",
    "oklch(0.5 0.2 30)",
    "oklch(0.45 0.15 300)",
    "oklch(0.5 0.2 0)",
  ],
} as const;

/* helpers */

function arrFrom<T extends Record<string, unknown>, U>(
  df: DataFrame<T> | GroupedDataFrame<T>,
  selector: ColumnSpec<T, U>,
): U[] {
  if (Array.isArray(selector)) return selector as U[];
  if (typeof selector === "function") {
    return (df.toArray() as T[]).map(selector as (r: T) => U);
  }
  return ((df as any)[String(selector)] as U[]) ?? [];
}

const mapLineInterpolation = (s?: string): string =>
  s === "step" || s === "basis" || s === "cardinal" || s === "monotone"
    ? s
    : "linear";

const nearestLegendOrient = (
  p?: LegendConfig["position"],
): "top" | "bottom" | "left" | "right" => {
  if (!p) return "right";
  if (p.includes("top")) return "top";
  if (p.includes("bottom")) return "bottom";
  if (p.includes("left")) return "left";
  return "right";
};

/* ──────────────────────────────────────────────────────────────────────────
   Data → rows with stable field names, driven by mappings
   ────────────────────────────────────────────────────────────────────────── */

function toVegaData<T extends Record<string, unknown>>(
  df: DataFrame<T>,
  spec: GraphOptions<T>,
) {
  const rows = df.toArray() as T[];
  const m = spec.mappings as Record<string, ColumnSpec<T, unknown>>;

  // Prefer explicit color; fall back to series if provided
  const colorMapping = m.color ??
    (m.series as ColumnSpec<T, string | number> | undefined);

  const getName = (sel: ColumnSpec<T, unknown> | undefined, fallback: string) =>
    typeof sel === "string" ? sel : fallback;

  const xField = getName(m.x, "x");
  const yField = getName(m.y, "y");
  const colorField = colorMapping ? getName(colorMapping, "color") : null;
  const sizeField = "size" in m && m.size ? getName(m.size, "size") : null;
  const shapeField = "shape" in m && m.shape ? getName(m.shape, "shape") : null;

  const xVals = arrFrom(df, m.x);
  const yVals = arrFrom(df, m.y as ColumnSpec<T, number | null | undefined>);
  const colorVals = colorMapping ? arrFrom(df, colorMapping) : null;
  const sizeVals = sizeField
    ? arrFrom(df, m.size as ColumnSpec<T, number | null | undefined>)
    : null;
  const shapeVals = shapeField
    ? arrFrom(df, m.shape as ColumnSpec<T, string | number>)
    : null;

  const out: any[] = [];
  const n = Math.min(xVals.length, yVals.length);
  for (let i = 0; i < n; i++) {
    const pt: Record<string, unknown> = {
      [xField]: xVals[i],
      [yField]: yVals[i],
    };
    if (colorField && colorVals) pt[colorField] = colorVals[i];
    if (sizeField && sizeVals) pt[sizeField] = sizeVals[i];
    if (shapeField && shapeVals) pt[shapeField] = shapeVals[i];

    // copy remaining row fields for tooltips (without clobbering)
    const row = rows[i];
    if (row) {
      for (const [k, v] of Object.entries(row)) if (!(k in pt)) pt[k] = v;
    }

    out.push(pt);
  }
  return {
    data: out,
    fields: { xField, yField, colorField, sizeField, shapeField },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Build Vega-Lite spec from typed options
   ────────────────────────────────────────────────────────────────────────── */

// Helper function to extract config values with both nested and flat support

function buildVegaSpec<T extends Record<string, unknown>>(
  rows: any[],
  spec: GraphOptions<T>,
  fields: {
    xField: string;
    yField: string;
    colorField: string | null;
    sizeField: string | null;
    shapeField: string | null;
  },
) {
  const cfg = (spec.config ?? {}) as InternalConfig;
  const { xField, yField, colorField, sizeField, shapeField } = fields;

  // infer types for x/y
  const xType = rows.length && rows[0][xField] instanceof Date
    ? "temporal"
    : typeof rows[0]?.[xField] === "number"
    ? "quantitative"
    : "ordinal";
  const yType = "quantitative";

  // mark by chart type
  let mark: any;
  if (spec.type === "scatter") {
    mark = {
      type: "point",
      filled: true,
      size: cfg.scatter?.pointSize ?? 60,
      opacity: cfg.scatter?.pointOpacity ?? 0.8,
    };
  } else if (spec.type === "line") {
    mark = {
      type: "line",
      point: cfg.line?.dots ? { filled: true, size: 50 } : false,
      strokeWidth: cfg.line?.strokeWidth ?? 2,
      interpolate: mapLineInterpolation(cfg.line?.style),
    };
  } else if (spec.type === "bar") {
    mark = { type: "bar", cornerRadiusEnd: cfg.bar?.radius ?? 4 };
  } else {
    mark = {
      type: "area",
      line: cfg.area?.strokeWidth
        ? { strokeWidth: cfg.area.strokeWidth }
        : true,
      interpolate: mapLineInterpolation(cfg.area?.style),
      opacity: 0.7,
    };
  }

  // Extract values from nested structure
  const xLabel = cfg.xAxis?.label ?? xField;
  const yLabel = cfg.yAxis?.label ?? yField;
  const hideXAxis = cfg.xAxis?.hide ?? false;
  const hideYAxis = cfg.yAxis?.hide ?? false;
  const xDomain = cfg.xAxis?.domain;
  const yDomain = cfg.yAxis?.domain;

  // encoding
  const encoding: any = {
    x: {
      field: xField,
      type: xType,
      title: xLabel,
      axis: hideXAxis ? null : {
        labelAngle: xType !== "quantitative" ? -45 : 0,
        format: xType === "temporal" ? "%b %Y" : undefined,
      },
      scale: xDomain ? { domain: xDomain } : {},
    },
    y: {
      field: yField,
      type: yType,
      title: yLabel,
      axis: hideYAxis ? null : {},
      scale: yDomain ? { domain: yDomain } : {},
    },
  };

  if (colorField) {
    const colorType = typeof rows[0]?.[colorField] === "number"
      ? "quantitative"
      : "nominal";
    encoding.color = {
      field: colorField,
      type: colorType,
      legend: cfg.legend?.show === false
        ? null
        : { orient: nearestLegendOrient(cfg.legend?.position) },
      scale: (cfg.color?.colors || cfg.color?.scheme)
        ? {
          range: cfg.color?.colors ??
            COLOR_SCHEMES[cfg.color?.scheme ?? "default"],
        }
        : {},
    };
  }
  if (sizeField) {
    encoding.size = {
      field: sizeField,
      type: "quantitative",
      legend: cfg.legend?.show === false ? null : {},
    };
  }
  if (shapeField) {
    encoding.shape = {
      field: shapeField,
      type: "nominal",
      legend: cfg.legend?.show === false ? null : {},
    };
  }

  // stacking for bar/area
  if (
    (spec.type === "bar" || spec.type === "area") &&
    ((spec.type === "bar" && cfg.bar?.stacked) ||
      (spec.type === "area" && cfg.area?.stacked)) &&
    colorField
  ) {
    encoding.y.stack = "zero";
  }

  // tooltip
  if (cfg.tooltip?.show !== false) {
    const t = spec.tooltip;
    const fields = t?.fields ?? Object.keys(rows[0] ?? {});
    encoding.tooltip = fields.map((f) => ({
      field: f,
      type: typeof rows[0]?.[f] === "number"
        ? "quantitative"
        : rows[0]?.[f] instanceof Date
        ? "temporal"
        : "nominal",
    }));
  }

  // base spec
  const vl: any = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { values: rows },
    mark,
    encoding,
    width: cfg.layout?.width ?? "container",
    height: cfg.layout?.height ?? 400,
    config: {
      background: "white",
      view: { stroke: "transparent" },
      ...(cfg.grid?.show !== false
        ? { axis: { grid: true, gridOpacity: 0.3 } }
        : {}),
      ...(cfg.color?.colors || cfg.color?.scheme
        ? {
          range: {
            category: cfg.color?.colors ??
              COLOR_SCHEMES[cfg.color?.scheme ?? "default"],
          },
        }
        : {}),
    },
  };

  // grid toggles
  if (cfg.grid?.show !== false) {
    if (cfg.grid?.vertical === false) {
      vl.encoding.x.axis = vl.encoding.x.axis ?? {};
      vl.encoding.x.axis.grid = false;
    }
    if (cfg.grid?.horizontal === false) {
      vl.encoding.y.axis = vl.encoding.y.axis ?? {};
      vl.encoding.y.axis.grid = false;
    }
  }

  // title/description
  if (cfg.layout?.title || cfg.layout?.description) {
    vl.title = {
      ...(cfg.layout?.title
        ? { text: cfg.layout.title, fontSize: 16, fontWeight: 600 }
        : {}),
      ...(cfg.layout?.description
        ? {
          subtitle: cfg.layout.description,
          subtitleFontSize: 12,
          subtitleColor: "#666",
        }
        : {}),
    };
  }

  // zoom/pan via interval bound to scales
  if (cfg.interactivity?.zoom || cfg.interactivity?.pan) {
    vl.params = [{
      name: "zoom",
      select: { type: "interval", bind: "scales" },
    }];
  }

  return vl;
}

/* ──────────────────────────────────────────────────────────────────────────
   Public graph() — now accepts GraphOptions<T>
   ────────────────────────────────────────────────────────────────────────── */

export function graph<T extends Record<string, unknown>>(
  spec: GraphOptions<T>,
) {
  return (df: DataFrame<T>): TidyGraphWidget => {
    // Cast to internal GraphOptions type for backwards compatibility
    const graphSpec = spec as GraphOptions<T>;
    const { data, fields } = toVegaData(df, graphSpec);
    const vlSpec = buildVegaSpec(data, graphSpec, fields);

    const specForWidget = { ...vlSpec };
    delete specForWidget.data;

    const widgetInstance = vegaLiteWidget(
      data,
      specForWidget,
    ) as TidyGraphWidget;

    // Jupyter-independent, server-side file saves:
    widgetInstance.saveSVG = async (
      { filename, width, height, background },
    ) => {
      await saveGraphAsSVG(df, graphSpec, {
        filename,
        width,
        height,
        background,
      });
    };
    widgetInstance.savePNG = async (
      { filename, width, height, background, scale },
    ) => {
      await saveGraphAsPNG(df, graphSpec, {
        filename,
        width,
        height,
        background,
        scale,
      });
    };

    return widgetInstance;
  };
}

/**
 * Creates a graph specification that can be used with React components.
 * Returns both the Vega-Lite specification and the data for React-Vega integration.
 */
export function graphReact<T extends Record<string, unknown>>(
  spec: GraphOptions<T>,
) {
  return (df: DataFrame<T>): { spec: any; data: any[] } => {
    const graphSpec = spec as GraphOptions<T>;
    const { data, fields } = toVegaData(df, graphSpec);
    const vlSpec = buildVegaSpec(data, graphSpec, fields);

    // Remove the data from spec since we return it separately for React
    const reactSpec = { ...vlSpec };
    delete reactSpec.data;

    return {
      spec: reactSpec,
      data: data,
    };
  };
}
