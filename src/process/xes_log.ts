/**
 * XESLog - Hierarchical event log that respects trace → event structure
 *
 * Unlike DataFrame (flat tables), event logs are inherently hierarchical:
 * - A log contains traces (cases)
 * - Each trace contains events
 * - Operations work at trace-level OR event-level, not both
 */

import type { XESEvent, XESLogData, XESTrace } from "./readXES.ts";
import type { XESAttributes } from "./types.ts";
import {
  sliceTraces as sliceTracesVerb,
  sliceTracesRange,
} from "./verbs/slicing/slice-traces.verb.ts";
import { sliceEvents as sliceEventsVerb } from "./verbs/slicing/slice-events.verb.ts";
import { filterTraces as filterTracesVerb } from "./verbs/filtering/filter-traces.verb.ts";
import { filterTracesWithActivity as filterTracesWithActivityVerb } from "./verbs/filtering/filter-traces-with-activity.verb.ts";
import { filterEvents as filterEventsVerb } from "./verbs/filtering/filter-events.verb.ts";
import { mapTraces as mapTracesVerb } from "./verbs/transformation/map-traces.verb.ts";
import { mapEvents as mapEventsVerb } from "./verbs/transformation/map-events.verb.ts";
import { sortEvents as sortEventsVerb } from "./verbs/transformation/sort-events.verb.ts";
import { dfg as dfgVerb } from "./verbs/process-mining/dfg.verb.ts";
import { activityStats as activityStatsVerb } from "./verbs/process-mining/activity-stats.verb.ts";
import { variants as variantsVerb } from "./verbs/process-mining/variants.verb.ts";
import { startEndActivities as startEndActivitiesVerb } from "./verbs/process-mining/start-end-activities.verb.ts";
import { detectBottlenecks } from "./analysis/performance/bottleneck-detection.ts";
import { inductiveMiner } from "./analysis/process-discovery/inductive-miner.ts";
import { splitMiner } from "./analysis/process-discovery/split-miner.ts";
import { getCaseDurations } from "./readXES.ts";

export function createXESLog(data: XESLogData): XESLog {
  return new XESLog(data.traces, data.attributes);
}

/**
 * Immutable XESLog class - operations return new instances
 */

export class XESLog {
  constructor(
    private readonly _traces: readonly XESTrace[],
    private readonly _attributes: XESAttributes,
  ) {}

  toXES(): XESLogData {
    return {
      traces: [...this._traces],
      attributes: this._attributes,
    };
  }

  // ========== BASIC ACCESS ==========

  /** Get all traces as readonly array */
  traces(): readonly XESTrace[] {
    return this._traces;
  }

  /** Get trace by index */
  trace(index: number): XESTrace | undefined {
    return this._traces[index];
  }

  /** Number of traces (cases) */
  ntraces(): number {
    return this._traces.length;
  }

  /** Total events across all traces */
  nevents(): number {
    return this._traces.reduce((sum, t) => sum + t.events.length, 0);
  }

  /** Log-level attributes */
  attributes(): XESAttributes {
    return this._attributes;
  }

  // ========== SLICING ==========

  /** Take first N traces */
  sliceTraces(n: number): XESLog;
  sliceTraces(start: number, end: number): XESLog;
  sliceTraces(startOrN: number, end?: number): XESLog {
    if (end === undefined) {
      const result = sliceTracesVerb(startOrN)(this._traces, this._attributes);
      return new XESLog(result.traces, result.attributes);
    }
    const result = sliceTracesRange(startOrN, end)(
      this._traces,
      this._attributes,
    );
    return new XESLog(result.traces, result.attributes);
  }

  /** Slice events within each trace */
  sliceEvents(start: number, end?: number): XESLog {
    const result = sliceEventsVerb(start, end)(this._traces, this._attributes);
    return new XESLog(result.traces, result.attributes);
  }

  // ========== FILTERING ==========

  /** Filter traces by predicate */
  filterTraces(predicate: (trace: XESTrace, index: number) => boolean): XESLog {
    const result = filterTracesVerb(predicate)(this._traces, this._attributes);
    return new XESLog(result.traces, result.attributes);
  }

  /** Keep only traces containing specific activity */
  filterTracesWithActivity(activity: string): XESLog {
    const result = filterTracesWithActivityVerb(activity)(
      this._traces,
      this._attributes,
    );
    return new XESLog(result.traces, result.attributes);
  }

  /** Filter events within each trace (keeps all traces) */
  filterEvents(
    predicate: (event: XESEvent, trace: XESTrace) => boolean,
  ): XESLog {
    const result = filterEventsVerb(predicate)(this._traces, this._attributes);
    return new XESLog(result.traces, result.attributes);
  }

  // ========== TRANSFORMATION ==========

  /** Map over traces, returning new XESLog */
  mapTraces(fn: (trace: XESTrace, index: number) => XESTrace): XESLog {
    const result = mapTracesVerb(fn)(this._traces, this._attributes);
    return new XESLog(result.traces, result.attributes);
  }

  /** Map events within each trace */
  mapEvents(fn: (event: XESEvent, trace: XESTrace) => XESEvent): XESLog {
    const result = mapEventsVerb(fn)(this._traces, this._attributes);
    return new XESLog(result.traces, result.attributes);
  }

  /** Sort events by timestamp within each trace */
  sortEvents(): XESLog {
    const result = sortEventsVerb()(this._traces, this._attributes);
    return new XESLog(result.traces, result.attributes);
  }

  // ========== ITERATION ==========

  /** Iterate over traces */
  [Symbol.iterator](): IterableIterator<XESTrace> {
    return this._traces[Symbol.iterator]();
  }

  /** For-each over traces */
  forEach(fn: (trace: XESTrace, index: number) => void): void {
    this._traces.forEach(fn);
  }

  // ========== PROCESS MINING ==========

  /** Build directly-follows graph */
  dfg() {
    return dfgVerb()(this._traces, this._attributes);
  }

  /** Get activity statistics with timing information */
  activityStats() {
    return activityStatsVerb()(this._traces);
  }

  /** Get process variants (unique trace sequences) */
  variants() {
    return variantsVerb()(this._traces);
  }

  /** Get start and end activities */
  startEndActivities() {
    return startEndActivitiesVerb()(this._traces);
  }

  /** Detect bottlenecks - activities with long waiting times */
  detectBottlenecks() {
    return detectBottlenecks(this.toXES());
  }

  /** Inductive Miner - builds process tree via recursive DFG cuts */
  inductiveMiner(opts?: { noiseThresholdIMf?: number }) {
    return inductiveMiner(this.toXES(), opts);
  }

  /** Split Miner - prune DFG, detect splits/joins */
  splitMiner(
    opts?: { dfFilterPercentile?: number; gatewayProbThreshold?: number },
  ) {
    return splitMiner(this.toXES(), opts);
  }

  /** Get case durations (trace start to end) */
  caseDurations() {
    return getCaseDurations(this.toXES());
  }

  // ========== UTILITY ==========

  /** Print summary */
  print(): void {
    console.log(`XESLog: ${this.ntraces()} traces, ${this.nevents()} events`);
    const uniqueActivities = new Set<string>();
    for (const trace of this._traces) {
      for (const event of trace.events) {
        const activity = event["concept:name"] || event.activity;
        if (typeof activity === "string") {
          uniqueActivities.add(activity);
        }
      }
    }
    console.log(`Unique activities: ${uniqueActivities.size}`);
  }
}
