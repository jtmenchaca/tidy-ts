import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { id: 1, "ph.ecog": 0, age: 60 },
  { id: 2, "ph.ecog": 1, age: 70 },
  { id: 3, "ph.ecog": 2, age: 65 },
]);

console.log("=== column access ===");
console.log("df['ph.ecog']:", df["ph.ecog"]);

console.log("\n=== row access via mutate ===");
const m = df.mutate({
  doubled: (r) => r["ph.ecog"] * 2,
});
console.log(m.toRows());

console.log("\n=== filter on dot column ===");
const f = df.filter((r) => r["ph.ecog"] > 0);
console.log(f.toRows());

console.log("\n=== groupBy + summarize ===");
const g = df.groupBy("ph.ecog").summarize({
  meanAge: (group) => s.mean(group.age),
});
console.log(g.toRows());

console.log("\n=== inside summarize: group['ph.ecog'] ===");
const g2 = df.summarize({
  meanEcog: (group) => s.mean(group["ph.ecog"]),
});
console.log(g2.toRows());

// Type narrow check
const _typed: { id: number; "ph.ecog": number; age: number } = df.toRows()[0];
console.log("\nType inference works for r['ph.ecog']:", typeof _typed["ph.ecog"]);
