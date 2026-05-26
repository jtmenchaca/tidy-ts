// Open Agent Spec (OAS) JSON round-trip for our Topology.
//
// `toOAS(topology)` produces a plain JSON-serializable object whose shape
// matches Oracle's OAS camelCase serialization. `fromOAS(json)` reconstructs
// a Topology from that JSON.
//
// Scope and limitations:
//
//   - Zod schemas are emitted as JSON Schema via `z.toJSONSchema`. Going
//     back, JSON Schema becomes an opaque blob the runner does not use for
//     parsing — deserialized topologies can run, but they don't enforce
//     structured-output validation client-side (the API call's strict mode
//     still enforces shape server-side).
//   - Tool `execute` callbacks do not serialize. `fromOAS` produces tool
//     declarations (params/result shape) without an executable body, so a
//     deserialized topology that contains Agents-with-tools cannot run
//     until the caller re-attaches tool implementations.
//
// What does round-trip:
//   - Topology id/name/version/citation/description/metadata
//   - All node types (StartNode/EndNode/AgentNode/SandboxAgentNode/
//     MapNode/ParallelMapNode/ParallelFlowNode/BranchingNode/
//     CatchExceptionNode/FlowNode) including their componentType discriminator
//   - ControlFlowEdge + DataFlowEdge with all endpoints
//   - Per-node prompts, models, system prompts, mappings, reducers, concurrency
//   - Property[] inputs/outputs (already JSON-Schema-backed at runtime)

import { z } from "zod";
import type { Topology } from "./topology.ts";
import type { Property } from "./property.ts";
import type { ControlFlowEdge, DataFlowEdge } from "./edges.ts";
import type { LlmConfig } from "./llm-config.ts";

interface RuntimeNodeBase {
  id: string;
  name: string;
  componentType: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  branches?: string[];
  inputSchema?: z.ZodType;
  outputSchema?: z.ZodType;
  // node-type-specific fields used below
  llmConfig?: LlmConfig;
  systemPrompt?: string;
  promptTemplate?: string;
  systemPromptTemplate?: string;
  branchName?: string;
  mapping?: Record<string, string>;
  iterateOver?: string;
  reducers?: Record<string, string>;
  concurrency?: number;
  agent?: AgentValue | SandboxAgentValue;
  subflow?: Topology;
  subflows?: Topology[];
}

/** Sandbox-bearing agent value (parallel to AgentValue). Carries the
 *  same llmConfig / systemPromptTemplate / tools / toolboxes plus
 *  SDK-shaped `defaultManifest` / `capabilities` / `runAs`.
 *
 *  Round-trip caveats (see ADR-0004):
 *
 *  - `defaultManifest.entries` values are plain JSON discriminated by
 *    SDK's `type` field (`local_dir`, `git_repo`, `file`, etc.) and
 *    survive `JSON.stringify` cleanly.
 *  - `capabilities` are SDK Capability *class instances* (returned by
 *    `capability.filesystem()` etc.) and do not survive JSON
 *    serialization — they're dropped by `toOAS` and absent from
 *    `fromOAS`. Authors needing a re-attachable workflow wire the
 *    capabilities in code on the deserialized agent. */
interface SandboxAgentValue {
  id: string;
  name: string;
  componentType: "SandboxAgent";
  llmConfig: LlmConfig;
  systemPromptTemplate: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  inputSchema?: z.ZodType;
  outputSchema?: z.ZodType;
  // deno-lint-ignore no-explicit-any
  tools?: Array<Record<string, any>>;
  // deno-lint-ignore no-explicit-any
  toolboxes?: Array<Record<string, any>>;
  /** SDK ManifestInput. JSON-serializable entry values; class
   *  instances like `Manifest` itself are stringified by their own
   *  `ManifestInit` shape via the SDK's `cloneManifest`. */
  // deno-lint-ignore no-explicit-any
  defaultManifest?: any;
  /** SDK Capability class instances — dropped by toOAS, undefined
   *  after fromOAS. */
  // deno-lint-ignore no-explicit-any
  capabilities?: any[];
  runAs?: string;
}

