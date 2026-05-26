/**
 * JSON Graph Format (JGF) v2 import/export.
 *
 * Spec: https://github.com/jsongraph/json-graph-specification
 * Media type: application/vnd.jgf+json
 *
 * Validated with Zod against the JGF v2 JSON Schema.
 * Domain-specific fields live in node/edge metadata objects.
 */

import { z } from "zod";
import { validateDescriptionReferences } from "./description.ts";
import type {
  LayoutLeafNode,
  LayoutGroupNode,
  LayoutNode,
  LayoutEdge,
  VisualLeafNode,
  VisualGroupNode,
  VisualNode,
  ContainmentEdge,
  AssociationEdge,
  VisualEdge,
  ColorPalette,
  LegendItem,
  GraphReferences,
} from "./types.ts";

// ═══════════════════════════════════════════════════════════════════════════════
// JGF v2 SCHEMAS — matches json-graph-schema v2.0 exactly
// ═══════════════════════════════════════════════════════════════════════════════

const JGFNodeSchema = z.strictObject({
  label: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const JGFEdgeSchema = z.strictObject({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  relation: z.string().optional(),
  directed: z.boolean().optional(),
  label: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const JGFGraphSchema = z.strictObject({
  id: z.string().optional(),
  label: z.string().optional(),
  directed: z.boolean().optional(),
  type: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  nodes: z.record(z.string(), JGFNodeSchema).optional(),
  edges: z.array(JGFEdgeSchema).optional(),
});

const JGFDocumentSchema = z.strictObject({
  graph: JGFGraphSchema,
});

const JGFMultiDocumentSchema = z.strictObject({
  graphs: z.array(JGFGraphSchema),
});

// ─── Derived JGF types ──────────────────────────────────────────────────────

export type JGFNode = z.infer<typeof JGFNodeSchema>;
export type JGFEdge = z.infer<typeof JGFEdgeSchema>;
export type JGFGraph = z.infer<typeof JGFGraphSchema>;
export type JGFDocument = z.infer<typeof JGFDocumentSchema>;
export type JGFMultiDocument = z.infer<typeof JGFMultiDocumentSchema>;

export {
  JGFNodeSchema,
  JGFEdgeSchema,
  JGFGraphSchema,
  JGFDocumentSchema,
  JGFMultiDocumentSchema,
};

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL DOMAIN SCHEMAS — validate node/edge/graph metadata for rendering
// ═══════════════════════════════════════════════════════════════════════════════

const DescriptionSentenceSchema = z.strictObject({
  text: z.string().min(1),
  references: z.array(z.string()),
});

const BiblioEntrySchema = z.object({
  type: z.string().optional(),
  author: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  journal: z.string().optional(),
  volume: z.union([z.string(), z.number()]).optional(),
  number: z.union([z.string(), z.number()]).optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  pmid: z.union([z.string(), z.number()]).optional(),
  pmcid: z.string().optional(),
  url: z.string().optional(),
  date: z.string().optional(),
});

const GraphReferencesSchema = z.record(z.string(), BiblioEntrySchema);

const VisualLeafMetadataSchema = z.strictObject({
  kind: z.literal("leaf"),
  subtitle: z.string(),
  description: z.array(DescriptionSentenceSchema).min(1),
  layout: z.strictObject({
    width: z.number(),
    color: z.string(),
  }),
});

const VisualGroupMetadataSchema = z.strictObject({
  kind: z.literal("group"),
  description: z.array(DescriptionSentenceSchema).min(1),
  layout: z.strictObject({
    tier: z.number(),
    column: z.number(),
    columnSpan: z.number().optional(),
    padding: z.number(),
    nodeSpacing: z.number(),
  }),
});

const ContainmentEdgeMetadataSchema = z.strictObject({}).optional();

const AssociationEdgeMetadataSchema = z.strictObject({
  color: z.string(),
  label: z.string().optional(),
  style: z.union([z.literal("solid"), z.literal("dashed")]),
});

const ColorPaletteSchema = z.strictObject({
  fill: z.string(),
  stroke: z.string(),
  text: z.string(),
  subtitleText: z.string(),
});

const LegendItemSchema = z.strictObject({
  color: z.string(),
  label: z.string(),
});

const VisualGraphMetadataSchema = z.looseObject({
  colors: z.record(z.string(), ColorPaletteSchema),
  legendItems: z.array(LegendItemSchema),
  legendFooter: z.string().optional(),
  references: GraphReferencesSchema.optional().default({}),
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT (layout model → JGF)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert layout nodes and edges to a JGF document.
 *
 * Domain-specific fields beyond the base LayoutLeafNode/LayoutGroupNode
 * are preserved in each node's `metadata`. Same for edge fields beyond
 * source/target/relationship.
 */
export function toJGF<N extends LayoutNode, E extends LayoutEdge>({
  nodes,
  edges,
  graphId,
  graphLabel,
  graphMetadata,
}: {
  nodes: N[];
  edges: E[];
  graphId?: string;
  graphLabel?: string;
  graphMetadata?: Record<string, unknown>;
}): JGFDocument {
  const jgfNodes: Record<string, JGFNode> = {};

  for (const node of nodes) {
    const { id, label, kind, ...rest } = node;
    const metadata: Record<string, unknown> = { kind, ...rest };
    jgfNodes[id] = { label, metadata };
  }

  const jgfEdges: JGFEdge[] = edges.map((edge) => {
    const { source, target, relationship, ...rest } = edge;
    const jgfEdge: JGFEdge = { source, target, relation: relationship };
    if (Object.keys(rest).length > 0) {
      jgfEdge.metadata = rest;
    }
    return jgfEdge;
  });

  return {
    graph: {
      ...(graphId !== undefined && { id: graphId }),
      ...(graphLabel !== undefined && { label: graphLabel }),
      directed: true,
      ...(graphMetadata !== undefined && { metadata: graphMetadata }),
      nodes: jgfNodes,
      edges: jgfEdges,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT — generic (JGF → layout model)
// ═══════════════════════════════════════════════════════════════════════════════

/** Result of parsing a JGF document into layout types. */
export interface FromJGFResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  graphId?: string;
  graphLabel?: string;
  graphMetadata?: Record<string, unknown>;
}

/**
 * Parse a JGF document into layout nodes and edges.
 *
 * Validates the input against the JGF v2 schema via Zod.
 * Node metadata must contain `kind: "leaf" | "group"` to reconstruct
 * the discriminated union. Additional metadata fields are spread onto
 * the resulting node objects, so domain extensions survive the round-trip.
 */
export function fromJGF({ document }: { document: unknown }): FromJGFResult {
  const parsed = JGFDocumentSchema.parse(document);
  const graph = parsed.graph;
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  if (graph.nodes) {
    for (const [id, jgfNode] of Object.entries(graph.nodes)) {
      const metadata = jgfNode.metadata ?? {};
      const kind = metadata.kind;

      if (kind === "group") {
        const meta = metadata as Record<string, unknown>;
        const { kind: _k, layout: layoutMeta } = meta;
        const L =
          layoutMeta && typeof layoutMeta === "object" && layoutMeta !== null
            ? (layoutMeta as Record<string, unknown>)
            : {};
        nodes.push({
          id,
          label: jgfNode.label ?? id,
          kind: "group",
          layout: {
            tier: Number(L.tier ?? 0),
            column: Number(L.column ?? 0),
            columnSpan: L.columnSpan !== undefined ? Number(L.columnSpan) : 1,
            padding: Number(L.padding ?? 15),
            nodeSpacing: Number(L.nodeSpacing ?? 20),
          },
        });
      } else {
        const meta = metadata as Record<string, unknown>;
        const { kind: _k, layout: layoutMeta, subtitle } = meta;
        const L =
          layoutMeta && typeof layoutMeta === "object" && layoutMeta !== null
            ? (layoutMeta as Record<string, unknown>)
            : {};
        nodes.push({
          id,
          label: jgfNode.label ?? id,
          kind: "leaf",
          subtitle: typeof subtitle === "string" ? subtitle : "",
          layout: {
            width: Number(L.width ?? 80),
          },
        });
      }
    }
  }

  if (graph.edges) {
    for (const jgfEdge of graph.edges) {
      const relationship = jgfEdge.relation === "containment" ? "containment" : "association";
      const metadata = jgfEdge.metadata ?? {};
      edges.push({
        source: jgfEdge.source,
        target: jgfEdge.target,
        relationship,
        ...metadata,
      } as LayoutEdge);
    }
  }

  return {
    nodes,
    edges,
    graphId: graph.id,
    graphLabel: graph.label,
    graphMetadata: graph.metadata,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT — visual (JGF → visual model with full domain validation)
// ═══════════════════════════════════════════════════════════════════════════════

/** Result of parsing a visual JGF document. All fields are validated. */
export interface VisualJGFResult {
  nodes: VisualNode[];
  edges: VisualEdge[];
  colors: Record<string, ColorPalette>;
  legendItems: LegendItem[];
  legendFooter?: string;
  references: GraphReferences;
  graphId?: string;
  graphLabel?: string;
}

/**
 * Parse and validate a JGF document as a visual network graph.
 *
 * Validates:
 *   - JGF v2 structure
 *   - Leaf node metadata: kind, subtitle, description (sentences with citation keys), layout: { width, color }
 *   - Group node metadata: kind, description (sentences), layout: { tier, column, columnSpan?, padding, nodeSpacing }
 *   - Association edge metadata: color, style, label
 *   - Graph metadata: colors palette map, legendItems, legendFooter, references (BibTeX-like map), optional extra fields
 *
 * Throws a ZodError if validation fails.
 */
export function parseVisualJGF({ document }: { document: unknown }): VisualJGFResult {
  const parsed = JGFDocumentSchema.parse(document);
  const graph = parsed.graph;

  // Validate graph metadata
  const graphMeta = VisualGraphMetadataSchema.parse(graph.metadata ?? {});

  // Parse nodes
  const nodes: VisualNode[] = [];
  if (graph.nodes) {
    for (const [id, jgfNode] of Object.entries(graph.nodes)) {
      const metadata = jgfNode.metadata ?? {};
      const kind = metadata.kind;

      if (kind === "group") {
        const validated = VisualGroupMetadataSchema.parse(metadata);
        const { kind: _k, ...rest } = validated;
        const node: VisualGroupNode = {
          id,
          label: jgfNode.label ?? id,
          kind: "group",
          ...rest,
        };
        nodes.push(node);
      } else {
        const validated = VisualLeafMetadataSchema.parse(metadata);
        const { kind: _k, ...rest } = validated;
        const node: VisualLeafNode = {
          id,
          label: jgfNode.label ?? id,
          kind: "leaf",
          ...rest,
        };
        nodes.push(node);
      }
    }
  }

  // Parse edges
  const edges: VisualEdge[] = [];
  if (graph.edges) {
    for (const jgfEdge of graph.edges) {
      if (jgfEdge.relation === "containment") {
        const edge: ContainmentEdge = {
          source: jgfEdge.source,
          target: jgfEdge.target,
          relationship: "containment",
        };
        edges.push(edge);
      } else {
        const validated = AssociationEdgeMetadataSchema.parse(jgfEdge.metadata ?? {});
        const edge: AssociationEdge = {
          source: jgfEdge.source,
          target: jgfEdge.target,
          relationship: "association",
          color: validated.color,
          style: validated.style,
          ...(validated.label !== undefined && { label: validated.label }),
        };
        edges.push(edge);
      }
    }
  }

  const references = graphMeta.references;
  const refIssues = validateDescriptionReferences({ nodes, references });
  if (refIssues.length > 0) {
    throw new Error(`Description reference validation failed:\n${refIssues.join("\n")}`);
  }

  return {
    nodes,
    edges,
    colors: graphMeta.colors,
    legendItems: graphMeta.legendItems,
    legendFooter: graphMeta.legendFooter,
    references,
    graphId: graph.id,
    graphLabel: graph.label,
  };
}
