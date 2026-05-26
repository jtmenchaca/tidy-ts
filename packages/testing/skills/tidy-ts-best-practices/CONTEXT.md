# tidy-ts skill testing

Glossary for the agent-driven testing of the `tidy-ts-best-practices` skill. The protocol that produces these artifacts is the `create-agent-test-tidy-ts` skill at `.claude/skills/create-agent-test-tidy-ts/`.

## Language

**Target skill**:
The skill being evaluated. Currently `tidy-ts-best-practices`. Determines the subdirectory under `packages/testing/skills/`.
_Avoid_: "the skill", "the tested skill" (ambiguous when both skills are in play)

**Testing skill**:
The skill that orchestrates evaluation. Currently `create-agent-test-tidy-ts`. Lives under `.claude/skills/`.
_Avoid_: "the meta-skill", "the harness"

**Agent run**:
One invocation of a sub-agent with a prompt produced from the testing skill's template. The unit of bookkeeping in `coverage.md`. Identified by a monotonic `run-NN` id.
_Avoid_: "test", "session"

**Round**:
A batch of agent runs dispatched in parallel. Presentation/operational concept; not a stored data dimension.

**Feature**:
A major heading (`##` or `###`) within a rule file under `.claude/skills/tidy-ts-best-practices/rules/`. The row dimension of the coverage matrix.
_Avoid_: "topic", "API"

**Skill coverage**:
For a given **feature**, the question: have agent runs successfully exercised the documentation by writing working code? Distinct from library coverage, which is what the regular test suite checks.
_Avoid_: bare "coverage" (ambiguous with code-coverage tooling)

**Outcome**:
The tri-state result for one (run, feature) cell.
- `clean` — the agent used the feature as documented with no friction.
- `friction` — the agent succeeded but reported a soft observation (no pasted error).
- `bug` — the agent reported an evidence-backed failure of the documented form.

**Hole**:
A **feature** whose `clean` count is zero. Prioritized for upcoming dispatches.

**Needs re-confirmation**:
A **feature** where a **bug** was found, the bug has been fixed, but no `clean` agent run has confirmed the fix in real-world composition. Also prioritized for upcoming dispatches.

**Covered**:
A **feature** with `clean ≥ 2` and no outstanding **bug**.

**Pinned regression**:
A previously-fixed bug with an executable assertion in `regression-check.ts`. Run before every dispatch to catch silent regressions.

**Evidence-backed finding**:
A claim of skill failure that includes the verbatim TypeScript or runtime error, the code that produced it, and (where the agent wrote a workaround) the error that justified the workaround. Required by the testing skill's strict rules; finding-shaped reports without evidence are dropped.
_Avoid_: "finding" alone

**Fabricated finding**:
A claim of skill failure with no pasted error, or with an error that was caused by the agent's own workaround rather than the documented form. Discarded.

## Relationships

- A **round** contains one or more **agent runs**.
- An **agent run** produces zero or more cell updates in the coverage matrix, one per **feature** it exercised.
- An **agent run** has exactly one overall **outcome** in the chronological log, but per-feature **outcomes** in the matrix may differ (an agent can be clean on five features and report a bug on a sixth).
- Every **bug** that gets fixed should produce a new **pinned regression** entry.
- The coverage matrix tracks **skill coverage** of **features**; it does not track library coverage.

## Example dialogue

> **Dev:** "Should I dispatch a new round to test the asof fix?"
> **Domain expert:** "Yes — that feature is currently a `needs re-confirmation` because the fix landed but no agent has hit it cleanly since. One clean run flips it to `covered`."
> **Dev:** "What if the agent reports a different bug while it's there?"
> **Domain expert:** "Then it's a new evidence-backed finding. Verify before believing it — about half are fabricated. If it holds up, fix it and add a pinned regression."

## Flagged ambiguities

- "test" was used to mean both **agent run** (a probe of the target skill) and unit/integration test (the regular `*.test.ts` suite). Resolved: **agent runs** for the former, "tests" for the latter.
- "skill" was ambiguous between **target skill** and **testing skill** — resolved by naming them separately.