interface AgentValue {
  id: string;
  name: string;
  componentType: "Agent";
  llmConfig: LlmConfig;
  systemPromptTemplate: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  inputSchema?: z.ZodType;
  outputSchema?: z.ZodType;
  /** Heterogeneous list of tool variants. Serializer dispatches on
   *  `componentType`. Server/Client tools may carry Zod schemas that
   *  get lowered to JSON Schema for the wire; Remote/Builtin/Mcp ride
   *  through structurally. */
  // deno-lint-ignore no-explicit-any
  tools?: Array<Record<string, any>>;
  /** MCPToolBox (and future toolbox variants) — same passthrough. */
  // deno-lint-ignore no-explicit-any
  toolboxes?: Array<Record<string, any>>;
}

// ── Serialization ────────────────────────────────────────────────────────

function schemaToJson(s: z.ZodType | undefined): Record<string, unknown> | undefined {
  if (!s) return undefined;
  return z.toJSONSchema(s) as Record<string, unknown>;
}

// deno-lint-ignore no-explicit-any
type RawTool = Record<string, any>;

/** Serialize one tool. Discriminated by `componentType`:
 *
 *    ServerTool / ClientTool — name, description, IO, paramsSchema +
 *      resultSchema (Zod → JSON Schema). ServerTool's `execute`
 *      callback is intentionally NOT serialized (functions aren't
 *      portable) — callers re-attach it after `fromOAS`.
 *    RemoteTool — every wire-shape field. Lossless.
 *    BuiltinTool — every wire-shape field. Lossless.
 *    McpTool — name, description, IO, and the embedded clientTransport
 *      union (also discriminated). Lossless. */
function serializeTool(t: RawTool): Record<string, unknown> {
  const componentType = t.componentType as string;
  const baseFields = {
    id: t.id,
    name: t.name,
    description: t.description,
    inputs: t.inputs ?? [],
    outputs: t.outputs ?? [],
    requiresConfirmation: t.requiresConfirmation ?? false,
  };
  switch (componentType) {
    case "ServerTool":
    case "ClientTool":
      return {
        componentType,
        ...baseFields,
        paramsSchema: schemaToJson(t.paramsSchema),
        resultSchema: schemaToJson(t.resultSchema),
      };
    case "RemoteTool":
      return {
        componentType: "RemoteTool",
        ...baseFields,
        url: t.url,
        httpMethod: t.httpMethod,
        apiSpecUri: t.apiSpecUri,
        data: t.data ?? {},
        queryParams: t.queryParams ?? {},
        headers: t.headers ?? {},
        sensitiveHeaders: t.sensitiveHeaders ?? {},
      };
    case "BuiltinTool":
      return {
        componentType: "BuiltinTool",
        ...baseFields,
        toolType: t.toolType,
        configuration: t.configuration,
        executorName: t.executorName,
        toolVersion: t.toolVersion,
      };
    case "MCPTool":
      return {
        componentType: "MCPTool",
        ...baseFields,
        // ClientTransport is a plain discriminated-union value; round-
        // trips losslessly. JSON.stringify can't serialize functions or
        // Buffers — both absent in the transport schemas — so this is
        // safe.
        clientTransport: t.clientTransport,
      };
    default:
      // Unknown tool kind — preserve verbatim so foreign types
      // survive a passthrough round-trip.
      return { ...t };
  }
}

/** Serialize a toolbox. Currently only MCPToolBox exists. */
function serializeToolbox(b: RawTool): Record<string, unknown> {
  return {
    componentType: b.componentType,
    id: b.id,
    name: b.name,
    description: b.description,
    clientTransport: b.clientTransport,
    toolFilter: b.toolFilter,
    requiresConfirmation: b.requiresConfirmation ?? false,
  };
}

function serializeAgent(a: AgentValue): Record<string, unknown> {
  return {
    componentType: "Agent",
    id: a.id,
    name: a.name,
    description: a.description,
    metadata: a.metadata ?? {},
    llmConfig: a.llmConfig,
    systemPromptTemplate: a.systemPromptTemplate,
    inputs: a.inputs ?? [],
    outputs: a.outputs ?? [],
    inputSchema: schemaToJson(a.inputSchema),
    outputSchema: schemaToJson(a.outputSchema),
    tools: (a.tools ?? []).map((t) => serializeTool(t as RawTool)),
    toolboxes: (a.toolboxes ?? []).map((b) => serializeToolbox(b as RawTool)),
  };
}

