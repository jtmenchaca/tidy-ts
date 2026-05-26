import {
  createDataFrame,
  readCSV,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { z } from "zod";

// 0. Load CSV with a typed schema. Columns: id, laser, age, eye, trt, risk, time, status.
const schema = z.object({
  id: z.number(),
  laser: z.string(),
  age: z.number(),
  eye: z.string(),
  trt: z.number(),
  risk: z.number(),
  time: z.number(),
  status: z.number(),
});

const long = await readCSV(
  "packages/testing/fixtures/survival/diabetic.csv",
  schema,
);

long.sliceHead(4).print("raw long format (first 4 rows)");

// 1. Reshape long -> one row per patient with time_left, time_right, status_left, status_right
// Strategy: split into left-eye and right-eye frames, then innerJoin on patient id.
const left = long
  .filter((r) => r.eye === "left")
  .rename({ time: "time_left", status: "status_left", trt: "trt_left" })
  .select("id", "age", "laser", "time_left", "status_left", "trt_left");

const right = long
  .filter((r) => r.eye === "right")
  .rename({ time: "time_right", status: "status_right", trt: "trt_right" })
  .select("id", "time_right", "status_right", "trt_right");

// Treated-eye indicator: which eye was treated. In this trial exactly one eye per
// patient is treated, so we derive a single column.
const wide = left.innerJoin(right, "id").mutate({
  treated_eye: (r) => (r.trt_left === 1 ? "left" : "right"),
});

wide.sliceHead(4).print("wide one-row-per-patient (first 4)");
console.log(`Total patients: ${wide.nrows()}`);

// 2. Fraction of treated eyes with vision loss vs untreated eyes with vision loss.
// In the long form, trt indicates treatment; status indicates vision loss event.
const treated = long.filter((r) => r.trt === 1);
const untreated = long.filter((r) => r.trt === 0);

const treatedLossRate = s.mean(treated.status); // status is 0/1 so mean = proportion
const untreatedLossRate = s.mean(untreated.status);

console.log(
  `Treated eyes:   ${treated.nrows()}, vision-loss rate = ${
    s.round(treatedLossRate, 4)
  }`,
);
console.log(
  `Untreated eyes: ${untreated.nrows()}, vision-loss rate = ${
    s.round(untreatedLossRate, 4)
  }`,
);

// 3. Paired comparison of follow-up time within each patient (treated vs untreated eye).
// Build matched arrays in the same patient order.
const time_treated = wide
  .mutate({
    t_treated: (r) => r.trt_left === 1 ? r.time_left : r.time_right,
    t_untreated: (r) => r.trt_left === 1 ? r.time_right : r.time_left,
  });

const xs = time_treated.t_treated;
const ys = time_treated.t_untreated;

// Check normality of within-patient differences first, then pick paired t or Wilcoxon.
const diffs = xs.map((v, i) => v - ys[i]);
const diffsDF = createDataFrame([{ d: 0 }]); // dummy to satisfy type
void diffsDF;
const normRes = s.test.normality.shapiroWilk({ data: diffs });
console.log(
  `Shapiro-Wilk on within-patient diffs: W = ${
    s.round(normRes.testStatistic.value, 4)
  }, p = ${s.round(normRes.pValue, 4)}`,
);

const paired = s.test.t.paired({ x: xs, y: ys });
console.log(
  `Paired t-test (treated vs untreated follow-up): t = ${
    s.round(paired.testStatistic.value, 4)
  }, p = ${s.round(paired.pValue, 4)}, mean diff = ${
    s.round(s.mean(diffs), 4)
  }`,
);

const wilcox = s.test.nonparametric.wilcoxon({ x: xs, y: ys });
console.log(
  `Wilcoxon signed-rank: W = ${
    s.round(wilcox.testStatistic.value, 4)
  }, p = ${s.round(wilcox.pValue, 4)}`,
);

// 4. Group by laser type — mean follow-up time and vision-loss rate per group (long-format).
const byLaser = long
  .groupBy("laser")
  .summarize({
    n_eyes: (g) => g.nrows(),
    mean_time: (g) => s.mean(g.time),
    vision_loss_rate: (g) => s.mean(g.status),
  });

byLaser.print("By laser type (eye-level)");

// 5. Of patients whose treated eye had vision loss, write the wide format to CSV.
const treatedEyeLost = wide.filter((r) =>
  (r.trt_left === 1 && r.status_left === 1) ||
  (r.trt_right === 1 && r.status_right === 1)
);

console.log(
  `Patients with treated-eye vision loss: ${treatedEyeLost.nrows()}`,
);
treatedEyeLost.sliceHead(3).print("treatedEyeLost (first 3)");

await writeCSV(treatedEyeLost, "treated-eye-events.csv");
console.log("Wrote treated-eye-events.csv");
