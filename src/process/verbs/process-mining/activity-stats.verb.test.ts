import { expect } from "@std/expect";
import { activityStats } from "./activity-stats.verb.ts";

Deno.test("activityStats - computes frequencies and durations", () => {
  const traces = [
    {
      attributes: { "concept:name": "case1" },
      events: [
        {
          "concept:name": "A",
          "time:timestamp": new Date("2024-01-01T10:00:00"),
        },
        {
          "concept:name": "B",
          "time:timestamp": new Date("2024-01-01T10:05:00"),
        },
        {
          "concept:name": "C",
          "time:timestamp": new Date("2024-01-01T10:10:00"),
        },
      ],
    },
    {
      attributes: { "concept:name": "case2" },
      events: [
        {
          "concept:name": "A",
          "time:timestamp": new Date("2024-01-01T11:00:00"),
        },
        {
          "concept:name": "B",
          "time:timestamp": new Date("2024-01-01T11:10:00"),
        },
        {
          "concept:name": "C",
          "time:timestamp": new Date("2024-01-01T11:20:00"),
        },
      ],
    },
  ];

  const result = activityStats()(traces);

  expect(result.length).toBe(3);

  // A and B each have 2 durations (not last in trace)
  expect(result.find((s) => s.activity === "A")?.frequency).toBe(2);
  expect(result.find((s) => s.activity === "B")?.frequency).toBe(2);

  // Should have duration info for A and B
  const aStats = result.find((s) => s.activity === "A");
  expect(aStats?.avgDuration).toBeDefined();
  expect(aStats?.minDuration).toBeDefined();
  expect(aStats?.maxDuration).toBeDefined();
});
