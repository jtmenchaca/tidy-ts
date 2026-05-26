// HTML wrapper around the static SVG renderer.
//
// Adds back interactivity that was dropped when we left React:
//   - Grid/Force toggle: renders both layouts once at generation time as
//     sibling <svg> elements; the toggle just flips display.
//   - Hover dimming: CSS-only — each node gets a class that, on hover of the
//     parent svg, dims sibling nodes/edges. No JS needed for hover.

import { renderSVG, type RenderSvgOptions } from "./svg.ts";

export interface RenderHtmlOptions extends Omit<RenderSvgOptions, "layoutMode"> {
  /** Page <title>. Defaults to "Graph". */
  title?: string;
  /** Which layout to show first. Defaults to "grid". */
  initialLayoutMode?: "grid" | "force";
  /** When true, include the grid/force toggle. Default: true. */
  includeToggle?: boolean;
}

/** Render a full HTML document containing the graph. */
export function renderHTML({
  title = "Graph",
  initialLayoutMode = "grid",
  includeToggle = true,
  ...svgOpts
}: RenderHtmlOptions): string {
  const gridSvg = renderSVG({ ...svgOpts, layoutMode: "grid" });
  const forceSvg = includeToggle ? renderSVG({ ...svgOpts, layoutMode: "force" }) : null;

  const initial = initialLayoutMode === "force" && forceSvg ? "force" : "grid";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f1f1f; }
  .stage { position: relative; width: 100%; height: 100vh; overflow: auto; }
  .toggle { position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; gap: 4px; border-radius: 6px; border: 1px solid #e5e5e5; background: rgba(255,255,255,0.9); padding: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .toggle button { border-radius: 4px; padding: 4px 10px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: #888; transition: background-color .15s, color .15s; }
  .toggle button.active { background: #1f1f1f; color: white; }
  .svg-wrap { width: 100%; }
  .svg-wrap[hidden] { display: none; }
  .svg-wrap svg { display: block; max-width: 100%; height: auto; }
</style>
</head>
<body>
  <div class="stage">
    ${includeToggle && forceSvg ? `
    <div class="toggle">
      <button id="btn-grid" class="${initial === "grid" ? "active" : ""}" onclick="window.__setLayout('grid')">Grid</button>
      <button id="btn-force" class="${initial === "force" ? "active" : ""}" onclick="window.__setLayout('force')">Force</button>
    </div>
    ` : ""}
    <div class="svg-wrap" id="svg-grid" ${initial === "grid" ? "" : "hidden"}>${gridSvg}</div>
    ${forceSvg ? `<div class="svg-wrap" id="svg-force" ${initial === "force" ? "" : "hidden"}>${forceSvg}</div>` : ""}
  </div>
  <script>
    window.__setLayout = function(mode) {
      var grid = document.getElementById('svg-grid');
      var force = document.getElementById('svg-force');
      if (grid) grid.hidden = mode !== 'grid';
      if (force) force.hidden = mode !== 'force';
      var bg = document.getElementById('btn-grid');
      var bf = document.getElementById('btn-force');
      if (bg) bg.classList.toggle('active', mode === 'grid');
      if (bf) bf.classList.toggle('active', mode === 'force');
    };
  </script>
</body>
</html>
`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
