import { expect } from "@std/expect";
import { vegaLiteWidget } from "./scatter-widget.ts";

Deno.test("vegaLiteWidget - creates widget with basic data", () => {
  const testData = [
    { x: 10, y: 20, cat: "A" },
    { x: 15, y: 35, cat: "A" },
    { x: 25, y: 15, cat: "B" },
  ];

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    mark: { type: "point", filled: true, size: 80 },
    encoding: {
      x: { field: "x", type: "quantitative" },
      y: { field: "y", type: "quantitative" },
      color: { field: "cat", type: "nominal" },
    },
  };

  const widget = vegaLiteWidget(testData, spec);

  // Test that widget is created with correct state
  expect(widget).toBeDefined();
  expect(widget.get("data")).toBe(JSON.stringify(testData));
  expect(widget.get("spec")).toBe(JSON.stringify(spec));
});

Deno.test("vegaLiteWidget - handles empty data array", () => {
  // deno-lint-ignore no-explicit-any
  const emptyData: any[] = [];
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    mark: "point",
    encoding: {
      x: { field: "x", type: "quantitative" },
      y: { field: "y", type: "quantitative" },
    },
  };

  const widget = vegaLiteWidget(emptyData, spec);

  expect(widget).toBeDefined();
  expect(widget.get("data")).toBe("[]");
});

Deno.test("vegaLiteWidget - preserves complex spec configuration", () => {
  const data = [
    { x: 1, y: 2, z: 3 },
    { x: 4, y: 5, z: 6 },
  ];

  const complexSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    mark: { type: "point", filled: true, size: 100 },
    params: [
      { name: "zoom", select: { type: "interval", bind: "scales" } },
    ],
    encoding: {
      x: {
        field: "x",
        type: "quantitative",
        title: "X Variable",
        scale: { domain: [0, 10] },
      },
      y: {
        field: "y",
        type: "quantitative",
        title: "Y Variable",
        scale: { domain: [0, 10] },
      },
      color: { field: "z", type: "quantitative" },
      tooltip: [{ field: "x" }, { field: "y" }, { field: "z" }],
    },
    title: "Complex Scatter Plot",
    height: 400,
    width: 600,
    config: {
      background: "white",
      view: { stroke: "transparent" },
      axis: {
        labelColor: "#374151",
        titleColor: "#111827",
        gridColor: "#E5E7EB",
      },
    },
  };

  const widget = vegaLiteWidget(data, complexSpec);

  const parsedSpec = JSON.parse(widget.get("spec"));
  expect(parsedSpec.mark.type).toBe("point");
  expect(parsedSpec.params).toHaveLength(1);
  expect(parsedSpec.encoding.x.title).toBe("X Variable");
  expect(parsedSpec.config.background).toBe("white");
});

Deno.test("vegaLiteWidget - widget has required functions", () => {
  const data = [{ x: 1, y: 2 }];
  const spec = {
    mark: "point",
    encoding: { x: { field: "x" }, y: { field: "y" } },
  };

  const widget = vegaLiteWidget(data, spec);

  // Check widget structure
  expect(typeof widget).toBe("object");
  expect(widget.get("data")).toBeDefined();
  expect(widget.get("spec")).toBeDefined();
  expect(typeof widget.get).toBe("function");
  expect(typeof widget.set).toBe("function");
});

Deno.test("vegaLiteWidget - handles numeric, string, and date data types", () => {
  const mixedData = [
    { x: 10, y: 20, cat: "Group A", date: new Date("2024-01-01") },
    { x: 15, y: 25, cat: "Group B", date: new Date("2024-01-02") },
    { x: 20, y: 30, cat: "Group A", date: new Date("2024-01-03") },
  ];

  const spec = {
    mark: "point",
    encoding: {
      x: { field: "x", type: "quantitative" },
      y: { field: "y", type: "quantitative" },
      color: { field: "cat", type: "nominal" },
      shape: { field: "date", type: "temporal" },
    },
  };

  const widget = vegaLiteWidget(mixedData, spec);

  const parsedData = JSON.parse(widget.get("data"));
  expect(parsedData).toHaveLength(3);
  expect(parsedData[0].x).toBe(10);
  expect(parsedData[0].cat).toBe("Group A");
  // Date will be serialized to ISO string
  expect(typeof parsedData[0].date).toBe("string");
});

Deno.test("vegaLiteWidget - widget has data and spec properties", () => {
  const data = [{ x: 1, y: 2 }];
  const spec = { mark: "point" };

  const widget = vegaLiteWidget(data, spec);

  expect(widget.get("data")).toBeDefined();
  expect(widget.get("spec")).toBeDefined();
  expect(JSON.parse(widget.get("data"))).toEqual(data);
});

Deno.test("vegaLiteWidget - handles null and undefined values in data", () => {
  const dataWithNulls = [
    { x: 10, y: 20, cat: "A" },
    { x: null, y: 25, cat: "B" },
    { x: 20, y: undefined, cat: "A" },
    { x: 25, y: 30, cat: null },
  ];

  const spec = {
    mark: "point",
    encoding: {
      x: { field: "x", type: "quantitative" },
      y: { field: "y", type: "quantitative" },
      color: { field: "cat", type: "nominal" },
    },
  };

  const widget = vegaLiteWidget(dataWithNulls, spec);

  const parsedData = JSON.parse(widget.get("data"));
  expect(parsedData).toHaveLength(4);
  expect(parsedData[1].x).toBe(null);
  expect(parsedData[2].y).toBe(undefined);
  expect(parsedData[3].cat).toBe(null);
});

Deno.test("vegaLiteWidget - preserves color scheme configuration", () => {
  const data = [
    { x: 1, y: 2, group: "A" },
    { x: 2, y: 3, group: "B" },
  ];

  const customColors = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

  const spec = {
    mark: "point",
    encoding: {
      x: { field: "x", type: "quantitative" },
      y: { field: "y", type: "quantitative" },
      color: { field: "group", type: "nominal" },
    },
    config: {
      range: {
        category: customColors,
      },
    },
  };

  const widget = vegaLiteWidget(data, spec);

  const parsedSpec = JSON.parse(widget.get("spec"));
  expect(parsedSpec.config.range.category).toEqual(customColors);
});
