// Code examples for data I/O operations
export const dataIoExamples = {
  csvReading: `import { read_csv, type DataFrame } from "@tidy-ts/dataframe";
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

jediAcademyData.print("Jedi Academy data loaded from CSV:");`,

  csvWriting: `import { createDataFrame } from "@tidy-ts/dataframe";

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

console.log("CSV written successfully");`,

  parquetReading: `import { read_parquet, type DataFrame } from "@tidy-ts/dataframe";
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

jediOrder.print("Jedi Order data loaded from Parquet:");`,

  parquetWriting: `import { createDataFrame } from "@tidy-ts/dataframe";

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

console.log("Parquet written successfully");`,

  arrowReading: `import { read_arrow, type DataFrame } from "@tidy-ts/dataframe";
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

jediOrder.print("Jedi Order data loaded from Arrow:");`,

  arrowWriting: `import { createDataFrame } from "@tidy-ts/dataframe";
import { tableFromArrays, tableToIPC, int32, utf8, float32, bool } from "@uwdata/flechette";

// Create sample Jedi data
const jediData = createDataFrame([
  {
    id: 1,
    name: "Luke Skywalker",
    species: "Human",
    force_sensitivity: 9.2,
    is_master: false,
    created_at: new Date("2023-01-15"),
  },
  {
    id: 2,
    name: "Obi-Wan Kenobi", 
    species: "Human",
    force_sensitivity: 9.5,
    is_master: true,
    created_at: new Date("2023-02-20"),
  },
]);

// Convert to Arrow format
const arrowTable = tableFromArrays({
  id: jediData.id,
  name: jediData.name,
  species: jediData.species,
  force_sensitivity: jediData.force_sensitivity,
  is_master: jediData.is_master,
  created_at: jediData.created_at.map(d => d.getTime()), // Convert dates to timestamps
}, {
  types: {
    id: int32(),
    name: utf8(),
    species: utf8(),
    force_sensitivity: float32(),
    is_master: bool(),
    created_at: int32(),
  },
});

// Convert to ArrayBuffer for storage or transmission
const arrowBuffer = tableToIPC(arrowTable);
console.log("Arrow data created successfully");`,

  schemaValidation: `import { read_csv, read_parquet, read_arrow } from "@tidy-ts/dataframe";
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
};`,

  errorHandling: `import { read_csv, read_parquet } from "@tidy-ts/dataframe";
import { z } from "zod";

// Schema with strict validation
const JediSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  force_sensitivity: z.number().min(0).max(10),
});

try {
  // This will throw if data doesn't match schema
  const jediData = await read_csv(invalidCsv, JediSchema);
} catch (error) {
  console.error("Schema validation failed:", error.message);
  
  // Handle specific validation errors
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(\`Field \${err.path.join('.')}: \${err.message}\`);
    });
  }
}

// Graceful error handling for file operations
try {
  const jediData = await read_parquet("./nonexistent_jedi.parquet", JediSchema);
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("File not found:", error.path);
  } else {
    console.error("Parquet reading error:", error.message);
  }
}`,

  performanceOptimization: `import { read_csv, read_parquet, read_arrow } from "@tidy-ts/dataframe";
import { z } from "zod";

// Optimize CSV reading for large files
const largeJediData = await read_csv(largeCsvFile, jediSchema, {
  // Skip empty lines to reduce processing
  skipEmptyLines: true,
  
  // Specify NA values to avoid unnecessary parsing
  naValues: ["", "NA", "NULL", "null"],
  
  // Trim whitespace to avoid string comparison issues
  trim: true,
});

// Optimize Parquet reading with column selection
const optimizedJediData = await read_parquet(
  largeParquetFile,
  jediSchema,
  {
    // Only read needed columns
    columns: ["id", "name", "force_sensitivity"],
    
    // Read specific row range
    rowStart: 0,
    rowEnd: 10000,
  }
);

// Optimize Arrow reading with advanced options
const optimizedArrowData = await read_arrow(
  largeArrowBuffer,
  jediSchema,
  {
    // Only read needed columns
    columns: ["id", "name", "force_sensitivity"],
    
    // Arrow-specific optimizations
    useDate: true, // Convert timestamps to Date objects
    useBigInt: false, // Convert BigInt to number for better performance
  }
);

// Process data in chunks for very large datasets
const chunkSize = 1000;
const chunks = [];

for (let i = 0; i < largeJediData.nrows(); i += chunkSize) {
  const chunk = largeJediData.slice(i, i + chunkSize);
  chunks.push(chunk);
  
  // Process chunk
  const processedChunk = chunk
    .filter((row) => row.force_sensitivity > 5)
    .mutate({ power_level: (row) => row.force_sensitivity * 10 });
    
  // Write chunk to separate files
  writeCSV(processedChunk, \`./output/jedi_chunk_\${i}.csv\`);
}`,

  dataTransformation: `import { createDataFrame, read_csv, read_parquet, read_arrow, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

// Load and transform data
const rawJediData = await read_csv(csvContent, jediSchema);

// Comprehensive data transformation pipeline
const transformedJedi = rawJediData
  // Clean missing data
  .replaceNA({
    force_sensitivity: s.mean(rawJediData.force_sensitivity.filter(x => x !== null)),
    name: "Unknown Jedi",
  })
  
  // Add calculated fields
  .mutate({
    rank_category: (row) => {
      if (row.force_sensitivity >= 9.5) return "Master";
      if (row.force_sensitivity >= 8.0) return "Knight";
      return "Padawan";
    },
    full_title: (row) => \`\${row.rank} \${row.name}\`,
    is_powerful: (row) => row.force_sensitivity > 9.0,
  })
  
  // Filter and select
  .filter((row) => row.is_active)
  .select("id", "full_title", "rank_category", "force_sensitivity", "is_powerful")
  
  // Sort and export
  .arrange("force_sensitivity", "desc");

writeCSV(transformedJedi, "./output/transformed_jedi.csv");

// Export summary statistics
const summary = transformedJedi
  .groupBy("rank_category")
  .summarise({
    count: (group) => group.nrows(),
    avg_force: (group) => s.mean(group.force_sensitivity),
    max_force: (group) => s.max(group.force_sensitivity),
  });

writeParquet(summary, "./output/jedi_summary.parquet");`,

  integrationExample: `import { createDataFrame, read_csv, read_parquet, read_arrow, writeParquet } from "@tidy-ts/dataframe";
import { z } from "zod";

// Define schemas for different data sources
const JediSchema = z.object({
  id: z.number(),
  name: z.string(),
  species: z.string(),
  homeworld: z.string(),
  created_at: z.date(),
});

const MissionSchema = z.object({
  mission_id: z.number(),
  jedi_id: z.number(),
  mission_type: z.string(),
  success_rate: z.number().min(0).max(1),
  mission_date: z.date(),
});

const TrainingSchema = z.object({
  jedi_id: z.number(),
  training_type: z.string(),
  completion_date: z.date(),
  score: z.number().min(0).max(100),
});

// Load data from multiple sources
const jediOrder = await read_csv(jediCsv, JediSchema);
const missions = await read_parquet("./data/missions.parquet", MissionSchema);
const jediTraining = await read_arrow(trainingArrowBuffer, TrainingSchema);

// Join and analyze data
const jediAnalysis = jediOrder
  .innerJoin(missions, ["id", "jedi_id"])
  .groupBy("jedi_id")
  .summarise({
    jedi_name: (group) => group.name[0],
    total_missions: (group) => group.nrows(),
    avg_success_rate: (group) => s.mean(group.success_rate),
    total_success_rate: (group) => s.sum(group.success_rate),
    first_mission: (group) => s.min(group.mission_date),
    last_mission: (group) => s.max(group.mission_date),
  })
  .mutate({
    jedi_rank: (row) => {
      if (row.avg_success_rate > 0.9) return "Elite";
      if (row.avg_success_rate > 0.7) return "Veteran";
      if (row.avg_success_rate > 0.5) return "Experienced";
      return "Rookie";
    },
  })
  .arrange("avg_success_rate", "desc");

// Export results
writeCSV(jediAnalysis, "./output/jedi_analysis.csv");
writeParquet(jediAnalysis, "./output/jedi_analysis.parquet");

console.log("Jedi analysis completed");`,
};
