/**
 * Core types for process mining algorithms
 * Based on standard process mining concepts and XES format
 */

// ---------- Models ----------
export type Activity = string;

// XES attribute types
export type XESAttributeValue = string | number | boolean | Date | undefined;
export type XESAttributes = Record<string, XESAttributeValue>;

export interface PetriNet {
  places: string[];
  transitions: Array<{
    id: string;
    label?: Activity; // visible if defined; invisible otherwise
    invisible?: boolean;
  }>;
  arcs: Array<{ source: string; target: string }>; // place<->transition
  initialMarking?: Record<string, number>; // place -> token count
  finalMarking?: Record<string, number>;
}

export type Operator = "seq" | "xor" | "and" | "loop";
export interface ProcessTree {
  op?: Operator; // internal node
  label?: Activity; // leaf = activity
  children?: ProcessTree[];
}

// ---------- Directly-Follows Graph ----------
export interface DFGEdge {
  from: Activity;
  to: Activity;
  frequency: number;
}

export interface DFG {
  activities: Set<Activity>;
  edges: Map<string, DFGEdge>; // key: "from->to"
  startActivities: Map<Activity, number>;
  endActivities: Map<Activity, number>;
}

// ---------- Quality ----------
export interface ModelQuality {
  fitness?: number;
  precision?: number;
  generalization?: number;
  simplicity?: number;
}

// ---------- Discovery ----------
export interface DiscoveryOptions {
  // Inductive Miner:
  noiseThresholdIMf?: number; // [0..1], for IMf
  // Split Miner:
  dfFilterPercentile?: number; // pruning strength
  gatewayProbThreshold?: number; // split/merge detection
}

export interface DiscoveryResult {
  model: ProcessTree | PetriNet;
  toPetriNet?: PetriNet; // convenience conversion if model is a tree
  quality?: ModelQuality;
}

// ---------- Conformance ----------
export interface TokenCounters {
  produced: number;
  consumed: number;
  missing: number;
  remaining: number;
}

export interface AlignmentMove {
  // log/model moves
  logActivity?: Activity; // move on log
  modelTransitionId?: string; // move on model
  synchronous?: boolean; // matched?
  cost: number;
}

export interface Alignment {
  traceId: string;
  cost: number;
  moves: AlignmentMove[];
}

export interface ConformanceOptions {
  // Token Replay
  penalizeInvisible?: boolean;
  // Alignments (A*)
  moveOnLogCost?: number;
  moveOnModelCost?: number;
  heuristicWeight?: number; // A* weight for admissible heuristic
  maxStates?: number; // pruning
}

export interface ConformanceResult {
  fitness: number; // e.g., 1 - (sum costs / max possible)
  diagnostics?: {
    token?: Record<string, TokenCounters>; // per-trace or aggregated
  };
  alignments?: Alignment[]; // when using A*
}

// ---------- Enhancement / Performance ----------
export interface NodePerf {
  count: number;
  serviceTimeStats?: { avg: number; p50: number; p90: number; p99: number };
  waitTimeStats?: { avg: number; p50: number; p90: number; p99: number };
}

export interface ArcPerf {
  count: number;
  lagStats?: { avg: number; p50: number; p90: number; p99: number };
}

export interface PerformanceAnnotation {
  node: Record<string, NodePerf>; // keyed by transitionId or activity
  arc: Record<string, ArcPerf>; // keyed by source->target
}

export interface SpectrumSegment {
  fromActivity: Activity;
  toActivity: Activity;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  caseId: string;
}

export interface PerformanceSpectrum {
  segments: SpectrumSegment[]; // fine-grained
  aggregated?: Array<{
    binStart: Date;
    binEnd: Date;
    segmentCount: number;
    durationStats?: { avg: number; p50: number; p90: number; p99: number };
  }>;
}

export interface SpectrumOptions {
  binSizeMs?: number; // for aggregation
  includeRework?: boolean;
}
