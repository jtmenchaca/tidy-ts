import { createDataFrame } from "@tidy-ts/dataframe";

// Simulate 2.6M visit diagnosis rows
const N = 1_000_000;
console.log(`Building ${N.toLocaleString()} rows...`);

const pat_ids: (string | null)[] = [];
const dx_ids: (number | null)[] = [];
const contact_dates: (Date | null)[] = [];

for (let i = 0; i < N; i++) {
  pat_ids.push(i % 100 === 0 ? null : `PAT${i % 8000}`);
  dx_ids.push(i % 200 === 0 ? null : (i % 150000) + 1);
  contact_dates.push(i % 300 === 0 ? null : new Date(2025, 0, 1));
}

console.log("Creating DataFrame...");
let t = performance.now();
const df = createDataFrame({
  columns: { pat_id: pat_ids, dx_id: dx_ids, contact_date: contact_dates },
});
console.log(`  createDataFrame: ${df.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Build a lookup map (simulating 150K dx_ids)
const lookup = new Map<string, { code: string; code_system: string }>();
for (let i = 1; i <= 150000; i++) {
  lookup.set(String(i), { code: `J45.${i % 10}`, code_system: "ICD10CM" });
}

// Step 1: removeNull("pat_id")
t = performance.now();
const step1 = df.removeNull("pat_id");
console.log(`  removeNull(pat_id): ${step1.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 2: removeNull("dx_id")
t = performance.now();
const step2 = step1.removeNull("dx_id");
console.log(`  removeNull(dx_id): ${step2.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 3: removeNull("contact_date")
t = performance.now();
const step3 = step2.removeNull("contact_date");
console.log(`  removeNull(contact_date): ${step3.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 4: filter
t = performance.now();
const step4 = step3.filter((r) => lookup.has(String(r.dx_id)));
console.log(`  filter(lookup.has): ${step4.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 5: mutate - id only
t = performance.now();
const step5a = step4.mutate({ id: (r) => r.pat_id });
console.log(`  mutate(id): ${step5a.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 5b: mutate - code
t = performance.now();
const step5b = step5a.mutate({ code: (r) => lookup.get(String(r.dx_id))!.code });
console.log(`  mutate(code): ${step5b.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 5c: mutate - codeSystem
t = performance.now();
const step5c = step5b.mutate({ codeSystem: (r) => lookup.get(String(r.dx_id))!.code_system });
console.log(`  mutate(codeSystem): ${step5c.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 5d: mutate - static fields
t = performance.now();
const step5d = step5c.mutate({
  clinicalStatus: () => "active",
  verificationStatus: () => "confirmed",
  category: () => "encounter-diagnosis",
  categorySystem: () => "HL7ConditionCategory",
});
console.log(`  mutate(static fields): ${step5d.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 5e: mutate - onsetDateTime
t = performance.now();
const step5e = step5d.mutate({ onsetDateTime: (r) => r.contact_date });
console.log(`  mutate(onsetDateTime): ${step5e.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

// Step 6: select
t = performance.now();
const result = step5e.select("id", "code", "codeSystem", "clinicalStatus", "verificationStatus", "category", "categorySystem", "onsetDateTime");
console.log(`  select: ${result.nrows().toLocaleString()} rows in ${((performance.now() - t) / 1000).toFixed(2)}s`);

console.log("\nDone.");
