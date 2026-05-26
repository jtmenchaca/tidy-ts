# Proposing changes

State proposed changes in a fixed format. Wait for approval. Apply with track changes. Do not move on until the user ratifies the block.

## Proposal format

For each chunk being audited, show:

1. **Element ID and word count** of the current chunk.
2. **The current text** (verbatim).
3. **Beat list** with axis 1 / 2 / 3 status per beat (see `beat-check.md`).
4. **Per-phrase findings** (one line per phrase that has an issue).
5. **Reader questions** (at least three) and whether each indicates a change.
6. **Proposed rewrite** (verbatim, with the new word count and the delta).
7. **A question to the user**: "Apply?"

Wait for "yes" / "y" / explicit approval before editing.

## Show the work

When proposing a rewrite, name what changed and why. A change without a rationale gets undone on the next pass.

Example:

> "Changes:
> - Cut sentence 2 (axis 1 padding — restates sentence 1).
> - 'detected' → 'caught' (style rule: canonical verb is 'caught').
> - Dropped 'in a survey of 14 sites' (source-scaffolding rule — citation already covers).
> - Word count: 87 → 71 (saves 16)."

The user can then ratify specific changes or push back on specific ones. A block-rewrite without rationale gives the user no purchase.

## One chunk at a time

Do not batch multiple chunks into one proposal. Each chunk is its own approval gate.

Reasons:
- The user may have a reaction to chunk 1 that changes how chunk 2 should be audited.
- Batched edits make it hard to identify which proposal caused which issue.
- The forcing function of approval per chunk keeps the audit honest. A user who approves chunk 1 has bought into the framing of that chunk.

If multiple chunks share a theme (e.g., five paragraphs that all need the same term renamed), surface the theme up-front and then audit each chunk one at a time. Do not pre-apply the renaming across all chunks before the first one is approved.

## When the user says "apply"

Apply with track changes enabled if the document supports it (docx, pdf with annotations, anything reviewable). The user wants to see what changed.

If the document does not support track changes, apply directly and confirm the diff.

After applying, do not move to the next chunk silently. Confirm what was applied ("Applied. Moving to next paragraph.") so the user has the chance to interject.

## When the user says no

If the user rejects a proposal, do not argue. Ask one clarifying question to understand the rejection, then move on.

Common reasons for rejection:
- The proposed rewrite changed meaning the user did not want changed.
- The proposed rewrite introduced a phrase the user dislikes ("partial output", "structural correctness").
- The proposed rewrite is over-engineered.
- The user has more context than the audit ("this paragraph is going to be cited in a follow-up paper").

In each case, the right move is to accept the rejection, ask if there is a different fix the user would accept, and only then re-propose. Or move on if the chunk is fine.

## When the user counter-proposes

The user may suggest a different fix. Apply theirs. The audit is a collaboration; the user has authority over the prose. The audit's job is to surface issues, not to dictate solutions.

When the user's counter-proposal changes the prose in a way that affects later chunks (term changed, structure rearranged, beat added), note the change for the consistency pass.

## Track follow-ups

If a chunk has multiple findings and the user only approves some, record the unaddressed findings as follow-ups. Surface them at the end of the section so they don't get forgotten.

Example follow-up note: "FOLLOW-UP: paragraph 4F06A0FA mentions 'LLM-generated analysis code' without grounding what kind of code or how generated; deferred for separate discussion."
