import { expect } from "@std/expect";
import { filterTraces } from "./filter-traces.verb.ts";

Deno.test("filterTraces - filters by predicate", () => {
  const traces = [
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
  ];

  const result = filterTraces((trace) => trace.events.length > 2)(traces, {});

  expect(result.traces.length).toBe(1);
  expect(result.traces[0].attributes["concept:name"]).toBe("case3");
});
