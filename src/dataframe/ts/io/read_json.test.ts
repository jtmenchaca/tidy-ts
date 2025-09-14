// import { expect } from "@std/expect";
// import { z } from "zod";
// import { read_json } from "@tidy-ts/dataframe";

// Deno.test("read_json: validates simple object", async () => {
//   console.log("=== Test: Read simple object with schema ===");

//   const schema = z.object({
//     name: z.string(),
//     age: z.number(),
//     active: z.boolean(),
//   });

//   const testData = {
//     name: "John",
//     age: 30,
//     active: true,
//   };

//   // Create temporary file
//   const tempFile = "./temp_simple.json";
//   await Deno.writeTextFile(tempFile, JSON.stringify(testData));

//   try {
//     const result = await read_json(tempFile, schema);

//     expect(result.name).toBe("John");
//     expect(result.age).toBe(30);
//     expect(result.active).toBe(true);

//     // Type check
//     const _typeCheck: { name: string; age: number; active: boolean } = result;

//     console.log("✅ Simple object validation passed");
//   } finally {
//     await Deno.remove(tempFile).catch(() => {});
//   }
// });

// Deno.test("read_json: returns DataFrame for array data", async () => {
//   console.log("=== Test: DataFrame creation from array ===");

//   const UserSchema = z.array(z.object({
//     id: z.number(),
//     name: z.string(),
//     email: z.string().email(),
//     score: z.number().optional(),
//   }));

//   const users = [
//     { id: 1, name: "Alice", email: "alice@example.com", score: 95 },
//     { id: 2, name: "Bob", email: "bob@example.com" },
//     { id: 3, name: "Charlie", email: "charlie@example.com", score: 88 },
//   ];

//   const tempFile = "./temp_users.json";
//   await Deno.writeTextFile(tempFile, JSON.stringify(users));

//   try {
//     const df = await read_json(tempFile, UserSchema);

//     expect(df.nrows()).toBe(3);
//     expect(df[0].name).toBe("Alice");
//     expect(df[1].score).toBeUndefined();
//     expect(df[2].score).toBe(88);

//     console.log("✅ DataFrame creation passed");
//   } finally {
//     await Deno.remove(tempFile).catch(() => {});
//   }
// });

// Deno.test("read_json: throws on validation error", async () => {
//   console.log("=== Test: Validation error handling ===");

//   const schema = z.object({
//     email: z.string().email(),
//     age: z.number().positive(),
//   });

//   const invalidData = {
//     email: "not-an-email",
//     age: -5,
//   };

//   const tempFile = "./temp_invalid.json";
//   await Deno.writeTextFile(tempFile, JSON.stringify(invalidData));

//   try {
//     await expect(read_json(tempFile, schema)).rejects.toThrow(
//       "JSON validation failed",
//     );
//     console.log("✅ Validation error thrown as expected");
//   } finally {
//     await Deno.remove(tempFile).catch(() => {});
//   }
// });

// Deno.test("read_json: handles complex nested schema", async () => {
//   console.log("=== Test: Complex nested schema ===");

//   const ConfigSchema = z.object({
//     app: z.object({
//       name: z.string(),
//       version: z.string(),
//     }),
//     database: z.object({
//       host: z.string(),
//       port: z.number(),
//       ssl: z.boolean(),
//     }),
//     features: z.array(z.string()),
//     optional: z.string().optional(),
//   });

//   const configData = {
//     app: {
//       name: "MyApp",
//       version: "1.0.0",
//     },
//     database: {
//       host: "localhost",
//       port: 5432,
//       ssl: false,
//     },
//     features: ["auth", "logging"],
//   };

//   const tempFile = "./temp_config.json";
//   await Deno.writeTextFile(tempFile, JSON.stringify(configData));

//   try {
//     const result = await read_json(tempFile, ConfigSchema);

//     expect(result.app.name).toBe("MyApp");
//     expect(result.database.port).toBe(5432);
//     expect(result.features).toEqual(["auth", "logging"]);
//     expect(result.optional).toBeUndefined();

//     console.log("✅ Complex schema validation passed");
//   } finally {
//     await Deno.remove(tempFile).catch(() => {});
//   }
// });

// Deno.test("read_json: handles statistical test data format", async () => {
//   console.log("=== Test: Statistical test data ===");

//   const StatTestSchema = z.object({
//     test_cases: z.array(z.object({
//       name: z.string(),
//       group1: z.array(z.number()),
//       group2: z.array(z.number()),
//     })),
//     metadata: z.object({
//       description: z.string(),
//     }).optional(),
//   });

//   const testData = {
//     test_cases: [
//       {
//         name: "normal_groups",
//         group1: [1, 2, 3, 4, 5],
//         group2: [2, 3, 4, 5, 6],
//       },
//       {
//         name: "skewed_groups",
//         group1: [1, 1, 2, 10, 15],
//         group2: [5, 6, 7, 8, 9],
//       },
//     ],
//     metadata: {
//       description: "Mann-Whitney test cases",
//     },
//   };

//   const tempFile = "./temp_stat_data.json";
//   await Deno.writeTextFile(tempFile, JSON.stringify(testData));

//   try {
//     const result = await read_json(tempFile, StatTestSchema);

//     expect(result.test_cases).toHaveLength(2);
//     expect(result.test_cases[0].name).toBe("normal_groups");
//     expect(result.test_cases[0].group1).toEqual([1, 2, 3, 4, 5]);
//     expect(result.metadata?.description).toBe("Mann-Whitney test cases");

//     console.log("✅ Statistical test data validation passed");
//   } finally {
//     await Deno.remove(tempFile).catch(() => {});
//   }
// });

// Deno.test("read_json: handles empty array", async () => {
//   console.log("=== Test: Empty array handling ===");

//   const EmptyArraySchema = z.array(z.object({
//     id: z.number(),
//   }));

//   // deno-lint-ignore no-explicit-any
//   const emptyData: any[] = [];

//   const tempFile = "./temp_empty.json";
//   await Deno.writeTextFile(tempFile, JSON.stringify(emptyData));

//   try {
//     const result = await read_json(tempFile, EmptyArraySchema);

//     // Empty arrays should still be returned as the validated array, not converted to DataFrame
//     expect(Array.isArray(result)).toBe(true);
//     expect(result).toHaveLength(0);

//     console.log("✅ Empty array handling passed");
//   } finally {
//     await Deno.remove(tempFile).catch(() => {});
//   }
// });
