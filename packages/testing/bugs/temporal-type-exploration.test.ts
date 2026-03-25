import { expect } from "@std/expect";

// Explore the actual runtime shape of Temporal types to inform our duck-typing

Deno.test("PlainDate - available properties", () => {
  const d = Temporal.PlainDate.from("2023-06-15");

  // Calendar properties
  expect(typeof d.year).toBe("number");
  expect(typeof d.month).toBe("number");
  expect(typeof d.day).toBe("number");
  expect(typeof d.dayOfWeek).toBe("number");

  // Does NOT have time properties
  expect("hour" in d).toBe(false);
  expect("minute" in d).toBe(false);
  expect("second" in d).toBe(false);

  // Does NOT have epoch
  expect("epochMilliseconds" in d).toBe(false);

  // Methods
  expect(typeof d.with).toBe("function");
  expect(typeof d.add).toBe("function");
  expect(typeof d.subtract).toBe("function");
  expect(typeof d.toString).toBe("function");
  // deno-lint-ignore no-explicit-any
  expect(typeof (d.constructor as any).compare).toBe("function");

  // with() returns PlainDate (extra fields silently ignored)
  const floored = d.with({ month: 1, day: 1 });
  expect(floored.toString()).toBe("2023-01-01");
});

Deno.test("PlainDateTime - available properties", () => {
  const dt = Temporal.PlainDateTime.from("2023-06-15T14:30:45");

  // Calendar properties
  expect(typeof dt.year).toBe("number");
  expect(typeof dt.month).toBe("number");
  expect(typeof dt.day).toBe("number");
  expect(typeof dt.dayOfWeek).toBe("number");

  // HAS time properties
  expect("hour" in dt).toBe(true);
  expect("minute" in dt).toBe(true);
  expect("second" in dt).toBe(true);
  expect(typeof dt.hour).toBe("number");
  expect(typeof dt.minute).toBe("number");
  expect(typeof dt.second).toBe("number");
  expect(typeof dt.millisecond).toBe("number");
  expect(typeof dt.microsecond).toBe("number");
  expect(typeof dt.nanosecond).toBe("number");

  // Does NOT have epoch
  expect("epochMilliseconds" in dt).toBe(false);

  // with() can zero out time
  const floored = dt.with({
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  });
  expect(floored.toString()).toBe("2023-06-15T00:00:00");

  // Floor to start of month
  const monthStart = dt.with({
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  });
  expect(monthStart.toString()).toBe("2023-06-01T00:00:00");
});

Deno.test("PlainTime - available properties", () => {
  const t = Temporal.PlainTime.from("14:30:45");

  // Does NOT have calendar properties
  expect("year" in t).toBe(false);
  expect("month" in t).toBe(false);
  expect("day" in t).toBe(false);
  expect("dayOfWeek" in t).toBe(false);

  // HAS time properties
  expect("hour" in t).toBe(true);

  // Does NOT have epoch
  expect("epochMilliseconds" in t).toBe(false);

  // HAS compare
  // deno-lint-ignore no-explicit-any
  expect(typeof (t.constructor as any).compare).toBe("function");
});

Deno.test("Instant - available properties", () => {
  const inst = Temporal.Instant.from("2023-06-15T14:30:45Z");

  // Does NOT have calendar properties
  expect("year" in inst).toBe(false);
  expect("month" in inst).toBe(false);

  // HAS epoch
  expect("epochMilliseconds" in inst).toBe(true);
  expect(typeof inst.epochMilliseconds).toBe("number");
});

Deno.test("PlainDate.until().total() for distance", () => {
  const a = Temporal.PlainDate.from("2023-01-01");
  const b = Temporal.PlainDate.from("2023-01-04");

  // until() returns a Duration
  const dur = a.until(b);
  expect(typeof dur.total).toBe("function");

  // total() with unit gives numeric distance
  const days = dur.total({ unit: "days" });
  expect(days).toBe(3);

  // What about without largestUnit?
  const dur2 = a.until(b);
  const days2 = dur2.total({ unit: "days" });
  expect(days2).toBe(3);
});

Deno.test("PlainDateTime.until().total() for distance", () => {
  const a = Temporal.PlainDateTime.from("2023-01-01T00:00:00");
  const b = Temporal.PlainDateTime.from("2023-01-01T06:00:00");

  const dur = a.until(b);
  const hours = dur.total({ unit: "hours" });
  expect(hours).toBe(6);
});

Deno.test("isComparable narrowing check - what does value look like after isComparable?", () => {
  const d = Temporal.PlainDate.from("2023-01-01");

  // After isComparable, value is narrowed to Comparable { constructor: { compare } }
  // But we need to check "year" in value — does this work on the original object?
  // The issue is TypeScript narrowing, not runtime

  // At runtime, "in" works fine on any object
  expect("year" in d).toBe(true);
  expect("year" in (d as object)).toBe(true);

  // The key insight: after isComparable narrows to Comparable,
  // we can cast to `object` for the `in` check
  const val: unknown = d;
  if (
    val != null &&
    typeof val === "object" &&
    "year" in val &&
    "month" in val &&
    "day" in val
  ) {
    // This works! TypeScript is fine with `in` on `object`
    expect(true).toBe(true);
  }
});
