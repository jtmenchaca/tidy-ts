import { expect } from "@std/expect";
import { dfg } from "../../../verbs/process-mining/dfg.verb.ts";

Deno.test("dfg - builds directly-follows graph", () => {
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
        { "concept:name": "B", "time:timestamp": new Date() },
      ],
    },
  ];

  const result = dfg()(traces, {});

  expect(result.activities.size).toBe(2);
  expect(result.activities.has("A")).toBe(true);
  expect(result.activities.has("B")).toBe(true);
  expect(result.edges.get("A->B")?.frequency).toBe(2);
});
