import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("fillBackward() - basic backward filling", () => {
  const df = createDataFrame([
    { value: null },
    { value: null },
    { value: 10 },
    { value: null },
    { value: 20 },
  ]);

  const filled = df.fillBackward("value");

  expect(filled[0].value).toBe(10); // filled from next
  expect(filled[1].value).toBe(10); // filled from next
  expect(filled[2].value).toBe(10);
  expect(filled[3].value).toBe(20); // filled from next
  expect(filled[4].value).toBe(20);
});

Deno.test("fillBackward() - nulls at end remain null", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: null },
    { value: null },
    { value: null },
  ]);

  const filled = df.fillBackward("value");

  expect(filled[0].value).toBe(10);
  expect(filled[1].value).toBe(null); // remains null
  expect(filled[2].value).toBe(null); // remains null
  expect(filled[3].value).toBe(null); // remains null
});

Deno.test("fillBackward() - all nulls remain null", () => {
  const df = createDataFrame([
    { value: null },
    { value: null },
    { value: null },
  ]);

  const filled = df.fillBackward("value");

  expect(filled[0].value).toBe(null);
  expect(filled[1].value).toBe(null);
  expect(filled[2].value).toBe(null);
});

Deno.test("fillBackward() - no nulls remain unchanged", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: 20 },
    { value: 30 },
  ]);

  const filled = df.fillBackward("value");

  expect(filled[0].value).toBe(10);
  expect(filled[1].value).toBe(20);
  expect(filled[2].value).toBe(30);
});

Deno.test("fillBackward() - handles undefined values", () => {
  const df = createDataFrame([
    { value: undefined },
    { value: null },
    { value: 10 },
    { value: undefined },
  ]);

  const filled = df.fillBackward("value");

  expect(filled[0].value).toBe(10); // filled from next
  expect(filled[1].value).toBe(10); // filled from next
  expect(filled[2].value).toBe(10);
  expect(filled[3].value).toBe(undefined); // remains undefined (no next value)
});

Deno.test("fillBackward() - multiple columns", () => {
  const df = createDataFrame([
    { a: null, b: null },
    { a: 1, b: "x" },
    { a: null, b: null },
    { a: 2, b: "y" },
  ]);

  const filled = df.fillBackward("a", "b");

  expect(filled[0].a).toBe(1); // filled
  expect(filled[0].b).toBe("x"); // filled
  expect(filled[1].a).toBe(1);
  expect(filled[1].b).toBe("x");
  expect(filled[2].a).toBe(2); // filled
  expect(filled[2].b).toBe("y"); // filled
  expect(filled[3].a).toBe(2);
  expect(filled[3].b).toBe("y");
});

Deno.test("fillBackward() - single row", () => {
  const df = createDataFrame([
    { value: 10 },
  ]);

  const filled = df.fillBackward("value");

  expect(filled[0].value).toBe(10);
  expect(filled.nrows()).toBe(1);
});

Deno.test("fillBackward() - empty DataFrame", () => {
  const schema = z.object({
    value: z.number().nullable(),
  });
  const df = createDataFrame([], schema);

  const filled = df.fillBackward("value");

  expect(filled.nrows()).toBe(0);
});

Deno.test("fillBackward() - falsy but non-null values preserved", () => {
  const df = createDataFrame([
    { value: null },
    { value: 0 },
    { value: null },
    { value: false },
    { value: null },
    { value: "" },
  ]);

  const filled = df.fillBackward("value");

  expect(filled[0].value).toBe(0); // filled from next
  expect(filled[1].value).toBe(0);
  expect(filled[2].value).toBe(false); // filled from next
  expect(filled[3].value).toBe(false);
  expect(filled[4].value).toBe(""); // filled from next
  expect(filled[5].value).toBe("");
});
