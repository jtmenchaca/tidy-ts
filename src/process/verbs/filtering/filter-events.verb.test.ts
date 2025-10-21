import { expect } from "@std/expect";
import { filterEvents } from "./filter-events.verb.ts";

Deno.test("filterEvents - filters events within traces", () => {
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

  const result = filterEvents((event) => event["concept:name"] !== "B")(
    traces,
    {},
  );

  expect(result.traces.length).toBe(1); // Still has trace
  expect(result.traces[0].events.length).toBe(2); // But fewer events
  expect(result.traces[0].events[0]["concept:name"]).toBe("A");
  expect(result.traces[0].events[1]["concept:name"]).toBe("C");
});
