import { expect } from "@std/expect";

const T = Temporal;

// =============================================================================
// PlainDate calendar operations
// =============================================================================

Deno.test("PlainDate - since/until with days", () => {
  const a = T.PlainDate.from("2024-01-01");
  const b = T.PlainDate.from("2024-01-15");
  const dur = a.until(b);
  expect(dur.days).toBe(14);
  expect(dur.total({ unit: "days" })).toBe(14);
});

Deno.test("PlainDate - since/until with months", () => {
  const a = T.PlainDate.from("2024-01-01");
  const b = T.PlainDate.from("2024-04-01");

  const dur = a.until(b, { largestUnit: "months" });
  expect(dur.months).toBe(3);
  expect(dur.days).toBe(0);
});

Deno.test("PlainDate - since/until total days across months", () => {
  const a = T.PlainDate.from("2024-01-01");
  const b = T.PlainDate.from("2024-04-01");

  const dur = a.until(b);
  // Jan(31) + Feb(29, leap year) + Mar(31) = 91 days
  expect(dur.total({ unit: "days" })).toBe(91);
});

Deno.test("PlainDate - add duration", () => {
  const a = T.PlainDate.from("2024-01-01");
  const result = a.add({ days: 14 });
  expect(result.toString()).toBe("2024-01-15");
});

Deno.test("PlainDate - add months", () => {
  const a = T.PlainDate.from("2024-01-15");
  const result = a.add({ months: 1 });
  expect(result.toString()).toBe("2024-02-15");
});

Deno.test("PlainDate - subtract duration", () => {
  const a = T.PlainDate.from("2024-01-15");
  const result = a.subtract({ days: 14 });
  expect(result.toString()).toBe("2024-01-01");
});

Deno.test("PlainDate - with() to set specific fields (bucket floor)", () => {
  // Simulate monthly bucketing: set day to 1
  const d = T.PlainDate.from("2024-03-15");
  const monthFloor = d.with({ day: 1 });
  expect(monthFloor.toString()).toBe("2024-03-01");
});

Deno.test("PlainDate - with() to set year floor", () => {
  const d = T.PlainDate.from("2024-07-23");
  const yearFloor = d.with({ month: 1, day: 1 });
  expect(yearFloor.toString()).toBe("2024-01-01");
});

Deno.test("PlainDate - weekly bucketing via dayOfWeek + subtract", () => {
  // dayOfWeek: 1=Monday, 7=Sunday
  const d = T.PlainDate.from("2024-03-20"); // Wednesday
  expect(d.dayOfWeek).toBe(3); // Wednesday = 3
  const weekFloor = d.subtract({ days: d.dayOfWeek - 1 }); // back to Monday
  expect(weekFloor.toString()).toBe("2024-03-18");
  expect(weekFloor.dayOfWeek).toBe(1);
});

// =============================================================================
// PlainDateTime calendar operations
// =============================================================================

Deno.test("PlainDateTime - since/until with hours", () => {
  const a = T.PlainDateTime.from("2024-01-01T08:00:00");
  const b = T.PlainDateTime.from("2024-01-01T14:30:00");
  const dur = a.until(b);
  expect(dur.total({ unit: "hours" })).toBe(6.5);
});

Deno.test("PlainDateTime - add hours", () => {
  const a = T.PlainDateTime.from("2024-01-01T08:00:00");
  const result = a.add({ hours: 3 });
  expect(result.toString()).toBe("2024-01-01T11:00:00");
});

Deno.test("PlainDateTime - hourly bucketing via with()", () => {
  const dt = T.PlainDateTime.from("2024-01-01T14:37:22");
  const hourFloor = dt.with({
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  });
  expect(hourFloor.toString()).toBe("2024-01-01T14:00:00");
});

Deno.test("PlainDateTime - daily bucketing via with()", () => {
  const dt = T.PlainDateTime.from("2024-01-01T14:37:22");
  const dayFloor = dt.with({
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  });
  expect(dayFloor.toString()).toBe("2024-01-01T00:00:00");
});

Deno.test("PlainDateTime - toPlainDate strips time", () => {
  const dt = T.PlainDateTime.from("2024-03-15T14:30:00");
  const d = dt.toPlainDate();
  expect(d.toString()).toBe("2024-03-15");
});

// =============================================================================
// Key insight: can we use compare + add to iterate buckets?
// =============================================================================

