import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Transforming Data - Basic Mutate", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const withBmi = people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      // Arrays can be assigned directly in mutate
      row_id: [1, 2],
      category: ["A", "B"],
    });

  withBmi.print("Basic Mutate with Direct Array Assignment:");

  expect(withBmi.ncols()).toBe(8);
  expect(withBmi.columns()).toContain("bmi");
  expect(withBmi.columns()).toContain("row_id");
  expect(withBmi[0].row_id).toBe(1);
  expect(withBmi[1].category).toBe("B");
});

Deno.test("Transforming Data - Mutate With Parameters", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const withParameters = people
    .mutate({
      bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
      in_first_half: (_row, index, df) => index < df.nrows() / 2,
      is_above_average: (row, _index, df) => row.mass > s.mean(df.mass),
      // Pre-computed arrays can be assigned directly
      percentiles: s.percentileRank(people.mass),
      cumulative_mass: s.cumsum(people.mass),
    });

  withParameters.print("Mutate with Functions and Arrays:");

  expect(withParameters.columns()).toContain("bmi");
  expect(withParameters.columns()).toContain("in_first_half");
  expect(withParameters.columns()).toContain("is_above_average");
  expect(withParameters.columns()).toContain("percentiles");
  expect(withParameters.columns()).toContain("cumulative_mass");
});

Deno.test("Transforming Data - Chaining Mutate", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const chainedExample = people
    .mutate({
      doubleMass: (row) => row.mass * 2,
    })
    .mutate({
      quadrupleMass: (row) => row.doubleMass * 2,
    })
    .mutate({
      massRatio: (row) => row.quadrupleMass / row.mass,
    });

  expect(chainedExample.columns()).toContain("doubleMass");
  expect(chainedExample.columns()).toContain("quadrupleMass");
  expect(chainedExample.columns()).toContain("massRatio");
  expect(chainedExample[0].massRatio).toBe(4);
});

Deno.test("Transforming Data - Object Returns", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

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

  expect(objectExample.columns()).toContain("calculations");
  expect(objectExample[0].calculations.massRatio).toBe(4);

  const filtered = objectExample
    .filter((row) => row.calculations.massRatio >= 4)
    .mutate({
      finalValue: (row) => row.calculations.quadrupleMass * 2,
    });

  expect(filtered.nrows()).toBe(2);
});

Deno.test("Transforming Data - Using Stats Functions", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  const withStats = people
    .mutate({
      mass_zscore: (row, _index, df) => {
        const mean = s.mean(df.mass);
        const std = s.stdev(df.mass);
        return s.round((row.mass - mean) / std, 3);
      },
      mass_percentile: s.percentileRank(people.mass),
      cumulative_mass: s.cumsum(people.mass),
    });

  withStats.print("DataFrame with Statistical Calculations:");

  expect(withStats.columns()).toContain("mass_zscore");
  expect(withStats.columns()).toContain("mass_percentile");
  expect(withStats.columns()).toContain("cumulative_mass");
});

Deno.test("Transforming Data - Complex Calculations", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const singleFunctionExample = people
    .mutate({
      massRatio: (row) => {
        const doubleMass = row.mass * 2;
        const quadrupleMass = doubleMass * 2;
        return quadrupleMass / row.mass;
      },
    });

  expect(singleFunctionExample[0].massRatio).toBe(4);
});
