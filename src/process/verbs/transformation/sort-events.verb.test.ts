import { expect } from "@std/expect";
import { sortEvents } from "../../../verbs/transformation/sort-events.verb.ts";

Deno.test("sortEvents - sorts by timestamp", () => {
  const traces = [
    {
      attributes: { "concept:name": "case1" },
      events: [
        {
          "concept:name": "C",
          "time:timestamp": new Date("2024-01-01T10:30:00"),
        },
        {
          "concept:name": "A",
          "time:timestamp": new Date("2024-01-01T10:00:00"),
        },
        {
          "concept:name": "B",
          "time:timestamp": new Date("2024-01-01T10:15:00"),
        },
      ],
    },
  ];

  const result = sortEvents()(traces, {});

  expect(result.traces[0].events[0]["concept:name"]).toBe("A");
  expect(result.traces[0].events[1]["concept:name"]).toBe("B");
  expect(result.traces[0].events[2]["concept:name"]).toBe("C");
});
