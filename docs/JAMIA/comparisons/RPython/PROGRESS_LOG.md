# RPython Reproduction Progress Log

Tracking progress on creating .py/.R + .ts reproduction pairs for the JAMIA paper. Each pair demonstrates a real StackOverflow bug and shows how tidy-ts catches (or avoids) it.

---

## Process

1. Work through bugs listed in `INCLUSION_EVALUATION.md` in table order (not cherry-picked)
2. For each bug:
   - Read the SO snippet from `docs/JAMIA/comparisons/RPython-main/TM_snippets.json` (or `CDA_snippets.json`)
   - Write a `.py` (or `.R`) file reproducing the bug
   - Write a `.ts` file showing the tidy-ts equivalent with `@ts-expect-error` where applicable
   - Run `python3` (or use the venv) to verify the .py reproduces
   - Run `deno check` to verify the .ts passes type checking
   - Update the "Reproduced" column in `INCLUSION_EVALUATION.md`
3. If a bug doesn't reproduce on modern pandas/numpy, note WHY in the .py docstring and in INCLUSION_EVALUATION.md

---

## Environment

- **Python venv**: `docs/JAMIA/comparisons/RPython/venv/` (has pandas, numpy, scikit-learn)
  - Use `docs/JAMIA/comparisons/RPython/venv/bin/python3` for scripts needing sklearn
  - System `python3` works for pandas/numpy (already installed system-wide)
- **Deno**: `deno check <file.ts>` for type checking
- **Source data**: `docs/JAMIA/comparisons/RPython-main/` (gitignored, large JSON files)
  - `TM_snippets.json` — 164 Type Mismatch bugs
  - `CDA_snippets.json` — 848 Confusing Data Analytics bugs
  - `TM_DFB_snippets.json` — 110 TM x DataFrame Bug subset

---

## Current Status

Working through the **Value type** section of INCLUSION_EVALUATION.md (62 bugs). Currently at row ~15 of 62.

### Known Issues to Fix

1. **`TM/14023423_preprocess_factor_cols.ts`** — Uses `s.sd()` which doesn't exist on the stats namespace. Should use `s.stdev()` or just remove that line. Type check currently fails.
2. **`TM/33692532_str_accessor_nan.py`** — Doesn't crash on modern pandas (NaN handled gracefully). The .py docstring notes this but there's no actual crash to demonstrate. Also has a duplicate file (`33692532_str_accessor_with_nan.py`) — one should be deleted.
3. **`TM/18401112_string_labels_roc_auc.py`** — Doesn't crash on modern sklearn (string labels are now handled). Needs a NOTE added to the .py docstring explaining this, or a different reproduction approach.

---

## Completed Reproduction Pairs

### TM (Type Mismatch) — `docs/JAMIA/comparisons/RPython/TM/`

