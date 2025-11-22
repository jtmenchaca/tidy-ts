export interface ExampleEntry {
  name: string;
  description: string;
  code: string;
  category: string;
}

export const EXAMPLES: Record<string, ExampleEntry> = {
  "getting-started": {
    name: "Getting Started",
    description: "Basic DataFrame creation and operations",
    category: "basics",
    code: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Create a DataFrame from an array of objects
const sales = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "East", product: "Widget", quantity: 8, price: 100 },
]);

// Transform data with mutate
const analysis = sales
  .mutate({
    revenue: (r) => r.quantity * r.price,
    totalTax: (r) => {
      const taxRate = 0.08;
      const taxPerItem = taxRate * r.price;
      return taxPerItem * r.quantity;
    },
    row_number: (_row, index) => index,
    moreQuantityThanAvg: (row, _index, df) =>
      row.quantity > s.mean(df.quantity),
  })
  .groupBy("region")
  .summarize({
    total_revenue: (group) => s.sum(group.revenue),
    avg_quantity: (group) => s.mean(group.quantity),
    product_count: (group) => group.nrows(),
  })
  .arrange("total_revenue", "desc");

analysis.print("Sales Analysis by Region:");

// Create DataFrame from columns
const salesFromColumns = createDataFrame({
  columns: {
    region: ["North", "South", "East"],
    product: ["Widget", "Widget", "Widget"],
    quantity: [10, 20, 8],
    price: [100, 100, 100],
  },
});

