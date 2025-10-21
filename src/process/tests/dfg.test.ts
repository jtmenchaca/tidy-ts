/**
 * Test DFG (Directly-Follows Graph) construction
 */

import { expect } from "@std/expect";
import {
  buildDFG,
  filterDFG,
  getDirectPredecessors,
  getDirectSuccessors,
  hasPath,
} from "../analysis/process-discovery/dfg.ts";
import { createXESLog } from "../xes_log.ts";

Deno.test("buildDFG - simple sequential process", () => {
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
            "time:timestamp": new Date("2024-01-01T10:05:00"),
          },
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T10:10:00"),
          },
        ],
      },
      {
        attributes: { "concept:name": "2" },
        events: [
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T11:00:00"),
          },
          {
            "concept:name": "B",
            "time:timestamp": new Date("2024-01-01T11:05:00"),
          },
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T11:10:00"),
          },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = log.dfg();

  expect(dfg.activities.size).toBe(3);
  expect(dfg.activities.has("A")).toBe(true);
  expect(dfg.activities.has("B")).toBe(true);
  expect(dfg.activities.has("C")).toBe(true);

  expect(dfg.edges.size).toBe(2);
  expect(dfg.edges.get("A->B")?.frequency).toBe(2);
  expect(dfg.edges.get("B->C")?.frequency).toBe(2);

  expect(dfg.startActivities.get("A")).toBe(2);
  expect(dfg.endActivities.get("C")).toBe(2);
});

Deno.test("buildDFG - with choice (XOR)", () => {
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
            "time:timestamp": new Date("2024-01-01T10:05:00"),
          },
          {
            "concept:name": "D",
            "time:timestamp": new Date("2024-01-01T10:10:00"),
          },
        ],
      },
      {
        attributes: { "concept:name": "2" },
        events: [
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T11:00:00"),
          },
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T11:05:00"),
          },
          {
            "concept:name": "D",
            "time:timestamp": new Date("2024-01-01T11:10:00"),
          },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = log.dfg();

  expect(dfg.activities.size).toBe(4);
  expect(dfg.edges.size).toBe(4);
  expect(dfg.edges.get("A->B")?.frequency).toBe(1);
  expect(dfg.edges.get("A->C")?.frequency).toBe(1);
  expect(dfg.edges.get("B->D")?.frequency).toBe(1);
  expect(dfg.edges.get("C->D")?.frequency).toBe(1);
});

Deno.test("buildDFG - with loop", () => {
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
            "time:timestamp": new Date("2024-01-01T10:05:00"),
          },
          {
            "concept:name": "B",
            "time:timestamp": new Date("2024-01-01T10:10:00"),
          },
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T10:15:00"),
          },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = log.dfg();

  expect(dfg.edges.get("B->B")?.frequency).toBe(1); // Loop
  expect(dfg.edges.get("A->B")?.frequency).toBe(1);
  expect(dfg.edges.get("B->C")?.frequency).toBe(1);
});

Deno.test("filterDFG - removes infrequent edges", () => {
  const log = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "3" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "4" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = buildDFG(log.toXES());
  expect(dfg.edges.size).toBe(2);
  expect(dfg.edges.get("A->B")?.frequency).toBe(3);
  expect(dfg.edges.get("A->C")?.frequency).toBe(1);

  // Filter at 75th percentile - should remove A->C (freq=1)
  // frequencies [1, 3], 75th percentile gives threshold = 1
  // Using > threshold means only edges with freq > 1 survive
  const filtered = filterDFG(dfg, 0.75);
  expect(filtered.edges.size).toBe(1);
  expect(filtered.edges.has("A->B")).toBe(true);
  expect(filtered.edges.has("A->C")).toBe(false);
});

Deno.test("getDirectSuccessors", () => {
  const log = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "D", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = log.dfg();
  const successors = getDirectSuccessors(dfg, "A");

  expect(successors.size).toBe(2);
  expect(successors.has("B")).toBe(true);
  expect(successors.has("D")).toBe(true);
});

Deno.test("getDirectPredecessors", () => {
  const log = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "2" },
        events: [
          { "concept:name": "B", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = log.dfg();
  const predecessors = getDirectPredecessors(dfg, "C");

  expect(predecessors.size).toBe(2);
  expect(predecessors.has("A")).toBe(true);
  expect(predecessors.has("B")).toBe(true);
});

Deno.test("hasPath - direct connection", () => {
  const log = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  });

  const dfg = log.dfg();
  expect(hasPath(dfg, "A", "C")).toBe(true);
  expect(hasPath(dfg, "C", "A")).toBe(false);
});
