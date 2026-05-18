# Migrate existing reproduction frontmatter to the three split fields

Status: ready-for-agent

## What to build

Migrate every existing `.py` / `.R` reproduction file under `docs/JAMIA/comparisons/RPython/TM/` and `docs/JAMIA/comparisons/RPython/CDA/` from the old single `Type system catch` frontmatter field to the three new fields defined in issue 03.

For each file:

1. Parse the existing `# Type system catch: <prose>` line.
2. Infer the three new values:
   - **`Tidy-TS detection outcome`**: read the paired `.ts` file. If it contains an `@ts-expect-error`, the outcome is `compile-time error`. If it relies on `readCSV` + Zod, the outcome is `compile-time error` for schema mismatches at load. If the paired `.ts` documents "bug still exists," set `silent continuation` (or `runtime error` if the bug genuinely throws). If the `.py` is a "structurally absent" case, set `not applicable`.
   - **`Tidy-TS detection mechanism`**: from the paired `.ts`:
     - `compiler` for pure `@ts-expect-error` cases
     - `zod schema validation` for `readCSV`-with-schema cases
     - `runtime API guard` for `append` / proxy-error cases
     - `none — language structural absence` when the bug class requires a language feature TS/JS doesn't have (e.g., R int/double distinction; R NSE scoping)
     - `none — library API design` when the bug class exists in the language but tidy-ts's API design avoids it (e.g., `.replaceAll()` is unambiguously substring; no operator overloading on arrays for boolean indexing)
     - `none — bug still exists` for honest non-catches (tidy-ts reproduces the same failure)
   - **`Tidy-TS catch explanation`**: copy the existing prose phrase from the old `Type system catch` field.
3. Replace the old field with the three new ones.

After all files are migrated, run `deno run -A docs/JAMIA/comparisons/build-issue-tables.ts` (or whatever script regenerates the corroboration tables) to verify the new fields produce identical or improved tables.

Scope: the ~25 completed reproductions listed in `RPython/PROGRESS_LOG.md`.

## Acceptance criteria

- [ ] Every migrated file has the three new frontmatter fields populated.
- [ ] No migrated file retains the old `Type system catch` field.
- [ ] At least one example of each `Tidy-TS detection mechanism` enum value exists across the corpus (or the absence is noted with rationale).
- [ ] For every file with mechanism `language structural absence` or `library API design`, the corresponding `Tidy-TS detection outcome` is `not applicable` — these do not count as catches.
- [ ] Files previously marked `none — structurally absent` are audited and reclassified into either `language structural absence` or `library API design` per the distinction in issue 03. Cases of genuine doubt are flagged in the PR description for author review.
- [ ] The build-issue-tables script runs cleanly and the resulting per-category counts are documented in the PR description.
- [ ] Files that document `bug still exists` cases are explicitly marked `none — bug still exists` and contribute to a "limitations" subtotal, not a "catches" subtotal.

## Blocked by

- Issue 03 (the schema must exist before files can be migrated to it).
