import { expect } from "@std/expect";
import { filterTracesWithActivity } from "./filter-traces-with-activity.verb.ts";

Deno.test("filterTracesWithActivity - keeps traces with activity", () => {
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
        { "concept:name": "C", "time:timestamp": new Date() },
      ],
    },
  ];

  const result = filterTracesWithActivity("B")(traces, {});

  expect(result.traces.length).toBe(1);
  expect(result.traces[0].attributes["concept:name"]).toBe("case1");
});
