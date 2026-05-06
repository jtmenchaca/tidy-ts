# Prettify / PrettifyDeep Audit

Exhaustive inventory of every `Prettify` and `PrettifyDeep` usage in `packages/dataframe/ts/`.

## Definitions

| File | Line | Code |
|------|------|------|
| `dataframe/types/utility-types.ts` | 10 | `export type Prettify<Type> = { [Key in keyof Type]: Type[Key] } & {};` |
| `dataframe/types/utility-types.ts` | 13-15 | `export type PrettifyDeep<T> = T extends object ? { [K in keyof T]: PrettifyDeep<T[K]> } & {} : T;` |

Re-exported from `dataframe/index.ts` lines 37-38.

---

## dataframe/types/

| File | Line | Usage |
|------|------|-------|
| `utility-types.ts` | 30 | `Subset<Type, Key> = Prettify<Pick<Type, Key>>` |
| `utility-types.ts` | 154 | `UnifyUnion<T> = Prettify<{...}>` |
| `dataframe-type-helpers.ts` | 4 | import |
| `dataframe-type-helpers.ts` | 16 | `Prettify<NewRow>` in `PreserveGrouping` return |
| `dataframe-type-helpers.ts` | 17 | `Extract<GroupName, keyof Prettify<NewRow>>` in `PreserveGrouping` |
| `set-row-labels.types.ts` | 1 | import |
| `set-row-labels.types.ts` | 11 | `DataFrame<Prettify<R & { [K in typeof ROW_LABEL]: Labels[number] }>>` |

---

## verbs/join/

| File | Line | Usage |
|------|------|-------|
| `types/suffix.types.ts` | 2 | import |
| `types/suffix.types.ts` | 164 | `Prettify<LeftJoinResult<L, R, keyof L & keyof R>>` |
| `types/suffix.types.ts` | 207 | `Prettify<RightJoinResult<L, R, keyof L & keyof R>>` |
| `types/suffix.types.ts` | 257 | `Prettify<FullJoinResult<L, R, keyof L & keyof R>>` |
| `types/suffix.types.ts` | 300 | `Prettify<InnerJoinResult<L, R, keyof L & keyof R>>` |
| `types/method.types.ts` | 4 | import |
| `types/method.types.ts` | 128 | `Prettify<...>` inner join return |
| `types/method.types.ts` | 223 | `Prettify<LeftJoinResult<Row, OtherRow, K>>` |
| `types/method.types.ts` | 260 | `Prettify<...>` left join suffix |
| `types/method.types.ts` | 304 | `Promise<DataFrame<Prettify<Row & Partial<OtherRow>>>>` |
| `types/method.types.ts` | 341 | `Prettify<...>` left join async suffix |
| `types/method.types.ts` | 405 | `Prettify<RightJoinResult<Row, OtherRow, K>>` |
| `types/method.types.ts` | 442 | `Prettify<...>` right join suffix |
| `types/method.types.ts` | 505 | `Prettify<FullJoinResult<Row, OtherRow, K>>` |
| `types/method.types.ts` | 542 | `Prettify<...>` full join suffix |
| `types/method.types.ts` | 660 | `DataFrame<Prettify<SuffixAwareAsofJoinResult<...>>>` |
| `types/method.types.ts` | 701 | `Prettify<...>` asof join suffix |

---

## verbs/reshape/

