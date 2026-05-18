// packages/graph/ts/anywidget-minimal.ts
import { currentRuntime, Runtime } from "@tidy-ts/shims";
function remove_buffers(state) {
  const buffers = [];
  const buffer_paths = [];
  const out = {};
  for (const key in state) {
    if (state[key] instanceof Uint8Array) {
      out[key] = null;
      buffers.push(state[key]);
      buffer_paths.push([key]);
    } else {
      out[key] = state[key];
    }
  }
  return {
    // @ts-expect-error - we know the type
    state: out,
    buffers,
    buffer_paths
  };
}
var jupyter_broadcast = (() => {
  try {
    if (currentRuntime === Runtime.Deno) {
      const deno = globalThis.Deno;
      return deno?.jupyter?.broadcast ?? (async () => {
      });
    }
    return async () => {
    };
  } catch (_) {
    return async () => {
    };
  }
})();
var ANYWIDGET_SEMVER_VERSION = "~0.9.*";
var COMMS = /* @__PURE__ */ new WeakMap();
var init_promise_symbol = Symbol("init_promise");
var Comm = class {
  #id;
  #anywidget_version;
  #protocol_version_major;
  #protocol_version_minor;
  constructor({ anywidget_version }) {
    this.#id = crypto.randomUUID();
    this.#anywidget_version = anywidget_version ?? ANYWIDGET_SEMVER_VERSION;
    this.#protocol_version_major = 2;
    this.#protocol_version_minor = 1;
  }
  get id() {
    return this.#id;
  }
  init(data = {}) {
    const { state, buffers, buffer_paths } = remove_buffers(data);
    return jupyter_broadcast(
      "comm_open",
      {
        comm_id: this.id,
        target_name: "jupyter.widget",
        data: {
          state: {
            _model_module: "anywidget",
            _model_name: "AnyModel",
            _model_module_version: this.#anywidget_version,
            _view_module: "anywidget",
            _view_name: "AnyView",
            _view_module_version: this.#anywidget_version,
            _view_count: null,
            ...state
          },
          buffer_paths
        }
      },
      {
        buffers,
        metadata: {
          version: `${this.#protocol_version_major}.${this.#protocol_version_minor}.0`
        }
      }
    );
  }
  send_state(data) {
    const { state, buffers, buffer_paths } = remove_buffers(data);
    return jupyter_broadcast(
      "comm_msg",
      {
        comm_id: this.id,
        data: {
          method: "update",
          state,
          buffer_paths
        }
      },
      {
        buffers
      }
    );
  }
  mimebundle() {
    return {
      "application/vnd.jupyter.widget-view+json": {
        version_major: this.#protocol_version_major,
        version_minor: this.#protocol_version_minor,
        model_id: this.id
      }
    };
  }
};
var Model = class {
  _state;
  _target;
  constructor(state) {
    this._state = state;
    this._target = new EventTarget();
  }
  get(key) {
    return this._state[key];
  }
  set(key, value) {
    this._state[key] = value;
    this._target.dispatchEvent(
      new CustomEvent(`change:${key}`, { detail: value })
    );
  }
  on(name, callback) {
    this._target.addEventListener(name, callback);
  }
};
function to_esm({
  imports = "",
  render
}) {
  return `${imports}
export default { render: ${render.toString()} }`;
}
function widget(options) {
  const { state, render, imports, version } = options;
  const comm = new Comm({ anywidget_version: version });
  const init_promise = comm.init({
    ...state,
    _esm: to_esm({ imports, render })
  });
  const model = new Model(state);
  for (const key in state) {
    model.on(`change:${key}`, () => {
      comm.send_state({ [key]: model.get(key) });
    });
  }
  const obj = new Proxy(model, {
    get(target, prop, receiver) {
      if (prop === init_promise_symbol) {
        return init_promise;
      }
      if (prop === Symbol.for("Jupyter.display")) {
        return async () => {
          await init_promise;
          return comm.mimebundle();
        };
      }
      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      if (prop === Symbol.for("Jupyter.display")) {
        return true;
      }
      return Reflect.has(target, prop);
    }
  });
  COMMS.set(obj, comm);
  return obj;
}

