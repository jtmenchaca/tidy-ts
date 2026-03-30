// Translation of survival package test: concordance3.R
// R reference JSON: concordance3-source-test.R (sibling file)
// Tests concordance model comparison, time weights, and start-stop data
//
// Coverage of concordance3.R:
// [x] Basic concordance on lung by age and sex (reference values)
// [ ] Model comparison (comparing two concordance fits) — needs TS wrapper
// [ ] Time weight functions (timewt="n", "n/G", "n/G2", "S", "S/G", "I") — needs WASM support
// [ ] Start-stop concordance on bladder data — needs counting process concordance
// [ ] Variance comparison between models — needs influence-based variance

import {
  concordance,
  type ConcordanceResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL(
  "./concordance3-source-test.R",
  import.meta.url,
).pathname;

interface Concordance3Ref {
  age_concordance: number;
  age_count: number[];
  sex_concordance: number;
  sex_count: number[];
  default_concordance: number;
  SG_concordance: number;
  bladder_concordance: number;
  bladder_count: number[];
}

const ref = getReferenceFromRScript<Concordance3Ref>(R_SOURCE_TEST);

// ── Baseline concordance values from R ───────────────────────────────────

interface LungRow {
  inst: number | null;
  time: number;
  status: number;
  age: number;
  sex: number;
  ph_ecog: number | null;
  ph_karno: number | null;
  pat_karno: number | null;
  meal_cal: number | null;
  wt_loss: number | null;
}

Deno.test("concordance3: lung age concordance baseline", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  const complete = lung.filter(
    (r) => r.time != null && r.status != null && r.age != null,
  );

  const fit: ConcordanceResult = concordance({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    x: complete.map((r) => r.age),
  });

  assertArrayClose(
    fit.count.slice(0, 5),
    ref.age_count,
    TOL_EXACT,
    "age count",
  );
});

Deno.test("concordance3: lung sex concordance baseline", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  const complete = lung.filter(
    (r) => r.time != null && r.status != null && r.sex != null,
  );

  const fit: ConcordanceResult = concordance({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    x: complete.map((r) => r.sex),
  });

  assertArrayClose(
    fit.count.slice(0, 5),
    ref.sex_count,
    TOL_EXACT,
    "sex count",
  );
});

// ── Stub: time-weighted concordance ──────────────────────────────────────
// concordance3.R tests multiple time weight functions:
//   timewt = "n"   — default, weights by number at risk
//   timewt = "n/G" — weights by n / Kaplan-Meier of censoring
//   timewt = "n/G2" — weights by n / G^2
//   timewt = "S"   — weights by survival function
//   timewt = "S/G" — weights by S/G
//   timewt = "I"   — constant weights
// Our WASM concordance does not yet support the timewt parameter.

// ── Stub: model comparison ───────────────────────────────────────────────
// R allows comparing concordance between two models to test if one
// has significantly better discrimination. This requires influence-based
// variance and covariance estimation between model predictions.

// ── Stub: start-stop concordance ─────────────────────────────────────────
// Start-stop (counting process) concordance on bladder dataset requires
// extending the WASM concordance function to accept (start, stop, event).
