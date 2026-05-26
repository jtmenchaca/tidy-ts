// Generic topology visualizer.
//
// Imports the topology from full-featured.ts, serializes it with build.toOAS(),
// walks the JSON, lays it out, and writes a self-contained SVG to
// full-featured.viz.html.
//
// Each node renders as a card with two columns: inputs (left) and outputs
// (right). Each field is a row with name + type. Data-flow edges connect
// a specific output row of one node to a specific input row of another.
// Branching nodes anchor their outgoing edges at the input row they read.
//
// Run:
//   deno run -A packages/ai/examples/full-featured.viz.ts
//   open packages/ai/examples/full-featured.viz.html



import { build, tool } from "../mod.ts";
import type { Topology } from "../ts/topology/topology.ts";

// ─── OAS JSON shape (the subset we walk) ─────────────────────────────────
type JsonSchema = {
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  items?: JsonSchema;
  title?: string;
};
type OASProperty = {
  title: string;
  type?: string | string[];
  jsonSchema?: JsonSchema;
};
type OASTool = {
  componentType: "ServerTool";
  id: string;
  name: string;
  description?: string;
  inputs?: OASProperty[];
  outputs?: OASProperty[];
};
type OASToolBox = {
  componentType: "MCPToolBox";
  id: string;
  name: string;
  description?: string;
  toolFilter?: (string | { name: string })[];
  clientTransport?: { componentType?: string; name?: string };
};
type OASAgent = {
  componentType: "Agent";
  llmConfig?: { modelId?: string };
  systemPromptTemplate?: string;
  tools?: OASTool[];
  toolboxes?: OASToolBox[];
};
type OASNode = {
  id: string;
  name: string;
  componentType: string;
  llmConfig?: { modelId?: string };
  mapping?: Record<string, string>;
  inputs?: OASProperty[];
  outputs?: OASProperty[];
  subflow?: OASTopology;
  subflows?: OASTopology[];
  iterateOver?: string;
  concurrency?: number;
  // MapNode / ParallelMapNode: per-output reduction method.
  reducers?: Record<string, string>;
  // AgentNode: the embedded Agent carries the model and the tool list.
  agent?: OASAgent;
};
type OASRef = { $component_ref: string };
type OASControlEdge = {
  componentType: "ControlFlowEdge";
  id: string;
  name: string;
  fromNode: OASRef;
  toNode: OASRef;
  fromBranch?: string;
};
type OASDataEdge = {
  componentType: "DataFlowEdge";
  id: string;
  name: string;
  sourceNode: OASRef;
  sourceOutput: string;
  destinationNode: OASRef;
  destinationInput: string;
};
type OASTopology = {
  id?: string;
  name?: string;
  version?: string;
  citation?: string;
  nodes: OASNode[];
  controlFlowConnections: (OASControlEdge | OASDataEdge)[];
  dataFlowConnections: (OASControlEdge | OASDataEdge)[];
  startNode: OASRef;
};

function isControlEdge(e: OASControlEdge | OASDataEdge): e is OASControlEdge {
  return e.componentType === "ControlFlowEdge";
}
function isDataEdge(e: OASControlEdge | OASDataEdge): e is OASDataEdge {
  return e.componentType === "DataFlowEdge";
}

// ─── Type formatting ─────────────────────────────────────────────────────
function formatType(prop: OASProperty): string {
  const js = prop.jsonSchema ?? {};
  if (js.const !== undefined) return `"${String(js.const)}"`;
  if (js.enum) {
    const vals = js.enum as string[];
    const rendered = vals.map((v) => typeof v === "string" ? v : JSON.stringify(v));
    const joined = rendered.join("|");
    // Up to ~28 chars worth of values renders inline; beyond that, fall
    // back to a count so we don't blow out the column.
    if (joined.length <= 28) return joined;
    return `enum[${vals.length}]`;
  }
  // Nullable union (e.g. anyOf: [array, null]) — handle the common shape
  // where jsonSchema is { anyOf: [...] } by looking at items/anyOf.
  const anyOf = (js as { anyOf?: JsonSchema[] }).anyOf;
  if (anyOf && anyOf.length > 0) {
    const nonNull = anyOf.find((s) => s.type !== "null");
    const hasNull = anyOf.some((s) => s.type === "null");
    if (nonNull) {
      const inner = formatType({ title: prop.title, jsonSchema: nonNull });
      return hasNull ? `${inner}?` : inner;
    }
  }
  const t = (js.type ?? prop.type ?? "any") as string | string[];
  if (Array.isArray(t)) {
    const nonNull = t.filter((x) => x !== "null");
    const hasNull = t.includes("null");
    const inner = nonNull.length === 1 ? nonNull[0] : nonNull.join("|");
    return hasNull ? `${inner}?` : inner;
  }
  if (t === "array" && js.items) {
    // Recurse: items can itself be an array (string[][]), an enum, a
    // const, or another nullable union.
    const inner = formatType({ title: "", jsonSchema: js.items });
    return `${inner}[]`;
  }
  return t;
}

// ─── Geometry ────────────────────────────────────────────────────────────
const HEADER_H = 40;
const FIELD_SECTION_GAP = 22; // space below header for the "inputs"/"outputs" labels
const ROW_H = 20;
const ROW_PAD = 10; // bottom padding inside card after last field row
const COL_GAP = 80; // horizontal gap between columns in the outer grid
const ROW_GAP = 70; // vertical gap between rows in the outer grid
const PAD = 40;     // page padding around the whole diagram

// Per-column sizing (computed per node from content):
const COL_INNER_PAD = 12;     // padding inside the card edge to the field text
const NAME_TYPE_GAP = 16;     // gap between a row's name and its type chip
const DIVIDER_GAP = 16;       // gap between left column type and right column name (across the divider)
const MIN_COL_W = 70;         // never go narrower than this per column
const HEADER_PAD = 24;        // headers need a bit of breathing room around the name

// Monospace text width estimator. The 11px ui-monospace font we use
// averages ~6.6 px/char; the 13px name font is ~7.4 px/char. We err
// slightly wide so text never bumps into its neighbor.
const CHAR_W_FIELD = 7.0;     // 11px monospace
const CHAR_W_NAME_HDR = 7.6;  // 13px header name

// Subflow panel sizing — applies when a container node (Catch/Flow/Map/
// ParallelMap/ParallelFlow) embeds an inner build. The panel is the
// region below the I/O columns that holds the wrapped topology's mini-DAG.
const SUBFLOW_PAD = 14;         // padding around the subflow panel
const SUBFLOW_CAPTION_H = 32;   // citation header strip above the panel
const SUBFLOW_BETWEEN_GAP = 12; // gap between two stacked subflows (ParallelFlow)
const SUBFLOW_TOP_GAP = 14;     // gap between the I/O rows and the subflow panel

