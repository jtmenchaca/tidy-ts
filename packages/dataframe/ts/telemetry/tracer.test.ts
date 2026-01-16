import { expect } from "@std/expect";
import { createDataFrame } from "../dataframe/index.ts";
import { tracer } from "./tracer.ts";

Deno.test("tracer - basic tracing lifecycle", () => {
  const data = [{ id: 1, value: 10 }];
  const df = createDataFrame(data, { trace: true });

  // Mutate operation should create trace spans
  const result = df.mutate({ doubled: (row) => row.value * 2 });

  // Verify trace context exists
  const context = tracer.getContext(result);
  expect(context).toBeDefined();
  expect(context?.enabled).toBe(true);

  // Verify spans were created
  const spans = tracer.getSpans(result);
  expect(spans.length).toBeGreaterThan(0);
  expect(spans[0].name).toBe("mutate");
  expect(spans[0].duration).toBeDefined();
});

Deno.test("tracer - chained operations preserve context", () => {
  const data = [{ id: 1, value: 10 }, { id: 2, value: 20 }];
  const df = createDataFrame(data, { trace: true });

  const result = df
    .mutate({ doubled: (row) => row.value * 2 })
    .filter((row) => row.doubled > 15);

  // Verify context flows through chain
  const context = tracer.getContext(result);
  expect(context?.enabled).toBe(true);

  // Verify nested spans exist
  const spans = tracer.getSpans(result);
  expect(spans.length).toBeGreaterThan(0);
  const rootSpan = spans[0];
  expect(rootSpan.name).toBe("mutate");

  // Filter should be nested under mutate
  const filterSpan = rootSpan.children.find((child) => child.name === "filter");
  expect(filterSpan).toBeDefined();
  expect(filterSpan?.duration).toBeDefined();
});

Deno.test("tracer - disabled by default", () => {
  const data = [{ id: 1, value: 10 }];
  const df = createDataFrame(data); // No trace option

  const result = df.mutate({ doubled: (row) => row.value * 2 });

  // No trace context should exist
  const context = tracer.getContext(result);
  expect(context).toBeUndefined();
});

Deno.test("tracer - metadata extraction", () => {
  const data = Array.from({ length: 100 }, (_, i) => ({ id: i, value: i }));
  const df = createDataFrame(data, { trace: true });

  const result = df.mutate({
    doubled: (row) => row.value * 2,
    category: (row) => row.value > 50 ? "high" : "low",
  });

  const spans = tracer.getSpans(result);
  const mutateSpan = spans[0];

  // Verify metadata was extracted
  expect(mutateSpan.metadata?.rows).toBe(100);
  expect(mutateSpan.metadata?.grouped).toBe(false);
  expect(mutateSpan.metadata?.columns).toEqual(["doubled", "category"]);
});

Deno.test("tracer - sub-spans timing", () => {
  const data = [{ id: 1, value: 10 }];
  const df = createDataFrame(data, { trace: true });

  const result = df.mutate({ doubled: (row) => row.value * 2 });

  const spans = tracer.getSpans(result);
  const mutateSpan = spans[0];

  // Verify sub-spans exist
  const subSpanNames = mutateSpan.children.map((child) => child.name);
  expect(subSpanNames).toContain("prepare-columns");
  expect(subSpanNames).toContain("process-ungrouped-mutations");
  expect(subSpanNames).toContain("handle-drops");
  expect(subSpanNames).toContain("create-updated-dataframe");

  // All sub-spans should have durations
  mutateSpan.children.forEach((child) => {
    expect(child.duration).toBeDefined();
    expect(child.duration).toBeGreaterThanOrEqual(0);
  });
});
