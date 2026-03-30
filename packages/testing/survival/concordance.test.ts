// Translation of survival package test: concordance.R
// R reference JSON: concordance-source-test.R (sibling file)
// Tests the concordance statistic on AML and lung datasets
//
// Coverage of concordance.R:
// [x] AML maintained subset: concordance count = c(24, 14, 2, 0)
// [x] Lung data: concordance by age (reverse=TRUE)
// [x] Lung data: concordance by ph.ecog (reverse=TRUE), count = c(8392, 4258, 7137, 21, 7)
// [ ] Concordance with ties handling details
// [ ] Concordance for multi-state outcomes

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
  "./concordance-source-test.R",
  import.meta.url,
).pathname;

interface ConcordanceRef {
  aml_count: number[];
  aml_concordance: number;
  lung_age_count: number[];
  lung_age_conc: number;
  lung_ecog_count: number[];
  lung_ecog_conc: number;
}

const ref = getReferenceFromRScript<ConcordanceRef>(R_SOURCE_TEST);

// ── AML maintained subset ────────────────────────────────────────────────

Deno.test("concordance: AML maintained subset counts", () => {
  // Inline AML maintained subset data
  const tdata = {
    time: [9, 13, 13, 18, 23, 28, 31, 34, 45, 48, 161],
    status: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
    x: [1, 6, 2, 7, 3, 7, 3, 8, 4, 4, 5],
  };

  const fit: ConcordanceResult = concordance({
    time: tdata.time,
    status: tdata.status,
    x: tdata.x,
  });

  // Expected count: c(24, 14, 2, 0) — concordant, discordant, tied.x, tied.y
  assertArrayClose(
    fit.count.slice(0, 4),
    ref.aml_count,
    TOL_EXACT,
    "aml count",
  );
});

// ── Lung data: concordance by age ────────────────────────────────────────

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

Deno.test("concordance: lung age counts", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  const complete = lung.filter(
    (r) => r.time != null && r.status != null && r.age != null,
  );

  const fit: ConcordanceResult = concordance({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    x: complete.map((r) => r.age),
    options: { reverse: true },
  });
  assertArrayClose(
    fit.count.slice(0, 5),
    ref.lung_age_count,
    TOL_EXACT,
    "lung age count",
  );
});

// ── Lung data: concordance by ph.ecog ────────────────────────────────────

Deno.test("concordance: lung ph.ecog counts", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  const complete = lung.filter(
    (r) => r.time != null && r.status != null && r.ph_ecog != null,
  );

  const fit: ConcordanceResult = concordance({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    x: complete.map((r) => r.ph_ecog!),
    options: { reverse: true },
  });

  // Expected: c(8392, 4258, 7137, 21, 7)
  assertArrayClose(
    fit.count.slice(0, 5),
    ref.lung_ecog_count,
    TOL_EXACT,
    "lung ecog count",
  );
});