// Tools panel sizing — applies to AgentNode. One row per tool, with a
// "TOOLS" caption strip above.
const TOOL_ROW_H = 32;          // each tool's row height (name + signature)
const TOOLS_HEADER_H = 18;      // header strip ("tools")
const TOOLS_PAD = 12;           // padding around the tools panel

// ─── Layout ──────────────────────────────────────────────────────────────
type Placed = {
  id: string;
  name: string;
  componentType: string;
  model?: string;
  inputs: OASProperty[];
  outputs: OASProperty[];
  mapping?: Record<string, string>; // BranchingNode: input field title → branch name → out edge label
  col: number;
  row: number;
  x: number;
  y: number;
  // Per-node sized columns. leftColW = width of inputs column; rightColW
  // = width of outputs column. Either can be 0 if the node has no fields
  // on that side. `w` is the resulting card width.
  leftColW: number;
  rightColW: number;
  w: number;
  h: number;
  // Subflow rendering. For CatchExceptionNode / FlowNode / MapNode /
  // ParallelMapNode, exactly one inner layout; for ParallelFlowNode,
  // multiple (rendered stacked). Each carries its own placed nodes +
  // dimensions so the container can size around them.
  subflows?: LaidOutTopology[];
  // For MapNode / ParallelMapNode: which input field is iterated.
  iterateOver?: string;
  // For ParallelMapNode / ParallelFlowNode: concurrency cap.
  concurrency?: number;
  // For MapNode / ParallelMapNode: per-output reducer (e.g. append, sum).
  reducers?: Record<string, string>;
  // For AgentNode: the tool list. Surfaced as a side panel below the
  // I/O columns so a tool-using agent doesn't look like a plain LLM call.
  tools?: OASTool[];
  // For AgentNode: toolboxes — runtime-discovered tool sources. Render
  // as a single row per box (name + transport summary), since the box
  // doesn't expose a fixed signature.
  toolboxes?: OASToolBox[];
  // Per-tool/per-toolbox description wrapped into the panel width.
  toolDescLines?: string[][];
  boxDescLines?: string[][];
};

type LaidOutTopology = {
  id?: string;
  name?: string;
  version?: string;
  citation?: string;
  placed: Placed[];
  controlEdges: OASControlEdge[];
  dataEdges: OASDataEdge[];
  width: number;
  height: number;
};

// Width of one row's "name + gap + type" content, in pixels.
function rowContentWidth(prop: OASProperty): number {
  const name = prop.title;
  const type = formatType(prop);
  return name.length * CHAR_W_FIELD + NAME_TYPE_GAP + type.length * CHAR_W_FIELD;
}

function columnContentWidth(props: OASProperty[]): number {
  if (props.length === 0) return 0;
  return Math.max(...props.map(rowContentWidth));
}

function headerContentWidth(name: string, sub: string | undefined): number {
  const nameW = name.length * CHAR_W_NAME_HDR;
  const subW = sub ? sub.length * CHAR_W_FIELD : 0;
  return Math.max(nameW, subW) + HEADER_PAD * 2;
}

// Estimated width of a tool's rendered row. Signature shape:
//   tool_name(p1: T, p2: T) → R
function toolSignature(tool: OASTool): string {
  const params = (tool.inputs ?? []).map((p) => `${p.title}: ${formatType(p)}`).join(", ");
  const outs = (tool.outputs ?? []).map((p) => formatType(p)).join(", ");
  const right = outs.length === 0 ? "" : ` → ${outs}`;
  return `${tool.name}(${params})${right}`;
}
function toolSignatureWidth(tool: OASTool): number {
  return toolSignature(tool).length * CHAR_W_FIELD;
}

// MCPToolBox rendered as a single row: name + transport summary +
// optional toolFilter count. The box doesn't have a fixed signature
// because it expands at runtime against the configured server.
function toolboxSignature(box: OASToolBox): string {
  const transport = box.clientTransport?.componentType?.replace("Transport", "").toLowerCase() ?? "?";
  const filter = box.toolFilter && box.toolFilter.length > 0
    ? ` [${box.toolFilter.length} tool${box.toolFilter.length === 1 ? "" : "s"}]`
    : "";
  return `${box.name} (mcp ${transport})${filter}`;
}
function toolboxRowWidth(box: OASToolBox): number {
  return toolboxSignature(box).length * CHAR_W_FIELD;
}

// Word-wrap a string to fit a target pixel width using the field-font
// character estimator. Returns one line per output element. Hard breaks
// on long unbreakable tokens so a very long word doesn't force the
// panel to widen indefinitely.
function wrapText(text: string, maxWidthPx: number): string[] {
  if (!text) return [];
  const maxChars = Math.max(20, Math.floor(maxWidthPx / CHAR_W_FIELD));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur.length === 0) {
      cur = w;
    } else if ((cur.length + 1 + w.length) <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur.length > 0) lines.push(cur);
  // Hard-break any line that's still over the cap.
  const out: string[] = [];
  for (const line of lines) {
    if (line.length <= maxChars) {
      out.push(line);
    } else {
      for (let i = 0; i < line.length; i += maxChars) {
        out.push(line.slice(i, i + maxChars));
      }
    }
  }
  return out;
}

// Compute per-side column widths and the resulting node width.
function nodeWidths(
  inputs: OASProperty[],
  outputs: OASProperty[],
  name: string,
  sub: string | undefined,
): { leftColW: number; rightColW: number; w: number } {
  const hasInputs = inputs.length > 0;
  const hasOutputs = outputs.length > 0;

  // Each column's content (without internal/divider padding).
  const leftContent = columnContentWidth(inputs);
  const rightContent = columnContentWidth(outputs);

  // Apply minimums per side that actually has content.
  const leftColW = hasInputs ? Math.max(MIN_COL_W, leftContent) : 0;
  const rightColW = hasOutputs ? Math.max(MIN_COL_W, rightContent) : 0;

  // Total card width = padding + left col + (divider gap if both) + right col + padding.
  let w = COL_INNER_PAD * 2 + leftColW + rightColW;
  if (hasInputs && hasOutputs) w += DIVIDER_GAP;

  // Card has to be at least as wide as the header text.
  w = Math.max(w, headerContentWidth(name, sub));
  return { leftColW, rightColW, w };
}

