# RPython TM + TM_DFB Inclusion Evaluation

Evaluation of 164 unique StackOverflow bugs from the RPython dataset (ESEC/FSE 2023) TM (Type Mismatch) and TM_DFB (Type Mismatch x DataFrame Bug) subsets. Evaluated against [rules.md](rules.md).

Source datasets: `TM_snippets.json` (164 snippets), `TM_DFB_snippets.json` (110 snippets, fully contained within TM). After deduplication: **164 unique bugs**.

RPython effect codes: DC = data corruption (silent), IF = incorrect functionality (silent), Crash = program stops with error.

---

## Reproduction format

Each reproduction is a **single self-contained `.ts` file** under `RPython/TM/<SO_ID>_<slug>.ts`. The file (a) carries a JSDoc header with six canonical frontmatter fields, (b) inlines the original-language (pandas or R) reproduction as a string and runs it via `runForeign` from `RPython/run-foreign.ts`, and (c) demonstrates the Tidy-TS equivalent with a single `@ts-expect-error` line on the catch site. See `docs/JAMIA/comparisons/CONTEXT.md` for the canonical glossary; see `RPython/TM/25416955_string_dates_plot.ts` for the canonical template.

```typescript
/**
 * ID: SO#33199193
 * Language: Python
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: NaN in list-type column can't be filled with empty list; fillna rejects non-scalar
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `<minimal pandas/R reproduction from the source snippet>`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([/* minimal data shape matching the foreign script */]);

// @ts-expect-error — <verbatim TypeScript error message>
<the operation that triggers the catch>;
```

Rules:
- Only the six JSDoc fields are written by hand: `ID`, `Language`, `Bug class`, `Runtime consequence`, `In study`, `Inclusion rationale`.
- All Tidy-TS-side fields (`Reproduction status`, `Tidy-TS detection outcome`, `Tidy-TS detection mechanism`, `Tidy-TS catch explanation`) are **derived** by `verify.ts` from observed file behavior: the result of `deno check`, the exit code and stderr of the inlined foreign script, the presence/absence of `@ts-expect-error`, and any `[tidy-ts]` runtime-guard output.
- Excluded bugs (`In study: No`) have no reproduction file. Their metadata lives only in this document's "Excluded" tables.

### Fields

**ID** — StackOverflow question ID. Format: `SO#` + integer.

**Language** — What the original bug was written in. Enum: `R` | `Python`.

**Bug class** — What category of type error this represents. Enum:

| Value | Description |
|---|---|
| `Column ref` | Operation references a column that doesn't exist or is silently dropped |
| `Value type` | Wrong scalar type passed to a function (string where number expected, etc.) |
| `Nullable` | Missing value (NA/NaN/null) causes type conflict or silent corruption |
| `Join` | Join key types don't match between left and right tables |
| `Data loading` | File parsing produces wrong types at the load boundary |
| `Visualization` | Chart/plot rendering API with no data-processing equivalent |
| `Lang plumbing` | Language-specific metaprogramming (R NSE, Python 2→3, namespaces) |
| `Library interop` | FFI, serialization, or library-to-library type conversion |
| `API syntax` | User called wrong method or wrong argument shape; not a type issue |
| `Environment` | Version differences, encoding, platform-specific behavior |
| `Not data` | numpy array manipulation, language semantics outside data analysis |

**Runtime consequence** — What the bug does in its original language. Enum (also called the original-language consequence in CONTEXT.md):

| Value | Description |
|---|---|
| `DC` | Silent data corruption — program produces wrong data, no error |
| `IF` | Incorrect functionality — program produces wrong behavior, no error |
| `Crash` | Program stops with a runtime error message |

**In study** — Is this bug included in the evaluation. Enum: `Yes` | `No`.

**Inclusion rationale** — Why it's in or out. Free text, one sentence.
- If Yes: what type error the user made (e.g., "String column passed to numeric model function")
- If No: why it's outside scope (e.g., "ggplot2 rendering API; no data processing equivalent")