| File | Line | Usage |
|------|------|-------|
| `bind-rows.types.ts` | 1 | import |
| `bind-rows.types.ts` | 71 | `DataFrame<Prettify<MergeRows<R, OtherRow>>>` |
| `bind-rows.types.ts` | 101 | `DataFrame<Prettify<MergeRows<MergeRows<R, OtherRow1>, OtherRow2>>>` |
| `bind-rows.types.ts` | 134 | `Prettify<...>` 3-way merge |
| `bind-rows.types.ts` | 162 | `DataFrame<Prettify<MergeRows<R, OtherRow>>>` |
| `bind-rows.types.ts` | 172 | `DataFrame<Prettify<MergeRows<R1, R2>>>` |
| `bind-rows.types.ts` | 176 | `DataFrame<Prettify<MergeRows<MergeRows<R1, R2>, R3>>>` |
| `bind-rows.types.ts` | 185 | `DataFrame<Prettify<MergeRows<MergeRows<MergeRows<R1, R2>, R3>, R4>>>` |
| `unnest.types.ts` | 1 | import |
| `unnest.types.ts` | 86 | `DataFrame<Prettify<UnnestColumn<R, Col>>>` |
| `unnest.types.ts` | 116 | `DataFrame<Prettify<UnnestMultipleColumns<R, Cols>>>` |
| `pivot-types.ts` | 2 | import |
| `pivot-types.ts` | 11 | `Prettify<...>` PivotWiderResult |
| `pivot-types.ts` | 32 | `Prettify<...>` PivotLongerResult |
| `pivot-types.ts` | 67 | `Prettify<...>` pivot wider overload |
| `pivot-types.ts` | 92 | `Prettify<...>` pivot wider overload |
| `pivot-types.ts` | 128 | `Prettify<RowAfterPivotLonger<...>>` |
| `transpose.types.ts` | 7-8 | import (`Prettify`, `PrettifyDeep`) |
| `transpose.types.ts` | 107 | `PrettifyDeep<...>` transpose overload |
| `transpose.types.ts` | 113 | `Prettify<...>` nested in `__tidy_row_types__` |
| `transpose.types.ts` | 125 | `PrettifyDeep<...>` transpose overload |
| `transpose.types.ts` | 127 | `Prettify<DataOnly<R>>` in `__tidy_row_types__` |
| `transpose.types.ts` | 128 | `Prettify<...>` record fields |
| `transpose.types.ts` | 138 | `PrettifyDeep<...>` transpose overload |

Also 6 occurrences in `pivot.verb.ts.backup` (lines 134, 227, 252, 537, 539, 683).

---

## verbs/transformation/

| File | Line | Usage |
|------|------|-------|
| `mutate/mutate.types.ts` | 5 | import |
| `mutate/mutate.types.ts` | 67 | `Prettify<...>` MutateResult |
| `mutate/mutate-over-group.types.ts` | 4 | import |
| `mutate/mutate-over-group.types.ts` | 34 | `Prettify<...>` MutateOverGroupResult |
| `mutate/mutate.overloads.ts` | 5 | import |
| `mutate/mutate.overloads.ts` | 50 | `Prettify<...>` grouped mutate return |
| `mutate/mutate.overloads.ts` | 56 | `keyof Prettify<...>` group name extraction |
| `mutate/mutate.overloads.ts` | 96 | `Prettify<...>` ungrouped mutate return |
| `mutate/mutate.overloads.ts` | 156 | `Prettify<...>` grouped multi-mutate return |
| `mutate/mutate.overloads.ts` | 162 | `keyof Prettify<...>` group name extraction |
| `mutate/mutate.overloads.ts` | 192 | `Prettify<...>` ungrouped multi-mutate return |
| `mutate/mutate-group.ts` | 5 | import |
| `mutate/mutate-group.ts` | 27 | `Prettify<T & Record<K, V>>` grouped return |
| `mutate/mutate-group.ts` | 28 | `Extract<G, keyof Prettify<T & Record<K, V>>>` |
| `mutate/mutate-group.ts` | 37 | `DataFrame<Prettify<T & Record<K, V>>>` ungrouped return |
| `mutate-columns.types.ts` | 4 | import |
| `mutate-columns.types.ts` | 63 | `Prettify<R & GenerateColumnNamesWithTypes<...>>` grouped |
| `mutate-columns.types.ts` | 66 | `keyof Prettify<R & GenerateColumnNamesWithTypes<...>>` |
| `mutate-columns.types.ts` | 88 | `Prettify<R & GenerateColumnNamesWithTypes<...>>` ungrouped |
| `rename.types.ts` | 5 | import |
| `rename.types.ts` | 86 | `Prettify<...>` RenameResult |

---

## verbs/filtering/

