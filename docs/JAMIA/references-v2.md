# References — Detecting Clinical Data Errors Before the Code Runs (v6)

Ordered by first appearance in the manuscript. **22 references total.**

**v6 changes from v5:**
- Dropped Pierce 2002 (textbook) because we don't have it in `cited-works/` — every cited work must be on disk.
- The type-theory foundation claim is now carried by [2] Milner 1978 and [3] Cardelli/Wegner 1985 alone, both of which are exact-match canonical sources.

**v5 changes from v4:**
- Replaced the three "type-theory foundation" cites (Babamir, Solbrig, Pérez) with canonical CS-literature foundations. The previous medical-informatics cites were rated Loose fit.
- Dropped Mandel 2016 (SMART on FHIR) because the paper does not mention TypeScript; refs [6] Gour and [7] Gøeg already cover the claim.
- Tightened "15–38%" to "11–18%" to match what Gao 2017 and Khan 2022 actually report.

---

## 1. Baldridge AS, Bellinger GC, Fleming OM, Rasmussen LV, Whitley EW, Welty LJ. The epidemiology of errors in data capture, management, and analysis: A scoping review of retracted articles and retraction notices in clinical and translational research. *Journal of Clinical and Translational Science.* 2024;8(1):e174. doi:10.1017/cts.2024.533.

- **Claim:** "884 retracted articles in clinical and translational research found that 28% described problems preparing or analyzing data."
- **Status:** **Exact match.** PMID:39655037. PDF: `baldridge-2024-epidemiology-of-errors.pdf`.

---

## 2. Milner R. A Theory of Type Polymorphism in Programming. *Journal of Computer and System Sciences.* 1978;17(3):348-375. doi:10.1016/0022-0000(78)90014-4.

- **Claim:** "compile-time checking, and its theoretical foundation is well established."
- **Status:** **Exact match.** Verbatim from PDF p.1: "we present a formal type discipline for such polymorphic procedures in the context of a simple programming language, and a compile time type-checking algorithm w which enforces the discipline. A Semantic Soundness Theorem … states that well-type programs cannot 'go wrong' and a Syntactic Soundness Theorem states that if w accepts a program then it is well typed." The canonical paper establishing compile-time type checking with soundness proofs. PDF: `milner-1978-type-polymorphism.pdf`.

---

## 3. Cardelli L, Wegner P. On Understanding Types, Data Abstraction, and Polymorphism. *ACM Computing Surveys.* 1985;17(4):471-523. doi:10.1145/6041.6042.

- **Claim:** Same as ref 2.
- **Status:** **Exact match.** Verbatim from PDF p.1: "present a model of typed, polymorphic programming languages that reflects recent research in type theory … A unifying framework for polymorphic type systems is developed in terms of the typed λ-calculus … The mechanisms for type checking for the augmented λ-calculus are discussed." 2000+ citations; canonical conceptual framework. PDF: `cardelli-wegner-1985-understanding-types.pdf`.

---

## 4. Gao Z, Bird C, Barr ET. To Type or Not to Type: Quantifying Detectable Bugs in JavaScript. *In: 2017 IEEE/ACM 39th International Conference on Software Engineering (ICSE).* 2017:758-769. doi:10.1109/ICSE.2017.75.

- **Claim:** "Empirical studies of static type systems in JavaScript and Python have shown that 11–18% of real-world bugs would have been caught at compile time."
- **Status:** **Exact match.** PDF reports 15% mean with 95% CI [11.5%, 18.5%] for both Flow and TypeScript on JavaScript bugs. PDF: `gao-2017-to-type-or-not-to-type.pdf`.

---

## 5. Khan F, Chen B, Varró D, Khan S. An Empirical Study of Type-Related Defects in Python Projects. *IEEE Transactions on Software Engineering.* 2022;48(8):3145-3158. doi:10.1109/TSE.2021.3082068.

- **Claim:** Same as ref 4.
- **Status:** **Exact match.** PDF reports 15% (corrective defects) / 11% (all defects) preventable by mypy across 210 Python projects. PDF: `khan-2022-type-related-defects-python.pdf`.

---

## 6. Gour S, Peake A, Tong C, Churm J, Ahmad B, Pournik O, Arvanitis TN. Advancing Healthcare Through Interoperability: Implementing Scalable Solutions for Patient Data Integration. *Studies in Health Technology and Informatics.* 2024;316:242-246. doi:10.3233/SHTI240390.