// packages/graph/ts/scatter-widget.ts
function vegaLiteWidget(rows2, vlSpec) {
  return widget({
    state: {
      data: JSON.stringify(rows2),
      spec: JSON.stringify(vlSpec)
    },
    imports: `
import embed from "https://esm.sh/vega-embed@6";
    `,
    render: async ({ model, el }) => {
      el.innerHTML = "";
      Object.assign(el.style, {
        width: "100%",
        height: "auto",
        overflow: "hidden"
      });
      const style = document.createElement("style");
      style.textContent = `
        .vega-embed, .vega-embed > div { margin: 0 !important; }
        .vega-actions { display: none !important; }
        .vega-tooltip {
          border-radius: 8px !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important;
          font-family: ui-sans-serif, system-ui, -apple-system, "Inter", "Segoe UI", Roboto, Arial, sans-serif !important;
          font-size: 12px !important;
        }
      `;
      el.appendChild(style);
      const spec2 = JSON.parse(model.get("spec"));
      spec2.width ??= "container";
      spec2.height ??= 340;
      spec2.data ??= { name: "table" };
      const { default: embed } = await import("vega-embed");
      const { view } = await embed(el, spec2, { actions: false });
      const apply = () => {
        const data = JSON.parse(model.get("data"));
        view.change("table", view.changeset().remove(() => true).insert(data)).run();
      };
      apply();
      model.on("change:data", apply);
      new ResizeObserver(() => {
        view.resize().run();
      }).observe(el);
    }
  });
}
var rows = [
  { x: 10, y: 20, cat: "A" },
  { x: 15, y: 35, cat: "A" },
  { x: 25, y: 15, cat: "B" },
  { x: 30, y: 40, cat: "B" },
  { x: 35, y: 25, cat: "A" },
  { x: 40, y: 50, cat: "B" }
];
var spec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  mark: { type: "point", filled: true, size: 80 },
  params: [
    // Drag to pan/zoom the scales
    { name: "zoom", select: { type: "interval", bind: "scales" } }
  ],
  encoding: {
    x: { field: "x", type: "quantitative", title: "X Variable" },
    y: { field: "y", type: "quantitative", title: "Y Variable" },
    color: { field: "cat", type: "nominal", title: "Category" },
    tooltip: [{ field: "x" }, { field: "y" }, { field: "cat" }]
  },
  title: "Correlation Analysis",
  height: 320,
  config: {
    background: "white",
    view: { stroke: "transparent" },
    axis: {
      labelColor: "#374151",
      titleColor: "#111827",
      labelFont: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      titleFont: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      labelFontSize: 12,
      titleFontSize: 13,
      gridColor: "#E5E7EB",
      tickColor: "#E5E7EB"
    },
    legend: {
      labelFont: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      titleFont: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      labelColor: "#374151",
      titleColor: "#111827"
    },
    range: {
      category: ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"]
      // your palette
    }
  }
};
var scatterWidget = vegaLiteWidget(rows, spec);

// packages/graph/ts/export-utils.ts
import {
  dirname as dirname2,
  fileURLToPath as fileURLToPath2,
  readFileSync as readFileSync2,
  resolve as resolve2,
  writeFileSync
} from "@tidy-ts/shims";

// packages/graph/ts/resvg-wasm-init.ts
import {
  dirname,
  fileURLToPath,
  pathToFileURL,
  readFileSync,
  resolve
} from "@tidy-ts/shims";
var resvgGlue = null;
var resvgWasmModule = null;
var resvgInstance = null;
var initialized = false;
async function initResvgWasm() {
  if (initialized) {
    return { module: resvgWasmModule, Resvg: resvgInstance };
  }
  if (!resvgGlue) {
    resvgGlue = await import("./resvg-wasm-2.6.3-alpha.0-6AKAPHHD.js");
  }
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const wasmPath = resolve(
    currentDir,
    "./resvg-wasm-2.6.3-alpha.0_bg.wasm"
  );
  const wasmUrl = pathToFileURL(wasmPath);
  const initFunc = resvgGlue.initWasm;
  if (initFunc) {
    await initFunc(wasmUrl);
  } else {
    throw new Error("Could not find resvg WASM initialization function");
  }
  resvgWasmModule = true;
  resvgInstance = resvgGlue.Resvg;
  initialized = true;
  return { module: resvgWasmModule, Resvg: resvgInstance };
}

