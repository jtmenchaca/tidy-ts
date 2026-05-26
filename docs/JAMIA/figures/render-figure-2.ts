/**
 * Generates Figure 2: Detection Rates by Error Category and Ecosystem (heatmap).
 * Run: deno run -A joss/figures/render-figure-2.ts
 *
 * Output: figure-2-heatmap.html
 */
import { resolve, dirname, fromFileUrl } from "jsr:@std/path";

const DIR = dirname(fromFileUrl(import.meta.url));
const OUT = resolve(DIR, "figure-2-heatmap.html");

// ─── Shared data (Table 3) ────────────────────────────────────────────────────

interface CatData {
  label: string[];
  n: number;
  highlight?: boolean;
  ts: { compile: number; runtime: number; warn: number; silent: number };
  py: { compile: number; runtime: number; warn: number; silent: number };
  r: { compile: number; runtime: number; warn: number; silent: number };
}

const DATA: CatData[] = [
  { label: ["Column", "reference"], n: 16,
    ts: { compile: 16, runtime: 0, warn: 0, silent: 0 },
    py: { compile: 0, runtime: 14, warn: 0, silent: 2 },
    r: { compile: 0, runtime: 14, warn: 0, silent: 2 } },
  { label: ["Type", "errors"], n: 14,
    ts: { compile: 13, runtime: 1, warn: 0, silent: 0 },
    py: { compile: 0, runtime: 5, warn: 0, silent: 9 },
    r: { compile: 0, runtime: 4, warn: 3, silent: 7 } },
  { label: ["Null &", "missing data"], n: 17, highlight: true,
    ts: { compile: 17, runtime: 0, warn: 0, silent: 0 },
    py: { compile: 0, runtime: 0, warn: 0, silent: 17 },
    r: { compile: 0, runtime: 2, warn: 0, silent: 15 } },
  { label: ["Join", "errors"], n: 8,
    ts: { compile: 8, runtime: 0, warn: 0, silent: 0 },
    py: { compile: 0, runtime: 5, warn: 0, silent: 3 },
    r: { compile: 0, runtime: 5, warn: 0, silent: 3 } },
  { label: ["Data", "loading"], n: 10,
    ts: { compile: 8, runtime: 2, warn: 0, silent: 0 },
    py: { compile: 0, runtime: 2, warn: 0, silent: 8 },
    r: { compile: 0, runtime: 4, warn: 1, silent: 5 } },
];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlShell({ title, subtitle, caption, body }: {
  title: string;
  subtitle: string;
  caption: string;
  body: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #fff; display: flex; flex-direction: column; align-items: center;
    padding: 20px 0 0; color: #1a1a2e;
  }
  h1 { font-size: 16px; font-weight: 600; margin-bottom: 8px; text-align: center; }
  .subtitle { font-size: 12px; color: #555; margin-bottom: 0; text-align: center; max-width: 760px; line-height: 1.5; }
  .chart { display: block; max-width: 900px; width: 100%; }
  .caption { margin-top: 20px; font-size: 11.5px; color: #555; max-width: 760px; text-align: center; line-height: 1.6; }
  .caption strong { color: #333; }
</style>
</head>
<body>
<h1>${esc(title)}</h1>
<p class="subtitle">${subtitle}</p>
${body}
<p class="caption">${caption}</p>
</body>
</html>`;
}

function renderHeatmap(): string {
  const ECOS = [
    { key: "ts" as const, label: "Tidy-TS (TypeScript)" },
    { key: "py" as const, label: "Pandas (Python)" },
    { key: "r" as const, label: "Tidyverse (R)" },
  ];
  const W = 880, H = 410, ML = 180, MR = 30, MT = 50, MB = 50;
  const plotW = W - ML - MR, plotH = H - MT - MB;
  const cellW = plotW / ECOS.length, cellH = plotH / DATA.length, gap = 3;

  function caughtColor(caught: number, total: number): { fill: string; stroke: string } {
    const r = caught / total;
    if (r === 1) return { fill: "#d7eed8", stroke: "#88cc8a" };       // green
    if (r >= 0.5) return { fill: "#fff5d0", stroke: "#d0b850" };      // yellow
    return { fill: "#f8d4d4", stroke: "#d08080" };                     // red
  }

  let svgBody = "";
  // Column headers
  for (let ei = 0; ei < ECOS.length; ei++) {
    const cx = ML + ei * cellW + cellW / 2;
    svgBody += `<text x="${cx}" y="${MT - 12}" text-anchor="middle" font-size="12" fill="#333" font-weight="600">${ECOS[ei].label}</text>\n`;
  }
  // Rows
  for (let ci = 0; ci < DATA.length; ci++) {
    const cat = DATA[ci];
    const cy = MT + ci * cellH;
    svgBody += `<text x="${ML - 10}" y="${cy + cellH / 2 + 4}" text-anchor="end" font-size="11.5" fill="#333">${esc(cat.label.join(" "))}</text>\n`;
    svgBody += `<text x="${ML - 10}" y="${cy + cellH / 2 + 16}" text-anchor="end" font-size="9" fill="#888">(n=${cat.n})</text>\n`;
    for (let ei = 0; ei < ECOS.length; ei++) {
      const eco = ECOS[ei];
      const caught = cat.n - cat[eco.key].silent;
      const { fill, stroke } = caughtColor(caught, cat.n);
      const tc = "#333";
      const cx = ML + ei * cellW;
      svgBody += `<rect x="${cx + gap / 2}" y="${cy + gap / 2}" width="${cellW - gap}" height="${cellH - gap}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1"/>\n`;
      svgBody += `<text x="${cx + cellW / 2}" y="${cy + cellH / 2 + 1}" text-anchor="middle" font-size="16" fill="${tc}" font-weight="700">${caught}</text>\n`;
      svgBody += `<text x="${cx + cellW / 2}" y="${cy + cellH / 2 + 15}" text-anchor="middle" font-size="9" fill="${tc}" opacity="0.8">of ${cat.n} caught</text>\n`;
    }
  }
  // Totals
  const ty = MT + DATA.length * cellH + 12;
  svgBody += `<text x="${ML - 10}" y="${ty + 14}" text-anchor="end" font-size="11" fill="#333" font-weight="600">Total caught</text>\n`;
  const caughtTotals = { ts: 65, py: 26, r: 33 };
  for (let ei = 0; ei < ECOS.length; ei++) {
    const eco = ECOS[ei];
    const v = caughtTotals[eco.key];
    const cx = ML + ei * cellW + cellW / 2;
    svgBody += `<text x="${cx}" y="${ty + 14}" text-anchor="middle" font-size="12" fill="${v === 65 ? "#2a7a2a" : "#c00"}" font-weight="700">${v} / 65 (${Math.round(v / 65 * 100)}%)</text>\n`;
  }

  return htmlShell({
    title: "",
    subtitle: "",
    caption: "",
    body: `<svg class="chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${svgBody}</svg>`,
  });
}

const htmlContent = renderHeatmap();
await Deno.writeTextFile(OUT, htmlContent);
console.log(`Wrote ${OUT}`);

const PNG = OUT.replace(".html", ".png");
const SCREENSHOT = resolve(DIR, "html-to-png.ts");
const p = new Deno.Command("deno", { args: ["run", "--no-config", "-A", SCREENSHOT, OUT, PNG, "900"], stdout: "inherit", stderr: "inherit" });
const { code } = await p.output();
if (code !== 0) console.error("PNG screenshot failed");
