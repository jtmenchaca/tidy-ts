# tidy-ts-best-practices — Coverage matrix

Working artifact for the `create-agent-test-tidy-ts` testing skill. See [CONTEXT.md](./CONTEXT.md) for the glossary that pins every term used here.

**Outcome legend**: `✓` clean · `⚠` friction (soft observation, no pasted error) · `✗` evidence-backed bug

**Tier rule**:
- **Hole** — `clean = 0`. Target on next dispatch.
- **Needs re-confirmation** — any bug fixed but no `clean` agent run has confirmed the fix since. Target on next dispatch.
- **Covered** — `clean ≥ 2` and no outstanding bug.

**Drift**: matrix rows are short labels, not necessarily verbatim heading text. To find rule headings that aren't represented anywhere in the matrix (or matrix rows that no longer match any heading), run:

```
deno run -A packages/testing/skills/tidy-ts-best-practices/drift-check.ts
```

Some output is expected (friendly labels vs literal headings). Investigate when the count of missing rows looks high.

## Coverage (current)

Counts are derived from the chronological log below. Last-touched is the most recent log entry that exercised the feature.

### dataframe-pipeline.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Creating DataFrames      |  many |    0     |  0   | recent      | covered |
| Mutate / transmute       |  many |    0     |  0   | recent      | covered |
| Arrange (sort)           |   8   |    1     |  0   | run-22      | covered |
| Distinct                 |   3   |    0     |  0   | run-23      | covered |
| Rename / select / drop   |   6   |    0     |  0   | recent      | covered |
| Filter                   |  many |    0     |  0   | recent      | covered |
| Slice (positional)       |   3   |    0     |  0   | run-26      | covered |
| Slice variants           |   5   |    0     |  0   | run-26      | covered |
| Extract (column → array) |   5   |    0     |  0   | run-26      | covered |
| Display (print)          |  many |    0     |  ✗1  | run-25      | needs re-confirmation (Temporal `{}` bug fixed, no clean re-hit yet) |
| Shape & introspection (`nrows`, `columns`) |  1  |  ⚠1   |  0   | run-34      | needs re-confirmation (`columns()` now documented after run-34) |

### dataframe-grouping.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| summarize (sync)         |  many |    0     |  0   | recent      | covered |
| summarizeAsync           |   0   |    0     |  0   | —           | hole |
| Counting rows            |  many |    0     |  ✗1  | recent      | needs re-confirmation (`df.count()` collision fixed, several clean post-fix hits) |
| ungroup                  |   1   |    0     |  0   | run-12      | needs re-confirmation |
| mutateOverGroup          |   6   |    0     |  0   | run-22      | covered |
| Grouped slice verbs      |   3   |    0     |  0   | run-22      | covered |

### dataframe-joins.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Semantics                |   3   |    0     |  0   | run-23      | covered |
| Two overloads            |   2   |    0     |  0   | run-23      | covered |
| keys vs suffixes         |   1   |    ⚠1    |  0   | run-41      | needs re-confirmation (right-key column behavior documented after run-41) |
| Chaining joins           |   1   |    0     |  0   | run-41      | needs re-confirmation |
| Validate keys when dynamic |  1  |    0     |  0   | run-48      | needs re-confirmation |
| asofJoin (time-series)   |   1   |    0     |  ✗1  | run-26      | needs re-confirmation (`group_by` _x/_y bug fixed) |
| crossJoin (Cartesian)    |   1   |    ⚠1    |  0   | run-41      | needs re-confirmation (complete()/expand_grid recipe added after run-41) |

### dataframe-reshaping.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| pivotLonger              |   2   |    0     |  0   | run-09      | covered |
| pivotWider               |   3   |    0     |  0   | run-22      | covered |
| transpose                |   0   |    ⚠1    |  0   | run-38      | needs re-confirmation (dataframe-reshaping.md now documents setRowLabels→transpose pattern, round-trip behavior, and rule of thumb vs pivotWider/pivotLonger) |
| unnest                   |   1   |    0     |  0   | run-38      | needs re-confirmation |
| bindRows / concatDataFrames |  2  |   0     |  0   | run-14      | covered |

### dataframe-time-series.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Frequency                |   3   |    0     |  ✗1  | run-25      | needs re-confirmation (Temporal.Duration shape; quarters removed) |
| downsample               |   3   |    0     |  ✗1  | run-25      | needs re-confirmation (Temporal output preservation fix) |
| upsample                 |   1   |    0     |  ✗1  | run-15      | needs re-confirmation (same fix) |
| Complete workflow        |   0   |    0     |  ✗1  | run-40      | needs re-confirmation (downsample/upsample group preservation fixed — 4 pinned regressions added) |

### dataframe-missing-data.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Remove rows (narrows types) | 4 |    0     |  ✗1  | run-22      | needs re-confirmation (`removeUndefined` narrowing for Zod-optional) |
| Replace values           |   1   |    0     |  0   | run-37      | needs re-confirmation |
| Forward / backward fill  |   1   |    0     |  0   | run-37      | needs re-confirmation |
| Interpolate              |   1   |    0     |  0   | run-37      | needs re-confirmation |

### io.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| CSV (readCSV, peekCSV, writeCSV) | many | 0  | ✗3 | recent      | needs re-confirmation (positional-fill, peek empty-headers, writeCSV Temporal triple-quote — all fixed) |
| XLSX                     |   2   |    0     |  ✗1  | run-11      | needs re-confirmation (allowDuplicateHeaders) |
| JSON                     |   1   |    0     |  0   | run-34      | needs re-confirmation |
| Arrow                    |   1   |    ⚠1    |  0   | run-34      | needs re-confirmation (`writeArrow` documented after run-34) |
| Parquet                  |   1   |    0     |  0   | run-34      | needs re-confirmation |

