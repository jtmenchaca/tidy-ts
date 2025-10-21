/**
 * Zero-dependency XES (eXtensible Event Stream) parser for Deno
 * Parses XES files into a structured format for process mining
 */

import type { XESLog } from "./xes_log.ts";
import { createXESLog } from "./xes_log.ts";

export interface XESEvent {
  [key: string]: string | number | boolean | Date | undefined;
}

export interface XESTrace {
  attributes: Record<string, string | number | boolean | Date | undefined>;
  events: XESEvent[];
}

export interface XESLogData {
  attributes: Record<string, string | number | boolean | Date | undefined>;
  traces: XESTrace[];
}

/**
 * Parse XES XML content into structured format
 */
export function parseXES(xmlContent: string): XESLogData {
  const log: XESLogData = {
    attributes: {},
    traces: [],
  };

  // Extract log-level attributes (before first <trace>)
  const logSection = xmlContent.substring(
    xmlContent.indexOf("<log"),
    xmlContent.indexOf("<trace>"),
  );
  log.attributes = extractAttributes(logSection);

  // Extract all traces
  const traceMatches = xmlContent.matchAll(/<trace>([\s\S]*?)<\/trace>/g);

  for (const traceMatch of traceMatches) {
    const traceContent = traceMatch[1];
    const trace: XESTrace = {
      attributes: {},
      events: [],
    };

    // Extract trace-level attributes (before first <event>)
    const traceAttrSection = traceContent.substring(
      0,
      traceContent.indexOf("<event>"),
    );
    trace.attributes = extractAttributes(traceAttrSection);

    // Extract all events in this trace
    const eventMatches = traceContent.matchAll(/<event>([\s\S]*?)<\/event>/g);

    for (const eventMatch of eventMatches) {
      const eventContent = eventMatch[1];
      const event = extractAttributes(eventContent);
      trace.events.push(event);
    }

    log.traces.push(trace);
  }

  return log;
}

/**
 * Extract attributes from XML content
 * Supports: string, int, float, date, boolean
 */
function extractAttributes(
  content: string,
): Record<string, string | number | boolean | Date | undefined> {
  const attributes: Record<
    string,
    string | number | boolean | Date | undefined
  > = {};

  // String attributes
  const stringMatches = content.matchAll(
    /<string key="([^"]+)" value="([^"]*)"\s*\/>/g,
  );
  for (const match of stringMatches) {
    const [, key, value] = match;
    attributes[key] = value;
  }

  // Int attributes
  const intMatches = content.matchAll(
    /<int key="([^"]+)" value="([^"]*)"\s*\/>/g,
  );
  for (const match of intMatches) {
    const [, key, value] = match;
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) attributes[key] = n;
  }

  // Float attributes
  const floatMatches = content.matchAll(
    /<float key="([^"]+)" value="([^"]*)"\s*\/>/g,
  );
  for (const match of floatMatches) {
    const [, key, value] = match;
    const num = parseFloat(value);
    attributes[key] = isNaN(num) ? undefined : num;
  }

  // Date attributes
  const dateMatches = content.matchAll(
    /<date key="([^"]+)" value="([^"]*)"\s*\/>/g,
  );
  for (const match of dateMatches) {
    const [, key, value] = match;
    attributes[key] = new Date(value);
  }

  // Boolean attributes
  const boolMatches = content.matchAll(
    /<boolean key="([^"]+)" value="([^"]*)"\s*\/>/g,
  );
  for (const match of boolMatches) {
    const [, key, value] = match;
    attributes[key] = value === "true";
  }

  return attributes;
}

/**
 * Detects if input is a file path or raw XES content
 */
function isFilePath(input: string): boolean {
  // Check if it contains XES-like content (starts with <?xml and contains <log>)
  if (input.trim().startsWith("<?xml") && input.includes("<log>")) {
    return false;
  }

  // Check for file-like patterns (has extension, doesn't contain XML tags, etc.)
  return !input.includes("<") && (input.includes(".") || input.length < 100);
}

