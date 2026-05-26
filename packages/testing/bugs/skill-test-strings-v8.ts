import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  age: z.number().nullable(),
  sex: z.string(),
  abo: z.string(),
  year: z.number(),
  futime: z.number(),
  event: z.string(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/transplant.csv",
  schema,
);

// Task 1: count patients per event, sort desc, print
const eventCounts = df
  .groupBy("event")
  .summarize({ count: (g) => g.nrows() })
  .arrange("count", "desc");
eventCounts.print("Patients per event (desc):");

// Task 2: add event_label column, print first 5
const labeled = df.mutate({
  event_label: (r) => {
    switch (r.event) {
      case "ltx":
        return "Liver Transplant";
      case "death":
        return "Death";
      case "censored":
        return "Censored";
      case "withdraw":
        return "Withdrew";
      default:
        return r.event;
    }
  },
});
labeled.sliceHead(5).print("First 5 with event_label:");

// Task 3: sex_upper
const withSexUpper = labeled.mutate({
  sex_upper: (r) => r.sex.toUpperCase(),
});

// Task 4: is_typeO
const withTypeO = withSexUpper.mutate({
  is_typeO: (r) => r.abo === "O",
});
const typeOCount = withTypeO.filter((r) => r.is_typeO).nrows();
console.log(`Type O patient count: ${typeOCount}`);

// Task 5: group by abo, compute death rate
const byAbo = withTypeO
  .groupBy("abo")
  .summarize({
    n_patients: (g) => g.nrows(),
    n_deaths: (g) => g.event.filter((e) => e === "death").length,
    death_rate: (g) =>
      g.event.filter((e) => e === "death").length / g.nrows(),
  })
  .arrange("abo");
byAbo.print("Death rate by ABO:");

// Task 6: write CSV
await writeCSV(
  byAbo,
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/transplant-by-abo.csv",
);
console.log("Wrote transplant-by-abo.csv");

// Suppress unused-import warning for s if any
void s;
