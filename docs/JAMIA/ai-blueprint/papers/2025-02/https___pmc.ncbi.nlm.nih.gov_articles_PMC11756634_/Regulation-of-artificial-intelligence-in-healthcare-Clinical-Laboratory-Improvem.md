J Am Med Inform Assoc

. 2024 Dec 6;32(2):404–407. doi: [10.1093/jamia/ocae296](https://doi.org/10.1093/jamia/ocae296)

# Regulation of artificial intelligence in healthcare: Clinical Laboratory Improvement Amendments (CLIA) as a model

[Brian R Jackson](https://pubmed.ncbi.nlm.nih.gov/?term="Jackson%20BR"[Author])

### Brian R Jackson, MD, MS

1 Department of Pathology, University of Utah, Salt Lake City, UT 84112, United States

2 Department of Biomedical Informatics, University of Utah, Salt Lake City, UT 84108, United States

Find articles by [Brian R Jackson](https://pubmed.ncbi.nlm.nih.gov/?term="Jackson%20BR"[Author])

1,2,✉, [Mark P Sendak](https://pubmed.ncbi.nlm.nih.gov/?term="Sendak%20MP"[Author])

### Mark P Sendak, MD, MPP

3 Duke Institute for Health Innovation, Duke University, Durham, NC 27701, United States

Find articles by [Mark P Sendak](https://pubmed.ncbi.nlm.nih.gov/?term="Sendak%20MP"[Author])

3, [Anthony Solomonides](https://pubmed.ncbi.nlm.nih.gov/?term="Solomonides%20A"[Author])

### Anthony Solomonides, PhD, MSc (Math), MSc (AI)

4 Research Institute, Endeavor Health, Evanston, IL 60210, United States

Find articles by [Anthony Solomonides](https://pubmed.ncbi.nlm.nih.gov/?term="Solomonides%20A"[Author])

4, [Suresh Balu](https://pubmed.ncbi.nlm.nih.gov/?term="Balu%20S"[Author])

### Suresh Balu, MS, MBA

5 Duke Institute for Health Innovation, Duke University, Durham, NC 27701, United States

Find articles by [Suresh Balu](https://pubmed.ncbi.nlm.nih.gov/?term="Balu%20S"[Author])

5, [Dean F Sittig](https://pubmed.ncbi.nlm.nih.gov/?term="Sittig%20DF"[Author])

### Dean F Sittig, PhD

6 Department of Clinical and Health Informatics, University of Texas Health Science Center at Houston, Houston, TX 77030, United States

Find articles by [Dean F Sittig](https://pubmed.ncbi.nlm.nih.gov/?term="Sittig%20DF"[Author])

6

*   Author information
*   Article notes
*   Copyright and License information

1 Department of Pathology, University of Utah, Salt Lake City, UT 84112, United States

2 Department of Biomedical Informatics, University of Utah, Salt Lake City, UT 84108, United States

3 Duke Institute for Health Innovation, Duke University, Durham, NC 27701, United States

4 Research Institute, Endeavor Health, Evanston, IL 60210, United States

5 Duke Institute for Health Innovation, Duke University, Durham, NC 27701, United States

6 Department of Clinical and Health Informatics, University of Texas Health Science Center at Houston, Houston, TX 77030, United States

✉

Corresponding author: Brian R. Jackson, MD, MS, 3960 Mount Olympus Way, Salt Lake City, UT 84124, United States (brian.jackson@aruplab.com)

Received 2024 Sep 4; Revised 2024 Nov 8; Accepted 2024 Nov 19; Collection date 2025 Feb.

© The Author(s) 2024. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For permissions, please email: journals.permissions@oup.com

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC11756634  PMID: [39657218](https://pubmed.ncbi.nlm.nih.gov/39657218/)

## Abstract

### Objectives

To assess the potential to adapt an existing technology regulatory model, namely the Clinical Laboratory Improvement Amendments (CLIA), for clinical artificial intelligence (AI).

### Materials and Methods

We identify overlap in the quality management requirements for laboratory testing and clinical AI.

### Results

We propose modifications to the CLIA model that could make it suitable for oversight of clinical AI.

### Discussion

In national discussions of clinical AI, there has been surprisingly little consideration of this longstanding model for local technology oversight. While CLIA was specifically designed for laboratory testing, most of its principles are applicable to other technologies in patient care.

### Conclusion

A CLIA-like approach to regulating clinical AI would be complementary to the more centralized schemes currently under consideration, and it would ensure institutional and professional accountability for the longitudinal quality management of clinical AI.

**Keywords:** artificial intelligence, quality management, regulation, accreditation

## Introduction

Artificial intelligence (AI) is a powerful emerging technology with great potential for good and ill. The speed of innovation and scale of reach of this new technology category require robust oversight systems to ensure that AI applications are safely, effectively, and equitably integrated into healthcare. In the absence of such oversight, local validation and evaluation of AI are likely to be ad hoc and patchy.[1](#ocae296-B1) Existing device and therapeutic regulatory approaches need to be adapted and enhanced to address the unique challenges of AI-based systems in healthcare.

Regulation must take into account 2 distinctive aspects of AI. First, AI algorithms can be highly and unpredictably sensitive to subtle variations in input data. The problems of “synchronic” variation (across locations) and “diachronic” variation (across time) have been discussed in the context of adaptive systems, where an algorithm is allowed to keep “learning” over time.[2](#ocae296-B2) These problems also apply to static algorithms, however, because even if an algorithm doesn’t change, the nature of the local data inputs can change. For example, documentation practices, data definitions, and patient characteristics can vary across institutions and over time, impacting algorithm performance.

Second, AI-based systems consist of many components in addition to the statistical algorithms that attract the bulk of attention. A hypothetical application might include data acquisition and processing tools, user interfaces to present information and track follow-up actions, and communication and coordination tools that facilitate downstream treatment. It is not sufficient, therefore, to evaluate safety and efficacy based just on the technical performance of the core statistical algorithm, or at just one point in time, or in an institutional setting that differs from where it is being implemented.

Previous proposals for regulation of healthcare AI have focused on strengthening centralized product testing through Food and Drug Administration (FDA) or third-party testing labs,[3](#ocae296-B3) leveraging the Center for Medicare and Medicaid Services (CMSs) conditions of participation to require local AI product oversight,[4](#ocae296-B4) and the role of “collaborative governance” to increase coordination among centralized governors and local quality management.[5](#ocae296-B5) However, one approach remains surprisingly underexplored, namely adapting the model in which CMS has long regulated clinical laboratories’ use of testing technologies. Just like AI, laboratory tests can be highly and unpredictably sensitive to local factors, and thus require ongoing quality management by highly educated professionals. Others have argued that clinical AI requires “recurrent local postmarket performance monitoring”[6](#ocae296-B6) or “recurrent local validation,”[7](#ocae296-B7) but without identifying existing regulatory models that address this need. In this article, we describe how oversight of clinical AI systems could benefit from a model similar to CLIA.

## The CLIA model

The Clinical Laboratory Improvement Amendments of 1988 (CLIA-88), along with its associated regulations, combines technical requirements, process requirements, and professional personnel requirements in a robust combination to ensure the reliability of laboratory testing.[8](#ocae296-B8) CLIA, which is overseen by CMS in partnership with FDA and CDC, is complementary to FDA’s regulation of medical devices. In general, FDA regulates the development, manufacture, and sale of laboratory test systems (instruments and reagents), while CLIA regulates the local validation and use of those laboratory test systems in patient care within individual laboratories. A similar division of responsibilities may serve well in the governance of AI in healthcare.

Under CLIA, clinical laboratories in the United States are required to obtain a license from CMS prior to generating test results for use in patient care. Clinical laboratories are then subject to regular inspection by external accrediting agencies. CLIA requirements, which are based on the FDA-assigned complexity level of each test, address personnel qualifications, test validation and verification, ongoing quality control, calibration, and external proficiency testing. (Note that in some cases, state laws add additional requirements, notably in California and New York. Two states, New York and Washington, have their own licensing programs that are certified by CMS to satisfy CLIA.) Penalties for noncompliance can include loss of the license to perform testing. In summary, CLIA certification provides a standardized, enforceable framework for longitudinal quality management.

## Laboratory-developed tests

Historically, an important aspect of the CLIA model has been the ability of laboratories to develop and modify tests without requiring FDA review. Laboratory-developed tests (LDTs) fill important diagnostic gaps when commercial offerings do not meet local clinical needs.[9](#ocae296-B9) Criticism by the in vitro diagnostic (IVD) industry over a perceived unfair playing field, combined with concern over commercial laboratories developing proprietary assays in the form of LDTs in order to bypass FDA review, has led to the proposed (but not passed) VALID Act[10](#ocae296-B10) as well as a 2024 FDA rule that increases regulatory oversight of LDTs while still allowing their use in specific circumstances.[11](#ocae296-B11)

## Adapting the CLIA model to clinical AI

To ensure the quality, safety, and performance of AI models in clinical decision-making, the CLIA model could be adapted as follows (see also [Table 1](#ocae296-T1)):

### Table 1.

Proposed CLIA adaptations for clinical AI.

| CLIA domain | Current CLIA requirements | Proposed adaptations for AI |
| --- | --- | --- |
| Unit of licensure | Each physically separate laboratory requires a separate CLIA license. | CMS could create a licensure program for use of AI applications in clinical care (Clinical AI Ops). This might require legislation analogous to CLIA-88. |
| Risk categorization | FDA assigns a risk category (waived, moderate complexity, or high complexity) to each test based on its technical complexity and its patient care consequences. | FDA could assign stratified risk categories to AI solutions based on technical complexity and patient risk, such as the ability of humans to review, understand, and intervene before the decision affects a patient. |
| Personnel requirements | Laboratory directors must have a medical degree or PhD in an applicable field, plus applicable clinical training. | Medical directors of clinical AI Ops should have appropriate clinical and informatics education and training. |
| Validation and verification | A laboratory must validate each test, or verify the manufacturer’s validation claims, as applicable. This includes measurement of accuracy, precision, reportable range, and reference interval (“Normal range”). | AI validation requirements could include accuracy measurement and subgroup analyses based on locally collected data. For externally-developed solutions, the organization could be required to verify the developers’ claims using locally collected data. |
| Proficiency testing (external comparison) | Every laboratory is required to subscribe to an external proficiency testing program for every test for which a program is available. These programs send multiple rounds of specimens per year for testing. | An analogous program could be devised for clinical AI. The program would need to provide a series of patient data designed to stress test the AI model in different ways, in a standard format, and define the range of acceptable outputs from each AI product being studied. |
| Calibration and calibration verification | Test developers specify how often and under what circumstances calibration must be performed. This includes whenever a new regent lot is used, after instrument maintenance has been performed, and when quality control tests indicate a potential problem. | AI developers could specify both a time schedule and a list of events that trigger the need for recalibration, such as changes to the data inputs, coding systems, clinical guidelines, or user feedback. Given the dynamic nature of these factors, frequent recalibration may be required. |
| Quality control | Classically, quality control involves adding “control” samples with known concentrations of the analyte in question to each testing batch. If the statistical analysis of these results suggests a bias or other problem with the test system, then the laboratory must troubleshoot. | AI developers would need to devise tests that could be performed regularly in order to determine whether a previously validated AI solution was still performing as expected. Known problems areas that should be tested include algorithmic drift, unexpected bias, and model hallucinations. |
| Test/application development | Certified “High-complexity” laboratories are permitted to develop and modify tests for their own clinical use. CLIA defines test validation requirements, and FDA has recently announced additional regulatory requirements. | A certification program could be developed for healthcare organizations with high AI capability, allowing them to develop AI applications for internal use. FDA could define risk criteria and a threshold for subjecting these applications to FDA review. |
| Accreditation | A number of organizations are approved by CMS to inspect and accredit clinical laboratories. | Existing healthcare accreditation agencies could develop checklists and inspection programs specific to clinical AI. |

[Open in a new tab](table/ocae296-T1/)

Abbreviations: CMS, Centers for Medicare and Medicaid Services; AI, artificial intelligence; CLIA, Clinical Laboratory Improvement Amendments of 1988; FDA, Food and Drug Administration.

1.  **Licensure:** Licensing local AI Ops units would preserve accountability within local healthcare organizations where AI input data originates, and where the output will be applied in patient care. This would likely require hospitals to create new organizational structures, although in some cases existing departments might have some/all of the required elements. Similar to the case of clinical laboratories, hospitals could determine for themselves how much to centralize or de-centralize these functions, but each Clinical AI Ops unit would require its own license.
    
2.  **Risk Stratification and Categorization**: Risk may need to be both categorized by domain of impact and stratified by level of severity and potential damage. While nontrivial to define, risk categories and strata are necessary in order to define the different structures and levels of organizational capability required in order to manage different types of applications.
    
3.  **Personnel Requirements**: CLIA regulates laboratory personnel who have decision-making authority that directly impacts patient results. This includes both laboratory directors with overall quality responsibility, and certain technologists who sign off on patient results before they are released. The most obvious counterpart in the AI world would be the medical director for Clinical AI Ops, for whom the roles and responsibilities of emerging Chief AI Officers could serve as a starting point for defining education and training requirements.[12](#ocae296-B12)
    
4.  **Local Validation:** Similar to clinical laboratories, Clinical AI Ops units should be responsible for validating AI models within their local context. This includes data quality assessment, model performance evaluation, and risk assessment, and would ensure that AI models are tailored to specific patient populations and clinical settings, reducing the risk of errors. For AI platforms that can be used for multiple individual applications, it will be important that validation be performed at the level of each application. Local validation may turn out to be a more complex activity for AI than it is in the case of laboratory testing, for example involving detailed risk assessments.
    
5.  **Proficiency Testing**: When an AI application is installed in multiple different clinical settings, performance should be compared across these settings. This is analogous to how proficiency testing works in clinical laboratories, where third parties supply blinded test samples to laboratories and then publish the comparative results. CLIA specifies the scores that laboratories must receive on these challenges in order to retain their testing licenses. With AI, clear and standardized performance metrics and thresholds would similarly need to be established for AI models across institutions. One possible AI analogue to proficiency testing might be a synthesized batch of patient cases that are sent to organizations that all run a particular AI model. The outputs of the AI model could then be compared across sites as well as used to assess accuracy with the known ground truth labels.
    
6.  **Continuous Monitoring and Improvement:** CLIA’s emphasis on quality control can be adapted to monitor AI algorithm and solution performance over time, identifying potential issues and preventing adverse patient outcomes. Regular monitoring of error rates, bias, and changes in performance over time is crucial. Quality improvement frameworks specific to AI-based solutions should be in place to address identified issues. Requirements for AI product lifecycle management would also need to be delineated. Following the CLIA analogy, we anticipate that this would include requirements for local validation, ongoing quality control, periodic assessment of calibration drift, and defined criteria for re-calibration.
    
7.  **Application Development and Modification:** As with laboratory testing, the line between developing commercial products (subject to FDA review) and developing local clinically-oriented services can be hard to define. It is nonetheless important for highly capable local AI shops to be permitted to develop new apps and modify existing ones without requiring costly and time-consuming FDA review, within reasonable safety boundaries.
    
8.  **External Inspection:** accreditation organizations such as The Joint Commission could develop inspection programs to ensure compliance.
    
9.  **Transparency and Reporting:** For all AI models, whether commercial or locally developed, clear documentation of model development, validation, and performance should be maintained. Additionally, adverse events related to AI solutions use should be reported and analyzed to identify potential risks.
    

By extending a CLIA model to AI, we can achieve substantial improvements in quality, safety, economic efficiency, equity, and speed of AI adoption. A CLIA-like regulatory framework can foster local innovation by providing a predictable environment for AI development and deployment. The empowerment at a local level encourages healthcare institutions to adopt powerful models and adapt them to their specific patient population and local challenges.[13](#ocae296-B13) A CLIA-like regulatory framework could also help address the digital divide, in which many smaller organizations will lack internal expertise to rigorously manage AI systems throughout the product lifecycle. Just as clinical laboratories routinely refer specimens to academic and reference laboratories when they lack the expertise or infrastructure to perform a particular test, healthcare delivery organizations with less AI expertise could interface with certified AI Ops units in other institutions to generate test results that directly inform patient care. AI Ops units would need to maintain insight into the data sources and data management in the originating organization, roughly analogous to a reference laboratory specifying requirements for specimen collection and transport. In contrast to traditional software-as-a-service (SAAS) offerings that have become commonplace in healthcare IT, this framework would provide clinical organizations with an additional layer of regulated, clinically-accountable quality management for outsourced AI offerings.

Just as in the case of clinical laboratories, AI quality management systems will require significant resources. To the extent that the necessary capabilities and expertise currently exist, they are concentrated in high-resource academic medical centers.[14](#ocae296-B14),[15](#ocae296-B15) Reimbursement reforms and incentive payments would have to accompany regulatory reforms modeled after CLIA to build AI quality management capacity in community and rural settings. Otherwise, a digital divide will persist whereby AI quality management remains out of reach for most care delivery settings. Salaries and other costs associated with initial and ongoing quality management will need to be budgeted alongside other costs of AI platforms.

## Conclusion

AI is a powerful technology that requires robust local oversight to ensure safety, effectiveness, and ethics, for use in patient care. CLIA’s time-tested framework for regulating medical technologies with local oversight can be extended to AI. This would create a system that fosters innovation while ensuring patient safety and quality care.

## Contributor Information

Brian R Jackson, Department of Pathology, University of Utah, Salt Lake City, UT 84112, United States; Department of Biomedical Informatics, University of Utah, Salt Lake City, UT 84108, United States.

Mark P Sendak, Duke Institute for Health Innovation, Duke University, Durham, NC 27701, United States.

Anthony Solomonides, Research Institute, Endeavor Health, Evanston, IL 60210, United States.

Suresh Balu, Duke Institute for Health Innovation, Duke University, Durham, NC 27701, United States.

Dean F Sittig, Department of Clinical and Health Informatics, University of Texas Health Science Center at Houston, Houston, TX 77030, United States.

## Author contributions

All 5 authors (Brian R. Jackson, Mark P. Sendak, Anthony Solomonides, Suresh Balu, and Dean F. Sittig) contributed to the conception and design and analysis in this article. All 5 authors participated in drafting the article and reviewing it for important intellectual content. All 5 gave final approval of the version to be published, and agree to be accountable for all aspects of the work in ensuring that questions related to the accuracy or integrity of any part of the work are appropriately investigated and resolved.

## Funding

This research received no specific grant from any funding agency in the public, commercial, or not-for-profit sectors.

## Conflicts of interest

D.F.S. receives support from the Informatics Review LLC, a consulting firm specializing in Electronic Health Record safety. M.P.S. is a co-inventor of intellectual property licensed by Duke University to Clinetic Inc., KelaHealth Inc., and Cohere-Med Inc.; he holds equity in Clinetic Inc.; and he has received speaking engagement honoraria from Roche and the American Medical Association. S.B. is named co-inventor of products licensed by Duke University to CohereMed Inc., FullSteam Health Inc., and Clinetic Inc.; he holds equity in Clinetic Inc. A.S. is collaborating with Abridge AI Inc., on a clinical trial of ambient AI scribes.

## Data availability

There are no new data associated with this article.

## References

*   1. Lenharo M. How do you test AI in Medicine? Nature. 2024;632:722-724. 10.1038/d41586-024-02675-0 \[[DOI](https://doi.org/10.1038/d41586-024-02675-0)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/39169244/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nature&title=How%20do%20you%20test%20AI%20in%20Medicine?&volume=632&publication_year=2024&pages=722-724&pmid=39169244&doi=10.1038/d41586-024-02675-0&)\]
*   2. Hatherley J, Sparrow R.. Diachronic and synchronic variation in the performance of adaptive machine learning systems: the ethical challenges. J Am Med Inform Assoc. 2023;30:361-366. 10.1093/jamia/ocac218 \[[DOI](https://doi.org/10.1093/jamia/ocac218)\] \[[PMC free article](/articles/PMC9846684/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/36377970/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Diachronic%20and%20synchronic%20variation%20in%20the%20performance%20of%20adaptive%20machine%20learning%20systems:%20the%20ethical%20challenges&volume=30&publication_year=2023&pages=361-366&pmid=36377970&doi=10.1093/jamia/ocac218&)\]
*   3. Shah NH, Halamka JD, Saria S, et al. A nationwide network of health AI assurance laboratories. JAMA. 2024;331:245-249. \[[DOI](https://doi.org/10.1001/jama.2023.26930)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38117493/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=A%20nationwide%20network%20of%20health%20AI%20assurance%20laboratories&volume=331&publication_year=2024&pages=245-249&pmid=38117493&doi=10.1001/jama.2023.26930&)\]
*   4. Fleisher LA, Economou-Zavlanos NJ.. Artificial intelligence can be regulated using current patient safety procedures and infrastructure in hospitals. JAMA Health Forum. 2024;5:e241369. 10.1001/jamahealthforum.2024.1369 \[[DOI](https://doi.org/10.1001/jamahealthforum.2024.1369)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38941085/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Health%20Forum&title=Artificial%20intelligence%20can%20be%20regulated%20using%20current%20patient%20safety%20procedures%20and%20infrastructure%20in%20hospitals&volume=5&publication_year=2024&pages=e241369&pmid=38941085&doi=10.1001/jamahealthforum.2024.1369&)\]
*   5. Price WN, Sendak M, Balu S, Singh K.. Enabling collaborative governance of medical AI. Nat Mach Intell. 2023;5:821-823. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Mach%20Intell&title=Enabling%20collaborative%20governance%20of%20medical%20AI&volume=5&publication_year=2023&pages=821-823&)\]
*   6. Warraich HJ, Tazbaz T, Califf RM. FDA perspective on the regulation of artificial intelligence in health care and biomedicine. JAMA. Published online October 15, 2024. Accessed November 25, 2024. 10.1001/jama.2024.21451 \[[DOI](https://doi.org/10.1001/jama.2024.21451)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/39405330/)\]
*   7. Youssef A, Pencina M, Thakur A, Zhu T, Clifton D, Shah NH.. External validation of AI models in health should be replaced with recurring local validation. Nat Med. 2023;29:2686-2687. 10.1038/s41591-023-02540-z \[[DOI](https://doi.org/10.1038/s41591-023-02540-z)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37853136/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Med&title=External%20validation%20of%20AI%20models%20in%20health%20should%20be%20replaced%20with%20recurring%20local%20validation&volume=29&publication_year=2023&pages=2686-2687&pmid=37853136&doi=10.1038/s41591-023-02540-z&)\]
*   8. U.S. Food and Drug Administration. Laboratory developed tests final rule. Published 6 May 2024. Accessed November 25, 2024. [https://www.federalregister.gov/documents/2024/05/06/2024-08935/medical-devices-laboratory-developed-tests](https://www.federalregister.gov/documents/2024/05/06/2024-08935/medical-devices-laboratory-developed-tests)
*   9. Snozek CLH. FDA-cleared versus laboratory developed tests: why start from scratch when kits are available? J Appl Lab Med. 2017;2:130-131. \[[DOI](https://doi.org/10.1373/jalm.2016.021832)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33636963/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Appl%20Lab%20Med&title=FDA-cleared%20versus%20laboratory%20developed%20tests:%20why%20start%20from%20scratch%20when%20kits%20are%20available?&volume=2&publication_year=2017&pages=130-131&pmid=33636963&doi=10.1373/jalm.2016.021832&)\]
*   10. Genzen JR. Regulation of laboratory-developed tests. Am J Clin Pathol. 2019;152:122-131. 10.1093/ajcp/aqz096 \[[DOI](https://doi.org/10.1093/ajcp/aqz096)\] \[[PMC free article](/articles/PMC6610067/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31242284/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Clin%20Pathol&title=Regulation%20of%20laboratory-developed%20tests&volume=152&publication_year=2019&pages=122-131&pmid=31242284&doi=10.1093/ajcp/aqz096&)\]
*   11. 42 CFR Part 493—Laboratory Requirements. United States Code of Federal Regulations. Accessed July 8, 2024. [https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-493](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-493)
*   12. Beecy AN, Longhurst CA, Singh K, Wachter RM, Murray SG.. The chief health AI officer—an emerging role for an emerging technology. NEJM AI. 2024;1. 10.1056/AIp2400109 \[[DOI](https://doi.org/10.1056/AIp2400109)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NEJM%20AI&title=The%20chief%20health%20AI%20officer%E2%80%94an%20emerging%20role%20for%20an%20emerging%20technology&volume=1&publication_year=2024&doi=10.1056/AIp2400109&)\]
*   13. Sendak MP, Liu VX, Beecy A, et al. Strengthening the use of artificial intelligence within healthcare delivery organizations: balancing regulatory compliance and patient safety. J Am Med Inform Assoc. 2024;31:ocae119-1627. \[[DOI](https://doi.org/10.1093/jamia/ocae119)\] \[[PMC free article](/articles/PMC11187419/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38767890/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Strengthening%20the%20use%20of%20artificial%20intelligence%20within%20healthcare%20delivery%20organizations:%20balancing%20regulatory%20compliance%20and%20patient%20safety&volume=31&publication_year=2024&pages=ocae119-1627&pmid=38767890&doi=10.1093/jamia/ocae119&)\]
*   14. Nong P, Hamasha R, Singh K, Adler-Milstein J, Platt J.. How academic medical centers govern AI prediction tools in the context of uncertainty and evolving regulation. NEJM AI. 2024;1. 10.1056/AIp2300048 \[[DOI](https://doi.org/10.1056/AIp2300048)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NEJM%20AI&title=How%20academic%20medical%20centers%20govern%20AI%20prediction%20tools%20in%20the%20context%20of%20uncertainty%20and%20evolving%20regulation&volume=1&publication_year=2024&doi=10.1056/AIp2300048&)\]
*   15. Kim JY, Boag W, Gulamali F, et al. Organizational governance of emerging technologies: AI Adoption in healthcare. In: _FAccT 2023: Proceedings of the 2023 ACM Conference on Fairness, Accountability, and Transparency_. Published online June 12, 2023. Accessed November 25, 2024. 10.1145/3593013.3594089 \[[DOI](https://doi.org/10.1145/3593013.3594089)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Data Availability Statement

There are no new data associated with this article.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**