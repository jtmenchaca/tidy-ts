# KK Feedback Checklist — *Preventing Silent Errors in Clinical Data Analysis*

Source comments: `Preventing Silent Errors in Clinical Data Analysis 20260527 KK[43].docx` (KK, 31 comments, 8 tracked edits)
Status reconciled against: `Preventing Silent Errors in Clinical Data Analysis 20260529.docx`
Reviewer: Ken Kawamoto

> **Heads-up — major rename:** In the 20260529 version, the framework was renamed from **Tidy-TS → Baseline**. Some KK comments anchored to "Tidy" / pandas / R mentions may have shifted location; the substantive asks below are unchanged but anchor text differs.

> **Reconciliation legend used below:** ✅ = resolved in 20260529 · 🟡 = incomplete · ⬜ = still open · ↪ = reframed/rendered moot

---

## Cross-cutting themes (address once, applies throughout)

- ⬜ **Position Baseline plainly as an alternative to pandas (Python) and tidyverse (R).** KK is less technical and didn't realize this — make it explicit in abstract, intro, and discussion that Baseline plays the same role those libraries play, just in TypeScript. (Covers comments #26, #27, #48, #55.) — 20260529 characterizes Baseline as "a TypeScript framework for working with datasets" in Methods but never sets up the "alternative to pandas/tidyverse" framing in the abstract or intro.
- 🟡 **Add citations everywhere claims are made.** KK flagged this repeatedly (#18 ✅, #21 ⬜, #22 ⬜, #23 ⬜, #34 ⬜, #47 ✅). Default rule: every assertion about R/Python behavior, error rates, AI hallucinations, or analyst error gets a citation — or the language is hedged. 20260529 added [1] for the 884-retracted-articles claim and [19] for AI hallucinations; the rest still need attention.
- ⬜ **Spell out acronyms on first use** (#20 AI — unaddressed; #57 figure acronyms — figure captions still lack footnotes). Sweep the whole manuscript.

---

## Title & framing

- ⬜ **Title — "Before the Code Runs" (#0).** KK suggests removing this if scope is broader; consider whether the manuscript actually stays within pre-execution detection or also covers runtime guardrails. *Unchanged in 20260529.*
- ⬜ **Title/abstract — bring the AI angle forward (#49).** KK thinks foregrounding AI-assisted analysis makes the paper more attractive to JAMIA's audience. *Title/abstract still have no AI mention; AI angle remains only in Discussion + Acknowledgements.*

## Abstract

- ⬜ **"coding" — pick a more precise adjective (#5).** KK suggests "analysis" errors or specifying error types. *Materials & Methods abstract still reads "potential coding errors".*
- 🟡 **Clarify the 65 vs. 78 relationship (#10).** Why are 65 scenarios run across all three tools and 78 only against Baseline? State the rationale in the abstract itself. *20260529 reorders the sentences but the rationale (selective fixing — see #38/#44) only appears in Results, not the abstract.*
- ⬜ **Briefly describe how the error categories were derived (#12)**, if space allows. *Methods now says "derived from error patterns described in published clinical data quality literature[10][11][12][13][14] and from errors encountered during common data analysis tasks at the University of Utah" — but this provenance is not in the abstract.*
- 🟡 **Tracked edit — KK's rewording (#6–9)** — *parallel rewrite, not acceptance.* KK proposed inserting "as well as two commonly used analytical workflows [frameworks?] in" before "Python (pandas) and R (tidyverse)." The authors instead wrote a tighter sentence: "we evaluated how these errors are addressed in Baseline, Python (pandas) and R (tidyverse) workflows." KK's structural suggestion (call them "two commonly used workflows/frameworks") was not adopted, and his "frameworks?" hedge was ignored — decide whether to honor his framing or hold the current wording.
- ⬜ **"primarily before code execution" (#13, #14)** — KK's "primarily" insertion **rejected**: Conclusion still reads "before code execution." Decide whether to accept or to push back with a justification (everything reported as pre-execution truly is).
- ⬜ **"before code execution" — make explicit *why* design-time catching matters (#15).** One sentence on the cost of late-discovered errors. *Discussed at length in Background ("Catching errors before any analytical code runs…" paragraph) but not crystallized in the abstract.*

## Introduction

- ✅ **Cite "research" claim (#18).** Reference [1] (Baldridge et al. 2024) is now present at "One review of 884 retracted articles…[1]".
- ⬜ **"Non-technical researchers might be surprised…" (#19) — reword.** The phenomenon (silent failure) can happen to technical researchers too; don't make it a non-technical/technical divide. *Verbatim same sentence in 20260529.*
- ⬜ **"flaws" (#21) — cite or hedge.** Strong claims about language flaws need a reference or softer language. *Still reads "AI-generated code often contains subtle logical flaws" with no citation.*
- ⬜ **"reviews" (#22) — add citations.** *"peer reviews" still uncited.*
- ⬜ **"R" (#23) — cite claims about R behavior.** *Paragraph on Python/R dynamic typing has no citations.*
- ⬜ **"subtle" (#24) — interrogate this word.** Are these errors necessarily subtle, or sometimes loud? Don't overclaim. *"subtle logical flaws" and "nuanced and hard to detect" both still present.*
- 🟡 **Up-front characterization of Baseline (#26).** Methods opens with "Baseline is a TypeScript framework for working with datasets" — clear technically, but the intro still doesn't frame it as a *replacement for/alternative to* pandas and tidyverse.
- 🟡 **Python/R dominance (#27).** Discussion now calls them "two of the most commonly used programming languages for clinical data analysis" but the intro still asserts dominance without a supporting stat or citation.
- ⬜ **pandas mention (#29) — citation needed.**
- ⬜ **Stray period in TypeScript paragraph (#25).** KK deleted ". " between two sentences. 20260529 reads "…clinical software.**[8][9].**" — a stray period after the citation bracket remains. KK's deletion was not cleanly applied; clean this up.

## Methods

- 🟡 **"patients" (#32) — frame as one example, not the only entity type.** Datasets can contain encounters, claims, devices, etc. *Intro still leads with "query patient data" as the canonical example.*
- ⬜ **"address" (#33) — singular/plural agreement check.** *"requiring that code address potentially missing values" reads as subjunctive; tolerable but worth a second look.*
- ❓ **Superscript citation cluster ⁻⁶ (#34) — "All these statements need citations".** KK's anchor is the "⁻⁶" in the validation paragraph: "validated directly against R, with outputs aligning within a tolerance of 10⁻⁶." There is nothing obvious to cite for this particular claim (it's a property of the test suite, not a literature claim). KK may have intended to flag the surrounding statements about the test suite or the choice of R as reference. Worth a clarification with KK or a defensive added reference to R as the validation oracle.
- ✅ **Why not also test the 78 real-world bugs against Python and R? (#38, #44).** 20260529 now reports: "Of the 78 included bugs, 62 (80%) still trigger the original failure in current versions of the respective Python and R libraries. The remaining 16 no longer reproduce the original silent failure, reflecting upstream changes in those libraries since the bugs were originally reported." This directly addresses KK's question and the selective-fixing caveat.

## Results

- ✅ **Open-source link + tool characterization (#40).** Data Availability section now states the project is open source with a GitHub link ("https://github.com/jtmenchaca/tidy-ts, release 2.0.0"). Methods opens with a concrete description. Consider whether the link should also surface earlier (e.g., near first mention in Results).
- ✅ **Add a table or figure of exemplar errors (#42).** Figure 3 ("MISSING" × 2 across Baseline / pandas / tidyverse) and Table 1's "Example error" column now make the silent-error categories concrete.
- ✅ **Reframe the 78-bug analysis (#44).** Covered by the same Results addition as #38 above.

## Discussion

- ⬜ **"Figure" reference (#46) — Figure 3 is only cited in Discussion, never in Results.** Confirmed across the whole document: Figure 1 is referenced in Methods, Figure 2 in Results, Figure 3 *only* in Discussion ("…systematically incorrect output (Figure 3)"). Per KK, either move the figure introduction to Results or add a Results sentence pointing to it.
- 🟡 **"magnified" — AI risk claim needs citation or hedge (#47).** Citation [19] (Zhang et al., LLM hallucinations) now backs the *adjacent* "hallucinate APIs and generate plausible but logically flawed code" sentence. The "risk of silent errors is magnified" sentence KK actually anchored to is *itself* uncited. KK's substantive asks — add the recent med-student retraction anecdote, acknowledge AI may outperform a junior analyst — are not addressed.
- 🟡 **"can" → make clear what Baseline *is* and how it's *used* (#48).** Tool is characterized; the explicit *recommendation* (replace R/Python? complement? when?) is still soft.
- ⬜ **Propose a hybrid R/Python → Baseline workflow (#51).** *Not addressed. KK is offering this as a usability path — consider adopting it as a "How to adopt Baseline" paragraph in Discussion or Future Directions.*
- ⬜ **"is" → "can be" (#54).** *Original anchor sat in a Discussion sentence that has since been reworked; the strongest current target is the Conclusion's "Baseline is a novel, open-source data analytics library that prevents…" — consider "can prevent" or scoping to the conditions tested. Also spot-check the Limitations paragraph that opens "languages that provide pre-execution type checks **are also sometimes perceived as adding friction**…" — this concedes one frame; balance with the same hedge elsewhere.*
- 🟡 **Limitations / future-directions paragraph on practical adoption (#55).** 20260529 adds a substantive Limitations section (compiler friction, bypass, complex type systems, runtime validation requirement). It still does **not** address how R/Python users migrate or co-exist. Add this.
- ✅ **Stray "I" character (#50).** Resolved — sentence now ends cleanly at "clinical data analyses."

## Figures & tables

- ⬜ **Figure acronym footnotes (#57).** *Captions still lack footnoted definitions for any acronyms used.*
- 🟡 **"Comparison" figure/section is good — consider more examples (#59).** *Figure 3 currently shows a single comparison (`"MISSING" × 2`). KK liked it; expanding to 2–3 categories would carry his suggestion forward.*

---

## Suggested implementation order (updated for 20260529)

1. Decide the **AI-forward title** and the **"alternative to pandas/tidyverse"** positioning first — both ripple into abstract, intro, and discussion. (Both still open: #0, #26, #48, #49.)
2. Sweep remaining citations in a single pass: #21 (logical flaws), #22 (peer reviews), #23 (R behavior), #29 (pandas), #34 (10⁻⁶ tolerance). #18 and #47 are already done.
3. Address remaining structural asks:
   - Surface the 65 vs. 78 rationale in the abstract itself (#10) — the body now explains it, the abstract doesn't.
   - Add the hybrid R/Python → Baseline adoption workflow (#51) and a migration-cost note for R/Python users in Limitations (#55).
   - Re-check that Figure 3 is established in Results before being referenced in Discussion (#46).
4. Expand the comparison figure (#59) to 2–3 categories instead of one.
5. Final pass: acronyms (#20, #57), wording nits (#5, #19, #24, #33, #54), reconsider/resolve KK's "primarily" insertion (#13/#14).

## Resolved in 20260529 (verified against source text)

Cleanly addressed:

- ✅ **#18** — Citation [1] (Baldridge et al. 2024) now appears on the 884-retracted-articles claim, exactly where KK suggested it.
- ✅ **#38 + #44** — Results paragraph 2F13C044 reports: "Of the 78 included bugs, 62 (80%) still trigger the original failure in current versions of the respective Python and R libraries. The remaining 16 no longer reproduce the original silent failure, reflecting upstream changes in those libraries since the bugs were originally reported." This directly satisfies KK's "why not test in Python/R too" and his selective-fixing caveat.
- ✅ **#40 — open-source link** — Data Availability section explicitly links `https://github.com/jtmenchaca/tidy-ts (release 2.0.0)`. Methods + figures together also characterize what Baseline is and how it's used. The *separate* "what exactly is Baseline / how do people practically use it" concern KK raised remains open (#26/#48) — flagged there.
- ✅ **#50** — Stray "I" gone; sentence ends cleanly at "clinical data analyses."

Incomplete — flagged in the per-section sections above rather than here:

- 🟡 **#6–9** — Abstract was rewritten but **not** the way KK proposed (his "as well as two commonly used analytical workflows [frameworks?]" insertion was discarded). Confirm intent.
- 🟡 **#42** — Figure 3 + Table 1's "Example error" column do illustrate exemplar errors, but Figure 3 is only ever referenced in Discussion (#46), and KK's #59 (more comparison examples) is still open. Treat #42 as "spirit addressed, mechanics need work" rather than fully closed.
