# Add new frontmatter fields to INSTRUCTIONS.md and rules.md

Status: ready-for-agent

## What to build

Follow-up to issue 02. After the frontmatter schema is settled in issue 03, update `docs/JAMIA/comparisons/RPython/INSTRUCTIONS.md` and `docs/JAMIA/comparisons/RPython/rules.md` to reference the three new frontmatter fields:

- `Tidy-TS detection outcome`
- `Tidy-TS detection mechanism`
- `Tidy-TS catch explanation`

Specifically:

- In INSTRUCTIONS.md, update the section that describes what each .py/.R file must contain to require all three fields (currently only references "Type system catch").
- In INSTRUCTIONS.md, update the `@ts-expect-error` placement guidance so it pairs naturally with the `Tidy-TS detection mechanism` enum values (e.g., a scenario marked `compiler` should have an `@ts-expect-error` in the matching .ts file; one marked `zod schema validation` does not need `@ts-expect-error` because the catch is at runtime).
- In rules.md, update "What to record for each bug" to list the three fields explicitly.
- Add guidance on when to use `structurally absent` vs `bug still exists` in the mechanism field.

## Acceptance criteria

- [ ] INSTRUCTIONS.md and rules.md reference all three new field names with their enums.
- [ ] Placement guidance for `@ts-expect-error` is consistent with the `Tidy-TS detection mechanism` field.
- [ ] Decision rule for `structurally absent` vs `bug still exists` is written, with an example of each.

## Blocked by

- Issue 02 (vocabulary swap must land first to avoid merge churn).
- Issue 03 (the schema this slice describes must exist first).
