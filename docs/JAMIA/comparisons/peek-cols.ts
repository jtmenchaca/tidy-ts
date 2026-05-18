import { readXLSX } from "../../../packages/dataframe/mod.ts";

const df = await readXLSX(
  "docs/JAMIA/comparisons/RPython-main/RootCause_BugType Dataset/TM_DFB/TM_DFB.xlsx",
  { no_types: true, skip: 1 },
);
console.log("Columns:", df.columns());
df.sliceHead(3).print();
