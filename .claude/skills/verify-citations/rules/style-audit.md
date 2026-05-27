# Style audit

Runs once across the whole document, after all inline citations have been resolved. Catches issues that aren't about individual citation accuracy but about the citation infrastructure of the document.

## What to check

### 1. Mixed citation styles

A document should pick one style and stick to it. Common mixings:

- Numeric brackets (`[4][6][7]`) alongside author-year (`[Smith 2023]`) in the same body.
- Sometimes parenthetical (`(Smith 2023)`) and sometimes bracketed (`[Smith 2023]`).
- Sometimes superscripted (`^4`), sometimes inline (`[4]`).

Flag the mixing. The journal's submission guidelines will usually mandate one. Recommend the dominant style in the doc as the target.

### 2. Inline cites missing from the reference list

Walk every inline citation token. For each, confirm there is a corresponding reference-list entry. If not:

- The author may have forgotten to add the entry.
- The cite may be a stub awaiting a final reference.
- The cite may use a non-standard token.

This is a submission blocker in most journals. List every missing entry in the report.

### 3. Reference-list orphans (entries never cited)

Walk every reference-list entry. For each, confirm there is at least one inline citation. If not, the entry is an orphan and should either be cited or removed.

Reviewers and editors notice orphan references. They often signal a hastily-assembled bibliography.

### 4. Numbered tokens pointing outside the list

If the document uses numeric citation style and the body cites `[20]` but the list has 18 entries, the mapping is broken. This usually happens when:

- The author re-cited from an earlier draft with more references.
- The bibliography manager re-numbered after entries were deleted.
- The numeric and author-year systems got mixed (numeric tokens left over from a prior draft, author-year added later).

### 5. Year or author conflicts

If the inline cite says `[Smith 2023]` and the reference list has `Smith, J., 2024`, flag it. Either the inline cite has the wrong year or the list entry does.

### 6. Repeated citations to the same paper with different tokens

`[Smith 2023]` and `[5]` both pointing to the same Smith paper means the document is using two styles for the same source. Flag it.

### 7. Self-citations and self-references

Flag self-citations (papers by the manuscript's authors) so the user can confirm they're appropriately disclosed and not over-used. Not necessarily wrong, but reviewers look for excessive self-citation.

## What NOT to do in this phase

- Don't recommend specific replacement citations — that's the user's call.
- Don't rewrite the bibliography.
- Don't change citation style automatically.

This phase produces findings. The user decides what to act on.

## Output

A separate section of the final report:

```
## Style findings

Mixed styles:
- Body uses both [Smith 2023] (12 occurrences) and [4][6][7] (8 occurrences). Recommend picking one.

Inline cites missing from ref list:
- [Ahmed 2023] (§External Validation ¶1) — no matching list entry.
- [Sauer 2022] (§Discussion ¶5) — no matching list entry.

Reference-list orphans:
- Hussein 2025 (PMID 40776197) — listed but never cited inline.

Year conflicts:
- Inline says [Wang 2026], list says Wang 2025. Confirm which is correct.

Numbered tokens out of range:
- [20] cited in §Background, but list has 18 entries.
```