| File | Line | Usage |
|------|------|-------|
| `filter.types.ts` | 49 | `RowAfterFilter<Row> = Row` (no Prettify — useful as comparison baseline) |
| `distinct.types.ts` | 5 | import |
| `distinct.types.ts` | 12 | `Prettify<...>` DistinctResult |
| `remove-na.ts` | 6 | import |
| `remove-na.ts` | 32 | `NarrowFields<...> = Prettify<...>` |
| `remove-na.types.ts` | 1 | import |
| `remove-na.types.ts` | 9 | `Prettify<R & { [K in Field]: Exclude<R[K], null \| undefined> }>` removeNA grouped |
| `remove-na.types.ts` | 16 | same pattern, removeNA ungrouped |
| `remove-na.types.ts` | 22 | same pattern, removeNA rest-params |
| `remove-na.types.ts` | 31 | `Prettify<R & { [K in Field]: Exclude<R[K], null> }>` removeNull grouped |
| `remove-na.types.ts` | 38 | same, removeNull ungrouped |
| `remove-na.types.ts` | 44 | same, removeNull rest-params |
| `remove-na.types.ts` | 53 | `Prettify<R & { [K in Field]: Exclude<R[K], undefined> }>` removeUndefined grouped |
| `remove-na.types.ts` | 60 | same, removeUndefined ungrouped |
| `remove-na.types.ts` | 66 | same, removeUndefined rest-params |

---

## verbs/missing-data/

| File | Line | Usage |
|------|------|-------|
| `fill-forward.types.ts` | 1 | import |
| `fill-forward.types.ts` | 61 | `DataFrame<Prettify<FillForwardResult<R, [Col]>>>` |
| `fill-backward.types.ts` | 1 | import |
| `fill-backward.types.ts` | 61 | `DataFrame<Prettify<FillBackwardResult<R, [Col]>>>` |
| `interpolate.types.ts` | 1 | import |
| `interpolate.types.ts` | 60 | `DataFrame<Prettify<InterpolateResult<R>>>` |
| `replace-na.types.ts` | 1 | import |
| `replace-na.types.ts` | 55 | `DataFrame<Prettify<ReplaceNaResult<R, M>>>` |
| `replace-na.types.ts` | 64 | `DataFrame<Prettify<ReplaceNullResult<R, M>>>` |
| `replace-na.types.ts` | 73 | `DataFrame<Prettify<ReplaceUndefinedResult<R, M>>>` |
| `filter-na.types.ts` | 1 | commented-out import |
| `filter-na.types.ts` | 27 | commented-out usage |

---

## verbs/utility/

| File | Line | Usage |
|------|------|-------|
| `resample.types.ts` | 4 | import |
| `resample.types.ts` | 111 | `Prettify<...>` ResampleResult |
| `resample.types.ts` | 263 | `Prettify<...>` in overload |
| `upsample.types.ts` | 4 | import |
| `upsample.types.ts` | 39 | `Prettify<...>` UpsampleResult |
| `upsample.types.ts` | 105 | `Prettify<...>` in overload |
| `downsample.types.ts` | 4 | import |
| `downsample.types.ts` | 63 | `Prettify<...>` DownsampleResult |
| `downsample.types.ts` | 112 | `Prettify<...>` in overload |
| `dummy-col.types.ts` | 4 | import |
| `dummy-col.types.ts` | 18 | `Prettify<...>` DummyColResult |
| `dummy-col.types.ts` | 71 | `Prettify<R & Record<string, boolean>>` grouped |
| `dummy-col.types.ts` | 72 | `keyof Prettify<R & Record<string, boolean>>` group extraction |
| `dummy-col.types.ts` | 106 | `DataFrame<Prettify<R & Record<string, boolean>>>` ungrouped |

---

## verbs/aggregate/

