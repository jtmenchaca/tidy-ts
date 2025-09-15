// Code examples for transforming data
export const transformingExamples = {
  basicMutate: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

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

withBmi.print("Added BMI column:");`,

  mutateWithParameters: `// The mutate function provides three parameters:
const withParameters = people
  .mutate({
    // row: Access current row's values
    bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
    
    // index: Get the current row's position (0-based)
    in_first_half: (_row, index, df) => index < df.nrows() / 2,
    
    // df: Access the entire DataFrame for calculations across all rows
    is_above_average: (row, _index, df) => row.mass > s.mean(df.mass)
  });

withParameters.print("Using all three parameters:");`,

  chainingMutate: `// When intermediate values are needed, you can always chain multiple mutate calls
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

chainedExample.print("Chained mutate operations:");`,

  objectReturns: `// Return multiple values as an object
const objectExample = people
  .mutate({
    calculations: (row) => {
      const doubleMass = row.mass * 2;
      const quadrupleMass = doubleMass * 2;
      return {
        doubleMass,
        quadrupleMass,
        massRatio: quadrupleMass / row.mass
      };
    }
  });

objectExample.print("Object return in mutate:");

// Access nested object values
const filtered = objectExample
  .filter((row) => row.calculations.massRatio >= 4)
  .mutate({
    finalValue: (row) => row.calculations.quadrupleMass * 2
  });`,

  usingStatsFunctions: `// Use the stats module for advanced calculations
const withStats = people
  .mutate({
    // Calculate z-score for mass
    mass_zscore: (row, _index, df) => {
      const mean = s.mean(df.mass);
      const std = s.stdev(df.mass);
      return s.round((row.mass - mean) / std, 3);
    },
    
    // Calculate percentile rank
    mass_percentile: (row, _index, df) => {
      return s.round(s.percentileRank(df.mass, row.mass), 1);
    },
    
    // Use cumulative functions
    cumulative_mass: (_row, index, df) => s.cumsum(df.mass)[index],
  });

withStats.print("Added columns using stats functions:");`,

  complexCalculations: `// Complex calculation in a single function
const singleFunctionExample = people
  .mutate({
    massRatio: (row) => {
      const doubleMass = row.mass * 2;
      const quadrupleMass = doubleMass * 2;
      return quadrupleMass / row.mass;
    }
  });

singleFunctionExample.print("Single function complex calculation:");`,
};