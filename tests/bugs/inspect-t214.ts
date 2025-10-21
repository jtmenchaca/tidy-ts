import { parseXLSXRaw } from "../../src/dataframe/ts/io/read_xlsx.ts";

const raw = await parseXLSXRaw(
  "./src/dataframe/ts/io/fixtures/T214 2024 RES PR GR and R01 EQ_New Appl_Awds_Succ Rate_Fund by Submiss.xlsx",
  { skip: 1 },
);

console.log("With skip: 1");
console.log("Headers:", raw[0]);
console.log("\nHeader lengths:");
raw[0].forEach((h, i) => {
  console.log(`  ${i}: "${h}" (length: ${h.length})`);
});
console.log("\nFirst data row:", raw[1]);
