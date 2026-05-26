# Pre-flight

Before any audit work, gather the things that make the audit possible.

## 1. Identify the target reader

Ask the user explicitly. Do not assume.

- Who reads this document?
- What is their role and technical level?
- What do they already know about the topic?
- What will they not know?

A "non-technical but engaged JAMIA reviewer" reads differently from "an experienced ML engineer skimming a blog post." The audit is calibrated against this reader for everything that follows. If you cannot name the reader in a sentence, stop and ask.

## 2. Read the entire document

Do not start the phrase pass without reading the whole document first. Use the word-mcp `read_docx` (or equivalent) to get every paragraph in order. The audit needs the document's overall shape — section structure, where contributions are claimed, where they are restated, where the gaps are — before any sentence-level work begins.

Skipping this step is how a phrase pass produces local wins that leave the document broken at the higher altitudes. The Abstract miss in the JAMIA manuscript happened because the audit went sentence-by-sentence without checking what the Abstract should contain.

## 3. Locate and read CONTEXT.md

If the document has a CONTEXT.md (or equivalent project glossary), read it first.

The CONTEXT.md tells you:
- The canonical terminology this document uses
- Style commitments specific to this document
- Resolved ambiguities (terms the document has settled on)
- Recorded decisions (structural choices that should not be undone)
- Open items (known incomplete tasks)

If your audit proposes a change that contradicts a recorded decision, stop. The CONTEXT.md governs.

If no CONTEXT.md exists and the document is large enough that one would help, recommend running `/grill-with-docs` before the audit to build one.

## 4. Run a word count

Use the word-mcp `count_words` tool (or equivalent) to get:
- Total word count
- Per-paragraph word counts
- Section subtotals if known

If the document has a word-count target (JAMIA: 4,000 for main text; 250 for Abstract), check the current count against the target. If the document is over, the audit will need to make cuts; per-section budgets become useful. See `budget.md`.

## 5. Confirm the scope of the audit pass

Ask:
- Is this the whole document, a section, or a specific passage?
- Is there a stylesheet to layer on top of the defaults?
- Are there sections the user has already audited that should not be re-touched?

Only then begin the coverage scan.
