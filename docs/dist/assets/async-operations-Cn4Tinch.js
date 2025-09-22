import{j as e}from"./radix-BuIbRv-a.js";import{C as a}from"./code-block-C6dIFuu1.js";import{C as t,a as s,b as i,c as n,d as o}from"./card-Df3V20oL.js";import{D as c}from"./DocPageLayout-CZFhXVWy.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-DuuFzMfq.js";const r={asyncMutateOperations:`import { createDataFrame } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
]);

// Simulate async API enrichment - more realistic example
async function enrichWithExternalData(mass: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate API delay
  if (mass > 100) return "🦣 Heavy Class";
  if (mass > 50) return "🐘 Medium Class";
  return "🐧 Light Class";
}

// Mix sync and async operations
const withAsyncData = await people
  .mutate({
    name_upper: (row) => row.name.toUpperCase(), // Sync operation
    classification: async (row) => await enrichWithExternalData(row.mass), // Async operation
    size_category: (row) => {
      if (row.height > 200) return "Very Tall";
      if (row.height > 170) return "Tall";
      if (row.height > 150) return "Average";
      return "Short";
    },
  });

withAsyncData.print("DataFrame with async operations:");`,asyncFiltering:`// Async validation function - more realistic example
async function validateCharacter(species: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  // Simulate API validation - exclude droids
  return !species.includes("Droid");
}

// Async filter with external validation
const validatedCharacters = await people
  .filter(async (row) => await validateCharacter(row.species));

validatedCharacters.print("Validated characters (excluding droids):");

// Multiple async conditions
const heavyValidatedCharacters = await people
  .filter(async (row) => {
    const isValid = await validateCharacter(row.species);
    const isHeavy = row.mass > 50;
    return isValid && isHeavy;
  });

heavyValidatedCharacters.print("Heavy validated characters:");`,asyncAggregation:`import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Async function to fetch species metadata - more realistic example
async function fetchSpeciesMetadata(species: string): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  const metadata = { "Human": 79, "Droid": 200, "Wookiee": 400 };
  return metadata[species as keyof typeof metadata] || 100;
}

// Async aggregation
const speciesAnalysis = await people
  .groupBy("species")
  .summarise({
    count: (group) => group.nrows(),
    avg_mass: (group) => s.round(s.mean(group.mass), 1),
    total_mass: (group) => s.sum(group.mass),
    expected_lifespan: async (group) => {
      const species = group.extractHead("species", 1) || "";
      return await fetchSpeciesMetadata(species);
    },
  });

speciesAnalysis.print("Species analysis with lifespan metadata:");`,concurrencyAndRetries:`// Simple retry with defaults
const result = await data
  .mutate({
    fetched_data: async (row) => await fetchData(row.id),
  }, {
    retry: { backoff: "exponential" }
  });

// With concurrency control and custom settings
const advancedResult = await data
  .mutate({
    api_call: async (row) => await fetchData(row.id),
  }, {
    concurrency: 2,
    retry: {
      backoff: "exponential",
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 500,
    },
  });`,errorHandling:`// Pattern 1: Try/catch for unexpected errors that should stop execution
async function fetchUserRating(mass: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  if (mass < 30) {
    throw new Error("Mass too low for rating");
  }
  if (mass > 100) return "⭐ Heavyweight";
  if (mass > 50) return "⭐ Medium";
  return "⭐ Lightweight";
}

// Handle unexpected errors that should stop the pipeline
try {
  const result = await people
    .mutate({
      rating: async (row) => await fetchUserRating(row.mass),
    });
  
  result.print("DataFrame with ratings:");
} catch (error) {
  console.error("Unexpected error occurred:", error);
  // Handle the error - maybe fallback data or user notification
}

// Pattern 2: Clean error value handling - return errors as values
async function fetchUserRatingSafe(mass: number): Promise<string | Error> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  if (mass < 30) {
    return new Error("Mass too low for rating");
  }
  if (mass > 100) return "⭐ Heavyweight";
  if (mass > 50) return "⭐ Medium";
  return "⭐ Lightweight";
}

// Clean error handling - errors become part of the data
const resultWithErrors = await people
  .mutate({
    rating: async (row) => await fetchUserRatingSafe(row.mass),
  });

// Now you can filter, analyze, or handle errors as data
const successfulRatings = resultWithErrors.filter(row => 
  typeof row.rating === 'string'
);

const errorRows = resultWithErrors.filter(row => 
  row.rating instanceof Error
);

console.log("Successful ratings:", successfulRatings.nrows());
console.log("Failed ratings:", errorRows.nrows());`};function g(){return e.jsxs(c,{title:"Async Operations",description:"Handle asynchronous operations seamlessly across all tidy-ts functions. From API calls to file operations, async support is built-in with full type safety and performance optimization.",currentPath:"/async-operations",children:[e.jsx(a,{title:"Async Mutate Operations",description:"Add calculated columns using asynchronous functions",explanation:"You can mix synchronous and asynchronous operations in the same mutate() call. Perfect for API enrichment, data validation, and external service integration.",code:r.asyncMutateOperations}),e.jsx(a,{title:"Async Filtering",description:"Filter rows based on asynchronous conditions",explanation:"Async filtering is perfect for scenarios where you need to validate data against external APIs, databases, or perform complex async calculations.",code:r.asyncFiltering}),e.jsx(a,{title:"Async Aggregation",description:"Handle asynchronous operations in group summaries",explanation:"Group summaries can include async operations to enrich your data with external information while maintaining type safety.",code:r.asyncAggregation}),e.jsx(a,{title:"Error Handling",description:"Gracefully handle async operation failures",explanation:"Async operations can fail, and tidy-ts provides clean error handling patterns for managing these scenarios in your data pipelines.",code:r.errorHandling}),e.jsxs(t,{children:[e.jsxs(s,{children:[e.jsx(i,{children:"Concurrency and Retries"}),e.jsx(n,{children:"Tidy-ts has baked-in concurrency control and retry mechanisms"})]}),e.jsx(o,{children:e.jsx("div",{children:e.jsx(a,{code:r.concurrencyAndRetries})})})]})]})}export{g as component};
