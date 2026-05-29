
JOURNAL INFORMATION
==============================
NLM Title Abbreviation: J Am Med Inform Assoc
Journal ID: J Am Med Inform Assoc
Journal ID: jamia

Journal of the American Medical Informatics Association : JAMIA

ISSN: 1067-5027
EISSN: 1527-974X
Publisher: Oxford University Press

ARTICLE INFORMATION
==============================
PMCID: PMC11833466
PMID: 39832294
DOI: 10.1093/jamia/ocaf009
Article ID: ocaf009
Article version: 1
Subjects: Perspective, Featured, AcademicSubjects/MED00580, AcademicSubjects/SCI01060, AcademicSubjects/SCI01530

Incorporating area-level social drivers of health in predictive algorithms using electronic health record data

https://orcid.org/0000-0002-8968-5805 Foryciarz Agata BSE Conceptualization Data curation Formal analysis Investigation Methodology Project administration Resources Software Visualization Department of Computer Science, Stanford University, Stanford, CA 94305, United States

https://orcid.org/0000-0001-6039-7001 Gladish Nicole PhD Conceptualization Data curation Formal analysis Investigation Resources Software Department of Epidemiology and Population Health, Stanford School of Medicine, Stanford, CA 94304, United States

https://orcid.org/0000-0002-7597-6513 Rehkopf David H ScD Conceptualization Investigation Resources Department of Epidemiology and Population Health, Stanford School of Medicine, Stanford, CA 94304, United States
Department of Health Policy, Stanford School of Medicine, Stanford, CA 94305, United States
Department of Medicine, Division of Primary Care and Population Health, Stanford School of Medicine, Stanford, CA 94305, United States
Department of Pediatrics, Stanford School of Medicine, Stanford, CA 94305, United States
Department of Sociology, Stanford University, Stanford, CA 94305, United States

https://orcid.org/0000-0002-9076-8472 Rose Sherri PhD Conceptualization Funding acquisition Investigation Methodology Project administration Resources Supervision Validation Department of Health Policy, Stanford School of Medicine, Stanford, CA 94305, United States

