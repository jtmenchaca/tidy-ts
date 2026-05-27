// validateTopology — structural / static-analysis checks on an authored
// Topology, beyond what createTopology already enforces.
//
// Purpose: catch misconfigurations before an LLM call burns money.
//
// Issues caught:
//   - Unreachable nodes (no control-flow path from Start)
//   - Dangling data-flow edges (already runtime-checked, but reported as a list)
//   - Prompt placeholders that don't match the node's input keys
//   - Type mismatches across data-flow-connected Zod schemas
//   - BranchingNode mapping values without matching outgoing fromBranch
//   - CatchExceptionNode missing the "next" or "caught_exception_branch" edge

import type { Topology } from "./topology.ts";
import { DISPATCHABLE_NODE_TYPES } from "./node-union.ts";
import { extractPromptPlaceholders } from "./template.ts";

export interface TopologyIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodeName?: string;
  edgeName?: string;
}

interface NodeShape {
  id: string;
  name: string;
  componentType: string;
  inputs?: Array<{
    title: string;
    jsonSchema?: Record<string, unknown>;
    default?: unknown;
  }>;
  outputs?: Array<{ title: string; jsonSchema?: Record<string, unknown> }>;
  systemPromptTemplate?: string;
  agent?: NodeShape;
  mapping?: Record<string, string>;
  subflow?: { nodes?: Record<string, unknown>[] };
  branches?: string[];
}

function asNode(n: Record<string, unknown>): NodeShape {
  return n as unknown as NodeShape;
}

function propertyTitlesOf(n: NodeShape, side: "inputs" | "outputs"): Set<string> {
  const list = n[side] ?? [];
  return new Set(list.map((p) => p.title));
}

/** Walk control edges from start; mark reachable node ids. */
function reachableNodeIds(topology: Topology): Set<string> {
  const reachable = new Set<string>();
  const startId = (topology.startNode as { id: string }).id;
  const stack: string[] = [startId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const edge of topology.controlFlowConnections) {
      if ((edge.fromNode as { id: string }).id === id) {
        const toId = (edge.toNode as { id: string }).id;
        if (!reachable.has(toId)) stack.push(toId);
      }
    }
  }
  return reachable;
}

function jsonSchemaTypeOf(prop: { jsonSchema?: Record<string, unknown> } | undefined): string | undefined {
  if (!prop) return undefined;
  const t = prop.jsonSchema?.type;
  if (typeof t === "string") return t;
  return undefined;
}

/** Subflow-bearing nodes carry a nested Topology (FlowNode, MapNode,
 *  ParallelMapNode, CatchExceptionNode) or an array of them
 *  (ParallelFlowNode). Return them in `(prefix, subflow)` pairs so the
 *  recursive `validateTopology` call can tag each subflow's issues with
 *  the path back to the outer topology. */
function subflowsOf(n: NodeShape): Array<{ prefix: string; subflow: Topology }> {
  const out: Array<{ prefix: string; subflow: Topology }> = [];
  // Single-subflow node types.
  if (n.componentType === "FlowNode" ||
      n.componentType === "MapNode" ||
      n.componentType === "ParallelMapNode" ||
      n.componentType === "CatchExceptionNode") {
    const sf = (n as unknown as { subflow?: Topology }).subflow;
    if (sf && typeof sf === "object" && "nodes" in sf) {
      out.push({ prefix: n.name, subflow: sf });
    }
    return out;
  }
  // ParallelFlowNode carries an array. Use the same `parent[i:subName]`
  // grammar as `Provenance.cachedNodes`.
  if (n.componentType === "ParallelFlowNode") {
    const subflows = (n as unknown as { subflows?: Topology[] }).subflows ?? [];
    subflows.forEach((sf, i) => {
      if (sf && typeof sf === "object" && "nodes" in sf) {
        out.push({ prefix: `${n.name}[${i}:${sf.name ?? ""}]`, subflow: sf });
      }
    });
  }
  return out;
}

