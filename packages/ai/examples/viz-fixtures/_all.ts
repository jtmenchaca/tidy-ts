// Bundle every rendered viz fixture into a single scrollable HTML page.
//
// Each fixture is embedded in its own iframe (srcdoc) so its CSS doesn't
// leak into siblings or the wrapping shell. The shell provides a sticky
// TOC down the left side; iframes auto-resize on load to fit their
// content height so the page scrolls naturally.
//
// Run:
//   deno run -A packages/ai/examples/viz-fixtures/_all.ts
import { dirname, fromFileUrl, join } from "@std/path";

const fixtures = [
  "single-llm",
  "control-only",
  "long-field-names",
  "many-branches",
  "no-fields",
  "multiple-ends",
  "sibling-fan-in",
  "subflow-catch",
  "subflow-flow",
  "nested-subflows",
  "agent-with-tools",
  "agent-with-toolbox",
  "agent-long-descriptions",
  "sandbox-agent",
  "map-over-list",
  "parallel-flows",
  "composite-pipeline",
  "wide-and-deep",
];

const here = dirname(fromFileUrl(import.meta.url));
const OUT_PATH = join(here, "_all.viz.html");

const sources: { slug: string; html: string }[] = [];
for (const slug of fixtures) {
  const path = join(here, `${slug}.viz.html`);
  const html = await Deno.readTextFile(path);
  sources.push({ slug, html });
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

const sections = sources.map((p, i) => `
<section id="${p.slug}" class="viz-block">
  <header class="block-header">
    <span class="block-index">${i + 1} / ${sources.length}</span>
    <a class="block-link" href="#${p.slug}">${p.slug}.ts</a>
  </header>
  <iframe class="viz-frame" srcdoc="${escAttr(p.html)}" loading="lazy"></iframe>
</section>`).join("\n");

const toc = sources.map((p, i) =>
  `<li><a href="#${p.slug}"><span class="toc-idx">${i + 1}.</span> ${p.slug}</a></li>`
).join("\n");

const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>tidy-ts/ai · all viz fixtures</title>
<style>
  :root {
    color-scheme: light;
    --shell-bg: #f3f4f6;
    --card-bg: #ffffff;
    --border: #e4e4e7;
    --muted: #71717a;
  }
  html, body { margin: 0; padding: 0; background: var(--shell-bg); color: #18181b; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .layout { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
  nav.toc {
    position: sticky; top: 0; align-self: start; max-height: 100vh; overflow: auto;
    border-right: 1px solid var(--border); background: #fafafa;
    padding: 24px 16px; font-size: 13px;
  }
  nav.toc h2 { margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); font-weight: 600; }
  nav.toc ul { list-style: none; margin: 0; padding: 0; }
  nav.toc li { margin: 0; }
  nav.toc a {
    display: block; padding: 6px 8px; border-radius: 6px;
    color: #18181b; text-decoration: none;
  }
  nav.toc a:hover { background: #ececec; }
  .toc-idx { color: var(--muted); font-variant-numeric: tabular-nums; width: 22px; display: inline-block; }

  main { padding: 24px; min-width: 0; }
  .viz-block {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-bottom: 24px;
    overflow: hidden;
  }
  .block-header {
    display: flex; align-items: baseline; gap: 12px;
    padding: 12px 20px; border-bottom: 1px solid var(--border);
    background: #fafafa;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
  }
  .block-index { color: var(--muted); font-variant-numeric: tabular-nums; }
  .block-link { color: #18181b; text-decoration: none; }
  .block-link:hover { text-decoration: underline; }
  .viz-frame {
    display: block; width: 100%; border: 0;
    /* Initial guess — autoResize() below replaces this with the iframe
       document's actual scrollHeight once loaded. */
    height: 600px;
    background: white;
  }
</style>
</head>
<body>
<div class="layout">
  <nav class="toc">
    <h2>fixtures</h2>
    <ul>
${toc}
    </ul>
  </nav>
  <main>
${sections}
  </main>
</div>
<script>
  // Resize each iframe to its content height once its document finishes
  // loading. Each fixture renders a fixed-size SVG inside a body with
  // 32px padding, so scrollHeight reflects the rendered figure exactly.
  function autoResize(frame) {
    const doc = frame.contentDocument;
    if (!doc) return;
    const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
    frame.style.height = h + "px";
  }
  for (const f of document.querySelectorAll(".viz-frame")) {
    if (f.contentDocument && f.contentDocument.readyState === "complete") {
      autoResize(f);
    } else {
      f.addEventListener("load", () => autoResize(f));
    }
    // Re-measure on window resize since some fixtures have wide SVGs that
    // may wrap differently as the available width changes.
    new ResizeObserver(() => autoResize(f)).observe(document.documentElement);
  }
</script>
</body>
</html>
`;

await Deno.writeTextFile(OUT_PATH, out);
console.log("Wrote " + OUT_PATH);
