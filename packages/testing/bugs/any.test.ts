import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("any", () => {
  const schema = z.object({
    a: z.number(),
  });
  // deno-lint-ignore no-explicit-any
  const data1: any = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }];
  const data = createDataFrame(data1, schema);
  expect(data).toBeDefined();
});
