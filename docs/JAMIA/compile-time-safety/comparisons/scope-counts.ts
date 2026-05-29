import { readXLSX } from "../../../packages/dataframe/mod.ts";
import { z } from "zod";

const BASE = "docs/JAMIA/comparisons/RPython-main";

const soSchema = z.object({
  StackOverflow: z.string(),
  Bug: z.string(),
  Cause: z.string(),
  Effect: z.string(),
  "": z.string().optional(),
  _2: z.string().optional(),
  StackOverflow_2: z.string(),
  Bug_2: z.string(),
  Cause_2: z.string(),
  Effect_2: z.string(),
});

const files = [
  { label: "TM_DFB (Type Mismatch × DataFrame Bug)", path: `${BASE}/RootCause_BugType Dataset/TM_DFB/TM_DFB.xlsx` },
  { label: "TM (Type Mismatch, all bug types)", path: `${BASE}/RootCause Dataset/TM/TM.xlsx` },
  { label: "IDAP_IB (Inadequate Process × Implementation)", path: `${BASE}/RootCause_BugType Dataset/IDAP_IB/IDAP_IB.xlsx` },
  { label: "CDA (Confusing Data Analytics, all bug types)", path: `${BASE}/RootCause_BugType Dataset/CDA_(CFB_DB_IB_LB_PB)/CDA_{CFB_DB_IB_LB_PB}.xlsx` },
  { label: "APIC (API Confusion)", path: `${BASE}/RootCause Dataset/APIC/APIC.xlsx` },
  { label: "SM (Statistical Mistake)", path: `${BASE}/RootCause Dataset/SM/SM.xlsx` },
];

let grandPy = 0;
let grandR = 0;

for (const f of files) {
  const df = await readXLSX(f.path, soSchema, { skip: 1 });
  const pyDf = df.filter((r) => r.StackOverflow.startsWith("https://"));
  const rDf = df.filter((r) => r.StackOverflow_2.startsWith("https://"));

  const pyCount = pyDf.nrows();
  const rCount = rDf.nrows();
  grandPy += pyCount;
  grandR += rCount;

  console.log(`\n${f.label}`);
  console.log(`  Python: ${pyCount} | R: ${rCount}`);

  console.log("  Python bugs:");
  pyDf.count("Bug").print();
  console.log("  R bugs:");
  rDf.count("Bug_2").print();
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Grand total: ${grandPy + grandR} SO questions (${grandPy} Python, ${grandR} R)`);
