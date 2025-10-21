import { expect } from "@std/expect";
import { startEndActivities } from "../../../verbs/process-mining/start-end-activities.verb.ts";

Deno.test("startEndActivities - finds start and end activities", () => {
  const traces = [
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
  ];

  const result = startEndActivities()(traces);

  expect(result.startActivities.get("A")).toBe(2);
  expect(result.endActivities.get("C")).toBe(1);
  expect(result.endActivities.get("D")).toBe(1);
});