| ID | Lang | Effect | .py/.R | .ts | Python Reproduces? | deno check? | Notes |
|---|---|---|---|---|---|---|---|
| 22481271 | Python | IF | `TM/22481271_corr_object_dtype.py` | `TM/22481271_corr_object_dtype.ts` | Yes | Yes | corr() returns empty on object dtype. Uses `numeric_only=True` to reproduce on modern pandas. |
| 56079650 | Python | DC | `TM/56079650_boolean_coercion.py` | `TM/56079650_boolean_coercion.ts` | Yes | Yes | `~` on object-dtype boolean gives -2/-1 instead of True/False. |
| 16067144 | Python | DC | `TM/16067144_fillna_float_dtype.py` | `TM/16067144_fillna_float_dtype.ts` | Yes | Yes | fillna with string silently converts float column to object. Created by another agent, verified correct. |
| 48062499 | Python | IF | `TM/48062499_string_as_numeric.py` | `TM/48062499_string_as_numeric.ts` | Yes | Yes | String array sorts lexicographically. s.mean() rejects string[] at compile time. |
| 20625982 | Python | DC | `TM/20625982_groupby_drops_timedelta.py` | `TM/20625982_groupby_drops_timedelta.ts` | Yes | Yes | groupby.mean() silently drops timedelta column. tidy-ts summarize() is explicit. |
| 12844529 | Python | DC | `TM/12844529_groupby_drops_object_cols.py` | `TM/12844529_groupby_drops_object_cols.ts` | Yes | Yes | groupby.mean() returns empty DataFrame on all-string columns. s.mean() rejects string[]. |
| 16988526 | Python | IF | `TM/16988526_csv_infers_float.py` | `TM/16988526_csv_infers_float.ts` | Yes | Yes | Original '1234E5' bug fixed in pandas 0.11.1. Reproduced with leading-zero IDs ('007' → 7). |
| 12125364 | R | Crash | `TM/12125364_median_int_vs_double.R` | `TM/12125364_median_int_vs_double.ts` | Not verified (R) | Yes | median() returns int vs double across groups. JS has no int/double distinction. |
| 29643820 | R | Crash | `TM/29643820_assign_double_to_int_col.R` | `TM/29643820_assign_double_to_int_col.ts` | Not verified (R) | Yes | Assigning mean() (double) to integer column crashes. JS number is unified. |
| 26401116 | R | Crash | `TM/26401116_median_inconsistent_types.R` | `TM/26401116_median_inconsistent_types.ts` | Not verified (R) | Yes | Same int/double median pattern as 12125364. |
| 41859824 | Python | Crash | `TM/41859824_string_concat_numpy.py` | `TM/41859824_string_concat_numpy.ts` | Yes | Yes | Original 'add' ufunc bug fixed in modern numpy. Reproduced with 'multiply' variant (string × float64 still crashes). |
| 42013903 | Python | Crash | `TM/42013903_raw_input_string_multiply.py` | `TM/42013903_raw_input_string_multiply.ts` | Yes | Yes | String from input × numpy array crashes. s.mean() rejects string[]. |
| 44616546 | Python | Crash | `TM/44616546_timedelta_mean_no_numeric.py` | `TM/44616546_timedelta_mean_no_numeric.ts` | Yes (silently drops) | Yes | On modern pandas, silently drops instead of crashing — actually DC now. |
| 18401112 | Python | Crash | `TM/18401112_string_labels_roc_auc.py` | `TM/18401112_string_labels_roc_auc.ts` | **No** — fixed in sklearn | Yes | Modern sklearn handles string labels. Needs NOTE in docstring. |
| 14023423 | R | Crash | `TM/14023423_preprocess_factor_cols.R` | `TM/14023423_preprocess_factor_cols.ts` | Not verified (R) | **FAILS** — `s.sd` doesn't exist | Need to fix: use correct API or remove s.sd line. |
| 22906804 | R | Crash | `TM/22906804_matrix_multiply_dataframe.R` | `TM/22906804_matrix_multiply_dataframe.ts` | Not verified (R) | Yes | %*% on data.frame crashes. tidy-ts separates DataFrame from matrix ops. |
| 33692532 | Python | Crash | `TM/33692532_str_accessor_nan.py` | `TM/33692532_str_accessor_nan.ts` | **No** — fixed in pandas | Yes | Modern pandas .str works with NaN. Duplicate file exists (33692532_str_accessor_with_nan.py). |
| 22137723 | Python | Crash | `TM/22137723_commas_in_numbers.py` | `TM/22137723_commas_in_numbers.ts` | Yes | Yes | "1,200".astype(float) crashes. s.sum() rejects string[]. |
| 30519140 | Python | Crash | `TM/30519140_boolean_mask_mixed_types.py` | `TM/30519140_boolean_mask_mixed_types.ts` | Yes | Yes | Boolean mask assignment on mixed-type DataFrame crashes. tidy-ts columns are typed. |

