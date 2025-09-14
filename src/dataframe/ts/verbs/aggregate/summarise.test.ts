import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Test data
const testData = createDataFrame([
  { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  {
    id: 2,
    name: "Chewbacca",
    mass: 112,
    species: "Wookiee",
    homeworld: "Kashyyyk",
  },
  { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
  { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
  { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
  { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
]);

Deno.test("summarise ungrouped - single expression", () => {
  const testData = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
    { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
    { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
    { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
    { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
  ]);
  const result = testData.summarise({
    avg_mass: (df) => stats.mean(df.mass),
  });

  expect(result.nrows()).toBe(1);
  expect(result[0]).toEqual({
    avg_mass: stats.mean([77, 112, 80, 49, 32, 75]), // 70.5
  });
});

Deno.test("summarise ungrouped - multiple expressions", () => {
  const testData = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
  ]);
  const result = testData.summarise({
    avg_mass: (df) => stats.mean(df.mass),
    total_mass: (df) => stats.sum(df.mass),
    count: (df) => df.nrows(),
  });

  expect(result.nrows()).toBe(1);
  expect(result[0]).toEqual({
    avg_mass: 94.5,
    total_mass: 189,
    count: 2,
  });
});

Deno.test("summarise ungrouped - with scalar values", () => {
  const testData = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
  ]);
  const result = testData.summarise({
    avg_mass: (df) => stats.mean(df.mass),
    constant: () => 42,
    message: () => "hello",
  });

  expect(result.nrows()).toBe(1);
  expect(result[0]).toEqual({
    avg_mass: 94.5,
    constant: 42,
    message: "hello",
  });
});

Deno.test("summarise grouped - single group", () => {
  const groupedData = testData.groupBy("species");
  const result = groupedData.summarise({
    avg_mass: (df) => stats.mean(df.mass),
    count: (df) => df.nrows(),
  });

  expect(result.nrows()).toBe(3); // 3 species groups

  // Check Human group
  const humanGroup = result.filter((r) => r.species === "Human");
  expect(humanGroup.toArray()).toEqual([{
    species: "Human",
    avg_mass: stats.mean([77, 80, 49]), // 68.67...
    count: 3,
  }]);

  // Check Wookiee group
  const wookieeGroup = result.filter((r) => r.species === "Wookiee");
  expect(wookieeGroup.toArray()).toEqual([{
    species: "Wookiee",
    avg_mass: 112, // single value
    count: 1,
  }]);

  // Check Droid group
  const droidGroup = result.filter((r) => r.species === "Droid");
  expect(droidGroup.toArray()).toEqual([{
    species: "Droid",
    avg_mass: stats.mean([32, 75]), // 53.5
    count: 2,
  }]);
});

Deno.test("summarise grouped - multiple groups", () => {
  const groupedData = testData.groupBy("species", "homeworld");
  const result = groupedData.summarise({
    avg_mass: (df) => stats.mean(df.mass),
    count: (df) => df.nrows(),
  });

  expect(result.nrows()).toBe(6); // 6 unique combinations

  // Check Human from Tatooine (only Luke)
  const humanTatooine = result.filter((r) =>
    r.species === "Human" && r.homeworld === "Tatooine"
  );
  expect(humanTatooine.toArray()).toEqual([{
    species: "Human",
    homeworld: "Tatooine",
    avg_mass: 77,
    count: 1,
  }]);

  // Check Droid from Tatooine (only C-3PO)
  const droidTatooine = result.filter((r) =>
    r.species === "Droid" && r.homeworld === "Tatooine"
  );
  expect(droidTatooine.toArray()).toEqual([{
    species: "Droid",
    homeworld: "Tatooine",
    avg_mass: 75,
    count: 1,
  }]);
});

Deno.test("summarise grouped - preserves group keys", () => {
  const groupedData = testData.groupBy("species");
  const result = groupedData.summarise({
    avg_mass: (df) => stats.mean(df.mass),
  });

  expect(result.nrows()).toBe(3);

  // Check all species are present
  const species = stats.unique(result.toArray().map((r) => r.species));
  expect(species).toContain("Human");
  expect(species).toContain("Wookiee");
  expect(species).toContain("Droid");
});

Deno.test("summarise with empty data", () => {
  const result = createDataFrame([])
    // @ts-expect-error - expected error for empty DataFrame summarise
    .summarise({
      // deno-lint-ignore no-explicit-any
      count: (df: any) => df.nrows(),
    });

  const emptyArray: { example_number: number }[] = [];
  const _exampleSummarise = createDataFrame(emptyArray)
    // This one is fine because it's typed
    .summarise({
      count: (df) => df.nrows(),
    });

  expect(result.nrows()).toBe(1);
  expect(result.toArray()[0]).toEqual({
    count: 0,
  });
});

Deno.test("summarise grouped with empty data", () => {
  const groupedData = createDataFrame([])
    // @ts-expect-error - expected error for empty DataFrame groupBy
    .groupBy("species");

  expect(groupedData.nrows()).toBe(0); // No groups, no results
});

Deno.test("summarise with complex expressions", () => {
  // Create fresh test data to avoid mutations from previous tests
  const freshData = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
    { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
    { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
    { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
    { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
  ]);

  const result = freshData.summarise({
    mass_range: (df) => {
      const masses = df.mass;
      return Math.max(...masses) - Math.min(...masses);
    },
    heaviest: (df) => {
      const masses = df.mass;
      return Math.max(...masses);
    },
    lightest: (df) => {
      const masses = df.mass;
      return Math.min(...masses);
    },
  });

  expect(result.nrows()).toBe(1);
  expect(result[0]).toEqual({
    mass_range: 112 - 32, // 80
    heaviest: 112,
    lightest: 32,
  });
});

Deno.test("summarise grouped with complex expressions", () => {
  const groupedData = testData.groupBy("species");
  const result = groupedData
    .summarise({
      mass_range: (df) => {
        const masses = df.mass;
        return Math.max(...masses) - Math.min(...masses);
      },
      count: (df) => df.nrows(),
    });

  expect(result.nrows()).toBe(3);

  // Check Human group
  const humanGroup = result.filter((r) => r.species === "Human");
  expect(humanGroup.toArray()).toEqual([{
    species: "Human",
    mass_range: 80 - 49, // 31
    count: 3,
  }]);

  // Check Wookiee group (single value, so range is 0)
  const wookieeGroup = result.filter((r) => r.species === "Wookiee");
  expect(wookieeGroup.toArray()).toEqual([{
    species: "Wookiee",
    mass_range: 0, // single value
    count: 1,
  }]);
});

Deno.test("summarise with mixed data types", () => {
  const mixedData = createDataFrame([
    { id: 1, name: "A", value: 10, flag: true },
    { id: 2, name: "B", value: 20, flag: false },
    { id: 3, name: "A", value: 15, flag: true },
  ]);

  const result = mixedData.summarise({
    avg_value: (df) => stats.mean(df.value),
    true_count: (df) => df.flag.filter((r) => r).length,
    names: (df) => df.name.join(", "),
  });

  expect(result.nrows()).toBe(1);
  expect(result.toArray()[0]).toEqual({
    avg_value: stats.mean([10, 20, 15]), // 15
    true_count: 2, // A and A
    names: "A, B, A",
  });
});