// Access properties
console.log(\`Rows: \${sales.nrows()}, Cols: \${sales.ncols()}\`);
console.log("Columns:", sales.columns());`,
  },
  "creating-dataframes": {
    name: "Creating DataFrames",
    description: "Different ways to create DataFrames from data",
    category: "basics",
    code: `import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// Create from array of objects
const jediKnights = createDataFrame([
  {
    id: 1,
    name: "Luke Skywalker",
    species: "Human",
    homeworld: "Tatooine",
    lightsaber_color: "blue",
    rank: "Jedi Knight",
  },
  {
    id: 2,
    name: "Obi-Wan Kenobi",
    species: "Human",
    homeworld: "Stewjon",
    lightsaber_color: "blue",
    rank: "Jedi Master",
  },
  {
    id: 3,
    name: "Yoda",
    species: "Unknown",
    homeworld: "Unknown",
    lightsaber_color: "green",
    rank: "Grand Master",
  },
]);

jediKnights.print("Jedi Knights DataFrame:");

// TypeScript type safety
type Character = {
  id: number;
  name: string;
  species: string;
  mass: number;
  height: number;
};

const characters: Character[] = [
  { id: 6, name: "Leia", species: "Human", mass: 49, height: 150 },
  { id: 7, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
];

const typedDf = createDataFrame(characters);
const _typeCheck: DataFrame<Character> = typedDf;

// Access column data
const heights = typedDf.extract("height");
console.log("Heights:", heights);`,
  },
  "reading-writing-files": {
    name: "Reading & Writing Files",
    description: "CSV, XLSX, JSON, Parquet, and Arrow I/O operations",
    category: "io",
    code:
      `import { createDataFrame, readCSV, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

// Read CSV from string (or file path)
const csvString = \`name,age,city
Alice,25,New York
Bob,30,San Francisco
Charlie,35,Boston\`;

const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  city: z.string(),
});

const data = await readCSV(csvString, PersonSchema);
data.print("People Data:");

// Read from file path (Node.js/Deno)
// const data = await readCSV("./data.csv", PersonSchema);

// Write CSV
await writeCSV(data, "./output.csv");

// Read back
const readBack = await readCSV(
  "./output.csv",
  PersonSchema,
);

console.log(\`Read back \${readBack.nrows()} rows\`);

// Example with nullable fields
const SalesSchema = z.object({
  id: z.number(),
  product: z.string(),
  quantity: z.number().nullable(),
  price: z.number(),
});

const salesCsv = \`id,product,quantity,price
1,Widget,10,100
2,Gadget,,150
3,Thing,5,200\`;

const sales = await readCSV(salesCsv, SalesSchema, {
  naValues: [""],
});
sales.print("Sales with Missing Values:");`,
  },
  "dataframe-basics": {
    name: "DataFrame Basics",
    description: "Core DataFrame operations and methods",
    category: "basics",
    code: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const jediKnights = createDataFrame([
  { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
  { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
]);

// Properties
console.log(\`Rows: \${jediKnights.nrows()}\`);
console.log(\`Cols: \${jediKnights.ncols()}\`);
console.log("Columns:", jediKnights.columns());
console.log("Empty?", jediKnights.isEmpty());

// Column access
const names = jediKnights.name;
const masses = jediKnights.mass;
const species = jediKnights.species;

console.log("Names:", Array.from(names));
console.log("Masses:", Array.from(masses));
console.log("Unique species:", s.unique(species));

// Extract methods
const allNames = jediKnights.extract("name");
console.log("All names:", allNames);

const firstJedi = jediKnights.extractHead("name", 1);
console.log("First:", firstJedi);

const lastJedi = jediKnights.extractTail("name", 1);
console.log("Last:", lastJedi);

// Row access
console.log("First row:", jediKnights[0]);
console.log("Last row:", jediKnights[jediKnights.nrows() - 1]);`,
  },
  "selecting-columns": {
    name: "Selecting Columns",
    description: "Select, drop, and work with columns",
    category: "manipulation",
    code: `import { createDataFrame } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Alice", age: 25, city: "NYC", salary: 50000 },
  { id: 2, name: "Bob", age: 30, city: "LA", salary: 60000 },
  { id: 3, name: "Charlie", age: 35, city: "NYC", salary: 70000 },
]);

// Select specific columns
const basic = people.select(["name", "age"]);
basic.print("Selected Columns:");

// Drop columns
const withoutId = people.drop(["id"]);
withoutId.print("Dropped ID Column:");

// Select columns starting with a prefix
const nameAndAge = people.select(["name", "age"]);
nameAndAge.print("Name and Age Only:");

// Rename columns
const renamed = people.rename({
  name: "full_name",
  age: "years_old",
});
renamed.print("Renamed Columns:");`,
  },
  "filtering-rows": {
    name: "Filtering Rows",
    description: "Filter, slice, and subset rows",
    category: "manipulation",
    code: `import { createDataFrame } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Alice", age: 25, city: "NYC" },
  { id: 2, name: "Bob", age: 30, city: "LA" },
  { id: 3, name: "Charlie", age: 35, city: "NYC" },
  { id: 4, name: "Diana", age: 28, city: "SF" },
]);

// Filter rows
const nycResidents = people.filter((row) => row.city === "NYC");
nycResidents.print("NYC Residents:");

const olderThan30 = people.filter((row) => row.age > 30);
olderThan30.print("Older than 30:");

// Slice operations
const firstTwo = people.sliceHead(2);
firstTwo.print("First 2 Rows:");

const lastTwo = people.sliceTail(2);
lastTwo.print("Last 2 Rows:");

const middleRows = people.slice(1, 3);
middleRows.print("Rows 1-3:");

// Slice by condition
const topByAge = people.sliceMax("age", 2);
topByAge.print("Top 2 by Age:");

const bottomByAge = people.sliceMin("age", 2);
bottomByAge.print("Bottom 2 by Age:");`,
  },
  "transforming-data": {
    name: "Transforming Data",
    description: "Using mutate to create and transform columns",
    category: "manipulation",
    code: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
]);

// Basic mutate
const withBmi = people.mutate({
  bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
  row_id: [1, 2], // Direct array assignment
  category: ["A", "B"],
});

withBmi.print("Basic Mutate:");

// Mutate with index and DataFrame access
const withStats = people.mutate({
  bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
  in_first_half: (_row, index, df) => index < df.nrows() / 2,
  is_above_average: (row, _index, df) => row.mass > s.mean(df.mass),
  percentiles: s.percentileRank(people.mass),
  cumulative_mass: s.cumsum(people.mass),
});

withStats.print("Mutate with Statistics:");

// Chaining mutate operations
const chained = people
  .mutate({
    doubleMass: (row) => row.mass * 2,
  })
  .mutate({
    quadrupleMass: (row) => row.doubleMass * 2,
  });

chained.print("Chained Mutate:");`,
  },
  "sorting-arranging": {
    name: "Sorting & Arranging",
    description: "Sort DataFrames by columns",
    category: "manipulation",
    code: `import { createDataFrame } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Alice", age: 25, salary: 50000 },
  { id: 2, name: "Bob", age: 30, salary: 60000 },
  { id: 3, name: "Charlie", age: 25, salary: 55000 },
  { id: 4, name: "Diana", age: 30, salary: 70000 },
]);

