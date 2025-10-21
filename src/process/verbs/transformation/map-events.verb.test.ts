import { expect } from "@std/expect";
import { mapEvents } from "./map-events.verb.ts";

Deno.test("mapEvents - transforms each event", () => {
  const traces = [
    {
      attributes: { "concept:name": "case1" },
      events: [
        { "concept:name": "A", "time:timestamp": new Date() },
        { "concept:name": "B", "time:timestamp": new Date() },
      ],
    },
  ];

  const result = mapEvents((event, _trace) => ({
    ...event,
    uppercase_name: (event["concept:name"] as string).toUpperCase(),
  }))(traces, {});

  expect(result.traces[0].events[0].uppercase_name).toBe("A");
  expect(result.traces[0].events[1].uppercase_name).toBe("B");
});
