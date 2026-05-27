# Resolve

For each citation extracted in phase 1, find the real paper. Three tiers, in order. Stop at the first tier that produces an unambiguous result.

## Tier 1 — DOI lookup

If the reference list entry has a DOI:

```
mcp__pmc-fetch-mcp__convert_ids(ids="<doi>,<doi>,...")
```

Batch up to ~20 DOIs in one call. Returns PMID/PMCID for ones in PMC; others return `errmsg: "Identifier not found in PMC"`.

**Important:** "Not found in PMC" does not mean the paper isn't real or isn't on PubMed — only that it isn't in the open-access subset. Many real, indexed papers (especially older or non-OA ones) return this error. Fall through to Tier 2 before assuming the citation is bad.

## Tier 2 — PubMed title/author search

If the DOI didn't resolve, or there is no DOI, search PubMed:

```
mcp__pmc-fetch-mcp__search_pubmed(query="<keywords>", limit=5)
```

Build the query from **first author surname + 2–3 distinctive title words + year**. Examples:

- `Baldridge retracted articles scoping review 2024` → finds Baldridge 2024.
- `Trisovic large-scale study research code execution` → finds Trisovic 2022.

**Failure modes to watch for:**

- **Too narrow**: a verbatim title string often returns zero results because of capitalization, punctuation, or the journal's title differing slightly from the citation. If a search returns zero results, broaden it (drop a keyword, drop the year).
- **Too broad**: searches with only author surname + year return many false positives. If you get many results and none match the journal in the citation, narrow with another distinctive word.
- **One hit ≠ verified**: a single search result is a candidate. Verify by fetching the abstract (phase 3) and checking that the title/authors match the citation.

## Tier 3 — Web search

If PubMed produces nothing after 2–3 reasonable query reformulations, fall back to web search:

```
WebSearch(query="<author> <year> <title fragment> <journal>")
```

Web search reaches:
- arXiv preprints (Ahmed 2023 is here).
- Non-PubMed journals (Lancet Digital Health pre-indexing, some Springer Nature venues, MIT Press, etc.).
- Conference proceedings (ICSE, MSR, ESEM, NeurIPS — almost never in PubMed).
- Books and book chapters.

Once you have a candidate from web search, **try PubMed again** with the corrected title and authors. Many papers that looked unfindable in Tier 2 are actually in PubMed; the initial query just missed them — too-narrow keywords are the usual cause.

## When resolution fails

If all three tiers fail to produce a candidate paper, mark the citation `unfindable` and **stop**. Do not:

- Invent a PMID, DOI, or URL.
- Suggest "this is probably the Smith paper about X" without a verified hit.
- Treat a partial title match as resolution.

Surface the unfindable citation in the final report so the user can resolve it.

## Inline-only citations (cited but not in the ref list)

When a citation appears inline (`[Smith 2023]`) but has no matching reference-list entry, run resolution against the inline text directly. This is common when:

- The author forgot to add the entry.
- The cite is a stub waiting for a final reference.
- The cite uses a non-standard token the author intended to clean up.

A successful resolution here still produces a report row, but flag the missing ref-list entry as a separate style finding (see [rules/style-audit.md](style-audit.md)).

## Parallelism

Resolution is the slowest phase. Batch where possible:

- One `convert_ids` call for all DOIs at once.
- Parallel `search_pubmed` calls for the citations that fell through.
- Parallel `WebSearch` calls for the ones that fell through again.

Do not serialize unless dependencies force you to.

## Hard rules

1. **A title match is not a verification.** Always fetch the abstract in phase 3 before claiming the citation is real.
2. **No inventing.** Unfindable means unfindable. Surface it.
3. **One hit needs the same verification as ten hits.** Confidence comes from the abstract content matching, not from the number of search results.
