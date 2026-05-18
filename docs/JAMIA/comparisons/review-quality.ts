import { readXLSX, createDataFrame } from "../../../packages/dataframe/mod.ts";
import { z } from "zod";

const BASE = "docs/JAMIA/comparisons/RPython-main";

const snippetSchema = z.object({
  id: z.number(),
  url: z.string(),
  lang: z.string(),
  bug: z.string(),
  cause: z.string(),
  effect: z.string(),
  title: z.string(),
  tags: z.string(),
  score: z.number(),
  question_code: z.string(),
  question_text: z.string(),
  top_answer_code: z.string(),
  top_answer_text: z.string(),
  accepted_answer_code: z.string(),
  accepted_answer_text: z.string(),
});

const files = [
  { label: "TM_DFB", path: `${BASE}/TM_DFB_snippets.json` },
  { label: "TM", path: `${BASE}/TM_snippets.json` },
  { label: "IDAP_IB", path: `${BASE}/IDAP_IB_snippets.json` },
  { label: "CDA", path: `${BASE}/CDA_snippets.json` },
  { label: "APIC", path: `${BASE}/APIC_snippets.json` },
  { label: "SM", path: `${BASE}/SM_snippets.json` },
];

for (const f of files) {
  const raw = JSON.parse(await Deno.readTextFile(f.path));
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${f.label} — ${raw.length} snippets`);
  console.log(`${"=".repeat(70)}`);

  // Sample 3 from each
  const sample = raw.sort(() => Math.random() - 0.5).slice(0, 3);
  for (const s of sample) {
    const qCode = Array.isArray(s.question_code) ? s.question_code : [s.question_code];
    const aCode = Array.isArray(s.top_answer_code) ? s.top_answer_code : [s.top_answer_code];

    console.log(`\n--- [${s.lang}] ${s.title} (score: ${s.score}) ---`);
    console.log(`  URL: ${s.url}`);
    console.log(`  Bug: ${s.bug} | Cause: ${s.cause} | Effect: ${s.effect}`);
    console.log(`  Tags: ${Array.isArray(s.tags) ? s.tags.join(", ") : s.tags}`);
    console.log(`  Q code blocks: ${qCode.length} | A code blocks: ${aCode.length}`);

    // Show first Q code block (truncated)
    if (qCode.length > 0 && qCode[0]) {
      console.log(`  Q code (first block, first 200 chars):`);
      console.log(`    ${qCode[0].slice(0, 200).replace(/\n/g, "\n    ")}`);
    } else {
      console.log(`  Q code: NONE`);
    }

    // Show first A code block (truncated)
    if (aCode.length > 0 && aCode[0]) {
      console.log(`  A code (first block, first 200 chars):`);
      console.log(`    ${aCode[0].slice(0, 200).replace(/\n/g, "\n    ")}`);
    } else {
      console.log(`  A code: NONE`);
    }
  }
}
