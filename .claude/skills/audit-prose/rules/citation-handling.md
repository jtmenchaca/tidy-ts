# Citation handling

This file is the **in-prose** citation guide — how citations should *read* in the body text. For the end-to-end references workflow (how references are tracked, formatted, verified, and emitted, including DOI handling, the verification buckets, and tooling), see the canonical "Preferred references approach" section in [verify-citations/SKILL.md](../../verify-citations/SKILL.md#preferred-references-approach). The two are complementary: this file owns prose style, verify-citations owns workflow.

When a sentence cites a study, the beat is the finding the study supports. The citation is the contract that lets the reader verify the source. The prose does not have to re-narrate the source's design.

## Source scaffolding

Methodological detail about the source — sample size, geography, "across N sites", "in a survey of group X" — is scaffolding that contextualizes the source but does not carry the beat.

Audit each cited claim:

- Does this methodological detail change what the reader takes from the sentence?
- If the same beat lands without "in a survey across 14 US sites", remove the phrase and let the citation do that work.

Keep source-scaffolding only when the design feature itself is the point — e.g. "an independent research group", "predates the framework", "manually labeled by domain experts", "third-party-curated". These design features matter to the argument; they earn the words.

## Author name-dropping

Naming the cited author in body prose is the same anti-pattern as source scaffolding: the citation already attributes; the name is decorative.

- "the Kahn et al. harmonized data quality framework[Kahn 2016]" → "the harmonized data quality framework[Kahn 2016]"
- "as Wright et al. showed[Wright 2016], CDSS malfunctions are common" → "CDSS malfunctions are common[Wright 2016]"
- "Ahmed et al.'s benchmark[Ahmed 2023]" → "the benchmark[Ahmed 2023]" (when the benchmark is the only one in play and the reader does not need to disambiguate by author)

Default to cutting the author name. Exceptions are rare: when two cited groups' work is being compared head-to-head in the same sentence and the reader needs to disambiguate, or when the author's identity is itself the load-bearing fact (e.g., a historical claim about who first proposed something). "The reader might find it interesting to know the author" is not an exception.

This rule applies even to widely cited frameworks. The Kahn framework is well-known in the field, but the citation handles that; "the harmonized data quality framework" is enough.

If the audit finds author-name vestiges from prior edits, cut them as the prose is rewritten. Do not preserve them out of inertia.

## Hedged quantifiers

"Nearly all", "most", "many", "a substantial fraction" are usually placeholders for a specific statistic the citation contains.

- If you have the statistic, use it. "93% of CMIO respondents" is concrete and verifiable. "Nearly all CMIOs" is a hedge.
- If the citation does not narrow enough to give one statistic, drop the quantifier rather than hedge. "Nearly all" with no source statistic reads as filler.

## Fetch before edit

When you encounter a citation that contains a hedged quantifier, a vague phrase, or a claim you can't verify from memory, and a PubMed/PMC tool is available in the workflow, **pull the article and read the relevant section before writing the audit verdict**.

The audit's job is to know what the cited paper actually says so the prose can either use the right specific number or drop the unhedged claim. Working from "I think this is what the paper says" produces hedges, which become source scaffolding, which become bloat. Fetch first, edit second.

The fetch step is fast — minutes, not hours. Skipping it produces edits the next audit will have to redo.

## Verify what the source actually says

Pull the article. Read the abstract first. If the abstract gives the statistic, use it. If not, fetch the full text and read the Methods and Results sections.

Common findings during a fetch:

- **The cited paper does not contain the claim.** The author may have misremembered which paper had the statistic. Replace the citation with the correct paper, or replace the claim with one the cited paper actually supports.
- **The cited paper has a different statistic than the prose says.** Use the actual statistic.
- **The prose conflates two findings.** One paper sometimes contains multiple findings; the prose may have combined them. Separate them and cite each finding correctly.
- **The prose overstates the source's framing.** The paper may say "93% of CMIO respondents reported at least one CDSS malfunction (from any cause)" while the prose says "nearly all reported alert malfunctions caused by data changes." The "from any cause" qualifier was dropped. Restore it.

## When to broaden the citation search

The cited papers in a manuscript reflect what the author had at hand. They are not always the best papers for the claim. If a fetch reveals the cited paper does not support the claim, consider:

1. Whether the claim itself is right and a different paper supports it (search PubMed / Google Scholar / web search).
2. Whether the claim is wrong and the manuscript needs a different example.

Either way, do not paper over a citation gap with hedged language. Get the source right.

## Citation style

If the document uses numeric citations ([1], [1,2], [1-3,4]), maintain that style. If the document uses author-year placeholders during drafting, note in the audit findings that they will need conversion before submission.

When adding a new citation, append it to the References list in the document's style. Do not invent reference numbers; use a placeholder like `[NEW1]` and let the citation conversion pass renumber.