function nodeHeight(inputs: OASProperty[], outputs: OASProperty[]): number {
  const rows = Math.max(inputs.length, outputs.length);
  return HEADER_H + FIELD_SECTION_GAP + rows * ROW_H + ROW_PAD;
}

function assignColumns(topology: OASTopology): Map<string, number> {
  const cols = new Map<string, number>();
  cols.set(topology.startNode.$component_ref, 0);
  const outgoing = new Map<string, OASControlEdge[]>();
  for (const e of topology.controlFlowConnections) {
    if (!isControlEdge(e)) continue;
    const arr = outgoing.get(e.fromNode.$component_ref) ?? [];
    arr.push(e);
    outgoing.set(e.fromNode.$component_ref, arr);
  }
  let changed = true;
  let iter = 0;
  const maxIter = topology.nodes.length * topology.nodes.length;
  while (changed && iter++ < maxIter) {
    changed = false;
    for (const [fromId, edges] of outgoing) {
      const fromCol = cols.get(fromId);
      if (fromCol === undefined) continue;
      for (const e of edges) {
        const toId = e.toNode.$component_ref;
        const next = fromCol + 1;
        const existing = cols.get(toId);
        if (existing === undefined || next > existing) {
          cols.set(toId, next);
          changed = true;
        }
      }
    }
  }
  for (const n of topology.nodes) {
    if (!cols.has(n.id)) cols.set(n.id, 0);
  }
  return cols;
}

function assignRows(topology: OASTopology, cols: Map<string, number>): Map<string, number> {
  const startId = topology.startNode.$component_ref;
  const endNode = topology.nodes.find((n) => n.componentType === "EndNode");
  if (!endNode) return new Map(topology.nodes.map((n) => [n.id, 0]));
  const endId = endNode.id;

  const adj = new Map<string, string[]>();
  for (const e of topology.controlFlowConnections) {
    if (!isControlEdge(e)) continue;
    const arr = adj.get(e.fromNode.$component_ref) ?? [];
    arr.push(e.toNode.$component_ref);
    adj.set(e.fromNode.$component_ref, arr);
  }
  const distFromStart = new Map<string, number>();
  const pred = new Map<string, string | undefined>();
  distFromStart.set(startId, 0);
  pred.set(startId, undefined);
  const queue = [startId];
  while (queue.length) {
    const u = queue.shift()!;
    const du = distFromStart.get(u)!;
    for (const v of adj.get(u) ?? []) {
      if (!distFromStart.has(v) || distFromStart.get(v)! < du + 1) {
        distFromStart.set(v, du + 1);
        pred.set(v, u);
        queue.push(v);
      }
    }
  }
  const spine = new Set<string>();
  let cur: string | undefined = endId;
  while (cur !== undefined) {
    spine.add(cur);
    cur = pred.get(cur);
  }

  const rows = new Map<string, number>();
  for (const n of topology.nodes) {
    if (spine.has(n.id)) rows.set(n.id, 0);
  }
  const nonSpine = topology.nodes
    .filter((n) => !spine.has(n.id))
    .sort((a, b) => (cols.get(a.id)! - cols.get(b.id)!));
  for (const n of nonSpine) {
    const col = cols.get(n.id)!;
    const used = new Set<number>();
    for (const other of topology.nodes) {
      if (other.id === n.id) continue;
      if (cols.get(other.id) === col && rows.has(other.id)) {
        used.add(rows.get(other.id)!);
      }
    }
    let r = 1;
    while (used.has(r)) r++;
    rows.set(n.id, r);
  }
  return rows;
}