- **Claim:** "TypeScript… already used in clinical informatics for health data standards, web dashboards, and data services."
- **Status:** **Supports (most explicit).** PMID:39176719. Stack is TypeScript + Deno + MongoDB. PDF: `gour-2024-interoperability-patient-data.pdf`.

---

## 7. Gøeg KR, Rasmussen RK, Jensen L, Wollesen CM, Larsen S, Pape-Haugaard LB. A Future-Proof Architecture for Telemedicine Using Loose-Coupled Modules and HL7 FHIR. *Computer Methods and Programs in Biomedicine.* 2018;160:95-101. doi:10.1016/j.cmpb.2018.03.010.

- **Claim:** Same as ref 6.
- **Status:** **Exact match.** PMID:29728251. ORDS telemedicine framework written in TypeScript. PDF: `goeg-2018-telemedicine-fhir-typescript.pdf`.

---

## 8. Warraich HJ, Tazbaz T, Califf RM. FDA Perspective on the Regulation of Artificial Intelligence in Health Care and Biomedicine. *JAMA.* 2025;333(3):241-247. doi:10.1001/jama.2024.21451.

- **Claim:** "increasing regulatory expectations for formal evaluation of data quality in clinical software."
- **Status:** **Supports.** PMID:39405330. PDF: `warraich-2025-fda-ai-regulation.pdf`.

---

## 9. Labkoff S, Oladimeji B, Kannry J, et al. Toward a Responsible Future: Recommendations for AI-Enabled Clinical Decision Support. *Journal of the American Medical Informatics Association: JAMIA.* 2024;31(11):2730-2739. doi:10.1093/jamia/ocae209.

- **Claim:** Same as ref 8.
- **Status:** **Supports.** PMID:39325508. PDF: `labkoff-2024-responsible-ai-cds.pdf`.

---

## 10. Razzaghi H, Wieand K, Dickinson KL, et al. Beyond Missingness: Systematizing Methods for Comprehensive Data Fitness Assessment in Clinical Research. *Journal of Medical Internet Research.* 2026;28:e76398. doi:10.2196/76398.

- **Claim:** Source for clinical data quality error patterns.
- **Status:** **Supports.** PMID:41980192. PDF: `razzaghi-2026-beyond-missingness.pdf`.

---

## 11. van Essen MHJ, Twickler R, Weesie YM, et al. Implications of Data Extraction and Processing of Electronic Health Records for Epidemiological Research: Observational Study. *Journal of Medical Internet Research.* 2025;27:e64628. doi:10.2196/64628.

- **Claim:** Same as ref 10.
- **Status:** **Strong support.** PMID:40498913. PDF: `vanessen-2025-ehr-data-extraction.pdf`.

---

## 12. Priou S, Kempf E, Jankovic M, Lamé G. "Goldmine" or "Big Mess"? An Interview Study on the Challenges of Designing, Operating, and Ensuring the Durability of Clinical Data Warehouses in France and Belgium. *Journal of the American Medical Informatics Association: JAMIA.* 2024;31(11):2699-2707. doi:10.1093/jamia/ocae244.

- **Claim:** Same as ref 10.
- **Status:** **Loose fit.** PMID:39269930. Qualitative CDW governance study; consider substituting if a more direct error-typology source is available.

---

## 13. Denney MJ, Long DM, Armistead MG, Anderson JL, Conway BN. Validating the Extract, Transform, Load Process Used to Populate a Large Clinical Research Database. *International Journal of Medical Informatics.* 2016;94:271-4. doi:10.1016/j.ijmedinf.2016.07.009.

- **Claim:** Same as ref 10.
- **Status:** **Supports.** PMID:27506144. PDF: `denney-2016-etl-validation.pdf`.

---

## 14. An D, Lim M, Lee S. Challenges for Data Quality in the Clinical Data Life Cycle: Systematic Review. *Journal of Medical Internet Research.* 2025;27:e60709. doi:10.2196/60709.

- **Claim:** Same as ref 10.
- **Status:** **Supports.** PMID:40266662. PDF: `an-2025-data-quality-life-cycle.pdf`.

---

## 15. Ahmed S, Wardat M, Bagheri H, Dantas Cruz B, Rajan H. Characterizing Bugs in Python and R Data Analytics Programs. *arXiv preprint.* 2023. arXiv:2306.08632.

- **Claim:** "164 bugs labeled Type Mismatch… each bug labeled by type, root cause, and effect."
- **Status:** **Exact match.** Three-label classification confirmed in §2.2/§3 of the PDF. The 164 count is derived from the `TM_snippets.json` dataset (verified locally — exactly 164 entries). PDF: `ahmed-2023-characterizing-bugs.pdf`.

---

