import { DataFrame } from '@tidy-ts/dataframe';

/**
 * Minimal anywidget implementation for Deno Jupyter kernel.
 * Extracted from @anywidget/deno to reduce dependencies.
 */
type ChangeEvents<State> = {
    [K in string & keyof State as `change:${K}`]: State[K];
};
/** A BackboneJS-like model for the anywidget. */
declare class Model<State> {
    private _state;
    private _target;
    constructor(state: State);
    get<K extends keyof State>(key: K): State[K];
    set<K extends keyof State>(key: K, value: State[K]): void;
    on<Event extends keyof ChangeEvents<State>>(name: Event, callback: () => void): void;
}

type TidyGraphWidget = Model<any> & {
    saveSVG: ({ filename, width, height, background, }: {
        filename: string;
        width?: number;
        height?: number;
        background?: string;
    }) => Promise<void>;
    savePNG: ({ filename, width, height, background, scale, }: {
        filename: string;
        width?: number;
        height?: number;
        background?: string;
        scale?: number;
    }) => Promise<void>;
};

type ColumnName<T> = Extract<keyof T, string>;
type Accessor<T, U> = (row: T) => U;
type ColumnSpec<T, U = unknown> = ColumnName<T> | Accessor<T, U> | readonly U[];
type TooltipOptions<T> = {
    fields?: Array<ColumnName<T>>;
    format?: Record<string, (v: unknown) => string>;
};
/**
 * Axis configuration options for charts.
 */
type AxisConfig = {
    /** Label text for the axis */
    label?: string;
    /** Fixed domain range [min, max] */
    domain?: readonly [unknown, unknown];
    /** Custom formatter function for tick labels */
    tickFormat?: (v: unknown) => string;
    /** Hide this axis completely */
    hide?: boolean;
};
/**
 * Grid configuration options for charts.
 */
type GridConfig = {
    /** Show/hide grid lines (default: true) */
    show?: boolean;
    /** Show/hide vertical grid lines */
    vertical?: boolean;
    /** Show/hide horizontal grid lines */
    horizontal?: boolean;
};
/**
 * Layout configuration options for charts.
 */
type LayoutConfig = {
    /** Chart title displayed at the top */
    title?: string;
    /** Subtitle/description text displayed below the title */
    description?: string;
    /** Chart width in pixels, or "container" to fill parent */
    width?: number | "container";
    /** Chart height in pixels */
    height?: number;
};
/**
 * Color and theming configuration options for charts.
 */
type ColorConfig = {
    /** Custom color palette as array of hex/rgb/hsl colors */
    colors?: string[];
    /**
     * Predefined color schemes:
     * - "default": Standard blue/green/orange palette
     * - "blue"/"green"/"red"/"purple"/"orange": Monochromatic schemes
     * - "vibrant": High-contrast vibrant colors
     * - "professional": Muted professional colors
     * - "high_contrast": WCAG-compliant high contrast colors
     */
    scheme?: "default" | "blue" | "green" | "red" | "purple" | "orange" | "vibrant" | "professional" | "high_contrast";
};
/**
 * Legend configuration options for charts.
 */
type LegendConfig = {
    /** Show/hide legend (default: true when using color/series) */
    show?: boolean;
    /**
     * Legend position:
     * - "top"/"bottom"/"left"/"right": Edge positions
     * - "top-left"/"top-right"/"bottom-left"/"bottom-right": Corner positions
     */
    position?: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    /** Font size for legend labels in pixels (default: 12) */
    fontSize?: number;
    /** Font size for legend title in pixels (default: 13) */
    titleFontSize?: number;
};
/**
 * Tooltip configuration options for charts.
 */
type TooltipConfig = {
    /** Show/hide interactive tooltips on hover (default: true) */
    show?: boolean;
};
/**
 * Interactivity configuration options for charts.
 */
type InteractivityConfig = {
    /** Enable zoom functionality (mouse wheel/pinch) */
    zoom?: boolean;
    /** Enable pan functionality (click and drag) */
    pan?: boolean;
};
/**
 * Accessibility configuration options for charts.
 */
type AccessibilityConfig = {
    /** Add accessibility layer for screen readers */
    layer?: boolean;
};
/**
 * Animation configuration options for charts.
 */
type AnimationConfig = {
    /** Animation duration in milliseconds for transitions */
    duration?: number;
};
/**
 * Line chart specific configuration options.
 */
type LineChartConfig = {
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
};
/**
 * Scatter plot specific configuration options.
 */
type ScatterChartConfig = {
    /** Size of scatter plot points in pixels (default: 60) */
    pointSize?: number;
    /** Opacity of scatter plot points from 0-1 (default: 0.8) */
    pointOpacity?: number;
};
/**
 * Bar chart specific configuration options.
 */
