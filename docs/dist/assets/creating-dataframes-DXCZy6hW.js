import{j as e}from"./vega-DaDS7kWN.js";import{C as a}from"./code-block-B9d36udg.js";import{D as r}from"./DocPageLayout-r87ErOYz.js";import"./recharts-BW8nexKl.js";import"./shiki-BpdrxAJG.js";import"./card-BE-SfOYi.js";import"./index-CejWlMk4.js";import"./radix-CNB_C82Z.js";import"./shiki-themes-BheiPiei.js";const t={basicDataFrame:`import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// DataFrames are created from arrays of objects
// Each object represents a row, keys become column names
const jediKnights = createDataFrame([
  { id: 1, name: "Luke Skywalker", species: "Human", homeworld: "Tatooine", lightsaber_color: "blue", rank: "Jedi Knight" },
  { id: 2, name: "Obi-Wan Kenobi", species: "Human", homeworld: "Stewjon", lightsaber_color: "blue", rank: "Jedi Master" },
  { id: 3, name: "Yoda", species: "Unknown", homeworld: "Unknown", lightsaber_color: "green", rank: "Grand Master" },
  { id: 4, name: "Mace Windu", species: "Human", homeworld: "Haruun Kal", lightsaber_color: "purple", rank: "Jedi Master" },
  { id: 5, name: "Ahsoka Tano", species: "Togruta", homeworld: "Shili", lightsaber_color: "white", rank: "Jedi Padawan" },
]);

// TypeScript knows the exact structure
const _typeCheck: DataFrame<{
  id: number;
  name: string;
  species: string;
  homeworld: string;
  lightsaber_color: string;
  rank: string;
}> = jediKnights;

jediKnights.print("Created DataFrame with 5 Jedi Knights:");`,typedArrayDataFrame:`import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// Define explicit types for better IntelliSense and type safety
type JediKnight = {
  id: number;
  name: string;
  species: string;
  homeworld: string;
  lightsaber_color: string;
  rank: string;
  force_sensitivity: number;
  is_master?: boolean; // Optional property
  padawan_name?: string; // Optional property
};

// Create typed array of Jedi Knights
const jediKnights: JediKnight[] = [
  {
    id: 1,
    name: "Luke Skywalker",
    species: "Human",
    homeworld: "Tatooine",
    lightsaber_color: "blue",
    rank: "Jedi Knight",
    force_sensitivity: 9.2,
    is_master: false,
    // Note: no padawan_name property
  },
  {
    id: 2,
    name: "Yoda",
    species: "Unknown",
    homeworld: "Unknown",
    lightsaber_color: "green",
    rank: "Grand Master",
    force_sensitivity: 10.0,
    is_master: true,
    padawan_name: "Count Dooku",
  },
  {
    id: 3,
    name: "Obi-Wan Kenobi",
    species: "Human",
    homeworld: "Stewjon",
    lightsaber_color: "blue",
    rank: "Jedi Master",
    force_sensitivity: 9.5,
    is_master: true,
    padawan_name: "Anakin Skywalker",
  },
];

// Create DataFrame from typed array
const jediOrderDataFrame = createDataFrame(jediKnights);

// TypeScript knows the exact structure
const _typeCheck: DataFrame<JediKnight> = jediOrderDataFrame;

jediOrderDataFrame.print("DataFrame created from typed array:");`,csvWithValidation:`import { read_csv, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// CSV data as string - Jedi Academy enrollment records
const jediAcademyCsv = \`name,species,homeworld,lightsaber_color,rank,force_sensitivity
Luke Skywalker,Human,Tatooine,blue,Jedi Knight,9.2
Obi-Wan Kenobi,Human,Stewjon,blue,Jedi Master,9.5
Yoda,Unknown,Unknown,green,Grand Master,10.0
Mace Windu,Human,Haruun Kal,purple,Jedi Master,9.3
Ahsoka Tano,Togruta,Shili,white,Jedi Padawan,8.7
Anakin Skywalker,Human,Tatooine,blue,Jedi Knight,9.8\`;

// Define Zod schema for CSV data - handles type conversion and validation
const JediAcademySchema = z.object({
  name: z.string(),
  species: z.string(),
  homeworld: z.string(),
  lightsaber_color: z.string(),
  rank: z.string(),
  force_sensitivity: z.number(), // CSV strings automatically converted to numbers
});

// Read CSV with schema validation
const jediAcademyData = await read_csv(jediAcademyCsv, JediAcademySchema);

// TypeScript knows the exact structure after Zod validation
const _typeCheck: DataFrame<{
  name: string;
  species: string;
  homeworld: string;
  lightsaber_color: string;
  rank: string;
  force_sensitivity: number;
}> = jediAcademyData;

jediAcademyData.print("DataFrame created from Jedi Academy CSV:");`};function y(){return e.jsxs(r,{title:"Creating DataFrames",description:"Learn the different ways to create DataFrames in tidy-ts, from simple arrays to CSV data with validation.",currentPath:"/creating-dataframes",children:[e.jsx(a,{title:"1. Basic DataFrame Creation",description:"Create DataFrames from arrays of objects - TypeScript infers types automatically",explanation:"TypeScript automatically infers the exact types from your data structure. Each object in the array becomes a row, and the object keys become column names. No schema needed - just clean data!",code:t.basicDataFrame}),e.jsx(a,{title:"2. Basic DataFrame with Typed Array",description:"Use explicit TypeScript types for better IntelliSense and type safety",explanation:"Explicit types provide better IntelliSense, catch errors at compile time, and make your code more maintainable. TypeScript handles optional properties correctly and preserves the exact structure.",code:t.typedArrayDataFrame}),e.jsx(a,{title:"3. Reading CSV Data with Zod Validation",description:"Define your data structure explicitly - Zod handles type conversion and validation",explanation:"With CSV data, you get full control over your data structure. Define exactly what types you expect, and Zod will convert strings to numbers, validate the data, and catch errors at import time.",code:t.csvWithValidation})]})}export{y as component};
