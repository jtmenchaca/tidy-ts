// import { expect } from "@std/expect";
// import type { DataFrame } from "../../dataframe/ts/index.ts";
// import { createDataFrame } from "../../dataframe/ts/index.ts";

// Deno.test("renameWith — add suffix to selected columns", () => {
//   const df = createDataFrame([
//     { sbp: 120, dbp: 80, hr: 72, pat_id: "A" },
//     { sbp: 130, dbp: 85, hr: 68, pat_id: "B" },
//   ]);

//   const renamed = df.renameWith({
//     columns: ["sbp", "dbp", "hr"],
//     transform: (colName) => `${colName}_baseline`,
//   });

//   // Type should be:
//   // DataFrame<{ sbp_baseline: number; dbp_baseline: number; hr_baseline: number; pat_id: string }>
//   const _check: DataFrame<{
//     sbp_baseline: number;
//     dbp_baseline: number;
//     hr_baseline: number;
//     pat_id: string;
//   }> = renamed;

//   expect(renamed.columns()).toEqual(["sbp_baseline", "dbp_baseline", "hr_baseline", "pat_id"]);
//   expect(renamed.toRows()[0].sbp_baseline).toBe(120);
// });

// Deno.test("renameWith — prefix for join disambiguation", () => {
//   const providers = createDataFrame([
//     { id: 101, name: "Dr. Smith", status: "active" },
//     { id: 102, name: "Dr. Jones", status: "on_leave" },
//   ]);

//   const renamed = providers.renameWith({
//     columns: ["name", "status"],
//     transform: (colName) => `provider_${colName}`,
//   });

//   // Type should be:
//   // DataFrame<{ id: number; provider_name: string; provider_status: string }>
//   const _check: DataFrame<{
//     id: number;
//     provider_name: string;
//     provider_status: string;
//   }> = renamed;

//   expect(renamed.columns()).toEqual(["id", "provider_name", "provider_status"]);
// });

// Deno.test("renameWith — snake_case all columns", () => {
//   const df = createDataFrame([
//     { firstName: "Alice", lastName: "Smith", dateOfBirth: "1990-01-01" },
//   ]);

//   const toSnakeCase = (s: string) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
//   const renamed = df.renameWith({
//     columns: df.columns(),
//     transform: toSnakeCase,
//   });

//   // Type should be:
//   // DataFrame<{ first_name: string; last_name: string; date_of_birth: string }>
//   const _check: DataFrame<{
//     first_name: string;
//     last_name: string;
//     date_of_birth: string;
//   }> = renamed;

//   expect(renamed.columns()).toEqual(["first_name", "last_name", "date_of_birth"]);
// });

// Deno.test("renameWith — filter columns before passing", () => {
//   const df = createDataFrame([
//     { sbp: 120, dbp: 80, hr: 72, pat_id: "A" },
//   ]);

//   const renamed = df.renameWith({
//     columns: df.columns().filter((colName) => colName !== "pat_id"),
//     transform: (colName) => `${colName}_baseline`,
//   });

//   // Type should be:
//   // DataFrame<{ sbp_baseline: number; dbp_baseline: number; hr_baseline: number; pat_id: string }>
//   const _check: DataFrame<{
//     sbp_baseline: number;
//     dbp_baseline: number;
//     hr_baseline: number;
//     pat_id: string;
//   }> = renamed;

//   expect(renamed.columns()).toEqual(["sbp_baseline", "dbp_baseline", "hr_baseline", "pat_id"]);
// });
