# Context Map

This repo has multiple contexts. Each one has its own glossary; consumer skills should read the glossary for the context they're working in.

## Contexts

- [JAMIA Manuscript](./docs/JAMIA/CONTEXT.md) — terms for the body prose of the manuscript: audience-facing vocabulary, style commitments, flagged ambiguities, recorded structural decisions, submission package.
- [JAMIA Comparison Suite](./docs/JAMIA/comparisons/CONTEXT.md) — terms for the manuscript's evaluation work: scenarios, categories, comparators, detection outcomes, the Ahmed et al. corroboration.
- [tidy-ts skill testing](./packages/testing/skills/tidy-ts-best-practices/CONTEXT.md) — terms for the agent-driven evaluation of the `tidy-ts-best-practices` skill: agent runs, features, outcomes, holes, pinned regressions.
- [`@tidy-ts/ai`](./packages/ai/CONTEXT.md) — terms for the AI package: Topology (OAS-modeled DAG), Nodes, control/data-flow edges, the `ai.evaluate` row-wise verb, the concept vocabulary framing, model binding at the call site.
- [JAMIA AI Blueprint Coverage](./docs/JAMIA/ai-blueprint/CONTEXT.md) — terms for the exercise that tests `@tidy-ts/ai`'s blueprint formalism against the last 12 months of JAMIA AI work: in-scope AI workflow, verdicts (Blueprintable / Package gap / Underspecified / Mixed), Blueprint sketch, Gap entry with Primitive proposal, Disclosure gap, Gap inventory.

## When to read which

- Editing the manuscript `.docx` or anything in `docs/JAMIA/submission/` → read the JAMIA Manuscript glossary first.
- Working under `docs/JAMIA/comparisons/` (the evaluation suite, verifier, reproductions) → read the JAMIA Comparison Suite glossary.
- Working under `packages/testing/skills/tidy-ts-best-practices/` or dispatching/interpreting agent runs that evaluate the tidy-ts-best-practices skill → read the skill-testing glossary.
- Working under `packages/ai/` (the `ai.evaluate` verb, Topology authoring, OAS-aligned primitives) → read the `@tidy-ts/ai` glossary.
- Working under `docs/JAMIA/ai-blueprint/` (blueprinting JAMIA papers, compiling the gap inventory, writing primitive proposals against the package) → read the JAMIA AI Blueprint Coverage glossary, and read `packages/ai/CONTEXT.md` alongside it (the exercise leans on those primitives).
- Working anywhere else in the repo → no scoped glossary yet; proceed without one. If a term turns out to need pinning (e.g., for the dataframe library API), run `/grill-with-docs` from that subtree and a new context will be added here.

## Relationships

- **JAMIA Manuscript ↔ JAMIA Comparison Suite**: The manuscript's body prose uses audience-facing terms (clinical analyst, downstream analysis, catch, missed, continued silently); the comparison suite uses evaluation-side terms (scenario, comparator, detection outcome, catch signals). The Manuscript glossary defers to the Comparison Suite glossary for evaluation-side definitions.
- **JAMIA AI Blueprint Coverage ↔ `@tidy-ts/ai`**: The blueprint exercise uses `@tidy-ts/ai` vocabulary (Topology, Node, etc.) when sketching paper workflows and produces Gap entries with Primitive proposals against the package. Proposals are not implemented by the exercise — they feed the package's own ADR pipeline.