export function validateTopology(topology: Topology): TopologyIssue[] {
  const issues = validateTopologyAt(topology, "");
  return issues;
}

function tagWithPrefix(issue: TopologyIssue, prefix: string): TopologyIssue {
  if (!prefix) return issue;
  return {
    ...issue,
    message: `[subflow '${prefix}'] ${issue.message}`,
    nodeName: issue.nodeName ? `${prefix}.${issue.nodeName}` : issue.nodeName,
    edgeName: issue.edgeName ? `${prefix}.${issue.edgeName}` : issue.edgeName,
  };
}

function validateTopologyAt(topology: Topology, prefix: string): TopologyIssue[] {
  const issues: TopologyIssue[] = [];
  const nodes = topology.nodes.map(asNode);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // 0. Duplicate node names. Names key per-call generation overrides
  //    (`evaluate({ overrides })`), so duplicates make the override
  //    routing ambiguous. Also makes test/diagnostic output unreadable.
  const nameSeen = new Map<string, number>();
  for (const n of nodes) {
    nameSeen.set(n.name, (nameSeen.get(n.name) ?? 0) + 1);
  }
  for (const [name, count] of nameSeen) {
    if (count > 1) {
      issues.push({
        severity: "error",
        code: "duplicate-node-name",
        message:
          `Topology has ${count} nodes named '${name}'. Node names must be unique within a topology.`,
        nodeName: name,
      });
    }
  }

  // 0b. Node names with `.` collide with the subflow-path separator used
  //     by `Provenance.cachedNodes` (`parentFlow.childNode`). A node
  //     named `foo.bar` becomes indistinguishable from a node `bar`
  //     nested in a `foo` subflow. Reject at authoring time.
  for (const n of nodes) {
    if (n.name.includes(".")) {
      issues.push({
        severity: "error",
        code: "node-name-contains-dot",
        message:
          `Node '${n.name}' contains a '.'. Names are used as subflow path segments in Provenance.cachedNodes; dots would make those paths ambiguous.`,
        nodeName: n.name,
      });
    }
  }

  // 0c. Every node must have a `componentType` the runner can dispatch on.
  //     TopologySchema's NodeRefSchema is `z.record(string, unknown)` (it
  //     can't structurally validate overlay fields — see node-union.ts),
  //     so this check catches the case the schema can't.
  for (const n of nodes) {
    if (!n.componentType || !DISPATCHABLE_NODE_TYPES.has(n.componentType)) {
      issues.push({
        severity: "error",
        code: "unknown-component-type",
        message: n.componentType
          ? `Node '${n.name}' has unknown componentType '${n.componentType}'. Expected one of: ${[...DISPATCHABLE_NODE_TYPES].sort().join(", ")}.`
          : `Node '${n.name}' is missing a componentType.`,
        nodeName: n.name,
      });
    }
  }

  // 1. Unreachable nodes
  const reachable = reachableNodeIds(topology);
  for (const n of nodes) {
    if (!reachable.has(n.id)) {
      issues.push({
        severity: "error",
        code: "unreachable-node",
        message: `Node '${n.name}' has no control-flow path from the StartNode.`,
        nodeName: n.name,
      });
    }
  }

  // 2. Dangling data-flow edges
  for (const edge of topology.dataFlowConnections ?? []) {
    const src = byId.get((edge.sourceNode as { id: string }).id);
    const dst = byId.get((edge.destinationNode as { id: string }).id);
    if (src) {
      const titles = propertyTitlesOf(src, "outputs");
      if (!titles.has(edge.sourceOutput)) {
        issues.push({
          severity: "error",
          code: "missing-source-output",
          message: `Data edge '${edge.name}' references output '${edge.sourceOutput}' on node '${src.name}', which has no such output.`,
          edgeName: edge.name,
        });
      }
    }
    if (dst) {
      const titles = propertyTitlesOf(dst, "inputs");
      if (!titles.has(edge.destinationInput)) {
        issues.push({
          severity: "error",
          code: "missing-destination-input",
          message: `Data edge '${edge.name}' references input '${edge.destinationInput}' on node '${dst.name}', which has no such input.`,
          edgeName: edge.name,
        });
      }
    }
  }

  // 2b. Required inputs on non-Start nodes without an incoming data edge.
  //     Every declared input must be wired by an explicit dataFlowEdge,
  //     unless the property carries a `default`. There is no implicit
  //     pass-through from the prior node.
  const startId = (topology.startNode as { id: string }).id;
  const incomingByDest = new Map<string, Set<string>>();
  for (const edge of topology.dataFlowConnections ?? []) {
    const dstId = (edge.destinationNode as { id: string }).id;
    let titles = incomingByDest.get(dstId);
    if (!titles) {
      titles = new Set<string>();
      incomingByDest.set(dstId, titles);
    }
    titles.add(edge.destinationInput);
  }
  for (const n of nodes) {
    if (n.id === startId) continue;
    const wired = incomingByDest.get(n.id) ?? new Set<string>();
    for (const input of n.inputs ?? []) {
      if (wired.has(input.title)) continue;
      if (input.default !== undefined) continue;
      const jsDefault = input.jsonSchema?.default;
      if (jsDefault !== undefined) continue;
      issues.push({
        severity: "error",
        code: "unwired-input",
        message:
          `Node '${n.name}' input '${input.title}' has no incoming dataFlowEdge. ` +
          `Every required input must be wired explicitly (no implicit pass-through).`,
        nodeName: n.name,
      });
    }
  }

  // 3. Prompt placeholders that don't match input keys
  for (const n of nodes) {
    const templates: Array<{ field: string; template: string }> = [];
    if (n.systemPromptTemplate) {
      templates.push({ field: "systemPromptTemplate", template: n.systemPromptTemplate });
    }
    if (n.agent?.systemPromptTemplate) {
      templates.push({ field: "agent.systemPromptTemplate", template: n.agent.systemPromptTemplate });
    }
    if (templates.length === 0) continue;

    // For nodes whose inputs come from the agent (AgentNode /
    // SandboxAgentNode), check the agent's inputs.
    const inputTitles = (n.componentType === "AgentNode" ||
        n.componentType === "SandboxAgentNode") && n.agent
      ? propertyTitlesOf(n.agent, "inputs")
      : propertyTitlesOf(n, "inputs");

    for (const { field, template } of templates) {
      const placeholders = extractPromptPlaceholders(template);
      for (const p of placeholders) {
        if (!inputTitles.has(p)) {
          issues.push({
            severity: "error",
            code: "missing-prompt-placeholder",
            message:
              `Node '${n.name}' ${field} references '{{${p}}}' but '${p}' is not in the node's inputs.`,
            nodeName: n.name,
          });
        }
      }
    }
  }

  // 4. Type mismatches across data-flow-connected JSON-Schema types
  for (const edge of topology.dataFlowConnections ?? []) {
    const src = byId.get((edge.sourceNode as { id: string }).id);
    const dst = byId.get((edge.destinationNode as { id: string }).id);
    if (!src || !dst) continue;
    const srcProp = src.outputs?.find((p) => p.title === edge.sourceOutput);
    const dstProp = dst.inputs?.find((p) => p.title === edge.destinationInput);
    if (!srcProp || !dstProp) continue; // already reported above
    const srcType = jsonSchemaTypeOf(srcProp);
    const dstType = jsonSchemaTypeOf(dstProp);
    if (srcType && dstType && srcType !== dstType) {
      // Allow integer→number widening.
      const numericLike = new Set(["integer", "number"]);
      if (!(numericLike.has(srcType) && numericLike.has(dstType))) {
        issues.push({
          severity: "warning",
          code: "type-mismatch",
          message:
            `Data edge '${edge.name}': '${src.name}.${edge.sourceOutput}' (type '${srcType}') feeds '${dst.name}.${edge.destinationInput}' (type '${dstType}').`,
          edgeName: edge.name,
        });
      }
    }
  }

  // 5. BranchingNode coverage
  for (const n of nodes) {
    if (n.componentType !== "BranchingNode") continue;
    if (!n.mapping) continue;
    const declaredBranches = new Set(Object.values(n.mapping));
    const outEdges = topology.controlFlowConnections.filter(
      (e) => (e.fromNode as { id: string }).id === n.id,
    );
    const edgeBranches = new Set(outEdges.map((e) => e.fromBranch).filter((b): b is string => !!b));
    const hasDefault = edgeBranches.has("default") ||
      outEdges.some((e) => !e.fromBranch);
    for (const b of declaredBranches) {
      if (!edgeBranches.has(b) && !hasDefault) {
        issues.push({
          severity: "warning",
          code: "branching-missing-edge",
          message:
            `BranchingNode '${n.name}' maps to branch '${b}', but no outgoing control-flow edge has fromBranch='${b}' (and no default edge exists).`,
          nodeName: n.name,
        });
      }
    }
  }

  // 5b. Agent tool / toolbox invariants. Catches misconfigurations that
  //     would otherwise surface as opaque LLM 400s or a runtime panic
  //     after the first row of a 10k-row eval.
  for (const n of nodes) {
    if (
      n.componentType !== "AgentNode" &&
      n.componentType !== "SandboxAgentNode"
    ) continue;
    const agent = n.agent;
    if (!agent) continue;
    const tools = (agent as unknown as { tools?: Array<Record<string, unknown>> })
      .tools ?? [];
    const toolboxes =
      (agent as unknown as { toolboxes?: Array<Record<string, unknown>> })
        .toolboxes ?? [];

    // 5b.1: duplicate tool names within an agent. The Agents SDK keys
    // its dispatch on tool name; duplicates make routing ambiguous.
    const seenToolNames = new Map<string, number>();
    for (const t of tools) {
      const name = t.name as string;
      seenToolNames.set(name, (seenToolNames.get(name) ?? 0) + 1);
    }
    for (const [tname, count] of seenToolNames) {
      if (count > 1) {
        issues.push({
          severity: "error",
          code: "duplicate-tool-name",
          message:
            `${n.componentType} '${n.name}' has ${count} tools named '${tname}'. Tool names must be unique within an agent.`,
          nodeName: n.name,
        });
      }
    }

    // BuiltinTool / Responses-API gating used to live here. It moved
    // into the Agents SDK: hosted tools route through the SDK's
    // Responses-API path automatically when the provider supports
    // them, and the SDK surfaces a clean error otherwise. We no longer
    // gate at authoring time.

    // 5b.3: RemoteTool URL must include at least one placeholder OR
    // the tool must have explicitly-declared inputs. Otherwise the
    // model has no parameters to fill and the OAS-style call collapses.
    for (const t of tools) {
      if (t.componentType !== "RemoteTool") continue;
      const url = (t.url as string) ?? "";
      const declaredInputs = (t.inputs as Array<unknown> | undefined) ?? [];
      const hasPlaceholder = /\{\{\s*[a-zA-Z_$][\w$]*\s*\}\}/.test(url);
      if (!hasPlaceholder && declaredInputs.length === 0) {
        issues.push({
          severity: "warning",
          code: "remote-tool-no-inputs",
          message:
            `RemoteTool '${t.name}' on agent '${n.name}' has no '{{placeholder}}' in its url and no inputs declared. The model will have nothing to parameterize the call with.`,
          nodeName: n.name,
        });
      }
    }

    // 5b.4: McpTool / MCPToolBox transport must point at something.
    // For stdio: command non-empty. For HTTP: url non-empty. Catches a
    // common typo (empty string defaulting through).
    const transportFor = (entry: Record<string, unknown>) =>
      entry.clientTransport as
        | { componentType?: string; command?: string; url?: string }
        | undefined;
    for (const t of tools) {
      if (t.componentType !== "MCPTool") continue;
      const tr = transportFor(t);
      if (!tr) {
        issues.push({
          severity: "error",
          code: "mcp-tool-missing-transport",
          message: `McpTool '${t.name}' on agent '${n.name}' has no clientTransport.`,
          nodeName: n.name,
        });
        continue;
      }
      if (tr.componentType === "StdioTransport" && !tr.command) {
        issues.push({
          severity: "error",
          code: "mcp-stdio-transport-missing-command",
          message: `McpTool '${t.name}' on agent '${n.name}' uses StdioTransport with an empty command.`,
          nodeName: n.name,
        });
      }
      if (
        tr.componentType !== undefined &&
        tr.componentType !== "StdioTransport" &&
        !tr.url
      ) {
        issues.push({
          severity: "error",
          code: "mcp-http-transport-missing-url",
          message: `McpTool '${t.name}' on agent '${n.name}' uses ${tr.componentType} with an empty url.`,
          nodeName: n.name,
        });
      }
    }
    for (const box of toolboxes) {
      const tr = transportFor(box);
      if (!tr) {
        issues.push({
          severity: "error",
          code: "toolbox-missing-transport",
          message: `Toolbox '${box.name as string}' on agent '${n.name}' has no clientTransport.`,
          nodeName: n.name,
        });
        continue;
      }
      if (tr.componentType === "StdioTransport" && !tr.command) {
        issues.push({
          severity: "error",
          code: "toolbox-stdio-missing-command",
          message: `Toolbox '${box.name as string}' on agent '${n.name}' uses StdioTransport with an empty command.`,
          nodeName: n.name,
        });
      }
      if (
        tr.componentType !== undefined &&
        tr.componentType !== "StdioTransport" &&
        !tr.url
      ) {
        issues.push({
          severity: "error",
          code: "toolbox-http-missing-url",
          message: `Toolbox '${box.name as string}' on agent '${n.name}' uses ${tr.componentType} with an empty url.`,
          nodeName: n.name,
        });
      }
    }
  }

  // 6. CatchExceptionNode branch coverage
  for (const n of nodes) {
    if (n.componentType !== "CatchExceptionNode") continue;
    const outEdges = topology.controlFlowConnections.filter(
      (e) => (e.fromNode as { id: string }).id === n.id,
    );
    const branches = new Set(outEdges.map((e) => e.fromBranch).filter((b): b is string => !!b));
    for (const required of ["next", "caught_exception_branch"]) {
      if (!branches.has(required)) {
        issues.push({
          severity: "error",
          code: "catch-missing-branch",
          message:
            `CatchExceptionNode '${n.name}' is missing an outgoing edge with fromBranch='${required}'.`,
          nodeName: n.name,
        });
      }
    }
  }

  // 7. Recurse into every subflow. A misconfigured nested topology is
  //    just as fatal as a misconfigured top-level one, and surfacing it
  //    at the first authoring-time validation is the whole point of
  //    `validateTopology`. Issues from subflows are prefixed with the
  //    parent's `node.name` (`ParallelFlowNode` uses the indexed
  //    grammar `parent[i:subName]`, matching `Provenance.cachedNodes`).
  const prefixed = prefix ? issues.map((i) => tagWithPrefix(i, prefix)) : issues;
  const out: TopologyIssue[] = [...prefixed];
  for (const n of nodes) {
    for (const { prefix: childPrefix, subflow } of subflowsOf(n)) {
      const full = prefix ? `${prefix}.${childPrefix}` : childPrefix;
      out.push(...validateTopologyAt(subflow, full));
    }
  }
  return out;
}