## 16. Okyay RA, Kocyigit BF, Qumar AB, Yessirkepov M, Sumbul HE. Fifty Years of Retracted Medical Publications From 1975 to 2024: A Comprehensive Analysis of Trends, Reasons, and Countries Using the Retraction Watch Database. *Journal of Korean Medical Science.* 2025;40(46):e300. doi:10.3346/jkms.2025.40.e300.

- **Claim:** "31.5% data concerns most common reason for retraction."
- **Status:** **Exact match.** PMID:41327922. PDF: `okyay-2025-retracted-medical-publications.pdf`.

---

## 17. Nath SB, Marcus SC, Druss BG. Retractions in the Research Literature: Misconduct or Mistakes? *The Medical Journal of Australia.* 2006;185(3):152-4. doi:10.5694/j.1326-5377.2006.tb00504.x.

- **Claim:** "395 retracted articles… unintentional errors more than twice as many as misconduct."
- **Status:** **Exact match.** PMID:16893357. PDF: `nath-2006-retractions-misconduct-or-mistakes.pdf`.

---

## 18. Kovacs M, Varga MA, Dianovics D, Poldrack RA, Aczel B. Opening the Black Box of Article Retractions: Exploring the Causes and Consequences of Data Management Errors. *Royal Society Open Science.* 2024;11(12):240844. doi:10.1098/rsos.240844.

- **Claim:** "97 researchers… inattention most frequently cited cause… errors at any stage."
- **Status:** **Exact match.** PMID:39698151. PDF: `kovacs-2024-black-box-retractions.pdf`.

---

## 19. Zhang Z, Wang Y, Wang C, Chen J, Zheng Z. LLM Hallucinations in Practical Code Generation: Phenomena, Mechanism, and Mitigation. *Proceedings of the ACM on Software Engineering.* 2025;2(FSE):Article 75. doi:10.1145/3728894.

- **Claim:** "AI outputs frequently hallucinate APIs and generate plausible but logically flawed code…"
- **Status:** **Supports.** Empirical study of LLM code-generation hallucination across six mainstream LLMs in repository-level scenarios. PDF: `zhang-2025-llm-hallucinations.pdf`.

---

## 20. Blacketer C, Defalco FJ, Ryan PB, Rijnbeek PR. Increasing Trust in Real-World Evidence Through Evaluation of Observational Data Quality. *Journal of the American Medical Informatics Association: JAMIA.* 2021;28(10):2251-2257. doi:10.1093/jamia/ocab132.

- **Claim:** "OHDSI Data Quality Dashboard… completeness, conformance, plausibility."
- **Status:** **Exact match.** PMID:34313749. PDF: `blacketer-2021-ohdsi-dqd.pdf`.

---

## 21. Sauer CM, Chen LC, Hyland SL, Girbes ARJ, Elbers PWG, Celi LA. Leveraging Electronic Health Records for Data Science: Common Pitfalls and How to Avoid Them. *The Lancet Digital Health.* 2022;4(12):e893-e898. doi:10.1016/S2589-7500(22)00154-6.

- **Claim:** "Data handling during analysis has been identified as a distinct source of error."
- **Status:** **Supports.** PMID:36154811. PDF: `sauer-2022-ehr-data-science-pitfalls.pdf`.

---

## 22. Kohane IS, Aronow BJ, Avillach P, et al. What Every Reader Should Know About Studies Using Electronic Health Record Data but May Be Afraid to Ask. *Journal of Medical Internet Research.* 2021;23(3):e22219. doi:10.2196/22219.

- **Claim:** Same as ref 21.
- **Status:** **Exact match.** PMID:33600347. The paper explicitly lists "data collection and handling (eg, transformation)" as a distinct key consideration. PDF: `kohane-2021-ehr-studies-reader-should-know.pdf`.

---

# Removed across v3–v6

- **Babamir 2012** — Z-language insulin pump verification (Loose fit; replaced by Milner 1978).
- **Solbrig 2017** — ShEx for FHIR (Loose fit; replaced by Cardelli/Wegner 1985).
- **Pérez 2019** — ADTs for clinical guidelines (Loose fit; covered by [2][3]).
- **Pierce 2002** — *Types and Programming Languages* textbook (no PDF in `cited-works/`; [2][3] carry the claim).
- **Eleftherakis 2001** — X-Machines (no retrievable PDF).
- **Bunge 2019** — JSConf talk on Airbnb TypeScript migration (no archivable artifact).
- **Mandel 2016** — SMART on FHIR (paper does not mention TypeScript; refs [6][7] already carry the claim).
