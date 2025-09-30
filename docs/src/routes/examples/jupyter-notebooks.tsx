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
      description="Interactive data analysis and visualization with Tidy-TS in Jupyter notebooks."
      currentPath="/examples/jupyter-notebooks"
    >
      <CodeBlock
        title="Setup: Deno with Jupyter"
        description="Tidy-TS works with Deno's built-in Jupyter kernel"
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
        title="Data Visualization"
        description="Create interactive charts and visualizations"
        explanation="Jupyter notebooks are great for exploring data and visualizing it."
        code={`import { createDataFrame } from "jsr:@tidy-ts/dataframe";

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

console.log("Monthly totals:", monthlyTotals);`}
      />

      <CodeBlock
        title="Interactive Charts"
        description="Create interactive visualizations with hover tooltips"
        explanation="In Jupyter notebooks, charts automatically display with interactivity when you reference the chart object."
        code={`import { createDataFrame } from "jsr:@tidy-ts/dataframe";

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

interactiveChart // Chart displays interactively in Jupyter cell`}
      />


    </DocPageLayout>
  );
}