// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../dataframe/index.ts";
import type { GraphOptions } from "./graph.ts";
import { graphReact } from "./graph.ts";

// File system for cross-runtime compatibility
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// PNG rendering using local resvg WASM (no network required)
import { initResvgWasm } from "./resvg-wasm-init.ts";

let resvgReady: Promise<void> | null = null;
let Resvg: any | null = null;
async function ensureResvg() {
  if (!resvgReady) {
    resvgReady = (async () => {
      // Initialize local resvg WASM
      const { Resvg: ResvgClass } = await initResvgWasm();
      Resvg = ResvgClass;
    })();
  }
  await resvgReady;
}

/** Ensure width/height are numeric (server renderers can't use "container"). */
function normalizeSize(spec: any, opts?: { width?: number; height?: number }) {
  const width = typeof spec.width === "number"
    ? spec.width
    : (opts?.width ?? 700);
  const height = typeof spec.height === "number"
    ? spec.height
    : (opts?.height ?? 400);
  return { width, height };
}

/** Replace Date objects with ISO strings for robust server compilation. */
function normalizeRows(rows: any[]): any[] {
  const toIso = (v: any) => v instanceof Date ? v.toISOString() : v;
  return rows.map((r) => {
    const o: any = {};
    for (const k in r) o[k] = toIso(r[k]);
    return o;
  });
}

/** Build a standalone Vega-Lite spec with inlined data and numeric size. */
export function buildStandaloneVlSpec<T extends Record<string, unknown>>(
  df: DataFrame<T>,
  spec: GraphOptions<T>,
  opts?: { width?: number; height?: number; background?: string },
) {
  // Reuse your existing pipeline to get (specWithoutData, rows)
  const { spec: specNoData, data } = graphReact(spec)(df);
  const { width, height } = normalizeSize(specNoData, opts);

  return {
    ...specNoData,
    width,
    height,
    autosize: { type: "fit", resize: true },
    data: { values: normalizeRows(data) },
    background: opts?.background ?? specNoData.background ?? "white",
  };
}

/** Render SVG fully in-process (no DOM, no browser). */
export async function vlToSVG(
  vlSpec: any,
  opts?: { width?: number; height?: number },
): Promise<string> {
  // Dynamic imports to avoid webpack trying to resolve Node.js-only dependencies (canvas)
  // when bundling for browser environments
  const vegaLite = await import("vega-lite");
  const vega = await import("vega");

  const vg = vegaLite.compile(vlSpec).spec;

  // Override Vega dimensions if specified
  // Vega adds padding (default 5px on each side = 10px total), so subtract it
  if (opts?.width !== undefined) {
    const padding = vg.padding || 5;
    const horizontalPadding =
      typeof padding === "object" && padding !== null && !("signal" in padding)
        ? (padding.left || 0) + (padding.right || 0)
        : (padding as number) * 2;
    vg.width = opts.width - horizontalPadding;
  }
  if (opts?.height !== undefined) {
    const padding = vg.padding || 5;
    const verticalPadding =
      typeof padding === "object" && padding !== null && !("signal" in padding)
        ? (padding.top || 0) + (padding.bottom || 0)
        : (padding as number) * 2;
    vg.height = opts.height - verticalPadding;
  }

  const view = new vega.View(vega.parse(vg), { renderer: "none" });
  return await view.toSVG();
}

