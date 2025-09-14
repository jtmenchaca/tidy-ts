// import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
// import { expect } from "@std/expect";

// Deno.test("leftJoinParallel - basic numeric keys", async () => {
//   const characters = createDataFrame([
//     { id: 1, name: "Luke", species: "Human" },
//     { id: 2, name: "Chewbacca", species: "Wookiee" },
//     { id: 3, name: "Leia", species: "Human" },
//   ]);

//   const planets = createDataFrame([
//     { id: 1, homeworld: "Tatooine" },
//     { id: 2, homeworld: "Kashyyyk" },
//     { id: 4, homeworld: "Alderaan" }, // No matching character
//   ]);

//   const result = await characters.leftJoinParallel(planets, "id");

//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
//     { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
//     { id: 3, name: "Leia", species: "Human", homeworld: undefined },
//   ]);
// });

// Deno.test("leftJoinParallel - string keys", async () => {
//   const characters = createDataFrame([
//     { name: "Luke", species: "Human" },
//     { name: "Chewbacca", species: "Wookiee" },
//     { name: "Leia", species: "Human" },
//   ]);

//   const planets = createDataFrame([
//     { name: "Luke", homeworld: "Tatooine" },
//     { name: "Chewbacca", homeworld: "Kashyyyk" },
//     { name: "Vader", homeworld: "Tatooine" }, // No matching character
//   ]);

//   const result = await characters.leftJoinParallel(planets, "name");

//   expect(result.toArray()).toEqual([
//     { name: "Luke", species: "Human", homeworld: "Tatooine" },
//     { name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
//     { name: "Leia", species: "Human", homeworld: undefined },
//   ]);
// });

// Deno.test("leftJoinParallel - empty left dataframe", async () => {
//   const empty = createDataFrame([]);
//   const planets = createDataFrame([
//     { id: 1, homeworld: "Tatooine" },
//     { id: 2, homeworld: "Kashyyyk" },
//   ]);

//   // @ts-expect-error - id does not exist in empty
//   const result = await empty.leftJoinParallel(planets, "id");

//   expect(result.toArray()).toEqual([]);
// });

// Deno.test("leftJoinParallel - empty right dataframe", async () => {
//   const emptyData: { fake_id: number; homeworld: string }[] = [];

//   const characters = createDataFrame([
//     { id: 1, name: "Luke", species: "Human" },
//     { id: 2, name: "Chewbacca", species: "Wookiee" },
//   ]);
//   const empty = createDataFrame(emptyData);

//   // @ts-expect-error - id does not exist in empty
//   const result = await characters.leftJoinParallel(empty, "id");

//   // When right DataFrame is empty, LEFT JOIN keeps all left rows
//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", species: "Human" },
//     { id: 2, name: "Chewbacca", species: "Wookiee" },
//   ]);
// });

// Deno.test("leftJoinParallel - no matching keys", async () => {
//   const characters = createDataFrame([
//     { id: 1, name: "Luke" },
//     { id: 2, name: "Leia" },
//   ]);

//   const planets = createDataFrame([
//     { id: 3, homeworld: "Tatooine" },
//     { id: 4, homeworld: "Kashyyyk" },
//   ]);

//   const result = await characters.leftJoinParallel(planets, "id");

//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", homeworld: undefined },
//     { id: 2, name: "Leia", homeworld: undefined },
//   ]);
// });

// Deno.test("leftJoinParallel - duplicate keys in left", async () => {
//   const characters = createDataFrame([
//     { id: 1, name: "Luke" },
//     { id: 1, name: "Anakin" }, // Duplicate id
//     { id: 2, name: "Leia" },
//   ]);

//   const planets = createDataFrame([
//     { id: 1, homeworld: "Tatooine" },
//     { id: 3, homeworld: "Alderaan" },
//   ]);

//   const result = await characters.leftJoinParallel(planets, "id");

//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", homeworld: "Tatooine" },
//     { id: 1, name: "Anakin", homeworld: "Tatooine" },
//     { id: 2, name: "Leia", homeworld: undefined },
//   ]);
// });

// Deno.test("leftJoinParallel - duplicate keys in right", async () => {
//   const characters = createDataFrame([
//     { id: 1, name: "Luke" },
//     { id: 2, name: "Leia" },
//   ]);

//   const planets = createDataFrame([
//     { id: 1, homeworld: "Tatooine" },
//     { id: 1, homeworld: "Lars Farm" }, // Duplicate id
//     { id: 3, homeworld: "Alderaan" },
//   ]);

//   const result = await characters.leftJoinParallel(planets, "id");

//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", homeworld: "Tatooine" },
//     { id: 1, name: "Luke", homeworld: "Lars Farm" },
//     { id: 2, name: "Leia", homeworld: undefined },
//   ]);
// });

// Deno.test("leftJoinParallel - duplicate keys in both (Cartesian product)", async () => {
//   const characters = createDataFrame([
//     { id: 1, name: "Luke" },
//     { id: 1, name: "Anakin" }, // Duplicate
//     { id: 2, name: "Leia" },
//   ]);

//   const planets = createDataFrame([
//     { id: 1, homeworld: "Tatooine" },
//     { id: 1, homeworld: "Lars Farm" }, // Duplicate
//   ]);

//   const result = await characters.leftJoinParallel(planets, "id");

//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", homeworld: "Tatooine" },
//     { id: 1, name: "Luke", homeworld: "Lars Farm" },
//     { id: 1, name: "Anakin", homeworld: "Tatooine" },
//     { id: 1, name: "Anakin", homeworld: "Lars Farm" },
//     { id: 2, name: "Leia", homeworld: undefined },
//   ]);
// });

// Deno.test("leftJoinParallel - all rows from left with matches", async () => {
//   const characters = createDataFrame([
//     { id: 1, name: "Luke" },
//     { id: 2, name: "Leia" },
//     { id: 3, name: "Han" },
//   ]);

//   const planets = createDataFrame([
//     { id: 1, homeworld: "Tatooine" },
//     { id: 2, homeworld: "Alderaan" },
//     { id: 3, homeworld: "Corellia" },
//   ]);

//   const result = await characters.leftJoinParallel(planets, "id");

//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", homeworld: "Tatooine" },
//     { id: 2, name: "Leia", homeworld: "Alderaan" },
//     { id: 3, name: "Han", homeworld: "Corellia" },
//   ]);
// });

// Deno.test("leftJoinParallel - custom worker count", async () => {
//   const characters = createDataFrame([
//     { id: 1, name: "Luke" },
//     { id: 2, name: "Leia" },
//   ]);

//   const planets = createDataFrame([
//     { id: 1, homeworld: "Tatooine" },
//     { id: 2, homeworld: "Alderaan" },
//   ]);

//   const result = await characters.leftJoinParallel(planets, "id", {
//     workers: 2,
//   });

//   expect(result.toArray()).toEqual([
//     { id: 1, name: "Luke", homeworld: "Tatooine" },
//     { id: 2, name: "Leia", homeworld: "Alderaan" },
//   ]);
// });
