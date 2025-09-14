import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame, read_csv } from "@tidy-ts/dataframe";
import { z } from "zod";

describe("Creating DataFrames", () => {
  it("should create basic DataFrame from array of objects", () => {
    const jediKnights = createDataFrame([
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

    // Type check: DataFrame should have exact inferred types
    const _typeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      homeworld: string;
      lightsaber_color: string;
      rank: string;
    }> = jediKnights;
    void _typeCheck; // Suppress unused variable warning

    jediKnights.print("Created DataFrame with 5 Jedi Knights:");

    expect(jediKnights.nrows()).toBe(5);
    expect(jediKnights.columns()).toEqual([
      "id",
      "name",
      "species",
      "homeworld",
      "lightsaber_color",
      "rank",
    ]);
  });

  it("should create DataFrame from typed array with optional properties", () => {
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

    // Type check: DataFrame should preserve the exact type structure
    const _typeCheck: DataFrame<JediKnight> = jediOrderDataFrame;
    void _typeCheck; // Suppress unused variable warning

    jediOrderDataFrame.print("DataFrame created from typed array:");

    expect(jediOrderDataFrame.nrows()).toBe(3);
    expect(jediOrderDataFrame.columns()).toEqual([
      "id",
      "name",
      "species",
      "homeworld",
      "lightsaber_color",
      "rank",
      "force_sensitivity",
      "is_master",
      "padawan_name",
    ]);

    // Check that optional properties are handled correctly
    expect(jediOrderDataFrame.is_master).toEqual([false, true, true]);
    expect(jediOrderDataFrame.padawan_name).toEqual([
      undefined,
      "Count Dooku",
      "Anakin Skywalker",
    ]);
  });

  it("should read CSV data with Zod validation", async () => {
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
    const jediAcademyData = await read_csv(jediAcademyCsv, JediAcademySchema);

    // TypeScript knows the exact structure after Zod validation
    // The Zod schema ensures type safety at runtime
    const _typeCheck: DataFrame<z.infer<typeof JediAcademySchema>> =
      jediAcademyData;
    void _typeCheck;

    jediAcademyData.print("DataFrame created from Jedi Academy CSV:");

    expect(jediAcademyData.nrows()).toBe(6);
    expect(jediAcademyData.columns()).toEqual([
      "name",
      "species",
      "homeworld",
      "lightsaber_color",
      "rank",
      "force_sensitivity",
    ]);
    expect(jediAcademyData.force_sensitivity).toEqual([
      9.2,
      9.5,
      10.0,
      9.3,
      8.7,
      9.8,
    ]);
  });
});
