# Manuscript: write the External Validation section

Status: ready-for-human

## What to build

Add an External Validation section (likely between Results and Discussion, or as a new Results subsection) to the manuscript that addresses the reviewer concern:

> "Author-designed test suite introduces bias risk. The 65 error scenarios were designed by the same team that built Tidy-TS… Independent validation — ideally by having external clinical data analysts contribute error scenarios from their own workflows — would substantially strengthen the evaluation."

The defense rests on the RPython corpus (ESEC/FSE 2023): a third-party-curated set of real-world StackOverflow bugs in R and Python data-analysis code, classified by a different research group, predating Tidy-TS.

**Framing — two contributions, not one.** The comparison suite (Results section) and the RPython corroboration (this section) answer different questions with different denominators. Their headline numbers are not directly comparable. The section opens with an explicit non-comparability disclaimer:

> *These results answer a different question than the comparison suite reported above. The per-category catch rates here are not directly comparable as numerical improvements or regressions against the comparison suite — they characterize whether the error categories generalize to real-world data-analysis bugs, not whether Tidy-TS performs better on harder cases.*

**Reporting style:** distribution and per-category breakdown, not a single aggregate percentage. A bare "X of Y caught" headline invites the conflation we are explicitly avoiding.

The section should report:

1. **Corpus**: source (RPython, ESEC/FSE 2023). Scope is the **TM (Type Mismatch) subset** — 164 StackOverflow bugs curated by an independent research group whose root cause is a type mismatch. State explicitly that the other RPython subsets (CDA, APIC, SM, IDAP_IB) are **out of scope** for this evaluation; their broader scopes (e.g., CDA's "Confusing Data Analytics") would dilute the corroboration of a thesis specifically about type-system catches. Mention that three CDA reproductions exist in the repo as illustrative examples but are not part of the inclusion-evaluation denominator.
2. **Inclusion process**: pre-registered rules from `RPython/rules.md`, denominator → numerator at each stage (e.g., "164 TM snippets examined → N mapped to our six categories → M excluded as visualization-only / language-plumbing / etc.").
3. **Mapping distribution**: a table showing how included snippets distribute across the six categories, alongside the per-category counts from the comparison suite. Discuss any categories the corpus over- or under-represents relative to the suite. This is the central result of Contribution B.
4. **Tidy-TS detection rate on included snippets, per category, with mechanism breakdown**: pulled from the migrated frontmatter (issue 05). Four mechanism categories reported distinctly:
   - `compiler` — type-system catch
   - `zod schema validation` — load-time catch
   - `none — language structural absence` — bug class cannot occur in TS/JS; reported as `not applicable`, does NOT count as a catch
   - `none — library API design` — tidy-ts's API design avoids the bug class; reported as `not applicable`, does NOT count as a catch
   - `none — bug still exists` — honest non-catch; counts as a limitation
5. **Limitations of this corroboration**: explicit acknowledgement that no second clinical analyst rated the mappings (decision recorded in CONTEXT.md). Lean on the corpus's independence as the credibility argument.

**Discussion changes:** Add a paragraph that handles both contributions and bridges them. Suggested structure: (a) one paragraph for A's central finding (silent-continuation gap in High-severity errors); (b) one paragraph for B's central finding (the categories generalize; here is what does not map and why); (c) one connecting paragraph that explains why A's design choices are defensible *because* B shows the categories are real, not because A's numbers are large.

Supplementary material should include the full `INCLUSION_EVALUATION.md` table and a link to the reproductions in the public repo.

## Acceptance criteria

- [ ] New section exists in the manuscript with the five elements above.
- [ ] Section opens with the explicit non-comparability disclaimer (quoted in this issue).
- [ ] Corpus scope is stated as TM (164 snippets); other RPython subsets explicitly noted as out of scope with rationale; CDA reproductions described as illustrative-only.
- [ ] All counts in the section trace to `corroboration-summary.json` produced by issue 05c.
- [ ] Detection-rate numbers explicitly separate compiler catches from Zod catches from `none — language structural absence` from `none — library API design` from `none — bug still exists`. No conflation.
- [ ] Reporting leads with distribution and per-category breakdown — not a single aggregate percentage.
- [ ] The "no inter-rater check" limitation is stated plainly with the independence argument as the alternative defense.
- [ ] Supplement references the full mapping table and the reproductions repo path.
- [ ] Discussion contains three paragraphs: A's central finding, B's central finding, and a connecting paragraph that explicitly addresses the selection-bias reviewer concern.

## Blocked by

- Issue 05c (the manuscript pulls numbers from the generated `corroboration-summary.json`; without programmatic generation the prose would drift as frontmatter evolves).
- Issue 06 (canonical vocabulary established in the rest of the paper before this section adopts it, to avoid mid-paper drift).
