import{j as e}from"./radix-BuIbRv-a.js";import{C as r}from"./code-block-B7aOnjQg.js";import{C as o,a as n,b as a,c as i,d}from"./card--XqZNj_C.js";import{D as s}from"./DocPageLayout-nEFeHVMt.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-jU-cbpu9.js";const t={innerJoin:`import { createDataFrame } from "@tidy-ts/dataframe";

const employees = createDataFrame([
  { emp_id: 1, name: "Alice", dept_id: 10 },
  { emp_id: 2, name: "Bob", dept_id: 20 },
  { emp_id: 3, name: "Charlie", dept_id: 10 },
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Marketing" },
]);

const joined = employees.innerJoin(departments, "dept_id");
joined.print("Inner join result:");`,leftJoin:`const employees = createDataFrame([
  { emp_id: 1, name: "Alice", dept_id: 10 },
  { emp_id: 2, name: "Bob", dept_id: 20 },
  { emp_id: 3, name: "Charlie", dept_id: 30 }, // No matching department
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Marketing" },
]);

const joined = employees.leftJoin(departments, "dept_id");
joined.print("Left join result:");`,multiKeyJoin:`const sales = createDataFrame([
  { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
  { year: 2023, quarter: "Q2", product: "Widget B", sales: 1500 },
]);

const targets = createDataFrame([
  { year: 2023, quarter: "Q1", product: "Widget A", target: 1200 },
  { year: 2023, quarter: "Q2", product: "Widget B", target: 1400 },
]);

const joined = sales.innerJoin(targets, ["year", "quarter", "product"]);
joined.print("Multi-key join result:");`,differentColumnNames:`const orders = createDataFrame([
  { order_id: 1, order_region: "North", order_product: "A", quantity: 10 },
  { order_id: 2, order_region: "South", order_product: "B", quantity: 20 },
]);

const inventory = createDataFrame([
  { inv_region: "North", inv_product: "A", stock: 100 },
  { inv_region: "South", inv_product: "B", stock: 200 },
]);

const joined = orders.innerJoin(inventory, {
  keys: {
    left: ["order_region", "order_product"],
    right: ["inv_region", "inv_product"],
  },
});

joined.print("Join with different column names:");`};function h(){return e.jsxs(s,{title:"Joining DataFrames",description:"Combine data from multiple sources with different join types, multi-key support, and strong type safety. Learn how to merge datasets effectively.",currentPath:"/joining-dataframes",children:[e.jsx(r,{title:"Basic Join Types",description:"Understanding the four fundamental join types",explanation:"Joining DataFrames lets you combine data from multiple sources. tidy-ts supports all standard join types with multi-key support and strong type safety.",code:t.innerJoin}),e.jsx(r,{title:"Single Key Joins",description:"Join DataFrames using a single column as the key",explanation:"Single key joins are the most common type. Each join type preserves different combinations of records from the left and right DataFrames.",code:t.leftJoin}),e.jsx(r,{title:"Multi-Key Joins",description:"Join using multiple columns for complex relationships",explanation:"Multi-key joins are great for complex data relationships where you need to match on multiple criteria. tidy-ts provides strong typing for all join scenarios.",code:t.multiKeyJoin}),e.jsx(r,{title:"Different Column Names",description:"Join DataFrames with different column names",explanation:"Real-world data often has different column names for the same concept. tidy-ts allows you to specify different column names for left and right DataFrames.",code:t.differentColumnNames}),e.jsx(r,{title:"Comprehensive Joins",description:"Complex joins with suffixes and multiple keys",explanation:"For complex data integration scenarios, you can use suffixes to distinguish between columns with the same name and join on multiple keys simultaneously.",code:t.differentColumnNames}),e.jsxs(o,{children:[e.jsxs(n,{children:[e.jsx(a,{children:"Join Type Rules"}),e.jsx(i,{children:"Understanding how different join types affect your data structure"})]}),e.jsx(d,{children:e.jsx("div",{className:"space-y-4",children:e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Join Type Rules"}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full border-collapse border border-gray-300 dark:border-gray-600",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-gray-50 dark:bg-gray-800",children:[e.jsx("th",{className:"border border-gray-300 dark:border-gray-600 p-3 text-left font-medium",children:"Join Type"}),e.jsx("th",{className:"border border-gray-300 dark:border-gray-600 p-3 text-left font-medium",children:"Result Type Pattern"}),e.jsx("th",{className:"border border-gray-300 dark:border-gray-600 p-3 text-left font-medium",children:"Description"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"Inner Join"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"L ∪ (R \\ K)"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 text-sm",children:"All fields required - only matching records"})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"Left Join"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"L ∪ (R \\ K)?"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 text-sm",children:"Right non-key fields: T | undefined"})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"Right Join"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"(L \\ K)? ∪ R"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 text-sm",children:"Left non-key fields: T | undefined"})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"Outer Join"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"(L \\ K)? ∪ (R \\ K)?"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 text-sm",children:"Both sides: T | undefined"})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"Cross Join"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm",children:"L ∪ R"}),e.jsx("td",{className:"border border-gray-300 dark:border-gray-600 p-3 text-sm",children:"All fields required (Cartesian product)"})]})]})]})}),e.jsxs("div",{className:"mt-3 text-sm text-gray-600 dark:text-gray-400",children:[e.jsxs("p",{children:[e.jsx("strong",{children:"Where:"})," ","L = Left DataFrame, R = Right DataFrame, K = Join keys"]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Note:"})," ","All joins use explicit undefined unions (T | undefined), never optional properties (T?)"]})]})]})})})]})]})}export{h as component};
