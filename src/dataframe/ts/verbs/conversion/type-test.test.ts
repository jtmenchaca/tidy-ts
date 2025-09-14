import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

const starwars = createDataFrame([
  { name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  { name: "Chewbacca", mass: 112, species: "Wookiee", homeworld: "Kashyyyk" },
]);

const res = starwars
  .filter((row) => row.mass > 80)
  .select("name", "mass", "species")
  .filter((row) => row.mass > 80)
  .rename({ original_mass: "mass" })
  .mutate({ new_mass: (row) => row.original_mass * 2 })
  .filter((row) => row.original_mass > 80);

// Type assertion to verify the final type is correct
// The result should have exact types for all columns
const _typeCheck: DataFrame<{
  name: string;
  species: string;
  original_mass: number;
  new_mass: number;
}> = res;

console.log("Type checking passed! Final type includes:");
console.log("- name: string");
console.log("- species: string");
console.log("- original_mass: number (renamed from mass)");
console.log("- new_mass: number (added by mutate)");
console.log("- No more 'mass' property (correctly renamed)");
