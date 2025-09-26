// Code examples for data visualization
export const dataVisualizationExamples = {
  interactiveScatterPlot: `import { createDataFrame } from "@tidy-ts/dataframe";

// Create sample sales data
const salesData = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "East", product: "Widget", quantity: 8, price: 100 },
  { region: "North", product: "Gadget", quantity: 15, price: 200 },
  { region: "South", product: "Gadget", quantity: 12, price: 200 },
]);

// Interactive scatter plot with configuration
const chart = salesData
  .mutate({
    revenue: (r) => r.quantity * r.price,
    profit: (r) => r.quantity * r.price * 0.2,
  })
  .graph({
    type: "scatter",
    mappings: {
      x: "revenue",
      y: "quantity",
      color: "region",
      size: "profit",
    },
    config: {
      layout: {
        title: "Sales Analysis",
        description: "Revenue vs quantity by region, sized by profit",
        width: 700,
        height: 400,
      },
      xAxis: {
        label: "Revenue ($)",
        domain: [0, 2200],
      },
      yAxis: {
        label: "Quantity",
        domain: [0, 25],
      },
      scatter: {
        pointSize: 100,
        pointOpacity: 0.8,
      },
      color: { scheme: "professional" },
      legend: {
        show: true,
        position: "right",
      },
      grid: {
        show: true,
      },
    }
  });`,

  chartExport: `// Export charts as PNG or SVG
await chart.savePNG({ filename: "sales-chart.png" });
await chart.saveSVG({ filename: "sales-chart.svg" });`,

  chartTypes: `// Different chart types available
const lineChart = salesData.graph({
  type: "line",
  mappings: { x: "quantity", y: "revenue", color: "region" }
});

const barChart = salesData.graph({
  type: "bar", 
  mappings: { x: "region", y: "revenue" }
});

const areaChart = salesData.graph({
  type: "area",
  mappings: { x: "quantity", y: "revenue", color: "region" }
});`,

  interactiveJupyter: `// Interactive chart with tooltips (Jupyter only)
const interactiveChart = salesData.graph({
  type: "scatter",
  mappings: { x: "revenue", y: "quantity", color: "region" },
  config: {
    layout: {
      tooltip: {
        show: true, // default true
      },
    },
    tooltip: {
      fields: ["region", "revenue", "quantity", "profit", "product"],
    },
  },
});

interactiveChart // Chart displays interactively in Jupyter cell`,

  colorSchemes: `// Color schemes and styling options
const styledChart = salesData.graph({
  type: "scatter",
  mappings: { x: "revenue", y: "quantity", color: "region" },
  config: {
    color: { 
      scheme: "professional" // Options: professional, viridis, plasma, turbo, etc.
    },
    scatter: {
      pointSize: 150,
      pointOpacity: 0.7,
    },
    layout: {
      width: 800,
      height: 500,
      title: "Styled Sales Chart",
    },
    legend: {
      show: true,
      position: "bottom", // top, bottom, left, right
    },
    grid: {
      show: true,
    },
  },
});`,
};