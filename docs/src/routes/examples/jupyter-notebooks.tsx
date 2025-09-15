import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../../components/ui/code-block.tsx";
import { DocPageLayout } from "../../components/layout/DocPageLayout.tsx";

// Import images properly for Vite
import denoVscodeExt from "../../assets/deno-vscode-ext.png";
import jupyterVscodeExt from "../../assets/jupyter-vscode-ext.png";
import ipynbDenoNotebook from "../../assets/ipynb-deno-notebook.png";

export const Route = createFileRoute("/examples/jupyter-notebooks" as any)({
  component: JupyterNotebooksComponent,
});

function JupyterNotebooksComponent() {
  return (
    <DocPageLayout
      title="Jupyter Notebooks with Tidy-TS"
      description="Interactive data analysis and visualization with Tidy-TS in Jupyter notebooks. Create rich, interactive visualizations and explore data with TypeScript."
      currentPath="/examples/jupyter-notebooks"
    >
      <CodeBlock
        title="Setup: Deno with Jupyter"
        description="Tidy-TS works seamlessly with Deno's built-in Jupyter kernel"
        explanation="As long as you have Deno installed, your VSCode or Cursor editor should automatically detect and use the Deno kernel for .ipynb files. No configuration files needed!"
        code={`// 1. Install Deno (if not already installed)
// Visit: https://docs.deno.com/runtime/getting_started/installation/

// 2. Install required VSCode extensions:
// - denoland.vscode-deno (for TypeScript support)
// - ms-toolsai.jupyter (for notebook support)

// 3. Create a .ipynb file and select the Deno kernel
// The kernel selector appears in the top-right corner`}
      />

      <div className="my-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Required Extensions
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Deno Extension</p>
            <img 
              src={denoVscodeExt} 
              alt="Deno extension in VSCode" 
              className="w-full max-w-2xl rounded border shadow-sm mb-2"
            />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Install the <code>denoland.vscode-deno</code> extension for TypeScript support and Deno integration.
            </p>
          </div>
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Jupyter Extension</p>
            <img 
              src={jupyterVscodeExt} 
              alt="Jupyter extension in VSCode" 
              className="w-full max-w-2xl rounded border shadow-sm mb-2"
            />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Install the <code>ms-toolsai.jupyter</code> extension for notebook support and interactive cells.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <img 
            src={ipynbDenoNotebook} 
            alt="Deno notebook in VSCode" 
            className="w-full max-w-3xl rounded border shadow-sm"
          />
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            Once both extensions are installed, create a <code>.ipynb</code> file and select the Deno kernel.
          </p>
        </div>
      </div>

      <CodeBlock
        title="Basic DataFrame Operations"
        description="Create and manipulate DataFrames in Jupyter cells"
        explanation="Jupyter notebooks provide an interactive environment perfect for data exploration. Each cell can contain code that runs independently, making it easy to experiment and iterate."
        code={`import { createDataFrame } from "@jsr/tidy-ts__dataframe";

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
console.log("Names and ages:", namesAndAges);`}
      />

      <CodeBlock
        title="Data Visualization"
        description="Create interactive charts and visualizations"
        explanation="Jupyter notebooks excel at combining code, data, and visualizations. You can create rich, interactive charts that update as you modify your data."
        code={`import { createDataFrame } from "@jsr/tidy-ts__dataframe";

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

console.log("Monthly totals:", monthlyTotals);`}
      />

      <CodeBlock
        title="Interactive Data Exploration"
        description="Real-time interactive visualizations in Jupyter"
        explanation="Jupyter notebooks with Tidy-TS enable instant, interactive data exploration. Every graph is live and responsive - zoom, pan, hover for details, and see your data come alive!"
        code={`import { createDataFrame, stats as s } from "@jsr/tidy-ts__dataframe";

// Galactic fleet data - explore the Star Wars universe!
const fleetData = createDataFrame([
  { ship: "X-wing", speed: 1050, firepower: 85, cost: 149999, faction: "Rebel", crew: 1 },
  { ship: "TIE Fighter", speed: 1200, firepower: 75, cost: 60000, faction: "Empire", crew: 1 },
  { ship: "Millennium Falcon", speed: 1050, firepower: 95, cost: 100000, faction: "Rebel", crew: 2 },
  { ship: "Star Destroyer", speed: 975, firepower: 200, cost: 150000000, faction: "Empire", crew: 37000 },
  { ship: "A-wing", speed: 1300, firepower: 80, cost: 175000, faction: "Rebel", crew: 1 },
  { ship: "TIE Interceptor", speed: 1250, firepower: 90, cost: 120000, faction: "Empire", crew: 1 },
]);

// Interactive scatter plot - hover to explore!
const fleetComparison = fleetData.graph({
  type: "scatter",
  mappings: {
    x: "speed",
    y: "firepower",
    color: "faction",
    size: "cost"
  },
  title: "Fleet Comparison: Speed vs Firepower",
  subtitle: "Size represents cost, color represents faction"
});

console.log("Interactive fleet comparison chart:", fleetComparison);`}
      />

      <CodeBlock
        title="Advanced Data Analysis"
        description="Perform complex data transformations and analysis"
        explanation="Jupyter notebooks allow you to build complex analysis step by step, with each cell building on the previous results. Perfect for exploratory data analysis and prototyping."
        code={`import { createDataFrame } from "@jsr/tidy-ts__dataframe";

// Load and process data
const rawData = createDataFrame([
  { id: 1, product: "Laptop", category: "Electronics", price: 999, quantity: 5 },
  { id: 2, product: "Mouse", category: "Electronics", price: 25, quantity: 20 },
  { id: 3, product: "Desk", category: "Furniture", price: 299, quantity: 3 },
  { id: 4, product: "Chair", category: "Furniture", price: 199, quantity: 8 }
]);

// Calculate revenue and filter high-value items
const analysis = rawData
  .mutate({
    revenue: row => row.price * row.quantity,
    isHighValue: row => row.price > 500
  })
  .filter(row => row.revenue > 1000)
  .arrange("revenue", "desc");

console.log("High-value products:", analysis);

// Group by category
const categorySummary = rawData
  .groupBy("category")
  .summarise({
    totalRevenue: "revenue",
    avgPrice: "price",
    totalQuantity: "quantity"
  });

console.log("Category summary:", categorySummary);`}
      />

      <CodeBlock
        title="Exporting Results"
        description="Save your analysis results to files"
        explanation="Once you've completed your analysis, you can easily export the results to various formats for sharing or further processing."
        code={`import { createDataFrame } from "@jsr/tidy-ts__dataframe";
import { writeCSV } from "@jsr/tidy-ts__dataframe";

// Your analysis results
const results = createDataFrame([
  { category: "Electronics", revenue: 10990, avgPrice: 512 },
  { category: "Furniture", revenue: 2393, avgPrice: 249 }
]);

// Export to CSV
await writeCSV(results, "analysis_results.csv");
console.log("Results exported to analysis_results.csv");

// You can also export to JSON
const jsonData = results.toJSON();
console.log("JSON data:", jsonData);

// Or get the raw data
const rawData = results.toArray();
console.log("Raw data:", rawData);`}
      />

      <CodeBlock
        title="Statistical Analysis"
        description="Perform statistical calculations and summaries"
        explanation="Jupyter notebooks are perfect for statistical analysis. You can easily calculate descriptive statistics, correlations, and other metrics while keeping your data and results organized."
        code={`import { createDataFrame, stats as s } from "@jsr/tidy-ts__dataframe";

// Sample dataset for analysis
const data = createDataFrame([
  { name: "Alice", age: 30, salary: 75000, department: "Engineering" },
  { name: "Bob", age: 25, salary: 65000, department: "Marketing" },
  { name: "Charlie", age: 35, salary: 85000, department: "Engineering" },
  { name: "Diana", age: 28, salary: 70000, department: "Sales" },
  { name: "Eve", age: 32, salary: 80000, department: "Engineering" }
]);

// Calculate descriptive statistics
const ageStats = data.summarise({
  meanAge: s.mean("age"),
  medianAge: s.median("age"),
  minAge: s.min("age"),
  maxAge: s.max("age"),
  stdAge: s.std("age")
});

console.log("Age statistics:", ageStats);

// Group by department and calculate salary statistics
const deptStats = data.groupBy("department").summarise({
  avgSalary: s.mean("salary"),
  medianSalary: s.median("salary"),
  count: s.count()
});

console.log("Department salary statistics:", deptStats);`}
      />
    </DocPageLayout>
  );
}