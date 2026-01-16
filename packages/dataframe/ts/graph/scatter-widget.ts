// deno-lint-ignore-file no-explicit-any
import { widget } from "./anywidget-minimal.ts";
import embed from "vega-embed";

/** Build a Vega-Lite widget from rows + VL spec (with minimal, safe defaults). */
export function vegaLiteWidget(rows: any[], vlSpec: any) {
  return widget({
    state: {
      data: JSON.stringify(rows),
      spec: JSON.stringify(vlSpec),
    },
    imports: `
import embed from "https://esm.sh/vega-embed@6";
    `,
    render: async ({ model, el }) => {
      // Container hygiene: seamless, responsive, no scrollbars.
      el.innerHTML = "";
      Object.assign(el.style, {
        width: "100%",
        height: "auto",
        overflow: "hidden",
      });

      // Optional CSS overrides (tooltip look, remove any outer margins, etc.)
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

      // Parse spec and add safe defaults if missing.
      const spec = JSON.parse(model.get("spec"));
      spec.width ??= "container"; // responsive width
      spec.height ??= 340;
      spec.data ??= { name: "table" }; // we’ll push data into this named source

      // Render (vega-embed compiles VL→Vega and creates the View)
      const { view } = await embed(el, spec, { actions: false });

      // Push initial data
      const apply = () => {
        const data = JSON.parse(model.get("data"));
        view.change("table", view.changeset().remove(() => true).insert(data))
          .run();
      };
      apply();

      // Live updates when state changes
      model.on("change:data", apply);

      // Stay responsive to container size
      new ResizeObserver(() => {
        view.resize().run();
      }).observe(el);

      // Keep a reference if you want to expose advanced hooks later
      // (e.g., el._vegaView = view)
    },
  });
}

/* ---------- Example usage (scatter with pan/zoom + custom styles) ---------- */

const rows = [
  { x: 10, y: 20, cat: "A" },
  { x: 15, y: 35, cat: "A" },
  { x: 25, y: 15, cat: "B" },
  { x: 30, y: 40, cat: "B" },
  { x: 35, y: 25, cat: "A" },
  { x: 40, y: 50, cat: "B" },
];

// A nicely styled Vega-Lite spec; tweak config to match your brand/fonts/colors.
const spec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  mark: { type: "point", filled: true, size: 80 },
  params: [
    // Drag to pan/zoom the scales
    { name: "zoom", select: { type: "interval", bind: "scales" } },
  ],
  encoding: {
    x: { field: "x", type: "quantitative", title: "X Variable" },
    y: { field: "y", type: "quantitative", title: "Y Variable" },
    color: { field: "cat", type: "nominal", title: "Category" },
    tooltip: [{ field: "x" }, { field: "y" }, { field: "cat" }],
  },
  title: "Correlation Analysis",
  height: 320,
  config: {
    background: "white",
    view: { stroke: "transparent" },
    axis: {
      labelColor: "#374151",
      titleColor: "#111827",
      labelFont:
        "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      titleFont:
        "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      labelFontSize: 12,
      titleFontSize: 13,
      gridColor: "#E5E7EB",
      tickColor: "#E5E7EB",
    },
    legend: {
      labelFont:
        "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      titleFont:
        "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      labelColor: "#374151",
      titleColor: "#111827",
    },
    range: {
      category: ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"], // your palette
    },
  },
};

export const scatterWidget = vegaLiteWidget(rows, spec);
// In Jupyter: just evaluate `scatterWidget` to display.
// Later updates (live):
// rows.push({ x: 45, y: 28, cat: "A" });
// scatterWidget.set("data", JSON.stringify(rows));
