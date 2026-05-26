// Skill test: target trial SEQdata analysis using ONLY tidy-ts-best-practices skill knowledge.
import { readCSV, stats as s, concatDataFrames } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  ID: z.number(),
  time: z.number(),
  eligible: z.number(),
  outcome: z.number(),
  tx_init: z.number(),
  sex: z.number(),
  N: z.number(),
  L: z.number(),
  P: z.number(),
  excusedZero: z.number(),
  excusedOne: z.number(),
});

const mainRaw = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/targetTrial/SEQdata.csv",
  schema,
);
const ltfuRaw = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/targetTrial/SEQdata_LTFU.csv",
  schema,
);

// 1) Stack with cohort column
const main = mainRaw.mutate({ cohort: () => "main" as const });
const ltfu = ltfuRaw.mutate({ cohort: () => "ltfu" as const });
const combined = concatDataFrames([main, ltfu]);

console.log("Combined rows:", combined.nrows());

// 2) Unique patient IDs per cohort
const uniqueIds = combined
  .groupBy("cohort")
  .summarize({
    unique_patients: (g) => s.uniqueCount(g.ID),
  });
uniqueIds.print("Unique patient IDs per cohort:");

// 3) Baseline (time == 0) mean & sd of N, L, P per cohort
const baseline = combined
  .filter((r) => r.time === 0)
  .groupBy("cohort")
  .summarize({
    n_rows: (g) => g.nrows(),
    mean_N: (g) => s.round(s.mean(g.N), 4),
    sd_N: (g) => s.round(s.stdev(g.N), 4),
    mean_L: (g) => s.round(s.mean(g.L), 4),
    sd_L: (g) => s.round(s.stdev(g.L), 4),
    mean_P: (g) => s.round(s.mean(g.P), 4),
    sd_P: (g) => s.round(s.stdev(g.P), 4),
  });
baseline.print("Baseline (time==0) summary by cohort:");

// 4) First time tx_init == 1 per patient, then histogram by (cohort, init_time)
const initTimes = combined
  .filter((r) => r.tx_init === 1)
  .groupBy("cohort", "ID")
  .summarize({
    init_time: (g) => s.min(g.time),
  });

const initHistogram = initTimes
  .ungroup()
  .groupBy("cohort", "init_time")
  .summarize({
    n_patients: (g) => g.nrows(),
  })
  .arrange(["cohort", "init_time"], ["asc", "asc"]);

initHistogram.print("Patients first initiating at each time, by cohort:");

// Also report how many never initiated, per cohort
const everInit = combined
  .groupBy("cohort", "ID")
  .summarize({
    ever_init: (g) => s.max(g.tx_init),
  });

const neverInit = everInit
  .ungroup()
  .filter((r) => r.ever_init === 0)
  .groupBy("cohort")
  .summarize({
    n_never_initiated: (g) => g.nrows(),
  });
neverInit.print("Patients who never initiated, by cohort:");

// 5) Cumulative event rate for outcome == 1 by time across the combined data
// Per time: events_at_t = sum(outcome) at that time; total_at_t = rows at that time
// Cumulative event rate by t = cumulative_events / cumulative_person-time? The task
// says "cumulative event rate for outcome == 1 by time" across all patient-timepoints.
// Interpret as: cumulative count of outcome events through time t divided by
// cumulative total patient-timepoint rows through time t.
const byTime = combined
  .groupBy("time")
  .summarize({
    events: (g) => s.sum(g.outcome),
    n_rows: (g) => g.nrows(),
  })
  .ungroup()
  .arrange("time");

const cumEvents = s.cumsum(byTime.events);
const cumRows = s.cumsum(byTime.n_rows);
const cumRate = cumEvents.map((e, i) => {
  const denom = cumRows[i];
  if (denom == null || denom === 0) return null;
  return s.round(e / denom, 6);
});

const cumulativeRate = byTime.mutate({
  cum_events: cumEvents,
  cum_rows: cumRows,
  cum_event_rate: cumRate,
});
cumulativeRate.print("Cumulative event rate by time (combined cohorts):");