// Top-level + recursive layout. When a node has a `subflow` (Catch /
// Flow / Map / ParallelMap) or `subflows` (ParallelFlow), the inner
// topology is laid out first so the container's width/height can grow to
// fit. Geometry is the same at every nesting level — the recursion just
// returns a smaller LaidOutTopology that the parent embeds.
function layoutTopology(t: OASTopology): LaidOutTopology {
  const cols = assignColumns(t);
  const rows = assignRows(t, cols);

  const placed = t.nodes.map<Placed>((n) => {
    const inputs = n.inputs ?? [];
    const outputs = n.outputs ?? [];
    // Agent variants (AgentNode, SandboxAgentNode) keep model + tools on
    // the embedded agent; other node types put model on n.llmConfig.
    const isAgentLike = n.componentType === "AgentNode" || n.componentType === "SandboxAgentNode";
    const model = isAgentLike ? n.agent?.llmConfig?.modelId : n.llmConfig?.modelId;
    const tools = isAgentLike ? n.agent?.tools : undefined;
    const toolboxes = isAgentLike ? n.agent?.toolboxes : undefined;
    const sub = subline({
      // Synthetic argument — subline only reads model.
      id: n.id, name: n.name, componentType: n.componentType, model,
      inputs, outputs, col: 0, row: 0, x: 0, y: 0, w: 0, h: 0,
      leftColW: 0, rightColW: 0,
    });
    const { leftColW, rightColW, w: ioW } = nodeWidths(inputs, outputs, n.name, sub);

    // Recurse into subflow(s) if this is a container node.
    const subLayouts: LaidOutTopology[] = [];
    if (n.subflow) subLayouts.push(layoutTopology(n.subflow));
    if (n.subflows) {
      for (const sf of n.subflows) subLayouts.push(layoutTopology(sf));
    }

    // Container nodes are sized to fit both their I/O columns and their
    // subflow panel. The panel's intrinsic width includes padding and a
    // caption strip when the subflow has a citable id.
    const panelW = subLayouts.length === 0
      ? 0
      : Math.max(...subLayouts.map((s) => s.width));
    const panelH = subLayouts.length === 0
      ? 0
      : subLayouts.reduce((acc, s, i) => {
        const cap = s.id || s.citation ? SUBFLOW_CAPTION_H : 0;
        return acc + cap + s.height + (i > 0 ? SUBFLOW_BETWEEN_GAP : 0);
      }, 0);

    // Tools panel sizing — width is driven by signatures + toolbox-row
    // headers (descriptions wrap to fit, so they never force the panel
    // to widen). Height is computed after wrapping.
    const toolRowCount = tools?.length ?? 0;
    const boxRowCount = toolboxes?.length ?? 0;
    const totalRows = toolRowCount + boxRowCount;
    const toolPanelMinW = totalRows === 0
      ? 0
      : Math.max(
        ...(tools ?? []).map((tl) => toolSignatureWidth(tl)),
        ...(toolboxes ?? []).map((bx) => toolboxRowWidth(bx)),
      ) + TOOLS_PAD * 2;

    const ioH = nodeHeight(inputs, outputs);
    const w = Math.max(
      ioW,
      panelW + (subLayouts.length > 0 ? SUBFLOW_PAD * 2 : 0),
      toolPanelMinW,
    );

    // Now that we know the card width, wrap each description into the
    // available horizontal slot inside the tools panel.
    const descWrapWidth = w - TOOLS_PAD * 2 - 16;
    const toolDescLines: string[][] = (tools ?? []).map((tl) =>
      tl.description ? wrapText(tl.description, descWrapWidth) : []
    );
    const boxDescLines: string[][] = (toolboxes ?? []).map((bx) =>
      bx.description ? wrapText(bx.description, descWrapWidth) : []
    );

    const toolPanelH = totalRows === 0
      ? 0
      : TOOLS_HEADER_H +
        toolRowCount * 18 + // signature line
        toolDescLines.reduce((acc, ls) => acc + ls.length * 14, 0) +
        toolRowCount * 8 + // gap below each tool row
        boxRowCount * 18 +
        boxDescLines.reduce((acc, ls) => acc + ls.length * 14, 0) +
        boxRowCount * 8 +
        TOOLS_PAD;

    let h = ioH;
    if (subLayouts.length > 0) h += SUBFLOW_TOP_GAP + panelH + SUBFLOW_PAD;
    if (toolPanelH > 0) h += SUBFLOW_TOP_GAP + toolPanelH;

    return {
      id: n.id,
      name: n.name,
      componentType: n.componentType,
      model,
      inputs,
      outputs,
      mapping: n.mapping,
      col: cols.get(n.id)!,
      row: rows.get(n.id)!,
      x: 0,
      y: 0,
      leftColW,
      rightColW,
      w,
      h,
      subflows: subLayouts.length > 0 ? subLayouts : undefined,
      iterateOver: n.iterateOver,
      concurrency: n.concurrency,
      reducers: n.reducers,
      tools,
      toolboxes,
      toolDescLines: totalRows === 0 ? undefined : toolDescLines,
      boxDescLines: totalRows === 0 ? undefined : boxDescLines,
    };
  });

  // Per-column width = widest node in that column.
  const maxCol = Math.max(...placed.map((p) => p.col));
  const colW: number[] = [];
  for (const p of placed) {
    colW[p.col] = Math.max(colW[p.col] ?? 0, p.w);
  }
  const colX: number[] = [];
  let cursorX = PAD;
  for (let c = 0; c <= maxCol; c++) {
    colX[c] = cursorX;
    cursorX += (colW[c] ?? 0) + COL_GAP;
  }

  // Per-row height = tallest node in that row.
  const maxRow = Math.max(...placed.map((p) => p.row));
  const rowH: number[] = [];
  for (const p of placed) {
    rowH[p.row] = Math.max(rowH[p.row] ?? 0, p.h);
  }
  const rowY: number[] = [];
  let cursorY = PAD;
  for (let r = 0; r <= maxRow; r++) {
    rowY[r] = cursorY;
    cursorY += (rowH[r] ?? 0) + ROW_GAP;
  }

  // Center each node horizontally within its column slot.
  for (const p of placed) {
    const slot = colW[p.col] ?? p.w;
    p.x = colX[p.col] + (slot - p.w) / 2;
    p.y = rowY[p.row];
  }

  const width = cursorX - COL_GAP + PAD;
  const height = cursorY - ROW_GAP + PAD;
  return {
    id: t.id,
    name: t.name,
    version: t.version,
    citation: t.citation,
    placed,
    controlEdges: t.controlFlowConnections.filter(isControlEdge),
    dataEdges: t.dataFlowConnections.filter(isDataEdge),
    width,
    height,
  };
}

// Back-compat alias for the existing buildHtml call site.
function layout(t: OASTopology): { placed: Placed[]; width: number; height: number } {
  const laid = layoutTopology(t);
  return { placed: laid.placed, width: laid.width, height: laid.height };
}

// ─── Port anchors ────────────────────────────────────────────────────────
// Each input row sits on the left half; its anchor port is at (node.x, rowY).
// Each output row sits on the right half; its anchor port is at (node.x + node.w, rowY).
function fieldRowY(node: Placed, idx: number): number {
  return node.y + HEADER_H + FIELD_SECTION_GAP + idx * ROW_H + ROW_H / 2;
}
function inputPortY(node: Placed, fieldName: string): number {
  const idx = node.inputs.findIndex((p) => p.title === fieldName);
  if (idx < 0) return ioBandCenterY(node);
  return fieldRowY(node, idx);
}
function outputPortY(node: Placed, fieldName: string): number {
  const idx = node.outputs.findIndex((p) => p.title === fieldName);
  if (idx < 0) return ioBandCenterY(node);
  return fieldRowY(node, idx);
}

// Centerline of the I/O section (excludes any subflow / tools panel
// underneath). Container nodes (Catch / Flow / Map / ParallelMap /
// ParallelFlow) have a much taller total height, but their outer-graph
// arrows should still enter/exit at the I/O band.
function ioBandCenterY(node: Placed): number {
  const ioH = nodeHeight(node.inputs, node.outputs);
  return node.y + ioH / 2;
}
function nodeRightAnchorY(node: Placed): number {
  // If the node has outputs, anchor at the centerline of the outputs
  // column rows; otherwise at the I/O band centerline.
  if (node.outputs.length > 0) {
    // Center on the middle output row so multi-output nodes still get a
    // sensible anchor (rather than always row 0).
    const midIdx = Math.floor(node.outputs.length / 2);
    return fieldRowY(node, midIdx);
  }
  return ioBandCenterY(node);
}
function nodeLeftAnchorY(node: Placed): number {
  if (node.inputs.length > 0) {
    const midIdx = Math.floor(node.inputs.length / 2);
    return fieldRowY(node, midIdx);
  }
  return ioBandCenterY(node);
}

// ─── Rendering ───────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Decide what to show below the node name.
// Rule: never restate the name or the kind that's already visually obvious
// from the node's shape/color. Only show something genuinely additive.
function subline(p: Placed): string | undefined {
  // Sandbox agents prepend a "sandbox" tag to the model id so they read
  // visually distinct from a plain Agent.
  if (p.componentType === "SandboxAgentNode") {
    return p.model ? `sandbox · ${p.model}` : "sandbox";
  }
  if (p.model) return p.model;
  // Start / End / Branching: their visual styling already communicates
  // their type — no subline needed.
  return undefined;
}

