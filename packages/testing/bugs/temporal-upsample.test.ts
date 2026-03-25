import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "temporal-polyfill";

const NativeTemporal = Temporal;

// =============================================================================
// Instant — epoch-capable, should work
// =============================================================================

Deno.test("upsample - Instant with forward fill (native)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T10:00:00Z"),
      value: 100,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T12:00:00Z"),
      value: 200,
    },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(3); // 10:00, 11:00, 12:00
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(100); // forward filled
  expect(result[2].value).toBe(200);
});

Deno.test("upsample - Instant with backward fill (native)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T10:00:00Z"),
      value: 100,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T12:00:00Z"),
      value: 200,
    },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "backward",
  });

  expect(result.nrows()).toBe(3);
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(200); // backward filled
  expect(result[2].value).toBe(200);
});

Deno.test("upsample - Instant (polyfill)", () => {
  const df = createDataFrame([
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-01T10:00:00Z"),
      value: 100,
    },
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-01T12:00:00Z"),
      value: 200,
    },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(3);
});

// =============================================================================
// PlainDate — calendar path
// =============================================================================

Deno.test("upsample - PlainDate daily with forward fill (calendar path)", () => {
  const df = createDataFrame([
    { timestamp: NativeTemporal.PlainDate.from("2023-01-01"), value: 100 },
    { timestamp: NativeTemporal.PlainDate.from("2023-01-03"), value: 200 },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1D",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(3); // Jan 1, 2, 3
  expect(result[0].timestamp).toBe("2023-01-01");
  expect(result[0].value).toBe(100);
  expect(result[1].timestamp).toBe("2023-01-02");
  expect(result[1].value).toBe(100); // forward filled
  expect(result[2].timestamp).toBe("2023-01-03");
  expect(result[2].value).toBe(200);
});

Deno.test("upsample - PlainDate daily with backward fill (calendar path)", () => {
  const df = createDataFrame([
    { timestamp: NativeTemporal.PlainDate.from("2023-01-01"), value: 100 },
    { timestamp: NativeTemporal.PlainDate.from("2023-01-03"), value: 200 },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1D",
    fillMethod: "backward",
  });

  expect(result.nrows()).toBe(3);
  expect(result[1].value).toBe(200); // backward filled
});

Deno.test("upsample - PlainDate (polyfill)", () => {
  const df = createDataFrame([
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-01"), value: 100 },
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-03"), value: 200 },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1D",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(3);
});

Deno.test("upsample - PlainDate (polyfill) backward fill", () => {
  const df = createDataFrame([
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-01"), value: 100 },
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-03"), value: 200 },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1D",
    fillMethod: "backward",
  });

  expect(result.nrows()).toBe(3);
  expect(result[1].value).toBe(200); // backward filled
});

// =============================================================================
// PlainDateTime — calendar path
// =============================================================================

Deno.test("upsample - PlainDateTime hourly (calendar path)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-01T10:00:00"),
      value: 100,
    },
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-01T12:00:00"),
      value: 200,
    },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(3); // 10:00, 11:00, 12:00
  expect(result[0].timestamp).toBe("2023-01-01T10:00:00");
  expect(result[1].timestamp).toBe("2023-01-01T11:00:00");
  expect(result[1].value).toBe(100); // forward filled
  expect(result[2].timestamp).toBe("2023-01-01T12:00:00");
  expect(result[2].value).toBe(200);
});

Deno.test("upsample - PlainDateTime (polyfill)", () => {
  const df = createDataFrame([
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-01T10:00:00"),
      value: 100,
    },
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-01T12:00:00"),
      value: 200,
    },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(3);
  expect(result[0].timestamp).toBe("2023-01-01T10:00:00");
  expect(result[1].timestamp).toBe("2023-01-01T11:00:00");
  expect(result[1].value).toBe(100); // forward filled
  expect(result[2].timestamp).toBe("2023-01-01T12:00:00");
  expect(result[2].value).toBe(200);
});

// =============================================================================
// PlainTime — should throw (no date component)
// =============================================================================

Deno.test("upsample - PlainTime throws", () => {
  const df = createDataFrame([
    { timestamp: NativeTemporal.PlainTime.from("10:00:00"), value: 100 },
    { timestamp: NativeTemporal.PlainTime.from("12:00:00"), value: 200 },
  ]);

  expect(() =>
    df.upsample({
      timeColumn: "timestamp",
      frequency: "1H",
      fillMethod: "forward",
    })
  ).toThrow("PlainTime");
});
