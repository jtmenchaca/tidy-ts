/**
 * Verify all Polars and Arquero probes produce the correct number of results
 * and compare outcomes across pandas, polars, and arquero.
 *
 * Usage: deno run -A joss/comparisons/verify-probes.ts
 */

interface ProbeResult {
  outcome: "error" | "warning" | "silent";
  message: string;
  result: unknown;
}

function runPython(script: string): ProbeResult[] {
  const cmd = new Deno.Command("python3", { args: [script], stdout: "piped", stderr: "piped" });
  const { code, stdout, stderr } = cmd.outputSync();
  if (code !== 0) {
    console.error(`FAIL: ${script}\n${new TextDecoder().decode(stderr)}`);
    return [];
  }
  return JSON.parse(new TextDecoder().decode(stdout));
}

function runDeno(script: string): ProbeResult[] {
  const cmd = new Deno.Command("deno", { args: ["run", "-A", script], stdout: "piped", stderr: "piped" });
  const { code, stdout, stderr } = cmd.outputSync();
  if (code !== 0) {
    console.error(`FAIL: ${script}\n${new TextDecoder().decode(stderr)}`);
    return [];
  }
  return JSON.parse(new TextDecoder().decode(stdout));
}

const categories = [
  { name: "Cat 1: Column/Schema Reference", dir: "cat-1-column-schema-reference", n: 16 },
  { name: "Cat 2: Type Safety", dir: "cat-2-type-safety", n: 14 },
  { name: "Cat 3: Null/Missing Data", dir: "cat-3-null-missing-data", n: 17 },
  { name: "Cat 4: Join Safety", dir: "cat-4-join-safety", n: 8 },
  { name: "Cat 5: Schema Composition", dir: "cat-5-schema-composition", n: 10 },
];

const base = "joss/comparisons";

let totalPdErr = 0, totalPlErr = 0, totalAqErr = 0;
let totalPdSil = 0, totalPlSil = 0, totalAqSil = 0;
let totalCases = 0;
let allOk = true;

console.log("Category".padEnd(35), "Cases", "pd-err", "pd-sil", "pl-err", "pl-sil", "aq-err", "aq-sil");
console.log("-".repeat(95));

for (const cat of categories) {
  const pandas = runPython(`${base}/${cat.dir}/probe.py`);
  const polars = runPython(`${base}/${cat.dir}/probe-polars.py`);
  const arquero = runDeno(`${base}/${cat.dir}/probe-arquero.ts`);

  for (const [label, results] of [["pandas", pandas], ["polars", polars], ["arquero", arquero]] as const) {
    if (results.length !== cat.n) {
      console.error(`  ${cat.dir} ${label}: expected ${cat.n} results, got ${results.length}`);
      allOk = false;
    }
  }

  const pdErr = pandas.filter(r => r.outcome === "error").length;
  const pdSil = pandas.filter(r => r.outcome !== "error").length;
  const plErr = polars.filter(r => r.outcome === "error").length;
  const plSil = polars.filter(r => r.outcome !== "error").length;
  const aqErr = arquero.filter(r => r.outcome === "error").length;
  const aqSil = arquero.filter(r => r.outcome !== "error").length;

  totalPdErr += pdErr; totalPdSil += pdSil;
  totalPlErr += plErr; totalPlSil += plSil;
  totalAqErr += aqErr; totalAqSil += aqSil;
  totalCases += cat.n;

  console.log(
    cat.name.padEnd(35),
    String(cat.n).padStart(5),
    String(pdErr).padStart(6), String(pdSil).padStart(6),
    String(plErr).padStart(6), String(plSil).padStart(6),
    String(aqErr).padStart(6), String(aqSil).padStart(6),
  );

  // Per-case detail
  const letters = "abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < cat.n; i++) {
    const pd = pandas[i]?.outcome ?? "?";
    const pl = polars[i]?.outcome ?? "?";
    const aq = arquero[i]?.outcome ?? "?";
    if (pd !== pl || pd !== aq) {
      console.log(`    ${letters[i]}: pd=${pd}  pl=${pl}  aq=${aq}`);
    }
  }
}

console.log("-".repeat(95));
console.log(
  "TOTAL".padEnd(35),
  String(totalCases).padStart(5),
  String(totalPdErr).padStart(6), String(totalPdSil).padStart(6),
  String(totalPlErr).padStart(6), String(totalPlSil).padStart(6),
  String(totalAqErr).padStart(6), String(totalAqSil).padStart(6),
);

console.log(`\nSilent rate: pandas ${(totalPdSil/totalCases*100).toFixed(0)}%  polars ${(totalPlSil/totalCases*100).toFixed(0)}%  arquero ${(totalAqSil/totalCases*100).toFixed(0)}%`);
console.log(`\nAll counts match: ${allOk}`);
