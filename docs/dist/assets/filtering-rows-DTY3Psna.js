import{j as e}from"./radix-BuIbRv-a.js";import{C as i}from"./code-block-qUDodC0a.js";import{C as t,a as r,b as a,c as n,d as o}from"./card-BOllKCcH.js";import{D as c}from"./DocPageLayout-D23yNU3W.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-CW5Q2cxR.js";const s={basicFiltering:`import { createDataFrame } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
]);

// Filter by numeric conditions
const tallPeople = people.filter((row) => row.height > 180);
tallPeople.print("People taller than 180cm:");

// Filter by string conditions
const humans = people.filter((row) => row.species === "Human");
humans.print("Only humans:");

// Filter by multiple conditions
const tallHumans = people.filter(
  (row) => row.height > 180 && row.species === "Human"
);
tallHumans.print("Tall humans (height > 180cm AND species = Human):");`,filterWithParameters:`// Filter functions also provide three parameters:
const withParameters = people
  .filter((row, index, df) => {
    // row: Access current row's values
    const isHeavy = row.mass > 100;
    
    // index: Get the current row's position (0-based)
    const isFirstHalf = index < df.nrows() / 2;
    
    // df: Access the entire DataFrame for relative comparisons
    const isAboveAverage = row.mass > 50; 
    
    // Combine all three for complex filtering
    return isHeavy && isFirstHalf && isAboveAverage;
  });

withParameters.print("Filtered using all three parameters:");`,filterWithCalculations:`// Filter with calculated values
const withCalculations = people
  .mutate({
    is_heavy: (row) => row.mass > 100,
  })
  .filter((row) => row.is_heavy);

withCalculations.print("Heavy characters (mass > 100):");`,chainedFiltering:`// Chain multiple filters
const chainedFilter = people
  .filter((row) => row.species === "Human")
  .filter((row) => row.height > 170);

chainedFilter.print("Tall humans (chained filters):");`},d="/tidy-ts/assets/filter-NW3I7RPj.webm";function j(){return e.jsxs(c,{title:"Filtering Rows",description:"Filtering lets you work with subsets of your data based on specific conditions. Learn both synchronous and asynchronous filtering patterns.",currentPath:"/filtering-rows",children:[e.jsx(i,{title:"Basic Filtering",description:"Filter rows based on simple conditions",explanation:"The filter() function creates a new DataFrame containing only rows that match your condition. You can use any combination of column values and logical operators.",code:s.basicFiltering}),e.jsx("div",{className:"my-8",children:e.jsx("video",{src:d,autoPlay:!0,loop:!0,muted:!0,playsInline:!0,className:"w-full max-w-xl mx-auto h-auto",style:{},onLoadedData:l=>{l.currentTarget.playbackRate=.5},children:"Your browser does not support the video tag."})}),e.jsx(i,{title:"Using (row, index, df) Parameters in Filter",description:"Learn how to use all three parameters available in filter functions",explanation:"row: Current row's data • index: Row position (0-based) • df: Entire DataFrame",code:s.filterWithParameters}),e.jsx(i,{title:"Complex Filtering Conditions",description:"Use complex logic for filtering scenarios",explanation:"You can combine multiple conditions using logical operators (&&, ||, !) and even filter based on calculated values from previous transformations.",code:s.filterWithCalculations}),e.jsxs(t,{children:[e.jsxs(r,{children:[e.jsx(a,{children:"Async Filtering"}),e.jsx(n,{children:"Handle asynchronous operations in your filter conditions"})]}),e.jsxs(o,{children:[e.jsx("p",{className:"mb-4",children:"Filter functions support async operations for validating data against external APIs, databases, or performing complex async calculations. All async operations are automatically handled with proper concurrency control."}),e.jsxs("p",{className:"text-sm text-blue-600 dark:text-blue-400",children:["📖 ",e.jsx("strong",{children:"Learn more:"})," See the"," ",e.jsx("a",{href:"/async-operations",className:"underline hover:no-underline",children:"Async Operations"})," ","page for async filtering examples and patterns."]})]})]}),e.jsxs(t,{children:[e.jsxs(r,{children:[e.jsx(a,{children:"Filtering Patterns"}),e.jsx(n,{children:"Common filtering patterns and best practices"})]}),e.jsx(o,{children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Range Filtering"}),e.jsx(i,{code:s.chainedFiltering})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Null and Missing Value Filtering"}),e.jsx(i,{code:s.basicFiltering})]})]})})]}),e.jsxs(t,{children:[e.jsxs(r,{children:[e.jsx(a,{children:"Performance Considerations"}),e.jsx(n,{children:"Tips for efficient filtering operations"})]}),e.jsx(o,{children:e.jsx("div",{className:"space-y-4",children:e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Chaining Filters"}),e.jsx(i,{code:s.chainedFiltering})]})})})]})]})}export{j as component};
