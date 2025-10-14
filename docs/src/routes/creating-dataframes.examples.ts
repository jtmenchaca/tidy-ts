// Code examples for creating DataFrames
export const creatingExamples = {
  basicDataFrame: `import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

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

jediKnights.print("Created DataFrame with 5 Jedi Knights:");`,

  rawSqlite: `import { createDataFrame, stats } from "@tidy-ts/dataframe";
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

db.close();`,

  drizzleOrm: `import { createDataFrame, stats } from "@tidy-ts/dataframe";
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

client.close();`,

  csvWithValidation: `import { readCSV, type DataFrame } from "@tidy-ts/dataframe";
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

jediAcademyData.print("DataFrame created from Jedi Academy CSV:");`,

  xlsxReading: `import { readXLSX, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// Define Zod schema for XLSX data - handles type conversion and validation
const JediAcademySchema = z.object({
  name: z.string(),
  species: z.string(),
  homeworld: z.string(),
  lightsaber_color: z.string(),
  rank: z.string(),
  force_sensitivity: z.number(), // XLSX values automatically converted to numbers
});

// Read XLSX file with schema validation
const jediAcademyData = await readXLSX("./data/jedi_academy.xlsx", JediAcademySchema);

// Read specific sheet by name or index
const summaryData = await readXLSX("./data/jedi_academy.xlsx", JediAcademySchema, {
  sheet: "Summary", // or sheet: 1 for index
});

// TypeScript knows the exact structure after Zod validation
const _typeCheck: DataFrame<{
  name: string;
  species: string;
  homeworld: string;
  lightsaber_color: string;
  rank: string;
  force_sensitivity: number;
}> = jediAcademyData;

jediAcademyData.print("DataFrame created from Jedi Academy XLSX:");`,

  parquetReading: `import { readParquet, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

const JediSchema = z.object({
  id: z.number(),
  name: z.string(),
  force_sensitivity: z.number(),
  rank: z.string(),
});

const jediData = await readParquet("./data/jedi.parquet", JediSchema);
jediData.print("DataFrame from Parquet:");`,

  arrowReading: `import { readArrow, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

const JediSchema = z.object({
  id: z.number(),
  name: z.string(),
  force_sensitivity: z.number(),
});

const jediData = await readArrow("./data/jedi.arrow", JediSchema);
jediData.print("DataFrame from Arrow:");`,

  csvWriting: `import { createDataFrame, writeCSV, writeXLSX, writeParquet } from "@tidy-ts/dataframe";

const jediData = createDataFrame([
  { name: "Luke", force_sensitivity: 9.2 },
  { name: "Yoda", force_sensitivity: 10.0 },
]);

// Write to CSV
await writeCSV(jediData, "./output/jedi.csv");

// Write to XLSX with sheet selection
await writeXLSX(jediData, "./output/jedi.xlsx");
await writeXLSX(jediData, "./output/jedi.xlsx", { sheet: "Jedi Knights" });

// Write to Parquet
await writeParquet(jediData, "./output/jedi.parquet");
// No writing to .arrow format currently`,
};
