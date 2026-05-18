# Split INCLUSION_EVALUATION.md frontmatter schema into three fields

Status: ready-for-agent

## What to build

Update the Column Schema section in `docs/JAMIA/comparisons/RPython/INCLUSION_EVALUATION.md` to split the existing single `Type system catch` frontmatter field into three separate fields:

```
# Tidy-TS detection outcome: <enum>
# Tidy-TS detection mechanism: <enum>
# Tidy-TS catch explanation: <free text, one phrase>
```

Enums (from CONTEXT.md):

- **Tidy-TS detection outcome**: `compile-time error` / `runtime error` / `runtime warning` / `silent continuation` / `not applicable`
- **Tidy-TS detection mechanism**: `compiler` / `zod schema validation` / `runtime API guard` / `none — language structural absence` / `none — library API design` / `none — bug still exists`
- **Tidy-TS catch explanation**: free text, one phrase. Format depends on mechanism:
  - For real catches: "[type or runtime rule] rejects [bad operation]" — e.g., `` `number` rejects `number | null` ``
  - For `language structural absence`: "Language has no [feature]; bug class cannot occur"
  - For `library API design`: "tidy-ts API uses [different design]; bug class avoided by API choice"
  - For `bug still exists`: "tidy-ts reproduces [failure]; not caught"

Note: outcome and mechanism are correlated but recorded separately. `language structural absence` and `library API design` mechanisms imply outcome `not applicable` (the original bug cannot occur). `bug still exists` mechanism implies outcome `silent continuation` or `runtime error` (the bug runs in tidy-ts; counts as a non-catch). The split between `language structural absence` and `library API design` matters because the former cannot be replicated by any TS library, while the latter could be reintroduced by another library that made different design choices.

Update the Column Schema section's example frontmatter blocks (R and Python) to show all three new fields. Update the table-of-fields section accordingly: remove the old "Type system catch" row, add three new rows.

This slice changes **only the schema document**, not the existing reproduction files. File migration is issue 05.

## Acceptance criteria

- [ ] Column Schema section in INCLUSION_EVALUATION.md describes the three new fields with their enums and examples.
- [ ] The single "Type system catch" field is removed from the schema spec.
- [ ] Example R and Python frontmatter blocks show the three new fields in place of the old one.
- [ ] The three "none" mechanism values (language structural absence / library API design / bug still exists) are documented with the distinction between them and their implications for outcome and coverage statistics.
- [ ] `language structural absence` and `library API design` outcomes are documented as `not applicable` (not counted toward catches); `bug still exists` is documented as a non-catch contributing to a limitations subtotal.
- [ ] Existing reproduction files (`.py`/`.R`) are NOT modified in this slice.

## Blocked by

- None — can start immediately.
