import{j as e}from"./radix-BuIbRv-a.js";import{C as a}from"./code-block-D947jj47.js";import{C as s,a as r,b as o,c as t,d as n}from"./card-zfR3GFa3.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-lQ5cgthg.js";function p(){return e.jsx("div",{className:"flex-1 p-8 overflow-y-auto",children:e.jsxs("div",{className:"max-w-4xl mx-auto space-y-8",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4",children:"Comprehensive Workflows"}),e.jsx("p",{className:"text-lg text-gray-600 dark:text-gray-400",children:"Real-world data analysis workflows that combine all tidy-ts features. These examples show how to use the library effectively."})]}),e.jsx(a,{title:"Complete Data Analysis Pipeline",description:"A complete workflow combining all major tidy-ts operations",explanation:"This example demonstrates a complete data analysis workflow from data loading through transformation, filtering, grouping, and summarization.",code:`import { createDataFrame, stats as s, readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

// 1. Load and validate data
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  city: z.string(),
  score: z.number(),
});

const csvData = \`name,age,city,score
Alice,25,New York,85
Bob,30,Los Angeles,92
Carol,28,Chicago,78
Dave,35,Houston,88\`;

const people = await readCSV(csvData, PersonSchema);

// 2. Complete analysis pipeline
const analysis = people
  // Transform data
  .mutate({
    age_group: (row) => {
      if (row.age < 25) return "Young";
      if (row.age < 35) return "Adult";
      return "Senior";
    },
    score_category: (row) => {
      if (row.score >= 90) return "Excellent";
      if (row.score >= 80) return "Good";
      if (row.score >= 70) return "Fair";
      return "Poor";
    },
    z_score: (row, _index, df) => {
      const mean = s.mean(df.score);
      const std = s.stdev(df.score);
      return s.round((row.score - mean) / std, 3);
    },
  })
  // Filter data
  .filter((row) => row.score >= 80)
  // Group and summarize
  .groupBy("age_group")
  .summarise({
    count: (group) => group.nrows(),
    avg_score: (group) => s.round(s.mean(group.score), 2),
    max_score: (group) => s.max(group.score),
    min_score: (group) => s.min(group.score),
    score_std: (group) => s.round(s.stdev(group.score), 2),
  })
  // Sort results
  .arrange("avg_score", "desc");

analysis.print("Complete analysis results:");`}),e.jsx(a,{title:"Async Data Enrichment Workflow",description:"Handling asynchronous operations in a real-world data pipeline",explanation:"This workflow shows how to handle asynchronous operations like API calls and data validation while maintaining type safety and performance.",code:`// Simulate external API calls
async function fetchRegionalBonus(region: string): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  const bonuses = { "North": 1.2, "South": 1.1, "East": 1.15, "West": 1.05 };
  return bonuses[region as keyof typeof bonuses] || 1.0;
}

async function validateDataQuality(score: number): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return score >= 0 && score <= 100;
}

// Sales data
const salesData = createDataFrame([
  { id: 1, region: "North", product: "Widget A", sales: 1000, quarter: "Q1" },
  { id: 2, region: "South", product: "Widget B", sales: 800, quarter: "Q1" },
  { id: 3, region: "East", product: "Widget A", sales: 1200, quarter: "Q1" },
  { id: 4, region: "West", product: "Widget B", sales: 900, quarter: "Q1" },
]);

// Complete async workflow
const enrichedAnalysis = await salesData
  .mutate({
    // Sync operations
    product_category: (row) => row.product.includes("A") ? "Category A" : "Category B",
    
    // Async operations
    regional_bonus: async (row) => await fetchRegionalBonus(row.region),
    is_valid_sale: async (row) => await validateDataQuality(row.sales),
  })
  .filter(async (row) => await row.is_valid_sale)
  .mutate({
    adjusted_sales: (row) => row.sales * row.regional_bonus,
    performance_tier: (row) => {
      if (row.adjusted_sales >= 1200) return "High";
      if (row.adjusted_sales >= 900) return "Medium";
      return "Low";
    },
  })
  .groupBy("region")
  .summarise({
    total_sales: (group) => s.sum(group.sales),
    total_adjusted: (group) => s.sum(group.adjusted_sales),
    avg_bonus: (group) => s.round(s.mean(group.regional_bonus), 3),
    high_performance_count: (group) => 
      group.filter((row) => row.performance_tier === "High").nrows(),
  })
  .arrange("total_adjusted", "desc");

enrichedAnalysis.print("Async enriched analysis:");`}),e.jsx(a,{title:"Data Quality and Cleaning Pipeline",description:"Comprehensive data cleaning and quality assessment",explanation:"This workflow demonstrates comprehensive data quality assessment and cleaning, including missing data analysis and intelligent imputation strategies.",code:`// Messy real-world data
const messyData = createDataFrame([
  { id: 1, name: "Alice", age: 25, score: 85, active: true, notes: "Great" },
  { id: 2, name: null, age: 30, score: null, active: true, notes: "Missing score" },
  { id: 3, name: "Charlie", age: null, score: 92, active: false, notes: null },
  { id: 4, name: "Diana", age: 28, score: NaN, active: null, notes: "NaN score" },
  { id: 5, name: "Eve", age: 35, score: 78, active: true, notes: undefined },
  { id: 6, name: "", age: 0, score: 88, active: false, notes: "Empty string" },
]);

// Data quality assessment
const qualityAnalysis = messyData
  .mutate({
    // Missing data indicators
    name_missing: (row) => row.name === null || row.name === undefined || row.name === "" ? 1 : 0,
    age_missing: (row) => row.age === null || row.age === undefined ? 1 : 0,
    score_missing: (row) => row.score === null || row.score === undefined || isNaN(row.score) ? 1 : 0,
    active_missing: (row) => row.active === null || row.active === undefined ? 1 : 0,
    notes_missing: (row) => row.notes === null || row.notes === undefined ? 1 : 0,
  })
  .summarise({
    total_rows: (df) => df.nrows(),
    name_missing: (df) => s.sum(df.name_missing),
    age_missing: (df) => s.sum(df.age_missing),
    score_missing: (df) => s.sum(df.score_missing),
    active_missing: (df) => s.sum(df.active_missing),
    notes_missing: (df) => s.sum(df.notes_missing),
  })
  .mutate({
    name_missing_pct: (row) => s.round((row.name_missing / row.total_rows) * 100, 1),
    age_missing_pct: (row) => s.round((row.age_missing / row.total_rows) * 100, 1),
    score_missing_pct: (row) => s.round((row.score_missing / row.total_rows) * 100, 1),
    active_missing_pct: (row) => s.round((row.active_missing / row.total_rows) * 100, 1),
    notes_missing_pct: (row) => s.round((row.notes_missing / row.total_rows) * 100, 1),
  });

qualityAnalysis.print("Data quality analysis:");

// Clean the data
const cleanedData = messyData
  .mutate({
    // Smart replacement using statistics
    name_cleaned: (row) => row.name || \`Person_\${row.id}\`,
    age_cleaned: (row) => {
      if (row.age !== null && row.age !== undefined) return row.age;
      return row.active ? 30 : 25; // Different defaults based on other data
    },
    score_cleaned: (row) => {
      if (row.score !== null && row.score !== undefined && !isNaN(row.score)) {
        return row.score;
      }
      // Use median for missing scores
      const validScores = messyData.score.filter(x => x !== null && x !== undefined && !isNaN(x));
      return s.median(validScores, true);
    },
    active_cleaned: (row) => row.active ?? true,
    notes_cleaned: (row) => row.notes || "No additional notes",
  })
  .select("id", "name_cleaned", "age_cleaned", "score_cleaned", "active_cleaned", "notes_cleaned");

cleanedData.print("Cleaned data:");`}),e.jsxs(s,{children:[e.jsxs(r,{children:[e.jsx(o,{children:"Advanced Joining and Reshaping"}),e.jsx(t,{children:"Complex data integration and reshaping workflows"})]}),e.jsx(n,{children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Multi-Table Analysis"}),e.jsx(a,{code:`// Employee and department data
const employees = createDataFrame([
  { emp_id: 1, name: "Alice", dept_id: 10, year: 2023, salary: 50000 },
  { emp_id: 2, name: "Bob", dept_id: 20, year: 2023, salary: 60000 },
  { emp_id: 3, name: "Charlie", dept_id: 10, year: 2024, salary: 55000 },
  { emp_id: 4, name: "Diana", dept_id: 30, year: 2023, salary: 70000 },
]);

const departments = createDataFrame([
  { dept_id: 10, year: 2023, dept_name: "Engineering", manager: "John" },
  { dept_id: 20, year: 2023, dept_name: "Marketing", manager: "Jane" },
  { dept_id: 10, year: 2024, dept_name: "Engineering", manager: "Sarah" },
]);

// Multi-key join and analysis
const departmentAnalysis = employees
  .innerJoin(departments, ["dept_id", "year"])
  .mutate({
    salary_rank: (row, _index, df) => s.rank(df.salary, row.salary),
    salary_percentile: (row, _index, df) => s.percentileRank(df.salary, row.salary),
  })
  .groupBy("dept_name")
  .summarise({
    employee_count: (group) => group.nrows(),
    avg_salary: (group) => s.round(s.mean(group.salary), 0),
    median_salary: (group) => s.median(group.salary),
    salary_range: (group) => \`\${s.min(group.salary)}-\${s.max(group.salary)}\`,
    top_earner: (group) => {
      const maxSalary = s.max(group.salary);
      return group.find(row => row.salary === maxSalary)?.name || "N/A";
    },
  })
  .arrange("avg_salary", "desc");

departmentAnalysis.print("Department analysis:");`})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Data Reshaping and Pivoting"}),e.jsx(a,{code:`// Sales data in long format
const salesLong = createDataFrame([
  { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
  { year: 2023, quarter: "Q1", product: "Widget B", sales: 1500 },
  { year: 2023, quarter: "Q2", product: "Widget A", sales: 1200 },
  { year: 2023, quarter: "Q2", product: "Widget B", sales: 1800 },
  { year: 2024, quarter: "Q1", product: "Widget A", sales: 1100 },
  { year: 2024, quarter: "Q1", product: "Widget B", sales: 1600 },
]);

// Pivot to wide format and analyze
const pivotAnalysis = salesLong
  .pivotWider({
    names_from: "product",
    values_from: "sales",
    expected_columns: ["Widget A", "Widget B"],
  })
  .mutate({
    total_sales: (row) => row["Widget A"] + row["Widget B"],
    widget_a_share: (row) => s.round((row["Widget A"] / row.total_sales) * 100, 1),
    widget_b_share: (row) => s.round((row["Widget B"] / row.total_sales) * 100, 1),
    growth_rate: (row, index, df) => {
      if (index === 0) return 0;
      const prevRow = df[index - 1];
      return s.round(((row.total_sales - prevRow.total_sales) / prevRow.total_sales) * 100, 1);
    },
  })
  .arrange("year", "quarter");

pivotAnalysis.print("Pivot analysis with market share:");`})]})]})})]})]})})}export{p as component};
