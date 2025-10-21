import { expect } from "@std/expect";
import { mapTraces } from "../../../verbs/transformation/map-traces.verb.ts";

Deno.test("mapTraces - transforms each trace", () => {
  const traces = [
    {
      attributes: { "concept:name": "case1" },
      events: [
        { "concept:name": "A", "time:timestamp": new Date() },
      ],
    },
    {
      attributes: { "concept:name": "case2" },
      events: [
        { "concept:name": "A", "time:timestamp": new Date() },
        { "concept:name": "B", "time:timestamp": new Date() },
      ],
    },
  ];

  const result = mapTraces((trace) => ({
    ...trace,
    attributes: {
      ...trace.attributes,
      event_count: trace.events.length,
    },
  }))(traces, {});

  expect(result.traces[0].attributes.event_count).toBe(1);
  expect(result.traces[1].attributes.event_count).toBe(2);
});