/** Serialize a SandboxAgent. Per ADR-0004 we use the SDK's shapes
 *  verbatim: `defaultManifest` and `runAs` survive JSON.stringify
 *  cleanly (manifest entries discriminate on `type` and carry plain
 *  string fields like `src` / `repo` / `content`). `capabilities`
 *  are SDK Capability *class instances* that JSON.stringify drops to
 *  empty objects — we omit them from the OAS payload entirely rather
 *  than emit a useless `{}` placeholder; authors re-attach in code
 *  after `fromOAS`. */
function serializeSandboxAgent(a: SandboxAgentValue): Record<string, unknown> {
  return {
    componentType: "SandboxAgent",
    id: a.id,
    name: a.name,
    description: a.description,
    metadata: a.metadata ?? {},
    llmConfig: a.llmConfig,
    systemPromptTemplate: a.systemPromptTemplate,
    inputs: a.inputs ?? [],
    outputs: a.outputs ?? [],
    inputSchema: schemaToJson(a.inputSchema),
    outputSchema: schemaToJson(a.outputSchema),
    tools: (a.tools ?? []).map((t) => serializeTool(t as RawTool)),
    toolboxes: (a.toolboxes ?? []).map((b) => serializeToolbox(b as RawTool)),
    defaultManifest: a.defaultManifest,
    runAs: a.runAs,
    // capabilities intentionally omitted — class instances, not JSON.
  };
}

function serializeNode(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const n = raw as unknown as RuntimeNodeBase;
  const base: Record<string, unknown> = {
    componentType: n.componentType,
    id: n.id,
    name: n.name,
    description: n.description,
    metadata: n.metadata ?? {},
    inputs: n.inputs ?? [],
    outputs: n.outputs ?? [],
    branches: n.branches ?? [],
  };
  // Schemas (StartNode/EndNode)
  if (n.inputSchema) base.inputSchema = schemaToJson(n.inputSchema);
  if (n.outputSchema) base.outputSchema = schemaToJson(n.outputSchema);

  // Node-type-specific fields
  switch (n.componentType) {
    case "AgentNode":
      if (n.agent) base.agent = serializeAgent(n.agent as AgentValue);
      break;
    case "SandboxAgentNode":
      if (n.agent) {
        base.agent = serializeSandboxAgent(n.agent as SandboxAgentValue);
      }
      break;
    case "BranchingNode":
      base.mapping = n.mapping ?? {};
      break;
    case "MapNode":
    case "ParallelMapNode":
      base.iterateOver = n.iterateOver;
      if (n.reducers) base.reducers = n.reducers;
      if (n.componentType === "ParallelMapNode" && n.concurrency !== undefined) {
        base.concurrency = n.concurrency;
      }
      if (n.subflow) base.subflow = serializeTopologyInner(n.subflow);
      break;
    case "ParallelFlowNode":
      if (n.concurrency !== undefined) base.concurrency = n.concurrency;
      if (n.subflows) base.subflows = n.subflows.map(serializeTopologyInner);
      break;
    case "CatchExceptionNode":
    case "FlowNode":
      if (n.subflow) base.subflow = serializeTopologyInner(n.subflow);
      break;
    case "EndNode":
      if (n.branchName) base.branchName = n.branchName;
      break;
  }

  return base;
}

function serializeEdge(
  edge: ControlFlowEdge | DataFlowEdge,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    componentType: edge.componentType,
    id: edge.id,
    name: edge.name,
    description: edge.description,
    metadata: edge.metadata ?? {},
  };
  if (edge.componentType === "ControlFlowEdge") {
    const e = edge as ControlFlowEdge;
    base.fromNode = { $component_ref: (e.fromNode as { id: string }).id };
    base.toNode = { $component_ref: (e.toNode as { id: string }).id };
    if (e.fromBranch) base.fromBranch = e.fromBranch;
  } else {
    const e = edge as DataFlowEdge;
    base.sourceNode = { $component_ref: (e.sourceNode as { id: string }).id };
    base.sourceOutput = e.sourceOutput;
    base.destinationNode = {
      $component_ref: (e.destinationNode as { id: string }).id,
    };
    base.destinationInput = e.destinationInput;
  }
  return base;
}

