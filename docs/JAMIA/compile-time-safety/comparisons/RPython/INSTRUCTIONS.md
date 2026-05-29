# RPython Reproduction Instructions

> Canonical glossary: `docs/JAMIA/comparisons/CONTEXT.md`. Key terms used here: **snippet** (raw RPython entry), **reproduction** (the `.py`/`.R` + `.ts` pair you write), **library** (tidy-ts / pandas / tidyverse / Polars / Arquero), **detection outcome** (what the library does), **detection mechanism** (how it catches it, or why it doesn't). The six categories are **Column reference**, **Value type**, **Missing value**, **Join**, **Data loading**, **Schema composition**.

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

Each **reproduction** (a `.py`/`.R` + `.ts` pair) re-runs a real-world StackOverflow **snippet** from the RPython corpus and shows whether tidy-ts catches the equivalent code. The reproduction is the unit of evidence per included snippet. The corpus scope is the RPython **TM (Type Mismatch) subset** — 164 snippets. CDA, APIC, SM, and IDAP_IB are out of scope; three CDA reproductions exist as illustrative-only examples.

## Source data

The RPython snippets are in `docs/JAMIA/comparisons/RPython/TM_snippets.json`:

- `TM_snippets.json` — Type Mismatch bugs (164 snippets). **In scope.**
- `TM_DFB_snippets.json` — Type Mismatch × DataFrame Bug subset (110, fully contained in TM). No separate evaluation needed.
- `CDA_snippets.json` — Confusing Data Analytics (848 snippets). **Out of scope** for the inclusion evaluation. Three reproductions exist in `RPython/CDA/` as illustrative-only examples.
- `IDAP_IB_snippets.json` — Inappropriate Data Access Pattern × Implementation Bug. **Out of scope.**
- `APIC_snippets.json` — API Change. **Out of scope.**
- `SM_snippets.json` — Specific Misuse. **Out of scope.**

Each snippet contains: `id`, `url`, `lang`, `bug`, `cause`, `effect`, `title`, `tags`, `score`, `question_code`, `question_text`, `top_answer_code`, `top_answer_text`, `accepted_answer_code`, `accepted_answer_text`.

## File naming

`{SO_ID}_{short_description}.py` (or `.R`) and `{SO_ID}_{short_description}.ts`

Place in `/Users/jtmenchaca/tidy-ts/docs/JAMIA/comparisons/RPython/TM/`. The CDA directory exists for the three illustrative reproductions only — do not add new ones unless the corpus scope changes.

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
- Where the bug does **not** result in a tidy-ts catch, classify it explicitly into one of the three "none" mechanism sub-values (see CONTEXT.md and INCLUSION_EVALUATION.md):
  - **`none — language structural absence`** — the bug class requires a language feature TS/JS does not have (e.g., R's int/double distinction, R NSE-based scoping). Cannot occur in any TS library. Does not count as a catch.
  - **`none — library API design`** — TS could in principle have the bug, but tidy-ts's API made a different design choice (e.g., `.replaceAll()` is unambiguously substring; no operator overloading on arrays/booleans). Credit, but acknowledge another TS library could reintroduce the bug. Does not count as a catch.
  - **`none — bug still exists`** — tidy-ts reproduces the same failure mode and does not catch it. Honest non-catch.

  Pick **one** and record it in the frontmatter `Tidy-TS detection mechanism` field. Do not collapse them. Include the bug class in the docstring header. Common bug classes:
  - **Type coercion** — silent type widening (e.g., boolean→object, float→object)
  - **Implicit column selection** — operations silently drop columns by type
  - **Int/double distinction** — R's integer vs double type inconsistency
  - **Operator overloading** — pandas &/| vs Python and/or semantics
  - **API ambiguity** — same method name does different things (value-level vs substring replace)
  - **Nullable type** — NaN mixed into typed data without the type reflecting it
- **Every included snippet in INCLUSION_EVALUATION.md gets a reproduction regardless of whether tidy-ts catches the bug.** If the bug still exists in tidy-ts, say so explicitly in the docstring and the `Tidy-TS detection mechanism` field. If the failure mode is impossible in TS/JS, say so (and pick the right `none` sub-value). Do not skip snippets or selectively include only favorable ones.
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

## When the .ts file has @ts-expect-error (and when it doesn't)

The `@ts-expect-error` marker is the proof mechanism for a `compiler` mechanism catch. Use it when, and only when, the type system genuinely rejects the equivalent code.

**Required** when `Tidy-TS detection mechanism` is `compiler`:
1. Set up the data the way the user would in tidy-ts.
2. Show the downstream operation that would fail because the column's type is wrong.
3. Put `@ts-expect-error` on that downstream operation.

**Not used** for the other mechanisms:
- `zod schema validation` — the catch happens at runtime when `readCSV` rejects the input. The `.ts` file shows the schema and the load call; no `@ts-expect-error` needed.
- `runtime API guard` — the catch is at runtime (e.g., `append` validating row shape). Same: no `@ts-expect-error`.
- `none — language structural absence` — the bug cannot occur. The `.ts` shows the correct code and explains why the bug class is impossible in TS/JS. No `@ts-expect-error`.
- `none — library API design` — the bug doesn't arise with tidy-ts's API. The `.ts` shows the API used and acknowledges that another TS library could make the same mistake. No `@ts-expect-error`.
- `none — bug still exists` — tidy-ts has the same failure. The `.ts` shows that the failure reproduces. No `@ts-expect-error` because there's nothing to catch.

Do NOT fabricate contrived `@ts-expect-error` lines (e.g., `as unknown as string[]`) to force a type error that doesn't naturally arise. The frontmatter mechanism field is the honest record of the catch (or non-catch); the `.ts` file's job is to demonstrate it.

## Verification

```bash
# The .py reproduces the bug:
python3 docs/JAMIA/comparisons/RPython/TM/22481271_corr_object_dtype.py

# The .ts compiles (proving @ts-expect-error caught a real error):
deno check docs/JAMIA/comparisons/RPython/TM/22481271_corr_object_dtype.ts
```

## Reproduction verification

After writing a .py or .R file, **run it** and verify it actually produces the expected error or
silent wrong output. Set `Reproduction status` in the frontmatter to one of:
- `Reproduces` — runs and triggers as recorded.
- `No longer reproduces` — runs without the recorded failure. Add a NOTE in the docstring explaining what the user would observe today.
- `Variant` — triggers a different bug class than originally recorded (e.g., recorded as Crash, now silent DC). Document in the docstring.

Keep the file regardless — it documents what the original bug was. The `.ts` file is valid regardless of the `.py` `Reproduction status`. The frontmatter is the honest record.

## Selection criteria

Snippets are selected from the TM subset per the rules in `rules.md`. The selection is documented in `INCLUSION_EVALUATION.md` (the `In study` field and `Inclusion rationale`). New reproductions should not be added outside the TM subset unless the corpus scope changes — see CONTEXT.md.

## API pitfalls (things that will cause `deno check` to fail)

- `s.mean()`, `s.sum()`, `s.max()`, `s.median()` all accept `(number | null | undefined)[]` (type `NumbersWithNullable`). So `@ts-expect-error` on `s.mean(df.extract("col"))` **will NOT fire** if the column is `number | null`. For nullable number columns, demonstrate the error on a method that rejects null directly, like `Math.round(r.x)` in a mutate.
- `df.mutate()` allows returning ANY value — the return type becomes the new column type. Returning `[400.0]` makes the column `number[]`, not `number`. The type error appears downstream when consuming that column.
- `df.filter()` does NOT narrow types. After `df.filter((r) => r.x !== null)`, `x` is still `number | null`. Handle nulls inside mutate with inline checks: `(r) => r.x === null ? null : Math.round(r.x)`.
- There is no `antiJoin`, `leftJoin`, etc. on DataFrame. Use `df.filter()` with a Set for anti-join patterns.
- `createDataFrame<Row>([])` does NOT work — the generic expects `readonly object[]`. Just pass actual row data.
- `s.sd()` does NOT exist. Use `s.stdev()` or omit.

## Completed examples

These serve as reference implementations:

- `TM/22481271_corr_object_dtype.py` + `.ts` — pandas corr() silently returns empty matrix on object-dtype columns. tidy-ts rejects string[] passed to s.test.correlation.pearson() at compile time. Mechanism: `compiler`.
- `TM/56079650_boolean_coercion.py` + `.ts` — pandas silently coerces boolean to object dtype, ~ gives integers instead of boolean negation. tidy-ts schema keeps boolean columns as boolean. Mechanism: `compiler` (or `library API design` if the bug arose from the operator semantics rather than the column type — pick based on the actual catch).
- `TM/16067144_fillna_float_dtype.py` + `.ts` — pandas fillna on float64 column with string requires astype(object), silently converting all columns to object dtype. tidy-ts types col2 as string after replaceNull and rejects numeric ops like s.mean() on that column. Mechanism: `compiler`.

## Tracking

The tables in `INCLUSION_EVALUATION.md` are generated programmatically from the frontmatter (see issue 05c). The `Reproduction status` column drives the verification report. No manual "Reproduced" tracking is needed beyond keeping the frontmatter accurate.
