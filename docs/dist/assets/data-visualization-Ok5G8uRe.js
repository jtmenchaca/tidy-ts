import{j as t}from"./radix-BuIbRv-a.js";import{C as e}from"./code-block-Cz0k2CH2.js";import{C as r,a as i,b as s,c as o,d as n}from"./card-BO96Vfv_.js";import{D as c}from"./DocPageLayout-NzwZwcAy.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-B7qsQQY4.js";const a={interactiveScatterPlot:`import { createDataFrame } from "@tidy-ts/dataframe";

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
  });`,chartExport:`// Export charts as PNG or SVG
await chart.savePNG({ filename: "sales-chart.png" });
await chart.saveSVG({ filename: "sales-chart.svg" });`,chartTypes:`// Different chart types available
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
});`,interactiveJupyter:`// Interactive chart with tooltips (Jupyter only)
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

interactiveChart // Chart displays interactively in Jupyter cell`,colorSchemes:`// Color schemes and styling options
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
});`};function x(){return t.jsxs(c,{title:"Data Visualization",description:"Create charts with an integrated API backed by Vega",currentPath:"/data-visualization",children:[t.jsx(e,{title:"Interactive Scatter Plot",description:"Create interactive charts directly from DataFrames",explanation:"Tidy-TS provides data visualization tools directly from DataFrames backed by Vega. Configure mappings, styling, and interactivity with a simple API.",code:a.interactiveScatterPlot}),t.jsx(e,{title:"Chart Export",description:"Export charts as PNG or SVG files",explanation:"Charts can be exported to common image formats for use in reports, presentations, or web applications.",code:a.chartExport}),t.jsxs(r,{children:[t.jsxs(i,{children:[t.jsx(s,{children:"Chart Types & Features"}),t.jsx(o,{children:"Available chart types and styling options"})]}),t.jsx(n,{children:t.jsxs("div",{className:"space-y-4",children:[t.jsx("div",{children:t.jsxs("p",{className:"text-sm text-muted-foreground mb-4",children:[t.jsx("strong",{children:"Chart Types:"})," scatter, line, bar, area",t.jsx("br",{}),t.jsx("strong",{children:"Aesthetics:"})," color, size, series, tooltips, legends",t.jsx("br",{}),t.jsx("strong",{children:"Styling:"})," 9 color schemes, custom themes, interactive features"]})}),t.jsx(e,{title:"Different Chart Types",description:"Examples of line, bar, and area charts",code:a.chartTypes}),t.jsx(e,{title:"Color Schemes and Styling",description:"Customize appearance with color schemes and styling options",code:a.colorSchemes})]})})]}),t.jsxs(r,{children:[t.jsxs(i,{children:[t.jsx(s,{children:"Interactive Charts in Jupyter"}),t.jsx(o,{children:"When using Deno and Jupyter notebooks, charts become interactive with hover tooltips"})]}),t.jsxs(n,{children:[t.jsx("p",{className:"mb-4",children:"Charts display interactively in Jupyter cells with features like hover tooltips for enhanced data exploration."}),t.jsx(e,{title:"Jupyter Integration",description:"Interactive charts with tooltips in Jupyter notebooks",code:a.interactiveJupyter})]})]})]})}export{x as component};
