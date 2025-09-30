import{j as e}from"./radix-BuIbRv-a.js";import{C as t}from"./code-block-_BwUP3j2.js";import{D as a}from"./DocPageLayout-CGQ1Zr89.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-djngM638.js";import"./index-COi4_aVs.js";import"./shiki-themes-BheiPiei.js";const o="/tidy-ts/assets/deno-vscode-ext-ytcApPCR.png",r="/tidy-ts/assets/jupyter-vscode-ext-Cg8h8q6O.png",s="/tidy-ts/assets/ipynb-deno-notebook-DLXER-Rk.png";function h(){return e.jsxs(a,{title:"Jupyter Notebooks with Tidy-TS",description:"Interactive data analysis and visualization with Tidy-TS in Jupyter notebooks.",currentPath:"/examples/jupyter-notebooks",children:[e.jsx(t,{title:"Setup: Deno with Jupyter",description:"Tidy-TS works with Deno's built-in Jupyter kernel",explanation:"As long as you have Deno installed, your VSCode or Cursor editor should automatically detect and use the Deno kernel for .ipynb files. No configuration files needed!",code:`// 1. Install Deno (if not already installed)
// Visit: https://docs.deno.com/runtime/getting_started/installation/

// 2. Install required VSCode extensions:
// - denoland.vscode-deno (for TypeScript support)
// - ms-toolsai.jupyter (for notebook support)

// 3. Create a .ipynb file and select the Deno kernel
// The kernel selector appears in the top-right corner`}),e.jsxs("div",{className:"my-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800",children:[e.jsx("h3",{className:"text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4",children:"Required Extensions"}),e.jsxs("div",{className:"grid md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-medium text-blue-900 dark:text-blue-100 mb-2",children:"Deno Extension"}),e.jsx("img",{src:o,alt:"Deno extension in VSCode",className:"w-full max-w-2xl rounded border shadow-sm mb-2"}),e.jsxs("p",{className:"text-sm text-blue-700 dark:text-blue-300",children:["Install the ",e.jsx("code",{children:"denoland.vscode-deno"})," extension for TypeScript support and Deno integration."]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium text-blue-900 dark:text-blue-100 mb-2",children:"Jupyter Extension"}),e.jsx("img",{src:r,alt:"Jupyter extension in VSCode",className:"w-full max-w-2xl rounded border shadow-sm mb-2"}),e.jsxs("p",{className:"text-sm text-blue-700 dark:text-blue-300",children:["Install the ",e.jsx("code",{children:"ms-toolsai.jupyter"})," extension for notebook support and interactive cells."]})]})]}),e.jsxs("div",{className:"mt-4",children:[e.jsx("img",{src:s,alt:"Deno notebook in VSCode",className:"w-full max-w-3xl rounded border shadow-sm"}),e.jsxs("p",{className:"text-sm text-blue-700 dark:text-blue-300 mt-2",children:["Once both extensions are installed, create a ",e.jsx("code",{children:".ipynb"})," file and select the Deno kernel."]})]})]}),e.jsx(t,{title:"Basic DataFrame Operations",description:"Create and manipulate DataFrames in Jupyter cells",explanation:"Jupyter notebooks provide an interactive environment perfect for data exploration. Each cell can contain code that runs independently, making it easy to experiment and iterate.",code:`import { createDataFrame } from "@jsr/tidy-ts__dataframe";

// Create a DataFrame from sample data
const df = createDataFrame([
  { name: "Alice", age: 30, city: "New York" },
  { name: "Bob", age: 25, city: "San Francisco" },
  { name: "Charlie", age: 35, city: "Chicago" }
]);

// Display the DataFrame
console.log(df);

// Basic operations
const youngPeople = df.filter(row => row.age < 30);
console.log("Young people:", youngPeople);

// Select specific columns
const namesAndAges = df.select("name", "age");
console.log("Names and ages:", namesAndAges);`}),e.jsx(t,{title:"Data Visualization",description:"Create interactive charts and visualizations",explanation:"Jupyter notebooks excel at combining code, data, and visualizations. You can create rich, interactive charts that update as you modify your data.",code:`import { createDataFrame } from "@jsr/tidy-ts__dataframe";

// Sample sales data
const salesData = createDataFrame([
  { month: "Jan", sales: 1000, profit: 200 },
  { month: "Feb", sales: 1200, profit: 300 },
  { month: "Mar", sales: 1100, profit: 250 },
  { month: "Apr", sales: 1300, profit: 400 },
  { month: "May", sales: 1400, profit: 500 }
]);

// Calculate profit margin
const withMargin = salesData.mutate({
  profitMargin: row => (row.profit / row.sales * 100).toFixed(1) + "%"
});

console.log("Sales data with profit margin:", withMargin);

// Group by month and calculate totals
const monthlyTotals = salesData.groupBy("month").summarise({
  totalSales: "sales",
  totalProfit: "profit"
});

console.log("Monthly totals:", monthlyTotals);`}),e.jsx(t,{title:"Interactive Charts with Tooltips",description:"Create interactive visualizations with hover tooltips",explanation:"In Jupyter notebooks, charts automatically display with interactive tooltips when you reference the chart object.",code:`import { createDataFrame } from "@jsr/tidy-ts__dataframe";

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
