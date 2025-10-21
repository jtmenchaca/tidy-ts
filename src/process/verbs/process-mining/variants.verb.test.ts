import { expect } from "@std/expect";
import { variants } from "../../../verbs/process-mining/variants.verb.ts";

Deno.test("variants - finds unique sequences", () => {
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
    {
      attributes: { "concept:name": "case3" },
      events: [
        { "concept:name": "A", "time:timestamp": new Date() },
        { "concept:name": "C", "time:timestamp": new Date() },
      ],
    },
  ];

  const result = variants()(traces);

  expect(result.size).toBe(2);
  expect(result.get("A → B")).toBe(2);
  expect(result.get("A → C")).toBe(1);
});
