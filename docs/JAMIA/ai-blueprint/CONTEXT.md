# JAMIA AI Blueprint Coverage

Glossary and rules for the exercise that tests `@tidy-ts/ai`'s blueprint formalism against every issue of JAMIA published in calendar year 2025. The argument the exercise is set up to support: *here is a way to represent AI workflows in research that is reproducible; here is a package that runs those blueprints; here is how it covers a full year of AI work in JAMIA*. The unit of work is one published paper; the unit of output is a blueprint and a coverage verdict per paper, rolled up into a gap inventory per month-batch. The full corpus is **all twelve 2025 month-batches** (`papers/2025-01/` through `papers/2025-12/`); the headline is the rolled-up coverage across that year.

For the AI-package terms themselves (Topology, Node, Edge, ai.evaluate, ai.embed, Provenance, etc.), see [`packages/ai/CONTEXT.md`](../../../packages/ai/CONTEXT.md). This glossary does not redefine those — it adds the *evaluation-side* vocabulary that the package glossary does not own.

## Language

### Scope

**In-scope AI workflow**:
A published evaluation whose intervention or comparator is an LLM, a multimodal model, or a transformer (including transformer encoders used for embeddings or classification, even when a non-transformer classifier head is downstream). Marginal cases — a transformer encoder feeding a classical classifier, a pipeline with a single transformer step among rule-based stages — are included so the coverage exercise can report on them rather than silently drop them.
_Avoid_: "AI paper" (every JAMIA paper mentions AI), "ML paper" (too broad — sklearn-only papers are out).

**Out of scope**:
Editorials, policy/regulation perspectives, correction notices, papers whose only AI content is a literature reference, and papers whose entire model surface is classical ML (SVM, RF, logistic regression, decision tree) with no transformer step anywhere in the workflow.

**Corpus window**:
Every issue of JAMIA published in calendar year 2025 — twelve month-batches in total, `papers/2025-01/` through `papers/2025-12/`. The exercise is not "complete" until all twelve are processed. Each month-batch is fetched into `papers/<YYYY-MM>/` (one folder per paper, named by DOI or PMC URL slug, containing the `.md` body) and run through the blueprint pass before moving on. The end-of-year rollup at `coverage.md` aggregates all twelve and is the headline artifact of the exercise.

### Verdicts

The exercise assigns one verdict per in-scope paper. Verdicts are independent of whether the paper is "good" — they describe only what the blueprint exercise was able to do.

**Blueprintable**:
The paper discloses enough of the workflow (model identity, prompt or task framing, input/output shape, control flow between steps if any) that the workflow can be authored as a `@tidy-ts/ai` Topology today without inventing primitives. The blueprint compiles in the author's head; nothing required is missing from `@tidy-ts/ai`.

**Package gap**:
The paper is fully reproducible from its own text, but `@tidy-ts/ai` cannot express the workflow without a new primitive or an extension to an existing one. Each Package-gap verdict carries one or more **Gap entries** (defined below) explaining what the package would need.

**Underspecified**:
The paper describes the *outcome* of running an AI workflow but does not disclose enough of the workflow's internals (model identity, prompt template, fine-tune procedure, decision logic between steps) to write the blueprint. The blueprint we *could* write is a black-box single-node sketch with `???` placeholders. This is itself a finding — it says the publication is not reproducible at the level a citable blueprint would require.
_Avoid_: "irreproducible", "incomplete", "thin" — those carry quality judgements the exercise does not make.

**Mixed**:
Part of the workflow blueprints cleanly, part is Underspecified, and/or part exposes a Package gap. The verdict carries one or more sub-verdicts attached to the segments.

### Findings on the package

**Gap entry**:
A structured record of one place where `@tidy-ts/ai` cannot express a workflow that an in-scope paper described concretely. Fields: which paper exposed it, the workflow capability missing in plain English, the recommended primitive proposal (factory name, fields, where it slots in the existing Node/tool/edge taxonomy), and the verdict of whether the proposal is in-scope for `@tidy-ts/ai` (vs. "out-of-scope by design" — to be decided by the package owner, not the exercise).
_Avoid_: "missing feature", "limitation", "TODO".

**Primitive proposal**:
The concrete design sketch attached to a Gap entry. Must be specific enough that the package owner can decide for/against without re-reading the source paper. Not an ADR — proposals graduate to ADRs only if the package owner accepts them.

### Findings on the paper

**Disclosure gap**:
A specific field the paper omits that would have been required to write a Blueprintable verdict. Examples: "model identity (vendor proprietary)", "prompt template not published", "fine-tune hyperparameters not reported". These are reported alongside Underspecified verdicts to make the reporting actionable for future authors.
_Avoid_: "limitation" (that's the paper's own word for something else), "weakness".

### Per-paper artifact