type BarChartConfig = {
    /** Stack bars on top of each other when using series (default: false) */
    stacked?: boolean;
    /** Corner radius for bar ends in pixels (default: 4) */
    radius?: number;
};
/**
 * Area chart specific configuration options.
 */
type AreaChartConfig = {
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
    /** Opacity of the area fill from 0-1 (default: 0.7) */
    opacity?: number;
};
/**
 * Common configuration options available for all chart types.
 * These are shared across all chart types but don't include chart-specific sections.
 */
type CommonConfig = {
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
};
/**
 * Column mappings for scatter plots.
 * Defines which data columns map to visual properties.
 */
type ScatterMappings<T> = {
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
};
/**
 * Configuration options specific to scatter plots.
 * Includes common options plus scatter-specific options only.
 */
type ScatterConfig = CommonConfig & {
    /** Scatter plot specific options */
    scatter?: ScatterChartConfig;
};
/**
 * Column mappings for line charts.
 * Defines which data columns map to visual properties.
 */
type LineMappings<T> = {
    /** Column name or accessor function for X-axis position */
    x: ColumnSpec<T>;
    /** Column name or accessor function for Y-axis position */
    y: ColumnSpec<T, number | null | undefined>;
    /** Optional: Column for grouping multiple lines/series */
    series?: ColumnSpec<T, string | number>;
    /** Optional: Column for line color encoding (alternative to series) */
    color?: ColumnSpec<T, string | number>;
};
/**
 * Configuration options specific to line charts.
 * Includes common options plus line-specific options only.
 */
type LineConfig = CommonConfig & {
    /** Line chart specific options */
    line?: LineChartConfig;
};
/**
 * Column mappings for bar charts.
 * Defines which data columns map to visual properties.
 */
type BarMappings<T> = {
    /** Column name or accessor function for X-axis categories */
    x: ColumnSpec<T>;
    /** Column name or accessor function for Y-axis values (bar heights) */
    y: ColumnSpec<T, number | null | undefined>;
    /** Optional: Column for grouping multiple bar series */
    series?: ColumnSpec<T, string | number>;
    /** Optional: Column for bar color encoding (alternative to series) */
    color?: ColumnSpec<T, string | number>;
};
/**
 * Configuration options specific to bar charts.
 * Includes common options plus bar-specific options only.
 */
type BarConfig = CommonConfig & {
    /** Bar chart specific options */
    bar?: BarChartConfig;
};
/**
 * Column mappings for area charts.
 * Defines which data columns map to visual properties.
 */
type AreaMappings<T> = {
    /** Column name or accessor function for X-axis position */
    x: ColumnSpec<T>;
    /** Column name or accessor function for Y-axis values (area heights) */
    y: ColumnSpec<T, number | null | undefined>;
    /** Optional: Column for grouping multiple area series */
    series?: ColumnSpec<T, string | number>;
    /** Optional: Column for area color encoding (alternative to series) */
    color?: ColumnSpec<T, string | number>;
};
/**
 * Configuration options specific to area charts.
 * Includes common options plus area-specific options only.
 */
type AreaConfig = CommonConfig & {
    /** Area chart specific options */
    area?: AreaChartConfig;
};
/**
 * Scatter plot configuration options.
 * For analyzing correlations and multi-dimensional data relationships.
 */
type ScatterOptions<T> = {
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
type LineOptions<T> = {
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
type BarOptions<T> = {
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
type AreaOptions<T> = {
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
type GraphOptions<T> = ScatterOptions<T> | LineOptions<T> | BarOptions<T> | AreaOptions<T>;
declare function graph<T extends Record<string, unknown>>({ df, ...spec }: {
    df: DataFrame<T>;
} & GraphOptions<T>): TidyGraphWidget;
/**
 * Creates a graph specification that can be used with React components.
 * Returns both the Vega-Lite specification and the data for React-Vega integration.
 */
declare function graphReact<T extends Record<string, unknown>>({ df, ...spec }: {
    df: DataFrame<T>;
} & GraphOptions<T>): {
    spec: any;
    data: any[];
};

declare function saveGraphAsSVG(df: any, spec: GraphOptions<any>, { filename, width, height, background, }: {
    filename: string;
    width?: number;
    height?: number;
    background?: string;
}): Promise<void>;
declare function saveGraphAsPNG(df: any, spec: GraphOptions<any>, { filename, width, height, background, scale, }: {
    filename: string;
    width?: number;
    height?: number;
    background?: string;
    scale?: number;
}): Promise<void>;

export { graph, graphReact, saveGraphAsPNG, saveGraphAsSVG };
export type { GraphOptions, TidyGraphWidget };
