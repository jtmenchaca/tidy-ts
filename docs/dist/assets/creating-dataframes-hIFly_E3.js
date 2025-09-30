import{j as e}from"./radix-BuIbRv-a.js";import{C as t}from"./code-block-BhGO2FFL.js";import{D as n}from"./DocPageLayout-DkgMI9dC.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-DM--TE2b.js";import"./index-BvOr5qpF.js";import"./shiki-themes-BheiPiei.js";const r={basicDataFrame:`import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

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

jediKnights.print("Created DataFrame with 5 Jedi Knights:");`,rawSqlite:`import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";

// Define schema for type safety
const EmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  department: z.string(),
  salary: z.number(),
});

// Connect to database
const db = new DatabaseSync("employees.db");

// Query and create DataFrame
const employees = db.prepare("SELECT * FROM employees").all();
const employeesDF = createDataFrame(employees, EmployeeSchema);

// Analyze data
const highEarners = employeesDF.filter(row => row.salary > 80000);
const deptSummary = employeesDF
  .groupBy("department")
  .summarise({
    count: (group) => group.nrows(),
    avg_salary: (group) => stats.round(stats.mean(group.salary), 0),
  })
  .arrange("avg_salary", "desc");

deptSummary.print("Department Summary");

db.close();`,drizzleOrm:`import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { drizzle } from "npm:drizzle-orm/libsql";
import { createClient } from "npm:@libsql/client";
import { integer, real, sqliteTable, text } from "npm:drizzle-orm/sqlite-core";

// Define Drizzle schema
const employees = sqliteTable("employees", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  salary: real("salary").notNull(),
});

// Connect and query
const client = createClient({ url: "file:employees.db" });
const db = drizzle(client);

const allEmployees = await db.select().from(employees).all();
const employeesDF = createDataFrame(allEmployees); // Auto-inferred types

// Analyze data
const highEarners = employeesDF.filter(row => row.salary > 80000);
const deptSummary = employeesDF
  .groupBy("department")
  .summarise({
    count: (group) => group.nrows(),
    avg_salary: (group) => stats.round(stats.mean(group.salary), 0),
  })
  .arrange("avg_salary", "desc");

deptSummary.print("Department Summary");

client.close();`,csvWithValidation:`import { readCSV, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// CSV data of Jedi Academy enrollment records (you can pass either a string or a file path to readCSV)
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
const jediAcademyData = await readCSV(jediAcademyCsv, JediAcademySchema);

// TypeScript knows the exact structure after Zod validation
const _typeCheck: DataFrame<{
  name: string;
  species: string;
  homeworld: string;
  lightsaber_color: string;
  rank: string;
  force_sensitivity: number;
}> = jediAcademyData;

jediAcademyData.print("DataFrame created from Jedi Academy CSV:");`,parquetReading:`import { readParquet, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

const JediSchema = z.object({
  id: z.number(),
  name: z.string(),
  force_sensitivity: z.number(),
  rank: z.string(),
});

const jediData = await readParquet("./data/jedi.parquet", JediSchema);
jediData.print("DataFrame from Parquet:");`,arrowReading:`import { readArrow, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

const JediSchema = z.object({
  id: z.number(),
  name: z.string(),
  force_sensitivity: z.number(),
});

const jediData = await readArrow("./data/jedi.arrow", JediSchema);
jediData.print("DataFrame from Arrow:");`,csvWriting:`import { createDataFrame, writeCSV } from "@tidy-ts/dataframe";

const jediData = createDataFrame([
  { name: "Luke", force_sensitivity: 9.2 },
  { name: "Yoda", force_sensitivity: 10.0 },
]);

await writeCSV(jediData, "./output/jedi.csv");
await writeCSV(jediData, "./output/jedi.parquet");
// No writing to .arrow format currently`};function h(){const a=o=>{const i=document.getElementById(o);i&&i.scrollIntoView({behavior:"smooth",block:"start"})};return e.jsxs(n,{title:"Creating DataFrames",description:"Learn the different ways to create DataFrames in tidy-ts, from simple arrays to CSV data with validation.",currentPath:"/creating-dataframes",children:[e.jsxs("div",{className:"mb-8 p-4 bg-gray-50 rounded-lg border",children:[e.jsx("h2",{className:"text-lg font-semibold mb-3 text-gray-800",children:"Contents"}),e.jsxs("nav",{className:"space-y-1",children:[e.jsx("button",{onClick:()=>a("basic-dataframe"),className:"block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer",children:"1. Directly from arrays"}),e.jsx("button",{onClick:()=>a("raw-sqlite"),className:"block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer",children:"2. From a SQL query with Zod"}),e.jsx("button",{onClick:()=>a("drizzle-orm"),className:"block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer",children:"3. From a Drizzle ORM query"}),e.jsx("button",{onClick:()=>a("csv-validation"),className:"block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer",children:"4. CSV file with Zod"}),e.jsx("button",{onClick:()=>a("parquet-reading"),className:"block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer",children:"5. Parquet with Zod"}),e.jsx("button",{onClick:()=>a("arrow-reading"),className:"block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer",children:"6. Arrow with Zod"}),e.jsx("button",{onClick:()=>a("writing-data"),className:"block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer",children:"7. Writing CSV and Parquet files"})]})]}),e.jsx(t,{id:"basic-dataframe",title:"1. Basic DataFrame Creation",description:"Create DataFrames from arrays of objects - TypeScript infers types automatically",explanation:"TypeScript automatically infers the exact types from your data structure. Each object in the array becomes a row, and the object keys become column names. No schema needed - just clean data!",code:r.basicDataFrame}),e.jsx(t,{id:"raw-sqlite",title:"2. SQL",description:"Query databases with raw SQL and create DataFrames with Zod schema validation",explanation:"You can use any SQL database. Zod schemas provide type safety for query results, ensuring data integrity when creating DataFrames.",code:r.rawSqlite}),e.jsx(t,{id:"drizzle-orm",title:"3. Drizzle ORM",description:"Use Drizzle ORM for type-safe database queries with automatic DataFrame type inference",explanation:"Drizzle provides excellent TypeScript integration. When you create DataFrames from Drizzle results, types are automatically inferred from your schema definitions.",code:r.drizzleOrm}),e.jsx(t,{id:"csv-validation",title:"4. CSV Data with Zod",description:"Define your data structure explicitly - Zod handles type conversion and validation",explanation:"With CSV data, you get full control over your data structure. Define exactly what types you expect, and Zod will convert strings to numbers, validate the data, and catch errors at import time.",code:r.csvWithValidation}),e.jsx(t,{id:"parquet-reading",title:"5. Parquet Files with Zod",description:"Load Parquet files with schema validation",explanation:"Use Zod schemas to ensure type safety when reading Parquet files.",code:r.parquetReading}),e.jsx(t,{id:"arrow-reading",title:"6. Arrow Data with Zod",description:"Read Arrow format data with schema validation",explanation:"Arrow is a columnar data format. Use Zod schemas for type safety when reading Arrow files.",code:r.arrowReading}),e.jsx(t,{id:"writing-data",title:"7. Writing CSV and Parquet Files",description:"Export DataFrames to CSV and Parquet formats",explanation:"Save your processed data in standard formats.",code:r.csvWriting})]})}export{h as component};
