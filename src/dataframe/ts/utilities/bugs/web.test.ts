import {
  createDataFrame,
  type DataFrame,
  readCSV,
  stats,
} from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("readCSV", async () => {
  // CSV data as string - Jedi Academy enrollment records
  const jediAcademyCsv =
    `name,species,homeworld,lightsaber_color,rank,force_sensitivity
Luke Skywalker,Human,Tatooine,blue,Jedi Knight,9.2
Obi-Wan Kenobi,Human,Stewjon,blue,Jedi Master,9.5
Yoda,Unknown,Unknown,green,Grand Master,10.0
Mace Windu,Human,Haruun Kal,purple,Jedi Master,9.3
Ahsoka Tano,Togruta,Shili,white,Jedi Padawan,8.7
Anakin Skywalker,Human,Tatooine,blue,Jedi Knight,9.8`;

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

  console.log("DataFrame created from Jedi Academy CSV:");
  jediAcademyData.print();
});

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

console.log("DataFrame created from typed array:");
jediOrderDataFrame.print();

// DataFrames are created from arrays of objects
// Each object represents a row, keys become column names
const _jediKnights2 = createDataFrame([
  {
    id: 1,
    name: "Luke Skywalker",
    species: "Human",
    homeworld: "Tatooine",
    lightsaber_color: "blue",
    rank: "Jedi Knight",
  },
  {
    id: 2,
    name: "Obi-Wan Kenobi",
    species: "Human",
    homeworld: "Stewjon",
    lightsaber_color: "blue",
    rank: "Jedi Master",
  },
  {
    id: 3,
    name: "Yoda",
    species: "Unknown",
    homeworld: "Unknown",
    lightsaber_color: "green",
    rank: "Grand Master",
  },
  {
    id: 4,
    name: "Mace Windu",
    species: "Human",
    homeworld: "Haruun Kal",
    lightsaber_color: "purple",
    rank: "Jedi Master",
  },
  {
    id: 5,
    name: "Ahsoka Tano",
    species: "Togruta",
    homeworld: "Shili",
    lightsaber_color: "white",
    rank: "Jedi Padawan",
  },
]);

Deno.test("test", () => {
  // 1. Basic Properties
  // Get fundamental information about your DataFrame structure
  // Every DataFrame has essential properties that tell you about its structure. These are fundamental for understanding your data before analysis.

  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
  ]);

  // Basic properties
  console.log("Rows:", jediKnights.nrows());
  console.log("Columns:", jediKnights.ncols());
  console.log("Column names:", jediKnights.columns());
  console.log("Is empty:", jediKnights.isEmpty());

  // Shape summary
  console.log(
    `Shape: ${jediKnights.nrows()} rows × ${jediKnights.ncols()} columns`,
  );

  // Expected output:
  // Rows: 3
  // Columns: 5
  // Column names: ['id', 'name', 'species', 'mass', 'height']
  // Is empty: false
  // Shape: 3 rows × 5 columns

  // Direct column access - TypeScript infers types automatically
  const names = jediKnights.name; // readonly string[] - all names
  const masses = jediKnights.mass; // readonly number[] - all masses
  const species = jediKnights.species; // readonly string[] - all species

  console.log("All names:", names);
  console.log("All masses:", masses);
  console.log("Unique species:", [...new Set(species)]);

  // Use with any array function
  const avgMass = masses.reduce((sum, mass) => sum + mass, 0) / masses.length;
  const maxHeight = Math.max(...jediKnights.height);

  console.log("Average mass:", avgMass);
  console.log("Max height:", maxHeight);

  // Expected output:
  // All names: ['Luke Skywalker', 'Yoda', 'Obi-Wan Kenobi']
  // All masses: [77, 17, 77]
  // Unique species: ['Human', 'Unknown']
  // Average mass: 57
  // Max height: 182
});

