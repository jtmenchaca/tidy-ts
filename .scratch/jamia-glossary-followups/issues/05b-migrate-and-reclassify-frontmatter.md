# Migrate and reclassify reproduction frontmatter

Status: ready-for-agent

## What to build

Consuming the verification report from issue 05a, walk every reproduction in `docs/JAMIA/comparisons/RPython/{TM,CDA}/` and bring its frontmatter to the three-field schema defined in issue 03 and the canonical glossary at `docs/JAMIA/comparisons/CONTEXT.md`.

For each reproduction:

1. **Update `Reproduction status`** to match the verification report. Three values per CONTEXT.md: `Reproduces` / `No longer reproduces` / `Variant`. Replace any existing `Live` / `Fixed` / `N/A` values with the canonical enum (`Live` → `Reproduces`; `Fixed` → `No longer reproduces`; `N/A` removed entirely — excluded snippets don't have this field). If the verification report disagrees with the existing field, the report wins. Files where the runner could not execute (`Verification status: failed`) leave `Reproduction status` unset and are flagged in the PR description.

2. **Replace the single `Type system catch` field with three:**
   - `Tidy-TS detection outcome` — enum: `compile-time error` / `runtime error` / `runtime warning` / `silent continuation` / `not applicable`
   - `Tidy-TS detection mechanism` — enum: `compiler` / `zod schema validation` / `runtime API guard` / `none — language structural absence` / `none — library API design` / `none — bug still exists`
   - `Tidy-TS catch explanation` — free text, one phrase

3. **Reclassify previously-collapsed "structurally absent" cases.** Every file currently saying "structurally absent" needs auditing into the three sub-values:
   - **Language structural absence** — the bug class requires a language feature TS/JS does not have (e.g., R int/double, R NSE). Cannot occur in any TS library. Outcome: `not applicable`.
   - **Library API design** — the language has the feature but tidy-ts's API made a different design choice (e.g., `.replaceAll()` is unambiguously substring; no operator overloading). Could be reintroduced by another TS library. Outcome: `not applicable`.
   - **Bug still exists** — tidy-ts reproduces the same failure mode and does not catch it. Outcome: `silent continuation` or `runtime error`. Honest non-catch.

4. **Fix known-broken files surfaced by the verification report:**
   - `TM/14023423` — replace `s.sd()` with `s.stdev()` or remove the line.
   - `TM/33692532` — remove the duplicate `33692532_str_accessor_with_nan.py` if it exists. Update the surviving file's docstring to record that the bug no longer reproduces on modern pandas.
   - `TM/18401112` — update docstring to record that the bug no longer reproduces on modern sklearn.
   - `TM/44616546` — update docstring and `Original-language consequence` field to record the Crash → DC morphing on modern pandas.

5. **Flag genuine reclassification doubt** in the PR description rather than guessing. Cases where you cannot confidently distinguish "language structural absence" from "library API design" should be listed for author review.

## Acceptance criteria

- [ ] Every reproduction file in `RPython/{TM,CDA}/` has the three new fields populated.
- [ ] No reproduction retains the old `Type system catch` field.
- [ ] `Reproduction status` matches the verification report for every file.
- [ ] Every file previously marked `none — structurally absent` is reclassified into one of the three new sub-values.
- [ ] The four known-issue files have appropriate fixes or documented limitations.
- [ ] Files with ambiguous reclassification are listed in the PR description for author review.
- [ ] `language structural absence` and `library API design` mechanisms always pair with `not applicable` outcome.
- [ ] `bug still exists` mechanism always pairs with `silent continuation` or `runtime error` outcome — never `not applicable`.

## Blocked by

- Issue 03 (schema must be defined first).
- Issue 05a (verification report drives this migration; don't proceed without it).

## Out of scope

- Generating aggregate tables from the migrated frontmatter. That's issue 05c.
