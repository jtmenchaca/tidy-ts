import { concatDataFrames, createDataFrame } from "@tidy-ts/dataframe";

Deno.test("Create DataFrame from array of arrays", () => {
  const orderProcIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Split into batches of 3
  const orderProcIdBatches: number[][] = [];
  for (let i = 0; i < orderProcIds.length; i += 3) {
    orderProcIdBatches.push(orderProcIds.slice(i, i + 3));
  }

  const orderProc = createDataFrame({
    columns: { orderProcId: orderProcIdBatches },
  });
  orderProc.print();
});

Deno.test("Combine DataFrames from array using bindRows", () => {
  // Create sample DataFrames
  const df1 = createDataFrame([
    { id: 1, name: "Alice", value: 100 },
    { id: 2, name: "Bob", value: 200 },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie", value: 300 },
    { id: 4, name: "Diana", value: 400 },
  ]);

  const df3 = createDataFrame([
    { id: 5, name: "Eve", value: 500 },
  ]);

  // Array of DataFrames
  const dataFrameArray = [df1, df2, df3];

  // Combine using bindRows
  const combined = concatDataFrames(dataFrameArray);

  console.log("Combined DataFrame:");
  combined.print();
  console.log(`Total rows: ${combined.nrows()}`);
});
