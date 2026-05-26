# Reader questions

The reader question step is the one that catches what the phrase audit and the beat check miss. Treat it as the central check, not a bolt-on.

## Generate at least three per chunk

After the phrase audit and beat check, generate at least three questions a target reader would actually ask. Each question must be a real source of confusion or skepticism.

Soft questions — "What is Tidy-TS?" when the document opens with a definition — are not allowed. The questions are for things the reader genuinely would not know or would push back on.

## What makes a question real

A real reader question reflects a specific gap, ambiguity, or stretch in the text. Examples:

- **Concept reachability gap.** "What does 'partial output' mean concretely? Is that a half-written file, a row committed but not the next, a NaN in a column?"
- **Ambiguous antecedent.** "When sentence 2 says 'the system,' does it mean the EHR, the framework, or the survey instrument?"
- **Hedged claim.** "'Nearly all' — what's the actual number? Does that include the data-changes finding or all CDSS malfunctions?"
- **Methodological gap.** "Were the 14 sites randomly selected or convenience-sampled? The phrasing implies the former but doesn't say."
- **Claim-evidence mismatch.** "The paragraph says X causes Y, but the citation shows a correlation, not causation."
- **Boundary uncertainty.** "Does this finding apply to outpatient encounters, or just inpatient?"

A real reader question makes the writer have to either improve the prose or defend the existing text with evidence.

## Default to changing

For each question, decide whether a change is indicated. **The default is yes.** The burden is on keeping the text as-is, not on changing it.

If a reader would be confused, fix the text. Do not dismiss a question with "the context grounds it" or "this was explained earlier" — if the line does not stand on its own, it needs work.

## Never dismiss

The most common audit failure is treating a reader question as a softball and waving past it. Symptoms:

- "Acceptable for an Abstract" (without saying why).
- "The next paragraph addresses this" (without naming the next paragraph).
- "A clinical reviewer will recognize this" (without evidence that they will).
- "OK in context" (no actual context check).

When you write any of these phrases in an audit verdict, stop. Reread the question. Decide:

- Does the line stand on its own? If yes, say what makes it stand. Cite the specific earlier paragraph or term that grounds it. If you can't cite it, the line does not stand.
- Does the line not stand on its own? Fix it.

## How to phrase the question

State the question as the reader would think it, not as a critique. "What does 'partial output' mean concretely?" not "Partial output is jargon and needs grounding."

The first form forces you to think from inside the reader's head. The second form lets you stay outside, where you already know what the writer meant.

## When the answer to a question is "go fetch"

If a reader question is "what's the actual statistic from this citation?", the answer is to fetch the article. Do not propose a rewrite that hedges. See `citation-handling.md`.

If a reader question is "what does the framework actually call this column?", the answer is to check the source code. Do not propose a rewrite that paraphrases.

## When to push the question back to the user

Some reader questions can only be answered by the user (the author or document owner). Examples:

- "Why was this study site chosen?"
- "How many users does the deployment have?"
- "What's the actual cohort size?"

When a reader question requires user input, ask. Do not invent a plausible answer to make the audit move faster.

## Reader questions reveal coverage gaps

Sometimes a reader question is so foundational that the answer reveals a missing entire claim. "What about Contribution B?" is a reader question that exposed the JAMIA Abstract gap. The fix was not to rewrite a phrase; it was to add a sentence covering B.

When a reader question can only be answered by adding a whole new beat, mark it as a coverage gap and revisit `coverage-scan.md`.
