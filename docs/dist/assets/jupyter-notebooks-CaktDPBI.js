import{j as t}from"./radix-BuIbRv-a.js";import{C as e}from"./code-block-Cz0k2CH2.js";import{D as o}from"./DocPageLayout-NzwZwcAy.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-BO96Vfv_.js";import"./index-B7qsQQY4.js";import"./shiki-themes-BheiPiei.js";const a="/tidy-ts/assets/deno-vscode-ext-ytcApPCR.png",r="/tidy-ts/assets/jupyter-vscode-ext-Cg8h8q6O.png",s="/tidy-ts/assets/ipynb-deno-notebook-DLXER-Rk.png";function h(){return t.jsxs(o,{title:"Jupyter Notebooks with Tidy-TS",description:"Interactive data analysis and visualization with Tidy-TS in Jupyter notebooks.",currentPath:"/examples/jupyter-notebooks",children:[t.jsx(e,{title:"Setup: Deno with Jupyter",description:"Tidy-TS works with Deno's built-in Jupyter kernel",explanation:"As long as you have Deno installed, your VSCode or Cursor editor should automatically detect and use the Deno kernel for .ipynb files. No configuration files needed!",code:`// 1. Install Deno (if not already installed)
// Visit: https://docs.deno.com/runtime/getting_started/installation/

// 2. Install required VSCode extensions:
// - denoland.vscode-deno (for TypeScript support)
// - ms-toolsai.jupyter (for notebook support)

// 3. Create a .ipynb file and select the Deno kernel
// The kernel selector appears in the top-right corner`}),t.jsxs("div",{className:"my-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800",children:[t.jsx("h3",{className:"text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4",children:"Required Extensions"}),t.jsxs("div",{className:"grid md:grid-cols-2 gap-6",children:[t.jsxs("div",{children:[t.jsx("p",{className:"font-medium text-blue-900 dark:text-blue-100 mb-2",children:"Deno Extension"}),t.jsx("img",{src:a,alt:"Deno extension in VSCode",className:"w-full max-w-2xl rounded border shadow-sm mb-2"}),t.jsxs("p",{className:"text-sm text-blue-700 dark:text-blue-300",children:["Install the ",t.jsx("code",{children:"denoland.vscode-deno"})," extension for TypeScript support and Deno integration."]})]}),t.jsxs("div",{children:[t.jsx("p",{className:"font-medium text-blue-900 dark:text-blue-100 mb-2",children:"Jupyter Extension"}),t.jsx("img",{src:r,alt:"Jupyter extension in VSCode",className:"w-full max-w-2xl rounded border shadow-sm mb-2"}),t.jsxs("p",{className:"text-sm text-blue-700 dark:text-blue-300",children:["Install the ",t.jsx("code",{children:"ms-toolsai.jupyter"})," extension for notebook support and interactive cells."]})]})]}),t.jsxs("div",{className:"mt-4",children:[t.jsx("img",{src:s,alt:"Deno notebook in VSCode",className:"w-full max-w-3xl rounded border shadow-sm"}),t.jsxs("p",{className:"text-sm text-blue-700 dark:text-blue-300 mt-2",children:["Once both extensions are installed, create a ",t.jsx("code",{children:".ipynb"})," file and select the Deno kernel."]})]})]}),t.jsx(e,{title:"Data Visualization",description:"Create interactive charts and visualizations",explanation:"Jupyter notebooks are great for exploring data and visualizing it.",code:`import { createDataFrame } from "jsr:@tidy-ts/dataframe";

// Sample sales data
const salesData = createDataFrame([
  { month: "Jan", sales: 1000, profit: 200 },
  { month: "Feb", sales: 1200, profit: 300 },
  { month: "Mar", sales: 1100, profit: 250 },
  { month: "Apr", sales: 1300, profit: 400 },
  { month: "May", sales: 1400, profit: 500 }
]);

// Calculate profit margin
const withMargin = salesData
  .mutate({
    profitMargin: row => (row.profit / row.sales * 100).toFixed(1) + "%"
  });

console.log("Sales data with profit margin:", withMargin);

// Group by month and calculate totals
const monthlyTotals = salesData
  .groupBy("month")
  .summarize({
    totalSales: "sales",
    totalProfit: "profit"
  });

console.log("Monthly totals:", monthlyTotals);`}),t.jsx(e,{title:"Interactive Charts",description:"Create interactive visualizations with hover tooltips",explanation:"In Jupyter notebooks, charts automatically display with interactivity when you reference the chart object.",code:`import { createDataFrame } from "jsr:@tidy-ts/dataframe";

// Create sample sales data
const salesData = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "East", product: "Widget", quantity: 8, price: 100 },
  { region: "North", product: "Gadget", quantity: 15, price: 200 },
  { region: "South", product: "Gadget", quantity: 12, price: 200 },
]);

// Interactive scatter plot with configuration
const interactiveChart = salesData
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
    },
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

interactiveChart // Chart displays interactively in Jupyter cell`})]})}export{h as component};
