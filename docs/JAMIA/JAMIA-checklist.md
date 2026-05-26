# JAMIA Submission Checklist

Research and Applications article.

## File Organization

```
docs/JAMIA/
├── JAMIA-checklist.md                                          # this file
├── jamia-requirements.md                                       # editorial guidance / phrase-by-phrase protocol
├── Detecting-Clinical-Data-Errors-Before-the-Code-Runs.docx   # manuscript
├── submission/                                                 # submission artifacts
│   ├── cover-letter.docx
│   ├── title-page.docx
│   ├── alt-text.docx
│   └── disclosures.docx
├── comparisons/                                                # comparison suite (Supplementary Material)
│   ├── README.md
│   ├── all-tables.json / all-tables.md                         # collected results
│   ├── type-guarantee-audit.types.test.ts                      # Supplementary A
│   ├── fixtures/                                               # sample clinical datasets
│   ├── cat-1-column-schema-reference/
│   ├── cat-2-type-safety/
│   ├── cat-3-null-missing-data/
│   ├── cat-4-join-safety/
│   └── cat-5-schema-composition/
└── figures/
    ├── figure-1-workflow.html / .png
    ├── figure-2-heatmap.html / .png
    └── render scripts
```

## Word Limits

- [ ] Main text: up to 4,000 words (excludes Acknowledgments, References)
  - Current: ~4,600 — needs trimming (~600 words)
- [ ] Structured abstract: up to 250 words
- [ ] Tables: up to 4 (currently 3 in main text; Supplemental Table 1 doesn't count)
- [ ] Figures: up to 6 (currently 2)
- [ ] References: unlimited

## Structured Abstract Headings (required)

- [x] Objective
- [x] Materials and Methods
- [x] Results
- [x] Discussion
- [x] Conclusion
- [ ] No references in abstract
- [ ] No abbreviations in abstract (or define if used)

## Main Text Sections (required)

- [x] Background and Significance
- [x] Objective
- [x] Materials and Methods
- [x] Results
- [x] Discussion
- [x] Limitations
- [x] Conclusion

## Title Page — see submission/title-page.docx

- [x] Title
- [x] Corresponding author: full name, postal address, email, telephone
- [x] All co-authors: full name, department, institution, city, country, degree
- [x] Up to 5 MeSH keywords
- [ ] Word count (excluding title page, abstract, references, figures, tables)
- [x] Tweet for social media promotion

## Data Availability (required)

- [x] Data Availability Statement included before References
- [x] GitHub repository link: https://github.com/jtmenchaca/tidy-ts
- [x] Notes release 2.0.0, comparison suite, sample datasets, equivalent implementations
- [ ] Consider Dryad deposit (free for JAMIA authors)
- [ ] All publicly available datasets fully referenced with DOI or unique identifier

## Figures and Tables

- [x] All figures/tables cited in text in numerical order
- [x] Tables in Word format, placed where first cited
- [x] Table legends/footnotes explain any formatting
- [ ] Figure alt text descriptions included below each figure legend — see submission/alt-text.docx
- [ ] Figures submitted as separate high-resolution files (.eps or .tif)
- [x] Supplementary material cited in main text

## References

- [x] Numbered sequentially as they appear in text
- [ ] Reference numbers inserted immediately after punctuation with no space
- [ ] All references accurate and verified
- [ ] Kahn 2016 and Blacketer 2021 placeholder citations need final numbering
- [ ] Format: 3 or fewer authors list all; otherwise first 3 + "et al."

## Disclosures and Statements — see submission/disclosures.docx

- [x] Conflict of interest declaration
- [x] Funding sources and grant numbers
- [x] CRediT contributor roles for all authors
- [x] AI use disclosure in Acknowledgments (required by JAMIA policy)
- [x] Acknowledgments section

## Cover Letter — see submission/cover-letter.docx

- [x] Related papers by same authors (published or under consideration)
- [x] Previous reviews if applicable
- [x] AI use disclosure

## Submission Format

- [x] Manuscript as Word document
- [ ] Double-spaced
- [ ] Supplementary files submitted separately
- [x] ORCiD IDs for all authors

## Pre-Submission Content Review

- [x] Two severity tiers (High/Low) — collapsed from three
- [x] mypy/pyright results in Results and Discussion
- [x] Kahn et al. framework mapping in Methods and Discussion
- [x] Developer experience paragraph in Discussion
- [x] Tidy-TS runtime detection (defense in depth) noted in Results
- [ ] Consider adding a concrete code example figure (one error in all three languages)
- [ ] Verify all terminology consistent throughout (run final consistency check)
