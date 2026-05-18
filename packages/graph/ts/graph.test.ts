import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { graph, graphReact } from "./graph.ts";

Deno.test("graph - scatter chart returns widget with save methods", () => {
  const df = createDataFrame([
    { x: 1, y: 10, category: "A" },
    { x: 2, y: 20, category: "B" },
    { x: 3, y: 30, category: "A" },
  ]);

  const chart = graph({
    df,
    type: "scatter",
    mappings: { x: "x", y: "y", color: "category" },
  });

  expect(typeof chart.saveSVG).toBe("function");
  expect(typeof chart.savePNG).toBe("function");
});

Deno.test("graph - line chart with config", () => {
  const df = createDataFrame([
    { date: 1, value: 100 },
    { date: 2, value: 150 },
    { date: 3, value: 200 },
  ]);

  const chart = graph({
    df,
    type: "line",
    mappings: { x: "date", y: "value" },
    config: {
      layout: { title: "Trend", width: 800, height: 400 },
      line: { style: "monotone", strokeWidth: 3 },
    },
  });

  expect(chart).toBeDefined();
  expect(typeof chart.saveSVG).toBe("function");
});

Deno.test("graph - bar chart with series", () => {
  const df = createDataFrame([
    { region: "North", quantity: 10, year: "2024" },
    { region: "South", quantity: 20, year: "2024" },
    { region: "North", quantity: 15, year: "2025" },
    { region: "South", quantity: 25, year: "2025" },
  ]);

  const chart = graph({
    df,
    type: "bar",
    mappings: { x: "region", y: "quantity", series: "year" },
    config: { bar: { stacked: true } },
  });

  expect(chart).toBeDefined();
});

Deno.test("graph - area chart", () => {
  const df = createDataFrame([
    { x: 1, y: 10 },
    { x: 2, y: 15 },
    { x: 3, y: 12 },
  ]);

  const chart = graph({
    df,
    type: "area",
    mappings: { x: "x", y: "y" },
    config: { area: { opacity: 0.5 } },
  });

  expect(chart).toBeDefined();
});

Deno.test("graphReact - returns spec and data separately", () => {
  const df = createDataFrame([
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);

  const result = graphReact({
    df,
    type: "scatter",
    mappings: { x: "x", y: "y" },
  });

  expect(result.data).toHaveLength(2);
  expect(result.data[0]).toEqual({ x: 1, y: 10 });
  expect(result.spec).toBeDefined();
  expect(result.spec.mark).toBeDefined();
  expect(result.spec.encoding.x.field).toBe("x");
  expect(result.spec.encoding.y.field).toBe("y");
});

Deno.test("graphReact - scatter spec contains correct mark", () => {
  const df = createDataFrame([{ x: 1, y: 1 }]);
  const { spec } = graphReact({
    df,
    type: "scatter",
    mappings: { x: "x", y: "y" },
  });
  expect(spec.mark.type).toBe("point");
});

Deno.test("graphReact - line spec contains line mark", () => {
  const df = createDataFrame([{ x: 1, y: 1 }]);
  const { spec } = graphReact({
    df,
    type: "line",
    mappings: { x: "x", y: "y" },
  });
  expect(spec.mark.type).toBe("line");
});

Deno.test("graphReact - bar spec contains bar mark", () => {
  const df = createDataFrame([{ x: "A", y: 1 }]);
  const { spec } = graphReact({
    df,
    type: "bar",
    mappings: { x: "x", y: "y" },
  });
  expect(spec.mark.type).toBe("bar");
});

Deno.test("graphReact - area spec contains area mark", () => {
  const df = createDataFrame([{ x: 1, y: 1 }]);
  const { spec } = graphReact({
    df,
    type: "area",
    mappings: { x: "x", y: "y" },
  });
  expect(spec.mark.type).toBe("area");
});

Deno.test("graph - accessor function as mapping", () => {
  const df = createDataFrame([
    { a: 1, b: 2 },
    { a: 3, b: 4 },
  ]);

  const { data } = graphReact({
    df,
    type: "scatter",
    mappings: {
      x: (row) => row.a * 10,
      y: (row) => row.b * 10,
    },
  });

  expect(data[0].x).toBe(10);
  expect(data[1].x).toBe(30);
});

Deno.test("graph - SVG export produces a file", async () => {
  const df = createDataFrame([
    { name: "Alice", score: 85 },
    { name: "Bob", score: 92 },
  ]);

  const chart = graph({
    df,
    type: "bar",
    mappings: { x: "name", y: "score" },
  });

  const tmpFile = await Deno.makeTempFile({ suffix: ".svg" });
  try {
    await chart.saveSVG({ filename: tmpFile, width: 400, height: 300 });
    const content = await Deno.readTextFile(tmpFile);
    expect(content).toContain("<svg");
    expect(content).toContain("</svg>");
  } finally {
    await Deno.remove(tmpFile);
  }
});

Deno.test("graph - PNG export produces a file", async () => {
  const df = createDataFrame([
    { name: "Alice", score: 85 },
    { name: "Bob", score: 92 },
  ]);

  const chart = graph({
    df,
    type: "bar",
    mappings: { x: "name", y: "score" },
  });

  const tmpFile = await Deno.makeTempFile({ suffix: ".png" });
  try {
    await chart.savePNG({ filename: tmpFile, width: 400, height: 300 });
    const bytes = await Deno.readFile(tmpFile);
    // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);
    expect(bytes.length).toBeGreaterThan(100);
  } finally {
    await Deno.remove(tmpFile);
  }
});
