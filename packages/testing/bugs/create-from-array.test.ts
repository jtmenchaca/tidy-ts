import { concatDataFrames, createDataFrame, s } from "@tidy-ts/dataframe";

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

async function exampleFunction(orderProcIds: number[]) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const randomNumber = Math.random();
  const result = orderProcIds.map((id) => id * randomNumber);
  return result;
}

Deno.test("Another test - using s.batch()", async () => {
  // Extract both sets for filtering
  const orderProcIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // Split into batches of 300
  const orderProcIdBatches = s.chunk(orderProcIds, 3);

  // Use s.batch() for clean concurrency control
  const results = await s.batch(
    orderProcIdBatches,
    exampleFunction,
    { concurrency: 5 }, // Control concurrency easily
  );
  console.log(results);
});

Deno.test("Another test - old way with Promise.all", async () => {
  // Extract both sets for filtering
  const orderProcIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // Split into batches of 300
  const orderProcIdBatches = s.chunk(orderProcIds, 3);

  // For each value in orderProcIdBatches, call exampleFunction and add the result to an array
  const results = await Promise.all(orderProcIdBatches.map(async (batch) => {
    const result = await exampleFunction(batch);
    return result;
  }));
  console.log(results);
});

Deno.test("Another test v2", async () => {
  // Extract both sets for filtering
  const orderProcIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // Split into batches of 3
  const orderProcIdBatches = s.chunk(orderProcIds, 3);

  // For each value in orderProcIdBatches, call exampleFunction and add the result to an array
  const results = await s.batch(orderProcIdBatches, async (batch) => {
    const result = await exampleFunction(batch);
    return result;
  });
  console.log(results);
});