function renderNode(p: Placed): string {
  const x = p.x, y = p.y, w = p.w, h = p.h;
  const cx = x + w / 2;
  const hasInputs = p.inputs.length > 0;
  const hasOutputs = p.outputs.length > 0;
  const hasBoth = hasInputs && hasOutputs;
  // Column divider sits between the two content columns. The inputs
  // column is left-anchored (name then type left-to-right ending at
  // x + COL_INNER_PAD + leftColW). The outputs column is right-anchored,
  // ending at x + w - COL_INNER_PAD. We put the divider at the midpoint
  // between those two edges so the gap reads as central rather than
  // hugging one side when the card was widened to fit a subflow panel.
  const inputsRightEdge = x + COL_INNER_PAD + p.leftColW;
  const outputsLeftEdge = x + w - COL_INNER_PAD - p.rightColW;
  const colDivX = hasBoth
    ? (inputsRightEdge + outputsLeftEdge) / 2
    : x + w / 2;

  // Body card (single rounded rectangle behind everything).
  const body = `<rect class="node-body node-body-${p.componentType}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" ry="8" />`;

  // Header.
  const sub = subline(p);
  const headerY = y;
  const headerH = HEADER_H;
  const headerLines: string[] = [];
  // Header band fill — only top of the card, rounded only at top corners.
  headerLines.push(
    `<path class="node-header node-header-${p.componentType}" d="${headerBandPath(x, headerY, w, headerH)}" />`,
  );
  // Name (centered when no subline, otherwise upper position).
  if (sub) {
    headerLines.push(
      `<text class="node-name" x="${cx}" y="${y + 16}" text-anchor="middle">${esc(p.name)}</text>`,
    );
    headerLines.push(
      `<text class="node-sub" x="${cx}" y="${y + 29}" text-anchor="middle">${esc(sub)}</text>`,
    );
  } else {
    headerLines.push(
      `<text class="node-name" x="${cx}" y="${y + 22}" text-anchor="middle">${esc(p.name)}</text>`,
    );
  }
  // Separator line under the header.
  headerLines.push(
    `<line class="header-divider" x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" />`,
  );

  // Column section labels.
  const sectionY = y + headerH + 12;
  const sectionLabels: string[] = [];
  if (hasBoth) {
    sectionLabels.push(
      `<text class="section-label" x="${x + COL_INNER_PAD}" y="${sectionY}">inputs</text>`,
      `<text class="section-label" x="${x + w - COL_INNER_PAD}" y="${sectionY}" text-anchor="end">outputs</text>`,
    );
  } else if (hasInputs) {
    sectionLabels.push(
      `<text class="section-label" x="${x + COL_INNER_PAD}" y="${sectionY}">inputs</text>`,
    );
  } else if (hasOutputs) {
    sectionLabels.push(
      `<text class="section-label" x="${x + w - COL_INNER_PAD}" y="${sectionY}" text-anchor="end">outputs</text>`,
    );
  }

  // Vertical column divider (only when we have both columns).
  const divider = hasBoth
    ? `<line class="col-divider" x1="${colDivX}" y1="${y + headerH + 6}" x2="${colDivX}" y2="${y + h - 6}" />`
    : "";

  // Field rows. When only one side has fields, those fields span the
  // whole card width (more breathing room).
  const fieldRows: string[] = [];
  const rowCount = Math.max(p.inputs.length, p.outputs.length);
  for (let i = 0; i < rowCount; i++) {
    const rowY = y + headerH + FIELD_SECTION_GAP + i * ROW_H + ROW_H / 2;
    const inp = p.inputs[i];
    const out = p.outputs[i];

    if (inp) {
      fieldRows.push(`<circle class="port port-in" cx="${x}" cy="${rowY}" r="4" />`);
      // Inputs column is left-anchored: name at the left padding, type
      // right-aligned to the column's right edge. The column's right
      // edge is left-anchored too (independent of the outer card width).
      const nameX = x + COL_INNER_PAD;
      const typeX = hasBoth ? inputsRightEdge : x + w - COL_INNER_PAD;
      fieldRows.push(
        `<text class="field-name" x="${nameX}" y="${rowY + 4}">${esc(inp.title)}</text>`,
      );
      fieldRows.push(
        `<text class="field-type" x="${typeX}" y="${rowY + 4}" text-anchor="end">${esc(formatType(inp))}</text>`,
      );
    }
    if (out) {
      fieldRows.push(`<circle class="port port-out" cx="${x + w}" cy="${rowY}" r="4" />`);
      // Output column is right-anchored as a tight (name, type) block,
      // so the name stays visually attached to the type regardless of
      // how wide the card grew to fit a subflow panel underneath.
      const typeX = x + w - COL_INNER_PAD;
      const typeStr = formatType(out);
      // Approximate the type's rendered width so we can place the name
      // just to its left with NAME_TYPE_GAP between them.
      const typeWidth = typeStr.length * CHAR_W_FIELD;
      const nameRightEdge = typeX - typeWidth - NAME_TYPE_GAP;
      fieldRows.push(
        `<text class="field-name" x="${nameRightEdge}" y="${rowY + 4}" text-anchor="end">${esc(out.title)}</text>`,
      );
      fieldRows.push(
        `<text class="field-type" x="${typeX}" y="${rowY + 4}" text-anchor="end">${esc(typeStr)}</text>`,
      );
    }
  }

  // Subflow panel (Catch / Flow / Map / ParallelMap / ParallelFlow).
  let subflowSvg = "";
  if (p.subflows && p.subflows.length > 0) {
    const ioH = nodeHeight(p.inputs, p.outputs);
    let cursor = y + ioH + SUBFLOW_TOP_GAP;
    const meta = containerMeta(p);
    if (meta) {
      // Small italic strip beneath the I/O divider line, before the panel.
      subflowSvg +=
        `<text class="container-meta" x="${x + COL_INNER_PAD}" y="${cursor - 2}">${esc(meta)}</text>`;
    }
    for (let i = 0; i < p.subflows.length; i++) {
      const sub = p.subflows[i];
      // Caption strip if the subflow is a citable concept.
      const hasCaption = !!(sub.id || sub.citation);
      if (hasCaption) {
        // Background strip.
        subflowSvg += `<rect class="subflow-caption" x="${x + SUBFLOW_PAD}" y="${cursor}" width="${w - SUBFLOW_PAD * 2}" height="${SUBFLOW_CAPTION_H}" rx="4" ry="4" />`;
        const idLine = sub.id
          ? `${sub.id}${sub.version ? `  v${sub.version}` : ""}`
          : "";
        if (idLine) {
          subflowSvg += `<text class="subflow-id" x="${x + SUBFLOW_PAD + 8}" y="${cursor + 13}">${esc(idLine)}</text>`;
        }
        if (sub.citation) {
          subflowSvg += `<text class="subflow-citation" x="${x + SUBFLOW_PAD + 8}" y="${cursor + 26}">${esc(sub.citation)}</text>`;
        }
        cursor += SUBFLOW_CAPTION_H;
      }
      // The panel hosts the inner topology — offset by SUBFLOW_PAD on the left.
      const panelX = x + (w - sub.width) / 2;
      const panelY = cursor;
      subflowSvg += `<rect class="subflow-panel" x="${x + SUBFLOW_PAD}" y="${panelY}" width="${w - SUBFLOW_PAD * 2}" height="${sub.height}" rx="6" ry="6" />`;
      // Wrap the inner topology in a tagged group so the audit can tell
      // sub-nodes apart from outer-row siblings (they're *meant* to live
      // inside the container).
      subflowSvg += `<g class="subflow-region">${renderInnerTopology(sub, panelX, panelY)}</g>`;
      cursor += sub.height;
      if (i < p.subflows.length - 1) cursor += SUBFLOW_BETWEEN_GAP;
    }
  }

  // Tools panel (AgentNode). Surfaces both static ServerTools (with
  // signatures) and dynamic MCPToolBoxes (one row per box). Descriptions
  // are pre-wrapped to the available panel width during layout.
  let toolsSvg = "";
  const toolCount = p.tools?.length ?? 0;
  const boxCount = p.toolboxes?.length ?? 0;
  if (toolCount + boxCount > 0) {
    const ioH = nodeHeight(p.inputs, p.outputs);
    let cursorY = y + ioH + SUBFLOW_TOP_GAP;
    if (p.subflows && p.subflows.length > 0) {
      let subBottom = y + ioH + SUBFLOW_TOP_GAP;
      for (let i = 0; i < p.subflows.length; i++) {
        const sub = p.subflows[i];
        if (sub.id || sub.citation) subBottom += SUBFLOW_CAPTION_H;
        subBottom += sub.height;
        if (i < p.subflows.length - 1) subBottom += SUBFLOW_BETWEEN_GAP;
      }
      cursorY = subBottom + SUBFLOW_TOP_GAP;
    }
    const panelX = x + TOOLS_PAD;
    const panelW = w - TOOLS_PAD * 2;
    const toolDescLines = p.toolDescLines ?? [];
    const boxDescLines = p.boxDescLines ?? [];
    const panelH = TOOLS_HEADER_H +
      toolCount * 18 +
      toolDescLines.reduce((acc, ls) => acc + ls.length * 14, 0) +
      toolCount * 8 +
      boxCount * 18 +
      boxDescLines.reduce((acc, ls) => acc + ls.length * 14, 0) +
      boxCount * 8 +
      TOOLS_PAD;
    const headerLabel = boxCount === 0
      ? `tools (${toolCount})`
      : toolCount === 0
        ? `toolboxes (${boxCount})`
        : `tools (${toolCount}) + toolboxes (${boxCount})`;
    toolsSvg += `<rect class="tools-panel" x="${panelX}" y="${cursorY}" width="${panelW}" height="${panelH}" rx="6" ry="6" />`;
    toolsSvg += `<text class="section-label tools-header" x="${panelX + 8}" y="${cursorY + 13}">${esc(headerLabel)}</text>`;

    let rowY = cursorY + TOOLS_HEADER_H + 4;
    (p.tools ?? []).forEach((tl, i) => {
      toolsSvg += `<text class="tool-sig" x="${panelX + 8}" y="${rowY + 11}">${esc(toolSignature(tl))}</text>`;
      const lines = toolDescLines[i] ?? [];
      for (let j = 0; j < lines.length; j++) {
        toolsSvg += `<text class="tool-desc" x="${panelX + 8}" y="${rowY + 11 + 14 * (j + 1)}">${esc(lines[j])}</text>`;
      }
      rowY += 18 + lines.length * 14 + 8;
    });
    (p.toolboxes ?? []).forEach((box, i) => {
      toolsSvg += `<text class="tool-sig tool-box-sig" x="${panelX + 8}" y="${rowY + 11}">${esc(toolboxSignature(box))}</text>`;
      const lines = boxDescLines[i] ?? [];
      for (let j = 0; j < lines.length; j++) {
        toolsSvg += `<text class="tool-desc" x="${panelX + 8}" y="${rowY + 11 + 14 * (j + 1)}">${esc(lines[j])}</text>`;
      }
      rowY += 18 + lines.length * 14 + 8;
    });
  }

  return `
    <g class="node">
      ${body}
      ${headerLines.join("\n")}
      ${sectionLabels.join("\n")}
      ${divider}
      ${fieldRows.join("\n")}
      ${subflowSvg}
      ${toolsSvg}
    </g>`;
}