// Sort by single column (ascending)
const byAge = people.arrange("age");
byAge.print("Sorted by Age:");

// Sort descending
const byAgeDesc = people.arrange("age", "desc");
byAgeDesc.print("Sorted by Age (Descending):");

// Sort by multiple columns
const multiSort = people.arrange(["age", "salary"], ["asc", "desc"]);
multiSort.print("Sorted by Age, then Salary (Desc):");

// Sort with custom order
const customOrder = people.arrange("name", "asc");
customOrder.print("Sorted by Name:");`,
  },
  "grouping-aggregation": {
    name: "Grouping & Aggregation",
    description: "GroupBy and summarize operations",
    category: "aggregation",
    code: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172, year: 2023 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167, year: 2023 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96, year: 2023 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202, year: 2024 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228, year: 2024 },
]);

// Basic grouping
const speciesAnalysis = people
  .groupBy("species")
  .summarize({
    count: (group) => group.nrows(),
    avg_height: (group) => s.round(s.mean(group.height), 1),
    avg_mass: (group) => s.round(s.mean(group.mass), 1),
    max_height: (group) => s.max(group.height),
    min_mass: (group) => s.min(group.mass),
  })
  .arrange("avg_mass", "desc");

speciesAnalysis.print("Species Analysis:");

// Multiple column grouping
const bySpeciesAndYear = people
  .groupBy(["species", "year"])
  .summarize({
    count: (group) => group.nrows(),
    avg_mass: (group) => s.round(s.mean(group.mass), 1),
  });

bySpeciesAndYear.print("By Species and Year:");

// Count operation
const speciesCounts = people.count("species");
speciesCounts.print("Species Counts:");`,
  },
  "joining-dataframes": {
    name: "Joining DataFrames",
    description: "Inner, left, right, and outer joins",
    category: "combining",
    code: `import { createDataFrame } from "@tidy-ts/dataframe";

const employees = createDataFrame([
  { id: 1, name: "Alice", dept_id: 10 },
  { id: 2, name: "Bob", dept_id: 20 },
  { id: 3, name: "Charlie", dept_id: 10 },
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Sales" },
  { dept_id: 30, dept_name: "Marketing" },
]);

// Inner join
const inner = employees.innerJoin(departments, "dept_id");
inner.print("Inner Join:");

// Left join
const left = employees.leftJoin(departments, "dept_id");
left.print("Left Join:");

// Right join
const right = employees.rightJoin(departments, "dept_id");
right.print("Right Join:");

// Outer join
const outer = employees.outerJoin(departments, "dept_id");
outer.print("Outer Join:");

// Join with different column names
const employees2 = createDataFrame([
  { emp_id: 1, name: "Alice", department: 10 },
  { emp_id: 2, name: "Bob", department: 20 },
]);

const joined = employees2.innerJoin(
  departments,
  { left: "department", right: "dept_id" },
);
joined.print("Join with Different Column Names:");`,
  },
  "combining-dataframes": {
    name: "Combining DataFrames",
    description: "Bind rows and concatenate DataFrames",
    category: "combining",
    code: `import { createDataFrame } from "@tidy-ts/dataframe";

const df1 = createDataFrame([
  { id: 1, name: "Alice", age: 25 },
  { id: 2, name: "Bob", age: 30 },
]);

const df2 = createDataFrame([
  { id: 3, name: "Charlie", age: 35 },
  { id: 4, name: "Diana", age: 28 },
]);

// Bind rows (stack vertically)
const combined = df1.bindRows(df2);
combined.print("Combined DataFrames:");

// Multiple DataFrames
const df3 = createDataFrame([
  { id: 5, name: "Eve", age: 32 },
]);

const allCombined = df1.bindRows(df2, df3);
allCombined.print("All Combined:");

// Handle mismatched columns (missing columns filled with undefined)
const df4 = createDataFrame([
  { id: 6, name: "Frank", city: "NYC" },
]);

const withMismatch = df1.bindRows(df4);
withMismatch.print("With Mismatched Columns:");`,
  },
  "missing-data": {
    name: "Missing Data",
    description: "Handle null/undefined values with replaceNA",
    category: "manipulation",
    code: `import { createDataFrame } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { id: 1, name: "Alice", age: 25, score: 85 },
  { id: 2, name: "Bob", age: null, score: 92 },
  { id: 3, name: "Charlie", age: 35, score: null },
  { id: 4, name: "Diana", age: 28, score: 78 },
]);

// Replace NA values
const filled = data.replaceNA({
  age: 0,
  score: 0,
});
filled.print("Replaced NA with 0:");

// Replace with different values per column
const customFilled = data.replaceNA({
  age: -1,
  score: 50,
});
customFilled.print("Custom NA Replacement:");

// Replace with function
const meanFilled = data.replaceNA({
  score: (df) => {
    const scores = df.score.filter((s) => s !== null) as number[];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg;
  },
});
meanFilled.print("Mean-filled Scores:");

// Filter out rows with NA
const noNA = data.filter((row) => row.age !== null && row.score !== null);
noNA.print("Rows without NA:");`,
  },
  "reshaping-data": {
    name: "Reshaping Data",
    description: "Pivot longer, pivot wider, and transpose",
    category: "reshaping",
    code: `import { createDataFrame } from "@tidy-ts/dataframe";

const sales = createDataFrame([
  { product: "Widget", Q1: 100, Q2: 120, Q3: 110, Q4: 130 },
  { product: "Gadget", Q1: 200, Q2: 210, Q3: 220, Q4: 230 },
]);

// Pivot longer (wide to long)
const long = sales.pivotLonger({
  columns: ["Q1", "Q2", "Q3", "Q4"],
  namesTo: "quarter",
  valuesTo: "sales",
});
long.print("Pivoted Longer:");

// Pivot wider (long to wide)
const wide = long.pivotWider({
  columnsFrom: "quarter",
  valuesFrom: "sales",
});
wide.print("Pivoted Wider:");

// Transpose
const transposed = sales.transpose();
transposed.print("Transposed:");

// Example: Group by and pivot
const people = createDataFrame([
  { name: "Alice", category: "A", value: 10 },
  { name: "Bob", category: "B", value: 20 },
  { name: "Alice", category: "B", value: 15 },
  { name: "Bob", category: "A", value: 25 },
]);

const pivoted = people
  .groupBy("name")
  .summarize({
    A: (group) => {
      const aRow = group.find((r) => r.category === "A");
      return aRow ? aRow.value : 0;
    },
    B: (group) => {
      const bRow = group.find((r) => r.category === "B");
      return bRow ? bRow.value : 0;
    },
  });
pivoted.print("Grouped and Summarized:");`,
  },
  "stats-descriptive": {
    name: "Descriptive Statistics",
    description: "Mean, median, mode, stdev, quantiles, ranking",
    category: "statistics",
    code: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: 20 },
  { id: 3, value: 30 },
  { id: 4, value: 40 },
  { id: 5, value: 50 },
]);

