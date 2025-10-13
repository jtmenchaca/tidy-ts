import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("Debug Date storage", () => {
  const data = [
    { id: 1, date: new Date("2024-01-15") },
    { id: 2, date: new Date("2024-01-16") },
  ];

  console.log("Original data:");
  console.log(data);

  const df = createDataFrame(data);

  console.log("\nDataFrame.toArray():");
  console.log(df.toArray());

  console.log("\nDirect column access:");
  console.log("df.date:", df.date);

  console.log("\nPrint DataFrame:");
  df.print();
});
