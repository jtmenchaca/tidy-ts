# RPython Reproduction Instructions

## Non-negotiable process for writing .ts files

1. **Read the .py file first.** Understand the exact bug scenario — what operations trigger it, what data structures are involved, what goes wrong.
2. **Search for equivalent tidy-ts APIs.** If the .py uses transpose, grep for transpose. If it uses groupby, grep for groupBy. Do not fabricate workarounds or manual casts when the real API exists.
3. **Match the .py's structure.** The .ts is a direct translation, not an abstract demonstration. Same data, same operations, same flow — just in tidy-ts.
4. **Put `@ts-expect-error` on the earliest point where the type system catches it.** If tidy-ts catches it at the same boundary as the .py (e.g., `readCSV` with a schema rejects bad data at load, just like `np.loadtxt` crashes at load), use that. If the catch is downstream (e.g., `s.mean()` rejects a string column), put it there. Do NOT use a lazy downstream `s.mean()` when a more specific API catches it earlier — like `df.resample()` rejecting a string date column, or `df.transpose()` producing a union type.
5. **Write it once.** If you followed steps 1–4, you don't need 10 iterations.

Mistakes that waste time:
- Writing from memory/vibes instead of reading the .py
- Not searching the codebase for equivalent APIs (e.g., `df.transpose()` exists)
- Using `as SomeType` casts to simulate type corruption when an actual API produces it naturally
- Arguing a bug is "structurally absent" before checking if tidy-ts reproduces the same operation
- Casting columns that aren't affected (e.g., making `classification` a union when only `flag` gets corrupted)
- Using `s.mean()` as a lazy catch-all when a more specific API catches the error earlier (e.g., `df.resample()` rejects string dates — use that, not `s.mean(df.extract("date"))`)
- Using `s.mean()` when the .py's operation is something completely different (histogram, SVD, colorbar) and there's no tidy-ts equivalent — acknowledge the gap, don't pretend `s.mean()` IS the operation

## Purpose

Each reproduction pair (.py + .ts) demonstrates a real-world StackOverflow bug from the RPython dataset and shows how tidy-ts catches it at compile time.

## Source data

The RPython snippets are in `docs/JAMIA/comparisons/RPython-main/`:

- `TM_snippets.json` — Type Mismatch bugs (164 snippets)
- `TM_DFB_snippets.json` — Type Mismatch x DataFrame Bug subset (110, fully contained in TM)
- `CDA_snippets.json` — Confusing Data Analytics (848 snippets)
- `IDAP_IB_snippets.json` — Inappropriate Data Access Pattern x Implementation Bug
- `APIC_snippets.json` — API Change
- `SM_snippets.json` — Specific Misuse

Each snippet contains: `id`, `url`, `lang`, `bug`, `cause`, `effect`, `title`, `tags`, `score`, `question_code`, `question_text`, `top_answer_code`, `top_answer_text`, `accepted_answer_code`, `accepted_answer_text`.

## File naming

`{SO_ID}_{short_description}.py` and `{SO_ID}_{short_description}.ts`

Place in the appropriate subset folder:
- `/Users/jtmenchaca/tidy-ts/docs/JAMIA/comparisons/RPython/TM/`
- `/Users/jtmenchaca/tidy-ts/docs/JAMIA/comparisons/RPython/TM_DFB/`
- `/Users/jtmenchaca/tidy-ts/docs/JAMIA/comparisons/RPython/CDA/`

## The .py file

