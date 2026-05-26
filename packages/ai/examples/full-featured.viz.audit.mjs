/**
 * Audit the rendered topology HTML programmatically.
 *
 * Adapted from the CDP pattern in /Users/jtmenchaca/tidy-ts/tmp/capture-layout.mjs.
 *
 * What it does:
 *   1. Launches headless Chrome and loads packages/ai/examples/full-featured.viz.html
 *      from a file:// URL.
 *   2. Extracts the on-screen bounding boxes of every node, the catch container,
 *      the inner sub-nodes, every edge label, and every edge path.
 *   3. Screenshots the page to packages/ai/examples/full-featured.viz.png.
 *   4. Detects layout issues: node↔node overlap, node↔container clipping
 *      (excluding the legitimate sub-nodes inside the catch container),
 *      label↔node overlap, label↔label overlap, edge↔node crossings (paths
 *      passing through a node rect when neither endpoint is that node),
 *      and anything outside the SVG viewBox.
 *   5. Prints a structured report and exits non-zero on any error.
 *
 * Usage:
 *   node packages/ai/examples/full-featured.viz.audit.mjs
 *   node packages/ai/examples/full-featured.viz.audit.mjs --json
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const showJson = args.includes("--json");
const positional = args.filter((a) => !a.startsWith("--"));

// Resolve the HTML target. Default: full-featured.viz.html in this dir.
// Pass a path (e.g. `viz-fixtures/subflow-catch.viz.html` or a fixture
// .ts which we'll map to its sibling .viz.html) to audit a fixture.
let target = positional[0] ?? "full-featured.viz.html";
if (target.endsWith(".ts")) target = target.replace(/\.ts$/, ".viz.html");
const HTML_PATH = target.startsWith("/") ? target : join(__dirname, target);
const PNG_PATH = HTML_PATH.replace(/\.html$/, ".png");
const URL_FILE = "file://" + HTML_PATH;

const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9224",
    "--user-data-dir=/tmp/chrome-cdp-viz-" + Date.now(),
    "--window-size=2400,900",
    URL_FILE,
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

async function waitForCDP() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9224/json");
      if (res.ok) return await res.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("CDP not ready after 5s");
}

try {
  const tabs = await waitForCDP();
  const tab = tabs.find((t) => t.url.startsWith("file://")) || tabs[0];
  const wsUrl = tab?.webSocketDebuggerUrl;
  if (!wsUrl) throw new Error("No CDP websocket. Tabs: " + JSON.stringify(tabs));

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };
  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Runtime.enable");
  await send("Page.enable");

  // Poll for SVG presence.
  const READY_CHECK = `(() => {
    const svg = document.querySelector('svg');
    if (!svg) return 'waiting';
    if (!svg.querySelector('.node')) return 'waiting';
    return 'ready';
  })()`;
  for (let i = 0; i < 100; i++) {
    const r = await send("Runtime.evaluate", {
      expression: READY_CHECK,
      returnByValue: true,
    });
    if (r.result?.result?.value === "ready") break;
    await new Promise((r) => setTimeout(r, 50));
  }

  // ── Extract layout data from the SVG ────────────────────────────────────
  const evalResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const svg = document.querySelector('svg');
      if (!svg) return JSON.stringify({ error: 'No SVG found' });

      // Use SVG-coordinate bounding boxes (getBBox) for everything we
      // measure so the numbers match the viewBox the file was authored in.

      const nodes = [];
      // Top-row outer nodes carry classes like "node node-llm".
      // Outer nodes = .node groups not inside a subflow region. A node
      // wrapped in <g class="subflow-region"> is part of a container's
      // embedded sub-topology and shouldn't be checked against outer-row
      // siblings (it's expected to overlap its parent container).
      const outerSelector = '.node:not(.sub-node)';
      const inSubflow = (el) => el.closest('.subflow-region');
      for (const g of svg.querySelectorAll(outerSelector)) {
        if (inSubflow(g)) continue;
        // skip the catch container itself: it's tagged ".catch-container".
        // Identify the catch by presence of a sibling text.catch-title.
        const classes = g.getAttribute('class') || '';
        const isCatch = classes.includes('node-catch');
        const labelText = g.querySelector('text');
        const bbox = g.getBBox();
        nodes.push({
          label: labelText?.textContent?.trim() || '(unlabeled)',
          kind: classes.split(' ').find(c => c.startsWith('node-'))?.replace('node-', '') || 'unknown',
          x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height,
          isCatch,
        });
      }

      // The catch container is a <g class="catch-container">.
      const catchContainers = [];
      for (const g of svg.querySelectorAll('.catch-container')) {
        const bg = g.querySelector('.catch-bg');
        if (!bg) continue;
        const x = parseFloat(bg.getAttribute('x'));
        const y = parseFloat(bg.getAttribute('y'));
        const w = parseFloat(bg.getAttribute('width'));
        const h = parseFloat(bg.getAttribute('height'));
        const titleEl = g.querySelector('.catch-title');
        catchContainers.push({
          label: titleEl?.textContent?.trim() || 'catch',
          x, y, w, h,
        });
      }

      const subNodes = [];
      for (const g of svg.querySelectorAll('.sub-node')) {
        const rect = g.querySelector('rect');
        const text = g.querySelector('text');
        if (!rect) continue;
        subNodes.push({
          label: text?.textContent?.trim() || '(unlabeled)',
          x: parseFloat(rect.getAttribute('x')),
          y: parseFloat(rect.getAttribute('y')),
          w: parseFloat(rect.getAttribute('width')),
          h: parseFloat(rect.getAttribute('height')),
        });
      }

      const edgeLabels = [];
      for (const t of svg.querySelectorAll('.edge-label')) {
        const bbox = t.getBBox();
        edgeLabels.push({
          label: t.textContent?.trim() || '',
          x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height,
          cls: t.getAttribute('class') || '',
          // Inner = inside a subflow region. Such labels are expected to
          // sit *inside* their container's body and should not be flagged
          // for overlapping the container.
          inSubflow: !!t.closest('.subflow-region'),
        });
      }

      // In-card field text: every .field-name and .field-type. Used to
      // detect overflow where a long type collides with its own row's name.
      const fieldTexts = [];
      for (const t of svg.querySelectorAll('.field-name, .field-type')) {
        const bbox = t.getBBox();
        fieldTexts.push({
          label: t.textContent?.trim() || '',
          kind: t.classList.contains('field-name') ? 'name' : 'type',
          x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height,
        });
      }

      const edges = [];
      for (const p of svg.querySelectorAll('path.edge')) {
        const d = p.getAttribute('d') || '';
        const bbox = p.getBBox();
        edges.push({
          d,
          cls: p.getAttribute('class') || '',
          x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height,
          totalLength: p.getTotalLength(),
        });
      }

      // Sample each edge path uniformly along its arc length so we can
      // check whether the path passes through a node rectangle without
      // either endpoint being inside that node.
      const SAMPLES = 40;
      const edgeSamples = edges.map((e, idx) => {
        const path = svg.querySelectorAll('path.edge')[idx];
        const out = [];
        for (let i = 0; i <= SAMPLES; i++) {
          const pt = path.getPointAtLength((i / SAMPLES) * e.totalLength);
          out.push({ x: pt.x, y: pt.y });
        }
        return out;
      });

      const vb = svg.getAttribute('viewBox');
      let viewBox = { x: 0, y: 0, w: 0, h: 0 };
      if (vb) {
        const p = vb.split(/\\s+/).map(Number);
        viewBox = { x: p[0] || 0, y: p[1] || 0, w: p[2] || 0, h: p[3] || 0 };
      }

      return JSON.stringify({
        nodes, catchContainers, subNodes, edgeLabels, fieldTexts,
        edges: edges.map((e, i) => ({ ...e, samples: edgeSamples[i] })),
        viewBox,
      });
    })()`,
    returnByValue: true,
  });

  const data = JSON.parse(evalResult.result?.result?.value ?? "{}");
  if (data.error) {
    console.error("ERROR:", data.error);
    chrome.kill();
    process.exit(1);
  }

  // ── Screenshot the page ────────────────────────────────────────────────
  // Set viewport that matches the SVG plus some chrome padding.
  // Size the viewport to fit the actual SVG so we capture the whole thing.
  const svgPad = 80;
  const captureW = Math.max(2000, Math.ceil(data.viewBox.w) + svgPad);
  const captureH = Math.max(700, Math.ceil(data.viewBox.h) + 220);
  await send("Emulation.setDeviceMetricsOverride", {
    width: captureW,
    height: captureH,
    deviceScaleFactor: 2,
    mobile: false,
  });

  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: captureW, height: captureH, scale: 1 },
  });
  if (shot.result?.data) {
    writeFileSync(PNG_PATH, Buffer.from(shot.result.data, "base64"));
  }

  // ── Issue detection ────────────────────────────────────────────────────
  const issues = [];
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function pointInRect(px, py, r, pad = 0) {
    return px >= r.x - pad && px <= r.x + r.w + pad &&
           py >= r.y - pad && py <= r.y + r.h + pad;
  }
  function overlapArea(a, b) {
    const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return { ox, oy };
  }

  // 1. Node↔node overlap (outer nodes only).
  for (let i = 0; i < data.nodes.length; i++) {
    for (let j = i + 1; j < data.nodes.length; j++) {
      const a = data.nodes[i], b = data.nodes[j];
      if (rectsOverlap(a, b)) {
        const { ox, oy } = overlapArea(a, b);
        issues.push({
          severity: "error",
          type: "node-overlap",
          msg: `"${a.label}" overlaps "${b.label}" by ${ox.toFixed(0)}×${oy.toFixed(0)}px`,
        });
      }
    }
  }

  // 2. Sub-nodes must be fully inside the catch container.
  if (data.catchContainers.length > 0) {
    const cc = data.catchContainers[0];
    for (const sn of data.subNodes) {
      const clips = [];
      if (sn.x < cc.x) clips.push(`left by ${(cc.x - sn.x).toFixed(0)}px`);
      if (sn.x + sn.w > cc.x + cc.w) clips.push(`right by ${(sn.x + sn.w - cc.x - cc.w).toFixed(0)}px`);
      if (sn.y < cc.y) clips.push(`top by ${(cc.y - sn.y).toFixed(0)}px`);
      if (sn.y + sn.h > cc.y + cc.h) clips.push(`bottom by ${(sn.y + sn.h - cc.y - cc.h).toFixed(0)}px`);
      if (clips.length > 0) {
        issues.push({
          severity: "error",
          type: "sub-node-clips-catch",
          msg: `sub-node "${sn.label}" clips catch container: ${clips.join(", ")}`,
        });
      }
    }
  }

  // 3. Edge label ↔ node overlap (outer nodes only — sub-nodes get close
  //    to inner edges by design). Labels rendered inside a subflow
  //    region are expected to sit inside their container's body and
  //    aren't checked against outer nodes.
  const LABEL_PAD = 4;
  for (const el of data.edgeLabels) {
    if (el.inSubflow) continue;
    for (const n of data.nodes) {
      if (rectsOverlap(el, n)) {
        const { ox, oy } = overlapArea(el, n);
        issues.push({
          severity: "warning",
          type: "label-overlaps-node",
          msg: `label "${el.label}" overlaps node "${n.label}" by ${ox.toFixed(0)}×${oy.toFixed(0)}px`,
        });
      }
    }
  }

  // 3b. Field-name ↔ field-type overlap within the same row (in-card
  //     overflow). Pair entries that share a y-band and check for x overlap.
  const fieldsByRow = new Map();
  for (const ft of data.fieldTexts ?? []) {
    const key = Math.round(ft.y / 4) * 4;
    if (!fieldsByRow.has(key)) fieldsByRow.set(key, []);
    fieldsByRow.get(key).push(ft);
  }
  for (const row of fieldsByRow.values()) {
    for (let i = 0; i < row.length; i++) {
      for (let j = i + 1; j < row.length; j++) {
        const a = row[i], b = row[j];
        if (rectsOverlap(a, b)) {
          const { ox, oy } = overlapArea(a, b);
          issues.push({
            severity: "warning",
            type: "field-text-overlap",
            msg: `field text "${a.label}" overlaps "${b.label}" by ${ox.toFixed(0)}×${oy.toFixed(0)}px (in-card overflow)`,
          });
        }
      }
    }
  }

  // 4. Edge label ↔ edge label overlap.
  for (let i = 0; i < data.edgeLabels.length; i++) {
    for (let j = i + 1; j < data.edgeLabels.length; j++) {
      const a = data.edgeLabels[i], b = data.edgeLabels[j];
      if (rectsOverlap(a, b)) {
        const { ox, oy } = overlapArea(a, b);
        issues.push({
          severity: "warning",
          type: "label-overlaps-label",
          msg: `label "${a.label}" overlaps label "${b.label}" by ${ox.toFixed(0)}×${oy.toFixed(0)}px`,
        });
      }
    }
  }

  // 5. Edge path passes through a node rect when neither endpoint is that node.
  //    Sample-based: count samples that fall strictly inside a node's interior
  //    (with a small inset so endpoints don't trigger).
  const INSET = 4;
  data.edges.forEach((e, idx) => {
    // First and last sample are endpoints.
    const start = e.samples[0];
    const end = e.samples[e.samples.length - 1];
    // For each node, find which (if any) the start or end touches.
    const touchingNodes = new Set();
    for (const n of data.nodes) {
      if (pointInRect(start.x, start.y, n, INSET)) touchingNodes.add(n.label);
      if (pointInRect(end.x, end.y, n, INSET)) touchingNodes.add(n.label);
    }
    for (const n of data.nodes) {
      if (touchingNodes.has(n.label)) continue;
      // Count interior samples (skip first and last).
      let interiorHits = 0;
      for (let i = 1; i < e.samples.length - 1; i++) {
        const s = e.samples[i];
        // Strict inside (no padding) — only flag if the line clearly cuts through.
        const inside = s.x > n.x + INSET && s.x < n.x + n.w - INSET &&
                       s.y > n.y + INSET && s.y < n.y + n.h - INSET;
        if (inside) interiorHits++;
      }
      if (interiorHits > 0) {
        issues.push({
          severity: "warning",
          type: "edge-through-node",
          msg: `edge #${idx} (${e.cls}) passes through "${n.label}" (${interiorHits} sampled points inside)`,
        });
      }
    }
  });

  // 6. Anything outside the viewBox.
  if (data.viewBox.w > 0 && data.viewBox.h > 0) {
    const vbLeft = data.viewBox.x;
    const vbTop = data.viewBox.y;
    const vbRight = data.viewBox.x + data.viewBox.w;
    const vbBottom = data.viewBox.y + data.viewBox.h;
    const checkOOB = (label, r) => {
      const clips = [];
      if (r.x < vbLeft) clips.push(`left by ${(vbLeft - r.x).toFixed(0)}px`);
      if (r.y < vbTop) clips.push(`top by ${(vbTop - r.y).toFixed(0)}px`);
      if (r.x + r.w > vbRight) clips.push(`right by ${(r.x + r.w - vbRight).toFixed(0)}px`);
      if (r.y + r.h > vbBottom) clips.push(`bottom by ${(r.y + r.h - vbBottom).toFixed(0)}px`);
      if (clips.length > 0) {
        issues.push({
          severity: "error",
          type: "outside-viewbox",
          msg: `${label} extends outside viewBox (${data.viewBox.w}×${data.viewBox.h}): ${clips.join(", ")}`,
        });
      }
    };
    for (const n of data.nodes) checkOOB(`node "${n.label}"`, n);
    for (const cc of data.catchContainers) checkOOB(`catch "${cc.label}"`, cc);
    for (const el of data.edgeLabels) checkOOB(`label "${el.label}"`, el);
  }

  // ── Output ─────────────────────────────────────────────────────────────
  if (showJson) {
    console.log(JSON.stringify({ data, issues }, null, 2));
  } else {
    console.log(`Screenshot: ${PNG_PATH}`);
    console.log(`HTML:       ${HTML_PATH}`);
    console.log();
    console.log(`viewBox:    ${data.viewBox.w} × ${data.viewBox.h}`);
    console.log(`outer nodes: ${data.nodes.length}`);
    console.log(`catch containers: ${data.catchContainers.length}`);
    console.log(`sub-nodes:  ${data.subNodes.length}`);
    console.log(`edge labels: ${data.edgeLabels.length}`);
    console.log(`edges:      ${data.edges.length}`);
    console.log();

    console.log("── OUTER NODES ──");
    for (const n of data.nodes) {
      console.log(`  ${n.label.padEnd(22)} (${n.kind.padEnd(9)}) x:${n.x.toFixed(0).padStart(5)} y:${n.y.toFixed(0).padStart(4)}  w:${n.w.toFixed(0).padStart(4)} h:${n.h.toFixed(0).padStart(3)}`);
    }
    if (data.catchContainers.length > 0) {
      console.log("\n── CATCH CONTAINERS ──");
      for (const cc of data.catchContainers) {
        console.log(`  ${cc.label.padEnd(22)} x:${cc.x.toFixed(0).padStart(5)} y:${cc.y.toFixed(0).padStart(4)}  w:${cc.w.toFixed(0).padStart(4)} h:${cc.h.toFixed(0).padStart(3)}`);
      }
    }
    console.log("\n── SUB-NODES (inside catch) ──");
    for (const sn of data.subNodes) {
      console.log(`  ${sn.label.padEnd(22)} x:${sn.x.toFixed(0).padStart(5)} y:${sn.y.toFixed(0).padStart(4)}  w:${sn.w.toFixed(0).padStart(4)} h:${sn.h.toFixed(0).padStart(3)}`);
    }
    console.log("\n── EDGE LABELS ──");
    for (const el of data.edgeLabels) {
      console.log(`  ${el.label.padEnd(28)} x:${el.x.toFixed(0).padStart(5)} y:${el.y.toFixed(0).padStart(4)}  w:${el.w.toFixed(0).padStart(4)} h:${el.h.toFixed(0).padStart(3)}`);
    }

    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    console.log(`\n── ISSUES: ${errors.length} error(s), ${warnings.length} warning(s) ──`);
    if (issues.length === 0) console.log("  (none)");
    for (const it of issues) {
      console.log(`  [${it.severity.toUpperCase()}] ${it.type}: ${it.msg}`);
    }
  }

  ws.close();
  chrome.kill();
  process.exit(issues.some((i) => i.severity === "error") ? 1 : 0);
} catch (e) {
  console.error("FAIL:", e.message);
  chrome.kill();
  process.exit(2);
}