| File | Line | Usage |
|------|------|-------|
| `summarise.types.ts` | 5 | import |
| `summarise.types.ts` | 28 | `Prettify<...>` SummariseResult |
| `summarise.types.ts` | 40 | `Prettify<...>` SummariseMultiResult |
| `count.types.ts` | 2 | import |
| `count.types.ts` | 48 | `DataFrame<Prettify<Pick<R, K> & { count: number }>>` |
| `summarise-columns.types.ts` | 5 | import |
| `summarise-columns.types.ts` | 82 | `Prettify<Pick<R, GroupName> & MapColsWithPrefix<...>>` grouped |
| `summarise-columns.types.ts` | 100 | `DataFrame<Prettify<Row & MapColsWithPrefix<...>>>` ungrouped |

---

## verbs/sorting/

| File | Line | Usage |
|------|------|-------|
| `arrange.types.ts` | 5 | import |
| `arrange.types.ts` | 11 | `RowAfterArrange<Row> = Prettify<Row>` (identity prettify) |

---

## verbs/selection/

| File | Line | Usage |
|------|------|-------|
| `drop.types.ts` | 5 | import |
| `drop.types.ts` | 15 | `Prettify<Omit<Row, ColName>>` |

---

## stats/statistical-tests/ (PrettifyDeep only)

All statistical test functions use `PrettifyDeep<ResultType>` as their return type annotation. Every file imports from `../../dataframe/types/utility-types.ts` (or deeper paths for nested files).

| File | Lines | Functions wrapped |
|------|-------|-------------------|
| `t-tests.ts` | 41, 79, 116 | `oneSampleTTest`, `twoSampleTTest`, `pairedTTest` |
| `chi-square.ts` | 20, 60 | `chiSquareIndependence`, `chiSquareGoodnessOfFit` |
| `anova.ts` | 26, 58, 96, 158, 220, 282 | `oneWayAnova`, `welchAnova`, + 4 DataFrame overloads |
| `mann-whitney.ts` | 24 | `mannWhitneyU` |
| `wilcoxon.ts` | 21 | `wilcoxonSignedRank` |
| `proportion-tests.ts` | 35, 75 | `oneSampleProportion`, `twoSampleProportion` |
| `kolmogorov-smirnov.ts` | 34, 77 | `ksTestOneSample`, `ksTestTwoSample` |
| `fishers-exact.ts` | 23 | `fishersExact` |
| `shapiro-wilk.ts` | 17 | `shapiroWilk` |
| `anderson-darling.ts` | 36 | `andersonDarling` |
| `dagostino-pearson.ts` | 52 | `dagostinoPearson` |
| `kruskal-wallis.ts` | 22, 72 | `kruskalWallis` + DataFrame overload |
| `levene.ts` | 44 | `leveneTest` |
| `z-tests.ts` | 40, 79 | `oneSampleZTest`, `twoSampleZTest` |
| `correlation/pearson.ts` | 22 | `pearsonCorrelation` |
| `correlation/spearman.ts` | 22 | `spearmanCorrelation` |
| `correlation/kendall.ts` | 24 | `kendallCorrelation` |
| `post-hoc/tukey-hsd.ts` | 26 | `tukeyHsd` |
| `post-hoc/games-howell.ts` | 27 | `gamesHowell` |
| `post-hoc/dunn.ts` | 27 | `dunnTest` |
| `compare-api/post-hoc.ts` | 44 | `postHoc` |
| `compare-api/one-group/central-tendency.ts` | 45, 59, 73, 91 | `compareCentralTendency` overloads |
| `compare-api/one-group/distribution.ts` | 36 | `compareDistribution` |
| `compare-api/one-group/proportions.ts` | 33 | `compareProportions` |
| `compare-api/two-group/central-tendency.ts` | 60, 77, 94, 118 | `compareCentralTendency` overloads |
| `compare-api/two-group/association.ts` | 56, 74, 97, 125 | `compareAssociation` overloads |
| `compare-api/two-group/distributions.ts` | 49, 71, 93, 115 | `compareDistributions` overloads |
| `compare-api/two-group/proportions.ts` | 44, 58, 72, 86, 104 | `compareProportions` overloads |
| `compare-api/multi-group/central-tendency.ts` | 99, 112, 122, 134, 150 | `compareCentralTendency` overloads |
| `compare-api/multi-group/proportions.ts` | 27 | `compareProportions` |

---

## graph/

