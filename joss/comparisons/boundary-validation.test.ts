/**
 * Runtime Boundary Validation Tests for Tidy-TS
 *
 * Companion to type-guarantee-audit.types.test.ts (which is compile-time only).
 * This file runs and validates that runtime behavior matches the type-level claims:
 *
 *  - Zod schema validation rejects malformed data at construction time
 *  - append/prepend reject invalid rows at runtime
 *  - fillForward/fillBackward leave leading/trailing nulls intact
 *  - Operations on empty DataFrames preserve schema guarantees
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════
// 1. ZOD SCHEMA REJECTION — malformed data at construction
// ═══════════════════════════════════════════════════════════════════════

const schema = z.object({
  id: z.number(),
  name: z.string(),
  active: z.boolean(),
});

Deno.test("Zod rejects wrong scalar type", () => {
  expect(() =>
    createDataFrame(
      // @ts-ignore — deliberately passing wrong type to test runtime
      [{ id: "not-a-number", name: "Alice", active: true }],
      schema,
    )
  ).toThrow();
});

Deno.test("Zod rejects missing required column", () => {
  expect(() =>
    createDataFrame(
      // @ts-ignore — deliberately missing column
      [{ id: 1, name: "Alice" }],
      schema,
    )
  ).toThrow();
});

Deno.test("Zod rejects null in non-nullable column", () => {
  expect(() =>
    createDataFrame(
      // @ts-ignore — deliberately passing null
      [{ id: 1, name: null, active: true }],
      schema,
    )
  ).toThrow();
});

Deno.test("Zod rejects invalid enum value", () => {
  const enumSchema = z.object({
    status: z.enum(["active", "inactive", "pending"]),
    count: z.number(),
  });
  expect(() =>
    createDataFrame(
      // @ts-ignore — deliberately passing invalid enum
      [{ status: "deleted", count: 5 }],
      enumSchema,
    )
  ).toThrow();
});

Deno.test("Zod accepts valid data", () => {
  const df = createDataFrame(
    [{ id: 1, name: "Alice", active: true }],
    schema,
  );
  expect(df.nrows()).toBe(1);
});

Deno.test("Zod accepts nullable column with null value", () => {
  const nullableSchema = z.object({
    id: z.number(),
    value: z.number().nullable(),
  });
  const df = createDataFrame(
    [{ id: 1, value: null }],
    nullableSchema,
  );
  expect(df.nrows()).toBe(1);
  const rows = df.toArray();
  expect(rows[0].value).toBe(null);
});

// ═══════════════════════════════════════════════════════════════════════
// 2. APPEND/PREPEND RUNTIME VALIDATION
// ═══════════════════════════════════════════════════════════════════════

Deno.test("append adds a valid row", () => {
  const df = createDataFrame([{ id: 1, name: "Alice" }]);
  const result = df.append({ id: 2, name: "Bob" });
  expect(result.nrows()).toBe(2);
});

Deno.test("prepend adds a valid row at the start", () => {
  const df = createDataFrame([{ id: 1, name: "Alice" }]);
  const result = df.prepend({ id: 0, name: "Eve" });
  expect(result.nrows()).toBe(2);
  expect(result.toArray()[0].id).toBe(0);
});

// ═══════════════════════════════════════════════════════════════════════
// 3. FILL FORWARD/BACKWARD — leading/trailing null behavior
// ═══════════════════════════════════════════════════════════════════════

Deno.test("fillForward leaves leading nulls intact", () => {
  const df = createDataFrame(
    [
      { t: 1, price: null as number | null },
      { t: 2, price: null as number | null },
      { t: 3, price: 100 as number | null },
      { t: 4, price: null as number | null },
    ],
    z.object({ t: z.number(), price: z.number().nullable() }),
  );
  const filled = df.fillForward("price");
  const rows = filled.toArray();

  // Leading nulls remain — no prior value to fill from
  expect(rows[0].price).toBe(null);
  expect(rows[1].price).toBe(null);
  // Non-null value preserved
  expect(rows[2].price).toBe(100);
  // Trailing null filled from prior value
  expect(rows[3].price).toBe(100);
});

Deno.test("fillBackward leaves trailing nulls intact", () => {
  const df = createDataFrame(
    [
      { t: 1, price: null as number | null },
      { t: 2, price: 100 as number | null },
      { t: 3, price: null as number | null },
      { t: 4, price: null as number | null },
    ],
    z.object({ t: z.number(), price: z.number().nullable() }),
  );
  const filled = df.fillBackward("price");
  const rows = filled.toArray();

  // Leading null filled from next value
  expect(rows[0].price).toBe(100);
  // Non-null value preserved
  expect(rows[1].price).toBe(100);
  // Trailing nulls remain — no subsequent value to fill from
  expect(rows[2].price).toBe(null);
  expect(rows[3].price).toBe(null);
});

Deno.test("fillForward fills interior nulls", () => {
  const df = createDataFrame(
    [
      { t: 1, price: 50 as number | null },
      { t: 2, price: null as number | null },
      { t: 3, price: null as number | null },
      { t: 4, price: 200 as number | null },
    ],
    z.object({ t: z.number(), price: z.number().nullable() }),
  );
  const filled = df.fillForward("price");
  const rows = filled.toArray();

  expect(rows[0].price).toBe(50);
  expect(rows[1].price).toBe(50);
  expect(rows[2].price).toBe(50);
  expect(rows[3].price).toBe(200);
});

// ═══════════════════════════════════════════════════════════════════════
// 4. EMPTY DATAFRAME OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

Deno.test("operations on empty DataFrame produce empty DataFrame", () => {
  const full = createDataFrame([{ id: 1, name: "Alice" }]);
  const df = full.filter(() => false); // empty but typed
  expect(df.nrows()).toBe(0);
  expect(df.filter((r) => r.id > 0).nrows()).toBe(0);
  expect(df.select("id").nrows()).toBe(0);
  expect(df.mutate({ doubled: (r) => r.id * 2 }).nrows()).toBe(0);
  expect(df.arrange("id", "asc").nrows()).toBe(0);
});

// ═══════════════════════════════════════════════════════════════════════
// 5. REMOVE NULL / REPLACE NULL — runtime narrowing
// ═══════════════════════════════════════════════════════════════════════

Deno.test("removeNull drops rows with null values", () => {
  const df = createDataFrame(
    [
      { id: 1, value: "a" },
      { id: 2, value: null },
      { id: 3, value: "c" },
    ],
    z.object({ id: z.number(), value: z.string().nullable() }),
  );
  const cleaned = df.removeNull("value");
  expect(cleaned.nrows()).toBe(2);
  const values = cleaned.extract("value");
  expect(values).toEqual(["a", "c"]);
});

Deno.test("replaceNull substitutes null with provided value", () => {
  const df = createDataFrame(
    [
      { id: 1, value: 10 },
      { id: 2, value: null },
    ],
    z.object({ id: z.number(), value: z.number().nullable() }),
  );
  const cleaned = df.replaceNull({ value: 0 });
  const values = cleaned.extract("value");
  expect(values).toEqual([10, 0]);
});

// ═══════════════════════════════════════════════════════════════════════
// 6. APPEND/PREPEND RUNTIME REJECTION — schema mismatch via cast
// ═══════════════════════════════════════════════════════════════════════

Deno.test("append rejects row missing a required column at runtime", () => {
  const df = createDataFrame([{ id: 1, name: "Alice" }]);
  expect(() =>
    df.append({ id: 2 } as unknown as { id: number; name: string })
  ).toThrow();
});

Deno.test("prepend rejects row missing a required column at runtime", () => {
  const df = createDataFrame([{ id: 1, name: "Alice" }]);
  expect(() =>
    df.prepend({ id: 0 } as unknown as { id: number; name: string })
  ).toThrow();
});

Deno.test("append rejects row with wrong column type at runtime", () => {
  const df = createDataFrame([{ id: 1, name: "Alice" }]);
  expect(() =>
    df.append({ id: 2, name: 42 } as unknown as { id: number; name: string })
  ).toThrow();
});

Deno.test("prepend rejects row with wrong column type at runtime", () => {
  const df = createDataFrame([{ id: 1, name: "Alice" }]);
  expect(() =>
    df.prepend({ id: 0, name: 42 } as unknown as { id: number; name: string })
  ).toThrow();
});
