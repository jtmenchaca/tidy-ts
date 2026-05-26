# Post-edit

After a chunk is approved and applied, do not move on silently. Run the post-edit checks.

## Re-read the subsection out of context

Read the full subsection (not just the chunk) once more. Verify:

- **Each sentence flows logically from the prior one.** If the edit changed sentence N, does sentence N+1 still connect? Sometimes a clean edit upstream introduces a non-sequitur downstream.
- **No jargon was introduced that was not there before.** A rewrite that swapped one jargon term for another is a wash. Check what came in.
- **The heading still matches the content.** If the prose was rewritten to remove jargon, the heading may also need to be rewritten. A subsection titled "Compile-Time Type Checking" with a body that no longer uses "type" is a mismatch.
- **The subsection connects to the one before and the one after it.** Section boundaries are common places for drift. Read the last sentence of the prior subsection and the first sentence of the next; do they still bridge?

If any of these fail, the audit is not done with this subsection. Propose the connection fix before moving on.

## Cross-document consistency

If a term was changed in this chunk, find every other occurrence in the document and update.

The word-mcp `search_docx` tool finds all instances. Walk each one. Ask:

- Should this occurrence use the new term?
- Is this occurrence a quoted source (where the old term is correct because the source used it)?
- Is this occurrence a different sense of the same word (where the old term is correct because it means something different here)?

Most occurrences should be updated. Some legitimately should not. Decide each one.

If a term-change introduces ambiguity at another location, surface it. The user may decide to keep the old term, change the new one, or split the concept into two terms.

## Tables and figures

Check table cells and figure captions. These get out of sync with body prose more often than any other location. A common failure pattern:

- Body prose says "65 scenarios across five categories".
- Table 2 still uses six categories from an earlier draft.
- Figure 2 still uses the seven-category labels from before the comparisons CONTEXT.md merge.

After any body-prose change to a count, category list, or canonical phrasing, check the corresponding tables and figures.

## Word count check

After the chunk is applied, re-measure the section's word count with the word-mcp `count_words` tool. Update the running section total.

If the section is still over budget after the chunk, the audit continues. If the section is now at or under budget, note the slack available to the next section.

## Mark follow-ups for next pass

If the chunk produced findings the user deferred, or if the post-edit re-read surfaces a new issue, write them down. The follow-up list lives in two places:

- **In-session** — a working list during the audit pass, so nothing is forgotten by the next chunk.
- **In CONTEXT.md** — if the follow-up is about a structural choice or a recurring style issue worth recording for the next audit pass entirely.

Do not move on until the follow-ups are recorded somewhere persistent.

## Move on

When the post-edit checks pass and the running word count is updated, move to the next chunk. Confirm to the user explicitly ("Moving to next paragraph" or "Section complete; moving to Results.") so they have the chance to interject.
