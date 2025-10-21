/**
 * Process Mining Algorithms
 * Main export file for all process mining algorithms organized by category
 */

// ---------- DISCOVERY ----------
export { inductiveMiner } from "./process-discovery/inductive-miner.ts";
export { splitMiner } from "./process-discovery/split-miner.ts";

// ---------- CONFORMANCE ----------
// TODO: Add conformance algorithms when implemented
// export { tokenReplay } from "./conformance/token-replay.ts";
// export { aStarAlignments } from "./conformance/a-star-alignments.ts";

// ---------- ENHANCEMENT / PERFORMANCE ----------
export { createDFG } from "./performance/dfg-creation.ts";
export { getActivityStats } from "./performance/activity-stats.ts";
export { detectBottlenecks } from "./performance/bottleneck-detection.ts";
export { getStartEndActivities } from "./performance/start-end-activities.ts";
export { analyzeVariants } from "./performance/variant-analysis.ts";
export { formatDuration } from "./performance/format-duration.ts";

// Re-export types for convenience
export type {
  Activity,
  Alignment,
  ConformanceOptions,
  ConformanceResult,
  DiscoveryOptions,
  DiscoveryResult,
  PerformanceAnnotation,
  PerformanceSpectrum,
  PetriNet,
  ProcessTree,
  SpectrumOptions,
} from "../types.ts";
