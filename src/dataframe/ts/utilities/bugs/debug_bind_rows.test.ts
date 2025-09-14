import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("debug bind_rows id column", () => {
  const sales2022 = createDataFrame([
    { month: "Jan", revenue: 1000 },
    { month: "Feb", revenue: 1200 },
  ]);

  const sales2023 = createDataFrame([
    { month: "Jan", revenue: 1100 },
    { month: "Feb", revenue: 1300 },
  ]);

  console.log("=== sales2022 ===");
  console.log("columns:", sales2022.columns());
  console.log("data:", sales2022.toArray());

  console.log("\n=== sales2023 ===");
  console.log("columns:", sales2023.columns());
  console.log("data:", sales2023.toArray());

  const result = sales2022.bindRows(sales2023);
  console.log("\n=== result ===");
  console.log("columns:", result.columns());
  console.log("data:", result.toArray());
});
