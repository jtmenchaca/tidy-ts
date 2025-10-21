/**
 * Test that timestamp ordering is properly enforced
 * Critical for correctness of all algorithms
 */

import { expect } from "@std/expect";
import { buildDFG } from "../analysis/process-discovery/dfg.ts";
import { createXESLog } from "../xes_log.ts";

Deno.test("buildDFG - handles unordered timestamps correctly", () => {
  // Create a trace with deliberately shuffled timestamps
  const log = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          {
            "concept:name": "B",
            "time:timestamp": new Date("2024-01-01T10:05:00"),
          }, // Out of order
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
          }, // Should be first
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T10:10:00"),
          },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = buildDFG(log.toXES());

  // Despite shuffled input, DFG should show correct sequence: A->B->C
  expect(dfg.edges.get("A->B")?.frequency).toBe(1);
  expect(dfg.edges.get("B->C")?.frequency).toBe(1);
  expect(dfg.edges.has("B->A")).toBe(false); // Should NOT exist

  // Start and end activities should be correct based on timestamps
  expect(dfg.startActivities.get("A")).toBe(1); // A is earliest
  expect(dfg.endActivities.get("C")).toBe(1); // C is latest
});

Deno.test("buildDFG - sorted vs unsorted produces same result", () => {
  const sortedLog = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
          },
          {
            "concept:name": "B",
            "time:timestamp": new Date("2024-01-01T10:05:00"),
          },
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T10:10:00"),
          },
        ],
      },
    ],
    attributes: {},
  });

  const unsortedLog = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T10:10:00"),
          },
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
          },
          {
            "concept:name": "B",
            "time:timestamp": new Date("2024-01-01T10:05:00"),
          },
        ],
      },
    ],
    attributes: {},
  });

  const dfgSorted = buildDFG(sortedLog.toXES());
  const dfgUnsorted = buildDFG(unsortedLog.toXES());

  // Both should produce identical DFGs
  expect(dfgSorted.edges.size).toBe(dfgUnsorted.edges.size);
  expect(dfgSorted.edges.get("A->B")?.frequency).toBe(
    dfgUnsorted.edges.get("A->B")?.frequency,
  );
  expect(dfgSorted.edges.get("B->C")?.frequency).toBe(
    dfgUnsorted.edges.get("B->C")?.frequency,
  );

  // Start/end activities should match
  expect(dfgSorted.startActivities.get("A")).toBe(
    dfgUnsorted.startActivities.get("A"),
  );
  expect(dfgSorted.endActivities.get("C")).toBe(
    dfgUnsorted.endActivities.get("C"),
  );
});

Deno.test("buildDFG - handles same timestamp correctly", () => {
  const log = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
          },
          {
            "concept:name": "B",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
          }, // Same time
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
          }, // Same time
        ],
      },
    ],
    attributes: {},
  });

  const dfg = buildDFG(log.toXES());

  // Should still create edges in original order when timestamps are identical
  expect(dfg.edges.size).toBeGreaterThan(0);
  expect(dfg.activities.size).toBe(3);
});
