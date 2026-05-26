# Phrase pass

The per-section audit procedure that runs after pre-flight, coverage scan, and budget are settled.

## Granularity

Walk the document **two sentences at a time, paragraph by paragraph, in document order**.

Two sentences is small enough that every phrase gets attention. Larger units cause the audit to skim. Smaller units cause the audit to lose the connection between sentences.

A paragraph that exceeds two sentences gets walked in two-sentence chunks, each evaluated against the prior chunks of the same paragraph.

## Per-phrase evaluation

For each phrase in the chunk, evaluate against the target reader:

- Does the target reader know what this phrase means on its own?
- Does it introduce a term that has not been explained earlier in the document?
- Does it use different language for a concept already named elsewhere? If so, which wording wins?
- Does it repeat something the previous sentence already said?
- Is it the right word, or a word that sounds precise but means something slightly different?
- Does the underlying claim match what the cited evidence supports?

List the issues per phrase. Do not skip phrases that look fine — say "OK" or omit them silently, but read each one.

Default to proposing a change. See `posture.md`.

## Per-beat evaluation

In parallel with the phrase audit, run the beat check on the chunk:

- How many beats?
- For each beat: axis 1 (distinct work), axis 2 (concept reachability), axis 3 (concrete grounding).
- Mark each beat: keep / expand / anchor / cut.

See `beat-check.md`.

## When a citation appears

Pull the citation if you have not verified it. See `citation-handling.md`.

## Reader questions

After the phrase and beat audits, generate at least three reader questions. See `reader-questions.md`.

## Format the audit findings

Present the audit as:

1. The chunk being audited (verbatim).
2. The beat list with axis status.
3. The per-phrase findings (table or list).
4. The reader questions and whether each indicates a change.
5. The proposed rewrite, with the new word count.
6. Wait for approval.

## Carry forward

After the chunk is approved and applied, check:

- Does the change cascade? If a term changed in this chunk, find every other occurrence in the document and update.
- Does the next chunk now connect cleanly to this one? If the edit broke flow, mark a follow-up.

Then move to the next chunk.

## What not to do during the phrase pass

- **Do not jump sections.** Walk in document order. The reader does too.
- **Do not batch edits.** Apply one chunk at a time. Batching loses the user's chance to redirect.
- **Do not apply without showing the proposed rewrite.** The user sees the proposal, approves, and only then is the edit applied.
- **Do not over-explain in the audit findings.** State the issue, propose the fix, wait. Long audit findings cost the user reading time.

See `proposing-changes.md` for the proposal format.