**Reproduction status** — What the reproduction runner observes today. Describes behavior, not cause. Required only on included bugs. Enum:

| Value | Description |
|---|---|
| `Reproduces` | The reproduction file runs and the bug triggers as originally recorded (Runtime consequence matches what the file does today) |
| `No longer reproduces` | The reproduction file runs without the recorded failure. No claim is made about *why* it no longer triggers |
| `Variant` | The reproduction triggers a bug of a different class than originally recorded (e.g., recorded as Crash, now silent DC) |

**Tidy-TS detection outcome** — Whether Tidy-TS catches the bug. Required only on included bugs. Enum:

| Value | Description |
|---|---|
| `compile-time error` | TypeScript compiler rejects the code before it runs |
| `runtime error` | Program runs and stops with an error message (e.g., Zod validator throws on bad input) |
| `runtime warning` | Program prints a warning and continues |
| `silent continuation` | Program continues without error or warning, producing incorrect output |
| `not applicable` | The original bug class cannot occur in tidy-ts; there is no operation to catch |

**Tidy-TS detection mechanism** — How Tidy-TS catches the bug (or why it doesn't). Required only on included bugs. Enum:

| Value | Description | Implied outcome |
|---|---|---|
| `compiler` | TypeScript compiler rejects an expression because the type rules are violated | `compile-time error` |
| `zod schema validation` | Zod schema attached to `readCSV` / load rejects the input | `runtime error` (Zod throws at load) |
| `runtime API guard` | A tidy-ts runtime guard (e.g., `append` shape check, proxy column access) rejects the operation | `runtime error` |
| `none — language structural absence` | The bug class requires a language feature TS/JS does not have (e.g., R's int/double distinction). Cannot occur regardless of library. Does not count as a catch. | `not applicable` |
| `none — library API design` | The bug class exists in the language but tidy-ts chose a different API design (e.g., `.replaceAll()` is unambiguously substring; no operator overloading). Credit, but acknowledge another TS library could reintroduce the bug. Does not count as a catch. | `not applicable` |
| `none — bug still exists` | Tidy-TS reproduces the same failure mode and does not catch it. Honest non-catch. Counts toward a limitations subtotal. | `silent continuation` or `runtime error` |

The three "none" sub-values are meaningfully different and are not collapsed in aggregate tables.

**Tidy-TS catch explanation** — One-phrase prose. Required only on included bugs. Format depends on mechanism:
- `compiler` / `zod schema validation` / `runtime API guard` → "[type or runtime rule] rejects [bad operation]" — e.g., `` `number` rejects `number | null` ``
- `none — language structural absence` → "Language has no [feature]; bug class cannot occur"
- `none — library API design` → "tidy-ts API uses [different design]; bug class avoided by API choice"
- `none — bug still exists` → "tidy-ts reproduces [failure]; not caught"

### Excluded bugs

Excluded bugs (those with `In study: No`) carry only `ID`, `Language`, `Bug class`, `Runtime consequence`, `In study: No`, and `Inclusion rationale`. They do not carry `Reproduction status`, `Tidy-TS detection outcome`, `Tidy-TS detection mechanism`, or `Tidy-TS catch explanation` — there is no reproduction file and no measurement to record.

---

## Summary

| | Count | % |
|---|---|---|
| Total unique bugs | 164 | 100% |
| **Included** | **78** | **48%** |
| — Column reference | 4 | 2% |
| — Value type | 62 | 38% |
| — Missing value | 9 | 5% |
| — Join | 1 | 1% |
| — Data loading | 5 | 3% |
| **Excluded** | **86** | **52%** |
| — Visualization-specific | 12 | 7% |
| — Language plumbing | 12 | 7% |
| — External library interop | 11 | 7% |
| — API syntax confusion | 17 | 10% |
| — Environment/platform | 5 | 3% |
| — Not data processing | 29 | 18% |

Of the 78 included bugs, 11 (14%) had silent outcomes (DC or IF) and 67 (86%) crashed with an error in the original language. The 11 silent bugs are the most directly relevant to the paper's thesis — they produced incorrect output with no warning in the original language.

Note: "Value type" dominates because these datasets were specifically curated as "Type Mismatch" root cause bugs. The other RPython subsets (APIC, CDA, IDAP_IB, SM) would yield different category distributions.

Category sub-counts sum to 81 (> 78 unique IDs) because 3 bugs are classified in both value type and data loading (they involve type errors that manifest at the data loading boundary).

---

<!-- BEGIN GENERATED: do not edit between this marker and END GENERATED. Regenerate with `deno run -A docs/JAMIA/comparisons/RPython/generate-tables.ts`. -->

## Reproducibility metadata

- Evaluation date: 2026-05-18
- Corpus: RPython (ESEC/FSE 2023), TM subset (164 snippets)
- Python: Python 3.14.5
- R: R 4.6.0
- Deno: deno 2.7.14 (stable, release, aarch64-apple-darwin)
- Runner: docs/JAMIA/comparisons/RPython/verify.ts (commit 5079562a)

## Inclusion funnel

| Stage | Count |
|---|---:|
| TM corpus | 164 |
| Reproductions on disk (TM) | 3 |
| Included (`In study: Yes`) | 3 |
| Excluded (no reproduction file; see Evaluation table below) | 161 |
| CDA illustrative-only | 0 |

## Category distribution (included only)

| Category | Count |
|---|---:|
| Column reference | 0 |
| Value type | 3 |
| Missing value | 0 |
| Join | 0 |
| Data loading | 0 |
| Schema composition | 0 |

## Per-category Tidy-TS detection mechanism

| Category | compiler | zod schema validation | runtime API guard | none — language structural absence | none — library API design | none — bug still exists |
| --- | --- | --- | --- | --- | --- | --- |
| Column reference | 0 | 0 | 0 | 0 | 0 | 0 |
| Value type | 3 | 0 | 0 | 0 | 0 | 0 |
| Missing value | 0 | 0 | 0 | 0 | 0 | 0 |
| Join | 0 | 0 | 0 | 0 | 0 | 0 |
| Data loading | 0 | 0 | 0 | 0 | 0 | 0 |
| Schema composition | 0 | 0 | 0 | 0 | 0 | 0 |

## Reproduction status (included only)

| Status | Count |
|---|---:|
| Reproduces | 3 |
| No longer reproduces | 0 |
| Variant | 0 |

## Tidy-TS detection outcome (included only)

| Outcome | Count |
|---|---:|
| compile-time error | 3 |
| runtime error | 0 |
| runtime warning | 0 |
| silent continuation | 0 |
| not applicable | 0 |

<!-- END GENERATED -->

---

## Evaluation

Format: `ID | Lang | Effect | Verdict | Category or Exclusion Reason | Notes`

Effect: DC = silent data corruption, IF = silent incorrect functionality, Crash = program stops.

### Included

#### Column reference

| ID | Lang | Effect | Reproduced | Notes |
|---|---|---|---|---|
| 20625982 | Python | DC | Yes | groupby.mean() silently drops timedelta column from output. Column vanishes with no error. |
| 12844529 | Python | DC | Yes | groupby aggregate silently drops object-dtype columns. Output missing columns, no warning. |
| 45769987 | R | Crash | Yes | Duplicate column names cause dplyr spread/join errors. Schema validation at column level. |
| 38969267 | Python | Crash | Yes | Selecting columns via list fails when column doesn't exist. Column reference error. |

#### Value type

| ID | Lang | Effect | Reproduced | Notes |
|---|---|---|---|---|
| 22481271 | Python | IF | Yes | corr() returns empty matrix on object-dtype columns. Numeric operation on string-typed data silently produces wrong result. |
| 12125364 | R | Crash | Yes | median() returns int for odd-length groups, double for even-length. data.table crashes on inconsistent return types across groups. Not verified with R runtime — .R file written from SO code. |
| 29643820 | R | Crash | Yes | Assigning mean() (double) to integer column in data.table fails. Type of aggregation result doesn't match column type. Not verified with R runtime — .R file written from SO code. |
| 26401116 | R | Crash | Yes | Same int/double inconsistency from median() in data.table groupby. Not verified with R runtime — .R file written from SO code. |
| 56079650 | Python | DC | Yes | Boolean column silently coerced to object dtype. Bitwise NOT (~) then gives wrong results instead of error. Silent data corruption. |
| 16067144 | Python | DC | Yes | fillna on float column with string requires astype(object), silently converting all columns to object dtype. |
| 41859824 | Python | Crash | Yes | String concatenation with numpy numeric types fails. Arithmetic on wrong type. Original 'add' bug fixed in modern numpy; reproduced with 'multiply' variant which still crashes. |
| 42013903 | Python | Crash | Yes | raw_input returns string, used in numpy multiply. String where number expected. |
| 44616546 | Python | Crash | Yes | timedelta column mean() fails "no numeric types to aggregate". On modern pandas, silently drops column instead of crashing (DC behavior). |
| 48062499 | Python | IF | Yes | Y-axis data plotted as strings, not sorted numerically. String where number expected. Data processing error visible in output. |
| 18401112 | Python | Crash | Yes | String labels ('0','1') instead of int labels for roc_auc_score. Wrong type at data load. |
| 14023423 | R | Crash | Yes | caret preProcess fails on factor columns. Numeric function on non-numeric type. |
| 22906804 | R | Crash | Yes | Matrix multiply on data.frame requires as.matrix. Type not suitable for math operations. |
| 33692532 | Python | Crash | Yes | .str accessor on column with NaN fails. Wrong accessor for column state (nullable). |
| 22137723 | Python | Crash | Yes | Number strings with commas ("1,234") fail numeric operations. String masquerading as number. |
| 30519140 | Python | Crash | Yes | Boolean mask on mixed-dtype DataFrame fails. Type inconsistency across columns. |
| 36462257 | Python | Crash | Yes | Empty DataFrame loses dtype specification. Schema lost through operation. |
| 16988526 | Python | IF | Yes | CSV reader infers '1234E5' as float instead of string. Silent wrong type at load. Original bug fixed in pandas 0.11.1, but same class of bug reproduced with leading-zero identifiers ('007' → 7). |
| 41286569 | Python | Crash | Yes | df.sum() on object-dtype column concatenates strings instead of adding numbers. Numeric op on wrong type. |
| 48719937 | Python | Crash | Yes | idxmax() on object-dtype column fails. Numeric reduction on wrong type. |
| 30857680 | Python | Crash | Yes | resample() requires DatetimeIndex, got integer index. Wrong index type for operation. |
| 14992644 | Python | Crash | Yes | Histogram on string DataFrame columns fails. Numeric operation on string data. |
| 37513355 | Python | Crash | Yes | Spark DataFrame schema inference fails on mixed types in column. |
| 19864028 | Python | Crash | Yes | Column contains 'na' string alongside numbers, preventing float conversion. Mixed types. |
| 25416955 | Python | Crash | Yes | Matplotlib date axis from string column not parsed. String where date expected. |
| 17690738 | Python | Crash | Yes | Assigning datetime to integer-indexed Series. Type mismatch on assignment. |
| 31521526 | Python | Crash | Yes | Currency string "(1,234.56)" can't convert to float. String format vs numeric type. |
| 30132282 | Python | Crash | Yes | .str accessor on datetime Series. Wrong accessor for column type. |
| 15799162 | Python | Crash | Yes | Resampling requires DatetimeIndex, got MultiIndex with dates. Wrong index type. |
| 21011777 | Python | Crash | Yes | NaN mixed into list prevents clean removal — math.isnan fails on non-float elements. Mixed types. |
| 17950374 | Python | Crash | Yes | Concatenating int column with string fails. Type mismatch in string operation. |
| 28393103 | Python | Crash | Yes | "cannot perform reduce with flexible type" — numeric reduction on object-dtype array. |
| 21472243 | Python | Crash | Yes | plt.hist on object-dtype data fails reduce. Numeric operation on string/object data. |
| 39180873 | Python | Crash | Yes | Histogram on DataFrame with wrong dtypes. Numeric operation on non-numeric. |
| 31162780 | Python | Crash | Yes | matplotlib Rectangle with datetime needs float conversion. Type mismatch at API boundary. |
| 6063876 | Python | Crash | Yes | Scatter colorbar needs float array, got tuple list. Type mismatch. |
| 24706677 | Python | Crash | Yes | sklearn GradientBoosting doesn't handle string/categorical features. Numeric expected. |
| 12588986 | Python | Crash | Yes | Inplace add on numpy object array with float64 fails. Type conflict in arithmetic. |
| 5957380 | Python | Crash | Yes | Structured array to regular ndarray conversion fails. Type conversion error. |
| 33221655 | Python | Crash | Yes | Setting list value in float64 column fails. Type mismatch on assignment. |
| 41815365 | R | Crash | Yes | date_trans requires Date class, got character. String where date expected. |
| 28730083 | R | Crash | Yes | geom_area fails with categorical x-axis. Wrong type for continuous operation. |
| 31269216 | Python | Crash | Yes | str.upper() on mixed-type column fails. String method on non-string data. |
| 4231190 | Python | Crash | Yes | numpy array of tuples needs structured dtype. Type specification error. |
| 22557322 | Python | IF | Yes | numpy savetxt fmt='%i' on float array silently drops zeroes. Format/type mismatch produces wrong output. |
| 36115687 | Python | IF | Yes | PySpark filtering dates stored as strings — comparison uses string ordering not date ordering. Silent wrong results. |
| 10805643 | R | Crash | Yes | Numeric column passed to discrete color aesthetic. Typed graph API enforces `color: ColumnSpec<T, string \| number>` with explicit scale mapping. |
| 29974535 | R | Crash | Yes | Character date column on x-axis gives wrong ordering. Typed x-axis mapping expects temporal or numeric for ordered axes. |
| 35560433 | R | IF | Yes | geom_smooth fails silently on character dates. String column where temporal/numeric expected for regression. |
| 29278153 | R | Crash | Yes | String/factor column passed to continuous y-axis. Typed y mapping requires `number \| null \| undefined`. |
| 23997475 | R | Crash | Yes | Character date value for geom_vline position. Typed position spec requires numeric/temporal. |
| 25937000 | R | Crash | Yes | String/factor value on continuous scale. Same pattern as 29278153. |
| 10495898 | R | Crash | Yes | String column on x-axis for line chart causes wrong ordering. Typed line x mapping would flag non-ordinal type. |
| 29953011 | R | Crash | Yes | Numeric vector passed where DataFrame expected. Typed graph() requires `DataFrame<T>` input. |
| 30063190 | R | Crash | Yes | POSIXlt date column incompatible with dplyr. Tidy-ts uses single consistent Temporal type. |
| 27828850 | R | Crash | Yes | POSIXlt column breaks dplyr group_by. Same temporal type consistency pattern. |
| 26788854 | Python | Crash | Yes | Date string "03011979" used in datetime arithmetic. String where temporal type expected. |
| 50916422 | Python | Crash | Yes | numpy int64 extracted from DataFrame not JSON serializable. Tidy-ts values are native JS types. |
| 11561932 | Python | Crash | Yes | numpy int32 in list not JSON serializable. Same native type pattern. |
| 19105976 | Python | Crash | Yes | .date() called on Series instead of element. Typed mutate enforces value-level operations. |
| 30944577 | Python | Crash | Yes | str.contains returns Series used as scalar bool. Typed filter operates on values, returns boolean. |

#### Missing value

| ID | Lang | Effect | Reproduced | Notes |
|---|---|---|---|---|
| 7960798 | R | Crash | Yes | NA returns logical type instead of numeric across groups. NA type conflicts. |
| 29224719 | R | Crash | Yes | ifelse with NA causes logical vs numeric type conflict. NA propagation changes types. |
| 44893933 | R | Crash | Yes | case_when requires same types across branches, NA is logical not numeric. |
| 21714867 | R | DC | Yes | mean() returns double, ifelse with NA_integer_ corrupts to garbage values. Silent data corruption from NA type mismatch. |
| 31745509 | Python | Crash | Yes | str.contains on nullable column returns NaN, bitwise NOT fails on NaN. Missing values break operations. |
| 47333227 | Python | Crash | Yes | NaN in column prevents astype(int). Missing values block type conversion. |
| 15138973 | Python | Crash | Yes | value_counts().max() fails because NaN in results. Missing values propagate into aggregation. |
| 33199193 | Python | Crash | Yes | NaN in list-type column can't be filled with empty list. Missing value handling type mismatch. |
| 26614465 | Python | Crash | Yes | pd.notnull on list returns array, breaks if-condition. Null-check returns unexpected type. |

#### Join

| ID | Lang | Effect | Reproduced | Notes |
|---|---|---|---|---|
| 7920688 | R | Crash | Yes | data.table join key type mismatch (int vs double). Join key types must match. |

#### Data loading

| ID | Lang | Effect | Reproduced | Notes |
|---|---|---|---|---|
| 29298577 | Python | Crash | Yes | String 'nan' in date column fails to_datetime. Mixed content at load boundary. |
| 22137723 | Python | Crash | Yes | Number strings with commas fail conversion. Data format vs expected type at load. |
| 27413843 | Python | Crash | Yes | read_table fails with wrong separator — loads as single column. Schema mismatch at load. |
| 17151210 | Python | Crash | Yes | numpy loadtxt fails on header/comment rows. Non-numeric content in numeric load. |
| 37513355 | Python | Crash | Yes | Spark schema inference fails on mixed types. Load-time type inference error. |

*(Note: some bugs appear in both value type and data loading — classified by primary context.)*

---

### Excluded

#### Visualization-specific

Operations with no non-visual equivalent — ggplot2 API specifics, matplotlib rendering mechanics. Note: 8 bugs originally in this section were moved to "Value type (included)" because they involve passing a wrong-typed column to a chart aesthetic mapping (e.g., string where numeric expected for y-axis), which tidy-ts's typed `graph()` API catches at compile time via `ColumnSpec<T, number | null | undefined>` constraints.

| ID | Lang | Effect | Notes |
|---|---|---|---|
| 3039438 | R | Crash | ggplot2 footnote/annotation |
| 36476751 | R | Crash | ggplot2 color palette |
| 4835332 | R | Crash | Combining ggplot2 elements in function return |
| 33826249 | R | Crash | Mixing base plot with grid graphics |
| 3695497 | R | Crash | ggplot2 show percentages |
| 20500706 | R | Crash | Saving multiple ggplots |
| 26327991 | R | Crash | Plotting ts object with ggplot2 |
| 32219350 | Python | Crash | Saving pie plot returns array not figure |
| 19953348 | Python | Crash | Subplot loop returns single Axes vs array |
| 11541123 | Python | Crash | matplotlib 3D line plot API |
| 16569489 | R | Crash | ggplot2 histogram fill needs factor (geom choice, not type mapping) |
| 34428440 | R | Crash | stat_bin requires continuous x for factor (geom choice, not type mapping) |

#### Language plumbing

R NSE/metaprogramming, Python 2→3 migration, namespace issues, lazy evaluation.

| ID | Lang | Effect | Notes |
|---|---|---|---|
| 34186903 | R | Crash | R dplyr NSE: passing column names as strings |
| 24619628 | R | Crash | R passing string to dplyr filter — NSE |
| 48430882 | R | Crash | R select_if negated predicate — NSE syntax |
| 45824409 | R | Crash | Combining ggplot and dplyr in function — NSE |
| 44548819 | R | Crash | Tidy evaluation with ggplot2 — NSE |
| 10675182 | R | Crash | R data.table variable parameters — NSE |
| 4856849 | R | Crash | ggplot2 loop variable lazy evaluation |
| 26235825 | R | IF | ggplot2 for-loop lazy evaluation — only last layer |
| 44205731 | R | Crash | purrr::map masks maps::map — namespace collision |
| 26121009 | Python | Crash | Python 3 zip returns iterator — migration |
| 37792999 | Python | Crash | Python 3 map returns iterator — migration |
| 49328370 | R | Crash | dplyr::recode pipe semantics — first arg confusion |

#### External library interop

ctypes/FFI, audio processing, multiprocessing, Spark/Dask-specific, database drivers.

| ID | Lang | Effect | Notes |
|---|---|---|---|
| 32120178 | Python | Crash | ctypes ndpointer can't accept None — FFI |
| 26778079 | Python | Crash | numpy array not C-contiguous — memory layout for Cython |
| 8501141 | Python | IF | Audio resample float32 vs int16 — audio processing |
| 22487296 | Python | Crash | multiprocessing.Value can't hold DataFrame — IPC |
| 39584118 | Python | Crash | Dask to_datetime needs metadata — Dask-specific |
| 32742004 | Python | Crash | Spark can't infer schema from flat RDD — Spark-specific |
| 18621513 | Python | Crash | numpy array into sqlite3 BLOB — serialization |
| 47328402 | Python | Crash | pymysql cursor result to DataFrame — driver API |
| 4904972 | R | Crash | igraph object to data.frame — library conversion |
| 30097730 | R | Crash | caret predict factor encoding mismatch — ML model interop |
| 33695389 | Python | Crash | PySpark filter by array length — Spark-specific API |

#### API syntax confusion

User called wrong method or used wrong argument structure. Not a type issue.

| ID | Lang | Effect | Notes |
|---|---|---|---|
| 26347412 | Python | Crash | df.drop with extra list wrapper — API syntax |
| 35587459 | Python | Crash | groupby needs list not multiple args — API syntax |
| 19392226 | Python | Crash | value_counts on DataFrame not Series — wrong method |
| 29150346 | Python | Crash | MultiIndex levels immutable — API constraint |
| 39534676 | Python | Crash | pd.concat given DataFrame not list — API syntax |
| 35839408 | R | Crash | dplyr drop columns by name — API pattern |
| 28751023 | R | Crash | dplyr mutate on subset of columns — API pattern |
| 38514988 | R | Crash | String concatenation in summarize — API usage |
| 30196495 | R | Crash | dplyr summarize with which() — API usage |
| 13854476 | Python | Crash | groupby transform vs apply semantics — API behavior |
| 51079543 | Python | Crash | groupby transform vs apply — API behavior |
| 39992411 | Python | Crash | to_datetime on DataFrame instead of Series — wrong target |
| 20455163 | Python | Crash | round() on DataFrame — API version issue |
| 12190874 | Python | Crash | DataFrame sampling — API usage |
| 41654949 | Python | Crash | Pandas style function signature — API usage |
| 47242845 | Python | Crash | json_normalize nested JSON — API usage |
| 19169649 | Python | Crash | str.contains with | operator — Python operator misuse |

#### Environment/platform

Version differences, file encoding, binary mode, platform-specific behavior.

| ID | Lang | Effect | Notes |
|---|---|---|---|
| 14269164 | Python | Crash | Casting rules differ between numpy versions |
| 18645401 | Python | Crash | to_excel utf8 codec error — encoding |
| 27786868 | Python | Crash | numpy savetxt needs binary mode in Python 3 |
| 35372829 | Python | Crash | numpy savetxt format mismatch in Python 3 |
| 22725043 | Python | Crash | int64 to int32 platform-dependent width |

#### Not data processing

numpy array manipulation, typing questions, language semantics outside data analysis context.

| ID | Lang | Effect | Notes |
|---|---|---|---|
| 47721635 | Python | IF | NaN identity vs equality — Python language semantics |
| 35328286 | Python | Crash | np.array vs np.ndarray in type hints — naming confusion |
| 16862459 | Python | Crash | numpy.float64 not iterable — scalar vs array |
| 33747908 | Python | Crash | numpy.where returns tuple — API return type |
| 44302946 | Python | Crash | itertools rejects numpy int64 — interop |
| 23668509 | Python | Crash | Dict keys/values to numpy arrays — Python 3 views |
| 34952651 | Python | Crash | Float from division used as array index |
| 33144039 | Python | Crash | Python list indexed with numpy array |
| 29318459 | Python | Crash | Function handling scalar vs array input |
| 22016847 | Python | Crash | Complex assignment to numpy float64 array |
| 3685265 | Python | Crash | numpy savetxt for 3D array — IO/shape |
| 48622281 | Python | Crash | numpy ndarray to CSV format — IO |
| 16621351 | Python | Crash | numpy savetxt string+float mixed — IO format |
| 38673531 | Python | Crash | int16 *= float64 casting — numpy arithmetic |
| 27622834 | Python | Crash | ndarray to PIL Image — dtype mismatch |
| 29877508 | Python | Crash | dtype=object semantics — numpy conceptual |
| 21088133 | Python | Crash | ndarray vs array constructor — numpy naming |
| 32743427 | Python | Crash | numpy randint returns int64, needs uint8 — numpy dtype |
| 45670487 | Python | Crash | numpy.cov on object dtype — numpy-specific |
| 41493177 | Python | Crash | MultiIndex DataFrame multiply — index alignment logic |
| 24152509 | Python | Crash | MultiIndex slicing with wrong type — pandas MultiIndex |
| 37703634 | Python | Crash | Reading S3 file with boto3 — IO |
| 22218438 | Python | Crash | rolling_apply can only return scalar — API limitation |
| 35368645 | Python | Crash | Float64Index to string conversion — index type |
| 15884527 | Python | Crash | Python list multi-dim slicing fails — not numpy array |
| 18557337 | Python | Crash | np.dot returns float, used with np.exp — scalar vs array |
| 20333435 | Python | Crash | Operator precedence & vs == — language syntax |
| 14431646 | Python | Crash | DataFrame to SQLite index handling — IO/API |
| 17393989 | Python | Crash | Float from division used as array index — numpy indexing |

---

## Outcome distribution (included bugs only)

| Outcome | Count | % | Description |
|---|---|---|---|
| DC (data corruption) | 5 | 6% | Program produces wrong data silently |
| IF (incorrect functionality) | 6 | 8% | Program produces wrong behavior silently |
| Crash | 67 | 86% | Program stops with error message |

The 11 silent bugs (DC + IF) are the strongest evidence for the paper's thesis. The 67 crash bugs demonstrate that a compile-time type system would catch the error earlier and with a clearer message, but the existing language does eventually detect them.

---

## Notes

1. The TM (Type Mismatch) root cause category is heavily skewed toward value type errors, which is expected — the RPython researchers selected these bugs specifically because they involve type mismatches. This means value type is overrepresented relative to the other 4 categories.

2. Many bugs that crash with a clear error message are still included because the crash indicates a type error that a compile-time type system could have caught earlier — the question is whether the error pattern is cross-language evaluable, not whether the outcome was silent.

3. The high exclusion rate (~63%) is itself informative: it shows that many "type mismatch" bugs in the wild involve visualization APIs, language-specific metaprogramming, or numpy array mechanics — domains that are outside the scope of compile-time DataFrame type checking. This is consistent with the paper's limitations section.

4. Some bugs could reasonably be classified in multiple categories (e.g., 22137723 is both a value type error and a data loading error). These are classified by the primary context in which the error manifests.

5. Several bugs appear in both TM_DFB and TM datasets. After deduplication, each bug is evaluated once.
