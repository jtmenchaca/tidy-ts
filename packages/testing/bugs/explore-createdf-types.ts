// import { concatDataFrames, createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
// import { z } from "zod";

// // =====================================================================
// // 1. Plain objects — TS preserves unions via `prop?: undefined` trick
// // =====================================================================
// const objA = { x: 1 };
// const objAType = objA;
// const objB = { x: 2, y: "hi" };
// const objBType = objB;
// const plainArr = [objA, objB];
// const plainArrType = plainArr;

// // Same thing through createDataFrame — still preserved
// const flatHetero = createDataFrame([
//   { test: "A1C", value: 6.1 },
//   { test: "LDL", value: 120, unit: "mg/dL" },
// ]);
// const flatHeteroType = flatHetero;

// // =====================================================================
// // 2. Generic wrapper — TS collapses to common supertype
// //    This is fundamental TS behavior, not DataFrame-specific.
// // =====================================================================
// interface Box<T> { value: T; }
// const boxA: Box<{ x: number }> = { value: { x: 1 } };
// const boxB: Box<{ x: number; y: string }> = { value: { x: 2, y: "hi" } };
// const boxes = [boxA, boxB];
// const boxesType = boxes;

// // =====================================================================
// // 3. Nested DataFrames — same collapse as Box<T>
// // =====================================================================
// const p1Row = {
//   id: "P1",
//   labs: createDataFrame([{ test: "A1C", value: 6.1 }]),
// };
// const p1Type = p1Row;

// const p2Row = {
//   id: "P2",
//   labs: createDataFrame([{ test: "LDL", value: 120, unit: "mg/dL" }]),
// };
// const p2Type = p2Row;

// // Array widens to common type — unit is lost here, before createDataFrame
// const rowArr = [p1Row, p2Row];
// const rowArrType = rowArr;

// const df1 = {
//   id: "P1",
//   labs: createDataFrame([{ test: "A1C", value: 6.1 }]),
// }

// const df2 = {
//   id: "P2",
//   labs: createDataFrame([{ test: "LDL", value: 120, unit: "mg/dL" }]),
// }


// // createDataFrame sees the already-widened array
// const withoutSchema = createDataFrame([
//   df1,
//   df2,
// ]);
// const withoutSchemaConcat = concatDataFrames([df1, df2]);
// const withoutSchemaType = withoutSchema;
// const withoutSchemaLabs = withoutSchema.labs;

// // =====================================================================
// // 4. Fix: Zod schema preserves the intended type
// // =====================================================================
// const patientSchema = z.object({
//   id: z.string(),
//   labs: z.custom<DataFrame<{ test: string; value: number; unit?: string }>>(),
// });

// const withSchema = createDataFrame([
//   {
//     id: "P1",
//     labs: createDataFrame([{ test: "A1C", value: 6.1 }]),
//   },
//   {
//     id: "P2",
//     labs: createDataFrame([{ test: "LDL", value: 120, unit: "mg/dL" }]),
//   },
// ], patientSchema);
// const withSchemaType = withSchema;
// const withSchemaLabs = withSchema.labs;
