// Code examples for filtering rows
export const filteringExamples = {
  basicFiltering: `import { createDataFrame } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
]);

// Filter by numeric conditions
const tallPeople = people.filter((row) => row.height > 180);
tallPeople.print("People taller than 180cm:");

// Filter by string conditions
const humans = people.filter((row) => row.species === "Human");
humans.print("Only humans:");

// Filter by multiple conditions
const tallHumans = people.filter(
  (row) => row.height > 180 && row.species === "Human"
);
tallHumans.print("Tall humans (height > 180cm AND species = Human):");`,

  filterWithParameters: `// Filter functions also provide three parameters:
const withParameters = people
  .filter((row, index, df) => {
    // row: Access current row's values
    const isHeavy = row.mass > 100;
    
    // index: Get the current row's position (0-based)
    const isFirstHalf = index < df.nrows() / 2;
    
    // df: Access the entire DataFrame for relative comparisons
    const isAboveAverage = row.mass > 50; 
    
    // Combine all three for complex filtering
    return isHeavy && isFirstHalf && isAboveAverage;
  });

withParameters.print("Filtered using all three parameters:");`,

  filterWithCalculations: `// Filter with calculated values
const withCalculations = people
  .mutate({
    is_heavy: (row) => row.mass > 100,
  })
  .filter((row) => row.is_heavy);

withCalculations.print("Heavy characters (mass > 100):");`,

  chainedFiltering: `// Chain multiple filters
const chainedFilter = people
  .filter((row) => row.species === "Human")
  .filter((row) => row.height > 170);

chainedFilter.print("Tall humans (chained filters):");`,
};