### CDA (Confusing Data Analytics) — `docs/JAMIA/comparisons/RPython/CDA/`

| ID | Lang | Effect | .py | .ts | Python Reproduces? | deno check? | Notes |
|---|---|---|---|---|---|---|---|
| 38516481 | Python | IF | `CDA/38516481_replace_vs_str_replace.py` | `CDA/38516481_replace_vs_str_replace.ts` | Yes | Yes | Series.replace() is value-level, silently does nothing on substrings. JS .replaceAll() always does substrings. |
| 42719749 | Python | DC | `CDA/42719749_string_to_int_coerce.py` | `CDA/42719749_string_to_int_coerce.ts` | Yes | Yes | to_numeric(errors='coerce') silently turns bad values to 0. s.mean() rejects string[]. |
| 22591174 | Python | IF | `CDA/22591174_and_or_filter_confusion.py` | `CDA/22591174_and_or_filter_confusion.ts` | Yes | Yes | `\|` vs `&` in boolean indexing is confusing. tidy-ts filter() uses standard JS `&&`/`\|\|`. |

---

## Remaining Work (Value type section)

The following bugs in INCLUSION_EVALUATION.md Value type table have NOT been reproduced yet:

- 36462257 — Empty DataFrame loses dtype specification
- 41286569 — df.sum() on object-dtype concatenates strings
- 48719937 — idxmax() on object-dtype fails
- 30857680 — resample() requires DatetimeIndex
- 14992644 — Histogram on string columns fails
- 37513355 — Spark schema inference (skip — Spark-specific)
- 19864028 — Column contains 'na' string preventing conversion
- 25416955 — Matplotlib date axis from string column
- 17690738 — Assigning datetime to integer-indexed Series
- 31521526 — Currency string "(1,234.56)" can't convert to float
- 30132282 — .str accessor on datetime Series
- 15799162 — Resampling requires DatetimeIndex
- 21011777 — NaN mixed into list
- 17950374 — Concatenating int column with string
- 28393103 — Numeric reduction on object-dtype
- 21472243 — plt.hist on object-dtype
- 39180873 — Histogram on wrong dtypes
- 31162780 — matplotlib Rectangle with datetime
- 6063876 — Scatter colorbar needs float array
- 24706677 — sklearn GradientBoosting on string features
- 12588986 — Inplace add on object array
- 5957380 — Structured array conversion
- 33221655 — Setting list in float64 column
- 41815365 (R) — date_trans requires Date class
- 28730083 (R) — geom_area with categorical x
- 31269216 — str.upper() on mixed-type column
- 4231190 — numpy array of tuples
- 22557322 — savetxt fmt='%i' drops zeroes
- 36115687 — PySpark string date filtering
- 10805643 (R) — Numeric column to discrete color
- 29974535 (R) — Character date column ordering
- 35560433 (R) — geom_smooth on character dates
- 29278153 (R) — String/factor on continuous y-axis
- 23997475 (R) — Character date for geom_vline
- 25937000 (R) — String/factor on continuous scale
- 10495898 (R) — String column line chart ordering
- 29953011 (R) — Numeric vector where DataFrame expected
- 30063190 (R) — POSIXlt incompatible with dplyr
- 27828850 (R) — POSIXlt breaks group_by
- 26788854 — Date string in datetime arithmetic
- 50916422 — numpy int64 not JSON serializable
- 11561932 — numpy int32 not JSON serializable
- 19105976 — .date() on Series instead of element
- 30944577 — str.contains returns Series as scalar bool

After Value type: Missing value (9 bugs), Join (1 bug), Data loading (5 bugs) sections remain.

---

## File Naming Convention

```
{SO_ID}_{short_description}.{py|R|ts}
```

Examples:
- `22481271_corr_object_dtype.py`
- `22481271_corr_object_dtype.ts`
- `12125364_median_int_vs_double.R`
- `12125364_median_int_vs_double.ts`