### dataframe-performance.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Direct column access     |  many |    0     |  0   | recent      | covered |
| Chained filters          |   0   |    0     |  0   | —           | hole |
| `extract` for stats      |   3   |    0     |  0   | run-22      | covered |
| `select` to narrow       |   2   |    0     |  0   | run-22      | covered |
| Creation from columns    |   1   |    0     |  0   | run-09      | needs re-confirmation |
| Browser setup            |   0   |    0     |  0   | —           | hole |

### stats-descriptive.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Null / NaN handling      |  many |    0     |  0   | recent      | covered |
| Central tendency         |  many |    0     |  0   | recent      | covered |
| Sum & product            |   5   |    0     |  0   | run-23      | covered |
| Extremes & order         |   2   |    0     |  ✗1  | run-19      | needs re-confirmation (`s.first`/`s.last` overload returning array) |
| Spread (sd, variance)    |   6   |    0     |  0   | run-22      | covered |
| Quantiles                |   2   |    0     |  0   | run-26      | covered |
| Bivariate (correlation array) | 2 |   0     |  0   | run-22      | covered |
| Counts & uniqueness      |   3   |    0     |  0   | run-23      | covered |
| Boolean aggregates       |   1   |    0     |  0   | run-22      | needs re-confirmation |
| Transformations          |   2   |    0     |  0   | run-22      | covered |

### stats-tests.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| t-tests                  |  many |    0     |  0   | run-23      | covered |
| z-tests                  |   1   |    0     |  0   | run-42      | needs re-confirmation |
| ANOVA                    |   3   |    0     |  ✗1  | run-63      | needs re-confirmation (two-way Type I sequential SS via glm_fit effects after run-63; matches R aov() on balanced and unbalanced data; pinned) |
| Nonparametric (Mann-Whitney, KW, Wilcoxon) | 5 | 0 | ✗3 | run-61 | needs re-confirmation (MW + Wilcoxon effect-size formulas + Wilcoxon `exact?`/`correct?` regimes plumbed; matches R `wilcox.test` across all three regimes; pinned) |
| Categorical (chi-square, Fisher) | 3 | ⚠2    |  ✗1   | run-58      | needs re-confirmation (Fisher OR-on-effectSize doc fixed after run-58; chi-square matches R to 1e-13) |
| Correlation (Kendall tau-b) |  1   |    0     |  ✗1  | run-54      | needs re-confirmation (was tau-a, now tau-b — matches R; pinned) |
| Correlation (Pearson/Spearman/Kendall) | 2 | 0 | 0 | run-22 | covered |
| Proportion               |   2   |    0     |  ✗1  | run-59      | needs re-confirmation (`correct?` option plumbed after run-59; matches `prop.test(correct=TRUE/FALSE)`; pinned) |
| Normality (Shapiro-Wilk, AD, K-S) | 2 | ⚠1   |  0   | run-60      | needs re-confirmation (18/18 match R; `kolmogorovSmirnovNormal` API exposed after run-60; pinned) |
| Post-hoc (Tukey, Games-Howell, Dunn) | 3 | 0  | ✗4 | run-57 | needs re-confirmation (Tukey CI/adjP fixed via R ptukey/qtukey port; Dunn fully matches R `dunn.test` package after porting signed Z + one-sided Bonferroni from vendored source; all pinned) |
| Decision guide           |   1   |    0     |  0   | run-22      | needs re-confirmation |

### stats-compare.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| One group                |   1   |    0     |  0   | run-44      | needs re-confirmation |
| Two groups (auto-select) |   3   |    0     |  0   | run-23      | covered |
| Multi-group (3+)         |   1   |    0     |  ✗1  | run-44      | needs re-confirmation (`post_hoc` field renamed to `postHoc` after run-44 — outlier in otherwise camelCase API) |

### stats-glm.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Signature                |   5   |    0     |  0   | run-23      | covered |
| Common combinations      |   4   |    0     |  0   | run-23      | covered |
| Fit + inspect (summary)  |   4   |    0     |  ✗1  | run-23      | needs re-confirmation (R²/F/n_obs added to summary, adj-R² formula fix) |
| Predict                  |   1   |    0     |  0   | run-32      | needs re-confirmation |
| Other instance methods (residuals, confint, vcov, anova) | 4 | ⚠3 | 0 | run-52 | covered (confint method now documented; runs 50/51/52 verified residuals/confint/vcov against R) |
| Diagnostics & influence  |   1   |    ⚠1    |  0   | run-49      | needs re-confirmation (`rstandard`, `rstudent`, `leverage`, `influence()` were undocumented — doc added after run-49) |
| Validation vs R (gaussian/binomial/poisson) | 3 | 0 | 0 | run-52 | covered (28/30, 27/29, 29/29 PASS; all numeric diffs at 1e-13) |
| Validation vs R (categorical + continuous lm) | 1 | 0 | 0 | run-55 | covered (28/28 PASS to ~1e-12; encoding recipe documented) |
| Validation vs R (weighted GLM / lm(weights)) | 1 | 0 | 0 | run-62 | covered (15/15 PASS to 1e-13) |
| Validation vs R (two-way ANOVA Type I) | 1 | 0 | ✗1 | run-63 | covered (Type I sequential via glm_fit; matches aov() on balanced and unbalanced) |
| Validation vs R (Levene mean + median) | 1 | 0 | ✗1 | run-64 | covered (both centers match leveneTest to 1e-14) |

