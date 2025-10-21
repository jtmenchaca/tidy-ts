/**
 * Test Process Discovery algorithms
 */

import { expect } from "@std/expect";
import { createXESLog } from "../xes_log.ts";
import type { PetriNet } from "../types.ts";

Deno.test("inductiveMiner - simple sequence", () => {
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

  const result = log.inductiveMiner();

  expect(result.model).toBeDefined();
  expect(result.toPetriNet).toBeDefined();
  expect(result.toPetriNet?.places.length).toBeGreaterThan(0);
  expect(result.toPetriNet?.transitions.length).toBeGreaterThan(0);
});

Deno.test("splitMiner - simple sequence", () => {
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

  const result = log.splitMiner();

  expect(result.model).toBeDefined();
  // Split miner returns a Petri net
  const petri = result.model as PetriNet;
  expect(petri.places).toBeDefined();
  expect(petri.transitions).toBeDefined();
  expect(petri.arcs).toBeDefined();
});

Deno.test("inductiveMiner - single activity", () => {
  const log = createXESLog({
    traces: [
      {
        attributes: { "concept:name": "1" },
        events: [
          {
            "concept:name": "A",
            "time:timestamp": new Date("2024-01-01T10:00:00"),
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
        ],
      },
    ],
    attributes: {},
  });

  const result = log.inductiveMiner();

  expect(result.model).toBeDefined();
  expect(result.toPetriNet).toBeDefined();
});

Deno.test("inductiveMiner - empty log", () => {
  const log = createXESLog({
    traces: [],
    attributes: {},
  });

  const result = log.inductiveMiner();

  expect(result.model).toBeDefined();
  expect(result.toPetriNet).toBeDefined();
});
