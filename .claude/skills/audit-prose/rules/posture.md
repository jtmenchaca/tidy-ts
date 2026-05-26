# Posture

How to approach the audit. These are habits, not rules — but the rules don't hold without them.

## An audit is a pass, not a sanity check

Treat every phrase as a candidate for improvement rather than scanning for things "wrong enough" to flag.

The bar is **not** "is this sentence broken?"

The bar **is** "would a careful reader of the next draft want this changed?"

If a phrase has a real issue — a doublet, a wordy modifier, grammatical ambiguity, restatement, a vague verb like "did", an unnecessary noun phrase — name it and propose a fix even if the issue is small. Default to proposing a change. The audit only finds the issues that get named.

## The "wave past" trap

When you are tempted to mark a phrase or beat as "OK, moving on", **stop and re-read it.**

Often the phrase IS OK. But sometimes the impulse to wave past is hiding a real problem. Symptoms of waving past:

- "Acceptable for an Abstract."
- "The next paragraph addresses this."
- "A reviewer who knows the term will be fine."
- "OK in context."
- "Slightly clunky but readable."

Each of these phrases should trigger a second look. Ask: is this phrase the way the next draft of the document would have it? If not, propose the change.

If after a second look the phrase really is OK, say what makes it OK with concrete reference. "Acceptable because the term is defined in element XYZ, paragraph 2" is a real defense. "Acceptable" by itself is waving past.

## Never dismiss a reader question

A reader question is the audit's most powerful tool. Treating one as a softball — saying "the context grounds it" or "this is explained earlier" without checking — is the most common audit failure.

If the line does not stand on its own, fix it. Do not appeal to context that the reader has to assemble themselves.

When you do appeal to context, name the exact location. "The Background paragraph 7C270251 introduced this term plainly" is a real defense. "Established earlier" is not.

## Never characterize something incorrectly to make a sentence flow

If "performs" is the wrong verb, do not use it because you already used "catches" three times. Find a different sentence structure. Reach for a synonym only when the synonym is also accurate.

A precise wrong word is worse than a repeated right word.

## Never add filler or marketing language to soften a claim

If a claim is strong, state it. If a claim is weak, find evidence or remove it.

Softening language ("It is important to note that...", "We believe that...", "This may suggest...") almost always reads as defensive hedging. The reader notices.

Either commit to the claim or remove it.

## Never restate the same point in three near-synonymous clauses for rhythm

Even when it sounds good. Especially when it sounds good. Rhythm without information is decoration. See the triplet rule in `style.md`.

## Never edit past the current chunk without approval

The user wants to ratify each block. Batching edits removes their chance to redirect.

If you find an issue three paragraphs downstream that should also be addressed, **note it** and bring it up when the audit reaches that paragraph. Do not preemptively edit.

## Audit your own audit

After proposing a rewrite, re-read the rewrite as if you were auditing it for the first time. Did your rewrite introduce a new doublet? A new colon-for-elaboration? A new hedged quantifier? An imprecise verb?

The audit of the audit catches the rewrite issues before the user has to. This step is the difference between an audit pass and a sanity check.

## Stay in scope

The audit's scope is the prose, the structure, and the consistency of the document. It is not:

- Rewriting the substantive argument.
- Adding new contributions.
- Changing the methodology.
- Disputing the document's underlying findings.

When the audit reveals a substantive issue — a citation that does not support the claim, a contradiction between sections, a missing entire beat — surface it as a finding for the user to address. Do not silently rewrite it under the cover of an audit.

## Hedging versus calibration

Not every soft word is padding. Some words narrow a claim to what the evidence actually supports — and removing them inflates the claim to something stronger than the author meant.

**Padding hedges (remove):** "widely reported," "It is important to note that," "We believe that," "This may suggest" — these add framing without adding information. They are defensive language for claims the author is willing to make plainly.

**Calibrating qualifiers (preserve):** "may," "can," "approximately," "in some cases," "opportunities for," "potentially" — these are doing semantic work. They distinguish "this happens" from "this can happen" or "this happens in 15% of cases." Cutting them inflates a probabilistic claim into a deterministic one, or an enabling condition into a guaranteeing one.

Before cutting any softener, ask: *what claim am I now making, and is the author willing to defend it?* If the answer is "the cut shifts 'enables X' to 'causes X' and the author would not say that," restore the softener.

When in doubt, ask the user. A short check ("I'm considering cutting 'may' here — is the claim that this always happens, or that it can?") is cheaper than a rewrite that misstates the author's claim and has to be re-proposed.

## When the user pushes back

Listen carefully. The user has more context than the audit. Common reasons a proposed change should not apply:

- The change loses a load-bearing nuance the user wanted to preserve.
- The change introduces a phrase the user dislikes for reasons not yet captured in CONTEXT.md.
- The change rewrites in a direction the user did not ask for.

When pushback comes, take the user at their word. Ask one clarifying question if needed. Update CONTEXT.md if the pushback reveals a new style commitment.

Do not argue. The audit serves the document and the user, not its own logic.
