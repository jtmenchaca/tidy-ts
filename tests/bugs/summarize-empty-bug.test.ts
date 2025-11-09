import { concatDataFrames, createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";

const impressionSchema = z.object({
  order_proc_id: z.number(),
  line: z.number(),
  impression: z.string().nullable(),
});

Deno.test("summarize with empty data", () => {
  const examplePapDF1 = createDataFrame([], impressionSchema);
  const examplePapDF2 = createDataFrame([], impressionSchema);

  const papDFArray = [examplePapDF1, examplePapDF2];

  const concatenated = concatDataFrames(papDFArray);

  const concatenatedSummary = concatenated
    .groupBy("order_proc_id")
    .summarize({
      impression: (g) => g.impression.join("\n"),
    });

  concatenated.print();
  console.log("concatenated.nrows():", concatenated.nrows());
  console.log("concatenated.ncols():", concatenated.ncols());
  console.log("concatenated.columns():", concatenated.columns());

  concatenatedSummary.print();
  console.log("concatenatedSummary.nrows():", concatenatedSummary.nrows());
  console.log("concatenatedSummary.ncols():", concatenatedSummary.ncols());
  console.log("concatenatedSummary.columns():", concatenatedSummary.columns());

  expect(concatenatedSummary.nrows()).toBe(0);
  expect(concatenatedSummary.ncols()).toBe(2);
  expect(concatenatedSummary.columns()).toEqual([
    "order_proc_id",
    "impression",
  ]);
});

Deno.test("summarize ungrouped with empty data", () => {
  const examplePapDF1 = createDataFrame([], impressionSchema);
  const examplePapDF2 = createDataFrame([], impressionSchema);

  const papDFArray = [examplePapDF1, examplePapDF2];

  const concatenated = concatDataFrames(papDFArray);

  const concatenatedSummary = concatenated
    .summarize({
      impression: (g) => g.impression.join("\n"),
    });

  concatenatedSummary.print();
  console.log("concatenatedSummary.nrows():", concatenatedSummary.nrows());
  console.log("concatenatedSummary.ncols():", concatenatedSummary.ncols());
  console.log("concatenatedSummary.columns():", concatenatedSummary.columns());

  expect(concatenatedSummary.nrows()).toBe(1);
  expect(concatenatedSummary.ncols()).toBe(1);
  expect(concatenatedSummary.columns()).toEqual([
    "impression",
  ]);
});

Deno.test("filter with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").filter((row) => row.line > 0);

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});

Deno.test("mutate with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").mutate({
    line_doubled: (row) => row.line * 2,
  });

  expect(result.columns()).toContain("line_doubled");
  expect(result.nrows()).toBe(0);
});

Deno.test("distinct with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").distinct(
    "order_proc_id",
    "line",
    "impression",
  );

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});

Deno.test("slice with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").slice(0, 1);

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});

Deno.test("slice_head with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").sliceHead(2);

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});

Deno.test("slice_tail with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").sliceTail(2);

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});

Deno.test("slice_min with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").sliceMin("line", 1);

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});

Deno.test("slice_max with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").sliceMax("line", 1);

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});

Deno.test("slice_sample with empty grouped DataFrame", () => {
  const empty = createDataFrame([], impressionSchema);
  const result = empty.groupBy("order_proc_id").sample(2);

  expect(result.columns()).toEqual(["order_proc_id", "line", "impression"]);
  expect(result.nrows()).toBe(0);
});
