import{j as t}from"./radix-BuIbRv-a.js";import{C as e}from"./code-block-BeWNPvCF.js";import{D as s}from"./DocPageLayout-DXohhYzn.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-CUEGTy7I.js";import"./index-YyKahHUK.js";import"./shiki-themes-BheiPiei.js";const a={dataframeProperties:`import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const jediKnights = createDataFrame([
  { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
  { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
]);

// Get basic properties
const numberOfRows = jediKnights.nrows();
const numberOfColumns = jediKnights.ncols();
const columnNames = jediKnights.columns();
const isEmpty = jediKnights.isEmpty();

// Print the DataFrame to the console
jediKnights.print("Jedi Knights DataFrame:");

// Print() is a chainable method that returns the DataFrame to allow for chaining. 
// This gives an easy way to see intermedite results of a chain of operations.
  const result = jediKnights
    .print("Jedi Knights DataFrame before mutation:")
    .mutate({
      doubleMass: (r) => r.mass * 2,
    })
    .print("Jedi Knights DataFrame after mutation:");`,basicColumnAccess:`// Get all values from a column - TypeScript knows the exact types
const names = jediKnights.name; // readonly string[] - all names
const masses = jediKnights.mass; // readonly number[] - all masses
const species = jediKnights.species; // readonly string[] - all species

console.log("All names:", names);
console.log("All masses:", masses);
console.log("Unique species:", s.unique(species));

// Use with any array function for quick analysis
const avgMass = masses.reduce((sum, mass) => sum + mass, 0) / masses.length;
const maxHeight = Math.max(...jediKnights.height);

// or use the stats module
const avgMassTidy = s.mean(masses);
const maxHeightTidy = s.max(jediKnights.height);

  console.log("Average mass:", avgMass);
  console.log("Max height:", maxHeight);
  console.log("Tidy Average mass:", avgMassTidy);
  console.log("Tidy Max height:", maxHeightTidy);`,extractMethods:`// Basic extract - get all values (mutable copy)
const allNames = jediKnights.extract("name");
console.log("All names:", allNames);

// Extract specific positions
const firstJedi = jediKnights.extractHead("name", 1); // Single value
const firstTwo = jediKnights.extractHead("name", 2); // Array of 2 values
const lastJedi = jediKnights.extractTail("name", 1); // Single value
const thirdJedi = jediKnights.extractNth("name", 2); // Value at index 2

console.log("First Jedi:", firstJedi);
console.log("First two:", firstTwo);
console.log("Last Jedi:", lastJedi);
console.log("Third Jedi:", thirdJedi);

// Random sampling
const randomJedi = jediKnights.extractSample("name", 2);
console.log("Random sample:", randomJedi);`,toStringMethod:`// Get string representation without printing to console
const tableString = jediKnights.toString();
console.log("DataFrame as string:");
console.log(tableString);

// Add a custom title
const tableWithTitle = jediKnights.toString("Jedi Knights Analysis");
console.log(tableWithTitle);

// Useful for logging to files or custom output
const logEntry = \`
Analysis Report
===============
\${jediKnights.toString("Jedi Knights")}
\`;
console.log(logEntry);

// Both print() and toString() show the same formatted table
// print() writes to console directly, toString() returns the string
jediKnights.print("Using print()");
const str = jediKnights.toString("Using toString()");
console.log(str);`};function g(){return t.jsxs(s,{title:"DataFrame Basics",description:"DataFrame properties, column access, and TypeScript integration. Learn the fundamentals before diving into data operations.",currentPath:"/dataframe-basics",children:[t.jsx(e,{title:"1. DataFrame Properties",description:"Get fundamental information about your DataFrame structure",explanation:"You can check basic properties like row count, column names, and print the entire DataFrame to see your data in a clean table format.",code:a.dataframeProperties}),t.jsx(e,{title:"2. Basic Column Access",description:"Access entire columns as typed arrays",explanation:"The easiest way to access the raw data from any column is using dot notation.  This returns a readonly array (to prevent accidental DataFrame mutations) and can be used with any JavaScript array method.",code:a.basicColumnAccess}),t.jsx(e,{title:"3. Extract Methods",description:"The extract(), extractHead(), extractTail(), extractNth(), or extractSample() methods give an easy, chainable way to get mutable data out of a DataFrame.  These values are copies and won't have any effect on the original DataFrame.",code:a.extractMethods}),t.jsx(e,{title:"4. toString() Method",description:"Get a string representation of your DataFrame for logging or custom output",explanation:"The toString() method returns the same formatted table output as print(), but as a string instead of printing directly to the console. Useful for file logging, custom formatting, or debugging.",code:a.toStringMethod})]})}export{g as component};