// packages/graph/ts/export-utils.ts
var resvgReady = null;
var Resvg = null;
async function ensureResvg() {
  if (!resvgReady) {
    resvgReady = (async () => {
      const { Resvg: ResvgClass } = await initResvgWasm();
      Resvg = ResvgClass;
    })();
  }
  await resvgReady;
}
function normalizeSize(spec2, opts) {
  const width = typeof spec2.width === "number" ? spec2.width : opts?.width ?? 700;
  const height = typeof spec2.height === "number" ? spec2.height : opts?.height ?? 400;
  return { width, height };
}
function normalizeRows(rows2) {
  const toIso = (v) => v instanceof Date ? v.toISOString() : v;
  return rows2.map((r) => {
    const o = {};
    for (const k in r) o[k] = toIso(r[k]);
    return o;
  });
}
function buildStandaloneVlSpec(df, spec2, opts) {
  const { spec: specNoData, data } = graphReact({ df, ...spec2 });
  const { width, height } = normalizeSize(specNoData, opts);
  return {
    ...specNoData,
    width,
    height,
    autosize: { type: "fit", resize: true },
    data: { values: normalizeRows(data) },
    background: opts?.background ?? specNoData.background ?? "white"
  };
}
async function vlToSVG(vlSpec, opts) {
  const vegaLite = await import("vega-lite");
  const vega = await import("vega");
  const vg = vegaLite.compile(vlSpec).spec;
  if (opts?.width !== void 0) {
    const padding = vg.padding || 5;
    const horizontalPadding = typeof padding === "object" && padding !== null && !("signal" in padding) ? (padding.left || 0) + (padding.right || 0) : padding * 2;
    vg.width = opts.width - horizontalPadding;
  }
  if (opts?.height !== void 0) {
    const padding = vg.padding || 5;
    const verticalPadding = typeof padding === "object" && padding !== null && !("signal" in padding) ? (padding.top || 0) + (padding.bottom || 0) : padding * 2;
    vg.height = opts.height - verticalPadding;
  }
  const view = new vega.View(vega.parse(vg), { renderer: "none" });
  return await view.toSVG();
}
async function svgToPNG(svg, width, _height, scale = 2) {
  await ensureResvg();
  const fontBuffers = [];
  try {
    const currentDir = dirname2(fileURLToPath2(import.meta.url));
    const fontFiles = [
      "Inter_18pt-Regular.ttf",
      "Inter_18pt-Medium.ttf",
      "Inter_18pt-SemiBold.ttf"
    ];
    for (const fontFile of fontFiles) {
      const fontFilePath = resolve2(currentDir, "fonts", fontFile);
      const fontData = readFileSync2(fontFilePath);
      fontBuffers.push(fontData);
    }
  } catch (e) {
    console.warn(
      "Failed to load Inter fonts, falling back to system fonts:",
      e
    );
  }
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width * scale },
    font: fontBuffers.length > 0 ? {
      fontBuffers,
      defaultFontFamily: "Inter, Arial, sans-serif",
      defaultFontSize: 12,
      sansSerifFamily: "Inter, Arial, sans-serif",
      serifFamily: "Times New Roman, serif",
      monospaceFamily: "Courier New, monospace"
    } : {
      loadSystemFonts: true,
      defaultFontFamily: "Arial, sans-serif"
    },
    textRendering: 1,
    // optimizeLegibility for better text rendering
    shapeRendering: 2,
    // geometricPrecision for better shapes
    imageRendering: 0,
    // optimizeQuality for better image quality
    dpi: 300
    // Higher DPI for crisp text rendering
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  return pngBuffer;
}
async function saveGraphAsSVG(df, spec2, {
  filename,
  width,
  height,
  background
}) {
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error(
      `Invalid filename: expected non-empty string, got ${typeof filename}. Usage: saveGraphAsSVG(df, spec, { path: "file.svg", width: 800, height: 600 })`
    );
  }
  if (width !== void 0 && (typeof width !== "number" || width <= 0)) {
    throw new Error(
      `Invalid width: expected positive number, got ${typeof width} (${width})`
    );
  }
  if (height !== void 0 && (typeof height !== "number" || height <= 0)) {
    throw new Error(
      `Invalid height: expected positive number, got ${typeof height} (${height})`
    );
  }
  const vl = buildStandaloneVlSpec(df, spec2, { width, height, background });
  const svg = await vlToSVG(vl, { width, height });
  writeFileSync(filename, svg);
}
async function saveGraphAsPNG(df, spec2, {
  filename,
  width,
  height,
  background,
  scale = 1
  // PNG resolution multiplier (1-4, default: 1)
}) {
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error(
      `Invalid filename: expected non-empty string, got ${typeof filename}. Usage: saveGraphAsPNG(df, spec, { filename: "file.png", width: 800, height: 600, scale: 2 })`
    );
  }
  if (width !== void 0 && (typeof width !== "number" || width <= 0)) {
    throw new Error(
      `Invalid width: expected positive number, got ${typeof width} (${width})`
    );
  }
  if (height !== void 0 && (typeof height !== "number" || height <= 0)) {
    throw new Error(
      `Invalid height: expected positive number, got ${typeof height} (${height})`
    );
  }
  if (typeof scale !== "number" || scale <= 0) {
    throw new Error(
      `Invalid scale: expected positive number, got ${typeof scale} (${scale})`
    );
  }
  const vl = buildStandaloneVlSpec(df, spec2, { width, height, background });
  const pngWidth = width ?? 700;
  const pngHeight = height ?? 400;
  const svg = await vlToSVG(vl, { width: pngWidth, height: pngHeight });
  const clampedScale = Math.max(1, Math.min(4, scale));
  const png = await svgToPNG(svg, pngWidth, pngHeight, clampedScale);
  writeFileSync(filename, png);
}

