# Tighten severity rationale prose in OVERVIEW.md

Status: ready-for-agent

## What to build

The severity rubric stays as the manuscript draft has it: three High criteria (AV ∧ PS ∧ PO), three Low signals (any one sufficient for Low). No rubric changes. The leverage point is the **rationale field**: prose that lets a reader pick any scenario and check the verdict themselves.

Walk the per-scenario rationale column in `docs/JAMIA/comparisons/OVERVIEW.md` for all 65 scenarios. For each one, verify the prose makes the three High criteria visible with concrete observations:

- **AV:** What specifically is altered — which column, value, count, or cohort membership?
- **PS:** Which rows are affected — every row meeting which condition? (Or, for Low: why is the affected set not systematic — e.g., a single fixed position, a cosmetic property?)
- **PO:** What would an analyst see on routine inspection? Plausible-looking values, or obviously wrong output?

Where a rationale already does this well (most do), leave it alone. Where it's vague or paraphrases the verdict without justifying it ("looks plausible" with no explanation of *why* plausible), tighten the prose.

**No template is imposed.** Some rationales need one sentence (cosmetic errors, missing column references); others need a short paragraph. The aim is reader-verifiable classification, not uniform structure.

## Acceptance criteria

- [ ] Every High verdict's rationale makes all three criteria concretely visible. A reader who disagrees with PO=Y can see what specific observation supports it.
- [ ] Every Low verdict's rationale identifies which Low signal applies (OI, NA, or SC) with the same standard of concreteness.
- [ ] No rationale paraphrases the verdict ("plausible") without naming the specific feature of the output that makes it plausible.
- [ ] No verdict changes are made — this is a prose tightening pass, not a re-rating. If a rationale rewrite reveals a verdict that doesn't survive its own reasoning, flag it in the PR description for author review rather than changing it silently.

## Blocked by

- Issue 01 (OVERVIEW.md vocabulary swap) — to avoid editing the same table in two passes.

## Out of scope

- Adding a second rater. The decision to forgo inter-rater is recorded in CONTEXT.md.
- Changing the rubric criteria, adding operational tests, or imposing rationale templates. The earlier proposals to do so were rolled back as adding complexity without changing classifications.