Deno.test("test", () => {
  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
    { id: 4, name: "Mace Windu", species: "Human", mass: 84, height: 198 },
    { id: 5, name: "Ahsoka Tano", species: "Togruta", mass: 55, height: 170 },
  ]);

  // Row iteration with forEachRow
  console.log("Jedi details:");
  jediKnights.forEachRow((jedi, index) => {
    console.log(
      `${index + 1}. ${jedi.name} (${jedi.species}) - ${jedi.mass}kg`,
    );
  });

  // Column iteration with forEachCol
  console.log("\nColumn analysis:");
  jediKnights.forEachCol((colName, df) => {
    const values = df[colName];
    console.log(`${colName}: ${values.length} values`);
  });

  // Side effects with chaining
  const sideEffects: string[] = [];
  jediKnights
    .forEachRow((jedi) => {
      if (jedi.mass > 50) {
        sideEffects.push(`Heavy Jedi: ${jedi.name}`);
      }
    })
    .filter((jedi) => jedi.species === "Human")
    .forEachRow((jedi) => {
      sideEffects.push(`Human Jedi: ${jedi.name}`);
    });

  console.log("Side effects:", sideEffects);

  // Expected output:
  // Jedi details:
  // 1. Luke Skywalker (Human) - 77kg
  // 2. Yoda (Unknown) - 17kg
  // 3. Obi-Wan Kenobi (Human) - 77kg
  // 4. Mace Windu (Human) - 84kg
  // 5. Ahsoka Tano (Togruta) - 50kg
});

Deno.test("another test", () => {
  // 1. Create a DataFrame from your data
  const sales = createDataFrame([
    { region: "North", product: "Widget", quantity: 10, price: 100 },
    { region: "North", product: "Gadget", quantity: 5, price: 200 },
    { region: "South", product: "Widget", quantity: 20, price: 100 },
    { region: "South", product: "Gadget", quantity: 15, price: 200 },
    { region: "East", product: "Widget", quantity: 8, price: 100 },
  ]);

  // 2. Transform your data with method chaining
  const analysis = sales
    // Add calculated columns
    .mutate({
      revenue: (r) => r.quantity * r.price,
      category: (r) => r.quantity > 10 ? "High Volume" : "Standard",
    })
    // Group by region
    .groupBy("region")
    // Calculate summary statistics
    .summarize({
      total_revenue: (group) => stats.sum(group.revenue),
      avg_quantity: (group) => stats.mean(group.quantity),
      product_count: (group) => group.nrows(),
      top_product: (group) =>
        group
          .filter((r, _i, group) => r.quantity === stats.max(group.quantity))
          // This can be shorthanded to: sliceMax("quantity", 1)
          .extractHead("product", 1) ?? "N/A",
    })
    // Sort by revenue (highest first)
    .arrange("total_revenue", "desc");

  // 3. View your results
  analysis.print();
});

Deno.test("another test", () => {
  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
  ]);

  // Get all values from a column - TypeScript knows the exact types
  const names = jediKnights.name; // readonly string[] - all names
  const masses = jediKnights.mass; // readonly number[] - all masses
  const species = jediKnights.species; // readonly string[] - all species

  console.log("All names:", names);
  console.log("All masses:", masses);
  console.log("Unique species:", stats.unique(species));

  // Use with any array function for quick analysis
  const avgMass = masses.reduce((sum, mass) => sum + mass, 0) / masses.length;
  const maxHeight = Math.max(...jediKnights.height);

  // or use the stats module
  const avgMassTidy = stats.mean(masses);
  const maxHeightTidy = stats.max(jediKnights.height);

  console.log("Average mass:", avgMass);
  console.log("Max height:", maxHeight);
  console.log("Tidy Average mass:", avgMassTidy);
  console.log("Tidy Max height:", maxHeightTidy);

  // Expected output:
  // All names: ['Luke Skywalker', 'Yoda', 'Obi-Wan Kenobi']
  // All masses: [77, 17, 77]
  // Unique species: ['Human', 'Unknown']
  // Average mass: 57
  // Max height: 182
  // Tidy Average mass: 57
  // Tidy Max height: 182
});

Deno.test("another test", () => {
  const jediKnights = createDataFrame([
    { id: 1, name: "Luke Skywalker", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "Yoda", species: "Unknown", mass: 17, height: 66 },
    { id: 3, name: "Obi-Wan Kenobi", species: "Human", mass: 77, height: 182 },
  ]);

  // Note: print() returns the DataFrame to allow for chaining
  const _result = jediKnights
    .print("Jedi Knights DataFrame before mutation:")
    .mutate({
      doubleMass: (r) => r.mass * 2,
    })
    .print("Jedi Knights DataFrame after mutation:");
});
