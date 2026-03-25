import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "temporal-polyfill";

const NativeTemporal = Temporal;

// =============================================================================
// Instant — epoch-capable, should work
// =============================================================================

Deno.test("asofJoin - Instant backward join (native)", () => {
  const trades = createDataFrame([
    {
      time: NativeTemporal.Instant.from("2024-01-01T00:01:00Z"),
      quantity: 100,
    },
    {
      time: NativeTemporal.Instant.from("2024-01-01T00:03:00Z"),
      quantity: 200,
    },
    {
      time: NativeTemporal.Instant.from("2024-01-01T00:06:00Z"),
      quantity: 150,
    },
  ]);

  const quotes = createDataFrame([
    { time: NativeTemporal.Instant.from("2024-01-01T00:00:00Z"), price: 150.0 },
    { time: NativeTemporal.Instant.from("2024-01-01T00:02:00Z"), price: 151.0 },
    { time: NativeTemporal.Instant.from("2024-01-01T00:04:00Z"), price: 152.0 },
  ]);

  const result = trades.asofJoin(quotes, "time", { direction: "backward" });

  expect(result.nrows()).toBe(3);
  expect(result[0].price).toBe(150.0);
  expect(result[1].price).toBe(151.0);
  expect(result[2].price).toBe(152.0);
});

Deno.test("asofJoin - Instant forward join (native)", () => {
  const events = createDataFrame([
    { time: NativeTemporal.Instant.from("2024-01-01T00:01:00Z"), event: "a" },
    { time: NativeTemporal.Instant.from("2024-01-01T00:03:00Z"), event: "b" },
  ]);

  const measurements = createDataFrame([
    { time: NativeTemporal.Instant.from("2024-01-01T00:02:00Z"), value: 10 },
    { time: NativeTemporal.Instant.from("2024-01-01T00:04:00Z"), value: 20 },
  ]);

  const result = events.asofJoin(measurements, "time", {
    direction: "forward",
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].value).toBe(10);
  expect(result[1].value).toBe(20);
});

Deno.test("asofJoin - Instant (polyfill)", () => {
  const left = createDataFrame([
    {
      time: PolyfillTemporal.Instant.from("2024-01-01T00:01:00Z"),
      quantity: 100,
    },
    {
      time: PolyfillTemporal.Instant.from("2024-01-01T00:03:00Z"),
      quantity: 200,
    },
  ]);

  const right = createDataFrame([
    {
      time: PolyfillTemporal.Instant.from("2024-01-01T00:00:00Z"),
      price: 150.0,
    },
    {
      time: PolyfillTemporal.Instant.from("2024-01-01T00:02:00Z"),
      price: 151.0,
    },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBe(150.0);
  expect(result[1].price).toBe(151.0);
});

// =============================================================================
// PlainDate — calendar path using until().total() for distance
// =============================================================================

Deno.test("asofJoin - PlainDate backward join (calendar path)", () => {
  const left = createDataFrame([
    { time: NativeTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { time: NativeTemporal.PlainDate.from("2024-01-03"), value: 2 },
    { time: NativeTemporal.PlainDate.from("2024-01-06"), value: 3 },
  ]);

  const right = createDataFrame([
    { time: NativeTemporal.PlainDate.from("2024-01-02"), price: 100 },
    { time: NativeTemporal.PlainDate.from("2024-01-04"), price: 200 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.nrows()).toBe(3);
  expect(result[0].price).toBeUndefined(); // no right value <= Jan 1
  expect(result[1].price).toBe(100); // Jan 2 <= Jan 3
  expect(result[2].price).toBe(200); // Jan 4 <= Jan 6
});

Deno.test("asofJoin - PlainDate forward join (calendar path)", () => {
  const left = createDataFrame([
    { time: NativeTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { time: NativeTemporal.PlainDate.from("2024-01-03"), value: 2 },
  ]);

  const right = createDataFrame([
    { time: NativeTemporal.PlainDate.from("2024-01-02"), price: 100 },
    { time: NativeTemporal.PlainDate.from("2024-01-04"), price: 200 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "forward" });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBe(100); // Jan 2 >= Jan 1
  expect(result[1].price).toBe(200); // Jan 4 >= Jan 3
});

Deno.test("asofJoin - PlainDate (polyfill)", () => {
  const left = createDataFrame([
    { time: PolyfillTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { time: PolyfillTemporal.PlainDate.from("2024-01-03"), value: 2 },
  ]);

  const right = createDataFrame([
    { time: PolyfillTemporal.PlainDate.from("2024-01-02"), price: 100 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.nrows()).toBe(2);
  expect(result[1].price).toBe(100);
});

// =============================================================================
// PlainDateTime — calendar path
// =============================================================================

Deno.test("asofJoin - PlainDateTime backward join (calendar path)", () => {
  const left = createDataFrame([
    {
      time: NativeTemporal.PlainDateTime.from("2024-01-01T00:00:00"),
      value: 1,
    },
    {
      time: NativeTemporal.PlainDateTime.from("2024-01-01T02:00:00"),
      value: 2,
    },
  ]);

  const right = createDataFrame([
    {
      time: NativeTemporal.PlainDateTime.from("2024-01-01T01:00:00"),
      price: 100,
    },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBeUndefined(); // no right value <= 00:00
  expect(result[1].price).toBe(100); // 01:00 <= 02:00
});

Deno.test("asofJoin - PlainDateTime (polyfill)", () => {
  const left = createDataFrame([
    {
      time: PolyfillTemporal.PlainDateTime.from("2024-01-01T00:00:00"),
      value: 1,
    },
    {
      time: PolyfillTemporal.PlainDateTime.from("2024-01-01T02:00:00"),
      value: 2,
    },
  ]);

  const right = createDataFrame([
    {
      time: PolyfillTemporal.PlainDateTime.from("2024-01-01T01:00:00"),
      price: 100,
    },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBeUndefined();
  expect(result[1].price).toBe(100);
});

// =============================================================================
// PlainTime — should throw (no date component)
// =============================================================================

Deno.test("asofJoin - PlainTime throws", () => {
  const left = createDataFrame([
    { time: NativeTemporal.PlainTime.from("10:00:00"), value: 1 },
  ]);

  const right = createDataFrame([
    { time: NativeTemporal.PlainTime.from("11:00:00"), price: 100 },
  ]);

  expect(() => left.asofJoin(right, "time", { direction: "backward" })).toThrow(
    "PlainTime",
  );
});