**Blueprint sketch**:
The Topology authored against the paper. Lives inline in the gap inventory under the paper's entry. Uses `@tidy-ts/ai` factory names (`build.start`, `build.llmNode`, `build.agentNode`, `build.map`, `build.parallelMap`, `build.flow`, `build.branching`, `build.catchException`, `build.end`, etc.) and Zod schema sketches where shapes matter. Where the paper Underspecifies, the sketch uses `???` as a placeholder and the Disclosure gap is named.
_Avoid_: "diagram", "graph" (too generic), "topology" by itself (ambiguous between the package primitive and the sketch).

**Coverage verdict**:
The combination of a paper's main Verdict, its Disclosure gaps (if Underspecified), and its Gap entries (if Package gap). The line item that goes into the gap inventory.

### The output artifact

**Gap inventory**:
The Markdown report emitted per month-batch at `papers/<YYYY-MM>/gaps.md`. Contains one section per in-scope paper with its Blueprint sketch and Coverage verdict, followed by a rollup table of Gap entries with primitive proposals, and a rollup table of Disclosure gaps. The end-of-window rollup at `coverage.md` aggregates all month-batches and is the headline artifact of the exercise.
_Avoid_: "report", "audit", "review".

## Rules

### Inclusion is not a quality call
Every paper that evaluates an in-scope AI workflow is processed, regardless of whether its workflow is opaque, vendor-supplied, or methodologically thin. Underspecified is a verdict, not an exclusion criterion.

### Out-of-scope papers are listed once and forgotten
Editorials, policy pieces, classical-ML-only papers, and correction notices appear in the gap inventory under a flat "Out of scope" list at the bottom of each month section, with a one-line reason. They do not get a Blueprint sketch.

### Verdicts are blameless toward the paper authors
Underspecified is a finding about the publication record, not the authors. The Disclosure gap names the missing field; it does not editorialize.

### Gap entries always carry a primitive proposal
A Gap entry without a Primitive proposal is incomplete and goes back into the queue. The proposal must be specific enough that the package owner can vote yes/no without re-reading the paper.

### The exercise does not modify `@tidy-ts/ai`
Primitive proposals are recorded, not implemented. Implementation belongs in the package's own ADR pipeline. The blueprint exercise's product is *findings*.

## Relationships

- One **Paper** receives one **Coverage verdict**.
- A **Coverage verdict** of `Blueprintable` carries zero **Gap entries** and zero **Disclosure gaps**.
- A **Coverage verdict** of `Package gap` carries one or more **Gap entries** and zero **Disclosure gaps**.
- A **Coverage verdict** of `Underspecified` carries zero **Gap entries** and one or more **Disclosure gaps**.
- A **Coverage verdict** of `Mixed` carries one or more of either.
- A **Gap entry** must carry exactly one **Primitive proposal**.
- The **Gap inventory** is the per-month report; the end-of-window rollup is the headline coverage artifact.

## Example dialogue

> **Dev:** "The DAX scribe papers — they don't disclose the model or the prompt. Are they in scope?"
> **Domain expert:** "In scope. Verdict is `Underspecified`. The Disclosure gaps are 'vendor LLM, model not disclosed' and 'prompt template not published'. The Blueprint sketch is a single black-box node with `???` for model and prompt — that's the *finding*. Citable blueprinting needs those fields."
>
> **Dev:** "The embedding-ablation paper — every detail is there. But our package doesn't have an EmbedNode primitive. Where does it land?"
> **Domain expert:** "`Package gap`. The Gap entry says 'embeddings can only appear as the call-site verb `ai.embed`, not as a Topology Node, so an ablation across embedding models and pooling strategies cannot be authored as a Topology'. The Primitive proposal sketches `build.embedNode`. The package owner decides whether to ship it."
>
> **Dev:** "And a paper whose workflow is fully described and runs today with `LlmNode` + `AgentNode`?"
> **Domain expert:** "`Blueprintable`. Inline sketch, no gap rows. Those papers are the coverage numerator."

## Flagged ambiguities

- "Multimodal" — the exercise includes papers whose model is multimodal (text + image, text + audio). It excludes pure-vision deep-learning papers that have no transformer / text component. If a borderline paper shows up, it gets the Mixed verdict and the boundary is recorded here.
- "Transformer encoder feeding a classical classifier" — included, per the in-scope rule. The blueprint covers the encoder; the classifier head is named in the sketch but not blueprinted. If the package gains a `ModelNode` primitive later, the classifier head becomes blueprintable and the verdict can be revisited.
- "Two papers, one workflow" — the two DAX scribe papers evaluate the same deployment from different angles. They are processed as two separate Coverage verdicts (because each paper is its own publication record) but the Blueprint sketches will be identical and the Disclosure gaps will be the same — the second paper's entry cross-references the first.
