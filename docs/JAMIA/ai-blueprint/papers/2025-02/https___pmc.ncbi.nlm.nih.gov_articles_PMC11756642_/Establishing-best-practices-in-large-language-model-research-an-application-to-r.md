J Am Med Inform Assoc

. 2024 Dec 4;32(2):386–390. doi: [10.1093/jamia/ocae294](https://doi.org/10.1093/jamia/ocae294)

# Establishing best practices in large language model research: an application to repeat prompting

[Robert J Gallo](https://pubmed.ncbi.nlm.nih.gov/?term="Gallo%20RJ"[Author])

### Robert J Gallo, MD

1 Center for Innovation to Implementation, VA Palo Alto Health Care System, Menlo Park, CA 94025, United States

2 Department of Health Policy, Stanford University, Stanford, CA 94305, United States

Find articles by [Robert J Gallo](https://pubmed.ncbi.nlm.nih.gov/?term="Gallo%20RJ"[Author])

1,2,✉, [Michael Baiocchi](https://pubmed.ncbi.nlm.nih.gov/?term="Baiocchi%20M"[Author])

### Michael Baiocchi, PhD

3 Department of Epidemiology and Population Health, Stanford University, Stanford, CA 94305, United States

Find articles by [Michael Baiocchi](https://pubmed.ncbi.nlm.nih.gov/?term="Baiocchi%20M"[Author])

3, [Thomas R Savage](https://pubmed.ncbi.nlm.nih.gov/?term="Savage%20TR"[Author])

### Thomas R Savage, MD

4 Division of Hospital Medicine, Stanford University, Stanford, CA 94305, United States

Find articles by [Thomas R Savage](https://pubmed.ncbi.nlm.nih.gov/?term="Savage%20TR"[Author])

4, [Jonathan H Chen](https://pubmed.ncbi.nlm.nih.gov/?term="Chen%20JH"[Author])

### Jonathan H Chen, MD, PhD

5 Division of Hospital Medicine, Stanford University, Stanford, CA 94305, United States

6 Stanford Center for Biomedical Informatics Research, Stanford University, Stanford, CA 94304, United States

7 Clinical Excellence Research Center, Stanford University, Stanford, CA 94305, United States

Find articles by [Jonathan H Chen](https://pubmed.ncbi.nlm.nih.gov/?term="Chen%20JH"[Author])

5,6,7

*   Author information
*   Article notes
*   Copyright and License information

1 Center for Innovation to Implementation, VA Palo Alto Health Care System, Menlo Park, CA 94025, United States

2 Department of Health Policy, Stanford University, Stanford, CA 94305, United States

3 Department of Epidemiology and Population Health, Stanford University, Stanford, CA 94305, United States

4 Division of Hospital Medicine, Stanford University, Stanford, CA 94305, United States

5 Division of Hospital Medicine, Stanford University, Stanford, CA 94305, United States

6 Stanford Center for Biomedical Informatics Research, Stanford University, Stanford, CA 94304, United States

7 Clinical Excellence Research Center, Stanford University, Stanford, CA 94305, United States

✉

Corresponding author: Robert J. Gallo, MD, Center for Innovation to Implementation, VA Palo Alto Health Care System, 795 Willow Road (152-MPD), Menlo Park, CA 94025, United States (rjgallo@stanford.edu)

Received 2024 Aug 12; Revised 2024 Oct 17; Accepted 2024 Nov 18; Collection date 2025 Feb.

© The Author(s) 2024. Published by Oxford University Press on behalf of the American Medical Informatics Association.

This is an Open Access article distributed under the terms of the Creative Commons Attribution License ([https://creativecommons.org/licenses/by/4.0/](https://creativecommons.org/licenses/by/4.0/)), which permits unrestricted reuse, distribution, and reproduction in any medium, provided the original work is properly cited.

[PMC Copyright notice](/about/copyright/)

PMCID: PMC11756642  PMID: [39656836](https://pubmed.ncbi.nlm.nih.gov/39656836/)

## Abstract

### Objectives

We aimed to demonstrate the importance of establishing best practices in large language model research, using repeat prompting as an illustrative example.

### Materials and Methods

Using data from a prior study investigating potential model bias in peer review of medical abstracts, we compared methods that ignore correlation in model outputs from repeated prompting with a random effects method that accounts for this correlation.

### Results

High correlation within groups was found when repeatedly prompting the model, with intraclass correlation coefficient of 0.69. Ignoring the inherent correlation in the data led to over 100-fold inflation of effective sample size. After appropriately accounting for this issue, the authors’ results reverse from a small but highly significant finding to no evidence of model bias.

### Discussion

The establishment of best practices for LLM research is urgently needed, as demonstrated in this case where accounting for repeat prompting in analyses was critical for accurate study conclusions.

**Keywords:** large language model, peer review, multilevel analysis

## Background

While large language models (LLMs) have shown promise for many medical applications, the rapid evolution of the field may have outpaced the development of robust research practices. For example, it is often necessary to evaluate stability and uncertainty in model responses, as LLMs have randomness built into their outputs. Repeat prompting can therefore be helpful to capture variation in model outputs,[1](#ocae294-B1),[2](#ocae294-B2) with studies in a number of medical journals utilizing this method.[3–7](#ocae294-B3) Adding additional observations for the same or similar prompts can be trivial from the researcher’s perspective given ease of repeatedly prompting the model, tempting researchers to increase sample size by orders of magnitude. However, this practice leads to additional methodological considerations that may not be familiar to researchers, with implications for study conclusions if ignored.

Model outputs to repeat prompting are likely to be strongly correlated leading to violations of the independence assumption for many statistical tests.[8–10](#ocae294-B8) This is analogous to prompting a single individual to answer a survey question 250 times in a manner that they do not remember their previous responses, but then analyzing the data using methods that assume the responses came from 250 different individuals. We would expect responses from a single individual to be highly correlated with less variation than responses from 250 individuals, leading to artificially small CIs and _P_\-values.[11](#ocae294-B11) Despite this intuition, others have suggested that LLM responses to repeat prompting might rather represent independent samples given model complexity and randomness, with further evaluation needed to establish consensus.[12](#ocae294-B12)

## Objective

In this study, we sought to determine the importance of accounting for correlation in repeat prompting of LLMs and its effect on research conclusions in order to explore best practices. We use data from a study on affiliation bias in peer review of medical abstracts by an LLM as an instructive example.[3](#ocae294-B3)

## Methods

### Study design

The data utilized for the study have been described previously, with GPT-3.5 prompted to review and decide on acceptance for 30 abstracts.[3](#ocae294-B3) Each abstract was duplicated and attached with 30 different university affiliations categorized into 3 tiers, for a total of 900 abstract-affiliation combinations.[3](#ocae294-B3) The university affiliations were obtained by prompting ChatGPT to provide examples of 10 “top-tier”, 10 “mid-tier”, and 10 “low-tier” medical research universities so that the tiers used in the study would best reflect any potential bias encoded in the model. The authors repeatedly prompted the model 250 times for each abstract-affiliation combination, for a total sample of 225 000 observations. The original authors used a difference in proportions test to evaluate the hypothesis that the model would be biased to more likely accept abstracts attached with higher tier affiliations.

We also provide an example in the [Supplementary Material](#sup1) where repeat prompting was performed with variations in the prompt, which may lead to more randomness, and therefore less correlation, in outputs. For this example, we use data from our prior study evaluating 5 different prompting strategies for diagnostic reasoning.[13](#ocae294-B13) That previously published study compared diagnostic accuracy across prompting strategies, but for this purpose we compare the correlation of outputs from the variations in prompting.

### Statistical analysis

In this secondary analysis, we use a mixed-effects logistic regression model to account for correlation in repeat prompts compared to a simple logistic regression model that assumes independence of observations, similar to the analysis used in the original study. Random effects for abstract and affiliation were included in the mixed-effects model to account for repeat prompting, as considering either alone would not capture correlation at the abstract-affiliation combination level. Although statistical models should be constructed to fit the data-generating process and not based on statistical tests for model fit, this was also tested with empirical measures for model fit such as Akaike information criteria (AIC), Bayesian information criteria (BIC), and likelihood ratio tests.

Besides implications for appropriate statistical estimates, CIs, and _P_\-values, the amount of correlation with repeat prompting may be of interest itself, especially for study design considerations such as sample size and power calculations. The intraclass correlation coefficient (ICC) was calculated from the mixed-effects model to describe the similarity of observations within groups compared to between groups.[10](#ocae294-B10) The ICC was then used to estimate the effective sample size per grouping after accounting for correlation.[14](#ocae294-B14)

In order to inform future LLM study designs, power calculations were performed using methods for cluster randomized trials with varying ICC and number of repeat prompts per group.[10](#ocae294-B10) Power calculations assumed 300 groupings of repeat prompts per arm, as in this study. Additionally, power calculations require a minimal difference to be detected, which was assumed to be 5 percentage points in the difference in mean acceptance between groups, with the lower tier group assumed to have an acceptance rate of 35%. The statistical code provided in the [Supplementary Material](#sup1) can be adapted by researchers to improve the rigor of planned future studies.

All analyses used 2-sided hypothesis tests with a significance level of _P_ < .05. Analyses were performed in R, version 4.4.0 (R Project for Statistical Computing), with code used for all analyses provided in the [Supplementary Material](#sup1).

## Results

As previously reported, average acceptance rate for top-tier affiliations was 38.4%, mid-tier 37.5%, and low-tier 36.7%. Simple logistic regression estimated an odds ratio of acceptance for abstracts with top-tier compared to mid-tier affiliation of 1.04 (95% CI, 1.02-1.06) which was highly statistically significant (_P_ < .001). Comparing low-tier to mid-tier affiliations also demonstrated a small but highly statistically significant result (OR 0.97, 95% CI, 0.95-0.99; _P_ = .002).

[Table 1](#ocae294-T1) shows the results from the mixed-effects model as well as the simple logistic regression model that assumes independence of observations. The comparisons between tiers go from highly statistically significant with simple logistic regression to no longer statistically significant when appropriately accounting for correlation of repeat prompts. This model with random effects for abstract and affiliation was compared to a model with a random effect for abstract alone and found to better fit the data based on AIC (181 072 vs 181 579), BIC (181 123 vs 181 621), and log likelihood (−90 531 vs −90 786; _P_ < .001).

### Table 1.

Comparison of simple and random effects logistic regression.

|  | Simple logistic regression |  | Random effects logistic regression |  |
| --- | --- | --- | --- | --- |
|  | Odds ratio (95% CI) | P | Odds ratio (95% CI) | P |
| Top-tier | 1.04 (1.02-1.06) | <.001 | 1.07 (0.95-1.22) | .27 |
| Low-tier | 0.97 (0.95-0.99) | .002 | 0.94 (0.83-1.07) | .36 |

[Open in a new tab](table/ocae294-T1/)

Mid-tier affiliations used as the reference group for all comparisons. The mixed-effects model included random effects for abstract and affiliation.

The ICC from the random effects model was found to be 0.69, where 0 represents no correlation and 1 represents complete correlation within groups. Using this ICC would estimate an effective sample size of 1.45 out of 250 observations per abstract-affiliation combination. [Figure 1](#ocae294-F1) shows the effective sample sizes with varying ICCs from 0.1 to 0.69. Power decreased from 100% to 33% when accounting for correlation in repeat prompts. [Figure 2](#ocae294-F2) shows the power by ICC and number of repeat prompts per group. The [Supplementary Material](#sup1) reports results from the example using variation in prompting, with an ICC of 0.73.

### Figure 1.

[![Figure demonstrating effective sample size per prompt by intraclass correlation coefficient for varying number of repeat prompts.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/5ecf/11756642/0484bda9f2a9/ocae294f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756642_ocae294f1.jpg)

[Open in a new tab](figure/ocae294-F1/)

Effective sample size by intraclass correlation coefficient. Abbreviation: ICC, intraclass correlation coefficient. Repeat prompts refer to the number of repeats per grouping (ie, distinct prompt). Effective sample size is per grouping. An ICC of 0 would indicate no correlation and the effective sample size per grouping would be the same as the number within that grouping. An ICC of 0.69 was observed in this study.

### Figure 2.

[![Figure demonstrating study power for varying intraclass correlation coefficients and number of repeat prompts.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/5ecf/11756642/254754f0afea/ocae294f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756642_ocae294f2.jpg)

[Open in a new tab](figure/ocae294-F2/)

Power by intraclass correlation coefficient. Abbreviation: ICC, intraclass correlation coefficient. Repeat prompts refer to the number of repeats per grouping (ie, distinct prompt). Power calculations assume 300 groupings per arm, 5 percentage point difference between arms, and 35% acceptance rate in the comparator arm.

## Discussion

We show that responses from repeat prompting of LLMs can be highly correlated, contrary to suggestions that repeat prompting may be thought of as independent samples.[12](#ocae294-B12) Ignoring this correlation leads to artificially narrow CIs and small _P_\-values. Properly accounting for repeat prompting effectively decreased sample size by over 100-fold and decreased power by a factor of 3 in this case. The study results go from highly statistically significant to not significant with the appropriate analysis that accounts for repeat prompting, essentially nullifying the study’s conclusions.

Beyond this individual example, repeat prompting appears common in medical LLM studies.[3–7](#ocae294-B3) Repeat prompting can be helpful for measuring stability and uncertainty in model responses, and should be encouraged in study design[1](#ocae294-B1),[2](#ocae294-B2); however, this should not come at the expense of appropriate analysis methods. Fortunately, flexible methods exist to measure and account for this correlation in repeat prompting, such as the mixed-effects model used in the current analysis.[15](#ocae294-B15) Future studies can plan for correlation in repeat prompting using methods that have been well characterized for cluster randomized trials and other fields that deal with the same issues of data dependency.[10](#ocae294-B10),[14](#ocae294-B14),[16–18](#ocae294-B16) For instance, in this study the authors could have performed a power calculation incorporating clustering, which would have led them to include additional abstracts to achieve adequate power to answer their research question.

Large language models introduce novel evaluation and reporting complexities considering their generative and probabilistic nature, which differs from other clinical decision support tools. Given the relative recency of this field, there has been limited time to establish best practices. Current efforts include model evaluation frameworks, such as the United Kingdom AI Safety Institute’s “Inspect” open-source framework.[19](#ocae294-B19) Additionally, multiple groups are working on reporting guidelines for studies evaluating LLMs specifically in healthcare.[20](#ocae294-B20) Future efforts should include guidance on handling the probabilistic nature of LLMs, such as evaluating stability of model responses. We show that repeat prompting and prompting variations lead to substantial data dependency and should not be assumed to be independent observations, which could be incorporated into guidelines and evaluation frameworks.

This study observed an ICC of 0.69, which is relatively high, and other studies may find lower correlation within repeat prompt groupings in which models have more uncertainty. On the other hand, lower temperature settings may lead to even higher correlations since randomness would be expected to decrease as temperature decreases. Still, some models may not be completely deterministic even at temperature of zero, such as the GPT family of models. Future research could better characterize typical ICC values in LLM outputs, potentially even by type of task such as medical diagnosis, medical record summarization, patient question-answering, peer review, etc. However, the figures show that effective sample size and study power drop significantly even at lower ICC values, so accounting for correlation is nonetheless necessary for study design and statistical analyses.

## Conclusion

Rigorous evaluations of LLMs are urgently needed prior to employing this promising technology in medical settings, with stability and uncertainty in model responses an important component of any evaluation. The rapidly evolving field may outpace the ability of the scientific community to reach consensus on best practices, although there are opportunities to learn from other fields that have explored similar issues. We show that accounting for correlation in repeated prompting of LLMs is critical for valid study design and even reversed study conclusions in this case.

## Supplementary Material

ocae294\_Supplementary\_Data

[ocae294\_supplementary\_data.pdf](/articles/instance/11756642/bin/ocae294_supplementary_data.pdf) (341.1KB, pdf)

## Contributor Information

Robert J Gallo, Center for Innovation to Implementation, VA Palo Alto Health Care System, Menlo Park, CA 94025, United States; Department of Health Policy, Stanford University, Stanford, CA 94305, United States.

Michael Baiocchi, Department of Epidemiology and Population Health, Stanford University, Stanford, CA 94305, United States.

Thomas R Savage, Division of Hospital Medicine, Stanford University, Stanford, CA 94305, United States.

Jonathan H Chen, Division of Hospital Medicine, Stanford University, Stanford, CA 94305, United States; Stanford Center for Biomedical Informatics Research, Stanford University, Stanford, CA 94304, United States; Clinical Excellence Research Center, Stanford University, Stanford, CA 94305, United States.

## Author contributions

Robert J. Gallo and Jonathan H. Chen (Conceptualization); Robert J. Gallo and Michael Baiocchi (Methodology); Robert J. Gallo and Thomas R. Savage (Data Curation); Robert J. Gallo (Formal analysis); Robert J. Gallo (Writing-Original draft); All authors (Writing-Review & editing); Jonathan H. Chen and Michael Baiocchi (Supervision).

## Supplementary material

[Supplementary material](#sup1) is available at [_Journal of the American Medical Informatics Association_](https://academic.oup.com/jamia) online.

## Funding

R.J.G. is supported by a VA Advanced Fellowship in Medical Informatics. The contents of this article do not represent the views of the VA or the United States Government. J.H.C. has received research grant funding from the National Institute of Allergy and Infectious Diseases (1R01AI17812101), National Institute on Drug Abuse Clinical Trials Network (UG1DA015815—CTN-0136), National Center for Advancing Translational Sciences’s Clinical and Translational Science Award (UL1TR003142), the Gordon and Betty Moore Foundation (Grant #12409), Stanford Artificial Intelligence in Medicine and Imaging—Human-Centered Artificial Intelligence (AIMI-HAI) Partnership Grant, Stanford Institute for Human-Centered Artificial Intelligence (HAI), Google, Inc. (research collaboration to leverage EHR data to predict clinical outcomes), Stanford Bio-X Interdisciplinary Seed Grants Program (IIP) \[R12\], and American Heart Association—Strategically Focused Research Network—Diversity in Clinical Trials. Funders had no role in study design, data collection, data analysis, data interpretation, or writing of the report.

## Conflicts of interest

JHC reports being a co-founder of Reaction Explorer LLC that develops and licenses organic chemistry education software; paid consulting fees from Sutton Pierce, Younker Hyde MacFarlane, and Sykes McAllister as a medical expert witness; paid consulting fees from ISHI Health.

## Data availability

The data underlying this article are available in the online [Supplementary Material](#sup1).

## References

*   1. Perlis RH, Fihn SD.. Evaluating the application of large language models in clinical research contexts. JAMA Netw Open. 2023;6:e2335924. 10.1001/jamanetworkopen.2023.35924 \[[DOI](https://doi.org/10.1001/jamanetworkopen.2023.35924)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37782501/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open&title=Evaluating%20the%20application%20of%20large%20language%20models%20in%20clinical%20research%20contexts&volume=6&publication_year=2023&pages=e2335924&pmid=37782501&doi=10.1001/jamanetworkopen.2023.35924&)\]
*   2. Savage T, Wang J, Gallo R, et al. Large language model uncertainty proxies: discrimination and calibration for medical diagnosis and treatment. J Am Med Inform Assoc. 2024:ocae254. 10.1093/jamia/ocae254 \[[DOI](https://doi.org/10.1093/jamia/ocae254)\] \[[PMC free article](/articles/PMC11648734/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/39396184/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Large%20language%20model%20uncertainty%20proxies:%20discrimination%20and%20calibration%20for%20medical%20diagnosis%20and%20treatment&publication_year=2024&pages=ocae254&pmid=39396184&doi=10.1093/jamia/ocae254&)\]
*   3. von Wedel D, Schmitt RA, Thiele M, et al. Affiliation bias in peer review of abstracts by a large language model. JAMA. 2024;331:252-253. 10.1001/jama.2023.24641 \[[DOI](https://doi.org/10.1001/jama.2023.24641)\] \[[PMC free article](/articles/PMC10753437/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38150261/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=Affiliation%20bias%20in%20peer%20review%20of%20abstracts%20by%20a%20large%20language%20model&volume=331&publication_year=2024&pages=252-253&pmid=38150261&doi=10.1001/jama.2023.24641&)\]
*   4. Hager P, Jungmann F, Holland R, et al. Evaluation and mitigation of the limitations of large language models in clinical decision-making. Nat Med. 2024;30:2613-2622. 10.1038/s41591-024-03097-1 \[[DOI](https://doi.org/10.1038/s41591-024-03097-1)\] \[[PMC free article](/articles/PMC11405275/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38965432/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Med&title=Evaluation%20and%20mitigation%20of%20the%20limitations%20of%20large%20language%20models%20in%20clinical%20decision-making&volume=30&publication_year=2024&pages=2613-2622&pmid=38965432&doi=10.1038/s41591-024-03097-1&)\]
*   5. Zack T, Lehman E, Suzgun M, et al. Assessing the potential of GPT-4 to perpetuate racial and gender biases in health care: a model evaluation study. Lancet Digit Health. 2024;6:e12-e22. \[[DOI](https://doi.org/10.1016/S2589-7500\(23\)00225-X)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38123252/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Lancet%20Digit%20Health&title=Assessing%20the%20potential%20of%20GPT-4%20to%20perpetuate%20racial%20and%20gender%20biases%20in%20health%20care:%20a%20model%20evaluation%20study&volume=6&publication_year=2024&pages=e12-e22&pmid=38123252&doi=10.1016/S2589-7500\(23\)00225-X&)\]
*   6. Katz U, Cohen E, Shachar E, et al. GPT versus resident physicians—a benchmark based on official board scores. NEJM AI. 2024;1. 10.1056/AIdbp2300192 \[[DOI](https://doi.org/10.1056/AIdbp2300192)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NEJM%20AI&title=GPT%20versus%20resident%20physicians%E2%80%94a%20benchmark%20based%20on%20official%20board%20scores&volume=1&publication_year=2024&doi=10.1056/AIdbp2300192&)\]
*   7. Wang L, Chen X, Deng X, et al. Prompt engineering in consistency and reliability with the evidence-based guideline for LLMs. NPJ Digit Med. 2024;7:41. 10.1038/s41746-024-01029-4 \[[DOI](https://doi.org/10.1038/s41746-024-01029-4)\] \[[PMC free article](/articles/PMC10879172/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38378899/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NPJ%20Digit%20Med&title=Prompt%20engineering%20in%20consistency%20and%20reliability%20with%20the%20evidence-based%20guideline%20for%20LLMs&volume=7&publication_year=2024&pages=41&pmid=38378899&doi=10.1038/s41746-024-01029-4&)\]
*   8. Bland JM, Altman DG, Statistics N.. Correlation, regression, and repeated data. BMJ. 1994;308:896-896. 10.1136/bmj.308.6933.896 \[[DOI](https://doi.org/10.1136/bmj.308.6933.896)\] \[[PMC free article](/articles/PMC2539813/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/8173371/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMJ&title=Correlation,%20regression,%20and%20repeated%20data&volume=308&publication_year=1994&pages=896-896&pmid=8173371&doi=10.1136/bmj.308.6933.896&)\]
*   9. Riley RD, Cole TJ, Deeks J, et al. On the 12th day of Christmas, a statistician sent to me. BMJ. 2022;379:e072883. 10.1136/bmj-2022-072883 \[[DOI](https://doi.org/10.1136/bmj-2022-072883)\] \[[PMC free article](/articles/PMC9844255/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/36593578/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMJ&title=On%20the%2012th%20day%20of%20Christmas,%20a%20statistician%20sent%20to%20me&volume=379&publication_year=2022&pages=e072883&pmid=36593578&doi=10.1136/bmj-2022-072883&)\]
*   10. Hemming K, Eldridge S, Forbes G, et al. How to design efficient cluster randomised trials. BMJ. 2017;358:j3064. 10.1136/bmj.j3064 \[[DOI](https://doi.org/10.1136/bmj.j3064)\] \[[PMC free article](/articles/PMC5508848/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28710062/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMJ&title=How%20to%20design%20efficient%20cluster%20randomised%20trials&volume=358&publication_year=2017&pages=j3064&pmid=28710062&doi=10.1136/bmj.j3064&)\]
*   11. Gallo RJ, Savage T, Chen JH.. Affiliation bias in peer review of abstracts. JAMA. 2024;331:1234-1235. 10.1001/jama.2024.3520 \[[DOI](https://doi.org/10.1001/jama.2024.3520)\] \[[PMC free article](/articles/PMC12004078/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38592392/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=Affiliation%20bias%20in%20peer%20review%20of%20abstracts&volume=331&publication_year=2024&pages=1234-1235&pmid=38592392&doi=10.1001/jama.2024.3520&)\]
*   12. von Wedel D, Shay D, Schaefer MS.. Affiliation bias in peer review of abstracts—reply. JAMA. 2024;331:1235-1236. 10.1001/jama.2024.3523 \[[DOI](https://doi.org/10.1001/jama.2024.3523)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38592389/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=Affiliation%20bias%20in%20peer%20review%20of%20abstracts%E2%80%94reply&volume=331&publication_year=2024&pages=1235-1236&pmid=38592389&doi=10.1001/jama.2024.3523&)\]
*   13. Savage T, Nayak A, Gallo R, et al. Diagnostic reasoning prompts reveal the potential for large language model interpretability in medicine. NPJ Digit Med. 2024;7:20. \[[DOI](https://doi.org/10.1038/s41746-024-01010-1)\] \[[PMC free article](/articles/PMC10808088/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38267608/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NPJ%20Digit%20Med&title=Diagnostic%20reasoning%20prompts%20reveal%20the%20potential%20for%20large%20language%20model%20interpretability%20in%20medicine&volume=7&publication_year=2024&pages=20&pmid=38267608&doi=10.1038/s41746-024-01010-1&)\]
*   14. Rutterford C, Copas A, Eldridge S.. Methods for sample size determination in cluster randomized trials. Int J Epidemiol. 2015;44:1051-1067. 10.1093/ije/dyv113 \[[DOI](https://doi.org/10.1093/ije/dyv113)\] \[[PMC free article](/articles/PMC4521133/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26174515/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Int%20J%20Epidemiol&title=Methods%20for%20sample%20size%20determination%20in%20cluster%20randomized%20trials&volume=44&publication_year=2015&pages=1051-1067&pmid=26174515&doi=10.1093/ije/dyv113&)\]
*   15. Gelman A, Hill J.. Data Analysis Using Regression and Multilevel/Hierarchical Models. Cambridge University Press; 2006. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Data%20Analysis%20Using%20Regression%20and%20Multilevel/Hierarchical%20Models&publication_year=2006&)\]
*   16. Krippendorff K. Content Analysis: An Introduction to its Methodology. Sage Publications; 2018. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Content%20Analysis:%20An%20Introduction%20to%20its%20Methodology&publication_year=2018&)\]
*   17. Moulton BR. Random group effects and the precision of regression estimates. J Econom. 1986;32:385-397. 10.1016/0304-4076(86)90021-7 \[[DOI](https://doi.org/10.1016/0304-4076\(86\)90021-7)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Econom&title=Random%20group%20effects%20and%20the%20precision%20of%20regression%20estimates&volume=32&publication_year=1986&pages=385-397&doi=10.1016/0304-4076\(86\)90021-7&)\]
*   18. Goh E, Gallo R, Hom J, et al. Large language model influence on diagnostic reasoning: a randomized clinical trial. JAMA Netw Open. 2024;7:e2440969. \[[DOI](https://doi.org/10.1001/jamanetworkopen.2024.40969)\] \[[PMC free article](/articles/PMC11519755/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/39466245/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open&title=Large%20language%20model%20influence%20on%20diagnostic%20reasoning:%20a%20randomized%20clinical%20trial&volume=7&publication_year=2024&pages=e2440969&pmid=39466245&doi=10.1001/jamanetworkopen.2024.40969&)\]
*   19. UK AI Safety Institute. Inspect AI: framework for large language model evaluations. 2024. [https://www.aisi.gov.uk](https://www.aisi.gov.uk)
*   20. Gallifant J, Afshar M, Ameen S, et al. The TRIPOD-LLM statement: a targeted guideline for reporting large language models use. medRxiv \[Preprint\]. 2024 Jul 25:2024.07.24.24310930. 10.1101/2024.07.24.24310930 \[[DOI](https://doi.org/10.1101/2024.07.24.24310930)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae294\_Supplementary\_Data

[ocae294\_supplementary\_data.pdf](/articles/instance/11756642/bin/ocae294_supplementary_data.pdf) (341.1KB, pdf)

### Data Availability Statement

The data underlying this article are available in the online [Supplementary Material](#sup1).

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**