### stats-window.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Rolling window           |   2   |    0     |  0   | run-25      | covered |
| Lag / lead               |   2   |    0     |  0   | run-22      | covered |
| Forward / backward fill (array) | 1 | 0   |  0   | run-46      | needs re-confirmation |
| Interpolate (array)      |   1   |    0     |  0   | run-46      | needs re-confirmation |
| Cumulative               |   3   |    0     |  0   | run-42      | covered |
| Ranking                  |   2   |    ⚠1    |  0   | run-45      | needs re-confirmation (`s.rank(..., {ties:"first"})` + `s.rowNumber()` re-confirmed in run-45 against fresh dist; run-45's TS errors were a stale-dist artifact, dropped) |
| Async utilities          |   0   |    0     |  0   | —           | hole |

### stats-distributions.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| PDF / PMF                |   2   |    0     |  ✗ doc | run-47    | covered |
| CDF / right-tail p-values |  2   |    0     |  0   | run-47      | covered |
| Critical values (inverse CDF) | 2 | 0     |  0   | run-47      | covered |
| Random samples (with seed) |  2  |    0     |  ✗3  | run-47      | covered (seed determinism re-verified in run-47 inside workspace; agent's TS2769 claim refuted — stale-dist artifact) |
| Plotting data            |   0   |    0     |  0   | —           | hole |

### async-and-result.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Sync/async split         |   1   |    0     |  0   | run-43      | needs re-confirmation |
| ConcurrencyOptions       |   2   |    0     |  0   | run-43      | covered |
| parallel / batch / chunk |   1   |    0     |  0   | run-29      | needs re-confirmation |
| Composing with Result types (tryAsync, defineError) | 2 | 0 | 0 | run-43 | covered |

### shims.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Result types             |   2   |    0     |  0   | run-36      | covered |
| tidyfetch                |   1   |    0     |  0   | run-36      | needs re-confirmation |
| Concurrency              |   2   |    0     |  0   | run-36      | covered |
| Filesystem               |   1   |    0     |  0   | run-29      | needs re-confirmation |
| Encryption (envelope)    |   1   |    0     |  0   | run-36      | needs re-confirmation |
| Env, args, exit, test    |   1   |    0     |  0   | run-29      | needs re-confirmation |
| Runtime detection        |   0   |    0     |  0   | —           | hole |
| Path                     |   0   |    0     |  0   | —           | hole |

### graph.md

| Feature                  | clean | friction | bugs | last        | tier |
|--------------------------|-------|----------|------|-------------|------|
| Basic shape              |   2   |    0     |  0   | run-30      | covered |
| Mappings                 |   1   |    0     |  0   | run-30      | needs re-confirmation |
| Chart types              |   1   |    1     |  0   | run-30      | needs re-confirmation (no box-plot — library gap) |
| Common configurations    |   1   |    0     |  0   | run-30      | needs re-confirmation |
| Custom tooltip           |   1   |    0     |  0   | run-35      | needs re-confirmation |
| Save to file             |   3   |    0     |  0   | run-35      | covered |
| React integration        |   1   |    ⚠1    |  0   | run-35      | needs re-confirmation (typed React example added after run-35) |
| Pre-flight validation    |   0   |    0     |  0   | —           | hole |

---

## Chronological log

Entries are append-only. Format: `run-NN — YYYY-MM-DD — intent (dataset) — outcome — features`. "Outcome" is the overall outcome (clean, friction, bug); see the matrix for per-feature outcomes when a single run touched multiple features with different outcomes.

### Pre-tracking

Runs before 2026-05-18 were dispatched without this matrix; reconstructed from the surviving `packages/testing/bugs/skill-test-*.ts` files. Numbering preserves order where determinable from file naming (v2/v3/v4/v5/v6/v7/v8 round indicators), and is approximate within a round.

- run-01 — pre-2026-05-18 — first probe (penguins.csv) — bug — flagged `s.test.correlation.pearson` required `readonly number[]` widening (since fixed: stats accept readonly arrays)
- run-02 — pre-2026-05-18 — owls follow-up (Owls.csv) — friction — fabricated ANOVA/Tukey extract findings (dropped on verification)
- run-03 — pre-2026-05-18 — penguins v2 (penguins.csv) — clean
- run-04 — pre-2026-05-18 — mtcars v2 (mtcars.csv) — friction — GLM summary missing R² (since fixed: r_squared/adj_r/f_stat/n_obs added)
- run-05 — pre-2026-05-18 — xlsx + reshaping v2 (penguins.xlsx) — clean
- run-06 — pre-2026-05-18 — graph (synthetic) — clean
- run-07 — pre-2026-05-18 — hourly-prices probe (hourly-prices.csv) — bug — flagged the writeCSV Temporal triple-quote serialization (since fixed)
- run-08 — pre-2026-05-18 — lung survival v3 (cancer_lung.csv) — clean — confirmed `.optional()` produces `undefined`
- run-09 — pre-2026-05-18 — owls v3 (Owls.csv) — clean — pivotLonger→pivotWider + GLM summary worked
- run-10 — pre-2026-05-18 — salamanders v3 (Salamanders.csv) — bug — `df.count` column-vs-verb collision (since fixed by removing the `count` verb from the proxy)
- run-11 — pre-2026-05-18 — epil longitudinal v4 (epil2.csv) — friction — multi-key arrange wasn't documented (since fixed in skill)
- run-12 — pre-2026-05-18 — panel + lag v4 (PetersenCL.csv) — bug — stale `df.count(...)` docs in skill (since fixed)
- run-13 — pre-2026-05-18 — innovation .optional v4 (InstInnovation.csv) — bug — `removeUndefined` didn't narrow Zod-optional columns (since fixed in types)
- run-14 — pre-2026-05-18 — target trial v4 (SEQdata + LTFU) — clean — bindRows + summarizeColumns
- run-15 — pre-2026-05-18 — hourly prices v4 (hourly-prices.csv) — bug — downsample emitted JS Date for Temporal inputs / ISO string for PlainDate (since fixed: Temporal preservation end-to-end)
- run-16 — pre-2026-05-18 — diabetic eyes v4 (diabetic.csv) — clean
- run-17 — pre-2026-05-18 — heart transplant v5 (heart_jasa1.csv) — bug — `s.first` overload returned `number[]` instead of `T | null` (since fixed by reordering overloads in first.ts and last.ts)
- run-18 — pre-2026-05-18 — cgd recurrent v5 (cgd_cgd.csv) — friction — print() rendered Temporal as `{}` (since fixed in create-dataframe.ts toTable / customInspect)
- run-19 — pre-2026-05-18 — distributions v7 (synthetic) — bug — poisson `lambda` vs `rateLambda` doc mismatch, `normal.random({sampleSize})` overload returned `number`, no seed parameter (all since fixed: doc names corrected, overloads reordered, end-to-end seed support added)
- run-20 — pre-2026-05-18 — colon paired events v6 (cancer_colon.csv) — clean
- run-21 — pre-2026-05-18 — flchain biomarkers v6 (flchain.csv) — clean — dot-named columns
- run-22 — pre-2026-05-18 — pbc biomarkers v6 (pbc_pbc.csv) — clean
- run-23 — pre-2026-05-18 — joins between lab tables v7 (component_names + base_names) — bug — peekCSV emitted invalid suggested schema for empty headers (since fixed)
- run-24 — pre-2026-05-18 — penguins ANOVA + post-hoc v7 (penguins.csv) — bug — Tukey doc said "Group 1" but runtime emits "Group_1" (since fixed by updating the doc)
- run-25 — pre-2026-05-18 — hourly prices v5 (hourly-prices.csv) — clean — re-test after Temporal preservation fix
- run-26 — pre-2026-05-18 — bootstrap with seed v8 (mtcars.csv) — clean — confirmed seeded sampling end-to-end
- run-27 — pre-2026-05-18 — string operations v8 (transplant.csv) — clean
- run-28 — pre-2026-05-18 — asof time alignment v8 (hourly-prices.csv) — bug — `asofJoin` with `group_by` emitted `_x`/`_y` for the partition column (since fixed in runtime + types)

### Active (2026-05-18 onward)

- run-29 — 2026-05-18 — shims: typed-result, parallel, env, fs (synthetic) — clean — env.get, defineError, tryAsync, parallel({concurrency}), writeTextFile, manual retry pass
- run-30 — 2026-05-18 — graph: three chart types saved as PNG (penguins.csv) — friction — graph (scatter, bar), mappings (color, axes, title), savePNG. **Missing capability**: no box-plot chart type in the library, agent substituted bar-of-medians.
- run-31 — 2026-05-18 — string ops on synthetic clinical records — friction — surfaced gaps in `str.*` helpers (no case conversion, trim, or case-insensitive detect). **Resolution**: the `str` module was removed from the dataframe package entirely. Native JS string methods are the supported path; the skill no longer recommends `str.*`. Features hit incidentally: `unnest`, `groupBy/summarize`, `writeCSV`, `s.countValue`.
- run-32 — 2026-05-18 — GLM predict/residuals/confint/vcov (mtcars.csv) — clean — `model.confint()` and `model.vcov()` return shapes were undocumented; doc now lists `{ names, lower, upper }` and `number[][]` with worked examples. mtcars `wt` 95% CI matches R lm output.
- run-33 — 2026-05-18 — proportion + chi-square (penguins.csv) — friction — missing affordance: no documented recipe to build a contingency table from two raw columns; agent hand-rolled one. Doc now shows `groupBy → summarize → pivotWider → toRows` recipe with `?? 0` coercion (because `pivotWider` has no `valuesFill` and leaves missing cells as `undefined`).
- run-34 — 2026-05-18 — IO round-trip JSON/Arrow/Parquet (penguins.csv) — friction — two skill gaps: (1) no documented column-name accessor; agent guessed `df.columnNames()` and got TS2339, doc now shows `df.columns()`. (2) `writeArrow` was absent from `rules/io.md`; doc now includes it. Mean body-mass by species was identical across all four formats.
- run-35 — 2026-05-18 — graph custom tooltip + React (penguins.csv) — friction — React example in graph.md was untyped (`function MyChart({ df }) { ... }`) and would fail TS7031 in strict tsconfig; doc now shows the typed form (`{ df }: { df: DataFrame<Row> }`) plus a note about consumer dependencies. Both scatter PNGs (with and without custom tooltip) and the standalone `.tsx` component produced and type-checked clean.
- run-36 — 2026-05-18 — shims tidyfetch + envelope encryption + concurrent fan-out (synthetic) — clean — `tidyfetch` retries returned typed `NetworkError`, `encryptFields` / `decryptFields` round-tripped, `parallel({ concurrency: 3 })` handled 8 URLs. No findings.
- run-37 — 2026-05-18 — missing-data fillForward / fillBackward / interpolate / replaceNull (synthetic time series) — clean — all four spot-checks correct (2026-04-04=13 for forward, 2026-04-03=14.5 for backward, 2026-04-06=15.25 for linear interpolate, 0s for replaceNull). No findings — first try compile and run.
- run-38 — 2026-05-18 — transpose + unnest (synthetic study sites) — friction — `transpose` is under-documented: shows only `df.transpose(3)` with no input/output, returns opaque `__tidy_row_label__` / `row_0..N` columns without explaining how to drive column names. Agent fell back to `pivotLonger`→`pivotWider`. Real workflow path documented downstream.
- run-39 — 2026-05-18 — profile + ranking + cumulative (penguins.csv) — friction — agent noted that `profile()` counts total rows not non-null. **Resolution**: `profile()` removed from the dataframe surface entirely (not worth the maintenance — `.summarize` / `.summarizeColumns` cover the same need with explicit semantics). Run file deleted alongside the verb.
- run-40 — 2026-05-18 — complete time-series workflow downsample→fill→rolling→asof (hourly-prices.csv) — bug — `downsample()` silently drops the `groupBy` marker on its output, so chaining `.mutateOverGroup(...)` after `.groupBy("symbol").downsample(...)` runs the callback on the whole frame (cross-symbol bleed in rolling values). **Resolution**: fixed at the source. `downsample` and `upsample` now use `withGroupsRebuilt` to preserve `__groups` in both numeric-time and calendar-Temporal paths (the calendar paths were worse — they didn't iterate groups at all, silently aggregating across symbols and dropping the group column). Four pinned regression checks added covering all paths.
- run-41 — 2026-05-18 — joins variety: keys/suffixes/chaining/crossJoin (synthetic employees/departments/reviews) — friction — two doc gaps: (1) when join keys have different names (`emp_id` vs `employee_id`), the right-key column appears in the output alongside the left-key column — joins doc didn't mention this. Added a note with a `.drop("employee_id")` example. (2) No documented recipe for "every combination of these key sets" (dplyr `complete()`/tidyr `expand_grid()`). Added a worked example using `crossJoin` + `leftJoin` to the joins doc. All 4 tasks ran clean.
- run-42 — 2026-05-18 — z-tests + tied ranking + cumulative count (penguins.csv) — friction — two capability gaps surfaced (no compile/runtime errors, agent worked around): (1) `s.rank` only supports `"average" | "min" | "max" | "dense"` tie-breakers — no `"first"` / `"ordinal"` for unique 1..n ranks; agent hand-rolled a stable sort. (2) No `s.rowNumber()` / `s.runningCount()` helper for "running count of rows"; agent used `s.cumsum(new Array(n).fill(1))`. Both noted in coverage; neither is a bug. Adelie Z-test result: n=151, Z=0.0177, p=0.986 (not significantly different from 3700g).
- run-43 — 2026-05-18 — async mutate + Result/defineError composition (synthetic users) — clean — `mutateAsync({}, {concurrency: 2})`, `Result<T,E>` discriminated narrowing via `r.ok`, `defineError` for typed `NotFoundError`, and Result composition (early-return failure) all worked verbatim from the rules. No findings.
- run-44 — 2026-05-18 — `s.compare.*` API: one-sample + multi-group + post-hoc (penguins.csv) — bug — `s.compare.multiGroups.centralTendency.toEachOther` returned the post-hoc result under `post_hoc` (snake_case) while every other field in the result object is camelCase. **Resolution**: renamed source field `post_hoc` → `postHoc`; npm dist rebuilt. The agent's second finding (Welch's ANOVA "post-hoc not auto-produced") could not be reproduced once the rename landed — agent likely hit a stale-dist artifact (see "Stale dist hazard" below).
- run-45 — 2026-05-18 — re-confirm `s.rank(..., {ties:"first"})` + `s.rowNumber()` (synthetic race finishers) — clean **after stale-dist correction**. Agent reported two TS errors (`{ ties: "first" }` not assignable, `rowNumber` missing). Both **dropped on verification**: they reproduced only when the agent's scratch file (`/tmp/scratch-rank.ts`) resolved `@tidy-ts/dataframe` from the unpublished npm dist (pre-rebuild types). After `pnpm build:npm:dataframe`, both forms type-check cleanly inside and outside the workspace. All four tasks correctly produced unique 1..n places, competition ranks, dense ranks, and labeled position lists.
- run-46 — 2026-05-18 — array-form `s.forwardFill` / `s.backwardFill` / `s.interpolate` (synthetic sensor + price arrays) — clean — all four tasks correct on first try. No findings. Edge behavior (leading/trailing nulls untouched, `interpolate` requires x-values, both edges null if no neighbor) matched the documented contract.
- run-47 — 2026-05-19 — distributions: PDF / CDF / quantile / seeded random + chi-square critical value (synthetic) — clean **after stale-dist refutation**. Agent claimed `seed` parameter on `s.dist.*.random` was rejected by the public type (TS2769). Refuted in-workspace: probe with seed compiles cleanly and produces deterministic output across repeated calls (a[0]/a[50]/a[99] identical between two seeded calls; Poisson sample mean reproduces to 3.161 every time). Agent's evidence was real, but the failing call site was almost certainly outside the workspace (stale dist). All five numeric results matched canonical references (Φ(110;100,15)=0.7475, χ²₄ right-tail 0.05 = 9.488, etc.).
- run-48 — 2026-05-19 — validate-keys-when-dynamic + chained joins (synthetic e-commerce) — clean — all four tasks correct. Findings were doc gaps: agent built a `joinByColumns(left, right, columns: string[])` *because the task asked for it*, not because real code needs one. Initially added a typed-generic-helper recipe to the doc; **reverted on review** — direct `df.innerJoin(other, key)` preserves type inference and the wrapper actively loses it. No doc change retained. (Print-truncation observation was an aesthetic note, no error.)
- run-49 — 2026-05-19 — GLM diagnostics: residuals (deviance/pearson/response), CI at multiple levels, standardized residual (mtcars.csv) — friction — agent computed a "standardized residual" by hand because the skill listed only `residuals({type})`. **Doc fix**: `model.rstandard({type})`, `model.rstudent()`, `model.leverage`, and `model.influence()` all exist as instance methods but were completely undocumented. Added a "Diagnostics & influence" subsection to stats-glm.md with verified worked examples. Toyota Corolla flagged as largest standardized residual (+2.35), matching the canonical mtcars outlier.
- run-50 — 2026-05-19 — GLM Gaussian validation against R `lm(mpg ~ wt + hp + cyl, data = mtcars)` — 28/30 PASS. Coefficients, SEs, t-stats, p-values, R², adjusted-R², F-statistic, residual SE, df_residual, residuals, fitted values — all match R to 1e-13. The 2 "failures" were the wt 95% CI (~3% off both bounds vs R's `confint.lm`). **Investigated against R source**: `r-source-trunk/src/library/stats/R/confint.R` L29-46 and L62-100. `confint.lm` uses `qt(level, df.residual)`; `confint.glm` (which a glm-class object always routes to) uses profile likelihood with `qnorm` cutoff *regardless of family* (comment at L85: "could have a df correction ... Leave for now -pd"). tidy-ts's `confint` is deliberately matching `confint.glm`, including for Gaussian. **Doc fix**: stats-glm.md now explicitly states this — compare to `confint(glm(..., family=gaussian))`, not `confint(lm(...))`; for Wald use `estimate ± qnorm(0.975) * SE` from `summary()`. **Pinned regression added** so the choice is stable.
- run-51 — 2026-05-19 — GLM binomial validation against R `glm(high_begging ~ FoodTreatment + SexParent + ArrivalTime, family=binomial)` on Owls.csv — 27/29 PASS. All coefficients/SE/z/p/deviance/AIC/df/residuals/fitted match R to 1e-13. The 2 "failures" were a comparison-target mismatch (agent asked R for Wald via `confint.default` but tidy-ts returns profile likelihood — matches R's `confint(fit)` default to 1e-14). Same doc fix as run-50 covers this.
- run-52 — 2026-05-19 — GLM poisson validation against R `glm(count ~ mined + cover + Wtemp, family=poisson)` on Salamanders.csv — **29/29 PASS**. Every output category matches R to floating-point precision. No findings beyond the same `confint` method documentation gap that runs 50/51 surfaced (now fixed).
- run-53 — 2026-05-19 — one-way ANOVA + Tukey HSD validation against R `aov()` + `TukeyHSD()` on penguins species/body mass — **bug**. ANOVA outputs matched R within tolerance, but **Tukey HSD was severely broken**: CI bounds ~6× too wide, adjusted p-values saturating to 1 for non-significant pairs. Root cause: hand-rolled Simpson's-rule integration of the studentized range distribution (200×100 grid, integration cap at s=10) — couldn't converge for k=3, df=339. **Fix**: ported R's `nmath/ptukey.c` + `nmath/qtukey.c` (Copenhaver-Holland 1988) to a new `studentized_range.rs` module; replaced the hand-rolled functions in `tukey_hsd.rs` and `games_howell.rs`. Also fixed sign convention to match R: `Group_{higher}` vs `Group_{lower}` with `meanDifference = mean(higher) - mean(lower)`, CI bounds in the same order as R. Verified end-to-end: Chinstrap-Adelie diff=32.426, CI=[-126.50, 191.35], adjP=0.881; Gentoo-Adelie diff=1375.35, CI=[1243.18, 1507.53] — all match R to 1e-11. Pinned regression added.
- run-54 — 2026-05-19 — Pearson/Spearman/Kendall correlation validation against R `cor.test()` on mtcars mpg~wt — **bug**. Pearson and Spearman matched R to ~1e-13 across coefficient, statistic, p-value, and CI. Kendall test statistic and p-value matched, but **effectSize was tau-a (-0.7198), not R's default tau-b (-0.7278)**. R's `cor.Rd` L109 documents: "When there are ties, Kendall's tau-b is computed." **Fix**: in `kendall_correlation_test.rs`, kept tau-a for the exact-test `q` recovery (`q = (tau+1) × n(n-1)/4`) but compute and report tau-b as `effectSize.value` (`(C-D) / sqrt((P - n_x_ties) × (P - n_y_ties))` where `n_x_ties = sum_i count_i*(count_i-1)/2` over tied groups). Tidy-ts now returns -0.7278321495 ≈ R to 1e-14. Pinned regression added.
- run-55 — 2026-05-19 — `lm()` with categorical + continuous predictors against R `lm(body_mass_g ~ species + sex + flipper_length_mm)` on penguins — **28/28 PASS**. All coefficients, SEs, t-stats, p-values, R²/adjR²/RSE/df/F/Fp, and predicted-mean values match R to ~1e-12 when the agent encoded categoricals as treatment-contrast indicators (drop alphabetically-first level, 0/1 dummies for the rest). **Doc fix**: stats-glm.md now shows the explicit encoding recipe — previously skill said "encode categoricals to numbers before fitting" with no example.
- run-56 — 2026-05-19 — Mann-Whitney U + paired Wilcoxon signed-rank against R `wilcox.test()` — clean run, numerics matched R, but two real **effect-size bugs**: (1) Mann-Whitney returned `z/sqrt(N)` (Rosenthal's r) but labeled "Rank Biserial Correlation" — the canonical formula is Wendt's `1 - 2U/(n1*n2)`. (2) Wilcoxon signed-rank returned Cohen's d on raw differences — a parametric effect size, fundamentally wrong for a rank-based test. **Fixes**: Mann-Whitney now computes `1 - 2U/(n1*n2)`; Wilcoxon now computes matched-pairs rank-biserial `(W+ - W-) / (W+ + W-)`. Both label as "Rank Biserial Correlation" (matches R's `effectsize::rank_biserial()`). Pinned regressions added.
- run-57 — 2026-05-19 — Kruskal-Wallis + Dunn post-hoc against R `kruskal.test()` + `dunn.test::dunn.test()` — clean KW; **Dunn was broken in two ways**: (1) returned `|Z|` (sign lost) — agents comparing direction got the wrong answer. (2) Used a two-sided p convention (`2 * pnorm(-|Z|)` then Bonferroni) when R's `dunn.test` package uses one-sided. **Fix**: vendored the canonical CRAN `dunn.test` source to `survival-ref/dunn-test/`, ported the algorithm faithfully — signed Z = `(mean_rank_j - mean_rank_i) / SE` for `j < i`, one-sided p = `1 - pnorm(|Z|)`, Bonferroni `pmin(1, p*m)`, rejection at `p_adj ≤ α/2`. Verified against R: Z and adjusted-p match to 6+ digits. Pinned regression added.
- run-58 — 2026-05-19 — Chi-square 3×3 + Fisher's exact 2×2 against R `chisq.test()` + `fisher.test()` on penguins — chi-square 100% match; Fisher p-value matched R to 1e-20. **Doc bug**: `stats-tests.md` said Fisher returns `testStatistic (odds ratio)` but the OR is on `effectSize.value` (testStatistic is the universal-shape placeholder). Doc corrected to point at the right field. Fisher OR + CI showed 1e-5 to 5e-2 drift vs R — agent's task explicitly anticipated implementation drift here, so kept as expected variation.
- run-59 — 2026-05-19 — proportion tests one-sample + two-sample against R `prop.test(..., correct = TRUE | FALSE)` — clean numerics, but the test always applied Yates continuity correction with **no way to opt out**. **Fix**: plumbed `correct?: boolean` through all four layers (Rust core already supported it, exposed via WASM + NAPI bindings + TS wrapper + stats namespace). Now `prop.test(..., correct=FALSE)` parity reachable. Verified end-to-end: X² = 4.0, p = 0.04550026 with `correct: false` matches R exactly; X² = 3.61, p = 0.05743312 with `correct: true` (default) matches R. Pinned regression added.
- run-60 — 2026-05-19 — normality tests against R `shapiro.test()` + `nortest::ad.test()` + `ks.test(x, "pnorm", mean, sd)` on three columns — **18/18 PASS**. Real API gap: no `kolmogorovSmirnovNormal` exposed (only `kolmogorovSmirnovUniform` and `kolmogorovSmirnovTwoSample`). The Rust `kolmogorov_smirnov_one_sample` already takes an arbitrary CDF function. **Fix**: added `kolmogorov_smirnov_normal_wasm` + `_napi` exports (uses `pnorm` for the CDF), plus a TS wrapper `kolmogorovSmirnovNormalTest` and stats namespace entry `s.test.normality.kolmogorovSmirnovNormal({ x, mean, sd })`. Verified: D = 0.09551932896225182 matches R 0.09551932898156279 (diff 1.93e-11); p = 0.9998580872222208 matches R 0.99985808722161873 (diff 5.93e-13). Pinned regression added.
- run-61 — 2026-05-19 — Wilcoxon paired V statistic + p across three R regimes — V matched R when asymptotic+correction was used, but **the three regimes (exact, asymptotic with correction, asymptotic without correction) were not separately reachable**. **Fix**: plumbed `exact?: boolean` and `correct?: boolean` through Rust core + WASM + NAPI + TS wrapper. `exact` undefined uses R's auto rule (exact iff n<50, no ties, no zeros); `exact: true` or `false` forces. `correct` (default `true`) toggles continuity correction on the asymptotic path. Verified end-to-end: with `{exact: false, correct: true}` p = 0.021067887 matches R `wilcox.test(..., exact=FALSE, correct=TRUE)`; with `{exact: false, correct: false}` p = 0.016747648 matches R. Pinned regression added.
- run-62 — 2026-05-19 — weighted GLM against R `lm(y ~ x1 + x2, weights = w)` — **15/15 PASS** to 1e-13 worst case across coefficients, SEs, t-stats, p-values, R², residual SE, df. The `options.weights` API in `s.glm` matched R's WLS exactly. Minor doc tweak: weights now called out as the WLS path with explicit "matches `lm(weights = w)`" reference. Pinned regression added.
- run-63 — 2026-05-19 — two-way ANOVA against R `aov(y ~ A * B) |> summary()` on Palmer Penguins (unbalanced) — **major real bug**. tidy-ts was computing both main-effect SS as if each were first in the sequential decomposition, giving Type I-A-first for SS_A AND Type I-B-first for SS_B simultaneously — not a coherent SS-type. Interaction SS also didn't match any standard. On balanced data it accidentally agreed; on unbalanced data (penguins) sex SS was off by 1.8M, interaction SS off by 26K. **Fix**: rewrote `type_i_ss()` to build a treatment-contrast design matrix for `~ A + B + A:B`, call the existing `glm_fit` (Gaussian/identity), and read `effects[i]^2` per term (matches R's `aov.R` L348 mechanism — `sum(effects[i,]^2)` over columns belonging to each term). Reuses our existing GLM QR machinery instead of reimplementing OLS. Verified end-to-end: penguins species SS = 145190219.113 matches R 145190219.113 to 1e-7; sex SS, interaction SS, residual SS all match R to 1e-7 or better. Pinned regression added.
- run-64 — 2026-05-19 — Levene's test against R `car::leveneTest` for both `center = median` (Brown-Forsythe) and `center = mean` (classical) — median centering matched R to 1e-14, but **the API hardcoded median centering with no opt-out**. The `center` argument threw at the napi boundary. **Fix**: added `LeveneCenter` enum to Rust core, plumbed a `center: "median" | "mean"` parameter through WASM + NAPI + TS wrapper. Default remains `"median"` (matches R's `car::leveneTest` default and existing tidy-ts behavior). Verified: median F = 0.6763 matches R 0.6763 to 1e-14; mean F = 3.8246 matches R 3.8246 to 1e-14. Pinned regression added.

### Stale dist hazard

The agent test surface uses `@tidy-ts/dataframe` imports. Inside the workspace, Deno resolves these via the project import map → local source `.ts` files (always fresh). Outside the workspace (e.g. when an agent writes a scratch file to `/tmp/`), Deno would resolve via the package registry or workspace `dist/`. When the workspace `dist/` is stale relative to source (any unbuilt source change), a `/tmp/` scratch can see *different* types than the same code inside the workspace.

**Mitigation**: when a finding involves *types* (TS2769, TS2339, "missing from namespace"), reproduce it inside the workspace before accepting. If it doesn't reproduce, run `pnpm build:npm:dataframe` and try again. The discrepancy means the dist is stale, not that the doc is wrong.

---

## Pinned regressions

Every previously-fixed bug should have an executable assertion in [regression-check.ts](./regression-check.ts). Before each dispatch run:

```
deno run -A packages/testing/skills/tidy-ts-best-practices/regression-check.ts
```

Green ⇒ proceed. Red ⇒ a regression slipped in; investigate before dispatching new agents.

Current inventory (each row corresponds to one assertion in the check script):

| Bug (origin run) | What broke | Fix |
|------------------|------------|-----|
| run-04 GLM summary | `model.summary()` did not include R²/adj R²/F-stat/n_obs | Added fields and corrected adj-R² formula in Rust |
| run-07 writeCSV Temporal | Date and Temporal cells written with triple-quoted ISO strings | `normalizeRowForCSV` pre-pass in `write_csv.ts` |
| run-10 `df.count` collision | Column named `count` shadowed by `count()` verb | Removed `count` verb from DataFrame proxy and types |
| run-12 stats glm doc | Doc didn't describe `summary()` shape | Updated `stats-glm.md` |
| run-13 removeUndefined narrowing | Type didn't narrow when columns came from `.optional()` schemas | Reworked `RemoveUndefinedMethod` / `RemoveNullMethod` types |
| run-15 downsample Temporal | Time column always emitted JS `Date`; PlainDate emitted ISO string | `reconstructEpochTime`, `generateCalendarTemporalValues`, dropped `Q` |
| run-17 s.first overload | `s.first([1,2,3])` typed as `number[]` | Reordered overloads in `first.ts` and `last.ts` |
| run-18 print Temporal | Cells rendered as `{}` | `isTemporalLike` short-circuit in `toTable`/`customInspect` |
| run-19a poisson param name | Doc said `lambda`, runtime uses `rateLambda` | Doc table corrected (also: f-dist, log-normal, uniform, neg-binomial, hypergeometric, wilcoxon) |
| run-19b distribution random overloads | `normal.random({sampleSize})` resolved to `number` | Reordered overloads across all 20 distributions |
| run-19c no seed parameter | `random()` had no `seed` | End-to-end: `Option<u32>` in Rust, `seed?: number` in TS, bulk-API rewrite |
| run-23 peekCSV empty headers | Suggested schema emitted `: z.string()` | `formatSchemaFields` skips empty headers, quotes non-identifier keys |
| run-24 Tukey group label doc | Doc said `"Group 1"`, runtime emits `"Group_1"` | Doc updated |
| run-28 asofJoin group_by suffix | `group_by` partition columns came back as `_x`/`_y` | `buildOutputStoreAsof` treats group_by as equi-keys; types thread `G[number]` |
| run-40 downsample/upsample drop grouping | `groupBy("s").downsample(...).mutateOverGroup(...)` ran callback on whole frame; the calendar (PlainDate) path also silently dropped the group column entirely and aggregated across groups | All four paths (downsample numeric/calendar, upsample numeric/calendar) now use `withGroupsRebuilt` to preserve `__groups`; calendar paths refactored to partition per-group before bucketing |
| run-50 confint method choice | `confint()` on Gaussian/identity returns z-based CI (matches `confint.glm`), not t-based (which `confint.lm` uses). Not actually a tidy-ts bug — R source documents this deliberate choice — but agents comparing to `lm()` are surprised. | Doc clarification in stats-glm.md + pinned regression to lock the behavior. |
| run-53 Tukey HSD broken | Hand-rolled Simpson's-rule `ptukey`/`qtukey` (200×100 grid, cap s=10) didn't converge for k=3 df=339 — CI bounds ~6× too wide, adjusted p saturated to 1 for non-significant pairs. Also affected Games-Howell. | Ported R's `nmath/ptukey.c` + `nmath/qtukey.c` (Copenhaver-Holland 1988) to `studentized_range.rs`; replaced in both consumers. Also flipped sign convention to match R (label `Group_{higher}-Group_{lower}`, diff = `mean(higher) - mean(lower)`). |
| run-54 Kendall tau-a vs tau-b | `s.test.correlation.kendall` reported tau-a as `effectSize.value` while R's `cor.test(method="kendall")` reports tau-b by default (cor.Rd L109). z-stat and p-value were correct. | Compute tau-b and return it; keep tau-a internally for the exact-test `q` recovery. |
| run-56 Mann-Whitney effect size | `mannWhitney` returned `z/sqrt(N)` (Rosenthal's r) but labeled "Rank Biserial Correlation". | Compute canonical Wendt formula `1 - 2U/(n1*n2)` — matches R's `effectsize::rank_biserial()`. |
| run-56 Wilcoxon effect size | `wilcoxon` (signed-rank) returned Cohen's d on raw differences — a parametric effect size on a rank-based test. | Compute matched-pairs rank-biserial `(W+ - W-) / (W+ + W-)`; rename `effectSize.name` to "Rank Biserial Correlation". |
| run-57 Dunn Z sign + p convention | Dunn returned `|Z|` (sign lost) and used two-sided Bonferroni p when R's `dunn.test` uses one-sided. | Vendored `dunn.test_1.3.7` from CRAN; ported algorithm faithfully — signed Z, one-sided p, Bonferroni × m, rejection at α/2. |
| run-59 proportion `correct` not exposed | `proportion.{oneSample,twoSample}` always applied Yates correction; no way to ask for `prop.test(correct=FALSE)`. Rust core already supported the flag but WASM/NAPI bindings + TS wrapper hardcoded `true`. | Plumbed `correct?: boolean` through all layers (default `true` matches R). |
| run-60 missing KS-vs-normal API | Rust `kolmogorov_smirnov_one_sample` accepts an arbitrary CDF function but only the uniform-CDF variant was exposed publicly. R's canonical normality KS (`ks.test(x, "pnorm", mean, sd)`) had no counterpart in tidy-ts. | Added `kolmogorov_smirnov_normal_wasm` + `_napi` exports; `s.test.normality.kolmogorovSmirnovNormal({ x, mean, sd })` public. |
| run-61 Wilcoxon regimes hardcoded | All three R regimes (exact, asymptotic+correction, asymptotic without) share the same Rust impl but only one was reachable — asymptotic with continuity correction, no overrides. | Plumbed `exact?: boolean` and `correct?: boolean` through Rust → WASM → NAPI → TS wrapper. Defaults match R's auto rule. |
| run-63 two-way ANOVA wrong SS decomposition | tidy-ts's two-way ANOVA used a non-standard SS decomposition that gave Type I-A-first SS AND Type I-B-first SS simultaneously — not coherent. On unbalanced data, sex SS was off by ~5%. Interaction SS matched no standard type. | Rewrote `type_i_ss()` to build treatment-contrast design matrix + call existing `glm_fit` (Gaussian) + read `effects[i]^2` per term. Reuses GLM QR machinery. Matches R `aov(y ~ A * B) |> summary()` to 1e-7. |
| run-64 Levene center hardcoded | Median centering was hardcoded; no way to ask for classical Levene (mean-centered) without crashing at napi. | Added `LeveneCenter` enum + plumbed `center?: "median" \| "mean"` through Rust core + WASM/NAPI + TS wrapper. Default remains `"median"` (Brown-Forsythe). |
