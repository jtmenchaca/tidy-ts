import { createDataFrame, s } from "@tidy-ts/dataframe";

Deno.test("s.mean should handle groups with all null values, second value column too", () => {
  // Normal data without missings, second value column too
  const testData2 = createDataFrame([
    { unit: "pg/mL", value: 500, value2: 500 },
    { unit: "pg/mL", value: 600, value2: 600 },
    { unit: "pg/mL", value: 700, value2: 700 },
    { unit: "pg/mL", value: 800, value2: 800 },
    { unit: "ug/mL", value: 500, value2: 800 },
    { unit: "ug/mL", value: 600, value2: 800 },
    { unit: "ug/mL", value: 700, value2: 800 },
    { unit: "ug/mL", value: 800, value2: 800 },
  ]);

  const grouped2 = testData2
    .groupBy("unit")
    .summarize({
      mean_value: (g) => s.mean(g.value, true),
      mean_value2: (g) => s.mean(g.value2, true),
      count: (g) => g.nrows(),
      count2: (g) => g.value2.filter((x) => x > 600).length,
      count3: (g) => g.value2.filter((x) => x > 700).length,
      count4: (g) => g.unit.filter((x) => x == "ug/mL").length,
    });

  grouped2.print();
});
