import { createDataFrame } from "@tidy-ts/dataframe";
import type { DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("removeNull should narrow types when removing nulls", () => {
  const messages = createDataFrame([
    { id: 1, from_user_id: "user1", content: "Hello" },
    { id: 2, from_user_id: null, content: "Anonymous" },
    { id: 3, from_user_id: "user2", content: "Hi there" },
    { id: 4, from_user_id: null, content: "Guest message" },
    { id: 5, from_user_id: "user3", content: "Hey" },
  ]);

  // Remove null values
  const fromUserIds = messages.removeNull("from_user_id");

  console.log("Filtered messages (non-null from_user_id only):");
  fromUserIds.print();

  // This should now work - from_user_id should be narrowed to string
  const _typeCheck: DataFrame<
    { id: number; from_user_id: string; content: string }
  > = fromUserIds;

  expect(fromUserIds.nrows()).toBe(3);
  expect([...fromUserIds].every((r) => r.from_user_id !== null)).toBe(true);
});

Deno.test("removeUndefined should narrow type", () => {
  const data = createDataFrame([
    { id: 1, optional_field: "value1" },
    { id: 2, optional_field: undefined },
    { id: 3, optional_field: "value2" },
    { id: 4, optional_field: undefined },
  ]);

  const filtered = data.removeUndefined("optional_field");

  // Should be narrowed to string
  const _typeCheck: DataFrame<{ id: number; optional_field: string }> =
    filtered;

  expect(filtered.nrows()).toBe(2);
});

Deno.test("removeNA should remove both null and undefined", () => {
  const data = createDataFrame([
    { id: 1, value: "a" },
    { id: 2, value: null },
    { id: 3, value: undefined },
    { id: 4, value: "b" },
  ]);

  const filtered = data.removeNA("value");

  // Should be narrowed to string (no null or undefined)
  const _typeCheck: DataFrame<{ id: number; value: string }> = filtered;

  expect(filtered.nrows()).toBe(2);
  expect([...filtered].map((r) => r.value)).toEqual(["a", "b"]);
});

Deno.test("mutate already handles type narrowing correctly", () => {
  const data = createDataFrame([
    { id: 1, optional: "value1" },
    { id: 2, optional: null },
    { id: 3, optional: "value2" },
  ]);

  // Mutate already narrows types correctly
  const mutated = data.mutate({
    required: (r) => r.optional ?? "default",
  });

  // This should work - mutate infers the return type correctly
  const _typeCheck: DataFrame<{
    id: number;
    optional: string | null;
    required: string;
  }> = mutated;

  expect(mutated.nrows()).toBe(3);
  expect([...mutated].map((r) => r.required)).toEqual([
    "value1",
    "default",
    "value2",
  ]);
});
