/**
 * Variant Analysis
 * Calculate variant analysis - find common and rare process paths
 */

import type { XESEvent, XESLogData } from "../../readXES.ts";

/**
 * Sort events by timestamp with stable ordering and NaN-safe handling
 */
function sortedEvents(events: XESEvent[]): XESEvent[] {
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
 * Calculate variant analysis - find common and rare process paths
 */
export function analyzeVariants(log: XESLogData): {
  totalVariants: number;
  mostCommonVariant: { sequence: string; count: number };
  variantCoverage: { top: number; coverage: number }[];
  rareVariants: { sequence: string; count: number }[];
} {
  const variants = new Map<string, number>();

  for (const trace of log.traces) {
    const sorted = sortedEvents(trace.events);
    const sequence = sorted
      .map((event) => event["concept:name"] || event.activity)
      .filter((activity): activity is string => typeof activity === "string")
      .join(" → ");

    variants.set(sequence, (variants.get(sequence) || 0) + 1);
  }

  const sortedVariants = Array.from(variants.entries()).sort((a, b) =>
    b[1] - a[1]
  );

  const totalCases = log.traces.length;
  const mostCommon = sortedVariants[0];

  // Calculate coverage (what % of cases are covered by top N variants)
  const variantCoverage: { top: number; coverage: number }[] = [];
  let cumulativeCases = 0;
  for (let i = 0; i < Math.min(10, sortedVariants.length); i++) {
    cumulativeCases += sortedVariants[i][1];
    variantCoverage.push({
      top: i + 1,
      coverage: (cumulativeCases / totalCases) * 100,
    });
  }

  // Find rare variants (appear only once)
  const rareVariants = sortedVariants
    .filter(([, count]) => count === 1)
    .map(([sequence, count]) => ({ sequence, count }));

  return {
    totalVariants: variants.size,
    mostCommonVariant: {
      sequence: mostCommon[0],
      count: mostCommon[1],
    },
    variantCoverage,
    rareVariants: rareVariants.slice(0, 5), // Show first 5 rare variants
  };
}