const values = data.value;

// Central tendency
console.log("Mean:", s.mean(values));
console.log("Median:", s.median(values));
console.log("Mode:", s.mode(values));

// Dispersion
console.log("Std Dev:", s.stdev(values));
console.log("Variance:", s.variance(values));
console.log("Range:", s.range(values));

// Quantiles
console.log("Q1:", s.quantile(values, 0.25));
console.log("Q3:", s.quantile(values, 0.75));
console.log("IQR:", s.iqr(values));

// Ranking
console.log("Ranks:", s.rank(values));
console.log("Percentile Ranks:", s.percentileRank(values));

// Min/Max
console.log("Min:", s.min(values));
console.log("Max:", s.max(values));
console.log("Sum:", s.sum(values));

// With DataFrame
const withStats = data.mutate({
  rank: s.rank(data.value),
  percentile: s.percentileRank(data.value),
  zscore: s.zscore(data.value),
});
withStats.print("DataFrame with Statistics:");`,
  },
  "stats-compare-api": {
    name: "Statistical Testing (Compare API)",
    description: "Intent-driven statistical testing interface",
    category: "statistics",
    code: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const treatment = [5.1, 5.2, 4.9, 5.0, 5.3];
const control = [4.8, 4.7, 4.9, 4.6, 4.8];

// Compare two groups
const comparison = s.compare(treatment, control);

console.log("Mean difference:", comparison.meanDifference);
console.log("P-value:", comparison.pValue);
console.log("Significant?", comparison.isSignificant);

// With DataFrame
const df = createDataFrame([
  { group: "A", value: 5.1 },
  { group: "A", value: 5.2 },
  { group: "B", value: 4.8 },
  { group: "B", value: 4.7 },
]);

const groupA = df.filter((r) => r.group === "A").value;
const groupB = df.filter((r) => r.group === "B").value;

const result = s.compare(groupA, groupB);
console.log("Comparison result:", result);`,
  },
  "stats-distributions": {
    name: "Probability Distributions",
    description: "Normal, beta, gamma, t, chi-square, binomial, poisson, etc.",
    category: "statistics",
    code: `import { stats as s } from "@tidy-ts/dataframe";

// Normal distribution
const normal = s.normal(0, 1); // mean=0, std=1
console.log("Normal PDF(0):", normal.pdf(0));
console.log("Normal CDF(1):", normal.cdf(1));
console.log("Normal quantile(0.95):", normal.quantile(0.95));

// Generate random samples
const samples = normal.sample(1000);
console.log(\`Generated \${samples.length} samples\`);

// Other distributions
const beta = s.beta(2, 5);
console.log("Beta PDF(0.5):", beta.pdf(0.5));

const gamma = s.gamma(2, 3);
console.log("Gamma PDF(2):", gamma.pdf(2));

const tDist = s.t(10); // degrees of freedom
console.log("T-distribution PDF(0):", tDist.pdf(0));

const chi2 = s.chi2(5); // degrees of freedom
console.log("Chi-square PDF(3):", chi2.pdf(3));

// Discrete distributions
const binomial = s.binomial(10, 0.5); // n=10, p=0.5
console.log("Binomial PMF(5):", binomial.pmf(5));

const poisson = s.poisson(3); // lambda=3
console.log("Poisson PMF(2):", poisson.pmf(2));

// Use in analysis
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const mean = s.mean(data);
const std = s.stdev(data);
const fittedNormal = s.normal(mean, std);

console.log(\`Fitted Normal(mean=\${mean}, std=\${std})\`);
console.log("PDF at mean:", fittedNormal.pdf(mean));`,
  },
  "shims-env-validation": {
    name: "Environment Variable Validation",
    description: "Validate and transform environment variables with type safety",
    category: "shims",
    code: `import { env, exit } from "@tidy-ts/shims";
import { z } from "zod";

// Define schema for required environment variables
const EnvSchema = z.object({
  // Application config
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.coerce.number().min(1024).max(65535),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Database config
  DATABASE_URL: z.string().url(),
  DB_POOL_SIZE: z.coerce.number().default(10),

  // API keys (optional in development)
  API_KEY: z.string().optional(),
  SECRET_KEY: z.string().min(32),
}).transform((data) => {
  // Derive additional config
  const isDev = data.NODE_ENV === "development";
  const isProd = data.NODE_ENV === "production";

  // Validate production requirements
  if (isProd && !data.API_KEY) {
    throw new Error("API_KEY is required in production");
  }

  return {
    ...data,
    isDev,
    isProd,
    isStaging: data.NODE_ENV === "staging",
  };
});

type Env = z.infer<typeof EnvSchema>;

// Load and validate environment
function loadEnv(): Env {
  const envVars = env.toObject();
  const result = EnvSchema.safeParse(envVars);

  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    exit(1);
  }

  return result.data;
}

// Usage
const config = loadEnv();

console.log("✅ Environment validated:");
console.log(\`   Environment: \${config.NODE_ENV}\`);
console.log(\`   Port: \${config.PORT}\`);
console.log(\`   Database: \${config.DATABASE_URL ? "✅ Configured" : "❌ Missing"}\`);
console.log(\`   API Key: \${config.API_KEY ? "✅ Set" : "⚠️  Not set"}\`);

// Type-safe access throughout your app
export { config };`,
  },
  "shims-basic-usage": {
    name: "Cross-Runtime File Operations",
    description: "File system operations that work across Deno, Bun, and Node.js",
    category: "shims",
    code: `import {
  readTextFile,
  writeTextFile,
  listDir,
  mkdir,
  exists,
  copyFile,
  rename,
  remove,
  stat
} from "@tidy-ts/shims";

// Create directory structure
await mkdir("./data/backup", { recursive: true });

// Write a file
await writeTextFile("./data/config.json", JSON.stringify({
  version: "1.0.0",
  name: "My App"
}, null, 2));

// Read it back
const content = await readTextFile("./data/config.json");
console.log("Config:", JSON.parse(content));

// Check if file exists
if (await exists("./data/config.json")) {
  console.log("✅ Config file exists");
}

// Copy file
await copyFile("./data/config.json", "./data/backup/config.json");

// List directory contents
const entries = await listDir("./data");
console.log("\\nFiles in ./data:");
for (const entry of entries) {
  const icon = entry.isDirectory ? "📁" : "📄";
  console.log(\`  \${icon} \${entry.name}\`);
}

// Get file stats
const stats = await stat("./data/config.json");
console.log(\`\\nFile size: \${stats.size} bytes\`);
console.log(\`Modified: \${stats.mtime}\`);

// Rename file
await rename("./data/config.json", "./data/config.backup.json");

// Clean up
await remove("./data", { recursive: true });
console.log("✅ Cleanup complete");`,
  },
  "shims-runtime-detection": {
    name: "Runtime Detection & Conditional Logic",
    description: "Detect runtime environment and execute platform-specific code",
    category: "shims",
    code: `import {
  getCurrentRuntime,
  currentRuntime,
  Runtime
} from "@tidy-ts/shims";

// Check current runtime (cached)
console.log("Running in:", currentRuntime);

// Conditional logic based on runtime
if (currentRuntime === Runtime.Deno) {
  console.log("🦕 Using Deno-specific features");
} else if (currentRuntime === Runtime.Bun) {
  console.log("🥟 Using Bun-specific features");
} else if (currentRuntime === Runtime.Node) {
  console.log("🟢 Using Node.js-specific features");
}

// Function-based detection (same result, but as function call)
const runtime = getCurrentRuntime();
const features = {
  [Runtime.Deno]: ["Built-in TypeScript", "Secure by default", "Web APIs"],
  [Runtime.Bun]: ["Fast startup", "Built-in bundler", "JSX support"],
  [Runtime.Node]: ["Massive ecosystem", "Battle-tested", "Enterprise support"],
};

console.log(\`\\n\${runtime} features:\`);
features[runtime]?.forEach(f => console.log(\`  - \${f}\`));

// Use for conditional imports or configuration
const config = {
  timeout: currentRuntime === Runtime.Browser ? 5000 : 30000,
  useNativeModules: currentRuntime !== Runtime.Browser,
  enableHotReload: currentRuntime === Runtime.Deno,
};

console.log("\\nConfiguration:", config);`,
  },
  "shims-path-utilities": {
    name: "Path Resolution & URL Conversion",
    description: "Cross-runtime path operations and import.meta utilities",
    category: "shims",
    code: `import {
  resolve,
  dirname,
  fileURLToPath,
  pathToFileURL,
  importMeta
} from "@tidy-ts/shims";

// Path resolution
const configPath = resolve("./config", "settings.json");
console.log("Resolved path:", configPath);

// Get directory from path
const dir = dirname("/path/to/file.txt");
console.log("Directory:", dir);

// URL conversions
const filePath = fileURLToPath("file:///Users/me/project/src/index.ts");
console.log("File path:", filePath);

const fileUrl = pathToFileURL("/Users/me/project/data.json");
console.log("File URL:", fileUrl.href);

// Import meta utilities (works like import.meta)
console.log("\\nImport meta utilities:");
console.log("  Current file:", importMeta.getFilename());
console.log("  Current dir:", importMeta.getDirname());
console.log("  Module URL:", importMeta.url);
console.log("  Is main module:", importMeta.main);

// Convert import.meta.url to path
const currentFilePath = importMeta.urlToPath();
console.log("  As path:", currentFilePath);

// Common use case: resolve file relative to current module
const dataFile = resolve(importMeta.getDirname(), "data", "users.json");
console.log("\\nData file path:", dataFile);`,
  },
  "shims-process-management": {
    name: "Process & Environment Variables",
    description: "Access command-line arguments and environment variables",
    category: "shims",
    code: `import { args, env, exit } from "@tidy-ts/shims";

// Access command-line arguments
console.log("Command-line arguments:", args);
console.log("Number of args:", args.length);

if (args.length > 0) {
  console.log("First arg:", args[0]);
}

// Environment variables
console.log("\\nEnvironment variables:");
console.log("NODE_ENV:", env.get("NODE_ENV") || "not set");
console.log("PATH:", env.get("PATH")?.substring(0, 50) + "...");

// Set environment variable (runtime only, not persistent)
env.set("MY_VAR", "hello");
console.log("MY_VAR:", env.get("MY_VAR"));

// Get all environment variables
const allEnv = env.toObject();
console.log(\`\\nTotal env vars: \${Object.keys(allEnv).length}\`);

// Load from .env file (if it exists)
try {
  await env.loadFromFile(".env");
  console.log("✅ Loaded .env file");
} catch (error) {
  console.log("⚠️  No .env file found (optional)");
}

// Delete environment variable
env.delete("MY_VAR");
console.log("MY_VAR after delete:", env.get("MY_VAR"));

// Conditional exit based on validation
const required = ["NODE_ENV", "DATABASE_URL"];
const missing = required.filter(key => !env.get(key));

if (missing.length > 0) {
  console.error(\`❌ Missing required env vars: \${missing.join(", ")}\`);
  exit(1);  // Exit with error code
}

console.log("✅ All required env vars present");`,
  },
};

export function listExamples(category?: string): ExampleEntry[] {
  const examples = Object.values(EXAMPLES);
  if (category) {
    return examples.filter((ex) => ex.category === category);
  }
  return examples;
}

export function getExample(name: string): ExampleEntry | null {
  // Direct match
  if (EXAMPLES[name]) return EXAMPLES[name];

  // Fuzzy match (case-insensitive, with/without hyphens)
  const normalized = name.toLowerCase().replace(/[_\s]/g, "-");
  const match = Object.entries(EXAMPLES).find(([key, ex]) =>
    key === normalized ||
    ex.name.toLowerCase().replace(/[_\s&]/g, "-") === normalized
  );

  return match ? match[1] : null;
}
