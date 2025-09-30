import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("sliceMax with Date comparison", () => {
  const data = [
    { id: 1, date: new Date("2024-01-10"), value: "old" },
    { id: 1, date: new Date("2024-01-15"), value: "new" },
    { id: 1, date: undefined, value: "undefined" },
    { id: 2, date: new Date("2024-01-20"), value: "only_date" },
    { id: 2, date: undefined, value: "only_undefined" },
  ];

  console.log("Original data:");
  createDataFrame(data).print();

  const result = createDataFrame(data)
    .groupBy("id")
    .sliceMax("date", 1);

  console.log("\nAfter sliceMax(date, 1):");
  result.print();

  const resultArray = result.toArray();

  // ID 1 should get the latest date (2024-01-15), not undefined or old date
  const id1 = resultArray.find((r) => r.id === 1);
  expect(id1?.value).toBe("new");
  expect(id1?.date).toEqual(new Date("2024-01-15"));

  // ID 2 should get the defined date, not undefined
  const id2 = resultArray.find((r) => r.id === 2);
  expect(id2?.value).toBe("only_date");
  expect(id2?.date).toEqual(new Date("2024-01-20"));
});