| File | Line | Usage |
|------|------|-------|
| `graph.ts` | 4 | import |
| `graph.ts` | 245 | `InternalConfig = Prettify<...>` |
| `graph.ts` | 280 | `ScatterConfig = Prettify<...>` |
| `graph.ts` | 306 | `LineConfig = Prettify<...>` |
| `graph.ts` | 332 | `BarConfig = Prettify<...>` |
| `graph.ts` | 358 | `AreaConfig = Prettify<...>` |

---

## promised-dataframe/

| File | Line | Usage |
|------|------|-------|
| `concurrency-utils.ts` | 8 | import |
| `concurrency-utils.ts` | 14 | `ExponentialBackoff = Prettify<{...}>` |
| `concurrency-utils.ts` | 41 | `LinearBackoff = Prettify<{...}>` |
| `concurrency-utils.ts` | 63 | `CustomBackoff = Prettify<{...}>` |

---

## wasm/

| File | Line | Usage |
|------|------|-------|
| `survival-functions.ts` | 4 | import |
| `survival-functions.ts` | 201 | `Prettify<CoxphResult>` return type |
| `survival-functions.ts` | 350 | `Prettify<CoxphResult>` return type |

---

## Summary

| Area | Prettify | PrettifyDeep | Total |
|------|----------|--------------|-------|
| dataframe/types/ | 8 | 3 | 11 |
| verbs/join/ | 16 | 0 | 16 |
| verbs/reshape/ | 22 | 4 | 26 |
| verbs/transformation/ | 21 | 0 | 21 |
| verbs/filtering/ | 15 | 0 | 15 |
| verbs/missing-data/ | 11 | 0 | 11 |
| verbs/utility/ | 14 | 0 | 14 |
| verbs/aggregate/ | 8 | 0 | 8 |
| verbs/sorting/ | 2 | 0 | 2 |
| verbs/selection/ | 2 | 0 | 2 |
| stats/statistical-tests/ | 0 | 52 | 52 |
| graph/ | 5 | 0 | 5 |
| promised-dataframe/ | 3 | 0 | 3 |
| wasm/ | 2 | 0 | 2 |
| backup file | 6 | 0 | 6 |
| **Total** | **134** | **59** | **193** |

---

# Type-Check Impact Analysis

Findings from categorizing each usage pattern and spot-checking with the intellisense script.

## Pattern Categories

### 1. Intersection Flattening (the core value)

The primary purpose of `Prettify`: flattening `A & B` so tooltips show `{ a: number; b: string }` instead of `Pick<A, "a"> & { b: string }`.

**Verdict: Needed.** These are the cases where `Prettify` provides real tooltip improvement.

Examples:
- `mutate`: `Prettify<R & { newCol: type }>` → tooltip shows expanded fields
- `count`: `Prettify<Pick<R, K> & { count: number }>` → shows all fields inline
- `set-row-labels`: `Prettify<R & { [K in typeof ROW_LABEL]: ... }>` → flattens intersection
- `remove-na`: `Prettify<R & { [K in Field]: Exclude<R[K], null> }>` → narrows + flattens
- `bind-rows`: `Prettify<MergeRows<R, OtherRow>>` → MergeRows is an intersection type
- All join types: `Prettify<LeftJoinResult<...>>` etc. — join results are intersections
- `mutate-group`: `Prettify<T & Record<K, V>>` — intersects row with new column
- `summarise-columns`: `Prettify<Pick<R, GroupName> & MapColsWithPrefix<...>>` — Pick + intersection
- `PreserveGrouping`: `Prettify<NewRow>` + `Extract<GroupName, keyof Prettify<NewRow>>` — needed for group key extraction from potentially-intersected types

### 2. Identity Prettify (no-ops)

`Prettify<Row>` where `Row` is a bare generic with no transformation. Confirmed via intellisense: produces identical tooltip to bare `Row`.

| File | Line | Type | Tooltip Effect |
|------|------|------|----------------|
| `arrange.types.ts` | 11 | `RowAfterArrange<Row> = Prettify<Row>` | None — same as `filter.types.ts:49` which uses bare `Row` |
| `interpolate.types.ts` | 60 | `Prettify<InterpolateResult<R>>` where `InterpolateResult<R> = R` | None — double identity |