- Must actually reproduce the bug when run with `python3`
- Show the silent wrong output (or the crash, if that's the effect)
- Use code that matches the SO question's actual scenario — don't fabricate a contrived version
- Reference the SO ID and effect (DC/IF/Crash) in a docstring at the top
- Run with `python3` (not `python`) — the system Python 3 has pandas installed
- Run against the .venv in this directory if specific package versions are needed

## The .ts file

- Must pass `deno check` cleanly
- Show the tidy-ts equivalent of the same task — what you'd actually write to accomplish it
- Where the type system catches the equivalent mistake, include a `@ts-expect-error` on that line as proof the compiler rejects it
- Where the bug is structurally absent (e.g., no int/double distinction in JS, no implicit column dropping), show the correct code and explain why the bug class doesn't exist. **Include the bug class in the docstring header.** Bug classes:
  - **Type coercion** — silent type widening (e.g., boolean→object, float→object)
  - **Implicit column selection** — operations silently drop columns by type
  - **Int/double distinction** — R's integer vs double type inconsistency
  - **Operator overloading** — pandas &/| vs Python and/or semantics
  - **API ambiguity** — same method name does different things (value-level vs substring replace)
  - **Nullable type** — NaN mixed into typed data without the type reflecting it
- **Every bug in INCLUSION_EVALUATION.md gets a .ts file regardless of whether tidy-ts catches it or not.** If the bug still exists in tidy-ts, say so. If it's structurally absent, say so. If the type system catches it downstream, demonstrate it. Do not skip bugs or selectively include only favorable ones.
- Use real tidy-ts APIs as they actually work: `df.extract()`, `s.test.correlation.pearson()`, `df.mutate()`, `df.filter()`, `df.summarize()`, etc.
- Refer to `packages/mcp/docs/` for canonical usage examples and API signatures
- **No bias or editorializing.** Do not write "just works" or imply tidy-ts is superior. State facts only.
- **The `@ts-expect-error` must target the downstream operation where the bug manifests.**
  The bug in the original language is never "a type exists." The bug is that the user
  proceeds with an operation without realizing the type is wrong — they call .mean() on
  strings, they multiply strings by arrays, they pass mixed data to sklearn, etc.
  The `@ts-expect-error` goes on THAT line: the downstream ingestion that would fail
  or produce wrong results. Examples:
  - `s.mean(df.extract("col"))` where col is string[] — the error is on the s.mean() call
  - `s.mean(mixed.extract("b"))` where b is (string|number)[] — the error is on s.mean()
  - NOT on the assignment or mutate that creates the value. Creating a `number | string`
    column via mutate may be intentional. The type error appears when the user tries to
    USE that column in a context that requires a narrower type without accounting for it.
  This is the core thesis: TypeScript doesn't prevent you from having mixed data. It
  prevents you from IGNORING that you have mixed data when you pass it downstream.

## Critical: Every .ts file MUST have a @ts-expect-error

Every .ts file must include at least one `@ts-expect-error` that demonstrates the type system
catching the equivalent mistake. This is non-negotiable — it is the proof mechanism.

Even when the bug is "structurally absent" (e.g., JS has no int/double distinction), there is
still a downstream operation you can demonstrate. The pattern is:

1. Set up the data the way the user would in tidy-ts
2. Show a downstream numeric/typed operation that would fail if the column were the wrong type
3. Put `@ts-expect-error` on that downstream operation

**Do NOT write .ts files that only show "the correct way" without proving a type error exists.**
A file without `@ts-expect-error` proves nothing — it's just example code with no evidence.

Exceptions (no `@ts-expect-error` needed):
1. Bugs where tidy-ts genuinely does NOT catch it (the bug still exists).
   Say so explicitly: "This bug still exists in tidy-ts."
2. Bugs that are structurally absent due to language semantics (not types) — e.g.,
   operator overloading confusion where JS operators just work correctly.
   Say so explicitly: "No @ts-expect-error is applicable because the fix is
   clearer operator/language semantics, not type checking."

Do NOT fabricate contrived `@ts-expect-error` lines (e.g., `as unknown as string[]`) to
force a type error that doesn't naturally arise from the bug scenario. That is dishonest.

## Verification

```bash
# The .py reproduces the bug:
python3 docs/JAMIA/comparisons/RPython/TM/22481271_corr_object_dtype.py

# The .ts compiles (proving @ts-expect-error caught a real error):
deno check docs/JAMIA/comparisons/RPython/TM/22481271_corr_object_dtype.ts
```

## Reproduction verification

After writing a .py or .R file, **run it** and verify it actually produces the expected error or
silent wrong output. If it does NOT reproduce on the current version:
- Add a NOTE in the docstring: "Does NOT reproduce on [package] [version]. The bug was fixed."
- Still keep the file — it documents what the original bug was.
- The .ts file is still valid regardless of whether the .py reproduces.

## Selection criteria

Pick bugs where:
1. The effect is DC (silent data corruption) or IF (silent incorrect functionality) — these are most relevant to the paper's thesis
2. The bug reproduces on the current Python/R version (or with minimal version pinning)

## API pitfalls (things that will cause `deno check` to fail)

- `s.mean()`, `s.sum()`, `s.max()`, `s.median()` all accept `(number | null | undefined)[]` (type `NumbersWithNullable`). So `@ts-expect-error` on `s.mean(df.extract("col"))` **will NOT fire** if the column is `number | null`. For nullable number columns, demonstrate the error on a method that rejects null directly, like `Math.round(r.x)` in a mutate.
- `df.mutate()` allows returning ANY value — the return type becomes the new column type. Returning `[400.0]` makes the column `number[]`, not `number`. The type error appears downstream when consuming that column.
- `df.filter()` does NOT narrow types. After `df.filter((r) => r.x !== null)`, `x` is still `number | null`. Handle nulls inside mutate with inline checks: `(r) => r.x === null ? null : Math.round(r.x)`.
- There is no `antiJoin`, `leftJoin`, etc. on DataFrame. Use `df.filter()` with a Set for anti-join patterns.
- `createDataFrame<Row>([])` does NOT work — the generic expects `readonly object[]`. Just pass actual row data.
- `s.sd()` does NOT exist. Use `s.stdev()` or omit.

## Completed examples

These serve as reference implementations:

- `TM/22481271_corr_object_dtype.py` + `.ts` — pandas corr() silently returns empty matrix on object-dtype columns. tidy-ts rejects string[] passed to s.test.correlation.pearson() at compile time.
- `TM/56079650_boolean_coercion.py` + `.ts` — pandas silently coerces boolean to object dtype, ~ gives integers instead of boolean negation. tidy-ts schema keeps boolean columns as boolean — no silent coercion possible.
- `TM/16067144_fillna_float_dtype.py` + `.ts` — pandas fillna on float64 column with string requires astype(object), silently converting all columns to object dtype; downstream code can still treat the column as numeric. tidy-ts types col2 as string after replaceNull and rejects numeric ops like s.mean() on that column.

## Tracking

The tables in `INCLUSION_EVALUATION.md` should include a "Reproduced" column indicating whether the .py + .ts pair has been implemented and verified for that bug. Values: Yes, No, or N/A (for excluded bugs).