// Container metadata strip — surfaces type-specific facts (iterateOver,
// concurrency) that aren't covered by the I/O columns.
function containerMeta(p: Placed): string | undefined {
  const parts: string[] = [];
  switch (p.componentType) {
    case "MapNode":
      if (p.iterateOver) parts.push(`map over ${p.iterateOver}`);
      addReducersTo(parts, p.reducers);
      break;
    case "ParallelMapNode":
      if (p.iterateOver) parts.push(`parallel-map over ${p.iterateOver}`);
      if (p.concurrency !== undefined) parts.push(`concurrency ${p.concurrency}`);
      addReducersTo(parts, p.reducers);
      break;
    case "ParallelFlowNode":
      if (p.concurrency !== undefined) parts.push(`concurrency ${p.concurrency}`);
      break;
    case "CatchExceptionNode":
      parts.push("catch-exception");
      break;
    case "FlowNode":
      parts.push("embedded concept");
      break;
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function addReducersTo(parts: string[], reducers: Record<string, string> | undefined): void {
  if (!reducers) return;
  const entries = Object.entries(reducers);
  if (entries.length === 0) return;
  // Render `field: method` per declared reducer. Short form.
  const formatted = entries.map(([field, method]) => `${field}=${method}`);
  parts.push(`reduce ${formatted.join(", ")}`);
}

// Render the placed nodes + edges of a sub-topology at a given origin.
// Same code path as the outer render, just shifted.
function renderInnerTopology(laid: LaidOutTopology, originX: number, originY: number): string {
  // Translate every Placed by (originX, originY) for the call. We construct
  // a shallow copy with adjusted x/y rather than mutate the cached layout.
  const placedAtOrigin = laid.placed.map<Placed>((p) => ({
    ...p,
    x: p.x + originX,
    y: p.y + originY,
  }));
  const byId = new Map<string, Placed>();
  for (const p of placedAtOrigin) byId.set(p.id, p);

  const parts: string[] = [];
  for (const e of laid.controlEdges) {
    const a = byId.get(e.fromNode.$component_ref);
    const b = byId.get(e.toNode.$component_ref);
    if (!a || !b) continue;
    parts.push(renderControlEdge(a, b, e.fromBranch, branchInputOf(a), placedAtOrigin));
  }
  for (const e of laid.dataEdges) {
    const a = byId.get(e.sourceNode.$component_ref);
    const b = byId.get(e.destinationNode.$component_ref);
    if (!a || !b) continue;
    parts.push(renderDataEdge(a, e.sourceOutput, b, e.destinationInput, placedAtOrigin, originY));
  }
  for (const p of placedAtOrigin) parts.push(renderNode(p));
  return parts.join("\n");
}

function branchInputOf(node: Placed): string | undefined {
  if (node.componentType !== "BranchingNode") return undefined;
  return node.inputs[0]?.title;
}

// Build a path string for a header band that's rounded only at the top.
function headerBandPath(x: number, y: number, w: number, h: number): string {
  const r = 8;
  return (
    `M ${x + r} ${y} ` +
    `H ${x + w - r} ` +
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r} ` +
    `V ${y + h} ` +
    `H ${x} ` +
    `V ${y + r} ` +
    `A ${r} ${r} 0 0 1 ${x + r} ${y} Z`
  );
}

// Reserved lanes above the row for lofted data edges. Each distinct
// (fromCol, toCol) column-span gets its own y so multiple lofts don't
// overprint each other or their labels.
const dataLanes = new Map<string, number>();
function dataLaneY(fromCol: number, toCol: number, rowTop: number): number {
  const key = `${Math.min(fromCol, toCol)}-${Math.max(fromCol, toCol)}`;
  if (!dataLanes.has(key)) dataLanes.set(key, dataLanes.size);
  const idx = dataLanes.get(key)!;
  return rowTop - 24 - idx * 18;
}

// Edge routing.
function renderDataEdge(
  from: Placed,
  fromField: string,
  to: Placed,
  toField: string,
  allNodes: Placed[],
  rowTop: number,
): string {
  const ax = from.x + from.w;
  const ay = outputPortY(from, fromField);
  const bx = to.x;
  const by = inputPortY(to, toField);

  // Loft if any node sits in the corridor between source and dest columns.
  const spanCols = Math.abs(from.col - to.col);
  const crossesNode = spanCols > 1 && allNodes.some((n) => {
    if (n.id === from.id || n.id === to.id) return false;
    return n.col > Math.min(from.col, to.col) && n.col < Math.max(from.col, to.col);
  });

  let path: string;
  let lx: number;
  let ly: number;
  if (crossesNode) {
    const lane = dataLaneY(from.col, to.col, rowTop);
    path =
      `M ${ax} ${ay} ` +
      `L ${ax + 12} ${ay} ` +
      `L ${ax + 12} ${lane} ` +
      `L ${bx - 12} ${lane} ` +
      `L ${bx - 12} ${by} ` +
      `L ${bx} ${by}`;
    lx = (ax + bx) / 2;
    ly = lane - 4;
  } else {
    const dx = Math.max(40, (bx - ax) / 2);
    path = `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
    lx = (ax + bx) / 2;
    ly = (ay + by) / 2 - 4;
  }

  return `
    <g>
      <path class="edge edge-data" d="${path}" marker-end="url(#arrow-data)" fill="none" />
      <text class="edge-label data-label" x="${lx}" y="${ly}" text-anchor="middle">${esc(toField)}</text>
    </g>`;
}

function renderControlEdge(
  from: Placed,
  to: Placed,
  branch: string | undefined,
  // For BranchingNode: which input field the branch reads, so we anchor at
  // that row instead of node center.
  branchInputField: string | undefined,
  allNodes: Placed[],
): string {
  // Anchor on right of "from", left of "to". If from is a BranchingNode,
  // anchor at the input row that gates this branch. For container nodes
  // (with subflow panels), anchor at the I/O row band, not the geometric
  // centerline (which would land inside the inner panel).
  const ax = from.x + from.w;
  const ay = branchInputField
    ? inputPortY(from, branchInputField)
    : nodeRightAnchorY(from);
  const bx = to.x;
  const by = nodeLeftAnchorY(to);

  // Detect cross-node interference: if there's a node strictly inside
  // the corridor (not just touching its edges) whose vertical band
  // overlaps ay or by, loft above. We test column membership so a node
  // that happens to sit at exactly bx (e.g., a sibling in the same column
  // as `to`) isn't counted as blocking.
  const minCol = Math.min(from.col, to.col);
  const maxCol = Math.max(from.col, to.col);
  const needsLoft = allNodes.some((n) => {
    if (n.id === from.id || n.id === to.id) return false;
    if (n.col <= minCol || n.col >= maxCol) return false;
    return (ay >= n.y && ay <= n.y + n.h) || (by >= n.y && by <= n.y + n.h);
  });

  let path: string;
  let lx: number;
  let ly: number;
  if (needsLoft) {
    const topY = Math.min(...allNodes.map((n) => n.y)) - 30;
    path = `M ${ax} ${ay} C ${ax + 60} ${topY}, ${bx - 60} ${topY}, ${bx} ${by}`;
    lx = (ax + bx) / 2;
    ly = topY + 16;
  } else if (Math.abs(ay - by) > 8) {
    // Step.
    const mx = (ax + bx) / 2;
    path = `M ${ax} ${ay} L ${mx} ${ay} L ${mx} ${by} L ${bx} ${by}`;
    // Label sits above the destination node's top, near the destination
    // side of the elbow — clear of the destination's body.
    lx = mx + (bx - mx) / 2;
    ly = to.y - 6;
  } else {
    path = `M ${ax} ${ay} L ${bx} ${by}`;
    // Label above the I/O band (not the container top), so labels on
    // edges between container nodes don't float far above the nodes.
    lx = (ax + bx) / 2;
    const fromTop = from.y;
    const toTop = to.y;
    ly = Math.min(fromTop, toTop) - 6;
  }

  let label = "";
  if (branch) {
    label = `<text class="edge-label branch-label" x="${lx}" y="${ly}" text-anchor="middle">${esc(branch)}</text>`;
  }
  return `
    <g>
      <path class="edge edge-control" d="${path}" marker-end="url(#arrow-control)" fill="none" />
      ${label}
    </g>`;
}

// ─── Build HTML ──────────────────────────────────────────────────────────
function buildHtml(topo: Topology): string {
  const oas = build.toOAS(topo) as unknown as OASTopology;
  const { placed, width, height } = layout(oas);
  const byId = new Map<string, Placed>();
  for (const p of placed) byId.set(p.id, p);

  dataLanes.clear();
  const rowTop = Math.min(...placed.map((p) => p.y));

  // Pairs of (from, to) that already have a control edge between them.
  // We use this to suppress redundant data-flow edges where the runner
  // would auto-thread the field anyway (and drawing both crowds the diagram).
  const controlPairs = new Set<string>();
  for (const e of oas.controlFlowConnections) {
    if (!isControlEdge(e)) continue;
    controlPairs.add(`${e.fromNode.$component_ref}->${e.toNode.$component_ref}`);
  }

  const edges: string[] = [];
  for (const e of oas.controlFlowConnections) {
    if (!isControlEdge(e)) continue;
    const a = byId.get(e.fromNode.$component_ref);
    const b = byId.get(e.toNode.$component_ref);
    if (!a || !b) continue;
    edges.push(renderControlEdge(a, b, e.fromBranch, branchInputOf(a), placed));
  }
  for (const e of oas.dataFlowConnections) {
    if (!isDataEdge(e)) continue;
    const a = byId.get(e.sourceNode.$component_ref);
    const b = byId.get(e.destinationNode.$component_ref);
    if (!a || !b) continue;
    // Skip data edges that duplicate an existing control hop. The
    // implicit field threading is already obvious from the control arrow.
    if (controlPairs.has(`${a.id}->${b.id}`)) continue;
    edges.push(renderDataEdge(a, e.sourceOutput, b, e.destinationInput, placed, rowTop));
  }

  const nodes = placed.map(renderNode).join("\n");

  const title = oas.name ?? oas.id ?? "topology";
  const subtitleParts = [
    oas.version ? `v${oas.version}` : null,
    oas.citation ?? null,
  ].filter(Boolean);

  // Extra headroom above for lofted edges (data lanes + control loft).
  const headroom = Math.max(40, 30 + dataLanes.size * 18);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)} — topology</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: #fafafa; color: #222; margin: 0; padding: 32px;
  }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px 0; }
  .sub-title { font-size: 13px; color: #666; margin-bottom: 24px; }
  svg { display: block; background: white; border: 1px solid #eee; border-radius: 8px; }

  text { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; fill: #1a1a1a; }

  /* Card */
  .node-body {
    fill: white;
    stroke: #d4d4d8;
    stroke-width: 1;
  }
  .node-body-BranchingNode { stroke: #e0a352; }
  .node-body-StartNode, .node-body-EndNode { stroke: #94a3b8; }

  /* Header band — colored only via fill, no separate clipping needed
     since the path is hand-shaped to be flat-bottomed. */
  .node-header { fill: #f8fafc; stroke: none; }
  .node-header-LlmNode { fill: #f1f5f9; }
  .node-header-BranchingNode { fill: #fff7ed; }
  .node-header-StartNode, .node-header-EndNode { fill: #eef2ff; }

  .header-divider { stroke: #e4e4e7; stroke-width: 1; }
  .col-divider { stroke: #e4e4e7; stroke-width: 1; stroke-dasharray: 2 3; }

  /* Container metadata (Map/ParallelMap/Catch/Flow/ParallelFlow strip) */
  .container-meta {
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #9a3412;
    font-style: italic;
  }

  /* Subflow panel + caption */
  .subflow-panel {
    fill: #fafafa;
    stroke: #d4d4d8;
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .subflow-caption {
    fill: #fff7ed;
    stroke: #fed7aa;
    stroke-width: 1;
  }
  .subflow-id {
    font-size: 11px;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #9a3412;
  }
  .subflow-citation {
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #b45309;
    font-style: italic;
  }

  /* Tools panel (AgentNode) */
  .tools-panel {
    fill: #f5f3ff;
    stroke: #c4b5fd;
    stroke-width: 1;
  }
  .tools-header {
    fill: #6d28d9;
  }
  .tool-sig {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #1e1b4b;
  }
  /* MCPToolBox row — slightly distinct so it doesn't look like a fake
     ServerTool with an empty signature. */
  .tool-box-sig {
    font-style: italic;
    fill: #4338ca;
  }
  .tool-desc {
    font-size: 10px;
    fill: #6b7280;
    font-style: italic;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  }

  /* Typography */
  .node-name {
    font-size: 13px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    fill: #18181b;
  }
  .node-sub {
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #71717a;
  }
  .section-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    fill: #a1a1aa;
    font-weight: 600;
  }

  .field-name {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #27272a;
  }
  .field-type {
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    fill: #71717a;
  }

  .port { fill: white; stroke: #64748b; stroke-width: 1.5; }
  .port-in  { fill: #f8fafc; stroke: #94a3b8; }
  .port-out { fill: #64748b; stroke: #475569; }

  /* Edges */
  .edge-control { stroke: #18181b; stroke-width: 1.5; }
  .edge-data { stroke: #a1a1aa; stroke-width: 1.2; stroke-dasharray: 3 3; }
  .edge-label {
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .branch-label { fill: #b45309; font-weight: 600; }
  .data-label { fill: #71717a; }
</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  ${subtitleParts.length > 0 ? `<div class="sub-title">${esc(subtitleParts.join(" — "))}</div>` : ""}

  <svg viewBox="0 ${-headroom} ${width} ${height + headroom}" width="${width}" height="${height + headroom}">
    <defs>
      <marker id="arrow-control" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
      </marker>
      <marker id="arrow-data" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
      </marker>
    </defs>
    ${edges.join("\n")}
    ${nodes}
  </svg>
</body>
</html>
`;
}

// ─── CLI entry point ─────────────────────────────────────────────────────
// Default: render ./full-featured.ts → ./full-featured.viz.html.
// Override: pass a path to any .ts whose default export is a Topology:
//   deno run -A full-featured.viz.ts viz-fixtures/agent-with-tools.ts
// The output HTML is written next to the source with `.viz.html` appended.
const argPath = Deno.args[0] ?? "./full-featured.ts";
const sourceUrl = new URL(argPath, import.meta.url);
const mod = await import(sourceUrl.href);
const topology = mod.default as Topology | undefined;
if (!topology) {
  console.error(`No default export found in ${sourceUrl.pathname} — expected a Topology.`);
  Deno.exit(1);
}

const html = buildHtml(topology);
// Output path: same dir as source, basename + ".viz.html".
const sourcePath = sourceUrl.pathname;
const basename = sourcePath.replace(/\.ts$/, "");
const outPath = new URL(basename + ".viz.html", "file://");
await Deno.writeTextFile(outPath, html);
console.log(`Wrote ${outPath.pathname}`);
