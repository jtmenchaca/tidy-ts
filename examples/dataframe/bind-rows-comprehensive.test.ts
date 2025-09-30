import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("bindRows comprehensive test - various scenarios", () => {
  console.log("\n=== COMPREHENSIVE BINDROWS TEST ===");

  // Test 1: Basic bindRows without as const
  const df1 = createDataFrame([{ a: 1, b: "x" }]);
  const df2 = createDataFrame([{ a: 2, c: "y" }]);
  const combined1 = df1.bindRows(df2);

  console.log("Test 1 - Basic bindRows:");
  combined1.print();
  expect(combined1.nrows()).toBe(2);

  // Test 2: bindRows with as const literal types
  const diagnosisData = createDataFrame([
    { identity_id: 1, code: "A123", type: "diagnosis" as const },
  ]);
  const procedureData = createDataFrame([
    { procedure_id: 2, code: "B456", type: "procedure" as const },
  ]);
  const combined2 = diagnosisData.bindRows(procedureData);

  console.log("\nTest 2 - With as const literal types:");
  combined2.print();

  const firstRow = combined2.at(0);
  const secondRow = combined2.at(1);

  expect(firstRow?.type).toBe("diagnosis");
  expect(secondRow?.type).toBe("procedure");
  expect(firstRow?.identity_id).toBe(1);
  expect(secondRow?.procedure_id).toBe(2);

  // Test 3: Multiple bindRows
  const df3 = createDataFrame([{ x: 1, status: "active" as const }]);
  const df4 = createDataFrame([{ x: 2, status: "inactive" as const }]);
  const df5 = createDataFrame([{ x: 3, status: "pending" as const }]);
  const combined3 = df3.bindRows(df4, df5);

  console.log("\nTest 3 - Multiple bindRows:");
  combined3.print();
  expect(combined3.nrows()).toBe(3);

  // Test 4: bindRows with Date columns
  const dateData1 = createDataFrame([
    { id: 1, date: new Date("2024-01-01"), type: "start" as const },
  ]);
  const dateData2 = createDataFrame([
    { id: 2, date: new Date("2024-01-02"), type: "end" as const },
  ]);
  const combined4 = dateData1.bindRows(dateData2);

  console.log("\nTest 4 - With Date columns:");
  combined4.print();

  const dateRow1 = combined4.at(0);
  const dateRow2 = combined4.at(1);
  expect(dateRow1?.type).toBe("start");
  expect(dateRow2?.type).toBe("end");
  expect(dateRow1?.date).toEqual(new Date("2024-01-01"));
  expect(dateRow2?.date).toEqual(new Date("2024-01-02"));

  console.log("\n✓ All bindRows tests passed!");
});