function serializeTopologyInner(t: Topology): Record<string, unknown> {
  return {
    componentType: "Topology",
    id: t.id,
    name: t.name,
    description: t.description,
    metadata: t.metadata ?? {},
    inputs: t.inputs ?? [],
    outputs: t.outputs ?? [],
    version: t.version,
    citation: t.citation,
    startNode: { $component_ref: (t.startNode as { id: string }).id },
    nodes: t.nodes.map(serializeNode),
    controlFlowConnections: t.controlFlowConnections.map(serializeEdge),
    dataFlowConnections: (t.dataFlowConnections ?? []).map(serializeEdge),
  };
}

/**
 * Serialize a Topology to OAS-compatible JSON. Returns a plain object; the
 * caller can `JSON.stringify` it.
 */
export function toOAS(topology: Topology): Record<string, unknown> {
  return {
    agentspecVersion: "0.1.0-tidyts",
    ...serializeTopologyInner(topology),
  };
}

// ── Deserialization ──────────────────────────────────────────────────────

// We don't reconstruct Zod schemas (Zod can't ingest arbitrary JSON Schema).
// We attach the JSON Schema as a passthrough field on the deserialized node;
// the runner accepts a missing inputSchema/outputSchema and skips client-side
// Zod validation in that case. (Server-side strict mode in the OpenAI call
// still enforces the structural-output shape.)

function deserializeProperty(json: Record<string, unknown>): Property {
  return Object.freeze({
    jsonSchema: (json.jsonSchema ?? {}) as Record<string, unknown>,
    title: (json.title ?? "") as string,
    description: json.description as string | undefined,
    default: json.default,
    type: json.type as string | string[] | undefined,
  });
}

function deserializeNode(
  json: Record<string, unknown>,
  topologyNodesById: Map<string, Record<string, unknown>>,
): Record<string, unknown> {
  const inputs = ((json.inputs ?? []) as Record<string, unknown>[]).map(deserializeProperty);
  const outputs = ((json.outputs ?? []) as Record<string, unknown>[]).map(deserializeProperty);

  const node: Record<string, unknown> = {
    componentType: json.componentType,
    id: json.id,
    name: json.name,
    description: json.description,
    metadata: json.metadata ?? {},
    inputs,
    outputs,
    branches: (json.branches ?? []) as string[],
  };

  // Preserve schemas as raw JSON Schema (no Zod reconstruction).
  if (json.inputSchema) node.inputSchemaJson = json.inputSchema;
  if (json.outputSchema) node.outputSchemaJson = json.outputSchema;

  switch (json.componentType) {
    case "AgentNode":
      if (json.agent) {
        node.agent = deserializeAgent(json.agent as Record<string, unknown>);
      }
      break;
    case "SandboxAgentNode":
      if (json.agent) {
        node.agent = deserializeSandboxAgent(
          json.agent as Record<string, unknown>,
        );
      }
      break;
    case "BranchingNode":
      node.mapping = json.mapping ?? {};
      break;
    case "MapNode":
    case "ParallelMapNode":
      node.iterateOver = json.iterateOver;
      if (json.reducers) node.reducers = json.reducers;
      if (json.concurrency !== undefined) node.concurrency = json.concurrency;
      if (json.subflow) {
        node.subflow = deserializeTopologyInner(json.subflow as Record<string, unknown>);
      }
      break;
    case "ParallelFlowNode":
      if (json.concurrency !== undefined) node.concurrency = json.concurrency;
      if (json.subflows) {
        node.subflows = (json.subflows as Record<string, unknown>[]).map(
          deserializeTopologyInner,
        );
      }
      break;
    case "CatchExceptionNode":
    case "FlowNode":
      if (json.subflow) {
        node.subflow = deserializeTopologyInner(json.subflow as Record<string, unknown>);
      }
      break;
    case "EndNode":
      if (json.branchName) node.branchName = json.branchName;
      break;
  }

  topologyNodesById.set(node.id as string, node);
  return Object.freeze(node);
}