Corresponding author: Agata Foryciarz, BSE, Department of Health Policy, Stanford University, Encina Commons, 615 Crothers Way, Stanford, CA 94305, United States (agataf@stanford.edu)
Publication date: 2025 Mar
Electronic publication date: 2025 Jan 20
Volume: 32
Issue: 3
First page: 595
Last page: 601
Received 2024 Jun 6; Revised 2024 Dec 20; 2024 Dec 31; Accepted 2025 Jan 6
Copyright: © The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association.
Copyright year: 2025
License: This is an Open Access article distributed under the terms of the Creative Commons Attribution-NonCommercial License (https://creativecommons.org/licenses/by-nc/4.0/), which permits non-commercial re-use, distribution, and reproduction in any medium, provided the original work is properly cited. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.
License URL: https://creativecommons.org/licenses/by-nc/4.0/

Keywords: social drivers of health, social indices, predictive modeling, kidney failure

Funding: National Institutes of Health 10.13039/100000002 R01LM013989 Robert Wood Johnson Foundation 10.13039/100000867 79319 National Institutes of Health 10.13039/100000002 National Center for Advancing Translational Science Clinical and Translational Science UL1TR003142
Page count: 7

==============================
Abstract

Objectives

The inclusion of social drivers of health (SDOH) into predictive algorithms of health outcomes has potential for improving algorithm interpretation, performance, generalizability, and transportability. However, there are limitations in the availability, understanding, and quality of SDOH variables, as well as a lack of guidance on how to incorporate them into algorithms when appropriate to do so. As such, few published algorithms include SDOH, and there is substantial methodological variability among those that do. We argue that practitioners should consider the use of social indices and factors—a class of area-level measurements—given their accessibility, transparency, and quality.

Results

We illustrate the process of using such indices in predictive algorithms, which includes the selection of appropriate indices for the outcome, measurement time, and geographic level, in a demonstrative example with the Kidney Failure Risk Equation.

Discussion

Identifying settings where incorporating SDOH may be beneficial and incorporating them rigorously can help validate algorithms and assess generalizability.

Introduction

Social drivers of health (SDOH)—previously commonly referred to as social determinants of health—measure social structures and individual social factors that impact health, generate disease, and are among the most important contributors to health inequities.1,2 SDOH encompass multiple domains, including economic stability, education access and quality, healthcare access and quality, neighborhood and built environment, and social and community context.3

There is potential that accounting for non-clinical factors impacting health can improve interpretation, performance, generalizability, and transportability of predictive algorithms of health outcomes. While some clinical algorithms contain SDOH, including cardiovascular risk prediction scores,4,5 their incorporation in algorithms is not routine. This is due, in part, to a lack of recognition of the underlying processes that lead to observed health inequities. There are also problems in availability and quality of individual-level SDOH data.6–8 It was only in 2024 that the Centers for Medicare and Medicaid Services started requiring SDOH screening for their hospital inpatient quality reporting program.9 Published clinical algorithms that do use SDOH rely on heterogeneous data sources to calculate SDOH10 and do not consistently provide detailed motivation for particular measurements. It is also the case that incorporating SDOH in predictive algorithms can potentially worsen disparities by reinforcing inequitable equilibriums via improved prediction accuracy, thereby directing care and resources away from patients in need.11,12 Thus, it may not always be clear how to identify social factors relevant for a given health outcome, which SDOH data sources to use, or how to integrate them into algorithm development.

One category of well-studied and accessible SDOH variables is area-based social indices and factors, which describe social conditions in particular geographic areas.13 By definition, indices are composite measures, although some “social indices” in the literature comprise only 1 factor. We use social index here to refer to both types. Existing guidelines have considered the use of indices in healthcare payments.14 In this article, we propose a broader set of considerations for incorporating social indices in predictive algorithms using electronic health records data, summarized in Table 1. We also present the Kidney Failure Risk Equation (KFRE15) as an illustration. The KFRE is a risk stratification tool designed to identify chronic kidney disease (CKD) patients at highest risk of progression to kidney failure based on documented age, sex, estimated glomerular filtration rate, and urine albumin creatinine ratio. It was developed using data from a single geographic region and external validation found a stable relationship between the predictors and outcome, attributing observed calibration differences to differences in baseline risk across study samples.16 The inclusion of social factors in the predictive algorithm could help account for potential differences in baseline risk.

Table 1. Guidance on considerations for inclusion of SDOH in predictive algorithms.

Identifying an index relevant for the algorithm	How has past literature related SDOH to the outcome?

Collaborative creation of a causal graph describing underlying systems that created the data

Which indices contribute to unmeasured nodes in the causal graph?

What was the original purpose of the indices and is it aligned with the current algorithm?

Would including SDOH reinforce an unjust equilibrium?

	
Selecting an appropriate geographic level	What levels are indices available for?

Are concepts of interest more appropriately measured in larger or smaller areas?

Do areas selected correspond to neighborhoods or other homogeneous environments?

	
Time of measurement	How long do factors captured in indices take to impact the outcome?

Does the index show considerable variability over time?

	
Examining index distributions	How is the index distributed in the national population vs in the study sample?

If multiple indices are used, how correlated are they?

How to divide distribution into quantiles?

	

Motivation for including social drivers

There is ample empirical evidence for associations between SDOH and health outcomes across disease areas.17 While many health inequities stem from a common set of structural factors and are associated with mutually correlated SDOH,17 social drivers may contribute differentially across health outcomes. Specific causal pathways may also vary across geographies and settings within them.18 Additionally, domains of SDOH can be measured in many ways and at multiple levels—from individual to geographic area.19,20 Hence, careful identification of SDOH domains and measurements relevant for a specific context before inclusion in a predictive algorithm is crucial. For the KFRE, factors across a range of domains, including those related to social status, stress, neighborhood, and the health system, have been shown to play a role in CKD incidence and progression to kidney failure.21–24 These factors contribute to existing disparities in the risk kidney failure incidence, which is 3.3 and 1.5 times higher for Black and Native Americans, compared to White populations.25,26

Consideration of SDOH is important from the perspective of providing clear conceptual justification for all variables included in the algorithm. In the absence of such conceptual clarity, imperfect proxies, such as race and ethnicity variables, are often used, reifying the erroneous use of race as a biological construct,27 masking social processes,28 and possibly contributing to racial health inequities by guiding care away from Black patients.29 Additionally, because SDOH are often strongly associated with health outcomes,30 their inclusion in an algorithm may improve predictive performance. This has the potential to lead to improvements in health equity, if, for example, more effective risk stratification leads to targeted interventions for at-risk populations. Including SDOH in algorithms has relevance for transportability. When the development cohort represents a population with a heterogeneous distribution of SDOH associated with the outcome, including SDOH can improve algorithm generalizability to settings with a different distribution of SDOH.31 Conversely, when the development cohort is homogenous with respect to SDOH, inclusion in the predictive algorithm may be less helpful. However, in these settings, assessing this SDOH homogeneity can still inform the feasibility of transportability to new populations.

Area-level social indices

Social indices are composite area-level measurements often based on government data, such as the American Community Survey (ACS), that can be calculated at the state, county, census tract, census block group, or zip code tabulation area level.32 Sources of data for indices are scarce because only large-scale surveys are designed to be representative of small areas. Indices can represent multiple dimensions of social factors with a single measure and have been associated with many health outcomes.33–36

Social indices are typically developed for identifying at-risk geographic areas to prioritize resource allocation. Table 2 includes examples of indices, along with the motivation for their development and uses that extend beyond their original design. Notably, most measures (with the exception of ICE) do not consider structural racism, which has a pronounced effect on health disparities.34,44–46

Table 2. Selected area-level social indices.

Index	Purpose and additional uses	SDOH domains	
Social Vulnerability Index (SVI)37	Primary: Natural disaster preparedness

Additional: Guide COVID-19 testing and vaccine distribution38

	Socioeconomic status, household composition and disability, minority status and language, and housing type and transportation	
Social Deprivation Index (SDI)33	Primary: Measuring healthcare access

Additional: Component of a cardiovascular risk score adapted by the American Heart Association5

	Poverty, nonemployment, household composition and housing quality, transportation, and education	
Index of Concentration at the Extremes (ICE)34	Primary: Measuring disparity extremes

Additional: Measuring racial and economic segregation

	Minority status and income	
Neighborhood Stress Score (NSS)39	Primary: Payment risk adjustment for MassHealth	Education, employment, family composition, income, and transportation	
French Deprivation Score (FDep)40	Primary: Analysis and management of spatial health inequities in France	Education, employment, income, and transportation	
Area Deprivation Index (ADI)41,42	Primary: Area inequality measure to assess gradients in mortality

Additional: Incorporated in CMS insurance models43

	Age, education, employment, family composition, household amenities, housing quality, income, and transportation	

Incorporating indices in predictive algorithms

Decisions about whether and how to include social indices among predictors will vary depending on the outcome, other selected predictors, and composition of the development cohort. These considerations are also relevant when choosing indices for study sample comparisons and stratified evaluation by index.

Identifying relevant indices with causal graphs

The goal of including indices in a predictive algorithm is to capture relationships between social factors and the outcome, and should be informed by prior literature.47 In the case of progression to kidney failure, factors strongly associated with CKD outcomes include access to care, economic and racial segregation, neighborhood characteristics, as well as stress, social support, and family relationships.21 There is evidence of faster rates of CKD progression in Black and Native American populations25,26 as well as delayed and lower quality CKD care provided to Black patients.24 Appropriate management of early to moderate CKD consists primarily of lifestyle counseling and pharmacological treatment as well as management of prevalent comorbid conditions.48 We present a simplified representation of these possible causal processes in Figure 1A, distinguishing between area- and individual-level measures. Area income, segregation, and neighborhood resources impact levels of access to healthcare, healthy food, and safe physical activity, which in turn impact medical care received, diet, and physical activity.

Figure 1. Possible causal graphs representing the relationships between a selected subset of SDOH and variables used in KFRE. Measured variables are shown in yellow (if they are part of KFRE) or orange (if they are not). Unmeasured variables are shown in blue. (A) Causal graph with SDOH variables. (B) Causal graph with a subset of SDOH variables represented by selected indices (SDI, ICE) in red. eGFR, estimated glomerular filtration rate; uACR, urine albumin creatinine ratio.

Two possible causal graphs, labeled A and B. Graph A includes biological factors, individual-level variables and area-level factors. In graph B, three of the area-level factors are replaced with two indices (SDI and ICE).

Expressing these relationships with social indices involves identifying factors that incorporate unmeasured nodes in our causal graph. Two candidate indices fulfill those criteria: SDI and ICE (Figure 1B). SDI incorporates measures of poverty, nonemployment, household composition and housing quality, transportation, and education.33 ICE is a joint measure of racial and economic segregation.34 Among its variants, we consider one which, for a given area i (with population size Ti) compares the number of affluent White individuals (incomes ≥ 80th percentile nationally) Ai to the number of low-income non-White individuals (≤20th percentile) Pi: ICEi=(Ai-Pi)/Ti. While SDI and ICE measure overlapping concepts within SDOH domains (eg, income percentile and percent living in poverty), they each were created to capture domains the other does not (eg, racial segregation as a measure for structural racism, housing quality). As such, including both can be advantageous.

Geography and temporality

Because indices can be calculated at various geographic levels, the same index might have different interpretations and associations with the outcome with consequences for generalizability and transportability.20 Census tracts, for example, are more consistent in the number of people they capture than counties,49 and zip codes are designed for delivering mail rather than capturing relatively homogenous geographic areas and population sizes.20,50 When neighboring geographic areas are heterogeneous with respect to a specific factor used to calculate an index (eg, poverty), a larger geographic area that applies an average across them may mask those differences.21 Meanwhile, other factors, such as measures of relative inequality within an area, may not be measurable in small areas. For our KFRE example, we use SDI and ICE indices at the census-tract level to capture heterogeneity across neighborhoods.

The time between measurement of factors used to calculate indices and the outcome may impact the validity of an index for a given predictive task, especially if indices show considerable variation over time, if people move, or if pre-calculated indices are only available for specific years. Prior empirical evidence can help inform how long it takes for factors captured in indices (eg, income, food access, healthcare access) to affect a given outcome, and how rapidly the factors change over time. Because CKD develops slowly, exposures preceding kidney failure by as much as decades may be relevant for understanding current health. At the same time, current access to healthcare—captured by 2020 ACS-based indices—and effective management of comorbidities may have a larger effect on the speed of decline in later stages, which may be most relevant for the KFRE algorithm.

Distributions

Examining the distributions of indices can help assess collinearity and generalizability. SDI and ICE are 81% correlated at the census-tract level in the general US population. We are interested in studying the KFRE in a primary care setting and introduce a US primary care cohort,51 examining the SDI and ICE distributions in Figure 2. Figure 2A presents a joint distribution of the indices (correlation −0.83). While lower levels of SDI (lower access) are associated with higher concentrations of wealthy, White individuals in a geographic area (and higher levels of SDI are associated with higher concentrations of poorer, non-White individuals), SDI values for areas with low levels of concentration at the extremes (near ICE = 0) are spread across the entire range of the distribution. This provides evidence that it is not redundant to include both in our analysis. Figure 2B depicts the distributions of the 2 indices in the US population and the primary care cohort. Compared to the US population, the areas where individuals in the cohort reside tend to have higher concentrations of wealthy, White individuals and have higher levels of access to care; however, the populations overlap substantially.

Figure 2. Distributions of 2020 ICE and SDI in a US primary care cohort at the census-tract level. SDI ranges from 0 to 100, with 0 indicating higher levels of access. ICE ranges from −1 to 1, with −1 indicating higher levels of inequality. (A) Joint distribution of the 2 indices. (B) Comparisons of the index distributions in the cohort (red) and the general US population (blue) with mean values denoted using vertical lines. The mean values in part B are weighed by the population of each census tract (for US) or number of people in the given census tract (Cohort). In all figures, bars and cells corresponding to fewer than 11 individuals were suppressed for data privacy. ICE, Index of Concentration at the Extremes; SDI, Social Deprivation Index.

A 2D density plot of the joint distribution of the two indices in the study cohort, and a comparison of distributions of selected indices in the general US population and the study cohort.

Use of indices for further evaluation of generalizability and transportability

Whether indices are included in the predictive algorithm or not, they can still be useful for reasoning about generalizability and transportability. This may be through stratified evaluation of algorithm performance across quantiles as well as comparison of the distribution of indices between development cohort and target populations or across different study samples. For example, if a distribution of an index differs noticeably between the development cohort and target population, this may suggest that additional validation is necessary to ensure that the relationship captured in the algorithm transports to the target population.31

Discussion

SDOH account for many health inequities and are important for designing appropriate interventions to reduce these inequities.30,52–55 When clinical predictive algorithms are built with electronic health record data, the usefulness of the algorithm may be limited to individuals exposed to a similar, narrow set of social drivers. Consideration of relevant SDOH during algorithm development and evaluation can help validate algorithms and assess generalizability. Previously, no clear broad guidance has been available for identifying settings where incorporating social factors may be beneficial and how to do this rigorously.

We described a starting place for such guidance for incorporating social indices in predictive algorithms (summarized in Table 1) and the implications for interpretation, performance, generalizability, and transportability. These indices have several advantages, including their availability and validation. Despite this, they may not be the most appropriate SDOH variables to include if they reinforce unjust equilibriums or do not sufficiently capture causal paths. Indices reflect conditions of an individual’s environment, which may differ from individual-level factors, and when individual-level factors are most relevant, indices may not be appropriate proxies.56–58 Similarly, area-level factors may be preferable over indices.34,59 Moreover, while they have been used in predicting health outcomes,4,5 the indices were developed primarily for purposes other than building predictive algorithms. Additional validation is warranted for ascertaining whether they are appropriate to use in specific contexts. Finally, developing a more comprehensive set of guidelines for the use of social indices in health algorithms incorporating varied perspectives is an important area of future work.

Acknowledgments

The authors thank Professor Alyce Adams, Dr Robert Phillips, and Dr Andrew Bazemore for their insights on this work. The authors also thank Malcolm Barrett for code review.

Author contributions

Agata Foryciarz (Conceptualization, Data curation, Formal analysis, Investigation, Methodology, Project administration, Resources, Software, Visualization), Nicole Gladish (Conceptualization, Data curation, Formal analysis, Investigation, Resources, Software), David H. Rehkopf (Conceptualization, Investigation, Resources), and Sherri Rose (Conceptualization, Funding acquisition, Investigation, Methodology, Project administration, Resources, Supervision, Validation)

Funding

A.F. and S.R. were supported by National Institutes of Health [grant number R01LM013989]. N.G. and D.H.R. were supported by Robert Wood Johnson Foundation [grant number: 79319].

Conflicts of interest

None declared.

Data availability

The following acknowledgment text is included regarding data availability as described by the Stanford Center for Population Health Sciences Data Core (https://phsdocs.stanford.edu/v1.0/need-help/citing-phs-data-core): “Data for this project were accessed using the Stanford Center for Population Health Sciences Data Core. The PHS Data Core is supported by a National Institutes of Health National Center for Advancing Translational Science Clinical and Translational Science Award (UL1TR003142) and from Internal Stanford funding. The content is solely the responsibility of the authors and does not necessarily represent the official views of the NIH.”


References

1 Marmot M , FrielS, BellR, HouwelingTAJ, TaylorS; Commission on Social Determinants of Health. Closing the gap in a generation: health equity through action on the social determinants of health. Lancet. 2008;372:1661-1669.18994664 10.1016/S0140-6736(08)61690-6
2 World Health Organization. Social determinants of health. Accessed January 14, 2024. www.who.int/health-topics/social-determinants-of-health
3 Pronk N , KleinmanDV, GoeklerSF, OchiaiE, BlakeyC, BrewerKH.  Promoting health and well-being in Healthy People 2030. J Public Health Manag Pract. 2021;27:S242-S248.33278186 10.1097/PHH.0000000000001254 PMC8478321
4 Hippisley-Cox J , CouplandC, VinogradovaY, RobsonJ, MayM, BrindleP.  Derivation and validation of QRISK, a new cardiovascular disease risk score for the United Kingdom: prospective open cohort study. BMJ. 2007;335:136.17615182 10.1136/bmj.39261.471806.55 PMC1925200
5 Khan SS , CoreshJ, PencinaMJ, on behalf of the American Heart Association, et al  Novel prediction equations for absolute risk assessment of total cardiovascular disease incorporating cardiovascular-kidney-metabolic health: a scientific statement from the American Heart Association. Circulation. 2023;148:1982-2004.37947094 10.1161/CIR.0000000000001191
6 Wang M , PantellMS, GottliebLM, Adler-MilsteinJ.  Documentation and review of social determinants of health data in the EHR: measures and associated insights. J Am Med Inform Assoc. 2021;28:2608-2616.34549294 10.1093/jamia/ocab194 PMC8633631
7 Cook LA , SachsJ, WeiskopfNG.  The quality of social determinants data in the electronic health record: a systematic review. J Am Med Inform Assoc. 2021;29:187-196.34664641 10.1093/jamia/ocab199 PMC8714289
8 Linfield GH , PatelS, KoHJ, et al  Evaluating the comparability of patient-level social risk data extracted from electronic health records: a systematic scoping review. Health Informatics J. 2023;29:14604582231200300.37677012 10.1177/14604582231200300
9 Department of Health and Human Services, Centers For Medicare & Medicaid Services. Medicare Program; Hospital Inpatient Prospective Payment Systems for Acute Care Hospitals and the Long-Term Care Hospital Prospective Payment System and Policy Changes and Fiscal Year 2023 Rates; Quality Programs and Medicare Promoting Interoperability Program Requirements for Eligible Hospitals and Critical Access Hospitals; Costs Incurred for Qualified and Non-Qualified DeferredCompensation Plans; and Changes to Hospital and Critical Access Hospital Conditions of Participation. Final Rule. 2022;87:48780-49499.
10 Chen M , TanX, PadmanR.  Social determinants of health in electronic health records and their impact on analysis and risk prediction: a systematic review. J Am Med Inform Assoc. 2020;27:1764-1773.33202021 10.1093/jamia/ocaa143 PMC7671639
11 McWilliams JM , WeinrebG, DingL, NdumeleCD, WallaceJ.  Risk adjustment and promoting health equity in population-based payment: concepts and evidence. Health Aff (Millwood). 2023;42:105-114.36623215 10.1377/hlthaff.2022.00916 PMC9901844
12 Bergquist SL , LaytonTJ, McGuireTG, RoseS.  Data transformations to improve the performance of health plan payment methods. J Health Econ. 2019;66:195-207.31255968 10.1016/j.jhealeco.2019.05.005 PMC7442111
13 Gladish N , PhillipsR, OuyangD, HaoS, ChuI, RehkopfD. Social deprivation and vulnerability indices: SVI, ADI, SDI, NSS7, FDep, ICE; 2022. Accessed November 17, 2023. 10.57761/75cc-1t35
14 Breslau J , MartinL, TimbieJ, QureshiN, ZajdmanD.  Landscape of Area-Level Deprivation Measures and Other Approaches to Account for Social Risk and Social Determinants of Health in Health Care Payments. RAND Health Care; 2022.
15 Tangri N , StevensLA, GriffithJ, et al  A predictive model for progression of chronic kidney disease to kidney failure. JAMA. 2011;305:1553-1559.21482743 10.1001/jama.2011.451
16 Tangri N , GramsME, LeveyAS, CKD Prognosis Consortium, et al Multinational assessment of accuracy of equations for predicting risk of kidney failure: a meta-analysis. JAMA. 2016;315:164-174.26757465 10.1001/jama.2015.18202 PMC4752167
17 Solar O , IrwinA. A conceptual framework for action on the social determinants of health. WHO Geneva; 2010. ISBN: 9789241500852. Accessed January 10, 2024. https://www.who.int/publications/i/item/9789241500852
18 Kunitz SJ.  The Health of Populations: General Theories and Particular Realities. Oxford University Press; 2007.
19 Braveman PA , CubbinC, EgerterS, et al  Socioeconomic status in health research: one size does not fit all. JAMA. 2005;294:2879-2888.16352796 10.1001/jama.294.22.2879
20 Krieger N , ChenJT, WatermanPD, SoobaderM-J, SubramanianSV, CarsonR.  Geocoding and monitoring of US socioeconomic inequalities in mortality and cancer incidence: does the choice of area-based measure and geographic level matter?: the Public Health Disparities Geocoding Project. Am J Epidemiol. 2002;156:471-482.12196317 10.1093/aje/kwf068
21 Norton JM , Moxey-MimsMM, EggersPW, et al  Social determinants of racial disparities in CKD. J Am Soc Nephrol. 2016;27:2576-2595.27178804 10.1681/ASN.2016010027 PMC5004663
22 Hannan M , AnsariS, MezaN, Chronic Renal Insufficiency Cohort (CRIC) Study Investigators, et al  Risk factors for CKD progression: overview of findings from the CRIC Study. Clin J Am Soc Nephrol. 2021;16:648-659.33177074 10.2215/CJN.07830520 PMC8092061
23 Crews DC , LiuY, BoulwareLE.  Disparities in the burden, outcomes, and care of chronic kidney disease. Curr Opin Nephrol Hypertens. 2014;23:298-305.24662984 10.1097/01.mnh.0000444822.25991.f6 PMC4126677
24 Eneanya ND , BoulwareLE, TsaiJ, et al  Health inequities and the inappropriate use of race in nephrology. Nat Rev Nephrol. 2022;18:84-94.34750551 10.1038/s41581-021-00501-8 PMC8574929
25 McClellan W , WarnockDG, McClureL, et al  Racial differences in the prevalence of chronic kidney disease among participants in the Reasons for Geographic and Racial Differences in Stroke (REGARDS) Cohort Study. J Am Soc Nephrol. 2006;17:1710-1715.16641151 10.1681/ASN.2005111200
26 Saran R , RobinsonB, AbbottKC, et al  US Renal Data System 2016 Annual Data Report: epidemiology of kidney disease in the United States. Am J Kidney Dis. 2017;69:A7-A8.28236831 10.1053/j.ajkd.2016.12.004 PMC6605045
27 Cerdeña JP , PlaisimeMV, TsaiJ.  From race-based to race-conscious medicine: how anti-racist uprisings call us to act. Lancet. 2020;396:1125-1128.33038972 10.1016/S0140-6736(20)32076-6 PMC7544456
28 Chowkwanyun M.  The strange disappearance of history from racial health disparities research. Du Bois Rev. 2011;8:253-270.
29 Vyas DA , EisensteinLG, JonesDS.  Hidden in plain sight—reconsidering the use of race correction in clinical algorithms. N Engl J Med. 2020;383:874-882.32853499 10.1056/NEJMms2004740
30 Hood CM , GennusoKP, SwainGR, CatlinBB.  County health rankings: relationships between determinant factors and health outcomes. Am J Prev Med. 2016;50:129-135.26526164 10.1016/j.amepre.2015.08.024
31 Degtiar I , RoseS.  A review of generalizability and transportability. Annu Rev Stat Appl. 2023;10:501-524.
32 Rehkopf DH , GlymourMM, OsypukTL.  The consistency assumption for causal inference in social epidemiology: when a rose is not a rose. Curr Epidemiol Rep. 2016;3:63-71.27326386 10.1007/s40471-016-0069-5 PMC4912021
33 Butler DC , PettersonS, PhillipsRL, BazemoreAW.  Measures of social deprivation that predict health care access and need within a rational area of primary care service delivery. Health Serv Res. 2013;48:539-559.22816561 10.1111/j.1475-6773.2012.01449.x PMC3626349
34 Krieger N , WatermanPD, SpasojevicJ, LiW, MaduroG, Van WyeG.  Public health monitoring of privilege and deprivation with the index of concentration at the extremes. Am J Public Health. 2016;106:256-263.26691119 10.2105/AJPH.2015.302955 PMC4815605
35 Bevan GH , NasirK, RajagopalanS, Al-KindiS.  Socioeconomic deprivation and premature cardiovascular mortality in the United States. Mayo Clin Proc. 2022;97:1108-1113.35300876 10.1016/j.mayocp.2022.01.018 PMC10411485
36 Kind AJH , JencksS, BrockJ, et al  Neighborhood socioeconomic disadvantage and 30-day rehospitalization: a retrospective cohort study. Ann Intern Med. 2014;161:765-774.25437404 10.7326/M13-2946 PMC4251560
37 Flanagan BE , GregoryEW, HalliseyEJ, HeitgerdJL, LewisB.  A social vulnerability index for disaster management. J Homeland Security Emerg Manag. 2011;8:p0000102202154773551792. 10.2202/1547-7355.1792
38 Center for Disease Control. Innovative uses of SVI during COVID-19. Agency for Toxic Substances and Disease Registry. Accessed January 15, 2024. https://www.atsdr.cdc.gov/placeandhealth/project_snapshots/svitool_covid.html
39 Ash AS , MickEO, EllisRP, KiefeCI, AllisonJJ, ClarkMA.  Social determinants of health in managed care payment formulas. JAMA Intern Med. 2017;177:1424-1430.28783811 10.1001/jamainternmed.2017.3317 PMC5710209
40 Rey G, , JouglaE, , FouilletA, , HémonD.  Ecological association between a deprivation index and mortality in France over the period 1997-2001: variations with spatial scale, degree of urbanicity, age, gender and cause of death. BMC Public Health. 2009;9:33.19161613 10.1186/1471-2458-9-33 PMC2637240
41 Singh GK.  Area deprivation and widening inequalities in US mortality, 1969-1998. Am J Public Health. 2003;93:1137-1143.12835199 10.2105/ajph.93.7.1137 PMC1447923
42 Petterson S.  Deciphering the Neighborhood Atlas Area Deprivation Index: the consequences of not standardizing. Health Aff Sch. 2023;1:qxad063.38756979 10.1093/haschl/qxad063 PMC10986280
43 Kotecki L , BenjaminT. Area Deprivation Index introduced to the Medicare advantage value-based insurance design model for CY 2025; 2024. Accessed May 1, 2024. https://www.milliman.com/en/insight/area-deprivation-index-medicare-advantage-vbid-model-cy-2025
44 Yearby R , ClarkB, FigueroaJF.  Structural racism in historical and modern US Health Care Policy. Health Aff (Millwood). 2022;41:187-194.35130059 10.1377/hlthaff.2021.01466
45 Hardeman RR , HomanPA, ChantaratT, DavisBA, BrownTH.  Improving the measurement of structural racism to achieve antiracist health policy. Health Aff (Millwood). 2022;41:179-186.35130062 10.1377/hlthaff.2021.01489 PMC9680533
46 Groos M , WallaceM, HardemanR, TheallK.  Measuring inequity: a systematic review of methods used to quantify structural racism. J Health Dispar Res Pract. 2018;11:13.
47 Petersen ML , van der LaanMJ.  Causal models and learning from data. Epidemiology. 2014;25:418-426.24713881 10.1097/EDE.0000000000000078 PMC4077670
48 Wouters OJ , O'DonoghueDJ, RitchieJ, KanavosPG, NarvaAS.  Early chronic kidney disease: diagnosis, management and models of care. Nat Rev Nephrol. 2015;11:491-502.26055354 10.1038/nrneph.2015.85 PMC4531835
49 United States Bureau of the Census. Geographic Areas Reference Manual. U.S. Department of Commerce, Economics and Statistics Administration, Bureau of the Census; 1994.
50 Grubesic TH , MatisziwTC.  On the use of ZIP codes and ZIP code tabulation areas (ZCTAs) for the spatial analysis of epidemiological data. Int J Health Geogr. 2006;5:58.17166283 10.1186/1476-072X-5-58 PMC1762013
51 Phillips R. The PRIME registry helps thousands of primary care clinicians liberate EHR data and prepare for MIPS. J Am Board Fam Med. 2017;30:559.
52 Thornton RLJ , GloverCM, CenéCW, GlikDC, HendersonJA, WilliamsDR.  evaluating strategies for reducing health disparities by addressing the social determinants of health. Health Aff (Millwood). 2016;35:1416-1423.27503966 10.1377/hlthaff.2015.1357 PMC5524193
53 Haas JS , LinderJA, ParkER, et al  Proactive tobacco cessation outreach to smokers of low socioeconomic status: a randomized clinical trial. JAMA Intern Med. 2015;175:218-226.25506771 10.1001/jamainternmed.2014.6674 PMC4590783
54 Bloch G , RozmovitsL.  Implementing social interventions in primary care. CMAJ. 2021;193:E1696-E1701.34750179 10.1503/cmaj.210229 PMC8584375
55 Gottlieb LM , WingH, AdlerNE.  A systematic review of interventions on patients’ social and economic needs. Am J Prev Med. 2017;53:719-729.28688725 10.1016/j.amepre.2017.05.011
56 Moss JL , JohnsonNJ, YuM, AltekruseSF, CroninKA.  Comparisons of individual- and area-level socioeconomic status as proxies for individual-level measures: evidence from the Mortality Disparities in American Communities study. Popul Health Metr. 2021;19:1.33413469 10.1186/s12963-020-00244-x PMC7792135
57 Brown EM , FranklinSM, RyanJL, et al  Assessing area-level deprivation as a proxy for individual-level social risks. Am J Prev Med. 2023;65:1163-1171.37302512 10.1016/j.amepre.2023.06.006
58 Bensken WP , McGrathBM, GoldR, CottrellEK.  Area-level social determinants of health and individual-level social risks: assessing predictive ability and biases in social risk screening. J Clin Transl Sci. 2023;7:e257.38229891 10.1017/cts.2023.680 PMC10790234
59 Phillips RL , LiawW, CramptonP, et al  How other countries use deprivation indices—and why the United States desperately needs one. Health Aff (Millwood). 2016;35:1991-1998.27834238 10.1377/hlthaff.2016.0709
