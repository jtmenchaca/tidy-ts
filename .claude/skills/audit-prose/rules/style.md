# Style rules

Hard tripwires that apply unless the user overrides them. Treat each as a tripwire — if a phrase trips it, propose a change.

## Punctuation and construction

- **No em-dashes.** Not in body prose. Acceptable inside titles or subtitles where journal convention allows.
- **No semicolons.** Use period plus new sentence.
- **No colons used to introduce an elaboration** ("X: a thing that does Y"). Colons before bulleted lists are fine. Colons in titles are fine.
- **No "It's not X. It's Y" or "Not X, but Y" constructions.** These are rhetorical poses, not arguments.

## Words and phrases to drop

- **Filler openers** ("Several key advantages...", "This work addresses...", "In conclusion...", "It is important to note..."). The reader does not need a runway.
- **Empty intensifiers** ("comprehensive", "robust", "powerful", "novel", "significant" without a measurement, "key", "critical"). Either name what you mean concretely or drop.
- **Hedged quantifiers** ("nearly all", "most", "many", "a substantial fraction") when used as placeholders for a specific statistic. Use the statistic if you have it, or drop the quantifier. See `citation-handling.md`.
- **Metaphor-only phrases for technical concepts** ("layer of detection", "under the hood", "moving parts"). Use the literal description.
- **Parenthetical jargon that introduces a new term after explaining it plainly.** Pick one. If the term is the canonical name (e.g., "compile-time error"), use it. If the plain phrase is enough, drop the jargon.
- **Marketing tone words** ("seamless", "cutting-edge", "next-generation", "revolutionary"). Body prose for a serious reader does not use these.
- **"Performs" when you mean "catches", "detects", "produces", "returns".** "Performs" is the wrong verb in most technical contexts because it does not name what is performed. Same logic for "executes", "handles", "manages" used without an object.

## Structural patterns

- **No triplet-by-example padding.** A list of three near-synonymous clauses ("no data is written, no records are changed, no alerts are sent") and three short sentences each illustrating the same point have the same problem. If three or more examples are doing the same work, keep the strongest one and cut the rest. Same logic for four, five. See `beat-check.md` for when a triplet IS justified.

- **No victory-lap closers.** A sentence that ends by restating a finding already established earlier in the document — "which in this evaluation were also the most consequential", "which is the central result of this work" — adds no information. Cut it. Watch for "also", "as well", and other rhetorical add-ons that point back at something the reader already has.

- **No source scaffolding.** When citing a study, the beat is the finding. Methodological detail about the source ("in a survey across 14 US sites") is scaffolding the citation already covers. See `citation-handling.md`.

## Voice and substance

- **Each sentence should flow logically from the prior one.** If sentence N is a non-sequitur from sentence N-1, the paragraph has a structural problem, not a phrase problem.

- **Claims should be followed by substantiation that clearly serves the claim.** Cut detail that does not. A sentence that "feels relevant" but does not advance the claim is bloat.

- **Interpret findings rather than just reporting them.** Discussion sections that read as a re-narration of Results have abandoned their job. The Discussion's beats are the interpretation, the boundary, the implication — not the data again.

- **Use the right word, not a near-synonym.** "Catches" is not "performs". "Audit" is not "guarantee". A "suite of tests" is not a "suite of datasets". Synonyms for canonical document terms create drift; pick one and use it.

## When a rule is broken on purpose

Some passages will break a rule for a real reason. A title can use a colon. A quoted source can have an em-dash. An author-chosen vocabulary may use one of the listed filler words deliberately.

When you encounter a rule break, ask: is this break load-bearing? If the rule break is doing real work the rule-conformant version cannot, leave it. If the rule break is reflex (force of habit, sounded better at the time), apply the rule.

Record load-bearing exceptions in the document's CONTEXT.md so a future audit pass does not undo them.