function deserializeAgent(json: Record<string, unknown>): Record<string, unknown> {
  return Object.freeze({
    componentType: "Agent",
    id: json.id,
    name: json.name,
    description: json.description,
    metadata: json.metadata ?? {},
    llmConfig: json.llmConfig,
    systemPromptTemplate: json.systemPromptTemplate,
    inputs: ((json.inputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    outputs: ((json.outputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    inputSchemaJson: json.inputSchema,
    outputSchemaJson: json.outputSchema,
    tools: ((json.tools ?? []) as Record<string, unknown>[]).map(deserializeTool),
    toolboxes: ((json.toolboxes ?? []) as Record<string, unknown>[]).map(deserializeToolbox),
  });
}

/** Deserialize a SandboxAgent. Per ADR-0004:
 *
 *  - `defaultManifest` rides through verbatim — its entries are
 *    SDK-shaped JSON values keyed by `type`, and the bridge hands
 *    them to the SDK `SandboxAgent` constructor unchanged.
 *  - `capabilities` was never serialized (class instances). The
 *    deserialized value carries `capabilities: undefined` — authors
 *    re-attach via `defaultManifest`-time code if they need to
 *    re-execute.
 *  - `runAs` is a string, rides through verbatim. */
function deserializeSandboxAgent(
  json: Record<string, unknown>,
): Record<string, unknown> {
  return Object.freeze({
    componentType: "SandboxAgent",
    id: json.id,
    name: json.name,
    description: json.description,
    metadata: json.metadata ?? {},
    llmConfig: json.llmConfig,
    systemPromptTemplate: json.systemPromptTemplate,
    inputs: ((json.inputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    outputs: ((json.outputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    inputSchemaJson: json.inputSchema,
    outputSchemaJson: json.outputSchema,
    tools: ((json.tools ?? []) as Record<string, unknown>[]).map(deserializeTool),
    toolboxes: ((json.toolboxes ?? []) as Record<string, unknown>[]).map(deserializeToolbox),
    defaultManifest: json.defaultManifest,
    capabilities: undefined,
    runAs: json.runAs,
  });
}

/** Deserialize one tool. Schema lossiness:
 *   - ServerTool / ClientTool: Zod schemas reconstitute as JSON Schema
 *     blobs under `paramsSchemaJson` / `resultSchemaJson`. Client-side
 *     re-validation is skipped at run time (the API's strict mode still
 *     enforces shape server-side for ServerTool/ClientTool function
 *     entries).
 *   - ServerTool: `execute` is irretrievable. We stub a throwing
 *     callback so the deserialized topology compiles, but actually
 *     invoking it throws with a clear "re-attach" message.
 *   - RemoteTool / BuiltinTool / McpTool: every field round-trips
 *     losslessly (no Zod, no functions). */
function deserializeTool(t: Record<string, unknown>): Record<string, unknown> {
  const componentType = t.componentType as string;
  const base = {
    componentType,
    id: t.id,
    name: t.name,
    description: t.description,
    inputs: ((t.inputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    outputs: ((t.outputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    requiresConfirmation: t.requiresConfirmation ?? false,
  };
  switch (componentType) {
    case "ServerTool":
      return Object.freeze({
        ...base,
        paramsSchemaJson: t.paramsSchema,
        resultSchemaJson: t.resultSchema,
        execute: () => {
          throw new Error(
            `ServerTool '${t.name}' was deserialized from OAS JSON; execute() must be re-attached before this topology can run.`,
          );
        },
      });
    case "ClientTool":
      return Object.freeze({
        ...base,
        paramsSchemaJson: t.paramsSchema,
        resultSchemaJson: t.resultSchema,
      });
    case "RemoteTool":
      return Object.freeze({
        ...base,
        url: t.url,
        httpMethod: t.httpMethod,
        apiSpecUri: t.apiSpecUri,
        data: t.data ?? {},
        queryParams: t.queryParams ?? {},
        headers: t.headers ?? {},
        sensitiveHeaders: t.sensitiveHeaders ?? {},
      });
    case "BuiltinTool":
      return Object.freeze({
        ...base,
        toolType: t.toolType,
        configuration: t.configuration,
        executorName: t.executorName,
        toolVersion: t.toolVersion,
      });
    case "MCPTool":
      return Object.freeze({
        ...base,
        clientTransport: t.clientTransport,
      });
    default:
      return Object.freeze({ ...t });
  }
}

function deserializeToolbox(b: Record<string, unknown>): Record<string, unknown> {
  return Object.freeze({
    componentType: b.componentType,
    id: b.id,
    name: b.name,
    description: b.description,
    clientTransport: b.clientTransport,
    toolFilter: b.toolFilter,
    requiresConfirmation: b.requiresConfirmation ?? false,
  });
}

function deserializeEdge(
  json: Record<string, unknown>,
  nodesById: Map<string, Record<string, unknown>>,
): Record<string, unknown> {
  const resolveRef = (ref: unknown): Record<string, unknown> => {
    if (ref && typeof ref === "object" && "$component_ref" in ref) {
      const id = (ref as { $component_ref: string }).$component_ref;
      const node = nodesById.get(id);
      if (!node) throw new Error(`Edge references unknown node '${id}'.`);
      return node;
    }
    return ref as Record<string, unknown>;
  };

  if (json.componentType === "ControlFlowEdge") {
    return Object.freeze({
      componentType: "ControlFlowEdge",
      id: json.id,
      name: json.name,
      description: json.description,
      metadata: json.metadata ?? {},
      fromNode: resolveRef(json.fromNode),
      toNode: resolveRef(json.toNode),
      fromBranch: json.fromBranch,
    });
  }
  return Object.freeze({
    componentType: "DataFlowEdge",
    id: json.id,
    name: json.name,
    description: json.description,
    metadata: json.metadata ?? {},
    sourceNode: resolveRef(json.sourceNode),
    sourceOutput: json.sourceOutput,
    destinationNode: resolveRef(json.destinationNode),
    destinationInput: json.destinationInput,
  });
}

function deserializeTopologyInner(json: Record<string, unknown>): Topology {
  const nodesById = new Map<string, Record<string, unknown>>();
  const nodes = (json.nodes as Record<string, unknown>[]).map((n) =>
    deserializeNode(n, nodesById)
  );

  const resolveStartRef = (ref: unknown): Record<string, unknown> => {
    if (ref && typeof ref === "object" && "$component_ref" in ref) {
      const id = (ref as { $component_ref: string }).$component_ref;
      const node = nodesById.get(id);
      if (!node) throw new Error(`Topology references unknown start node '${id}'.`);
      return node;
    }
    return ref as Record<string, unknown>;
  };

  const controlFlowConnections = ((json.controlFlowConnections ?? []) as Record<string, unknown>[])
    .map((e) => deserializeEdge(e, nodesById));
  const dataFlowConnections = ((json.dataFlowConnections ?? []) as Record<string, unknown>[])
    .map((e) => deserializeEdge(e, nodesById));

  return Object.freeze({
    componentType: "Topology",
    id: json.id,
    name: json.name,
    description: json.description,
    metadata: json.metadata ?? {},
    inputs: ((json.inputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    outputs: ((json.outputs ?? []) as Record<string, unknown>[]).map(deserializeProperty),
    version: json.version,
    citation: json.citation,
    startNode: resolveStartRef(json.startNode),
    nodes,
    controlFlowConnections,
    dataFlowConnections,
  }) as unknown as Topology;
}

/**
 * Deserialize an OAS JSON object (the result of `toOAS`) back into a Topology.
 *
 * Note: Zod schemas are NOT reconstructed — they are preserved as JSON Schema
 * blobs under `*SchemaJson` fields. Deserialized topologies can run, but
 * client-side Zod parsing is skipped (server-side strict JSON-Schema mode
 * in the OpenAI call still enforces structural output).
 */
export function fromOAS(json: Record<string, unknown>): Topology {
  return deserializeTopologyInner(json);
}
