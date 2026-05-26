# Budget

A word-count target turns vague "tighten this" into concrete "this section has N words to spend." Use it.

## When budgets matter

If the document has an external word limit (JAMIA: 250 word Abstract, 4,000 word main text; arXiv: no limit but reviewer fatigue at >8,000; blog posts: ~1,500 best), set a budget below that limit.

A hard target below the external limit reliably surfaces real bloat. The Abstract revision that took the JAMIA manuscript from 468 words to 247 words found cuts that a soft "tighten this" instruction would not have. The forcing function does the work.

A working rule of thumb: target 250 words below the external cap to leave room for late-stage additions (reviewer revisions, clarifying sentences) without re-trimming.

## Establish per-section budgets

Total budget divided across sections gives every section a concrete number. When auditing a section, the question is not "is this clean?" but "is this section at its budget?"

Example for a 3,750-word manuscript with Abstract + body:

| Section                              | Budget |
|---                                   |---:    |
| Abstract                             | 250    |
| Background and Significance          | 500    |
| Objective                            | 75     |
| Materials and Methods                | 900    |
| Results                              | 650    |
| Discussion (including Limitations)   | 1,000  |
| Conclusion                           | 75     |
| Headings + transitions               | 300    |
| **Total**                            | 3,750  |

Record this in the document's CONTEXT.md so the next audit pass sees the same budget.

## How to use a budget during the phrase pass

Walk a section paragraph by paragraph in document order. After each paragraph, check the running total against the section budget.

- If the section is over budget, audit decisions lean toward cutting. A doublet across sentences becomes a cut, not a "consider tightening."
- If the section is under budget, audit decisions lean toward expanding. A beat that fails concept reachability (axis 2 of beat-check) gets the grounding sentence it needs, not the short version.
- If the section is at budget, audit decisions lean toward clarification at constant length.

The budget is a tool, not a target to hit exactly. It informs every per-paragraph decision.

## When the section overruns its budget

Two options:

1. **Cut deeper in this section.** Identify the largest paragraph and apply the beat-check. If a beat is padding or restatement, cut. If the budget is still over after cutting all the slack, move to option 2.

2. **Rebalance.** If a section's expanded clarity is genuinely worth the words, take them from a section that has slack. The Discussion section in a manuscript almost always has more slack than Background. Continue the audit forward and recover the budget there.

Do not defer cuts to a later pass. Cuts that get deferred get forgotten. Make the cut now or commit to spending the words.

## Counting words

Use the word-mcp `count_words` tool (or equivalent). Options:
- `rank_by: "size"` to find the biggest paragraphs first.
- `rank_by: "order"` to walk in document order.
- `exclude_ids` to compute the JAMIA-relevant count (excluding Acknowledgements, References, table captions, figure captions).
- `range_from_id` / `range_to_id` to compute a section subtotal.

Always re-measure after a section is audited, before moving to the next.
