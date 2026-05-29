J Am Med Inform Assoc

. 2025 Jan 26;32(4):656–664. doi: [10.1093/jamia/ocae313](https://doi.org/10.1093/jamia/ocae313)

# Communication-efficient federated learning of temporal effects on opioid use disorder with data from distributed research networks

[C Jason Liang](https://pubmed.ncbi.nlm.nih.gov/?term="Liang%20CJ"[Author])

### C Jason Liang, PhD

1 Biostatistics Research Branch, National Institute of Allergy and Infectious Diseases, Bethesda, MD 20892, United States

Find articles by [C Jason Liang](https://pubmed.ncbi.nlm.nih.gov/?term="Liang%20CJ"[Author])

1, [Chongliang Luo](https://pubmed.ncbi.nlm.nih.gov/?term="Luo%20C"[Author])

### Chongliang Luo, PhD

2 Division of Public Health Sciences, Washington University School of Medicine, St Louis, MO 63110, United States

3 Department of Biostatistics, Epidemiology and Informatics, University of Pennsylvania, Philadelphia, PA 19104, United States

Find articles by [Chongliang Luo](https://pubmed.ncbi.nlm.nih.gov/?term="Luo%20C"[Author])

2,3, [Henry R Kranzler](https://pubmed.ncbi.nlm.nih.gov/?term="Kranzler%20HR"[Author])

### Henry R Kranzler, MD

4 Department of Psychiatry, University of Pennsylvania, Philadelphia, PA 19104, United States

Find articles by [Henry R Kranzler](https://pubmed.ncbi.nlm.nih.gov/?term="Kranzler%20HR"[Author])

4, [Jiang Bian](https://pubmed.ncbi.nlm.nih.gov/?term="Bian%20J"[Author])

### Jiang Bian, PhD

5 Department of Health Outcomes and Biomedical Informatics, University of Florida, Gainesville, FL 32610, United States

Find articles by [Jiang Bian](https://pubmed.ncbi.nlm.nih.gov/?term="Bian%20J"[Author])

5, [Yong Chen](https://pubmed.ncbi.nlm.nih.gov/?term="Chen%20Y"[Author])

### Yong Chen, PhD

6 Department of Biostatistics, Epidemiology and Informatics, University of Pennsylvania, Philadelphia, PA 19104, United States

7 Center for Health AI and Synthesis of Evidence, University of Pennsylvania, Philadelphia, PA 19104, United States

Find articles by [Yong Chen](https://pubmed.ncbi.nlm.nih.gov/?term="Chen%20Y"[Author])

6,7,✉

*   Author information
*   Article notes
*   Copyright and License information

1 Biostatistics Research Branch, National Institute of Allergy and Infectious Diseases, Bethesda, MD 20892, United States

2 Division of Public Health Sciences, Washington University School of Medicine, St Louis, MO 63110, United States

3 Department of Biostatistics, Epidemiology and Informatics, University of Pennsylvania, Philadelphia, PA 19104, United States

4 Department of Psychiatry, University of Pennsylvania, Philadelphia, PA 19104, United States

5 Department of Health Outcomes and Biomedical Informatics, University of Florida, Gainesville, FL 32610, United States

6 Department of Biostatistics, Epidemiology and Informatics, University of Pennsylvania, Philadelphia, PA 19104, United States

7 Center for Health AI and Synthesis of Evidence, University of Pennsylvania, Philadelphia, PA 19104, United States

✉

Corresponding author: Yong Chen, PhD, University of Pennsylvania School of Medicine, 423 Guardian Drive, Philadelphia, PA 19104, United States (ychen123@upenn.edu)

Received 2024 May 13; Revised 2024 Nov 30; Accepted 2024 Dec 20; Collection date 2025 Apr.

© The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC12005629  PMID: [39864407](https://pubmed.ncbi.nlm.nih.gov/39864407/)

## Abstract

### Objective

To develop a distributed algorithm to fit multi-center Cox regression models with time-varying coefficients to facilitate privacy-preserving data integration across multiple health systems.

### Materials and Methods

The Cox model with time-varying coefficients relaxes the proportional hazards assumption of the usual Cox model and is particularly useful to model time-to-event outcomes. We proposed a One-shot Distributed Algorithm to fit multi-center Cox regression models with Time varying coefficients (ODACT). This algorithm constructed a surrogate likelihood function to approximate the Cox partial likelihood function, using patient-level data from a lead site and aggregated data from other sites. The performance of ODACT was demonstrated by simulation and a real-world study of opioid use disorder (OUD) using decentralized data from a large clinical research network across 5 sites with 69 163 subjects.

### Results

The ODACT method precisely estimated the time-varying effects over time. In the simulation study, ODACT always achieved estimation close to that of the pooled analysis, while the meta-estimator showed considerable amount of bias. In the OUD study, the bias of the estimated hazard ratios by ODACT are smaller than those of the meta-estimator for all 7 risk factors at almost all of the time points from 0 to 2.5 years. The greatest bias of the meta-estimator was for the effects of age ≥65 years, and smoking.

### Conclusion

ODACT is a privacy-preserving and communication-efficient method for analyzing multi-center time-to-event data which allows the covariates’ effects to be time-varying. ODACT provides estimates close to the pooled estimator and substantially outperforms the meta-analysis estimator.

### Discussion

The proposed ODACT is a privacy-preserving distributed algorithm for fitting Cox models with time-varying coefficients. The limitations of ODACT include that privacy-preserving via aggregate data does rely on relatively large number of data at each individual site, and rigorous quantification of the risk of privacy leaks requires further investigation.

**Keywords:** survival, Cox regression, time-varying effects, distributed algorithm, electronic health records, privacy

## Introduction

The proliferation of electronic health record (EHR) systems has made it feasible to use the available data from large samples to conduct medical research. Large EHR data infrastructures have emerged in the last few years. For example, the National Patient-Centered Clinical Research Network (PCORnet), a network of networks, has accumulated a large collection of EHR data on a national scale from over 80 million patients.[1](#ocae313-B1) In theory, the availability of detailed individual health histories of large populations of people is a rich resource for scientific inquiry. However, many practical barriers must be overcome before the full potential of EHR data can be realized. A key barrier to this effort is data fragmentation (eg, in PCORnet, data are distributed across sites) combined with restrictions on the sharing of patient-level data across different EHR sites.

Ideally it would be straightforward to combine raw data from different sites to fit a statistical model on the pooled data. However, due to the need for protection of health information, it can be difficult or impossible to share patient-level data across sites. Thus, a common practice is to fit the model separately at each site and share the resulting coefficient point estimates and standard errors with a central site, where the results are combined via a meta-analytic approach. For example, by integrating multiple large-scale observational databases, the Observational Health Data Sciences and Informatics (OHDSI) consortium, an international collaborative research network, is able to synthesize real-world evidence for important healthcare questions such as comparing effectiveness and safety for first-line treatments of hypertension.[2](#ocae313-B2) While this approach is simple and preserves patient privacy, it can yield estimates that are biased and/or inefficient compared to pooled results in some situations.[3](#ocae313-B3),[4](#ocae313-B4)

Distributed algorithms are a class of methods that permit trade-offs between the extremes of pooled analysis (ideal estimation accuracy but high communication cost and violation of privacy) and meta-analysis (lower estimation accuracy but low communication cost).[5](#ocae313-B5) Communication cost can be thought of as either the number of rounds of iterative communication between sites or the overall quantity of information exchanged between sites. Depending on the site, one communication type may be more important to minimize than the other.

Multiple efforts have been made to extend commonly used analytic tools from a traditional single-site setting to distributed settings. Examples of these include a distributed algorithm for multi-center logistic regression—GLORE (Grid Binary Logistic Regression[6](#ocae313-B6))—and one for Cox regression—WebDISCO (a web service for distributed Cox model learning[7](#ocae313-B7)). These 2 algorithms are based on a distributed Newton’s method, where each step of Newton’s method is calculated in a distributed manner across multiple datasets and multiple rounds of communication are required to reach convergence. Specifically, the Cox regression model is widely used for survival analysis, which models the survival time (or time-to-event) outcomes. The survival analysis is the cornerstone of statistical analyses in many disease areas (eg, cancer), and is also commonly seen in biomedical informatics.[8](#ocae313-B8)

In certain settings, the number of iterative rounds of communication becomes a bottleneck, while the amount of data transferred between sites is not a limiting factor. For example, at OHDSI, multiple databases are located in different countries and the communication between countries is done manually to allow review and approval of the shared information. Thus, non-iterative algorithms that reduce the number of communication rounds while preserving most of the estimation accuracy would be both useful and practical. In addition, many one-shot distributed algorithms exist; these require only one round of communication across sites. Chen et al[9](#ocae313-B9) developed a one-shot algorithm for linear regression, which yields identical results with the gold standard of pooling data all sites. ODAL[5](#ocae313-B5) and ODAC[4](#ocae313-B4) are one-shot algorithms that nearly match the precision of pooled logistic regression and Cox regression, respectively. Notice here “one-shot” means one round of data communication across sites, which differs from the “one-shot” term that is frequently used in the large language model world, which means using one example.[10](#ocae313-B10) More methods emerge recently for conducting communication-efficient distributed survival analysis.[11–13](#ocae313-B11)

The method proposed in this article is based on a study of risk factors for opioid use disorder (OUD), a problematic pattern of opioid use that leads to clinically significant impairment or distress. OUD currently affects more than 2 million United States individuals. Identifying risk factors for the development of OUD and differentiating subtypes of the disorder could substantially improve its early identification and contribute to the development and selection of precision treatments tailored to the specific needs of individuals. Large data sets aggregated from multiple sites are needed to capture the heterogeneity and complex nature of OUD. Our study is specifically based on patients with chronic non-cancer pain (CNCP) treated with an opioid analgesic. CNCP is particularly well suited to the development of our predictive methods, as it is common and disabling, thus there are great potential clinical and public health benefits that could accrue from early interventions with CNCP patients. We have a rich set of high-quality predictors in large longitudinal EHR datasets from the OneFlorida network. OneFlorida is one of the 9 clinical research networks in PCORnet, covering more than 15 million patients in Florida, across 12 healthcare organizations. Besides EHR data from the clinical partners, the data in OneFlorida are also augmented and linked with other data sources, such as vital statistics, cancer registries, and administrative claims.

A unique challenge in quantifying the impacts of risk factors is the characterization of time-varying effects. OUD develops over time following an initial exposure and has a variable course once established, including different responses to treatment among individuals and within individuals under different circumstances. Thus, understanding these time-varying features is important in elucidating the etiology and successful prevention and treatment of OUD.

To our knowledge, a distributed algorithm for estimating time-varying coefficients from a Cox model does not yet exist. We propose a kernel-based distributed algorithm to estimate the time-varying coefficient that limits the number of iterative rounds of communication between sites while preserving patient-level privacy. Because the time-varying coefficient is a function of time, in practice we aim to construct a sequence of estimates over a grid of times. Thus, our method is better suited to scenarios where there is a need to minimize the number of iterative rounds of communication, while the amount of information transmitted at each round can be great.

## Methods

### Cox model with time-varying coefficients

In a survival analysis, it’s likely that only some individuals experience the event during observation. Consequently, event times will only be fully available for a subset of the study patients. This phenomenon is called censoring, and bring unique difficulties for survival analyses. In this article we focus on the most common scenario, ie, right-censoring, under which the event times of some patients are only known to be beyond certain time points (ie, the censoring times). Suppose _T_ is the event time, _C_ is the censoring time, _Y_ = min {_T_, _C_}, \= _I_{_T_ < _C_} where _I_{} is the indicator function, and _X_ is a vector of covariates of length . For each we observe . The Cox model with time-varying coefficients assumes the hazard function is

|  | (1) |
| --- | --- |

Cai et al[14](#ocae313-B14) proposed maximizing the local constant partial likelihood to estimate , and the procedure was further refined by Tian et al.[15](#ocae313-B15) The local constant log partial likelihood is a kernel weighted version of the log partial likelihood defined as

|  | (2) |
| --- | --- |

where is the risk set at time , and the function is a kernel, such as the Epanechnikov kernel[16](#ocae313-B16)   = 3(1 − _u_2)_I_{|_u_| < 1}/4, centered around _t_ with bandwidth _h_. For each _t_, is a reweighted version of the partial likelihood, with heavier weights placed on contributions that are closer to _t_. Solving [eqn (2)](#E2) for _β_ provides an estimate of . It follows that the gradient vector and hessian matrix are defined as

|  | (3) |
| --- | --- |

|  |
| --- |

where , and for a vector denotes the outer product .

### Distributed estimation of time-varying coefficients

Suppose data is stored across _K_ different sites and is the size of the _j_th site. We define the total sample size . For the _i_th patient from the _j_th site, we observe . Denote the set of all unique event times to be , and the risk set at time _t_ at site _j_ be , while the risk set at time _t_ across all sites is _R_(_t_). Ideally, we would estimate by pooling patient-level data from all sites to construct and then maximize a pooled log partial likelihood,

|  | (4) |
| --- | --- |

However, pooling data is often not feasible due to restrictions on sharing patient-level data. Jordan et al[17](#ocae313-B17) proposed a surrogate likelihood framework wherein pooled likelihoods can be closely approximated by using patient level data at one site and only aggregate information from other sites. Duan et al[4](#ocae313-B4) extended the same approach to propose a surrogate partial likelihood of the pooled Cox regression that only requires patient-level data from a leading site and aggregate information from other sites. We detail how a surrogate version of the local constant (log) partial likelihood [eqn (4)](#E5) can also be constructed, allowing Cox models with time-varying coefficients to be fit in a distributed setting while preserving privacy.

Let the local partial likelihood at site _j_ be

|  | (5) |
| --- | --- |

which can be constructed using only data from site _j_. We assume the first site is the leading site (eg, the largest site), and define the surrogate likelihood of time t at the leading site as

|  | (6) |
| --- | --- |

where is an initial estimate of . This surrogate likelihood essentially uses the higher order of to approximate that of . The initial estimate may be the estimate from the leading site, ie, , or a weighted average of estimates from each site, ie,

|  | (7) |
| --- | --- |

where and are the estimate and its variance from site _j_. A surrogate likelihood estimator is thus obtained by

|  | (8) |
| --- | --- |

The construction of the surrogate likelihood function , and can be calculated distributively from all sites with some summary statistics

|  | (9) |
| --- | --- |

from site _j,_ where is the set of all unique event time points. See the [Supplementary Materials](#sup1) for the detailed steps of distributive calculation. The algorithm for conducting Cox regression with time-varying coefficients is presented below. Notice that the surrogate likelihood can also be constructed at any site besides the leading site. The obtained surrogate likelihood estimators from each site can thus be averaged to achieve even better estimation. This step is optional and is at the cost of an extra round of communication.

Algorithm ODACT (One-shot Distributed Algorithm for Cox model with Time-varying coefficients)

1.  **_Initialization_ (_assume using_**  **_as initial estimator, site_ 1 _as the leading site_)**
    
    All sites determine grid of evaluation times at which to estimate _β_(_t_), and set a bandwidth _h_. In Site _j_ = 1 to _K_, fit a Cox model with time-varying coefficients. Obtain and broadcast the local estimate and variance {, } and the set of unique event time points.
    
2.  **_Summary statistics communication_**
    
    In Site _j_ = 1 to _K_, obtain using [eqn (7)](#E8), and the set of all unique event time points , Calculate and broadcast the intermediate summary statistics by [eqn (5)](#E6).
    
3.  **_Surrogate partial likelihood estimation_**
    
    In the leading site _j_ = 1, create surrogate partial likelihood using by [eqn (6)](#E7), calculate the surrogate estimator by [eqn (9)](#E10).
    

### Varying baseline hazards across sites

If baseline hazards are suspected to vary across sites in the above Cox model, a stratified Cox model assuming site-specific baseline hazard functions may be preferable. In this case, the stratified partial likelihood is

|  |
| --- |

where is defined by [eqn (5)](#E6). Notice that the risk set in only depends on each individual site, rather than that in depends on all the pooled data. The surrogate stratified partial likelihood is

|  |
| --- |

and it requires the communication of the first and second order derivatives from each individual site at each evaluated time points, ie,

## Simulation study

To demonstrate both the utility of relaxing the proportional hazards assumption and the ability of ODACT to mimic pooled data estimates, we simulate data from a model in which the log hazard ratio changes linearly with time, violating the proportional hazards assumption. The data generating mechanism has a conditional hazard model of , where and , and so .

The covariate vector and _x_1, _x_2 are independently generated from a Unif(0,1) distribution. The censoring times are generated from the same model, with the exception that covariates are generated from a Unif(0, _c_) distribution where _c_ is used to adjust the degree of desired censoring. Under this data generating mechanism, with a 25% event rate, most of the observed event times lie between _t_ = 0 and _t_ = 1 (on average less than 5% of the observed event times are beyond _t_ = 1). Thus we generated data with 25% event rate and evaluated _β_(_t_) at a grid of 5 evenly spaced times between 0 and 0.8, and bandwidth _h_ = 0.2.

For each simulation we generated 1000 data points and distributed them to 5 large sites each with size 150 and 5 small sites each with size 50. We compared the estimation of gold standard pooled analysis (pooled), the meta-analysis (meta), and the proposed distributed algorithm (ODACT). The ODACT method used local estimation as the initial value. To evaluate the impact of the lead site, 3 versions of ODACT were tested: ODACT using a _large_ site as the lead site (ODACT large), ODACT using a _small_ site as the lead site (ODACT small), and the _average_ of ODACT estimates using each of the 10 sites as local site (ODACT avg). The simulation was replicated 200 times and the results were shown in [Figure 1](#ocae313-F1) and [Table S1](#sup1). The R code for replicating the simulation is available at GitHub [https://github.com/chongliang-luo/ODACT](https://github.com/chongliang-luo/ODACT).

### Figure 1.

[![Box plots comparing the log hazard ratios of 2 covariates (X1, X2) on time-to-event outcome at 5 time points in the simulation study, estimated by from left to right: pooled data analysis (pooled), meta-analysis (meta), the proposed One-shot Distributed Algorithm for Cox model with Time-varying effects (ODACT) using a large site as the lead site (ODACT large), ODACT using a small site as the lead site (ODACT small), and the average of ODACT estimates using each of the 10 sites as local site (ODACT avg). The boxplots are based on 200 replications.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/43ca/12005629/2d45be4a6b73/ocae313f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005629_ocae313f1.jpg)

[Open in a new tab](figure/ocae313-F1/)

Simulation result of estimating time-varying effects of 2 covariates on time-to-event outcome, using pooled data analysis (pooled), meta-analysis (meta), and the proposed One-shot Distributed Algorithm for Cox model with Time-varying effects (ODACT). Three versions of ODACT were compared: using a large site as the lead site (ODACT large), using a small site as the lead site (ODACT small), and the average of ODACT estimates using each of the 10 sites as local site (ODACT avg). The boxplots are based on 200 replications. The true log hazard ratio is _β_1(_t_) = −2 + _t_ for _X_1, and _β_2(_t_) = 0 for _X_2, indicated by the dashed lines. Part of the boxes for meta at time = 0.8 is not shown due to values out of range, ie, the range of the box being (−35.1, 0.55) for _X_1 and (−22.3, 7.4) for _X_2.

From the boxplots, the meta-analysis showed considerable amount of bias compared to the pooled analysis, especially for the log hazard ratio of _X_1, by noticing the non-overlapped notches. The bias of meta-analysis reflected biases of individual estimates from each site, which is due to small amount of observed events around each evaluated time point.[3](#ocae313-B3) The observed events became scarcer at a later time, and thus the bias became greater. On the other hand, the ODACT method always achieved estimation close to that of the pooled analysis. This is because ODACT approximated the overall likelihood of the pooled analysis and avoided the small sample bias that accumulate from each individual estimator. The ODACT method was also robust to the choice of the lead site, as ODACT (large), ODACT (small), and ODACT (avg) achieved similar performance. We also compared meta and ODACT estimates to the pooled estimates, and presented the median absolute deviates (MAD) and the _P_\-values for paired _t_\-tests in [Table S1](#sup1). The meta estimates present greater MAD than the ODACT estimates in all scenarios, and were significantly different from the pooled estimates for effects at later time points (eg, _β_1(_t_) at _t_ = 0.2, 0.4, 0.6, 0.8, and _β_1(_t_) at _t_ = 0.8).

## The OUD study

Between 1990 and 2010, opioid analgesic prescriptions in the United States increased by a factor of 10, contributing to an epidemic of opioid misuse, abuse, and overdose deaths.[18–20](#ocae313-B18) These trends have continued and in 2018, 3.7% of United States adults reported misuse of a prescription opioid pain reliever in the past year.[21](#ocae313-B21) With the rise in opioid prescriptions, the prevalence of prescription OUD doubled in the decade prior to 2011-2012 to 2.1 million United States adults (0.9% of the adult population).[22](#ocae313-B22) This also resulted in increased non-medical use of prescription painkillers, such that in 2013 and 2014 more than 4.3 million Americans reported having engaged in such use in the preceding month.

Despite restrictions on prescribing practices,[23](#ocae313-B23),[24](#ocae313-B24) tens of millions of opioid prescriptions are still written each year for patients presenting with musculoskeletal pain.[25](#ocae313-B25) Nonetheless, these restrictions have decreased the availability of prescription opioids, which has been offset by greater availability of heroin and illicit fentanyl, contributing to a transition from prescribed opioids to illicit ones.[26](#ocae313-B26) This poses a greater risk of overdose and intravenous administration, which increases the spread of infectious diseases such as Hepatitis B and C and HIV.[27](#ocae313-B27),[28](#ocae313-B28) Thus, opioid-related harms, including OUD, remain at epidemic levels and are accompanied by high social, financial, and medical costs.

One patient group for which opioids remain a cornerstone of therapy are people with CNCP. CNCP is associated with the initiation, escalation, and maintenance of high-risk use of prescription opioids,[29](#ocae313-B29),[30](#ocae313-B30) and although the majority of patients with CNCP do not develop OUD, a sizable percentage of them treated chronically with opioids develop symptoms and signs of OUD. Further, pain may be exacerbated by the chronic use of opioids, alcohol, and tobacco, and, when patients abstain from their chronic use, they experience rebound pain, known as withdrawal hyperalgesia.[31](#ocae313-B31),[32](#ocae313-B32)

We demonstrate the advantage of the proposed ODACT method by studying the association of OUD risk with patients’ characteristics. Data from 69 163 subjects were extracted from 5 clinical sites in the OneFlorida database. Subjects were followed for 3 years after their index opioid prescription for CNCP and the time to the diagnosis of OUD was recorded. The cohort definition is detailed in [Figure S1](#sup1) and [Table S3](#sup1). A total of 13 675 (19.8%) patients had an OUD diagnosis during the follow-up. The risk of OUD after CNCP-related opioid use may be associated with many clinical and demographic characteristics, eg, age, sex, smoking status, comorbidity conditions, race, depression, and pain history. We define these patients’ characteristics as follows:

*   age: ≥ 65 versus <65,
    
*   sex: male versus female,
    
*   smoking: current smoker versus not a current smoker,
    
*   Charlson comorbidity index (CCI)[33](#ocae313-B33): a weighted score on which is a measure of an individual overall medical comorbidity,
    
*   race: Non-Hispanic White (NHW) versus others,
    
*   depression: present versus absent,
    
*   pain: present versus absent.
    

We note that the depression and pain measures were extracted before the index day, which is the patient’s first index opioid prescription. The pain condition is defined not the same as the chronic pain condition, see [Table S3](#sup1) for the detailed definition. See [Table 1](#ocae313-T1) for the summary of the characteristics among the 5 clinical sites.

### Table 1.

Patient characteristics in the association study of opioid use disorder after CNCP opioid prescription. Subjects are from 5 clinical sites in the OneFlorida EHR database. Age: _N_ (%) of ≥ 65, sex: _N_ (%) of male, Smoking: _N_ (%) of current smoker, CCI (Charlson Comorbidity Index): _N_ of CCI >0 (mean CCI), Race: _N_ (%) of NHW (Non-Hispanic White), Depression: _N_ (%) with depression history, Pain: _N_ (%) with pain history, OUD: _N_ (%) with OUD diagnosis during the 3-year follow-up.

| Site | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| Total | 50470 | 10347 | 2945 | 2857 | 2544 |
| Age | 6417 (12.7) | 1636 (15.8) | 492 (16.7) | 483 (16.9) | 284 (11.2) |
| Sex | 19 680 (39.0) | 3696 (35.7) | 1247 (42.3) | 1027 (35.9) | 820 (32.2) |
| Smoking | 9433 (18.7) | 291 (2.8) | 2 (0.1) | 422 (14.8) | 168 (6.6) |
| CCI | 19 089 (0.87) | 3642 (0.77) | 1153 (1.03) | 1000 (0.81) | 1024 (0.84) |
| Race | 33 081 (65.5) | 5478 (52.9) | 414 (14.1) | 1853 (64.9) | 1293 (50.8) |
| Depression | 5449 (10.8) | 736 (7.1) | 338 (11.5) | 354 (12.4) | 234 (9.2) |
| Pain | 8611 (17.1) | 1464 (14.1) | 373 (12.7) | 359 (12.6) | 605 (23.8) |
| OUD | 9880 (19.6) | 1998 (19.3) | 589 (20.0) | 572 (20.0) | 636 (25.0) |

[Open in a new tab](table/ocae313-T1/)

We assume that the effects of these characteristics on OUD risk are time-varying and evaluate their hazard ratio at times of 0, 0.5, 1, 1.5, 2, 2.5 years after the index prescription, with bandwidth _h_ = 1 year. We compared estimates from: a pooled analysis, a meta-analysis, and ODACT. Of the 5 sites, Site 1 is the largest (_N_ = 50 470, 73.0%), with the others being substantially smaller (15.0%, 4.3%, 4.1%, and 3.7%, respectively). To evaluate the impact of the lead site on ODACT, we fit ODACT using each site as the lead site. The results of these analyses are presented in [Figure 2](#ocae313-F2), where ODACT (avg) is the average of the 5 ODACT estimates.

### Figure 2.

[![Line curves showing the estimated time-varying effects of age, sex, smoking status, CCI (Charlson Comorbidity Index) score, race, depression and pain on risk of OUD after CNCP opioid prescription estimated using the data from 5 clinical sites in the OneFlorida database. Shaded areas represent the point-wise 95% confidence bands of the pooled analysis (in bold orange). The red dashed horizontal line is the time-invariant effects by Cox regression. The ODACT method was applied using each of the 5 sites as the lead site (ODACT 1-5, in bold blue, green, grey, yellow, and pink respectively), and ODACT (avg, in blue) is the average of the 5 ODACT estimates. The meta-estimator is in bold black.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/43ca/12005629/0ac283bbea3a/ocae313f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005629_ocae313f2.jpg)

[Open in a new tab](figure/ocae313-F2/)

Time-varying effects of age, sex, smoking status, CCI (Charlson Comorbidity Index) score, race, depression, and pain on risk of OUD after CNCP opioid prescription estimated using the data of 69 163 patients from 5 clinical sites in the OneFlorida database. Shaded areas represent the point-wise 95% confidence bands of the pooled analysis. The red dashed horizontal line is the time-invariant effects by Cox regression. The ODACT method was applied using each of the 5 sites as the lead site (ODACT 1-5), and ODACT (avg) is the average of the 5 ODACT estimates.

The pooled analysis estimates (orange solid lines) with the confidence bands show that the effects of all factors on the risk of OUD are significant at all time points. Specifically, during the follow-up, the following hazard ratios are obtained: for age ≥ 65 versus <65 it ranges from 0.42 (95% CI = 0.38-0.47) to 0.32 (0.29-0.36), for male versus female it ranges from 1.23 (1.18-1.29) to 1.06 (1.00-1.12), for current smokers it ranges from 1.37 (1.30-1.45) to 1.29 (1.21-1.38), for CCI per unit it ranges from 1.09 (1.08-1.10) to 1.07 (1.05-1.08), for NHW versus other races it ranges from 2.22 (2.09-2.37) to 1.96 (1.86-2.07), for depression it ranges from 1.31 (1.20-1.42) to 1.26 (1.18-1.34), and for pain it ranges from 1.76 (1.65-1.87) to 1.58 (1.50-1.67). Some of these effects have been reported in the literature, eg, the association of OUD with NHW race,[34](#ocae313-B34) smoking,[35](#ocae313-B35) and comorbid depression and pain conditions.[36](#ocae313-B36) We found that adults 65 or older have a lower risk of OUD than those younger than 65. There are contradictory findings on the relation between older age and prescribed opioid use in the literature.[37](#ocae313-B37),[38](#ocae313-B38) Nonetheless, it is evident from population data[39](#ocae313-B39) that the use of illicit drugs such as heroin and the misuse of prescription medications such as opioid analgesics are significantly lower among individuals age 65 or older compared with younger individuals, consistent with the findings reported here.

There is also obvious attenuation (ie, decay) of the effects with time for some factors. As evidenced in [Figure 2](#ocae313-F2), for sex, although there is a temporal decline in the hazard ratio, all 4 methods (include Cox model with time-invariant effects) capture the effect similarly. The temporal trend may reflect greater reductions among men in behaviors such as alcohol consumption, which has previously been shown among men, but not women, to correlate positively with aberrant opioid-use-related behaviors.[40](#ocae313-B40) Population data[39](#ocae313-B39) show that men are much more likely to binge drink or use alcohol heavily than women and that older individuals are much less likely to endorse these measures of excessive drinking than those less than 65 years old. As can also be seen in [Figure 2](#ocae313-F2), the ODACT models provide an approximation of the pooled data analysis that is much closer than that of the meta-analytic model in most of the scenarios. Specifically, ODACT [(1)](#E1) that uses the largest site as the lead site achieves estimates that are closest to the gold-standard pooled estimates, and the smaller the lead site is, the more the ODACT estimates deviate from the pooled estimate. The ODACT (avg) estimates are close to both pooled and ODACT [(1)](#E1), and fall within the confidence band of the pooled estimates in most scenarios. See also [Table S2](#sup1) for detailed estimates for the OUD study. As would be expected given the absence of a time-varying effect, the Cox model fails to capture any of the changes seen over time with the other models and, although for the variables that we analyzed this may have a limited impact on prediction, other outcomes, for which time-varying effects are more salient, would not be well estimated using the Cox model.

## Discussion

In this article we propose a one-shot distributed algorithm for Cox regression with time-varying coefficients. We apply the proposed method to integrate data from 5 sites in the OneFlorida database in a privacy-preserving way to study the effects of several factors on the risk of OUD. The findings underscore the need to include a time-varying dimension in analyses of the risk of OUD among individuals receiving opioid analgesics to treat CNCP. The literature is clear that a variety of time-dependent factors, perhaps most notably age, are strongly associated with prescriptions for opioid analgesics, as well as the misuse of these medications. This is consistent with changes in the prevalence of pain across the life course, with some pain conditions (eg, joint pain) increasing and some (eg, headache) decreasing. Sources of chronic pain may accumulate over time, while aberrant use of opioids may decrease. The greater risk for OUD among men also appears to vary over time. A failure to treat these time-varying trends reduces precision in modeling risks for OUD.

Federated data networks, where data remains local, the analytic code is distributed, and only summary statistics are shared, are becoming more prominent in the analysis of potentially sensitive data such as EHRs. To ensure accurate inference across such networks distributed algorithms are essential, but the same reasons preventing patient-level data sharing also prevent fully automated sharing of summary statistics as required by algorithms relying on many communication iterations to converge to a solution. The ODACT model therefore fills an important methodological gap, by requiring only one round of communication while proving close-to-optimal accuracy when fitting Cox models with time-varying coefficients.

Recently, distributed algorithms have been proposed for various statistical models and practical scenarios. Many of these methods were developed based on the “divide-and-conquer” idea that uses summary statistics from all sites.[12](#ocae313-B12),[41](#ocae313-B41),[42](#ocae313-B42) On the other hand, the proposed ODACT method uses summary statistics from the collaborative sites as well as the individual participant data (IPD) from the leading site. This surrogate likelihood framework[17](#ocae313-B17) makes the best use of the leading site data, especially in practical situations that a site with relatively larger study cohort can be chosen as the leading site. Moreover, it has been demonstrated that the other distributed methods that use the IPD of leading site tends to obtain more accurate estimates than the “divide-and-conquer” meta-estimates,[5](#ocae313-B5),[13](#ocae313-B13),[43](#ocae313-B43),[44](#ocae313-B44) especially when the outcome is rare.

As a distributed algorithm, the ODACT method relies on summary statistics from collaborating sites for privacy-preserving purpose. This approach has proven to be feasible in many real-world multi-center data integration studies. However, we acknowledge that privacy-preserving via aggregate data does rely on relatively large number of data points at each individual site. When the number of patients is small, the aggregate data, especially for those categorical variables with rare sub-categories, are possible to be exposed to the risk of re-identification. In practical usage, we suggest data contributors review the aggregated data before sending them to other sites, to avoid potential risk of re-identification.[45](#ocae313-B45) For example, covariate variables that have extremely rare sub-categories (eg, less than 5 counts) may need to be excluded. The rigorous quantification of the risk of privacy leaking via common privacy-preserving criteria such as _k_\-anonymity or differential privacy[45–47](#ocae313-B45) may be an interesting future work. Enhancing privacy-preserving by combining the aggregate data with techniques such as differential privacy,[46](#ocae313-B46) multiparty homomorphic encryption,[48](#ocae313-B48) and distribution-invariant privatization[49](#ocae313-B49) worths further exploring.

In the OUD study, we fit Cox regression model, assuming everyone who gets a prescription will eventually get OUD. This is likely a simplification, and a survival cure model[50](#ocae313-B50) may be more appropriate in this scenario. It remains an important future work to develop distributed algorithms for more sophisticated models to better serve practical survival analysis purposes.

## Supplementary Material

ocae313\_Supplementary\_Data

[ocae313\_supplementary\_data.zip](/articles/instance/12005629/bin/ocae313_supplementary_data.zip) (119.5KB, zip)

## Contributor Information

C Jason Liang, Biostatistics Research Branch, National Institute of Allergy and Infectious Diseases, Bethesda, MD 20892, United States.

Chongliang Luo, Division of Public Health Sciences, Washington University School of Medicine, St Louis, MO 63110, United States; Department of Biostatistics, Epidemiology and Informatics, University of Pennsylvania, Philadelphia, PA 19104, United States.

Henry R Kranzler, Department of Psychiatry, University of Pennsylvania, Philadelphia, PA 19104, United States.

Jiang Bian, Department of Health Outcomes and Biomedical Informatics, University of Florida, Gainesville, FL 32610, United States.

Yong Chen, Department of Biostatistics, Epidemiology and Informatics, University of Pennsylvania, Philadelphia, PA 19104, United States; Center for Health AI and Synthesis of Evidence, University of Pennsylvania, Philadelphia, PA 19104, United States.

## Author contributions

C. Jason Liang (Methodology, Software, Visualization, Writing—original draft), Chongliang Luo (Methodology, Software, Data curation, Formal analysis, Visualization), Henry R. Kranzler (Validation, Data curation), Jiang Bian (Data curation, Funding acquisition), and Yong Chen (Conceptualization, Funding acquisition, Supervision). All authors contributed to revising the article, and the final approval of the submitted version.

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

This work was supported in part by National Institutes of Health (R21AI167418, 1R01LM014344, 1R01AG077820, R01LM012607, R01AI130460, R01AG073435, R56AG074604, R01LM013519, R56AG069880, U01TR003709, and RF1G077820).

This work was supported partially through Patient-Centered Outcomes Research Institute (PCORI) Project Program Awards (ME-2019C3-18315 and ME-2018C3-14899). All statements in this report, including its findings and conclusions, are solely those of the authors and do not necessarily represent the views of the Patient-Centered Outcomes Research Institute (PCORI), its Board of Governors or Methodology Committee.

## Conflicts of interest

Dr. Kranzler is a member of advisory boards for Altimmune, Clearmind Medicine, Dicerna Pharmaceuticals, Enthion Pharmaceuticals, Lilly Pharmaceuticals, and Sophrosyne Pharmaceuticals; a consultant to Sobrera Pharmaceuticals and Altimmune; the recipient of research funding and medication supplies for an investigator-initiated study from Alkermes; a member of the American Society of Clinical Psychopharmacology’s Alcohol Clinical Trials Initiative, which was supported in the last three years by Alkermes, Dicerna, Ethypharm, Imbrium, Indivior, Kinnov, Lilly, Otsuka, and Pear; and a holder of U.S. patent 10,900,082 titled: “Genotype-guided dosing of opioid agonists,” issued 26 January 2021. Other authors declare no competing interests.

## Data availability

The OUD dataset is available upon application to the OneFlorida+ network through the link: [https://onefloridaconsortium.org/front-door/research-infrastructure-utilization-application/](https://onefloridaconsortium.org/front-door/research-infrastructure-utilization-application/). The R code for replicating the simulation is available at GitHub [https://github.com/chongliang-luo/ODACT](https://github.com/chongliang-luo/ODACT).

## References

*   1. Forrest CB, McTigue KM, Hernandez AF, et al.  PCORnet® 2020: current state, accomplishments, and future directions. J Clin Epidemiol. 2021;129:60-67. \[[DOI](https://doi.org/10.1016/j.jclinepi.2020.09.036)\] \[[PMC free article](/articles/PMC7521354/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33002635/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Clin%20Epidemiol&title=PCORnet%C2%AE%202020:%20current%20state,%20accomplishments,%20and%20future%20directions&volume=129&publication_year=2021&pages=60-67&pmid=33002635&doi=10.1016/j.jclinepi.2020.09.036&)\]
*   2. Suchard MA, Schuemie MJ, Krumholz HM, et al.  Comprehensive comparative effectiveness and safety of first-line antihypertensive drug classes: a systematic, multinational, large-scale analysis. Lancet. 2019;394:1816-1826. \[[DOI](https://doi.org/10.1016/S0140-6736\(19\)32317-7)\] \[[PMC free article](/articles/PMC6924620/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31668726/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Lancet&title=Comprehensive%20comparative%20effectiveness%20and%20safety%20of%20first-line%20antihypertensive%20drug%20classes:%20a%20systematic,%20multinational,%20large-scale%20analysis&volume=394&publication_year=2019&pages=1816-1826&pmid=31668726&doi=10.1016/S0140-6736\(19\)32317-7&)\]
*   3. Firth D.  Bias reduction of maximum likelihood estimates. Biometrika. 1993;80:27-38. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Biometrika&title=Bias%20reduction%20of%20maximum%20likelihood%20estimates&volume=80&publication_year=1993&pages=27-38&)\]
*   4. Duan R, Luo C, Schuemie MJ, et al.  Learning from local to global: an efficient distributed algorithm for modeling time-to-event data. J Am Med Inform Assoc. 2020;27:1028-1036. \[[DOI](https://doi.org/10.1093/jamia/ocaa044)\] \[[PMC free article](/articles/PMC7647322/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32626900/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Learning%20from%20local%20to%20global:%20an%20efficient%20distributed%20algorithm%20for%20modeling%20time-to-event%20data&volume=27&publication_year=2020&pages=1028-1036&pmid=32626900&doi=10.1093/jamia/ocaa044&)\]
*   5. Duan R, Boland MR, Liu Z, et al.  Learning from electronic health records across multiple sites: a communication-efficient and privacy-preserving distributed algorithm. J Am Med Inform Assoc. 2020;27:376-385. \[[DOI](https://doi.org/10.1093/jamia/ocz199)\] \[[PMC free article](/articles/PMC7025371/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31816040/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Learning%20from%20electronic%20health%20records%20across%20multiple%20sites:%20a%20communication-efficient%20and%20privacy-preserving%20distributed%20algorithm&volume=27&publication_year=2020&pages=376-385&pmid=31816040&doi=10.1093/jamia/ocz199&)\]
*   6. Wu Y, Jiang X, Kim J, Ohno-Machado L.  Grid Binary LOgistic REgression (GLORE): building shared models without sharing data. J Am Med Inf Assoc. 2012;19:758-764. \[[DOI](https://doi.org/10.1136/amiajnl-2012-000862)\] \[[PMC free article](/articles/PMC3422844/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/22511014/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inf%20Assoc&title=Grid%20Binary%20LOgistic%20REgression%20\(GLORE\):%20building%20shared%20models%20without%20sharing%20data&volume=19&publication_year=2012&pages=758-764&pmid=22511014&doi=10.1136/amiajnl-2012-000862&)\]
*   7. Lu CL, Wang S, Ji Z, et al.  WebDISCO: a web service for distributed cox model learning without patient-level data sharing. J Am Med Inf Assoc. 2015;22:1212-1219. \[[DOI](https://doi.org/10.1093/jamia/ocv083)\] \[[PMC free article](/articles/PMC5009917/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26159465/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inf%20Assoc&title=WebDISCO:%20a%20web%20service%20for%20distributed%20cox%20model%20learning%20without%20patient-level%20data%20sharing&volume=22&publication_year=2015&pages=1212-1219&pmid=26159465&doi=10.1093/jamia/ocv083&)\]
*   8. Clark TG, Bradburn MJ, Love SB, Altman DG.  Survival analysis part I: basic concepts and first analyses. Br J Cancer. 2003;89:232-238. 10.1038/sj.bjc.6601118 \[[DOI](https://doi.org/10.1038/sj.bjc.6601118)\] \[[PMC free article](/articles/PMC2394262/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/12865907/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Br%20J%20Cancer&title=Survival%20analysis%20part%20I:%20basic%20concepts%20and%20first%20analyses&volume=89&publication_year=2003&pages=232-238&pmid=12865907&doi=10.1038/sj.bjc.6601118&)\]
*   9. Chen Y, Dong G, Han J, Pei J, Wah BW, Wang J.  Regression cubes with lossless compression and aggregation. IEEE Trans Knowl Data Eng. 2006;18:1585-1599. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=IEEE%20Trans%20Knowl%20Data%20Eng&title=Regression%20cubes%20with%20lossless%20compression%20and%20aggregation&volume=18&publication_year=2006&pages=1585-1599&)\]
*   10. Frantar E, Alistarh D. SparseGPT: massive language models can be accurately pruned in one-shot. In: _International Conference on Machine Learning_, pp. 10323-10337. PMLR. 2023.
*   11. Shu D, Yoshida K, Fireman BH, Toh S.  Inverse probability weighted Cox model in multi-site studies without sharing individual-level data. Stat Methods Med Res. 2020;29:1668-1681. \[[DOI](https://doi.org/10.1177/0962280219869742)\] \[[PMC free article](/articles/PMC7042068/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31448681/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Stat%20Methods%20Med%20Res&title=Inverse%20probability%20weighted%20Cox%20model%20in%20multi-site%20studies%20without%20sharing%20individual-level%20data&volume=29&publication_year=2020&pages=1668-1681&pmid=31448681&doi=10.1177/0962280219869742&)\]
*   12. Wang Y, Hong C, Palmer N, et al.  A fast divide-and-conquer sparse Cox regression. Biostatistics. 2021;22:381-401. \[[DOI](https://doi.org/10.1093/biostatistics/kxz036)\] \[[PMC free article](/articles/PMC8036003/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31545341/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Biostatistics&title=A%20fast%20divide-and-conquer%20sparse%20Cox%20regression&volume=22&publication_year=2021&pages=381-401&pmid=31545341&doi=10.1093/biostatistics/kxz036&)\]
*   13. Luo C, Duan R, Naj AC, Kranzler HR, Bian J, Chen Y.  ODACH: a one-shot distributed algorithm for Cox model with heterogeneous multi-center data. Sci Rep. 2022;12:6627. \[[DOI](https://doi.org/10.1038/s41598-022-09069-0)\] \[[PMC free article](/articles/PMC9033863/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35459767/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Rep&title=ODACH:%20a%20one-shot%20distributed%20algorithm%20for%20Cox%20model%20with%20heterogeneous%20multi-center%20data&volume=12&publication_year=2022&pages=6627&pmid=35459767&doi=10.1038/s41598-022-09069-0&)\]
*   14. Cai Z, Sun Y.  Local linear estimation for time-dependent coefficients in Cox’s regression models. Scand J Stat. 2003;30:93-111. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Scand%20J%20Stat&title=Local%20linear%20estimation%20for%20time-dependent%20coefficients%20in%20Cox%E2%80%99s%20regression%20models&volume=30&publication_year=2003&pages=93-111&)\]
*   15. Tian L, Zucker D, Wei L.  On the Cox model with time-varying regression coefficients. J Am Stat Assoc. 2005;100:172-183. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Stat%20Assoc&title=On%20the%20Cox%20model%20with%20time-varying%20regression%20coefficients&volume=100&publication_year=2005&pages=172-183&)\]
*   16. Epanechnikov VA.  Non-parametric estimation of a multivariate probability density. Theory Probab Appl. 1969;14:153-158. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Theory%20Probab%20Appl&title=Non-parametric%20estimation%20of%20a%20multivariate%20probability%20density&volume=14&publication_year=1969&pages=153-158&)\]
*   17. Jordan MI, Lee JD, Yang Y.  Communication-efficient distributed statistical inference. J Am Stat Assoc. 2019;114:668-681. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Stat%20Assoc&title=Communication-efficient%20distributed%20statistical%20inference&volume=114&publication_year=2019&pages=668-681&)\]
*   18. Okie S.  A flood of opioids, a rising tide of deaths. N Engl J Med. 2010;363:1981-1985. \[[DOI](https://doi.org/10.1056/NEJMp1011512)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/21083382/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=N%20Engl%20J%20Med&title=A%20flood%20of%20opioids,%20a%20rising%20tide%20of%20deaths&volume=363&publication_year=2010&pages=1981-1985&pmid=21083382&doi=10.1056/NEJMp1011512&)\]
*   19. Centers for Disease Control and Prevention (CDC). Vital signs: overdoses of prescription opioid pain relievers—United States, 1999–2008. MMWR Morb Mortality Wkly Rep. 2011;60:1487-1492. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/22048730/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=MMWR%20Morb%20Mortality%20Wkly%20Rep&title=Vital%20signs:%20overdoses%20of%20prescription%20opioid%20pain%20relievers%E2%80%94United%20States,%201999%E2%80%932008&volume=60&publication_year=2011&pages=1487-1492&pmid=22048730&)\]
*   20. Vowles KE, McEntee ML, Julnes PS, Frohe T, Ney JP, Goes VD.  Rates of opioid misuse, abuse, and addiction in chronic pain: a systematic review and data synthesis. Pain. 2015;156:569-576. \[[DOI](https://doi.org/10.1097/01.j.pain.0000460357.01998.f1)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/25785523/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Pain&title=Rates%20of%20opioid%20misuse,%20abuse,%20and%20addiction%20in%20chronic%20pain:%20a%20systematic%20review%20and%20data%20synthesis&volume=156&publication_year=2015&pages=569-576&pmid=25785523&doi=10.1097/01.j.pain.0000460357.01998.f1&)\]
*   21. Substance Abuse and Mental Health Services Administration.  Key substance use and mental health indicators in the United States: results from the 2016 national survey on drug use and health. 2017. Accessed October 22, 2024. [https://www.samhsa.gov/data/report/key-substance-use-and-mental-health-indicators-united-states-results-2016-national-survey](https://www.samhsa.gov/data/report/key-substance-use-and-mental-health-indicators-united-states-results-2016-national-survey)
*   22. Saha TD, Kerridge BT, Goldstein RB, et al.  Nonmedical prescription opioid use and DSM-5 nonmedical prescription opioid use disorder in the United States. J Clin Psychiatry. 2016;77:772-780. \[[DOI](https://doi.org/10.4088/JCP.15m10386)\] \[[PMC free article](/articles/PMC5555044/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27337416/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Clin%20Psychiatry&title=Nonmedical%20prescription%20opioid%20use%20and%20DSM-5%20nonmedical%20prescription%20opioid%20use%20disorder%20in%20the%20United%20States&volume=77&publication_year=2016&pages=772-780&pmid=27337416&doi=10.4088/JCP.15m10386&)\]
*   23. Adams JM, Giroir BP.  Opioid prescribing trends and the physician’s role in responding to the public health crisis. JAMA Intern Med. 2019;179:476-478. \[[DOI](https://doi.org/10.1001/jamainternmed.2018.7934)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/30742214/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Intern%20Med&title=Opioid%20prescribing%20trends%20and%20the%20physician%E2%80%99s%20role%20in%20responding%20to%20the%20public%20health%20crisis&volume=179&publication_year=2019&pages=476-478&pmid=30742214&doi=10.1001/jamainternmed.2018.7934&)\]
*   24. Guy GP, Zhang K, Schieber LZ, Young R, Dowell D.  County-level opioid prescribing in the United States, 2015 and 2017. JAMA Intern Med. 2019;179:574-576. \[[DOI](https://doi.org/10.1001/jamainternmed.2018.6989)\] \[[PMC free article](/articles/PMC6450301/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/30742206/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Intern%20Med&title=County-level%20opioid%20prescribing%20in%20the%20United%20States,%202015%20and%202017&volume=179&publication_year=2019&pages=574-576&pmid=30742206&doi=10.1001/jamainternmed.2018.6989&)\]
*   25. Olfson M, Wang S, Wall MM, Blanco C.  Trends in opioid prescribing and self-reported pain among US adults: as efforts to curb inappropriate opioid prescribing continue, an examination of trends in short-term and longer-term opioid prescriptions for US adults who self-report various pain levels. Health Aff (Millwood). 2020;39:146-154. \[[DOI](https://doi.org/10.1377/hlthaff.2019.00783)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31905067/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Health%20Aff%20\(Millwood\)&title=Trends%20in%20opioid%20prescribing%20and%20self-reported%20pain%20among%20US%20adults:%20as%20efforts%20to%20curb%20inappropriate%20opioid%20prescribing%20continue,%20an%20examination%20of%20trends%20in%20short-term%20and%20longer-term%20opioid%20prescriptions%20for%20US%20adults%20who%20self-report%20various%20pain%20levels&volume=39&publication_year=2020&pages=146-154&pmid=31905067&doi=10.1377/hlthaff.2019.00783&)\]
*   26. Compton WM, Jones CM, Baldwin GT.  Relationship between nonmedical prescription-opioid use and heroin use. N Engl J Med. 2016;374:154-163. \[[DOI](https://doi.org/10.1056/NEJMra1508490)\] \[[PMC free article](/articles/PMC11784537/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26760086/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=N%20Engl%20J%20Med&title=Relationship%20between%20nonmedical%20prescription-opioid%20use%20and%20heroin%20use&volume=374&publication_year=2016&pages=154-163&pmid=26760086&doi=10.1056/NEJMra1508490&)\]
*   27. Garfein RS, Vlahov D, Galai N, Doherty MC, Nelson KE.  Viral infections in short-term injection drug users: the prevalence of the hepatitis C, hepatitis B, human immunodeficiency, and human T-lymphotropic viruses. Am J Public Health. 1996;86:655-661. \[[DOI](https://doi.org/10.2105/ajph.86.5.655)\] \[[PMC free article](/articles/PMC1380472/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/8629715/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Public%20Health&title=Viral%20infections%20in%20short-term%20injection%20drug%20users:%20the%20prevalence%20of%20the%20hepatitis%20C,%20hepatitis%20B,%20human%20immunodeficiency,%20and%20human%20T-lymphotropic%20viruses&volume=86&publication_year=1996&pages=655-661&pmid=8629715&doi=10.2105/ajph.86.5.655&)\]
*   28. Rudd RA, Seth P, David F, Scholl L.  Increases in drug and opioid-involved overdose deaths—United States, 2010–2015. Morb Mortality Wkly Rep. 2016;65:1445-1452. \[[DOI](https://doi.org/10.15585/mmwr.mm655051e1)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28033313/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Morb%20Mortality%20Wkly%20Rep&title=Increases%20in%20drug%20and%20opioid-involved%20overdose%20deaths%E2%80%94United%20States,%202010%E2%80%932015&volume=65&publication_year=2016&pages=1445-1452&pmid=28033313&doi=10.15585/mmwr.mm655051e1&)\]
*   29. Cheatle MD.  Facing the challenge of pain management and opioid misuse, abuse and opioid-related fatalities. Expert Rev Clin Pharmacol. 2016;9:751-754. \[[DOI](https://doi.org/10.1586/17512433.2016.1160776)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26933873/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Expert%20Rev%20Clin%20Pharmacol&title=Facing%20the%20challenge%20of%20pain%20management%20and%20opioid%20misuse,%20abuse%20and%20opioid-related%20fatalities&volume=9&publication_year=2016&pages=751-754&pmid=26933873&doi=10.1586/17512433.2016.1160776&)\]
*   30. Wilkerson RG, Kim HK, Windsor TA, Mareiniss DP.  The opioid epidemic in the United States. Emerg Med Clin North Am. 2016;34:e1-e23. \[[DOI](https://doi.org/10.1016/j.emc.2015.11.002)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27133253/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Emerg%20Med%20Clin%20North%20Am&title=The%20opioid%20epidemic%20in%20the%20United%20States&volume=34&publication_year=2016&pages=e1-e23&pmid=27133253&doi=10.1016/j.emc.2015.11.002&)\]
*   31. Zale EL, Maisto SA, Ditre JW.  Interrelations between pain and alcohol: an integrative review. Clin Psychol Rev. 2015;37:57-71. \[[DOI](https://doi.org/10.1016/j.cpr.2015.02.005)\] \[[PMC free article](/articles/PMC4385458/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/25766100/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Clin%20Psychol%20Rev&title=Interrelations%20between%20pain%20and%20alcohol:%20an%20integrative%20review&volume=37&publication_year=2015&pages=57-71&pmid=25766100&doi=10.1016/j.cpr.2015.02.005&)\]
*   32. Ditre JW, Brandon TH, Zale EL, Meagher MM.  Pain, nicotine, and smoking: research findings and mechanistic considerations. Psychol Bull. 2011;137:1065-1093. \[[DOI](https://doi.org/10.1037/a0025544)\] \[[PMC free article](/articles/PMC3202023/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/21967450/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Psychol%20Bull&title=Pain,%20nicotine,%20and%20smoking:%20research%20findings%20and%20mechanistic%20considerations&volume=137&publication_year=2011&pages=1065-1093&pmid=21967450&doi=10.1037/a0025544&)\]
*   33. Charlson ME, Pompei P, Ales KL, MacKenzie CR.  A new method of classifying prognostic comorbidity in longitudinal studies: development and validation. J Chronic Dis. 1987;40:373-383. 10.1016/0021-9681(87)90171-8 \[[DOI](https://doi.org/10.1016/0021-9681\(87\)90171-8)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/3558716/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Chronic%20Dis&title=A%20new%20method%20of%20classifying%20prognostic%20comorbidity%20in%20longitudinal%20studies:%20development%20and%20validation&volume=40&publication_year=1987&pages=373-383&pmid=3558716&doi=10.1016/0021-9681\(87\)90171-8&)\]
*   34. Substance Abuse and Mental Health Services Administration. The opioid crisis and the Black/African American population: an urgent issue. 2020. Accessed October 22, 2024. [https://library.samhsa.gov/product/opioid-crisis-and-blackafrican-american-population-urgent-issue/pep20-05-02-001](https://library.samhsa.gov/product/opioid-crisis-and-blackafrican-american-population-urgent-issue/pep20-05-02-001)
*   35. Young-Wolff KC, Klebaner D, Weisner C, Von Korff M, Campbell CI.  Smoking status and opioid related problems and concerns among men and women on chronic opioid therapy. Clin J Pain. 2017;33:730-737. \[[DOI](https://doi.org/10.1097/AJP.0000000000000461)\] \[[PMC free article](/articles/PMC5446933/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27898458/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Clin%20J%20Pain&title=Smoking%20status%20and%20opioid%20related%20problems%20and%20concerns%20among%20men%20and%20women%20on%20chronic%20opioid%20therapy&volume=33&publication_year=2017&pages=730-737&pmid=27898458&doi=10.1097/AJP.0000000000000461&)\]
*   36. National Institute on Drug Abuse (NIDA). Common Comorbidities with Substance Use Disorders. 2018. Accessed October 22, 2024. [https://nida.nih.gov/sites/default/files/1155-common-comorbidities-with-substance-use-disorders.pdf](https://nida.nih.gov/sites/default/files/1155-common-comorbidities-with-substance-use-disorders.pdf)
*   37. Federman AD, Litke A, Morrison RS.  Association of age with analgesic use for back and joint disorders in outpatient settings. Am J Geriatr Pharmacother. 2006;4:306-315. \[[DOI](https://doi.org/10.1016/j.amjopharm.2006.12.009)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/17296536/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Geriatr%20Pharmacother&title=Association%20of%20age%20with%20analgesic%20use%20for%20back%20and%20joint%20disorders%20in%20outpatient%20settings&volume=4&publication_year=2006&pages=306-315&pmid=17296536&doi=10.1016/j.amjopharm.2006.12.009&)\]
*   38. Campbell CI, Weisner C, LeResche L, et al.  Age and gender trends in long-term opioid analgesic use for noncancer pain. Am J Public Health. 2010;100:2541-2547. \[[DOI](https://doi.org/10.2105/AJPH.2009.180646)\] \[[PMC free article](/articles/PMC2978198/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/20724688/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Public%20Health&title=Age%20and%20gender%20trends%20in%20long-term%20opioid%20analgesic%20use%20for%20noncancer%20pain&volume=100&publication_year=2010&pages=2541-2547&pmid=20724688&doi=10.2105/AJPH.2009.180646&)\]
*   39. Substance Abuse and Mental Health Services Administration. National survey on drug use and health: detailed tables. 2020. Accessed October 22, 2024. [https://www.samhsa.gov/data/report/2019-nsduh-detailed-tables](https://www.samhsa.gov/data/report/2019-nsduh-detailed-tables)
*   40. Back SE, Payne RA, Waldrop AE, Smith A, Reeves S, Brady KT.  Prescription opioid aberrant behaviors: a pilot study of sex differences. Clin J Pain. 2009;25:477-484. 10.1097/AJP.0b013e31819c2c2f \[[DOI](https://doi.org/10.1097/AJP.0b013e31819c2c2f)\] \[[PMC free article](/articles/PMC2771580/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/19542794/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Clin%20J%20Pain&title=Prescription%20opioid%20aberrant%20behaviors:%20a%20pilot%20study%20of%20sex%20differences&volume=25&publication_year=2009&pages=477-484&pmid=19542794&doi=10.1097/AJP.0b013e31819c2c2f&)\]
*   41. Huang C, Huo X.  A distributed one-step estimator. Math Program. 2019;174:41-76. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Math%20Program&title=A%20distributed%20one-step%20estimator&volume=174&publication_year=2019&pages=41-76&)\]
*   42. Li D, Lu W, Shu D, Toh S, Wang R.  Distributed Cox proportional hazards regression using summary-level information. Biostatistics. 2023;24:776-794. \[[DOI](https://doi.org/10.1093/biostatistics/kxac006)\] \[[PMC free article](/articles/PMC10345997/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35195675/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Biostatistics&title=Distributed%20Cox%20proportional%20hazards%20regression%20using%20summary-level%20information&volume=24&publication_year=2023&pages=776-794&pmid=35195675&doi=10.1093/biostatistics/kxac006&)\]
*   43. Luo C, Islam MN, Sheils NE, et al.  DLMM as a lossless one-shot algorithm for collaborative multi-site distributed linear mixed models. Nat Commun. 2022;13:1678. \[[DOI](https://doi.org/10.1038/s41467-022-29160-4)\] \[[PMC free article](/articles/PMC8967932/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35354802/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Commun&title=DLMM%20as%20a%20lossless%20one-shot%20algorithm%20for%20collaborative%20multi-site%20distributed%20linear%20mixed%20models&volume=13&publication_year=2022&pages=1678&pmid=35354802&doi=10.1038/s41467-022-29160-4&)\]
*   44. Luo C, Duan R, Shi J, et al. Distributed proportional likelihood ratio model with application to data integration across clinical sites. _Ann Appl Stat_. 2024;18:63-79.
*   45. Sweeney L.  k-anonymity: a model for protecting privacy. Int J Unc Fuzz Knowl Based Syst. 2002;10:557-570. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Int%20J%20Unc%20Fuzz%20Knowl%20Based%20Syst&title=k-anonymity:%20a%20model%20for%20protecting%20privacy&volume=10&publication_year=2002&pages=557-570&)\]
*   46. Dwork C, McSherry F, Nissim K, Smith A.  Calibrating Noise to Sensitivity in Private Data Analysis. Springer; 2006:265-284. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Calibrating%20Noise%20to%20Sensitivity%20in%20Private%20Data%20Analysis&publication_year=2006&)\]
*   47. Wasserman L, Zhou S.  A statistical framework for differential privacy. J Am Stat Assoc. 2010;105:375-389. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Stat%20Assoc&title=A%20statistical%20framework%20for%20differential%20privacy&volume=105&publication_year=2010&pages=375-389&)\]
*   48. Froelicher D, Troncoso-Pastoriza JR, Raisaro JL, et al.  Truly privacy-preserving federated analytics for precision medicine with multiparty homomorphic encryption. Nat Commun. 2021;12:5910. \[[DOI](https://doi.org/10.1038/s41467-021-25972-y)\] \[[PMC free article](/articles/PMC8505638/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34635645/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Commun&title=Truly%20privacy-preserving%20federated%20analytics%20for%20precision%20medicine%20with%20multiparty%20homomorphic%20encryption&volume=12&publication_year=2021&pages=5910&pmid=34635645&doi=10.1038/s41467-021-25972-y&)\]
*   49. Bi X, Shen X.  Distribution-invariant differential privacy. J Econom. 2023;235:444-453. \[[DOI](https://doi.org/10.1016/j.jeconom.2022.05.004)\] \[[PMC free article](/articles/PMC10495082/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37701878/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Econom&title=Distribution-invariant%20differential%20privacy&volume=235&publication_year=2023&pages=444-453&pmid=37701878&doi=10.1016/j.jeconom.2022.05.004&)\]
*   50. Kuk AY, Chen CH.  A mixture model combining logistic regression with proportional hazards regression. Biometrika. 1992;79:531-541. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Biometrika&title=A%20mixture%20model%20combining%20logistic%20regression%20with%20proportional%20hazards%20regression&volume=79&publication_year=1992&pages=531-541&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae313\_Supplementary\_Data

[ocae313\_supplementary\_data.zip](/articles/instance/12005629/bin/ocae313_supplementary_data.zip) (119.5KB, zip)

### Data Availability Statement

The OUD dataset is available upon application to the OneFlorida+ network through the link: [https://onefloridaconsortium.org/front-door/research-infrastructure-utilization-application/](https://onefloridaconsortium.org/front-door/research-infrastructure-utilization-application/). The R code for replicating the simulation is available at GitHub [https://github.com/chongliang-luo/ODACT](https://github.com/chongliang-luo/ODACT).

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**