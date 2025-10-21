import { expect } from "@std/expect";
import { sliceEvents } from "./slice-events.verb.ts";

Deno.test("sliceEvents - slices events within each trace", () => {
  const traces = [
    {
      attributes: { "concept:name": "case1" },
      events: [
        { "concept:name": "A", "time:timestamp": new Date() },
        { "concept:name": "B", "time:timestamp": new Date() },
        { "concept:name": "C", "time:timestamp": new Date() },
      ],
    },
  ];

  const result = sliceEvents(0, 2)(traces, {});

  expect(result.traces[0].events.length).toBe(2);
  expect(result.traces[0].events[0]["concept:name"]).toBe("A");
  expect(result.traces[0].events[1]["concept:name"]).toBe("B");
});

Deno.test("sliceEvents - with only start parameter", () => {
  const traces = [
    {
      attributes: { "concept:name": "case1" },
      events: [
        { "concept:name": "A", "time:timestamp": new Date() },
        { "concept:name": "B", "time:timestamp": new Date() },
        { "concept:name": "C", "time:timestamp": new Date() },
      ],
    },
  ];

  const result = sliceEvents(1)(traces, {});

  expect(result.traces[0].events.length).toBe(2);
  expect(result.traces[0].events[0]["concept:name"]).toBe("B");
  expect(result.traces[0].events[1]["concept:name"]).toBe("C");
});
