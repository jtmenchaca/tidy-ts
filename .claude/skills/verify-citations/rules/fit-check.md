# Fit-check

For each cited claim, match it against the fetched abstract (or full text). Bucket the result into one of four categories.

## The four buckets

### 1. Exact match

The abstract contains the number, phrase, or finding the manuscript cites, verbatim or as a clear paraphrase that preserves the specific value.

**Required evidence:** paste the matching phrase from the abstract in the report. If you cannot paste it, this is not an exact match. Downgrade.

Example:
- Manuscript: "Baldridge et al. found 42% of retractions described problems generating or acquiring data."
- Abstract: "Nearly half of retraction notices (42%) described problems generating or acquiring data, and 28% described problems with preparing or analyzing data."
- **Bucket: exact match.** Quote the abstract phrase in the report.

### 2. Supports

The paper's findings support the manuscript's claim, but the manuscript's gloss is broader, narrower, or rephrased. The reader of the paper would agree the citation is fair.

Example:
- Manuscript: "Research code commonly fails to execute reproducibly [Trisovic 2022]."
- Abstract: Trisovic reports 74% of R files failed in initial execution.
- **Bucket: supports.** The claim is fair; the specific number isn't quoted in the manuscript, but the paper backs it.

### 3. Loose fit

The cited paper is adjacent to the manuscript's claim but does not actually demonstrate what the manuscript implies. The reader of the paper would say "that's not really what we showed."

Examples:
- Manuscript cites Trisovic 2022 to support an LLM-code-generation claim. Trisovic studied human-written R code. **Loose fit.**
- Manuscript cites Sauer 2022 for "data handling and transformation during analysis are distinct error sources." Sauer identifies six EHR pitfalls (sample selection bias, imprecise variable definitions, etc.) that don't include data-handling/transformation specifically. **Loose fit.**

Loose-fit citations are not necessarily wrong — they may be defensible as background — but they are the most common reviewer flag, and the user should know.

### 4. Wrong paper

The fetched paper has nothing to do with the manuscript's claim. The resolution phase picked the wrong paper, or the citation has a fundamental error (wrong author, wrong year).

When this happens, return to phase 2 and re-resolve. If re-resolution can't find a better match, mark as `unfindable` with a note that the original resolution looked plausible but didn't fit.

## How to bucket

For each claim:

1. Restate the claim in one short sentence.
2. Find the corresponding statement in the abstract (or full text). Read it in full.
3. Ask: does the source phrase, on its own, support what the manuscript says?
   - **Yes, with the same specifics** → exact match.
   - **Yes, in spirit** → supports.
   - **Sort of, but the framing is off** → loose fit.
   - **No** → wrong paper.

The instinct to round up is strong (a paper that "kind of" supports a claim feels like a "support" bucket). Resist this. If the abstract doesn't actually demonstrate the cited point, it's a loose fit, and the user needs to know.

## Numeric claims need verbatim matches

If the manuscript cites a specific number (42%, 164 bugs, 3300 checks), that number must appear in the source. "Verbatim or near-verbatim" — `one-fifth` vs `20%` is fine; `~20%` vs `42%` is not.

If the number doesn't appear in the abstract, either:
- Fetch the full text and look for it there.
- Downgrade the bucket to "supports" or "loose fit" with a note that the specific number was not located.

Never assume a number is in the paper because it would be reasonable for it to be there.

## When the source is stronger than the manuscript's claim

Occasionally the abstract is more specific than the manuscript's gloss. Manuscript: "hundreds of biomedical data analysis tasks." Abstract: "293 coding tasks across seven biomedical research areas."

The citation is fair, but the manuscript is softer than it could be. Flag this as a note in the report ("source is more specific than the claim; consider tightening to '293 coding tasks across seven biomedical research areas'"). Do not bucket as loose fit — the claim is supported.

## Output

Each fit-check produces:

| ID | Token | Claim | Bucket | Evidence (verbatim) | Notes |
|---|---|---|---|---|---|
| C01 | [Baldridge 2024] | "42% described data acquisition problems" | exact | "Nearly half of retraction notices (42%) described problems generating or acquiring data" | — |
| C02 | [Trisovic 2022] | "LLM code fails the same way" | loose fit | "74% of R files failed to complete without error" | Trisovic studied human-written R code, not LLM code. Consider re-citing or rewording. |
