import { expect } from "@std/expect";
import {
  sliceTraces,
  sliceTracesRange,
} from "../../../verbs/slicing/slice-traces.verb.ts";

Deno.test("sliceTraces - take first N", () => {
  const traces = [
    { attributes: { "concept:name": "case1" }, events: [] },
    { attributes: { "concept:name": "case2" }, events: [] },
    { attributes: { "concept:name": "case3" }, events: [] },
  ];

  const result = sliceTraces(2)(traces, {});

  expect(result.traces.length).toBe(2);
  expect(result.traces[0].attributes["concept:name"]).toBe("case1");
  expect(result.traces[1].attributes["concept:name"]).toBe("case2");
});

Deno.test("sliceTracesRange - slice range", () => {
  const traces = [
    { attributes: { "concept:name": "case1" }, events: [] },
    { attributes: { "concept:name": "case2" }, events: [] },
    { attributes: { "concept:name": "case3" }, events: [] },
  ];

  const result = sliceTracesRange(1, 3)(traces, {});

  expect(result.traces.length).toBe(2);
  expect(result.traces[0].attributes["concept:name"]).toBe("case2");
  expect(result.traces[1].attributes["concept:name"]).toBe("case3");
});
