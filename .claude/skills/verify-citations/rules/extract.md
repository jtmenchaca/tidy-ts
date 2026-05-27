# Extract

Walk the document and produce a table of `(claim, citation-token)` pairs. Also produce a separate list of the reference-list entries.

## What to pull

For each inline citation in the body text:

- **Citation token** — exactly as it appears (`[Author Year]`, `[N]`, `(Smith 2023)`, `^4`, etc.).
- **Surrounding claim** — the sentence (or clause) the citation is attached to. If the citation supports a specific number or finding (e.g. "42% of articles..."), capture the number too.
- **Location** — element ID, page, or section heading. Lets the report point to the spot.

For each reference-list entry:

- **Position in list** (if numbered) or **author-year token** (if not).
- **Full text** — authors, title, journal, year, volume, pages, DOI/PMID if present.

## Mixed citation styles

Some documents mix numeric (`[4][6][7]`) and author-year (`[Smith 2023]`) styles. This is itself a problem to flag, but for extraction purposes treat them as separate populations:

- **Numeric tokens** must map to a position in the reference list. Verify the mapping exists; if `[20]` is cited but the list has 18 entries, that's an extraction-time finding.
- **Author-year tokens** must match a list entry by author and year. If `[Smith 2023]` is cited and the list has no Smith 2023, that's an extraction-time finding.

## What counts as a "claim"

The claim is what the manuscript is asserting *using* the citation. Three patterns:

1. **Numeric claim** — "42% of articles..." [cite]. The number is the claim. The fit-check has to find that number (or its equivalent) in the source.
2. **Finding claim** — "X is associated with Y" [cite]. The claim is the relationship.
3. **Background claim** — "EHR data quality has been studied extensively" [cite]. The claim is just that the topic exists in the literature. Lower bar for the fit-check.

Mark each claim with its type. Numeric claims need the tightest verification; background claims need the loosest.

## What does NOT count as a citation to verify

- Quoted material from the user's own prior work (self-citation is still verifiable, but mark it).
- URLs to software packages or repositories — those are verified by visiting the URL, not by fetching an abstract.
- "Personal communication" notes.
- Citations to books or chapters without an indexed equivalent — flag these for the user to handle manually.

## Output of this phase

A table the next phase consumes:

| ID | Token | Claim | Claim type | Location | List entry (if any) |
|---|---|---|---|---|---|
| C01 | [Baldridge 2024] | "42% described problems generating or acquiring data" | numeric | §Background ¶3 | "Baldridge AS, ..., 2024..." |
| C02 | [20] | "static type checking detects ~15% of bugs" | numeric | §Background ¶6 | (missing) |

And a second table of orphan / unreferenced list entries (entries never cited inline).

## Hard rule

If the document has no clear citation tokens at all — just author names mentioned in prose — stop and ask the user how citations are tracked. Do not guess. The extract phase is the place to surface "I cannot find citations in this document" before wasting time on resolution.