// packages/graph/ts/graph.ts
var COLOR_SCHEMES = {
  default: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"],
  blue: ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"],
  green: ["#34d399", "#10b981", "#059669", "#047857", "#065f46"],
  red: ["#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b"],
  purple: ["#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
  orange: ["#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412"],
  vibrant: [
    "#4f46e5",
    // Blue (oklch(0.7 0.25 240))
    "#10b981",
    // Green (oklch(0.75 0.25 120))
    "#f59e0b",
    // Yellow (oklch(0.7 0.25 60))
    "#8b5cf6",
    // Purple (oklch(0.7 0.25 300))
    "#ef4444"
    // Red (oklch(0.7 0.25 0))
  ],
  professional: [
    "#3b82f6",
    // Blue (oklch(0.6 0.15 240))
    "#059669",
    // Green (oklch(0.65 0.15 150))
    "#7c3aed",
    // Purple (oklch(0.6 0.15 270))
    "#dc2626",
    // Red (oklch(0.55 0.15 30))
    "#374151"
    // Dark gray (oklch(0.5 0.15 0))
  ],
  high_contrast: [
    "#1e40af",
    // Dark blue (oklch(0.55 0.2 240))
    "#047857",
    // Dark green (oklch(0.6 0.2 120))
    "#b91c1c",
    // Dark red (oklch(0.5 0.2 30))
    "#6b21a8",
    // Dark purple (oklch(0.45 0.15 300))
    "#1f2937"
    // Very dark gray (oklch(0.5 0.2 0))
  ]
};
function arrFrom(df, selector) {
  if (Array.isArray(selector)) return selector;
  if (typeof selector === "function") {
    return df.toArray().map(selector);
  }
  return df[String(selector)] ?? [];
}
var mapLineInterpolation = (s) => s === "step" || s === "basis" || s === "cardinal" || s === "monotone" ? s : "linear";
var nearestLegendOrient = (p) => {
  if (!p) return "right";
  if (p.includes("top")) return "top";
  if (p.includes("bottom")) return "bottom";
  if (p.includes("left")) return "left";
  return "right";
};
function toVegaData(df, spec2) {
  const rows2 = df.toArray();
  const m = spec2.mappings;
  const colorMapping = m.color ?? m.series;
  const getName = (sel, fallback) => typeof sel === "string" ? sel : fallback;
  const xField = getName(m.x, "x");
  const yField = getName(m.y, "y");
  const colorField = colorMapping ? getName(colorMapping, "color") : null;
  const sizeField = "size" in m && m.size ? getName(m.size, "size") : null;
  const shapeField = "shape" in m && m.shape ? getName(m.shape, "shape") : null;
  const xVals = arrFrom(df, m.x);
  const yVals = arrFrom(df, m.y);
  const colorVals = colorMapping ? arrFrom(df, colorMapping) : null;
  const sizeVals = sizeField ? arrFrom(df, m.size) : null;
  const shapeVals = shapeField ? arrFrom(df, m.shape) : null;
  const out = [];
  const n = Math.min(xVals.length, yVals.length);
  for (let i = 0; i < n; i++) {
    const pt = {
      [xField]: xVals[i],
      [yField]: yVals[i]
    };
    if (colorField && colorVals) pt[colorField] = colorVals[i];
    if (sizeField && sizeVals) pt[sizeField] = sizeVals[i];
    if (shapeField && shapeVals) pt[shapeField] = shapeVals[i];
    const row = rows2[i];
    if (row) {
      for (const [k, v] of Object.entries(row)) if (!(k in pt)) pt[k] = v;
    }
    out.push(pt);
  }
  return {
    data: out,
    fields: { xField, yField, colorField, sizeField, shapeField }
  };
}
function buildVegaSpec(rows2, spec2, fields) {
  const cfg = spec2.config ?? {};
  const { xField, yField, colorField, sizeField, shapeField } = fields;
  const xDomain = cfg.xAxis?.domain;
  const yDomain = cfg.yAxis?.domain;
  let filteredRows = rows2;
  if (xDomain) {
    filteredRows = filteredRows.filter((row) => {
      const xVal = row[xField];
      if (typeof xVal === "number") {
        const [xMin, xMax] = xDomain;
        return xVal >= xMin && xVal <= xMax;
      }
      return true;
    });
  }
  if (yDomain) {
    filteredRows = filteredRows.filter((row) => {
      const yVal = row[yField];
      if (typeof yVal === "number") {
        const [yMin, yMax] = yDomain;
        return yVal >= yMin && yVal <= yMax;
      }
      return true;
    });
  }
  const xType = filteredRows.length && filteredRows[0][xField] instanceof Date ? "temporal" : typeof filteredRows[0]?.[xField] === "number" ? "quantitative" : "ordinal";
  const yType = "quantitative";
  const shouldClip = !!(xDomain || yDomain);
  let mark;
  if (spec2.type === "scatter") {
    mark = {
      type: "point",
      filled: true,
      size: cfg.scatter?.pointSize ?? 60,
      opacity: cfg.scatter?.pointOpacity ?? 0.8,
      clip: shouldClip
    };
  } else if (spec2.type === "line") {
    mark = {
      type: "line",
      point: cfg.line?.dots ? { filled: true, size: 50 } : false,
      strokeWidth: cfg.line?.strokeWidth ?? 2,
      interpolate: mapLineInterpolation(cfg.line?.style),
      clip: shouldClip
    };
  } else if (spec2.type === "bar") {
    mark = {
      type: "bar",
      cornerRadiusEnd: cfg.bar?.radius ?? 4,
      clip: shouldClip
    };
  } else {
    mark = {
      type: "area",
      line: cfg.area?.strokeWidth ? { strokeWidth: cfg.area.strokeWidth } : true,
      interpolate: mapLineInterpolation(cfg.area?.style),
      opacity: cfg.area?.opacity ?? 0.7,
      clip: shouldClip
    };
  }
  const xLabel = cfg.xAxis?.label ?? xField;
  const yLabel = cfg.yAxis?.label ?? yField;
  const hideXAxis = cfg.xAxis?.hide ?? false;
  const hideYAxis = cfg.yAxis?.hide ?? false;
  const encoding = {
    x: {
      field: xField,
      type: xType,
      title: xLabel,
      axis: hideXAxis ? null : {
        labelAngle: xType !== "quantitative" ? -45 : 0,
        format: xType === "temporal" ? "%b %Y" : void 0
      },
      scale: xDomain ? { domain: xDomain, nice: false, zero: false } : {}
    },
    y: {
      field: yField,
      type: yType,
      title: yLabel,
      axis: hideYAxis ? null : {},
      scale: yDomain ? { domain: yDomain, nice: false, zero: false } : {}
    }
  };
  if (colorField) {
    const colorType = typeof filteredRows[0]?.[colorField] === "number" ? "quantitative" : "nominal";
    const legendConfig = cfg.legend?.show === false ? null : {
      orient: nearestLegendOrient(cfg.legend?.position),
      ...cfg.legend?.fontSize ? { labelFontSize: cfg.legend.fontSize } : {},
      ...cfg.legend?.titleFontSize ? { titleFontSize: cfg.legend.titleFontSize } : {},
      columnPadding: 0
    };
    encoding.color = {
      field: colorField,
      type: colorType,
      legend: legendConfig,
      scale: cfg.color?.colors || cfg.color?.scheme ? {
        range: cfg.color?.colors ?? COLOR_SCHEMES[cfg.color?.scheme ?? "default"]
      } : {}
    };
  }
  if (sizeField) {
    encoding.size = {
      field: sizeField,
      type: "quantitative",
      legend: cfg.legend?.show === false ? null : {}
    };
  }
  if (shapeField) {
    encoding.shape = {
      field: shapeField,
      type: "nominal",
      legend: cfg.legend?.show === false ? null : {}
    };
  }
  if ((spec2.type === "bar" || spec2.type === "area") && colorField) {
    if (spec2.type === "bar" && cfg.bar?.stacked || spec2.type === "area" && cfg.area?.stacked) {
      encoding.y.stack = "zero";
    } else if (spec2.type === "bar" && cfg.bar?.stacked === false || spec2.type === "area" && cfg.area?.stacked === false) {
      encoding.y.stack = null;
    }
  }
  if (cfg.tooltip?.show !== false) {
    const t = spec2.tooltip;
    const fields2 = t?.fields ?? Object.keys(filteredRows[0] ?? {});
    encoding.tooltip = fields2.map((f) => ({
      field: f,
      type: typeof filteredRows[0]?.[f] === "number" ? "quantitative" : filteredRows[0]?.[f] instanceof Date ? "temporal" : "nominal"
    }));
  }
  const vl = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { values: filteredRows },
    mark,
    encoding,
    width: cfg.layout?.width ?? "container",
    height: cfg.layout?.height ?? 400,
    config: {
      background: "white",
      view: { stroke: "transparent" },
      ...cfg.grid?.show !== false ? { axis: { grid: true, gridOpacity: 0.3 } } : {},
      ...cfg.color?.colors || cfg.color?.scheme ? {
        range: {
          category: cfg.color?.colors ?? COLOR_SCHEMES[cfg.color?.scheme ?? "default"]
        }
      } : {},
      ...cfg.legend ? {
        legend: {
          ...cfg.legend.fontSize ? { labelFontSize: cfg.legend.fontSize } : {},
          ...cfg.legend.titleFontSize ? { titleFontSize: cfg.legend.titleFontSize } : {},
          labelLimit: 0,
          // Don't truncate legend labels
          symbolLimit: 0
          // Don't limit number of symbols
        }
      } : {}
    }
  };
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
  if (cfg.layout?.title || cfg.layout?.description) {
    vl.title = {
      ...cfg.layout?.title ? { text: cfg.layout.title, fontSize: 16, fontWeight: 600 } : {},
      ...cfg.layout?.description ? {
        subtitle: cfg.layout.description,
        subtitleFontSize: 12,
        subtitleColor: "#666"
      } : {}
    };
  }
  if (cfg.interactivity?.zoom || cfg.interactivity?.pan) {
    vl.params = [{
      name: "zoom",
      select: { type: "interval", bind: "scales" }
    }];
  }
  return vl;
}
function graph({ df, ...spec2 }) {
  const { data, fields } = toVegaData(df, spec2);
  const vlSpec = buildVegaSpec(data, spec2, fields);
  const specForWidget = { ...vlSpec };
  delete specForWidget.data;
  const widgetInstance = vegaLiteWidget(
    data,
    specForWidget
  );
  widgetInstance.saveSVG = async ({ filename, width, height, background }) => {
    await saveGraphAsSVG(df, spec2, {
      filename,
      width,
      height,
      background
    });
  };
  widgetInstance.savePNG = async ({ filename, width, height, background, scale }) => {
    await saveGraphAsPNG(df, spec2, {
      filename,
      width,
      height,
      background,
      scale
    });
  };
  return widgetInstance;
}
function graphReact({ df, ...spec2 }) {
  const graphSpec = spec2;
  const { data, fields } = toVegaData(df, graphSpec);
  const vlSpec = buildVegaSpec(data, graphSpec, fields);
  const reactSpec = { ...vlSpec };
  delete reactSpec.data;
  return {
    spec: reactSpec,
    data
  };
}
export {
  graph,
  graphReact,
  saveGraphAsPNG,
  saveGraphAsSVG
};
