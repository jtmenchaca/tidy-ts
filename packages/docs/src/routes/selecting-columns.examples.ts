// Code examples for selecting columns
export const selectingExamples = {
  selectSpecificColumns: `import { createDataFrame } from "@tidy-ts/dataframe";

const jedi = createDataFrame([
  { id: 1, name: "Luke Skywalker", age: 19, planet: "Tatooine", midichlorianCount: 15000 },
  { id: 2, name: "Obi-Wan Kenobi", age: 57, planet: "Stewjon", midichlorianCount: 13000 },
  { id: 3, name: "Yoda", age: 900, planet: "Unknown", midichlorianCount: 17000 },
]);

// Select specific columns
const selected = jedi.select("name", "age");
selected.print("Selected columns:");`,

  dropSpecificColumns: `const jedi = createDataFrame([
  { id: 1, name: "Luke Skywalker", age: 19, planet: "Tatooine", midichlorianCount: 15000 },
  { id: 2, name: "Obi-Wan Kenobi", age: 57, planet: "Stewjon", midichlorianCount: 13000 },
  { id: 3, name: "Yoda", age: 900, planet: "Unknown", midichlorianCount: 17000 },
]);

// Drop specific columns
const dropped = jedi.drop("id", "planet");
dropped.print("After dropping columns:");`,

  accessIndividualColumns: `const jedi = createDataFrame([
  { id: 1, name: "Luke Skywalker", age: 19, planet: "Tatooine", midichlorianCount: 15000 },
  { id: 2, name: "Obi-Wan Kenobi", age: 57, planet: "Stewjon", midichlorianCount: 13000 },
  { id: 3, name: "Yoda", age: 900, planet: "Unknown", midichlorianCount: 17000 },
]);

// Access individual columns
const names = jedi.name;
const ages = jedi.age;

console.log("Jedi names:", names);
console.log("Jedi ages:", ages);`,

  extractSpecificValues: `const jedi = createDataFrame([
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
console.log("All Jedi names:", allNames);`,
};
