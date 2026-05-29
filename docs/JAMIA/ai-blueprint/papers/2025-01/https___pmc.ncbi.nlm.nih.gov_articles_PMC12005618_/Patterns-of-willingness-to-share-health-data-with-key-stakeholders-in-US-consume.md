J Am Med Inform Assoc

. 2025 Jan 28;32(4):702–711. doi: [10.1093/jamia/ocaf014](https://doi.org/10.1093/jamia/ocaf014)

# Patterns of willingness to share health data with key stakeholders in US consumers: a latent class analysis

[Ashwini Nagappan](https://pubmed.ncbi.nlm.nih.gov/?term="Nagappan%20A"[Author])

### Ashwini Nagappan, PhD, MBE

1 Department of Health Policy and Management, Fielding School of Public Health, UCLA, Los Angeles, CA 90095, United States

Conceptualization, Data curation, Formal analysis, Methodology, Project administration, Validation, Visualization

Find articles by [Ashwini Nagappan](https://pubmed.ncbi.nlm.nih.gov/?term="Nagappan%20A"[Author])

1,✉, [Xi Zhu](https://pubmed.ncbi.nlm.nih.gov/?term="Zhu%20X"[Author])

### Xi Zhu, PhD

2 Department of Health Policy and Management, Fielding School of Public Health, UCLA, Los Angeles, CA 90095, United States

Formal analysis, Methodology, Validation

Find articles by [Xi Zhu](https://pubmed.ncbi.nlm.nih.gov/?term="Zhu%20X"[Author])

2

*   Author information
*   Article notes
*   Copyright and License information

1 Department of Health Policy and Management, Fielding School of Public Health, UCLA, Los Angeles, CA 90095, United States

2 Department of Health Policy and Management, Fielding School of Public Health, UCLA, Los Angeles, CA 90095, United States

✉

Corresponding author: Ashwini Nagappan, PhD, MBE, Department of Health Policy and Management, Fielding School of Public Health, UCLA, 650 Charles E Young Dr S, Los Angeles, CA 90095, United States (ashwininagappan@ucla.edu)

#### Roles

**Ashwini Nagappan**: PhD, MBE, Conceptualization, Data curation, Formal analysis, Methodology, Project administration, Validation, Visualization

**Xi Zhu**: PhD, Formal analysis, Methodology, Validation

Received 2024 Aug 27; Revised 2024 Dec 22; Accepted 2025 Jan 14; Collection date 2025 Apr.

© The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC12005618  PMID: [39873672](https://pubmed.ncbi.nlm.nih.gov/39873672/)

## Abstract

### Objective

To identify distinct patterns in consumer willingness to share health data with various stakeholders and analyze characteristics across consumer groups.

### Materials and Methods

Data from the Rock Health Digital Health Consumer Adoption Survey from 2018, 2019, 2020, and 2022 were analyzed. This study comprised a Census-matched representative sample of U.S. adults. Latent class analysis (LCA) identified groups of respondents with similar data-sharing attitudes. Groups were compared by sociodemographics, health status, and digital health utilization.

### Results

We identified three distinct LCA groups: (1) Wary (36.8%), (2) Discerning (47.9%), and (3) Permissive (15.3%). The Wary subgroup exhibited reluctance to share health data with any stakeholder, with predicted probabilities of willingness to share ranging from 0.07 for pharmaceutical companies to 0.34 for doctors/clinicians. The Permissive group showed a high willingness, with predicted probabilities greater than 0.75 for most stakeholders except technology companies and government organizations. The Discerning group was selective, willing to share with healthcare-related entities and family (predicted probabilities >0.62), but reluctant to share with other stakeholders (predicted probabilities <0.29). Individual characteristics were associated with LCA group membership.

### Discussion

Findings highlight a persistent trust in traditional healthcare providers. However, the varying willingness to share with non-traditional stakeholders suggests that while some consumers are open to sharing, others remain hesitant and selective. Data privacy policies and practices need to recognize and respond to multifaceted and stakeholder-specific attitudes.

### Conclusion

LCA reveals significant heterogeneity in health data-sharing attitudes among U.S. consumers, providing insights to inform the development of data privacy policies.

**Keywords:** data, privacy, confidentiality, patient-generated health data, latent class analysis

## Background

Consumers are increasingly generating health data outside of the traditional healthcare system through digital platforms, ranging from mobile apps and wearable devices to connected sensors.[1–4](#ocaf014-B1) While consumer-generated health data confers benefits to individuals, such as greater autonomy by enabling them to track and manage their own health information to make informed decisions, concerns arise regarding privacy and proper use of such data.[5](#ocaf014-B5),[6](#ocaf014-B6) Regulations such as the Health Insurance Portability and Accountability Act (HIPAA) and the Health Information Technology for Economic and Clinical Health (HITECH) Act exist to protect the identifiable health information collected by covered entities (eg, healthcare providers, payers) and their business associates[7](#ocaf014-B7),[8](#ocaf014-B8); however, a significant amount of consumer-generated health data falls outside the scope of these regulations.[1](#ocaf014-B1),[9](#ocaf014-B9)

This regulatory gap, along with broader concerns over data privacy, has prompted various states, including California,[10](#ocaf014-B10) Connecticut,[11](#ocaf014-B11) and Virginia,[12](#ocaf014-B12) to enact a patchwork of laws that create privacy rights for consumers over their data. In addition to state-level regulations, the Federal Trade Commission (FTC) has taken action against companies that have shared sensitive health information with major technology companies and others without disclosure to consumers.[13–15](#ocaf014-B13) As of April 2024, the FTC updated its Health Breach Notification Rule to enhance privacy safeguards for users of health apps and devices not covered under HIPAA, thereby aiming to bridge gaps in existing privacy protections.[16](#ocaf014-B16)

Despite these protective measures and enforcement actions, vast amounts of consumer health data are still shared in ways that consumers may not fully understand. This is exemplified by incidents where several direct-to-consumer (DTC) telehealth companies legally shared consumer health information with large technology companies without consumer consent,[17](#ocaf014-B17) and illegal health data breaches at digital health companies.[18](#ocaf014-B18) Such occurrences highlight the tradeoffs between the benefits of digital health data and the potential misuse of sensitive information.

The gaps in regulation surrounding digital health tools is concerning for several reasons. First, companies may make misleading claims or lack transparency in their privacy practices, leaving consumers at risk of being unaware of third-party data sharing[19](#ocaf014-B19); this lack of clarity may impede consumers’ ability to make informed decisions and lead them to erroneously believe their health data is protected when it is not.[20](#ocaf014-B20) Second, consumer misunderstanding of data protection practices is particularly troublesome because consumers often turn to these tools for privacy reasons, especially in cases where conditions bear a stigma, such as genital herpes and erectile dysfunction, and thus, prefer online services with minimal physician-patient interaction. Third, indiscriminate data sharing could cause harm to specific populations, such as menstruating individuals who use digital health apps to track menstruation or fertility following the Dobbs decision and members of the LGBTQ+ community who rely on digital tools to discreetly manage aspects of their identity.[14](#ocaf014-B14)

Previous research has explored consumer attitudes towards health data privacy, focusing on demographics, the type of health data, and the recipients of this data, such as researchers and healthcare providers, as major influencing factors.[21–25](#ocaf014-B21) However, most studies tend to narrowly focus on data sharing with either traditional healthcare entities or non-traditional stakeholders in healthcare, such as technology companies, without examining a range of stakeholders in the same study.[23](#ocaf014-B23),[25–30](#ocaf014-B25) In the studies that include a breadth of stakeholders, there remains a gap in understanding how these attitudes intersect with consumer utilization of digital health tools.[5](#ocaf014-B5),[30–34](#ocaf014-B30)

Given the plethora of data generated digitally, the encroachment of technology companies in healthcare, and the ethical implications of non-consensual data sharing, this study sought to examine consumer willingness to share health data across a diverse array of stakeholders, including technology companies, healthcare providers, and pharmaceutical companies. This research aims to contribute to the ongoing discourse on digital health data privacy, trust in various stakeholders, and the ethical management of health data outside traditional healthcare settings.

## Objective

The objective of this study was 2-fold. First, we aimed to identify distinct patterns in the willingness of consumers to share their health data with various stakeholders. Given that consumer attitudes toward health data sharing are multifaceted, understanding differences by stakeholder is crucial for developing policies that respond to distinct consumer preferences. To characterize these distinct consumer segments, we employed latent class analysis (LCA), a statistical technique used to identify unobserved groups of consumers within a population based on responses across multiple variables, specifically their willingness to share health data with different stakeholders. Second, following the identification of these latent classes, we further analyzed the sociodemographic, health status, and digital health utilization differences across these groups. By understanding factors associated with the likelihood of being in different groups, this study sought to characterize the variation in consumer attitudes toward health data sharing with different stakeholders and inform the development of data privacy policies that are attuned to the diverse preferences of consumers.

## Materials and methods

### Data

This study utilized data from the Rock Health Digital Health Consumer Adoption Survey, which provided the only nationally representative survey data on consumer behaviors and attitudes toward digital health tools, with surveys conducted annually since 2015.[2](#ocaf014-B2),[35](#ocaf014-B35) This data source has been used or referenced in prior research and discussion papers.[36](#ocaf014-B36),[37](#ocaf014-B37) The survey consisted of a series of single-item questions covering sociodemographics, health profiles, and consumer use of and attitudes towards digital health tools, such as telemedicine, health metrics tracking, and online information-seeking behaviors. It also asked respondents about their attitudes towards health data sharing and trust in various information sources. The survey questions were developed by subject matter experts and was piloted with a subsample each year to ensure content validity.

For this study, datasets from 2018, 2019, 2020, and 2022 were analyzed, excluding 2021 due to a temporary change in the survey question for our main variables (ie, willingness to share health information with different stakeholders). The cumulative sample size for this repeated cross-sectional sample is 23 994, with the annual sample sizes as follows: 2018 (_n_ = 4000), 2019 (_n_ = 4000), 2020 (_n_ = 7980), and 2022 (_n_ = 8014).

The survey was administered by Toluna, an online survey management organization, using a Census-matching, stratified random sampling methodology. This approach involved randomly selecting participants from a large, diverse panel of potential respondents to match the composition of the U.S. Census, ensuring representation across the following sociodemographic and geographic variables: age, race/ethnicity, gender, annual household income, and geographic region. Demographic information for respondents and non-respondents was compared to identify potential biases in survey participation and adjust panel management during the sampling process. Survey respondents were not excluded from participating in the study in subsequent years, and 3.7% (_n_ = 892) of the cumulative sample participated in the survey more than once across different years. The overall response rate was 65%. All respondents provided informed consent for survey participation. Data collection and retention followed General Data Protection Regulation-compliant procedures, with personal information being erased within 6-12 months of collection and panelist data erased within three years of inactivity.

The University of California, Los Angeles (UCLA) Institutional Review Board approved this study.

### Study variables

#### Willingness to share health data

Respondents were asked the following question: “Please indicate which of the following individuals or organizations you would be willing to share your health information with (eg, your medical records, test results, prescription drug history, genetic information, and physical activity data). Select all that apply.” These nine stakeholders included: (1) a technology company, (2) a healthcare technology company, (3) the respondent’s family members, (4) the respondent’s health insurance company, (5) the respondent’s pharmacy, (6) the respondent’s doctor/clinician, (7) a research institution, (8) a government organization, or (9) a pharmaceutical company. The survey allowed respondents to select any stakeholders they were willing to share their health information with, including the option to opt for none; thus, a binary (yes/no) response was recorded for each stakeholder.

#### Covariates

All covariates and their measurement methodologies are summarized in [Appendix S1](#sup1). The survey’s sociodemographic questions gathered information on age, annual household income, highest level of educational attainment, rurality, gender, health insurance coverage, and race/ethnicity. The race/ethnicity variable was represented by a series of non-mutually exclusive binary variables, allowing multiple selections to reflect complex identities. The survey asked participants to report their health status on a five-point scale and diagnosis of select chronic conditions. Additionally, this study incorporated variables related to digital health utilization. These include prior telemedicine utilization across various modalities, characterized by live video, live phone, picture or video, text messaging, email, or use of apps or websites; use of digital tools, such as wearables or digital journals, for tracking health metrics; and online health information-seeking behavior, specifically regarding prescription drugs and/or side effects, medical diagnoses, or treatment options.

### Statistical analysis

Latent class analysis (LCA) was employed to identify distinct groups within the sample based on patterns of their willingness to share health information with the nine stakeholders. A series of models were fitted,[37](#ocaf014-B37) starting with a single-class model and incrementally adding classes until the model fit ceased to improve. The optimal number of latent classes was determined through a review of statistical fit indices, including the Akaike information criterion (AIC) and Bayesian information criterion (BIC). Class membership probabilities were examined to understand the distribution of respondents across the identified latent classes.

For each latent class, descriptive statistics of covariates were obtained. Given the categorical nature of the variables, a chi-square test of equal proportions was used to compare sociodemographic, health status, and digital health utilization variables across the classes. Subsequently, multinomial logistic regression models were conducted to explore covariates associated with class membership, with a focus on sociodemographic and digital health utilization variables. There was no missing data in our dataset because the survey methodology required complete response. However, for certain demographic questions (ie, educational attainment, gender, and race/ethnicity) where a small percentage of participants selected “prefer not to say” (0.67% of the total sample), these responses were treated as missing data in our regression analysis using listwise deletion. All analyses were conducted using Stata version 16.1 (StataCorp).

#### Sensitivity analysis

Several sensitivity analyses were conducted to compare latent classes derived from pre-pandemic and pandemic periods. First, LCA was performed using data from 2018 and 2019 to establish a pre-pandemic baseline. Then, LCA was performed using data from 2020 and 2022 to assess whether latent classes shifted due to pandemic effects.

## Results

Our sample included 23 994 respondents, and demographic characteristics of the sample are presented in [Table 1](#ocaf014-T1).

### Table 1.

Respondent demographic characteristics (_N_ = 23 994).

|  | n (%) |
| --- | --- |
| Age |  |
| 18-24 | 2885 (12.0) |
| 25-34 | 4312 (18.0) |
| 35-44 | 4186 (17.5) |
| 45-54 | 4012 (16.7) |
| 55-64 | 3846 (16.0) |
| 65+ | 4753 (19.8) |
| Income |  |
| <$25 000 | 4998 (20.8) |
| $25 000-49 999 | 5474 (22.8) |
| $50 000-74 999 | 4115 (17.2) |
| $75 000-99 999 | 2825 (11.8) |
| ≥$100 000 | 6431 (26.8) |
| Prefer not to say | 151 (0.6) |
| Education |  |
| Less than high school | 610 (2.5) |
| High school graduate | 5245 (21.9) |
| Some college/associate’s degree | 7839 (32.7) |
| Bachelor's degree | 5467 (22.8) |
| Advanced degree | 4750 (19.8) |
| Prefer not to say | 83 (0.4) |
| Area description |  |
| Rural | 4647 (19.4) |
| Suburban | 10 705 (44.6) |
| Urban | 8642 (36.0) |
| Gender |  |
| Female | 12 152 (50.7) |
| Male | 11 727 (48.9) |
| Other | 85 (0.4) |
| Prefer not to say | 30 (0.1) |
| Health insurance |  |
| Commercial | 11 537 (48.1) |
| Medicare | 5196 (21.7) |
| Medicaid | 3670 (15.3) |
| Other insurance | 1199 (5.0) |
| Uninsured | 1605 (6.7) |
| Don’t know | 787 (3.3) |
| Race/ethnicity |  |
| NH-White | 15 786 (65.8) |
| NH-Black/African American | 2759 (11.5) |
| NH-Native American or Alaska Native | 153 (0.6) |
| NH-Asian/Pacific Islander | 1127 (4.7) |
| Hispanic/Latinx | 3669 (15.3) |
| NH-Multiracial | 330 (1.4) |
| NH-Other | 94 (0.4) |
| Prefer not to say | 76 (0.3) |

[Open in a new tab](table/ocaf014-T1/)

The three-class LCA model was selected based on an assessment of goodness-of-fit statistics ([Appendix S2](#sup1)). While AIC and BIC decreased from one to eight classes, indicating better fit with each additional class, improvement in fit plateaued after three classes, suggesting that the three-class model was the best model. There was also an issue of convergence starting from the four-class model. Non-convergence indicates that the results of the model may not be interpretable, and estimating additional classes is usually stopped once convergence issues are encountered.[37](#ocaf014-B37)

[Figure 1](#ocaf014-F1) shows the predicted probabilities of willingness to share health information with each stakeholder by latent class. Given the distinct patterns of willingness to share health information by the three groups of respondents, they can be described as (1) the Wary group, (2) the Discerning group, and (3) the Permissive group. The Wary group, comprising 37% (_n_ = 8823) of the respondents, demonstrated a low probability of being willing to share health data across all stakeholders. Individuals in this class were most willing to share their health information with physicians with a moderate predicted probability (Pr = 0.34), followed by their family (Pr = 0.21). Respondents in the Wary group were least willing to share their health information with pharmaceutical companies, government organizations, and research organizations (Pr ranges from 0.07 to 0.09). Within the Discerning group, which represents 48% (_n_ = 11 505) of respondents, a bifurcation in health data-sharing attitudes was evident. Members of this group showed high probabilities of willingness to share health data with physicians, family, health insurance companies, and pharmacies (Pr ranges from 0.62 to 0.97); however, they were very unwilling to share their health information with technology companies, government organizations, and pharmaceutical companies (Pr ranges from 0.00 to 0.09). The Permissive group (15%; _n_ = 3666) generally exhibited a high willingness to share health data with most stakeholders. Though, the exceptions were technology companies (Pr = 0.37) and government organizations (Pr = 0.41), for which the probability of sharing was somewhat reduced but still relatively high compared to the two other latent groups. Across all latent groups, the highest willingness to share data was with physicians. Please refer to [Appendix S3](#sup1) for exact predicted probabilities.

### Figure 1.

[![Radar plot showing predicted probabilities of willingness to share health data with nine stakeholders across three latent classes.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/2b76/12005618/9f550f8f57b2/ocaf014f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005618_ocaf014f1.jpg)

[Open in a new tab](figure/ocaf014-F1/)

Predicted probabilities of willingness to share health data for each stakeholder by latent class.

Compared to the main analytical sample’s LCA output, the first sensitivity analysis (2018 and 2019) exhibited a similar class breakdown. The second sensitivity analysis (2020 and 2022), which includes the pandemic years, yielded largely consistent results. Examining the composition of the three groups across different time frames, Class 1 consistently remained Wary, Class 2 remained Discerning, and Class 3 remained Permissive, suggesting that the pandemic may have not significantly shifted these attitudinal patterns.

### Characteristics of latent classes

Sociodemographic variations exist across the three latent groups, and these differences were statistically significant (_P_ < .001), as shown in [Table 2](#ocaf014-T2). The Wary group’s respondents, compared to the other two groups, reported higher percentages of being in younger age brackets (18-44) and living in urban areas. This group had a slightly higher percentage of uninsured individuals. In contrast, the Discerning group’s respondents reported a higher percentage of being in older age brackets (55+), with a higher proportion being Medicare recipients. The Permissive group exhibited a balanced age distribution, with a nearly equal representation of females and males. Notably, the Permissive group had a slightly higher percentage of individuals on Medicaid.

#### Table 2.

Sociodemographics of three groups (_N_ = 23 994).

|  | Wary n (%) | Discerning n (%) | Permissive n (%) | P-value |
| --- | --- | --- | --- | --- |
| Total respondents | 8823 (36.8) | 11 505 (47.9) | 3666 (15.3) |  |
| Age |  |  |  | <.001 |
| 18-24 | 1499 (17.0) | 1009 (8.8) | 377 (10.3) |  |
| 25-34 | 2113 (24.0) | 1497 (13.0) | 702 (19.2) |  |
| 35-44 | 2151 (24.4) | 1411 (12.3) | 624 (17.0) |  |
| 45-54 | 1427 (16.2) | 1941 (16.9) | 644 (17.6) |  |
| 55-64 | 880 (10.0) | 2339 (20.3) | 627 (17.1) |  |
| 65+ | 753 (8.5) | 3308 (28.8) | 692 (18.9) |  |
| Income |  |  |  | <.001 |
| <$25 000 | 1954 (22.2) | 2368 (20.6) | 676 (18.4) |  |
| $25 000-49 999 | 1874 (21.2) | 2731 (23.7) | 869 (23.7) |  |
| $50 000-74 999 | 1224 (13.9) | 2197 (19.1) | 694 (18.9) |  |
| $75 000-99 999 | 953 (10.8) | 1412 (12.3) | 460 (12.6) |  |
| ≥$100 000 | 2735 (31.0) | 2735 (23.8) | 961 (26.2) |  |
| Prefer not to say | 83 (0.9) | 62 (0.5) | 6 (0.2) |  |
| Education |  |  |  | <.001 |
| Less than high school | 323 (3.7) | 205 (1.8) | 82 (2.2) |  |
| High school graduate | 2059 (23.3) | 2480 (21.6) | 706 (19.3) |  |
| Some college/associate’s degree | 2428 (27.5) | 4083 (35.5) | 1328 (36.2) |  |
| Bachelor's degree | 1728 (19.6) | 2857 (24.8) | 882 (24.1) |  |
| Advanced degree | 2228 (25.3) | 1859 (16.2) | 663 (18.1) |  |
| Prefer not to say | 57 (0.7) | 21 (0.2) | 5 (0.1) |  |
| Area description |  |  |  | <.001 |
| Rural | 1378 (15.6) | 2519 (21.9) | 750 (20.5) |  |
| Suburban | 3377 (38.3) | 5628 (48.9) | 1700 (46.4) |  |
| Urban | 4068 (46.1) | 3358 (29.2) | 1216 (33.2) |  |
| Gender |  |  |  | <.001 |
| Female | 3951 (44.8) | 6374 (55.4) | 1827 (49.8) |  |
| Male | 4817 (54.6) | 5085 (44.2) | 1825 (49.8) |  |
| Other | 32 (0.4) | 39 (0.3) | 14 (0.4) |  |
| Prefer not to say | 23 (0.3) | 7 (0.1) | 0 (0.0) |  |
| Health insurance |  |  |  | <.001 |
| Commercial | 4452 (50.5) | 5278 (45.9) | 1807 (49.3) |  |
| Medicare | 1101 (12.5) | 3330 (28.9) | 765 (20.9) |  |
| Medicaid | 1438 (16.3) | 1598 (13.9) | 634 (17.3) |  |
| Other insurance | 539 (6.1) | 502 (4.4) | 158 (4.3) |  |
| Uninsured | 731 (8.3) | 626 (5.4) | 248 (6.8) |  |
| Don’t know | 562 (6.4) | 171 (1.5) | 54 (1.5) |  |
| Race/ethnicity |  |  |  | <.001 |
| NH-White | 5144 (58.3) | 8108 (70.5) | 2534 (69.1) |  |
| NH-Black/African American | 1420 (16.1) | 1050 (9.1) | 289 (7.9) |  |
| NH-Native American or Alaska Native | 83 (0.9) | 45 (0.4) | 25 (0.7) |  |
| NH-Asian/Pacific Islander | 487 (5.5) | 500 (4.4) | 140 (3.8) |  |
| Hispanic/Latinx | 1488 (16.9) | 1591 (13.8) | 590 (16.1) |  |
| NH-Multiracial | 112 (1.3) | 148 (1.3) | 70 (1.9) |  |
| NH-Other | 33 (0.4) | 49 (0.4) | 12 (0.3) |  |
| Prefer not to say | 56 (0.6) | 14 (0.1) | 6 (0.2) |  |

[Open in a new tab](table/ocaf014-T2/)

[Table 3](#ocaf014-T3) reveals varying health profiles across the three latent groups. Respondents in the Wary group mostly self-reported good or excellent health. The Discerning and Permissive groups showed a higher prevalence of having at least one chronic condition.

#### Table 3.

Health profile and digital health utilization of three groups (_N_ = 23 994).

|  | Wary n (%) | Discerning n (%) | Permissive n (%) | P-value |
| --- | --- | --- | --- | --- |
| Total respondents | 8823 (36.8) | 11 505 (47.9) | 3666 (15.3) |  |
| Health profile |  |  |  |  |
| Self-rated health status |  |  |  | <.001 |
| Very poor | 81 (0.9) | 82 (0.7) | 45 (1.2) |  |
| Poor | 300 (3.4) | 690 (6.0) | 256 (7.0) |  |
| Moderate | 1489 (16.9) | 2631 (22.9) | 840 (22.9) |  |
| Good | 4040 (45.8) | 6373 (55.4) | 1853 (50.6) |  |
| Excellent | 2913 (33.0) | 1729 (15.0) | 672 (18.3) |  |
| Any chronic conditions |  |  |  | <.001 |
| No | 3973 (45.0) | 3980 (34.6) | 1184 (32.3) |  |
| Yes | 4850 (55.0) | 7525 (65.4) | 2482 (67.7) |  |
| Digital health utilization |  |  |  |  |
| Telemedicine user |  |  |  | <.001 |
| No | 1979 (22.4) | 3153 (27.4) | 818 (22.3) |  |
| Yes | 6844 (77.6) | 8352 (72.6) | 2848 (77.7) |  |
| Digital health tracker |  |  |  | <.001 |
| No | 3801 (43.1) | 5909 (51.4) | 1548 (42.2) |  |
| Yes | 5022 (56.9) | 5596 (48.6) | 2118 (57.8) |  |
| Online information seeker |  |  |  | <.001 |
| No | 2665 (30.2) | 3109 (27.0) | 716 (19.5) |  |
| Yes | 6158 (69.8) | 8396 (73.0) | 2950 (80.5) |  |

[Open in a new tab](table/ocaf014-T3/)

The three latent groups also demonstrated distinct digital health utilization patterns ([Table 3](#ocaf014-T3)). The Wary and Permissive groups exhibited higher utilization rates of telemedicine services, outpacing the Discerning group. Further, respondents in the Wary and Permissive groups were more likely to use digital health tools to track their health metrics. Conversely, individuals in the Permissive group were most likely to seek health information online, with 80.5% engaging in this behavior compared to 69.8% of Wary respondents and 73.0% of Discerning respondents.

### Factors associated with latent class membership

Multinomial logistic regression was used to assess factors associated with membership in the latent classes, with the Wary group serving as the reference group, and relative risk ratios (RRR) and 95% confidence intervals (CI) presented ([Table 4](#ocaf014-T4)).

#### Table 4.

Multinomial logistic regression predicting class membership (_N_ = 23 834).[a](#tblfn1)

|  | Discerning vs Wary |  | Permissive vs Wary |  |
| --- | --- | --- | --- | --- |
|  | RRR | (95% CI) | RRR | (95% CI) |
| Age (ref: 18-24) |  |  |  |  |
| 25-34 | 1.06 | (0.95-1.18) | 1.25c | (1.08-1.45) |
| 35-44 | 1.05 | (0.94-1.18) | 1.08 | (0.93-1.27) |
| 45-54 | 1.88b | (1.68-2.11) | 1.52b | (1.30-1.77) |
| 55-64 | 3.33b | (2.95-3.76) | 2.26b | (1.92-2.66) |
| 65+ | 5.64b | (4.97-6.40) | 3.03b | (2.55-3.59) |
| Gender (ref: Female) |  |  |  |  |
| Male | 0.73b | (0.68-0.77) | 0.91d | (0.84-0.99) |
| Other | 1.26 | (0.75-2.11) | 1.35 | (0.70-2.63) |
| Education (ref: <High school) |  |  |  |  |
| High school graduate | 1.62b | (1.33-1.98) | 1.23 | (0.95-1.61) |
| Some college/associate's degree | 2.12b | (1.74-2.57) | 1.80b | (1.39-2.34) |
| Bachelor's degree | 2.32b | (1.90-2.84) | 1.77b | (1.35-2.31) |
| Advanced degree | 1.37c | (1.12-1.69) | 1.07 | (0.82-1.41) |
| Race/ethnicity (ref: NH-White) |  |  |  |  |
| NH-Black/African American | 0.62b | (0.57-0.69) | 0.48b | (0.41-0.55) |
| NH-Native American or Alaska Native | 0.50b | (0.34-0.73) | 0.74 | (0.46-1.17) |
| NH-Asian/Pacific Islander | 0.91 | (0.79-1.04) | 0.71c | (0.58-0.87) |
| Hispanic/Latinx | 0.97 | (0.89-1.06) | 0.94 | (0.84-1.06) |
| NH-Multiracial | 1.00 | (0.77-1.31) | 1.34 | (0.98-1.84) |
| NH-Other | 0.92 | (0.58-1.47) | 0.71 | (0.36-1.40) |
| Self-rated health status (ref: Excellent) |  |  |  |  |
| Very Poor | 1.33 | (0.95-1.88) | 2.20b | (1.48-3.28) |
| Poor | 2.21b | (1.88-2.60) | 2.53b | (2.08-3.09) |
| Moderate | 2.06b | (1.87-2.27) | 1.99b | (1.75-2.27) |
| Good | 1.92b | (1.78-2.07) | 1.69b | (1.52-1.87) |
| Chronic condition status | 1.05 | (0.98-1.12) | 1.20b | (1.09-1.31) |
| Telemedicine user | 0.85b | (0.79-0.92) | 0.90d | (0.81-1.00) |
| Digital health tracker | 0.98 | (0.92-1.05) | 1.17b | (1.07-1.28) |
| Online information seeker | 1.52b | (1.42-1.64) | 1.97b | (1.78-2.18) |

[Open in a new tab](table/ocaf014-T4/)

a

Reference group: Wary.

b

_P_ < .001.

c

_P_ < .01.

d

_P_ < .05.

Respondents 65 or older were more likely to be in both the Discerning (RRR: 5.64) and Permissive (RRR: 3.03) groups compared to those aged 18-24. Males were less likely to be in both the Discerning (RRR: 0.73) and Permissive (RRR: 0.91) groups compared to females. Higher education levels are associated with higher likelihoods of being in the Discerning group (RRRs: 1.62-2.32) and the Permissive group (RRRs: 1.07-1.80) compared to having less than a high school education. While the Wary group had a higher percentage of respondents with advanced degrees, the multinomial logistic regression results indicate that, when controlling for other factors, higher education levels are more strongly associated with the Discerning and Permissive groups. Respondents who identified as NH-Black/African American (Discerning RRR: 0.62; Permissive RRR = 0.48) or NH-Native American or Alaska Native (Discerning RRR = 0.50; Permissive RRR: 0.74) were less likely to be in both groups compared to those who identified as NH-White.

Respondents who rated their health as “Very Poor” were 1.33 times more likely to belong to the Discerning group and 2.20 times more likely to belong to the Permissive group, compared to the Wary group. In terms of digital health utilization, telemedicine users were less likely to be in the Discerning or Permissive groups, compared to the Wary group, with RRRs of 0.85 and 0.90, respectively. Conversely, online health information seekers were significantly more likely to be in the Discerning (RRR: 1.52) or Permissive (RRR: 1.97) groups relative to the Wary group. Digital health trackers were associated with a lower likelihood of belonging to the Discerning group (RRR: 0.98) but a higher likelihood of belonging to the Permissive group (RRR: 1.17), compared to the Wary group.

## Discussion

This study employed LCA to unearth patterns of consumer willingness to share health information with different stakeholders. The three groups—Wary, Discerning, and Permissive—highlight that consumer attitudes toward health data sharing are not monolithic; rather, there is heterogeneity in sharing preferences.

The Wary group demonstrated a consistently conservative approach to data sharing, exhibiting a strong reluctance to share their health data across all stakeholders. Their willingness to share data with pharmaceutical companies, government organizations, and research institutions was particularly low, suggesting concerns about privacy or intentions behind data use by these stakeholders.[30](#ocaf014-B30) Conversely, the Discerning group was characterized by their selective sharing preferences, showing willingness to share health data with traditional healthcare actors—physicians, family, health insurance companies, and pharmacies—but hesitation about sharing with technology companies, government organizations, and pharmaceutical companies. This differentiation may stem from established relationships with traditional entities skepticism about non-traditional healthcare entities’ motivations or data security practices.[38](#ocaf014-B38) The Discerning group had moderate trust in research organizations, perhaps suggesting conditional acceptance of sharing data for research. The Permissive group's broad willingness to share data, notably more so with health technology companies than general technology companies, exemplifies a novel insight into importance of the distinction for consumers in technology companies that are specialized in advancing healthcare, as opposed to technology companies at-large.

One notable finding is the relatively low willingness to share health data with technology companies and government organizations, even among the Discerning and Permissive groups, a result also supported by previous research.[30](#ocaf014-B30) Several potential reasons may explain this hesitation. Consumers may harbor concerns about data privacy, particularly around risks associated with data breaches involving technology companies and the potential for misuse by these companies.[39](#ocaf014-B39),[40](#ocaf014-B40) Also, it is possible that there may be a lack of transparency around how technology companies handle sensitive health data, which could erode consumer trust.[41](#ocaf014-B41) In terms of government organizations, concerns about surveillance or unintended uses of health data (eg, for law enforcement purposes) may also contribute to low willingness to share.[42](#ocaf014-B42)

Importantly, across all groups, the high willingness to share health data with physicians signifies not only patients’ enduring trust in traditional healthcare relationships but also a belief that data shared with physicians will be adequately protected. These findings mirror recent research findings on higher public trust and willingness to share data with clinical entities like physicians, doctors’ offices, and university hospitals, compared to technology companies.[2](#ocaf014-B2),[31](#ocaf014-B31),[32](#ocaf014-B32),[34](#ocaf014-B34) However, openness to sharing data with non-traditional stakeholders like health technology companies by the Permissive group suggests acceptance of data sharing practices outside traditional healthcare settings by certain consumers. It is reasonable to speculate that this permissiveness stems from a desire for convenience where individuals may focus on the benefits of data sharing without fully considering the potential downsides, such as a lack of awareness that data may be uploaded to the cloud system of an organization, which could pose privacy risks.

Existing literature suggests that sociodemographic variables are associated with data-sharing attitudes. This study revealed that younger respondents predominate the Wary group, possibly reflecting greater awareness, and consequently, cautiousness toward data privacy issues. Prior work found that age plays a role, though the findings appear to be mixed, with some suggesting that younger individuals are more willing to share compared to older individuals and vice-versa.[30](#ocaf014-B30) Older adults were predominantly found in the Discerning group, reflecting a tendency to adhere to the most “traditional” data sharing practice—willing to share with traditional actors but more cautiously with the newer entrants. The Wary group’s higher proportion of respondents identifying as Black/African American, compared to the percentages observed in the other two groups, may reflect broader societal issues such as distrust in medical institutions and concerns about privacy and discrimination.[43](#ocaf014-B43) Female individuals were more represented in the Discerning and Permissive groups, compared to male individuals, likely reflecting their proactive engagement in health management,[44](#ocaf014-B44),[45](#ocaf014-B45) though the literature presents varying findings on whether women have higher privacy concerns than men.[30](#ocaf014-B30)

Findings also suggest that individuals with poorer health conditions might be more inclined to share their health data, possibly in pursuit of better health management or treatment options. Similarly, those with chronic conditions were slightly more likely to be in the Discerning and Permissive groups, indicating a potential openness to sharing data as part of managing ongoing health issues. This accords with prior work suggesting that individuals with chronic or rare diseases may be more likely to recognize the value of data sharing in advancing medical knowledge and improving treatment availability.[30](#ocaf014-B30)

The intersection of digital health behaviors with data-sharing attitudes offers new insights, and this study uncovered some paradoxical insights regarding digital health utilization. Telemedicine users are more likely to be classified to the Wary group compared to the Discerning or Permissive groups, suggesting that, while these respondents use telemedicine, they remain very cautious about data sharing. One possible explanation is that these individuals may perceive telemedicine primarily as a means of accessing healthcare services, rather than as a technology involving significant data sharing. This highlights a potential incongruence between consumer attitudes and behaviors related to digital health. In contrast, respondents who actively sought online health information tended to be more discerning or permissive, indicating that individuals who actively seek health information might also be more comfortable with data sharing, perhaps viewing it as a valuable means to enhance their access to personalized health insights and resources. Additionally, the permissive respondents showed a greater proclivity to being digital health trackers, suggesting that individuals appear to select technologies that match their data sharing preferences.

By employing LCA, we gain several insights. First, instead of quantifying the magnitude of willingness to share health data (eg, low, medium, high),[2](#ocaf014-B2),[32](#ocaf014-B32),[34](#ocaf014-B34) our findings evinced a spectrum of attitudes across different stakeholders. This highlights that a matrix of variables may influence decisions to share health data. Second, the findings revealed that willingness to share health data may depend on the nature of the relationship one has with each stakeholder. For example, respondents exhibited greater willingness to share with entities with whom they have a direct, tangible relationship, such as family members and physicians. Third, health status and utilization of digital health are predictors of latent class membership. The interplay of these variables likely impacts the degree of willingness to share health data.

Overall, the results of this study indicate varying public perspectives on health data sharing by stakeholder. The Wary group’s absolutist stance against data sharing, irrespective of stakeholder, suggests an opportunity to further examine their concerns to inform privacy protections. However, it is also plausible that these individuals may not fully realize the benefits of health data sharing and may need to be better informed. In sharp contrast, it would be informative to evaluate what benefits the Permissive group sees in data sharing. Though, they saw a bright-line demarcation with technology companies and government organizations, underscoring that it would be wise for these entities to address privacy concerns and ensure transparency in data handling practices. For example, technology companies could implement clearer consent mechanisms, indicating how health data will be used and if it will be shared with third parties. For government organizations, policies that provide greater clarity on the purposes of data collection could help build trust. The Discerning group took a bifurcated approach to health data sharing: openness with traditional actors in healthcare and reluctance with distal stakeholders in one’s healthcare. Indeed, there may be a role for more trusted intermediaries, such as healthcare providers, to facilitate data sharing with non-traditional healthcare stakeholders.

This study has several limitations. By using secondary data from a single source, there may be inherent biases in the data. Variations in sample sizes across the years, particularly the doubling of the sample sizes post-pandemic, could skew the representation of public attitudes. The exclusion of 2021 data due to methodological differences limits the study's temporal consistency and comparability. Health insurance coverage was asked as a single-select question, limiting the ability to identify respondents with both Medicare and commercial insurance, a subset likely to represent higher income levels or greater access to healthcare resources. The lack of granularity on the specific types of health information consumers are willing to share (eg, genetic information versus physical activity data) restricts the depth of analysis regarding their privacy preferences. Furthermore, the study did not specify the purposes or intent behind data sharing, leaving respondents to interpret these aspects on their own, which may have led to varying perceptions of the potential benefits or tradeoffs associated with sharing their health information.

## Conclusion

Our analysis identified three distinct patterns of consumer willingness to share health information. The findings reveal variability in data sharing preferences, with higher willingness to share health information with traditional healthcare stakeholders, such as physicians, and more varied responses when it comes to non-traditional healthcare stakeholders like technology companies. It may be prudent for stakeholders to address areas of consumer concern to advance healthcare via data sharing.

## Supplementary Material

ocaf014\_Supplementary\_Data

[ocaf014\_supplementary\_data.zip](/articles/instance/12005618/bin/ocaf014_supplementary_data.zip) (39.8KB, zip)

## Acknowledgments

Thank you to Dr Corrina Moucheraud, Dr Anna Wexler, Dr Olivia Jung, and Dr Beth Glenn, for providing insightful comments on the study design and presentation of the findings, which greatly enhanced the clarity and rigor of this work. Thank you to Adriana Krasniansky and Madelyn Knowles from Rock Health for their assistance in procuring the necessary data, which was instrumental in facilitating this study.

## Contributor Information

Ashwini Nagappan, Department of Health Policy and Management, Fielding School of Public Health, UCLA, Los Angeles, CA 90095, United States.

Xi Zhu, Department of Health Policy and Management, Fielding School of Public Health, UCLA, Los Angeles, CA 90095, United States.

## Author contributions

Ashwini Nagappan was involved in conceptualization, data curation, formal analysis, methodology, project administration, validation, visualization, writing—original draft, and writing—review & editing; Xi Zhu was involved in formal analysis, methodology, validation, and writing—review & editing. All authors had full access to the data and accept responsibility to submit for publication.

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

A.N. was supported by the NIH/National Center for Advancing Translational Science (NCATS) UCLA CTSI \[TL1TR001883\]. The content is solely the responsibility of the authors and does not represent the official views of the NIH.

## Conflicts of interest

A.N. reported fees from Rock Health Inc outside the present study. All other authors declare no competing interests.

## Data availability

The data that support the findings of this study are available from Rock Health. Restrictions apply to the availability of these data, which were used under license for this study. Data are available from the authors with the permission of Rock Health.

## References

*   1. Sarasohn-Kahn J.  Consumer-generated data in a big data world: report from the California HealthCare Foundation. Health Affairs Forefront. 2014. 10.1377/forefront.20140820.040895 \[[DOI](https://doi.org/10.1377/forefront.20140820.040895)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Health%20Affairs%20Forefront&title=Consumer-generated%20data%20in%20a%20big%20data%20world:%20report%20from%20the%20California%20HealthCare%20Foundation&publication_year=2014&doi=10.1377/forefront.20140820.040895&)\]
*   2. Knowles M, Krasniansky A, Nagappan A. Consumer adoption of digital health in 2022: moving at the speed of trust | Rock Health. 2023. Accessed December 4, 2023. [https://rockhealth.com/insights/consumer-adoption-of-digital-health-in-2022-moving-at-the-speed-of-trust/](https://rockhealth.com/insights/consumer-adoption-of-digital-health-in-2022-moving-at-the-speed-of-trust/)
*   3. Vogels EA. About one-in-five Americans use a smart watch or fitness tracker. 2020. Accessed October 21, 2023. [https://www.pewresearch.org/short-reads/2020/01/09/about-one-in-five-americans-use-a-smart-watch-or-fitness-tracker/](https://www.pewresearch.org/short-reads/2020/01/09/about-one-in-five-americans-use-a-smart-watch-or-fitness-tracker/)
*   4. IQVIA. Consumer Health Apps and Digital Health Tools Proliferate, Improving Quality and Health Outcomes for Patients, Says New Report from IQVIA Institute—IQVIA. 2021. Accessed August 10, 2023. [https://www.iqvia.com/newsroom/2021/07/consumer-health-apps-and-digital-health-tools-proliferate-improving-quality-and-health-outcomes-for](https://www.iqvia.com/newsroom/2021/07/consumer-health-apps-and-digital-health-tools-proliferate-improving-quality-and-health-outcomes-for)
*   5. Ostherr K, Borodina S, Bracken RC, et al.  Trust and privacy in the context of user-generated health data. Big Data Soc. 2017;4:205395171770467. 10.1177/2053951717704673 \[[DOI](https://doi.org/10.1177/2053951717704673)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Big%20Data%20Soc&title=Trust%20and%20privacy%20in%20the%20context%20of%20user-generated%20health%20data&volume=4&publication_year=2017&pages=205395171770467&doi=10.1177/2053951717704673&)\]
*   6. McCoy MS, Allen AL, Kopp K, et al.  Ethical responsibilities for companies that process personal data. Am J Bioeth. 2023;23:11-23. 10.1080/15265161.2023.2209535 \[[DOI](https://doi.org/10.1080/15265161.2023.2209535)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37262312/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Bioeth&title=Ethical%20responsibilities%20for%20companies%20that%20process%20personal%20data&volume=23&publication_year=2023&pages=11-23&pmid=37262312&doi=10.1080/15265161.2023.2209535&)\]
*   7. U.S. Department of Health and Human Services. Summary of the HIPAA Privacy Rule | [HHS.gov](http://HHS.gov). 2022. Accessed August 10, 2023. [https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html](https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html)
*   8. U.S. Department of Health and Human Services. HITECH Act Enforcement Interim Final Rule | HHS.gov. Accessed August 10 2023. [https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html#:∼:text=The%20Health%20Information%20Technology%20for,use%20of%20health%20information%20technology](https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html#:~:text=The%20Health%20Information%20Technology%20for,use%20of%20health%20information%20technology)
*   9. Glenn T, Monteith S.  Privacy in the digital world: medical and health data outside of HIPAA protections. Curr Psychiatry Rep. 2014;16:494. 10.1007/s11920-014-0494-4 \[[DOI](https://doi.org/10.1007/s11920-014-0494-4)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/25218603/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Curr%20Psychiatry%20Rep&title=Privacy%20in%20the%20digital%20world:%20medical%20and%20health%20data%20outside%20of%20HIPAA%20protections&volume=16&publication_year=2014&pages=494&pmid=25218603&doi=10.1007/s11920-014-0494-4&)\]
*   10. Central District of California. California Consumer Privacy Act (CCPA) | State of California—Department of Justice—Office of the Attorney General. 2023. Accessed August 10, 2023. [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
*   11. The Office of the Attorney General. The Connecticut Data Privacy Act. 2022. Accessed August 10, 2023. [https://portal.ct.gov/AG/Sections/Privacy/The-Connecticut-Data-Privacy-Act#:∼:text=The%20CTDPA%20takes%20effect%20on,controllers%20that%20process%20personal%20data](https://portal.ct.gov/AG/Sections/Privacy/The-Connecticut-Data-Privacy-Act#:~:text=The%20CTDPA%20takes%20effect%20on,controllers%20that%20process%20personal%20data)
*   12. Code of Virginia. Consumer Data Protection Act. 2023. Accessed August 10, 2023). [https://law.lis.virginia.gov/vacode/title59.1/chapter53/](https://law.lis.virginia.gov/vacode/title59.1/chapter53/)
*   13. Federal Trade Commission. FTC Enforcement Action to Bar GoodRx from Sharing Consumers’ Sensitive Health Info for Advertising | Federal Trade Commission. 2023. Accessed August 10, 2023). [https://www.ftc.gov/news-events/news/press-releases/2023/02/ftc-enforcement-action-bar-goodrx-sharing-consumers-sensitive-health-info-advertising](https://www.ftc.gov/news-events/news/press-releases/2023/02/ftc-enforcement-action-bar-goodrx-sharing-consumers-sensitive-health-info-advertising)
*   14. Federal Trade Commission. FTC Finalizes Order with Flo Health, a Fertility-Tracking App that Shared Sensitive Health Data with Facebook, Google, and Others | Federal Trade Commission. 2021. Accessed August 10, 2023. [https://www.ftc.gov/news-events/news/press-releases/2021/06/ftc-finalizes-order-flo-health-fertility-tracking-app-shared-sensitive-health-data-facebook-google](https://www.ftc.gov/news-events/news/press-releases/2021/06/ftc-finalizes-order-flo-health-fertility-tracking-app-shared-sensitive-health-data-facebook-google)
*   15. Federal Trade Commission. Ovulation Tracking App Premom Will be Barred from Sharing Health Data for Advertising Under Proposed FTC Order. 2023. Accessed May 8, 2024. [https://www.ftc.gov/news-events/news/press-releases/2023/05/ovulation-tracking-app-premom-will-be-barred-sharing-health-data-advertising-under-proposed-ftc](https://www.ftc.gov/news-events/news/press-releases/2023/05/ovulation-tracking-app-premom-will-be-barred-sharing-health-data-advertising-under-proposed-ftc)
*   16. Federal Trade Commission. Updated FTC Health Breach Notification Rule puts new provisions in place to protect users of health apps and devices | Federal Trade Commission. 2024. Accessed May 8, 2024. [https://www.ftc.gov/business-guidance/blog/2024/04/updated-ftc-health-breach-notification-rule-puts-new-provisions-place-protect-users-health-apps?utm\_campaign=health\_tech&utm\_medium=email&\_hsenc=p2ANqtz-\_6yyNnHqh3lehp\_HrvHNwT53XXoqD119H\_Ut\_hywrq8\_m-ncV6rppsMT08bayjx-Q32Rf4E8kohr7Wt8LppVv-HMOWdA&\_hsmi=304979884&utm\_content=304979883&utm\_source=hs\_email](https://www.ftc.gov/business-guidance/blog/2024/04/updated-ftc-health-breach-notification-rule-puts-new-provisions-place-protect-users-health-apps?utm_campaign=health_tech&utm_medium=email&_hsenc=p2ANqtz-_6yyNnHqh3lehp_HrvHNwT53XXoqD119H_Ut_hywrq8_m-ncV6rppsMT08bayjx-Q32Rf4E8kohr7Wt8LppVv-HMOWdA&_hsmi=304979884&utm_content=304979883&utm_source=hs_email)
*   17. Palmer K, Feathers T, Fondrie-Teitler S. Telehealth startups sent sensitive health data to big tech companies. 2022. Accessed August 10, 2023. [https://www.statnews.com/2022/12/13/telehealth-facebook-google-tracking-health-data/](https://www.statnews.com/2022/12/13/telehealth-facebook-google-tracking-health-data/)
*   18. Franceschi-Bicchierai L. 23andMe confirms hackers stole ancestry data on 6.9 million users2023. Accessed May 8, 2024. [https://techcrunch.com/2023/12/04/23andme-confirms-hackers-stole-ancestry-data-on-6-9-million-users/](https://techcrunch.com/2023/12/04/23andme-confirms-hackers-stole-ancestry-data-on-6-9-million-users/)
*   19. Kalokairinou L, Choi R, Wei N, et al.  Policies of US companies offering direct-to-consumer laboratory tests. JAMA Intern Med. 2023;183:1275-1278. 10.1001/jamainternmed.2023.4726 \[[DOI](https://doi.org/10.1001/jamainternmed.2023.4726)\] \[[PMC free article](/articles/PMC10507587/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37721771/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Intern%20Med&title=Policies%20of%20US%20companies%20offering%20direct-to-consumer%20laboratory%20tests&volume=183&publication_year=2023&pages=1275-1278&pmid=37721771&doi=10.1001/jamainternmed.2023.4726&)\]
*   20. Grundy Q, Held FP, Bero LA.  Tracing the potential flow of consumer data: a network analysis of prominent health and fitness apps. J Med Internet Res. 2017;19:e233. 10.2196/jmir.7347 \[[DOI](https://doi.org/10.2196/jmir.7347)\] \[[PMC free article](/articles/PMC5508111/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28659254/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Med%20Internet%20Res&title=Tracing%20the%20potential%20flow%20of%20consumer%20data:%20a%20network%20analysis%20of%20prominent%20health%20and%20fitness%20apps&volume=19&publication_year=2017&pages=e233&pmid=28659254&doi=10.2196/jmir.7347&)\]
*   21. Schairer CE, Cheung C, Rubanovich CK, et al.  Disposition toward privacy and information disclosure in the context of emerging health technologies. J Am Med Inform Assoc. 2019;26:610-619. 10.1093/jamia/ocz010 \[[DOI](https://doi.org/10.1093/jamia/ocz010)\] \[[PMC free article](/articles/PMC6562158/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/30938756/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Disposition%20toward%20privacy%20and%20information%20disclosure%20in%20the%20context%20of%20emerging%20health%20technologies&volume=26&publication_year=2019&pages=610-619&pmid=30938756&doi=10.1093/jamia/ocz010&)\]
*   22. Lafky DB, Horan TA.  Personal health records. Health Informatics J. 2011;17:63-71. 10.1177/1460458211399403 \[[DOI](https://doi.org/10.1177/1460458211399403)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/25133771/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Health%20Informatics%20J&title=Personal%20health%20records&volume=17&publication_year=2011&pages=63-71&pmid=25133771&doi=10.1177/1460458211399403&)\]
*   23. Ackermann KA, Burkhalter L, Mildenberger T, et al.  Willingness to share data: contextual determinants of consumers’ decisions to share private data with companies. J Consumer Behav. 2022;21:375-386. 10.1002/cb.2012 \[[DOI](https://doi.org/10.1002/cb.2012)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Consumer%20Behav&title=Willingness%20to%20share%20data:%20contextual%20determinants%20of%20consumers%E2%80%99%20decisions%20to%20share%20private%20data%20with%20companies&volume=21&publication_year=2022&pages=375-386&doi=10.1002/cb.2012&)\]
*   24. Grande D, Marti XL, Merchant RM, et al.  Consumer views on health applications of consumer digital data and health privacy among US adults: qualitative interview study. J Med Internet Res. 2021;23:e29395. 10.2196/29395 \[[DOI](https://doi.org/10.2196/29395)\] \[[PMC free article](/articles/PMC8262668/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34106074/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Med%20Internet%20Res&title=Consumer%20views%20on%20health%20applications%20of%20consumer%20digital%20data%20and%20health%20privacy%20among%20US%20adults:%20qualitative%20interview%20study&volume=23&publication_year=2021&pages=e29395&pmid=34106074&doi=10.2196/29395&)\]
*   25. Rising CJ, Gaysynsky A, Blake KD, et al.  Willingness to share data from wearable health and activity trackers: analysis of the 2019 health information national trends survey data. JMIR Mhealth Uhealth. 2021;9:e29190. 10.2196/29190 \[[DOI](https://doi.org/10.2196/29190)\] \[[PMC free article](/articles/PMC8713093/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34898448/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JMIR%20Mhealth%20Uhealth&title=Willingness%20to%20share%20data%20from%20wearable%20health%20and%20activity%20trackers:%20analysis%20of%20the%202019%20health%20information%20national%20trends%20survey%20data&volume=9&publication_year=2021&pages=e29190&pmid=34898448&doi=10.2196/29190&)\]
*   26. Seltzer E, Goldshear J, Guntuku SC, et al.  Patients’ willingness to share digital health and non-health data for research: a cross-sectional study. BMC Med Inform Decis Mak. 2019;19:157. 10.1186/s12911-019-0886-9 \[[DOI](https://doi.org/10.1186/s12911-019-0886-9)\] \[[PMC free article](/articles/PMC6686530/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31395102/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Inform%20Decis%20Mak&title=Patients%E2%80%99%20willingness%20to%20share%20digital%20health%20and%20non-health%20data%20for%20research:%20a%20cross-sectional%20study&volume=19&publication_year=2019&pages=157&pmid=31395102&doi=10.1186/s12911-019-0886-9&)\]
*   27. Kim KK, Sankar P, Wilson MD, et al.  Factors affecting willingness to share electronic health data among California consumers. BMC Med Ethics. 2017;18:25. | [https://link.springer.com/article/10.1186/s12910-017-0185-x#Sec7](https://link.springer.com/article/10.1186/s12910-017-0185-x#Sec7). Accessed May 3, 2024. \[[DOI](https://doi.org/10.1186/s12910-017-0185-x)\] \[[PMC free article](/articles/PMC5381052/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28376801/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Ethics&title=Factors%20affecting%20willingness%20to%20share%20electronic%20health%20data%20among%20California%20consumers&volume=18&publication_year=2017&pages=25&pmid=28376801&doi=10.1186/s12910-017-0185-x&)\]
*   28. Kim KK, Joseph JG, Ohno-Machado L.  Comparison of consumers’ views on electronic data sharing for healthcare and research. J Am Med Inform Assoc. 2015;22:821-830. 10.1093/jamia/ocv014 \[[DOI](https://doi.org/10.1093/jamia/ocv014)\] \[[PMC free article](/articles/PMC5009901/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/25829461/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Comparison%20of%20consumers%E2%80%99%20views%20on%20electronic%20data%20sharing%20for%20healthcare%20and%20research&volume=22&publication_year=2015&pages=821-830&pmid=25829461&doi=10.1093/jamia/ocv014&)\]
*   29. Trinidad MG, Platt J, Kardia SLR.  The public’s comfort with sharing health data with third-party commercial companies. Humanit Soc Sci Commun. 2020;7:149. 10.1057/s41599-020-00641-5 \[[DOI](https://doi.org/10.1057/s41599-020-00641-5)\] \[[PMC free article](/articles/PMC8320359/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34337435/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Humanit%20Soc%20Sci%20Commun&title=The%20public%E2%80%99s%20comfort%20with%20sharing%20health%20data%20with%20third-party%20commercial%20companies&volume=7&publication_year=2020&pages=149&pmid=34337435&doi=10.1057/s41599-020-00641-5&)\]
*   30. Baines R, Stevens S, Austin D, et al.  Patient and public willingness to share personal health data for third-party or secondary uses: systematic review. J Med Internet Res. 2024;26:e50421. 10.2196/50421 \[[DOI](https://doi.org/10.2196/50421)\] \[[PMC free article](/articles/PMC10951832/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38441944/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Med%20Internet%20Res&title=Patient%20and%20public%20willingness%20to%20share%20personal%20health%20data%20for%20third-party%20or%20secondary%20uses:%20systematic%20review&volume=26&publication_year=2024&pages=e50421&pmid=38441944&doi=10.2196/50421&)\]
*   31. Gupta R, Iyengar R, Sharma M, et al.  Consumer views on privacy protections and sharing of personal digital health information. JAMA Netw Open. 2023;6:e231305. 10.1001/jamanetworkopen.2023.1305 \[[DOI](https://doi.org/10.1001/jamanetworkopen.2023.1305)\] \[[PMC free article](/articles/PMC9982693/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/36862410/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open&title=Consumer%20views%20on%20privacy%20protections%20and%20sharing%20of%20personal%20digital%20health%20information&volume=6&publication_year=2023&pages=e231305&pmid=36862410&doi=10.1001/jamanetworkopen.2023.1305&)\]
*   32. Gupta R, Sharma M, Cannuscio CC, et al.  Consumer confidence in public and private organizations to use their digital health data responsibly. J Gen Intern Med. 2023;38:1087-1090. 10.1007/s11606-022-07895-6 \[[DOI](https://doi.org/10.1007/s11606-022-07895-6)\] \[[PMC free article](/articles/PMC9646265/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/36352201/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Gen%20Intern%20Med&title=Consumer%20confidence%20in%20public%20and%20private%20organizations%20to%20use%20their%20digital%20health%20data%20responsibly&volume=38&publication_year=2023&pages=1087-1090&pmid=36352201&doi=10.1007/s11606-022-07895-6&)\]
*   33. Grande D, Mitra N, Iyengar R, et al.  Consumer willingness to share personal digital information for health-related uses. JAMA Netw Open. 2022;5:e2144787. 10.1001/jamanetworkopen.2021.44787 \[[DOI](https://doi.org/10.1001/jamanetworkopen.2021.44787)\] \[[PMC free article](/articles/PMC8787615/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35072717/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open&title=Consumer%20willingness%20to%20share%20personal%20digital%20information%20for%20health-related%20uses&volume=5&publication_year=2022&pages=e2144787&pmid=35072717&doi=10.1001/jamanetworkopen.2021.44787&)\]
*   34. Ghafur S, Dael JV, Leis M, et al.  Public perceptions on data sharing: key insights from the UK and the USA. Lancet Digit Health. 2020;2:e444-e446. 10.1016/s2589-7500(20)30161-8 \[[DOI](https://doi.org/10.1016/s2589-7500\(20\)30161-8)\] \[[PMC free article](/articles/PMC7380931/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32838250/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Lancet%20Digit%20Health&title=Public%20perceptions%20on%20data%20sharing:%20key%20insights%20from%20the%20UK%20and%20the%20USA&volume=2&publication_year=2020&pages=e444-e446&pmid=32838250&doi=10.1016/s2589-7500\(20\)30161-8&)\]
*   35. Adams A, Shankar M, Tecco H. 50 things we now know about digital health consumers. Rock Health. 2016. Accessed December 22, 2024. [https://rockhealth.com/insights/digital-health-consumer-adoption-2016/](https://rockhealth.com/insights/digital-health-consumer-adoption-2016/)
*   36. Nagappan A, Krasniansky A, Knowles M.  Patterns of ownership and usage of wearable devices in the United States, 2020–2022: survey study. J Med Internet Res. 2024;26:e56504. 10.2196/56504 \[[DOI](https://doi.org/10.2196/56504)\] \[[PMC free article](/articles/PMC11316147/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/39058548/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Med%20Internet%20Res&title=Patterns%20of%20ownership%20and%20usage%20of%20wearable%20devices%20in%20the%20United%20States,%202020%E2%80%932022:%20survey%20study&volume=26&publication_year=2024&pages=e56504&pmid=39058548&doi=10.2196/56504&)\]
*   37. Tung JY, Shaw RJ, Hagenkord JM, Nursing DUS of, et al.  Accelerating precision health by applying the lessons learned from direct-to-consumer genomics to digital health technologies. NAM Perspect. 2018;8. 10.31478/201803c \[[DOI](https://doi.org/10.31478/201803c)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NAM%20Perspect&title=Accelerating%20precision%20health%20by%20applying%20the%20lessons%20learned%20from%20direct-to-consumer%20genomics%20to%20digital%20health%20technologies&volume=8&publication_year=2018&doi=10.31478/201803c&)\]
*   38. Abdelhamid M, Gaia J, Sanders GL.  Putting the focus back on the patient: how privacy concerns affect personal health information sharing intentions. J Med Internet Res. 2017;19:e169. 10.2196/jmir.6877 \[[DOI](https://doi.org/10.2196/jmir.6877)\] \[[PMC free article](/articles/PMC5617905/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28903895/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Med%20Internet%20Res&title=Putting%20the%20focus%20back%20on%20the%20patient:%20how%20privacy%20concerns%20affect%20personal%20health%20information%20sharing%20intentions&volume=19&publication_year=2017&pages=e169&pmid=28903895&doi=10.2196/jmir.6877&)\]
*   39. Kang C. F.T.C. Study Finds ‘Vast Surveillance’ of Social Media Users. 2024. _The New York Times_. Accessed October 24, 2024. [https://www.nytimes.com/2024/09/19/technology/ftc-meta-tiktok-privacy-surveillance.html](https://www.nytimes.com/2024/09/19/technology/ftc-meta-tiktok-privacy-surveillance.html)
*   40. Whittaker Z. The biggest data breaches in 2024: 1 billion stolen records and rising. 2024. _TechCrunch_. Accessed October 24, 2024. [https://techcrunch.com/2024/10/14/2024-in-data-breaches-1-billion-stolen-records-and-rising/](https://techcrunch.com/2024/10/14/2024-in-data-breaches-1-billion-stolen-records-and-rising/)
*   41. Anant V, Donchak L, Kaplan J, et al. Consumer data protection and privacy. McKinsey. 2020. Accessed December 14, 2024). [https://www.mckinsey.com/capabilities/risk-and-resilience/our-insights/the-consumer-data-opportunity-and-the-privacy-imperative](https://www.mckinsey.com/capabilities/risk-and-resilience/our-insights/the-consumer-data-opportunity-and-the-privacy-imperative)
*   42. McGraw D, Mandl KD.  Privacy protections to encourage use of health-relevant digital data in a learning health system. NPJ Digit Med. 2021;4:2. 10.1038/s41746-020-00362-8 \[[DOI](https://doi.org/10.1038/s41746-020-00362-8)\] \[[PMC free article](/articles/PMC7782585/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33398052/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NPJ%20Digit%20Med&title=Privacy%20protections%20to%20encourage%20use%20of%20health-relevant%20digital%20data%20in%20a%20learning%20health%20system&volume=4&publication_year=2021&pages=2&pmid=33398052&doi=10.1038/s41746-020-00362-8&)\]
*   43. Bazargan M, Cobb S, Assari S.  Discrimination and medical mistrust in a racially and ethnically diverse sample of California adults. Ann Fam Med. 2021;19:4-15. 10.1370/afm.2632 \[[DOI](https://doi.org/10.1370/afm.2632)\] \[[PMC free article](/articles/PMC7800756/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33431385/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Ann%20Fam%20Med&title=Discrimination%20and%20medical%20mistrust%20in%20a%20racially%20and%20ethnically%20diverse%20sample%20of%20California%20adults&volume=19&publication_year=2021&pages=4-15&pmid=33431385&doi=10.1370/afm.2632&)\]
*   44. Consumer Health Survey: Three Things the Underrepresented Female Consumer Still Wants. Accessed October 24, 2024. [https://www.oliverwyman.com/our-expertise/perspectives/health/2018/mar/healthcare\_consumer.html](https://www.oliverwyman.com/our-expertise/perspectives/health/2018/mar/healthcare_consumer.html)
*   45. Bertakis KD, Azari R, Helms LJ, et al.  Gender differences in the utilization of health care services. J Fam Pr. 2000;49:147-152. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/10718692/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Fam%20Pr&title=Gender%20differences%20in%20the%20utilization%20of%20health%20care%20services&volume=49&publication_year=2000&pages=147-152&pmid=10718692&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocaf014\_Supplementary\_Data

[ocaf014\_supplementary\_data.zip](/articles/instance/12005618/bin/ocaf014_supplementary_data.zip) (39.8KB, zip)

### Data Availability Statement

The data that support the findings of this study are available from Rock Health. Restrictions apply to the availability of these data, which were used under license for this study. Data are available from the authors with the permission of Rock Health.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**