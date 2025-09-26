import{j as a}from"./radix-BuIbRv-a.js";import{C as e}from"./code-block-B7aOnjQg.js";import{C as r,a as i,b as o,c as n,d as s}from"./card--XqZNj_C.js";import{D as d}from"./DocPageLayout-nEFeHVMt.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-jU-cbpu9.js";const t={readingWithValidation:`import {readCSV, readParquet, readArrow } from "@tidy-ts/dataframe"
import { z } from "zod";

// Read CSV with schema validation and error handling
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  city: z.string(),
  score: z.number().nullable(),
});

const dataCSV = await readCSV(pathToCSV, PersonSchema); // uses @std/csv
const dataParquet = await readParquet(pathToParquet, PersonSchema); // uses hyparquet, only available server-side
const dataArrow = await readArrow(pathToArrow, PersonSchema); // uses @uwdata/flechette`,writingData:`// You can also write to CSV and Parquet
import {writeCSV, writeParquet, createDataFrame} from "@tidy-ts/dataframe"

const dataframe = createDataFrame([
  { name: "Alice", age: 30, city: "New York", score: 95 },
  { name: "Bob", age: 25, city: "San Francisco", score: 87 },
  { name: "Charlie", age: 35, city: "Chicago", score: null },
]);

await writeCSV(dataframe, pathToSaveCSV);
await writeParquet(dataframe, pathToSaveParquet); // uses hyparquet-writer, only available server-side
// No support for writing Arrow`,schemaValidation:`import { readCSV, readParquet, readArrow } from "@tidy-ts/dataframe";
import { z } from "zod";

// Comprehensive schema with various data types
const JediMasterSchema = z.object({
  // Basic types
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  
  // Optional and nullable fields
  age: z.number().int().min(0).max(1000).optional(),
  notes: z.string().nullable(),
  
  // Date handling
  created_at: z.date(),
  updated_at: z.date().optional(),
  
  // Boolean with default
  is_active: z.boolean().default(true),
  
  // Enum validation
  rank: z.enum(["Padawan", "Knight", "Master", "Grand Master"]),
  
  // Nested object validation
  homeworld: z.object({
    name: z.string(),
    system: z.string(),
    region: z.string(),
  }).optional(),
});

// Read with validation
const jediData = await readCSV(csvContent, JediMasterSchema, {
  naValues: ["", "NA", "NULL", "null", "undefined"],
  skipEmptyLines: true,
  trim: true,
});

// TypeScript knows the exact structure
type JediType = typeof jediData[0];
const _typeCheck: JediType = {
  id: 1,
  name: "Luke Skywalker",
  email: "luke@jedi-temple.com",
  age: 23,
  notes: null,
  created_at: new Date(),
  is_active: true,
  rank: "Knight",
  homeworld: {
    name: "Tatooine",
    system: "Tatoo",
    region: "Outer Rim",
  },
};`};function y(){return a.jsxs(d,{title:"CSV, Parquet, and Arrow Reading with Zod Validation",description:"Multi-format data import with schema validation and error handling",currentPath:"/data-io",children:[a.jsx(e,{title:"Reading CSV, Parquet, and Arrow with Schema Validation",description:"Read data with Zod schema validation and error handling",explanation:"Read CSV, Parquet, and Arrow files with Zod schema validation for strong typing. Zod schemas catch bad data at ingestion with configurable naValues and custom parsing.",code:t.readingWithValidation}),a.jsx(e,{title:"Writing CSV and Parquet",description:"Export DataFrames to CSV and Parquet formats",explanation:"You can also write to CSV and Parquet. Uses @std/csv for CSV operations and hyparquet/hyparquet-writer for Parquet (server-side only). No support for writing Arrow.",code:t.writingData}),a.jsxs(r,{children:[a.jsxs(i,{children:[a.jsx(o,{children:"Schema Validation & Type Safety"}),a.jsx(n,{children:"All data I/O operations support Zod schema validation to ensure data quality and type safety"})]}),a.jsxs(s,{children:[a.jsx("p",{className:"mb-4",children:"Schemas handle type conversion, validation rules, optional fields, and provide clear error messages when data doesn't match expectations. This catches malformed or missing data early in your pipeline."}),a.jsx(e,{title:"Schema Validation Examples",description:"Data validation with Zod schemas",code:t.schemaValidation})]})]})]})}export{y as component};
