# Generate corroboration tables programmatically

Status: ready-for-agent

## What to build

Replace the hand-maintained tables in `docs/JAMIA/comparisons/RPython/INCLUSION_EVALUATION.md` with programmatically generated versions, parsed from the migrated reproduction frontmatter. This is the **reproducibility floor** for the RPython contribution: every count in the manuscript's External Validation section traces back to a script reading public files.

Build a script (TypeScript, `deno run -A`) that:

1. **Reads** every `.py`/`.R` reproduction file in `RPython/TM/` and parses the frontmatter. The three `RPython/CDA/` reproductions are read separately and reported as illustrative-only — not part of the inclusion-evaluation denominator. CDA, APIC, SM, IDAP_IB subsets are out of scope per CONTEXT.md.

2. **Reads** the snippet-level metadata in `RPython-main/TM_snippets.json` to pair each reproduction with its source snippet. TM_DFB is fully contained in TM and is not read separately.

3. **Validates** that:
   - Every snippet marked `In study: Yes` has a reproduction file.
   - Every reproduction file references a snippet that exists.
   - Outcome and mechanism enum values pair correctly per CONTEXT.md rules.
   - Surfaces any mismatches as errors, not silent skips.

4. **Emits** the following tables to `INCLUSION_EVALUATION.md` (or a sibling generated file the manuscript pulls from):
   - **Inclusion funnel**: TM corpus size (164) → included → excluded, with exclusion reasons broken down.
   - **Category distribution of included snippets**: count per category (six categories).
   - **Per-category catch breakdown**: for each category, counts by mechanism (`compiler` / `zod` / `runtime API guard` / `none — language structural absence` / `none — library API design` / `none — bug still exists`).
   - **Reproduction status breakdown**: counts of `Reproduces` / `No longer reproduces` / `Variant`. Files with `Verification status: failed` are reported separately as file-health issues, not folded into the status counts.
   - **Per-reproduction detail table**: the long table currently in `INCLUSION_EVALUATION.md` Evaluation section.
   - **Reproducibility metadata header** (per CONTEXT.md): corpus vintage, pinned library versions, evaluation date, generator script + commit. Every generated table inherits this header.

5. **Marks** the generated sections of `INCLUSION_EVALUATION.md` with `<!-- BEGIN GENERATED ... -->` / `<!-- END GENERATED -->` comments. Hand-edits between markers are clobbered on regeneration; hand-edits outside markers (rationale prose, methodology notes) are preserved.

6. **Runs as part of `pnpm ci`** (or equivalent) so a stale generated table is a CI failure, not silent drift.

Sibling output: a JSON file (`corroboration-summary.json`) that the manuscript External Validation section can cite specific numbers from, so the prose stays in sync as the data evolves.

## Acceptance criteria

- [ ] Script runs with `deno run -A` and produces the generated tables.
- [ ] All five tables above are emitted between BEGIN/END GENERATED markers in `INCLUSION_EVALUATION.md`.
- [ ] `corroboration-summary.json` is emitted with the same data in machine-readable form, including reproducibility metadata as a top-level object.
- [ ] Generated sections carry a reproducibility metadata header (corpus vintage, pinned versions, evaluation date, generator commit) per CONTEXT.md.
- [ ] Corpus scope is correctly stated as TM (164 snippets); CDA reproductions reported separately as illustrative-only; other subsets out of scope.
- [ ] The script validates outcome/mechanism pairing rules and exits non-zero on violations.
- [ ] The script verifies every `In study: Yes` snippet has a reproduction and surfaces missing ones.
- [ ] The hand-maintained Summary table at the top of `INCLUSION_EVALUATION.md` is replaced by the generated version.
- [ ] The generated tables match the canonical six categories from CONTEXT.md (Column reference, Value type, Missing value, Join, Data loading, Schema composition).
- [ ] The script is added to a CI step (or documented for the author to run) so drift is detected.

## Blocked by

- Issue 03 (schema).
- Issue 05a (verification report).
- Issue 05b (migrated frontmatter is what this script reads).

## Out of scope

- Writing the External Validation manuscript section itself. That's issue 07, which consumes `corroboration-summary.json`.
- Tooling for the 65-scenario comparison suite. That side already has its own programmatic pipeline.
