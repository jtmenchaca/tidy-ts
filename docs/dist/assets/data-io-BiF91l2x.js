import{j as e}from"./radix-BuIbRv-a.js";import{C as a}from"./code-block-B0XYfMng.js";import{C as i,a as r,b as n,c as o,d as s}from"./card-BIm9p5cD.js";import{D as d}from"./DocPageLayout-CwA4bbf5.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-BVriQQBm.js";const t={csvReading:`import { read_csv, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// Define schema for CSV data validation
const JediAcademySchema = z.object({
  id: z.number(),
  name: z.string(),
  species: z.string(),
  homeworld: z.string(),
  lightsaber_color: z.string(),
  rank: z.string(),
  force_sensitivity: z.number(),
  is_master: z.boolean(),
});

// CSV data as string - Jedi Academy enrollment records
const jediAcademyCsv = \`id,name,species,homeworld,lightsaber_color,rank,force_sensitivity,is_master
1,Luke Skywalker,Human,Tatooine,blue,Jedi Knight,9.2,false
2,Obi-Wan Kenobi,Human,Stewjon,blue,Jedi Master,9.5,true
3,Yoda,Unknown,Unknown,green,Grand Master,10.0,true
4,Mace Windu,Human,Haruun Kal,purple,Jedi Master,9.3,true
5,Ahsoka Tano,Togruta,Shili,white,Jedi Padawan,8.7,false\`;

// Read CSV with schema validation
const jediAcademyData = await read_csv(jediAcademyCsv, JediAcademySchema, {
  naValues: ["", "NA", "NULL"],
  skipEmptyLines: true,
});

jediAcademyData.print("Jedi Academy data loaded from CSV:");`,csvWriting:`import { createDataFrame } from "@tidy-ts/dataframe";

// Create sample Jedi data
const jediData = createDataFrame([
  { id: 1, name: "Luke Skywalker", species: "Human", force_sensitivity: 9.2, rank: "Jedi Knight" },
  { id: 2, name: "Obi-Wan Kenobi", species: "Human", force_sensitivity: 9.5, rank: "Jedi Master" },
  { id: 3, name: "Yoda", species: "Unknown", force_sensitivity: 10.0, rank: "Grand Master" },
]);

// Write to CSV file
import { writeCSV } from "@tidy-ts/dataframe";
writeCSV(jediData, "./output/jedi_roster.csv");

// Chain with other operations
const processedData = jediData
  .mutate({ power_level: (row) => row.force_sensitivity * 10 })
  .filter((row) => row.power_level > 90);
writeCSV(processedData, "./output/powerful_jedi.csv");

console.log("CSV written successfully");`,parquetReading:`import { read_parquet, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// Define schema for Parquet data
const JediSchema = z.object({
  id: z.number(),
  name: z.string(),
  species: z.string(),
  homeworld: z.string(),
  lightsaber_color: z.string(),
  rank: z.string(),
  force_sensitivity: z.number(),
  is_master: z.boolean(),
  padawan_count: z.number().nullable(),
  created_at: z.date(),
});

// Read Parquet file with schema validation
const jediOrder = await read_parquet(
  "./data/jedi_order.parquet",
  JediSchema,
  {
    columns: ["name", "species", "force_sensitivity", "rank"], // Select specific columns
    rowStart: 0,
    rowEnd: 50, // Read first 50 rows
  }
);

jediOrder.print("Jedi Order data loaded from Parquet:");`,parquetWriting:`import { createDataFrame } from "@tidy-ts/dataframe";

// Create sample Jedi data with different types
const jediAnalytics = createDataFrame([
  {
    id: 1,
    name: "Luke Skywalker",
    force_sensitivity: 9.2,
    is_master: false,
    padawan_count: 0,
    created_at: new Date("2023-01-15"),
  },
  {
    id: 2,
    name: "Obi-Wan Kenobi",
    force_sensitivity: 9.5,
    is_master: true,
    padawan_count: 2,
    created_at: new Date("2023-02-20"),
  },
  {
    id: 3,
    name: "Yoda",
    force_sensitivity: 10.0,
    is_master: true,
    padawan_count: 5,
    created_at: new Date("2023-01-01"),
  },
]);

// Write to Parquet file
import { writeParquet } from "@tidy-ts/dataframe";
writeParquet(jediAnalytics, "./output/jedi_analytics.parquet");

// Chain with transformations
const processedJedi = jediAnalytics
  .mutate({ 
    power_level: (row) => row.force_sensitivity >= 9.5 ? "Master" : "Knight",
    days_since_created: (row) => 
      Math.floor((Date.now() - row.created_at.getTime()) / (1000 * 60 * 60 * 24))
  });
writeParquet(processedJedi, "./output/processed_jedi.parquet");

console.log("Parquet written successfully");`,arrowReading:`import { read_arrow, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// Define schema for Arrow data
const JediSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  species: z.string(),
  homeworld: z.string(),
  lightsaber_color: z.string(),
  rank: z.string(),
  force_sensitivity: z.number(),
  is_master: z.boolean(),
  padawan_count: z.number().nullable(),
  created_at: z.date(),
});

// Read Arrow buffer with schema validation
const jediOrder = await read_arrow(arrowBuffer, JediSchema, {
  columns: ["name", "species", "force_sensitivity", "rank"], // Select specific columns
  naValues: ["", "NA", "NULL"],
  useDate: true, // Convert timestamps to Date objects
  useBigInt: false, // Convert BigInt to number
});

jediOrder.print("Jedi Order data loaded from Arrow:");`,schemaValidation:`import { read_csv, read_parquet, read_arrow } from "@tidy-ts/dataframe";
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

// Read with comprehensive validation
const jediData = await read_csv(csvContent, JediMasterSchema, {
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
};`};function y(){return e.jsxs(d,{title:"Data I/O Operations",description:"Read and write data from various formats including CSV, Parquet, and Arrow files with full type safety and schema validation.",currentPath:"/data-io",children:[e.jsx(a,{title:"1. Reading CSV Data",description:"Load CSV data with automatic type conversion and validation",explanation:"The read_csv function automatically converts string data to appropriate types based on your Zod schema. This ensures type safety and catches data quality issues at import time.",code:t.csvReading}),e.jsx(a,{title:"2. Writing CSV Data",description:"Export DataFrames to CSV format with proper formatting",explanation:"The writeCSV function handles proper CSV formatting including escaping special characters, handling null values, and maintaining data integrity. Works in both Node.js and browser environments.",code:t.csvWriting}),e.jsx(a,{title:"3. Reading Parquet Files",description:"Load Parquet files with column selection and row filtering",explanation:"Parquet files offer excellent compression and performance for large datasets. You can selectively read specific columns and row ranges to optimize memory usage and processing speed.",code:t.parquetReading}),e.jsx(a,{title:"4. Writing Parquet Files",description:"Export DataFrames to Parquet format with automatic type detection",explanation:"Parquet format provides excellent compression and is ideal for analytical workloads. The writeParquet function automatically detects column types and handles various data types including dates and booleans.",code:t.parquetWriting}),e.jsx(a,{title:"5. Reading Arrow Data",description:"Load Arrow format data with advanced type conversion options",explanation:"Arrow format provides high-performance columnar data interchange. It supports advanced features like automatic date conversion, BigInt handling, and efficient memory usage for large datasets.",code:t.arrowReading}),e.jsxs(i,{children:[e.jsxs(r,{children:[e.jsx(n,{children:"Schema Validation & Type Safety"}),e.jsx(o,{children:"Comprehensive data validation using Zod schemas for robust data pipelines"})]}),e.jsxs(s,{children:[e.jsx("p",{className:"mb-4",children:"All data I/O operations support Zod schema validation to ensure data quality and type safety. Schemas handle type conversion, validation rules, optional fields, and provide clear error messages when data doesn't match expectations."}),e.jsx(a,{code:t.schemaValidation})]})]})]})}export{y as component};