/** Rasterize SVG → PNG using resvg-js WASM. */
export async function svgToPNG(
  svg: string,
  width: number,
  _height: number,
  scale: number = 2,
): Promise<Uint8Array> {
  await ensureResvg();

  // Load Inter font files as buffers
  const fontBuffers: Uint8Array[] = [];
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const fontFiles = [
      "Inter_18pt-Regular.ttf",
      "Inter_18pt-Medium.ttf",
      "Inter_18pt-SemiBold.ttf",
    ];

    for (const fontFile of fontFiles) {
      const fontFilePath = path.resolve(currentDir, "fonts", fontFile);
      const fontData = fs.readFileSync(fontFilePath);
      fontBuffers.push(new Uint8Array(fontData));
    }
  } catch (e) {
    console.warn(
      "Failed to load Inter fonts, falling back to system fonts:",
      e,
    );
  }

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width * scale },
    font: fontBuffers.length > 0
      ? {
        fontBuffers: fontBuffers,
        defaultFontFamily: "Inter, Arial, sans-serif",
        defaultFontSize: 12,
        sansSerifFamily: "Inter, Arial, sans-serif",
        serifFamily: "Times New Roman, serif",
        monospaceFamily: "Courier New, monospace",
      }
      : {
        loadSystemFonts: true,
        defaultFontFamily: "Arial, sans-serif",
      },
    textRendering: 1, // optimizeLegibility for better text rendering
    shapeRendering: 2, // geometricPrecision for better shapes
    imageRendering: 0, // optimizeQuality for better image quality
    dpi: 300, // Higher DPI for crisp text rendering
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return pngBuffer;
}

// ---- Public helpers -------------------------------------------------------

export async function saveGraphAsSVG<T extends Record<string, unknown>>(
  df: DataFrame<T>,
  spec: GraphOptions<T>,
  {
    filename,
    width,
    height,
    background,
  }: {
    filename: string;
    width?: number;
    height?: number;
    background?: string;
  },
) {
  // Validate filename
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error(
      `Invalid filename: expected non-empty string, got ${typeof filename}. ` +
        `Usage: saveGraphAsSVG(df, spec, { path: "file.svg", width: 800, height: 600 })`,
    );
  }

  // Validate optional numeric parameters
  if (width !== undefined && (typeof width !== "number" || width <= 0)) {
    throw new Error(
      `Invalid width: expected positive number, got ${typeof width} (${width})`,
    );
  }
  if (height !== undefined && (typeof height !== "number" || height <= 0)) {
    throw new Error(
      `Invalid height: expected positive number, got ${typeof height} (${height})`,
    );
  }

  const vl = buildStandaloneVlSpec(df, spec, { width, height, background });
  const svg = await vlToSVG(vl, { width, height });
  fs.writeFileSync(filename, svg, "utf8");
}

export async function saveGraphAsPNG<T extends Record<string, unknown>>(
  df: DataFrame<T>,
  spec: GraphOptions<T>,
  {
    filename,
    width,
    height,
    background,
    scale = 1, // PNG resolution multiplier (1-4, default: 1)
  }: {
    filename: string;
    width?: number;
    height?: number;
    background?: string;
    scale?: number;
  },
) {
  // Validate filename
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error(
      `Invalid filename: expected non-empty string, got ${typeof filename}. ` +
        `Usage: saveGraphAsPNG(df, spec, { filename: "file.png", width: 800, height: 600, scale: 2 })`,
    );
  }

  // Validate optional numeric parameters
  if (width !== undefined && (typeof width !== "number" || width <= 0)) {
    throw new Error(
      `Invalid width: expected positive number, got ${typeof width} (${width})`,
    );
  }
  if (height !== undefined && (typeof height !== "number" || height <= 0)) {
    throw new Error(
      `Invalid height: expected positive number, got ${typeof height} (${height})`,
    );
  }
  if (typeof scale !== "number" || scale <= 0) {
    throw new Error(
      `Invalid scale: expected positive number, got ${typeof scale} (${scale})`,
    );
  }

  const vl = buildStandaloneVlSpec(df, spec, { width, height, background });
  const pngWidth = width ?? 700;
  const pngHeight = height ?? 400;
  const svg = await vlToSVG(vl, { width: pngWidth, height: pngHeight });

  const clampedScale = Math.max(1, Math.min(4, scale));
  const png = await svgToPNG(svg, pngWidth, pngHeight, clampedScale);

  fs.writeFileSync(filename, png);
}
