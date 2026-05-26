import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Source data: one row per site, lab values held as arrays
const raw = createDataFrame([
  { site: "Site-A", lab_values: [10, 12, 14] },
  { site: "Site-B", lab_values: [20, 22] },
  { site: "Site-C", lab_values: [30] },
  { site: "Site-D", lab_values: [40, 42, 44, 46] },
]);

// Task 1: explode the array column so every value becomes its own row.
const expanded = raw.unnest("lab_values");
expanded.print("Task 1 — expanded rows (one lab value per row):");

// Task 2: site-level summary (mean / min / max / count).
const summary = expanded
  .groupBy("site")
  .summarize({
    mean_value: (g) => s.mean(g.lab_values),
    min_value: (g) => s.min(g.lab_values),
    max_value: (g) => s.max(g.lab_values),
    count: (g) => g.nrows(),
  });
summary.print("Task 2 — per-site summary:");

// Task 3: flip rows and columns — each statistic becomes a row,
// each site becomes a column. Use pivotLonger → pivotWider so the
// site values become real column names (Site-A, Site-B, …) and the
// statistic names occupy a single "statistic" column with 4 rows.
const flipped = summary
  .pivotLonger({
    cols: ["mean_value", "min_value", "max_value", "count"],
    namesTo: "statistic",
    valuesTo: "value",
  })
  .pivotWider({
    namesFrom: "site",
    valuesFrom: "value",
    expectedColumns: ["Site-A", "Site-B", "Site-C", "Site-D"],
  });
flipped.print("Task 3 — flipped (stats as rows, sites as columns):");

// Task 4: flip it back — pivotLonger the site columns into a single
// site column, then pivotWider on the statistic names. Should match
// Task 2 row-for-row.
const back = flipped
  .pivotLonger({
    cols: ["Site-A", "Site-B", "Site-C", "Site-D"],
    namesTo: "site",
    valuesTo: "value",
  })
  .pivotWider({
    namesFrom: "statistic",
    valuesFrom: "value",
    expectedColumns: ["mean_value", "min_value", "max_value", "count"],
  });
back.print("Task 4 — flipped back (should match Task 2):");
