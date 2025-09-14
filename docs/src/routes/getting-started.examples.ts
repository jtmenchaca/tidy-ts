// Code examples for getting started
export const gettingStartedExamples = {
  quickTutorial: `import { createDataFrame, stats } from "@tidy-ts/dataframe";

// 1. Create a DataFrame from your data
const sales = createDataFrame([
  { region: "North", product: "Widget", quantity: 10, price: 100 },
  { region: "North", product: "Gadget", quantity: 5, price: 200 },
  { region: "South", product: "Widget", quantity: 20, price: 100 },
  { region: "South", product: "Gadget", quantity: 15, price: 200 },
  { region: "East", product: "Widget", quantity: 8, price: 100 },
]);

// 2. Transform your data with method chaining
const analysis = sales

  // Add calculated columns
  .mutate({ 
    revenue: r => r.quantity * r.price,
    category: r => r.quantity > 10 ? "High Volume" : "Standard"
  })

  // Group by region
  .groupBy("region")

  // Calculate summary statistics
  .summarize({
    total_revenue: (group) => stats.sum(group.revenue),
    avg_quantity: (group) => stats.mean(group.quantity),
    product_count: (group) => group.nrows()
  })

  // Sort by revenue (highest first)
  .arrange("total_revenue", "desc");

// 3. View your results
analysis.print();`,

  creatingDataFrames: `import { createDataFrame } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
]);`,

  addingColumnsWithMutate: `const example = people
  .mutate({
    // Calculate BMI using the row's mass and height values
    bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
    // Create boolean flags based on conditions
    is_heavy: (r) => r.mass > 100,
    // Use the index parameter to create row numbers (0-based, so add 1)
    row_number: (_r, idx) => idx + 1,
    // Access the entire DataFrame for calculations across all rows
    cumulative_mass: (_r, _idx, df) => {
      return stats.sum(df.mass);
    },
    // Return constant values for all rows
    constant: () => "fixed_value",
  });`,

  dataframeProperties: `// DataFrames have a length property like arrays
console.log("Number of rows:", people.nrows());
// Access individual rows using array indexing (0-based)
console.log("First row:", people[0]);
console.log("Last row:", people[people.nrows() - 1]);`,

  columnAccess: `// Access entire columns as typed arrays
const names = people.name; // string[] - all names as an array
const masses = people.mass; // number[] - all masses as an array
const species = people.species; // string[] - all species as an array
console.log("All names:", names);
console.log("All masses:", masses);
console.log("Unique species:", stats.unique(species));`,

  typescriptIntegration: `type Character = {
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

// Create a DataFrame from typed data
const typedDf = createDataFrame(characters);

const _typeCheck: DataFrame<Character> = typedDf;

// TypeScript knows the exact column types
const heights1: number[] = typedDf.extract("height");
const heights2: readonly number[] = typedDf.height;`,

  emptyDataFrame: `const emptyDf = createDataFrame([]);
emptyDf.print("Empty DataFrame:");`,

  singleRowDataFrame: `const singleRow = createDataFrame([{ id: 1, name: "Test", value: 42 }]);
singleRow.print("Single row DataFrame:");`,

  chainingOperations: `const data = createDataFrame([
  { id: 1, name: "A", value: 10 },
  { id: 2, name: "B", value: 20 },
  { id: 3, name: "A", value: 30 },
  { id: 4, name: "B", value: 40 },
]);

const result = data
  .filter(r => r.value > 15)
  .mutate({ doubled: r => r.value * 2 })
  .groupBy("name")
  .summarize({
    count: group => group.nrows(),
    total: group => stats.sum(group.doubled),
  });

result.print("Chained operations result:");`,

  installationJSR: {
    deno: `deno add jsr:@tidy-ts/dataframe`,
    pnpm: `pnpm add jsr:@tidy-ts/dataframe`,
    yarn: `yarn add jsr:@tidy-ts/dataframe`,
  },

  installationLegacy: {
    npm: `npx jsr add @tidy-ts/dataframe`,
    bun: `bunx jsr add @tidy-ts/dataframe`,
    yarnLegacy: `yarn dlx jsr add @tidy-ts/dataframe`,
    pnpmLegacy: `pnpm dlx jsr add @tidy-ts/dataframe`,
  },

  importStatement: `import { createDataFrame, stats } from "@tidy-ts/dataframe";`,
};
