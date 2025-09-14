import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { stats } from "@tidy-ts/dataframe";

describe("Transforming Data", () => {
  it("should add basic calculated columns", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
      { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    ]);

    // Add a single calculated column
    const withBmi = people
      .mutate({
        bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      });

    // Type check: mutate adds new columns while preserving existing ones
    const _withBmiTypeCheck: DataFrame<{
      id: number;
      name: string;
      species: string;
      mass: number;
      height: number;
      bmi: number;
    }> = withBmi;
    void _withBmiTypeCheck; // Suppress unused variable warning

    withBmi.print("Added BMI column:");

    expect(withBmi.nrows()).toBe(5);
    expect(withBmi.columns()).toContain("bmi");
    expect(withBmi.bmi[0]).toBeCloseTo(26.0, 1);
    expect(withBmi.bmi[4]).toBeCloseTo(21.5, 0);
  });

  it("should use all three mutate parameters (row, index, df)", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
      { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    ]);

    const withParameters = people
      .mutate({
        // row: Access current row's values
        bmi: (row) => row.mass / Math.pow(row.height / 100, 2),

        // index: Get the current row's position (0-based)
        in_first_half: (_row, index, df) => index < df.nrows() / 2,

        // df: Access the entire DataFrame for calculations across all rows
        is_above_average: (row, _index, df) => row.mass > stats.mean(df.mass),
      });

    withParameters.print("Using all three parameters:");

    expect(withParameters.nrows()).toBe(5);
    expect(withParameters.columns()).toContain("bmi");
    expect(withParameters.columns()).toContain("in_first_half");
    expect(withParameters.columns()).toContain("is_above_average");

    // Check that in_first_half is true for first 2 rows (index 0, 1)
    expect(withParameters.in_first_half[0]).toBe(true);
    expect(withParameters.in_first_half[1]).toBe(true);
    expect(withParameters.in_first_half[2]).toBe(true);
    expect(withParameters.in_first_half[3]).toBe(false);
    expect(withParameters.in_first_half[4]).toBe(false);
  });

  it("should chain multiple mutate operations", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    ]);

    // Chain multiple mutate calls
    const chainedExample = people
      .mutate({
        doubleMass: (row) => row.mass * 2,
      })
      .mutate({
        quadrupleMass: (row) => row.doubleMass * 2, // Now doubleMass exists
      })
      .mutate({
        massRatio: (row) => row.quadrupleMass / row.mass,
      });

    chainedExample.print("Chained mutate operations:");

    expect(chainedExample.nrows()).toBe(3);
    expect(chainedExample.columns()).toContain("doubleMass");
    expect(chainedExample.columns()).toContain("quadrupleMass");
    expect(chainedExample.columns()).toContain("massRatio");

    // Check calculations
    expect(chainedExample.doubleMass[0]).toBe(154); // 77 * 2
    expect(chainedExample.quadrupleMass[0]).toBe(308); // 154 * 2
    expect(chainedExample.massRatio[0]).toBe(4); // 308 / 77
  });

  it("should handle object returns in mutate", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    ]);

    // Return multiple values as an object
    const objectExample = people
      .mutate({
        calculations: (row) => {
          const doubleMass = row.mass * 2;
          const quadrupleMass = doubleMass * 2;
          return {
            doubleMass,
            quadrupleMass,
            massRatio: quadrupleMass / row.mass,
          };
        },
      });

    objectExample.print("Object return in mutate:");

    expect(objectExample.nrows()).toBe(2);
    expect(objectExample.columns()).toContain("calculations");

    // Access nested object values
    const filtered = objectExample
      .filter((row) => row.calculations.massRatio >= 4)
      .mutate({
        finalValue: (row) => row.calculations.quadrupleMass * 2,
      });

    expect(filtered.nrows()).toBe(2); // Both should have massRatio > 4
    expect(filtered.columns()).toContain("finalValue");
  });

  it("should use stats functions in mutate", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
      { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
      { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
      { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
    ]);

    const withStats = people
      .mutate({
        // Calculate z-score for mass
        mass_zscore: (row, _index, df) => {
          const mean = stats.mean(df.mass);
          const std = stats.stdev(df.mass);
          return stats.round((row.mass - mean) / std, 3);
        },

        // Calculate percentile rank
        mass_percentile: (row, _index, df) => {
          return stats.round(stats.percentileRank(df.mass, row.mass), 1);
        },

        // Use cumulative functions
        cumulative_mass: (_row, index, df) => stats.cumsum(df.mass)[index],
      });

    withStats.print("Added columns using stats functions:");

    expect(withStats.nrows()).toBe(5);
    expect(withStats.columns()).toContain("mass_zscore");
    expect(withStats.columns()).toContain("mass_percentile");
    expect(withStats.columns()).toContain("cumulative_mass");

    // Check that z-scores sum to approximately 0
    const zscoreSum = withStats.mass_zscore.reduce((sum, val) => sum + val, 0);
    expect(zscoreSum).toBeCloseTo(0, 10);

    // Check cumulative mass
    expect(withStats.cumulative_mass[0]).toBe(77);
    expect(withStats.cumulative_mass[1]).toBe(152);
    expect(withStats.cumulative_mass[4]).toBe(432);
  });

  it("should handle complex calculations with multiple dependencies", () => {
    const people = createDataFrame([
      { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
      { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    ]);

    // Complex calculation in a single function
    const singleFunctionExample = people
      .mutate({
        massRatio: (row) => {
          const doubleMass = row.mass * 2;
          const quadrupleMass = doubleMass * 2;
          return quadrupleMass / row.mass;
        },
      });

    singleFunctionExample.print("Single function complex calculation:");

    expect(singleFunctionExample.nrows()).toBe(2);
    expect(singleFunctionExample.columns()).toContain("massRatio");
    expect(singleFunctionExample.massRatio[0]).toBe(4); // (77 * 2 * 2) / 77
    expect(singleFunctionExample.massRatio[1]).toBe(4); // (75 * 2 * 2) / 75
  });
});
