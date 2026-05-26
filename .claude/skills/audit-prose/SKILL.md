---
name: audit-prose
description: Phrase-by-phrase audit of written prose against a defined reader, with explicit reader-question generation and strict avoidance of marketing constructions. Use when the user wants to tighten the writing in a document (manuscript, blog post, PRD, report) for clarity and to remove style drift.
---

## When to use

Use this skill whenever the user asks you to tighten, audit, sharpen, or revise a written document — a manuscript, blog post, PRD, report, or anything else where prose quality matters and the reader is named.

Do **not** use this skill to:
- Rewrite the substantive argument of a document.
- Add new contributions.
- Change the underlying methodology.
- Dispute a finding.

The audit serves prose, structure, and consistency. Substantive issues surface as findings for the user to address; they do not silently get rewritten under the cover of an audit.

## The phases of an audit

An audit pass walks the document in a fixed order. Skipping a phase produces local wins that leave higher-altitude problems unfixed. The phases are:

| Phase | What it does | Read |
|---|---|---|
| 1. Pre-flight | Identify the target reader, read the full document, find CONTEXT.md, run a word count, confirm scope | [rules/pre-flight.md](rules/pre-flight.md) |
| 2. Coverage scan | Verify every contribution is reachable from each summary-level section (Abstract, Conclusion, cover letter) | [rules/coverage-scan.md](rules/coverage-scan.md) |
| 3. Budget | If the document has a word limit, assign per-section budgets so cuts have a concrete target | [rules/budget.md](rules/budget.md) |
| 4. Phrase pass | Walk the document two sentences at a time. For each chunk, run beat-check, phrase audit, reader questions, citation handling | [rules/phrase-pass.md](rules/phrase-pass.md) |
| 5. Propose changes | Verbatim rewrite, show the work, wait for approval, apply with track changes | [rules/proposing-changes.md](rules/proposing-changes.md) |
| 6. Post-edit | Re-read the subsection, check cross-document consistency, update tables/figures/captions, re-measure word count | [rules/post-edit.md](rules/post-edit.md) |
| 7. Repeat | Move to the next chunk. After a section ends, return to phase 4 for the next section | — |

Phases 1–3 run once at the start of a pass. Phases 4–6 run per chunk and loop. Phase 7 is the loop boundary.

## Cardinal rules (the most common audit failures)

1. **Treat every phrase as a candidate for improvement, not a candidate for "wrong enough to flag."** The bar is "would the next draft want this changed?", not "is this broken?" See [rules/posture.md](rules/posture.md).
2. **Never dismiss a reader question with "explained earlier" or "the context grounds it"** unless you can cite the exact location. If the line does not stand on its own, fix it. See [rules/reader-questions.md](rules/reader-questions.md).
3. **A beat has three axes, not one.** Distinct work, concept reachability, concrete grounding. A beat that fails axes 2 or 3 is not a candidate for cutting; it is a candidate for expanding or anchoring. See [rules/beat-check.md](rules/beat-check.md).
4. **Fetch citations before editing.** If a sentence cites a study and contains a hedged quantifier or unverifiable claim, pull the article first. Working from memory produces hedges. See [rules/citation-handling.md](rules/citation-handling.md).
5. **Propose one chunk at a time and wait for approval.** Do not batch edits. The user wants to ratify each block, and a counter-proposal on chunk 1 changes how chunk 2 should be audited. See [rules/proposing-changes.md](rules/proposing-changes.md).
6. **After applying a change, run the post-edit checks.** Re-read the subsection, find every other place the changed term appears, and verify the section's word count against the budget. Tables and figure captions go out of sync most often. See [rules/post-edit.md](rules/post-edit.md).
7. **Audit your own audit.** After proposing a rewrite, re-read it as if you were auditing it for the first time. Catch the issues your rewrite introduced before the user does. See [rules/posture.md](rules/posture.md).

## Default style rules

A long list of hard tripwires lives in [rules/style.md](rules/style.md). The most common offenders:

- No em-dashes.
- No semicolons.
- No colons used to introduce an elaboration (colons before lists are fine).
- No "It's not X. It's Y" or "Not X, but Y" constructions.
- No filler openers ("Several key advantages...", "This work addresses...", "In conclusion...").
- No empty intensifiers ("comprehensive", "robust", "powerful", "novel").
- No hedged quantifiers ("nearly all", "most", "many") when a specific statistic is available.
- No source scaffolding ("in a survey across 14 sites") — the citation covers that.
- No author name-dropping ("the Kahn et al. framework") — the citation already attributes; exceptions are rare.
- No victory-lap closers ("which in this evaluation were also the most consequential").
- No metaphor-only phrases for technical concepts ("layer of detection", "under the hood").
- No triplet-by-example padding (whether in one sentence or stacked across sentences).

The full list, with rationale and exceptions, is in [rules/style.md](rules/style.md).

## Rule files (where to look for what)

| File | What's in it |
|---|---|
| [rules/pre-flight.md](rules/pre-flight.md) | Identify the reader, read the full document, locate CONTEXT.md, run a word count, confirm scope |
| [rules/coverage-scan.md](rules/coverage-scan.md) | Verify every contribution is reachable from every summary-level entry point before phrase work begins |
| [rules/budget.md](rules/budget.md) | Word-count targets, per-section budgets, how to use a budget during phrase work, what to do when over |
| [rules/style.md](rules/style.md) | Hard tripwires: punctuation, filler words, structural patterns, voice and substance |
| [rules/beat-check.md](rules/beat-check.md) | The three axes (distinct work / concept reachability / concrete grounding); when triplets are justified |
| [rules/citation-handling.md](rules/citation-handling.md) | Source scaffolding, hedged quantifiers, fetch-before-edit workflow |
| [rules/phrase-pass.md](rules/phrase-pass.md) | The per-chunk audit procedure: two sentences at a time, beat-check, phrase audit, reader questions |
| [rules/reader-questions.md](rules/reader-questions.md) | How to generate them, default-to-changing, never-dismiss-without-citing-location |
| [rules/proposing-changes.md](rules/proposing-changes.md) | Proposal format, one chunk at a time, when the user counter-proposes |
| [rules/post-edit.md](rules/post-edit.md) | Re-read the subsection, cross-document consistency, tables/figures/captions, word count |
| [rules/posture.md](rules/posture.md) | An audit is a pass, not a sanity check; the wave-past trap; audit your own audit; stay in scope |

## What this skill expects from the document

For best results, the document should have:

- **A defined reader.** If the user has not specified one, the skill asks.
- **A CONTEXT.md** (or equivalent project glossary) recording terminology, style commitments, and recorded decisions. If none exists and the document is large, the skill recommends running `/grill-with-docs` first.
- **A way to measure word count.** The word-mcp `count_words` tool is the canonical option for `.docx`; equivalents exist for other formats.
- **A way to propose tracked edits.** The word-mcp `edit_docx` tool with `track_changes: true` is the canonical option for `.docx`.

If any of these are missing, the audit can still run but loses some of the forcing function. Address them up front if possible.
