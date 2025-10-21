/**
 * XESLog tests - hierarchical event log operations
 */

import { expect } from "@std/expect";
import { createXESLog } from "../xes_log.ts";
import type { XESLogData } from "../readXES.ts";

Deno.test("XESLog - basic access", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);

  expect(log.ntraces()).toBe(2);
  expect(log.nevents()).toBe(3);
  expect(log.trace(0)?.attributes["concept:name"]).toBe("case1");
});

Deno.test("sliceTraces - respects hierarchy", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case3" },
        events: [
          { "concept:name": "D", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);
  const sliced = log.sliceTraces(0, 2);

  expect(sliced.ntraces()).toBe(2);
  expect(sliced.nevents()).toBe(4); // 3 + 1, not affecting event count per trace
});

Deno.test("filterTraces - filters at trace level", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case3" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);

  // Filter to traces with more than 2 events
  const filtered = log.filterTraces((trace) => trace.events.length > 2);

  expect(filtered.ntraces()).toBe(1);
  expect(filtered.trace(0)?.attributes["concept:name"]).toBe("case3");
});

Deno.test("sortEvents - sorts by timestamp", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          {
            "concept:name": "C",
            "time:timestamp": new Date("2024-01-01T10:30:00"),
          },
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
          },
          {
            "concept:name": "B",
            "time:timestamp": new Date("2024-01-01T10:15:00"),
          },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);
  const sorted = log.sortEvents();

  expect(sorted.trace(0)?.events[0]["concept:name"]).toBe("A");
  expect(sorted.trace(0)?.events[1]["concept:name"]).toBe("B");
  expect(sorted.trace(0)?.events[2]["concept:name"]).toBe("C");
});

Deno.test("dfg - builds directly-follows graph", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);
  const dfg = log.dfg();

  expect(dfg.activities.size).toBe(2);
  expect(dfg.activities.has("A")).toBe(true);
  expect(dfg.activities.has("B")).toBe(true);
  expect(dfg.edges.get("A->B")?.frequency).toBe(2);
});

Deno.test("variants - finds unique sequences", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case3" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);
  const variants = log.variants();

  expect(variants.size).toBe(2);
  expect(variants.get("A → B")).toBe(2);
  expect(variants.get("A → C")).toBe(1);
});

Deno.test("filterEvents - operates within each trace", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);

  // Remove B events
  const filtered = log.filterEvents((event) => event["concept:name"] !== "B");

  expect(filtered.ntraces()).toBe(1); // Still has trace
  expect(filtered.trace(0)?.events.length).toBe(2); // But fewer events
  expect(filtered.trace(0)?.events[0]["concept:name"]).toBe("A");
  expect(filtered.trace(0)?.events[1]["concept:name"]).toBe("C");
});

Deno.test("chaining operations", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "B", "time:timestamp": new Date() },
          { "concept:name": "C", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case2" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
          { "concept:name": "D", "time:timestamp": new Date() },
        ],
      },
      {
        attributes: { "concept:name": "case3" },
        events: [
          { "concept:name": "A", "time:timestamp": new Date() },
        ],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);

  const result = log
    .filterTraces((trace) => trace.events.length > 1)
    .sliceTraces(1); // Take first 1 of the filtered traces

  expect(result.ntraces()).toBe(1);
  expect(result.trace(0)?.attributes["concept:name"]).toBe("case1");
});

Deno.test("iteration - for...of over traces", () => {
  const data: XESLogData = {
    traces: [
      {
        attributes: { "concept:name": "case1" },
        events: [{ "concept:name": "A", "time:timestamp": new Date() }],
      },
      {
        attributes: { "concept:name": "case2" },
        events: [{ "concept:name": "B", "time:timestamp": new Date() }],
      },
    ],
    attributes: {},
  };

  const log = createXESLog(data);
  const caseNames: string[] = [];

  for (const trace of log) {
    caseNames.push(trace.attributes["concept:name"] as string);
  }

  expect(caseNames).toEqual(["case1", "case2"]);
});