### 3. Bare Pick/Omit Wrapping

`Prettify<Pick<...>>` or `Prettify<Omit<...>>` without an intersection.

| File | Line | Type | Tooltip Effect |
|------|------|------|----------------|
| `utility-types.ts` | 30 | `Subset<Type, Key> = Prettify<Pick<Type, Key>>` | Expands Pick — but TS 5.x already expands bare Pick in many contexts |
| `drop.types.ts` | 15 | `Prettify<Omit<Row, ColName>>` | Expands Omit — confirmed via intellisense: `dropped` shows `{ name, age, score }` not `Omit<..., "city">` |
| `select.types.ts` | 14 | `RowAfterSelect = Prettify<Pick<Row, ColName>>` | Now expands — confirmed via intellisense: shows `{ name: string; age: number }` |

**Observation:** Before adding Prettify to select, tooltips showed the alias name `RowAfterSelect<..., "name" | "age">` instead of expanded fields. After adding it, tooltips show the actual shape. This confirms bare `Pick`/`Omit` wrapping with `Prettify` has a real tooltip effect.

### 4. Double Wraps (redundant outer Prettify)

Cases where `Prettify` wraps a type that already applies `Prettify` internally.

| File | Line | Outer | Inner Definition |
|------|------|-------|------------------|
| `pivot-types.ts` | 67 | `Prettify<RowAfterPivotWider<...>>` | `RowAfterPivotWider` (line 11) = `Prettify<...>` |
| `pivot-types.ts` | 128 | `Prettify<RowAfterPivotLonger<...>>` | `RowAfterPivotLonger` (line 32) = `Prettify<...>` |
| `upsample.types.ts` | 105 | `Prettify<Pick<R, GroupName> & RowAfterUpsample<...>>` | `RowAfterUpsample` (line 39) = `Prettify<...>` |
| `downsample.types.ts` | 112 | `Prettify<Pick<R, GroupName> & RowAfterDownsample<...>>` | `RowAfterDownsample` (line 63) = `Prettify<...>` |

**Note:** The upsample/downsample cases are intersecting `Pick<R, GroupName> & RowAfterUpsample<...>`, so the outer `Prettify` is needed to flatten the intersection — the inner one inside `RowAfterUpsample` is redundant but harmless. The pivot cases are true double-wraps with no intervening intersection.

### 5. PrettifyDeep on Flat Result Types

All 52 `PrettifyDeep` usages in `stats/statistical-tests/` wrap result type interfaces. `PrettifyDeep` recursively expands nested objects so that tooltips show actual key-value shapes rather than alias names.

**Verdict: All 52 usages are justified.** Even the "flat" result types contain sub-object fields typed as `TestStatistic`, `ConfidenceInterval`, `EffectSize`, etc. Without `PrettifyDeep`, tooltips would show these alias names instead of their actual structure (e.g., `{ statistic: number; pValue: number; df: number }`). The whole point is to expand everything so the user sees the real shape on hover.

- Types with one level of sub-objects (t-tests, chi-square, correlations, etc.): `PrettifyDeep` expands `TestStatistic` → `{ statistic: number; pValue: number; ... }` inline
- Types with deeper nesting (TwoWayAnova, post-hoc comparisons): `PrettifyDeep` expands through multiple levels
- `CoxphResult`: expands nested array types

---

## Summary of Findings

| Category | Count | Impact |
|----------|-------|--------|
| Intersection flattening (needed) | ~100 | Core value — keep |
| Identity no-ops | 2 | Zero tooltip effect — removable |
| Bare Pick/Omit | 2-3 | Has tooltip effect (expands vs alias name) — likely worth keeping |
| True double-wraps | 2 | Redundant outer Prettify (pivot wider/longer) |
| Double-wraps with intersection | 2 | Outer Prettify needed for the intersection, inner is redundant but harmless |
| PrettifyDeep on stat results | 52 | All justified — expands sub-object aliases (TestStatistic, etc.) into actual keys |