Deno.test("PlainDate - iterate daily buckets via add + compare", () => {
  const start = T.PlainDate.from("2024-01-01");
  const end = T.PlainDate.from("2024-01-05");

  const buckets: string[] = [];
  let current = start;
  while (T.PlainDate.compare(current, end) <= 0) {
    buckets.push(current.toString());
    current = current.add({ days: 1 });
  }

  expect(buckets).toEqual([
    "2024-01-01",
    "2024-01-02",
    "2024-01-03",
    "2024-01-04",
    "2024-01-05",
  ]);
});

Deno.test("PlainDate - iterate monthly buckets via add + compare", () => {
  const start = T.PlainDate.from("2024-01-01");
  const end = T.PlainDate.from("2024-04-01");

  const buckets: string[] = [];
  let current = start;
  while (T.PlainDate.compare(current, end) <= 0) {
    buckets.push(current.toString());
    current = current.add({ months: 1 });
  }

  expect(buckets).toEqual([
    "2024-01-01",
    "2024-02-01",
    "2024-03-01",
    "2024-04-01",
  ]);
});

Deno.test("PlainDate - iterate weekly buckets", () => {
  const start = T.PlainDate.from("2024-01-01"); // Monday
  const end = T.PlainDate.from("2024-01-22");

  const buckets: string[] = [];
  let current = start;
  while (T.PlainDate.compare(current, end) <= 0) {
    buckets.push(current.toString());
    current = current.add({ weeks: 1 });
  }

  expect(buckets).toEqual([
    "2024-01-01",
    "2024-01-08",
    "2024-01-15",
    "2024-01-22",
  ]);
});

Deno.test("PlainDateTime - iterate hourly buckets via add + compare", () => {
  const start = T.PlainDateTime.from("2024-01-01T08:00:00");
  const end = T.PlainDateTime.from("2024-01-01T12:00:00");

  const buckets: string[] = [];
  let current = start;
  while (T.PlainDateTime.compare(current, end) <= 0) {
    buckets.push(current.toString());
    current = current.add({ hours: 1 });
  }

  expect(buckets).toEqual([
    "2024-01-01T08:00:00",
    "2024-01-01T09:00:00",
    "2024-01-01T10:00:00",
    "2024-01-01T11:00:00",
    "2024-01-01T12:00:00",
  ]);
});

// =============================================================================
// PlainDate floor bucketing
// =============================================================================

Deno.test("PlainDate - floor to week (Monday)", () => {
  const dates = [
    "2024-03-18", // Monday
    "2024-03-19", // Tuesday
    "2024-03-20", // Wednesday
    "2024-03-24", // Sunday
  ];

  const floored = dates.map((d) => {
    const pd = T.PlainDate.from(d);
    return pd.subtract({ days: pd.dayOfWeek - 1 }).toString();
  });

  expect(floored).toEqual([
    "2024-03-18",
    "2024-03-18",
    "2024-03-18",
    "2024-03-18",
  ]);
});

Deno.test("PlainDate - floor to month", () => {
  const dates = ["2024-03-15", "2024-03-01", "2024-03-31"];
  const floored = dates.map((d) =>
    T.PlainDate.from(d).with({ day: 1 }).toString()
  );
  expect(floored).toEqual(["2024-03-01", "2024-03-01", "2024-03-01"]);
});

Deno.test("PlainDate - floor to quarter", () => {
  const quarterFloor = (d: Temporal.PlainDate) => {
    const qMonth = Math.floor((d.month - 1) / 3) * 3 + 1;
    return d.with({ month: qMonth, day: 1 });
  };

  expect(quarterFloor(T.PlainDate.from("2024-02-15")).toString()).toBe(
    "2024-01-01",
  );
  expect(quarterFloor(T.PlainDate.from("2024-05-15")).toString()).toBe(
    "2024-04-01",
  );
  expect(quarterFloor(T.PlainDate.from("2024-08-15")).toString()).toBe(
    "2024-07-01",
  );
  expect(quarterFloor(T.PlainDate.from("2024-11-15")).toString()).toBe(
    "2024-10-01",
  );
});

// =============================================================================
// String representation as bucket key
// =============================================================================

Deno.test("PlainDate toString is deterministic and orderable", () => {
  const a = T.PlainDate.from("2024-01-01");
  const b = T.PlainDate.from("2024-06-15");
  // ISO strings sort lexicographically correctly for dates
  expect(a.toString() < b.toString()).toBe(true);
});

Deno.test("PlainDateTime toString is deterministic and orderable", () => {
  const a = T.PlainDateTime.from("2024-01-01T08:00:00");
  const b = T.PlainDateTime.from("2024-01-01T16:00:00");
  expect(a.toString() < b.toString()).toBe(true);
});
