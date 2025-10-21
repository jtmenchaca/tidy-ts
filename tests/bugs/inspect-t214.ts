import { parseXLSXRaw } from "../../src/dataframe/ts/io/read_xlsx.ts";

const raw = await parseXLSXRaw(
  "./src/dataframe/ts/io/fixtures/T214_2024_RES_PR_GR_and_R01_EQ_New_Appl_Awds_Succ_Rate_Fund_by_Submiss.xlsx",
  { skip: 1 },
);

console.log("With skip: 1");
console.log("Headers:", raw[0]);
console.log("\nHeader lengths:");
raw[0].forEach((h, i) => {
  console.log(`  ${i}: "${h}" (length: ${h.length})`);
});
console.log("\nFirst data row:", raw[1]);