/**
 * Read a XES file or parse XES content
 *
 * @param pathOrContent - Either a file path to read from, or raw XES content
 * @returns A properly typed XESLog
 *
 * @example
 * ```ts
 * // Read from file
 * const log1 = await readXES("./data.xes");
 *
 * // Parse from raw content
 * const xesContent = `<?xml version="1.0" encoding="utf-8"?>
 * <log>
 *   <trace>
 *     <string key="concept:name" value="1"/>
 *     <event>
 *       <string key="concept:name" value="A"/>
 *       <date key="time:timestamp" value="2024-01-01T10:00:00Z"/>
 *     </event>
 *   </trace>
 * </log>`;
 * const log2 = await readXES(xesContent);
 * ```
 */
export async function readXES(pathOrContent: string): Promise<XESLog> {
  let rawXes: string;

  if (isFilePath(pathOrContent)) {
    // It's a file path - read from file
    try {
      rawXes = await Deno.readTextFile(pathOrContent);
    } catch (error) {
      throw new Error(
        `Failed to read XES file '${pathOrContent}': ${
          (error as Error).message
        }`,
      );
    }
  } else {
    // It's raw XES content - use directly
    rawXes = pathOrContent;
  }

  const rawLog = parseXES(rawXes);
  return createXESLog(rawLog);
}

/**
 * Sort events by timestamp with NaN-safe handling
 */
function sortByTime(events: XESEvent[]): XESEvent[] {
  return [...events].sort((a, b) => {
    const ta = a["time:timestamp"] ?? a.timestamps;
    const tb = b["time:timestamp"] ?? b.timestamps;
    const da = ta instanceof Date ? ta : new Date(String(ta));
    const db = tb instanceof Date ? tb : new Date(String(tb));
    const aT = isNaN(da.getTime()) ? Number.POSITIVE_INFINITY : da.getTime();
    const bT = isNaN(db.getTime()) ? Number.POSITIVE_INFINITY : db.getTime();
    return aT - bT;
  });
}

/**
 * Get basic statistics about the event log
 */
export function getLogStats(log: XESLog) {
  const totalTraces = log.traces().length;
  const totalEvents = log.traces().reduce(
    (sum, trace) => sum + trace.events.length,
    0,
  );
  const avgEventsPerTrace = totalEvents / totalTraces;

  // Get unique activities
  const activities = new Set<string>();
  for (const trace of log.traces()) {
    for (const event of trace.events) {
      const activity = event["concept:name"] || event.activity;
      if (activity && typeof activity === "string") {
        activities.add(activity);
      }
    }
  }

  return {
    totalTraces,
    totalEvents,
    avgEventsPerTrace,
    uniqueActivities: activities.size,
    activities: Array.from(activities),
  };
}

/**
 * Extract all unique variants (sequences of activities)
 * Sorts events by timestamp to ensure order-independent results
 */
export function getProcessVariants(log: XESLog): Map<string, number> {
  const variants = new Map<string, number>();

  for (const trace of log.traces()) {
    // Sort events by timestamp before extracting sequence
    const sequence = sortByTime(trace.events)
      .map((event) => event["concept:name"] || event.activity)
      .filter((activity): activity is string => typeof activity === "string")
      .join(" → ");

    variants.set(sequence, (variants.get(sequence) || 0) + 1);
  }

  return variants;
}

/**
 * Calculate case duration (time from first to last event)
 * Uses min/max to be independent of event order in file
 */
export function getCaseDurations(log: XESLogData): Map<string, number> {
  const durations = new Map<string, number>();

  for (const trace of log.traces) {
    const caseId = trace.attributes["concept:name"];
    if (typeof caseId !== "string") continue;

    const times = trace.events
      .map((e) => e["time:timestamp"] ?? e.timestamps)
      .map((
        ts,
      ) => (ts instanceof Date ? ts : ts ? new Date(String(ts)) : undefined))
      .filter((d): d is Date => !!d && !isNaN(d.getTime()))
      .map((d) => d.getTime());

    if (times.length >= 2) {
      durations.set(caseId, Math.max(...times) - Math.min(...times));
    }
  }

  return durations;
}
