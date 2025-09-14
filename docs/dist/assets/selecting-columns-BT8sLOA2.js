import{j as e}from"./vega-DaDS7kWN.js";import{C as a}from"./code-block-BGUFqDK_.js";import{D as n}from"./DocPageLayout-DZSSi_JC.js";import"./recharts-BW8nexKl.js";import"./shiki-DNKhRY_9.js";import"./card-CyWrOT42.js";import"./index-f1Srtcr0.js";import"./radix-CNB_C82Z.js";import"./shiki-themes-BheiPiei.js";const i={selectSpecificColumns:`import { createDataFrame } from "@tidy-ts/dataframe";

const jedi = createDataFrame([
  { id: 1, name: "Luke Skywalker", age: 19, planet: "Tatooine", midichlorianCount: 15000 },
  { id: 2, name: "Obi-Wan Kenobi", age: 57, planet: "Stewjon", midichlorianCount: 13000 },
  { id: 3, name: "Yoda", age: 900, planet: "Unknown", midichlorianCount: 17000 },
]);

// Select specific columns
const selected = jedi.select("name", "age");
selected.print("Selected columns:");`,dropSpecificColumns:`const jedi = createDataFrame([
  { id: 1, name: "Luke Skywalker", age: 19, planet: "Tatooine", midichlorianCount: 15000 },
  { id: 2, name: "Obi-Wan Kenobi", age: 57, planet: "Stewjon", midichlorianCount: 13000 },
  { id: 3, name: "Yoda", age: 900, planet: "Unknown", midichlorianCount: 17000 },
]);

// Drop specific columns
const dropped = jedi.drop("id", "planet");
dropped.print("After dropping columns:");`,accessIndividualColumns:`const jedi = createDataFrame([
  { id: 1, name: "Luke Skywalker", age: 19, planet: "Tatooine", midichlorianCount: 15000 },
  { id: 2, name: "Obi-Wan Kenobi", age: 57, planet: "Stewjon", midichlorianCount: 13000 },
  { id: 3, name: "Yoda", age: 900, planet: "Unknown", midichlorianCount: 17000 },
]);

// Access individual columns
const names = jedi.name;
const ages = jedi.age;

console.log("Jedi names:", names);
console.log("Jedi ages:", ages);`,extractSpecificValues:`const jedi = createDataFrame([
  { id: 1, name: "Luke Skywalker", age: 19, planet: "Tatooine", midichlorianCount: 15000 },
  { id: 2, name: "Obi-Wan Kenobi", age: 57, planet: "Stewjon", midichlorianCount: 13000 },
  { id: 3, name: "Yoda", age: 900, planet: "Unknown", midichlorianCount: 17000 },
]);

// Extract specific values
const firstJedi = jedi.extractHead("name", 1);
const lastJedi = jedi.extractTail("name", 1);
const allNames = jedi.extract("name");

console.log("First Jedi:", firstJedi);
console.log("Last Jedi:", lastJedi);
console.log("All Jedi names:", allNames);`};function u(){return e.jsxs(n,{title:"Selecting and Dropping Columns",description:"Choose exactly which columns you need for your analysis. Essential for data preparation, performance optimization, and creating clean datasets.",currentPath:"/selecting-columns",children:[e.jsx(a,{title:"Select Specific Columns",description:"Choose exactly which columns you need",explanation:"The most common operation is selecting specific columns from your DataFrame. This is essential for focusing your analysis and improving performance.",code:i.selectSpecificColumns}),e.jsx(a,{title:"Drop Specific Columns",description:"Remove unwanted columns from your DataFrame",explanation:"Sometimes it's easier to specify which columns to remove rather than which to keep, especially when you have many columns.",code:i.dropSpecificColumns}),e.jsx(a,{title:"Access Individual Columns",description:"Get entire columns as arrays",explanation:"You can access entire columns as typed arrays, which is useful for further analysis or passing data to other functions.",code:i.accessIndividualColumns}),e.jsx(a,{title:"Extract Specific Values",description:"Get specific values from columns",explanation:"Extract methods provide flexible ways to get specific values from columns, such as the first value, last value, or random samples.",code:i.extractSpecificValues})]})}export{u as component};
