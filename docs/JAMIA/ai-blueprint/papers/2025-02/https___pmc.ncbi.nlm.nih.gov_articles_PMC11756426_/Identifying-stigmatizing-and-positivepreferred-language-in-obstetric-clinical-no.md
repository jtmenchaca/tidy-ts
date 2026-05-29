J Am Med Inform Assoc

. 2024 Nov 21;32(2):308–317. doi: [10.1093/jamia/ocae290](https://doi.org/10.1093/jamia/ocae290)

# Identifying stigmatizing and positive/preferred language in obstetric clinical notes using natural language processing

[Jihye Kim Scroggins](https://pubmed.ncbi.nlm.nih.gov/?term="Scroggins%20JK"[Author])

### Jihye Kim Scroggins, PhD, RN

1 School of Nursing, Columbia University, New York, NY 10032, United States

Find articles by [Jihye Kim Scroggins](https://pubmed.ncbi.nlm.nih.gov/?term="Scroggins%20JK"[Author])

1,✉, [Ismael I Hulchafo](https://pubmed.ncbi.nlm.nih.gov/?term="Hulchafo%20II"[Author])

### Ismael I Hulchafo, MD, MS

2 School of Nursing, Columbia University, New York, NY 10032, United States

Find articles by [Ismael I Hulchafo](https://pubmed.ncbi.nlm.nih.gov/?term="Hulchafo%20II"[Author])

2, [Sarah Harkins](https://pubmed.ncbi.nlm.nih.gov/?term="Harkins%20S"[Author])

### Sarah Harkins, BSN, RN

3 School of Nursing, Columbia University, New York, NY 10032, United States

Find articles by [Sarah Harkins](https://pubmed.ncbi.nlm.nih.gov/?term="Harkins%20S"[Author])

3, [Danielle Scharp](https://pubmed.ncbi.nlm.nih.gov/?term="Scharp%20D"[Author])

### Danielle Scharp, PhD, APRN, FNP-BC

4 Icahn School of Medicine, Mount Sinai, NY 10029, United States

Find articles by [Danielle Scharp](https://pubmed.ncbi.nlm.nih.gov/?term="Scharp%20D"[Author])

4, [Hans Moen](https://pubmed.ncbi.nlm.nih.gov/?term="Moen%20H"[Author])

### Hans Moen, PhD

5 Department of Computer Science, Aalto University, Espoo 02150, Finland

Find articles by [Hans Moen](https://pubmed.ncbi.nlm.nih.gov/?term="Moen%20H"[Author])

5, [Anahita Davoudi](https://pubmed.ncbi.nlm.nih.gov/?term="Davoudi%20A"[Author])

### Anahita Davoudi, PhD

6 VNS Health, New York, NY 10017, United States

Find articles by [Anahita Davoudi](https://pubmed.ncbi.nlm.nih.gov/?term="Davoudi%20A"[Author])

6, [Kenrick Cato](https://pubmed.ncbi.nlm.nih.gov/?term="Cato%20K"[Author])

### Kenrick Cato, PhD, RN, CPHIMS, FAAN

7 School of Nursing, University of Pennsylvania, Philadelphia, PA 19104, United States

Find articles by [Kenrick Cato](https://pubmed.ncbi.nlm.nih.gov/?term="Cato%20K"[Author])

7, [Michele Tadiello](https://pubmed.ncbi.nlm.nih.gov/?term="Tadiello%20M"[Author])

### Michele Tadiello, MMCi, BSN

8 Center for Community-Engaged Health Informatics and Data Science, Columbia University Irving Medical Center, New York, NY 10032, United States

Find articles by [Michele Tadiello](https://pubmed.ncbi.nlm.nih.gov/?term="Tadiello%20M"[Author])

8, [Maxim Topaz](https://pubmed.ncbi.nlm.nih.gov/?term="Topaz%20M"[Author])

### Maxim Topaz, PhD, RN

9 School of Nursing, Columbia University, New York, NY 10032, United States

Find articles by [Maxim Topaz](https://pubmed.ncbi.nlm.nih.gov/?term="Topaz%20M"[Author])

9,#, [Veronica Barcelona](https://pubmed.ncbi.nlm.nih.gov/?term="Barcelona%20V"[Author])

### Veronica Barcelona, PhD, RN

10 School of Nursing, Columbia University, New York, NY 10032, United States

Find articles by [Veronica Barcelona](https://pubmed.ncbi.nlm.nih.gov/?term="Barcelona%20V"[Author])

10,#

*   Author information
*   Article notes
*   Copyright and License information

1 School of Nursing, Columbia University, New York, NY 10032, United States

2 School of Nursing, Columbia University, New York, NY 10032, United States

3 School of Nursing, Columbia University, New York, NY 10032, United States

4 Icahn School of Medicine, Mount Sinai, NY 10029, United States

5 Department of Computer Science, Aalto University, Espoo 02150, Finland

6 VNS Health, New York, NY 10017, United States

7 School of Nursing, University of Pennsylvania, Philadelphia, PA 19104, United States

8 Center for Community-Engaged Health Informatics and Data Science, Columbia University Irving Medical Center, New York, NY 10032, United States

9 School of Nursing, Columbia University, New York, NY 10032, United States

10 School of Nursing, Columbia University, New York, NY 10032, United States

✉

Corresponding author: Jihye Kim Scroggins, PhD, RN, School of Nursing, Columbia University, 560 W 168th St, New York, NY 10032, United States (jks2238@cumc.columbia.edu)

#

M. Topaz and V. Barcelona contributed equally and are considered co-senior authors of this work.

Received 2024 Jul 10; Revised 2024 Oct 23; Accepted 2024 Nov 6; Collection date 2025 Feb.

© The Author(s) 2024. Published by Oxford University Press on behalf of the American Medical Informatics Association.

This is an Open Access article distributed under the terms of the Creative Commons Attribution License ([https://creativecommons.org/licenses/by/4.0/](https://creativecommons.org/licenses/by/4.0/)), which permits unrestricted reuse, distribution, and reproduction in any medium, provided the original work is properly cited.

[PMC Copyright notice](/about/copyright/)

PMCID: PMC11756426  PMID: [39569431](https://pubmed.ncbi.nlm.nih.gov/39569431/)

## Abstract

### Objective

To identify stigmatizing language in obstetric clinical notes using natural language processing (NLP).

### Materials and Methods

We analyzed electronic health records from birth admissions in the Northeast United States in 2017. We annotated 1771 clinical notes to generate the initial gold standard dataset. Annotators labeled for exemplars of 5 stigmatizing and 1 positive/preferred language categories. We used a semantic similarity-based search approach to expand the initial dataset by adding additional exemplars, composing an enhanced dataset. We employed traditional classifiers (Support Vector Machine, Decision Trees, and Random Forest) and a transformer-based model, ClinicalBERT (Bidirectional Encoder Representations from Transformers) and BERT base. Models were trained and validated on initial and enhanced datasets and were tested on enhanced testing dataset.

### Results

In the initial dataset, we annotated 963 exemplars as stigmatizing or positive/preferred. The most frequently identified category was marginalized language/identities (_n_ = 397, 41%), and the least frequent was questioning patient credibility (_n_ = 51, 5%). After employing a semantic similarity-based search approach, 502 additional exemplars were added, increasing the number of low-frequency categories. All NLP models also showed improved performance, with Decision Trees demonstrating the greatest improvement (21%). ClinicalBERT outperformed other models, with the highest average F1-score of 0.78.

### Discussion

Clinical BERT seems to most effectively capture the nuanced and context-dependent stigmatizing language found in obstetric clinical notes, demonstrating its potential clinical applications for real-time monitoring and alerts to prevent usages of stigmatizing language use and reduce healthcare bias. Future research should explore stigmatizing language in diverse geographic locations and clinical settings to further contribute to high-quality and equitable perinatal care.

### Conclusion

ClinicalBERT effectively captures the nuanced stigmatizing language in obstetric clinical notes. Our semantic similarity-based search approach to rapidly extract additional exemplars enhanced the performances while reducing the need for labor-intensive annotation.

**Keywords:** natural language processing, electronic health records, health communication, bias, nursing informatics

## Introduction

Stigmatizing language refers to language that unintentionally or intentionally conveys potentially harmful or discriminatory meanings, perpetuating socially constructed power dynamics.[1](#ocae290-B1) Stigmatizing language can convey implicit and/or explicit bias towards patients, particularly for marginalized populations.[1](#ocae290-B1),[2](#ocae290-B2) Bias in healthcare contributes to health disparities, including unequal care in terms of the number and quality of clinician-patient interactions.[3](#ocae290-B3),[4](#ocae290-B4) Bias also hinders the development of positive patient-clinician relationships and contributes to medical mistrust, which have been associated with disengagement and dissatisfaction in healthcare, exacerbating health disparities.[2](#ocae290-B2),[5](#ocae290-B5) Due to the known disparities in pregnancy and birth-related health outcomes among perinatal populations,[6](#ocae290-B6) it is critically important to identify stigmatizing language to prevent bias and disparities in obstetric care settings. Despite that, the existing body of research around stigmatizing language is limited and primarily focuses on general medicine populations, which may miss discipline-specific stigmatizing language.[7](#ocae290-B7)

Clinical notes in electronic health records (EHRs) represent a rich data that often contain stigmatizing language.[7](#ocae290-B7) However, about 80% of EHR data is stored in an unstructured format, making it difficult to analyze using traditional analytic approaches.[8](#ocae290-B8) Recent advances in natural language processing (NLP) have enabled the analysis of this large text data to identify critical health concepts,[9](#ocae290-B9) such as stigmatizing language. NLP can efficiently process large unstructured text data from EHR, automatically extracting and categorizing text data into more meaningful information for clinicians.[10](#ocae290-B10) NLP is a powerful method designed to understand context, sentiment, and semantic of human language within the text,[11](#ocae290-B11) making it particularly suitable for identifying stigmatizing language which is often highly nuanced and contextual.[2](#ocae290-B2) While emerging studies have used NLP to identify stigmatizing language, they often rely on rule-based NLP models with keyword searches based on predetermined list of terms, limiting to capture the full spectrum of nuanced stigmatizing language.[12](#ocae290-B12),[13](#ocae290-B13)

Our research team is pioneering the work on identifying stigmatizing language in obstetric care settings using clinical notes in EHR from hospital birth admissions. We piloted a NLP study to identify 2 broad categories of stigmatizing language: marginalized and power/privilege language.[13](#ocae290-B13) In this pilot study, marginalized language broadly referred to mentions of less socially desirable characteristics, negative connotations, or clinician’s disapproval. Examples included “patient denies illicit drug use” and “patient states baby will sleep in their bed. \[social work\] intern discussed though this may be cultural, it is important for baby to have his own bed.”[12](#ocae290-B12) Power/privilege language broadly referred to more socially desirable characteristics that may reflect signs of clinician’s approval,[14](#ocae290-B14) such as “patient reports having a nurturing marriage” and “husband is a neurosurgeon.”[13](#ocae290-B13) These previous studies provided a conceptual basis for stigmatizing language categories and a methodological foundation for further NLP model development. However, our pilot NLP study focused on only 2 broad categories of stigmatizing language. We conducted additional qualitative content analyses and further refined these 2 broad categories into multiple subcategories that describe more nuanced and specific stigmatizing language used in the current study. To capture the full spectrum of stigmatizing language more accurately, developing more advanced NLP models to identify and distinguish specific subcategories is essential.

In the current study, we first conducted human annotation of EHR notes to develop a labeled gold standard dataset. We sought to identify additional, refined stigmatizing language categories including preferred/positive language. We trained and tested various NLP models to determine the best performing model. We employed traditional classification models, such as Support Vector Machine (SVM) and Decision Trees, and advanced NLP models, ClinicalBERT (Bidirectional Encoder Representations from Transformers) and BERT base, that may be advantageous in identifying more nuanced language categories. In addition, we found limited exemplars of the new stigmatizing language categories from initial human annotation, which would challenge comprehensive NLP system training. Having scant training data is a common issue in NLP model development for specialized domains and tasks where initial human labeled training data are limited.[15](#ocae290-B15) To overcome this issue, we employed a streamlined approach based on semantic similarity to search and extract additional exemplars in clinical notes to enhance the performance of NLP models.

## Methods

### Data and study population

We used EHR data from patients >20 weeks’ gestation who were admitted for labor and birth at 2 urban hospitals in the Northeast United States in 2017. The full dataset included 742 503 notes, encompassing 556 different note types. All clinical notes recorded in the EHR during the inpatient stay were considered eligible. Clinical note types that did not contain substantive clinician narrative texts describing patient assessments or impressions were excluded, such as medication orders, transfer notes, and template-based statements about procedures or operations. Seven clinical note types were included in the current study (obstetric postpartum note, obstetric admission note, obstetric triage note, anesthesia resident note, miscellaneous nursing note, social work initial assessment, and initial nutrition assessment). These narrative clinical notes were preprocessed and prepared for analysis. The current study followed the ethical standards and received the Institutional Review Board approval from Columbia University Medical Center (AAAT9870).

### Human annotation of clinical notes

We randomly sampled at least 100 notes from each of the 7 note types to generate a human-annotated gold standard dataset. Four annotators with expertise in qualitative research and/or clinical nursing independently annotated clinical notes following an established codebook and procedure. The codebook was created based on iterative inductive-deductive content analysis and is published in detail elsewhere.[12](#ocae290-B12) Two annotators reviewed and annotated the same clinical notes to ensure the reliability of the annotation. Any disagreement was resolved through iterative discussions among annotators and with the entire research team. Annotators manually identified and labeled _exemplar_ sentences that contained stigmatizing and positive/preferred language within the clinical notes. These exemplars typically span between 1 and 3 sentences and were used to develop the NLP models. Annotators ensured these exemplars were from the free-text section of clinical notes by carefully examining the writing style, format, and location of the texts. For example, “obese” or “obesity” in the structured sections of the note displayed a uniform language and format across different notes of the same note type. Conversely, documentations in the free-text sections are more individualized and distinct, conveying specific details and nuanced information about the patient rather than generic diagnosis (eg, obese with specific body mass index number that is applicable to the specific patient).

### Extracting additional exemplars to enhance training dataset

We aimed to improve the overall performance of the NLP models by increasing the number of exemplars, particularly for the categories with scant exemplars, in a less manually intensive way. We developed and employed a new approach based on semantic similarity search to expand the initial dataset of human-annotated exemplars while limiting the required manual labor of reading through and annotating the clinical notes from scratch. This new approach uses initial human-annotated exemplars as queries. Then, it searches and recommends new exemplars that are likely candidates from a larger dataset of unused clinical notes. In turn, the human annotators can relatively quickly review the recommended candidates and verify whether or not they are relevant exemplars of stigmatizing language.

To search for additional exemplars that were similar to the initial human-annotated exemplars, a sentence-transformer model was used (“multi-qa-distilbert-cos-v1”)[16](#ocae290-B16) to first encode exemplars into fixed size vectorized embeddings.[17](#ocae290-B17) Semantic similarity between exemplars (queries and candidates) were calculated using the cosine similarity metric applied to their associated embedding representations. The FAISS library was used to efficiently perform similarity searches.[18](#ocae290-B18) We included clinical notes that were unused for human annotation but were from the same note types. We preprocessed these notes by extracting the free-text portions using regular expressions and performed tasks such as removing special characters (eg, &quot;), handling abbreviations (eg, “pt.”), and normalizing text case. We converted the sentences into a similar format as the exemplars in the initial human-annotated (gold standard) dataset by forming them into single, double, or triple consecutive sentences to be prepared for the sentence transformer.

We randomly selected 250 human-annotated exemplars, representing a diverse range of language categories, to be used as queries. For each query (for each of the 250 exemplars), we retrieved the top 5 similar exemplars with the highest cosine similarities (resulting in 1250 exemplar candidates). Four annotators checked if these exemplar candidates were relevant. This approach yielded 502 additional exemplars that contain stigmatizing and positive/preferred language. The set of initial human-annotated exemplars were referred to as the initial dataset (IN) and the additional exemplars as the expanded dataset (EX). The combined set of initial and additional exemplars were referred to as the enhanced dataset (EN).

### Developing NLP models

An overview of this study’s approach is presented in [Figure 1](#ocae290-F1). In preparing and designing our model, the initial dataset was compiled, including a balanced, equal number of positive and negative case exemplars (_Nin_ = 1926). We also added an equal number of negative case exemplars (text where stigmatizing language does not appear) for the expanded dataset (_Nex_ = 1004). The negative case exemplars were randomly sampled from clinical notes not flagged for stigmatizing content, ensuring their length and context were analogous to the positive case exemplars.

#### Figure 1.

[![Graphical representation of overall study approach, depicting a three-phase workflow: data preparation, data split, and model performance evaluation.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/2e6b/11756426/4d3210530bd0/ocae290f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756426_ocae290f1.jpg)

[Open in a new tab](figure/ocae290-F1/)

Overview of approach. Abbreviations: BERT, Bidirectional Encoder Representations from Transformers; ML, Machine Learning.

Both initial and expanded datasets were stratified into training (60%), validation (20%), and testing (20%) datasets, maintaining category distribution to preserve data integrity. The split datasets were combined to form final enhanced training (_nin+ex_ = 1757), validation (_nin+ex_ = 586), and testing datasets (_nin+ex_ = 587). As a general approach, we used the training and validation datasets to train the models and tested the performance on the enhanced testing dataset. We performed these tasks for both models trained on the initial and enhanced datasets to compare the performances before and after augmenting the training with additional exemplars.

We employed and trained the following NLP models: SVM, Decision Trees, Random Forests, ClinicalBERT,[19](#ocae290-B19) and BERT base.[20](#ocae290-B20) For the first 3 NLP models (traditional classifiers), we used the term frequency-inverse document frequency (TF-IDF) for feature generation and chi-squared feature selection.[21](#ocae290-B21),[22](#ocae290-B22) We combined the training and validation datasets into a single dataset, which we used to perform stratified 5-fold cross-validation with sample weights was implemented to ensure equitable evaluation and address class imbalances. Within each fold, Bayesian hyperparameter optimization was conducted to determine the optimal settings for the classifiers. Following tuning, the models were retrained on the entire training dataset. The trained model was then evaluated against the enhanced testing dataset ( = 587) using bootstrap resampling with 1000 iterations, generating multiple resampled datasets to estimate the variability and stability of the model’s performance metrics.[23](#ocae290-B23),[24](#ocae290-B24) We calculated the bias-corrected and accelerated (BCa) confidence intervals for performance metrics across these bootstrap samples. The BCa method adjusts for both bias and skewness in the bootstrap distribution, providing more accurate confidence intervals.[25](#ocae290-B25) Additionally, we used the Wilcoxon signed-rank test to assess statistically significant differences between the performance metrics of initial and enhanced models (see [Table S1](#sup1)).[26](#ocae290-B26)

ClinicalBERT and BERT base were modified for our task. BERT base is a pre-trained language model on a large collection of texts from Wikipedia and books.[20](#ocae290-B20) ClinicalBERT is a domain-adapted model that is initialized on BERT base and further trained on unstructured clinical texts from a tertiary hospital setting similar to our data.[19](#ocae290-B19) We added a linear classification layer to each model, enabling the categorization of stigmatizing language. Gradient clipping was applied to prevent exploding gradients, setting the gradient norm cap at 1.0.[27](#ocae290-B27) Hyperparameter tuning was performed using the Optuna library[28](#ocae290-B28) to refine the models’ performance to maximize evaluation accuracy. The final models were trained with the best hyperparameters identified (learning rate = 3e-5, batch size = 16, epoch = 4), ensuring effective utilization of the models’ contextual knowledge to enhance predictive performance in clinical applications.

## Results

### Human annotation of initial gold standard dataset

We annotated 1771 clinical notes before reaching data saturation, where no new emerging language categories were identified. All language categories and their descriptions are shown in [Table 1](#ocae290-T1). Of the 1771 notes, 754 notes contained stigmatizing and positive/preferred language. Some of the notes contained language belonging to 2 or more categories. In total, 963 exemplars were annotated as stigmatizing or positive/preferred ([Table 2](#ocae290-T2)). Most of these exemplars were stigmatizing (_n_ = 757, 78.60%), while about 21% were positive/preferred language (_n_ = 206). The 3 most frequently identified stigmatizing categories were marginalized language/identities (_n_ = 397, 41.23%), difficult patient (_n_ = 147, 15.26%), and power/privilege language (_n_ = 92, 9.55%). Less than 100 exemplars were identified for unilateral/authoritarian decisions (_n_ = 70, 7.27%) and questioning patient credibility (_n_ = 51, 5.3%).

#### Table 1.

Language categories and their descriptions.

| Categories | Descriptions | Exemplars |
| --- | --- | --- |
| Marginalized language/identities | Documentations of social and behavior factors that could contribute to marginalization for a specific group of people with what clinician perceived to be undesirable. | “she does not use drugs or smoke but drinks 6× week” “Patient is a 32yo \[year old\] Dominican unmarried unemployed female.” Restating for emphasis that is already in the checklist/form data or unnecessary patient descriptor: “toxic habits,” “financially supports self,” “teen mother,” “late registrant,” and “obesity.” |
| Difficult patient | Nonadherence, noncompliance, or refusal of care and services. Patient behaviors that are not in line with provider expectations. | “poor effort with pushing” “patient complaining of lightheadedness” “FOB \[father of baby\] is 23 yo \[year old\] unemployed and not as involved as he should be.” |
| Power/privilege | Power and privilege identities describing psychological or social-ecological status. | “reports nurturing marriage” “private pt of mine at 39 + 6 wks \[weeks\] with multiple episodes of emesis this AM” |
| Unilateral/authoritarian decisions | Supports clinician’s authority over patients, upholding hierarchy, centering clinicians, not patients. | “intolerant of vaginal exam” “SW \[social worker\] has advised pt \[patient\] that if there continues to be yelling in room, ACS \[adult and child services\] will need to be contacted.” |
| Questioning patient credibility | Disbelief in the patient’s report of health history or status. | “unsure if patient telling the truth” “pt \[patient\] denied any other DV \[domestic violence\] incidents and was adamant that relationship with spouse was healthy.” |
| Positive/preferred language | Describes birthing person exercising autonomy around birth. Uses words that convey patient’s point of view objectively. | “patient desires epidural prior to starting induction with Pitocin.” “on exam patient endorses numbness across entirety of bilateral buttocks” “amniocentesis was offered and recommended and the patient declined stating she would not terminate for a child with Down's syndrome.” “Pt \[patient\] declines epidural at this time- trying to deliver without analgesia.” |

[Open in a new tab](table/ocae290-T1/)

#### Table 2.

Proportion of exemplars across language categories.

|  | Initial exemplars |  | Expanded exemplars |  | Final enhanced exemplars |  |
| --- | --- | --- | --- | --- | --- | --- |
| Categories | n | % | n | % | n | % |
| Stigmatizing language | 757 | 78.61 | 298 | 59.36 | 1055 | 72.01 |
| Marginalized language/identities | 397 | 41.23 | 129 | 25.70 | 526 | 35.90 |
| Difficult patient | 147 | 15.26 | 91 | 18.13 | 238 | 16.25 |
| Power/privilege | 92 | 9.55 | 22 | 7.37 | 129 | 8.81 |
| Unilateral/authoritarian decisions | 70 | 7.27 | 37 | 4.38 | 92 | 6.28 |
| Questioning patient credibility | 51 | 5.30 | 19 | 3.78 | 70 | 4.78 |
| Positive/preferred language | 206 | 21.39 | 204 | 40.64 | 410 | 27.99 |
| Total | 963 | 100 | 502 | 100 | 1465 | 100 |

[Open in a new tab](table/ocae290-T2/)

### Expanded exemplars to enhance training dataset

Next, we added 502 exemplars to enhance the training dataset ([Table 2](#ocae290-T2)). About 59% of the expanded exemplars were categorized as stigmatizing language (_n_ = 298). After adding the expanded exemplars, the final enhanced dataset had higher numbers for all language categories. In the initially low count categories, power/privilege and unilateral/authoritarian decisions had less than 100 exemplars in the initial dataset, which increased to ≥100 or close to 100 in the final enhanced dataset. The number of exemplars in the questioning patient credibility category also increased by about 37% in the final enhanced dataset.

### NLP model performances

The average performance scores of all 5 models are presented in [Table 3](#ocae290-T3). The best-performing initial models were BERT models, with an average F1-score of 0.75 for BERT base and 0.73 for ClinicalBERT. SVM was the best-performing initial model among the traditional classifiers, resulting in an average F1-score of 0.68. Decision Trees performed sub-optimally with average F1-scores of 0.56.

#### Table 3.

Average performance of all models.

|  | Initial model |  |  | Enhanced model |  |  |
| --- | --- | --- | --- | --- | --- | --- |
|  | F1 | Precision | Recall | F1 | Precision | Recall |
| ClinicalBERT | 0.73 | 0.77 | 0.71 | 0.78 | 0.77 | 0.80 |
| BERT base | 0.75 | 0.77 | 0.75 | 0.77 | 0.76 | 0.78 |
| SVM | 0.68 | 0.72 | 0.66 | 0.76 | 0.79 | 0.75 |
| Random Forest | 0.67 | 0.73 | 0.62 | 0.76 | 0.81 | 0.72 |
| Decision Trees | 0.56 | 0.57 | 0.58 | 0.68 | 0.73 | 0.66 |
| Macro average | 0.68 | 0.71 | 0.66 | 0.75 | 0.77 | 0.74 |

[Open in a new tab](table/ocae290-T3/)

_Note._ The macro average of all language categories for each model was reported.

Abbreviations: BERT, Bidirectional Encoder Representations from Transformers; SVM, Support Vector Machine.

After augmenting the initial dataset with expanded exemplars, all NLP models showed improved performance in the final enhanced model. The average F1-scores increased from 0.68 to 0.75 in the enhanced model, representing an average improvement of about 10%. ClinicalBERT was the final best-performing enhanced model with an average F1-score of 0.78, an increase of 0.05 from the initial score (7% improvement). Decision Trees, which had the lowest initial performance, showed the greatest improvement; the average F1-score increased from 0.56 to 0.68 (about 21% improvement). Initial models that performed sub-optimally with average F1-scores below 0.7 (SVM, Random Forest, and Decision Trees) achieved average F1-scores close to 0.7 or higher in the enhanced model.

The detailed performances of all 5 models are presented in [Table 4](#ocae290-T4). Most language categories consistently improved using the enhanced dataset across all 5 NLP models. For example, F1-scores increased from the initial to the enhanced model for questioning patient credibility and positive/preferred language categories across all 5 NLP models. Difficult patient and unilateral/authoritarian showed improvement in all 4 NLP models except for BERT base. Marginalized language/identities categories showed improvements for SVM, Random Forest, and Decision Trees.

#### Table 4.

Detailed NLP model performances.

|  | Initial model |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | ClinicalBERT |  |  | BERT base |  |  | SVM |  |  | Random Forest |  |  | Decision Trees |  |  |
|  | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) |
| Marginalized language/identities | 0.90 (0.85-0.93) | 0.94 (0.89-0.98) | 0.86 (0.78-0.92) | 0.92 (0.88-0.96) | 0.93 (0.87-0.97) | 0.92 (0.86-0.96) | 0.91 (0.86-0.94) | 0.99 (0.97-1.00) | 0.84 (0.76-0.90) | 0.82 (0.75-0.87) | 0.99 (0.95-1.00) | 0.70 (0.60-0.77) | 0.70 (0.62-0.77) | 0.91 (0.84-0.97) | 0.57 (0.47-0.65) |
| Difficult patient | 0.76 (0.65-0.86) | 0.94 (0.84-1.00) | 0.65 (0.48-0.77) | 0.75 (0.63-0.83) | 0.83 (0.70-0.92) | 0.69 (0.53-0.79) | 0.47 (0.36-0.58) | 0.44 (0.34-0.54) | 0.52 (0.38-0.65) | 0.43 (0.31-0.53) | 0.42 (0.31-0.53) | 0.44 (0.31-0.58) | 0.30 (0.20-0.40) | 0.28 (0.19-0.37) | 0.33 (0.21-0.46) |
| Power/privilege | 0.77 (0.61-0.87) | 0.73 (0.55-0.86) | 0.82 (0.55-0.91) | 0.72 (0.58-0.84) | 0.65 (0.50-0.79) | 0.82 (0.59-0.91) | 0.80 (0.67-0.91) | 0.89 (0.76-1.00) | 0.73 (0.59-0.91) | 0.70 (0.54-0.82) | 0.79 (0.64-0.94) | 0.64 (0.46-0.77) | 0.56 (0.41-0.71) | 0.55 (0.39-0.70) | 0.59 (0.41-0.82) |
| Unilateral/authoritarian | 0.66 (0.46-0.80) | 0.77 (0.56-0.93) | 0.59 (0.32-0.73) | 0.68 (0.50-0.82) | 0.82 (0.59-0.95) | 0.59 (0.36-0.73) | 0.65 (0.49-0.79) | 0.73 (0.56-0.89) | 0.59 (0.41-0.77) | 0.66 (0.48-0.80) | 0.70 (0.53-0.87) | 0.64 (0.41-0.77) | 0.55 (0.40-0.69) | 0.51 (0.37-0.68) | 0.60 (0.41-0.77) |
| Questioning patient credibility | 0.45 (0.18-0.67) | 0.46 (0.20-0.70) | 0.46 (0.08-0.69) | 0.56 (0.29-0.76) | 0.60 (0.33-0.80) | 0.54 (0.23-0.77) | 0.46 (0.25-0.65) | 0.47 (0.27-0.71) | 0.47 (0.23-0.69) | 0.60 (0.38-0.78) | 0.71 (0.50-1.00) | 0.54 (0.39-0.77) | 0.52 (0.36-0.67) | 0.42 (0.29-0.60) | 0.69 (0.39-0.85) |
| Positive/preferred language | 0.85 (0.79-0.90) | 0.81 (0.74-0.88) | 0.89 (0.80-0.94) | 0.84 (0.79-0.89) | 0.78 (0.71-0.85) | 0.91 (0.82-0.96) | 0.81 (0.75-0.87) | 0.81 (0.74-0.88) | 0.82 (0.73-0.89) | 0.79 (0.72-0.85) | 0.80 (0.73-0.88) | 0.78 (0.68-0.85) | 0.71 (0.63-0.78) | 0.75 (0.67-0.83) | 0.68 (0.57-0.77) |
| Macro average | 0.73 | 0.77 | 0.71 | 0.75 | 0.77 | 0.75 | 0.68 | 0.72 | 0.66 | 0.67 | 0.73 | 0.62 | 0.56 | 0.57 | 0.58 |

|  | Enhanced model |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | ClinicalBERT |  |  | BERT base |  |  | SVM |  |  | Random Forest |  |  | Decision Trees |  |  |
|  | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) | F1 (95% CI) | Precision (95% CI) | Recall (95% CI) |
| Marginalized language/identities | 0.89 (0.85-0.93) | 0.86 (0.80-0.91) | 0.93 (0.87-0.96) | 0.92 (0.88-0.96) | 0.93 (0.88-0.97) | 0.91 (0.84-0.95) | 0.93 (0.89-0.97) | 0.97 (0.94-1.00) | 0.90 (0.84-0.95) | 0.89 (0.84-0.94) | 1.00 (1.00-1.00) | 0.80 (0.73-0.88) | 0.81 (0.74-0.86) | 0.96 (0.91-1.00) | 0.70 (0.61-0.77) |
| Difficult patient | 0.78 (0.07-0.86) | 0.79 (0.67-0.88) | 0.77 (0.63-0.88) | 0.73 (0.63-0.80) | 0.65 (0.55-0.73) | 0.83 (0.69-0.92) | 0.63 (0.53-0.73) | 0.64 (0.53-0.75) | 0.63 (0.50-0.75) | 0.59 (0.48-0.69) | 0.60 (0.49-0.72) | 0.59 (0.46-0.71) | 0.51 (0.40-0.63) | 0.54 (0.42-0.66) | 0.50 (0.35-0.63) |
| Power/privilege | 0.80 (0.65-0.90) | 0.79 (0.62-0.91) | 0.82 (0.59-0.91) | 0.78 (0.61-0.89) | 0.85 (0.68-1.00) | 0.73 (0.45-0.86) | 0.78 (0.64-0.91) | 0.85 (0.70-0.97) | 0.73 (0.59-0.91) | 0.77 (0.61-0.88) | 0.89 (0.75-1.00) | 0.69 (0.50-0.86) | 0.68 (0.50-0.81) | 0.82 (0.65-1.00) | 0.59 (0.36-0.73) |
| Unilateral/authoritarian | 0.71 (0.53-0.84) | 0.70 (0.53-0.86) | 0.73 (0.48-0.86) | 0.65 (0.46-0.80) | 0.67 (0.47-0.86) | 0.64 (0.36-0.82) | 0.76 (0.62-0.88) | 0.80 (0.67-0.95) | 0.73 (0.50-0.86) | 0.76 (0.62-0.88) | 0.81 (0.65-0.94) | 0.72 (0.50-0.86) | 0.76 (0.62-0.87) | 0.74 (0.60-0.90) | 0.77 (0.64-0.96) |
| Questioning patient credibility | 0.62 (0.39-0.80) | 0.63 (0.38-0.83) | 0.62 (0.31-0.77) | 0.60 (0.40-0.77) | 0.54 (0.33-0.73) | 0.69 (0.31-0.85) | 0.61 (0.42-0.80) | 0.63 (0.44-0.88) | 0.61 (0.31-0.77) | 0.69 (0.51-0.86) | 0.70 (0.52-0.91) | 0.69 (0.46-0.85) | 0.57 (0.38-0.74) | 0.54 (0.37-0.77) | 0.61 (0.39-0.77) |
| Positive/preferred language | 0.89 (0.85-0.93) | 0.86 (0.79-0.92) | 0.94 (0.85-0.98) | 0.91 (0.86-0.95) | 0.93 (0.88-0.99) | 0.89 (0.79-0.95) | 0.85 (0.80-0.91) | 0.82 (0.75-0.89) | 0.89 (0.82-0.95) | 0.84 (0.77-0.89) | 0.84 (0.77-0.91) | 0.83 (0.76-0.90) | 0.77 (0.70-0.83) | 0.76 (0.69-0.84) | 0.78 (0.68-0.85) |
| Macro average | 0.78 | 0.77 | 0.80 | 0.77 | 0.76 | 0.78 | 0.76 | 0.79 | 0.75 | 0.76 | 0.81 | 0.72 | 0.68 | 0.73 | 0.66 |

[Open in a new tab](table/ocae290-T4/)

_Note._ Statistical significance test results between the initial and enhanced models can be seen in [Table S1](#sup1).

Abbreviations: BERT, Bidirectional Encoder Representations from Transformers; CI, confidence interval; SVM, Support Vector Machine.

We further examined the detailed performance scores of ClinicalBERT, which showed the best performances in the final enhanced models. The questioning patient credibility category showed the greatest improvement, with the F1-score increasing from 0.45 to 0.62, representing about 38% improvement. The marginalized language/identities and positive/preferred language categories, which achieved high F1-scores of 0.9 in the initial model, showed no improvement in the enhanced model. The other categories showed varied levels of improvement, with F1-scores increasing by 3% to 8% from the initial to the enhanced model.

## Discussion

In this study, we used various NLP models to identify stigmatizing and positive/preferred language in obstetric clinical notes. We employed traditional classifiers (SVM, Decision Trees, and Random Forest) and a transformer-based language models, ClinicalBERT and BERT base. We found that ClinicalBERT was the best performing model with an average F1-score of 0.78 in the final enhanced model. We also developed and employed semantic similarity-based search approach to increase the number of exemplars in training datasets in a less manually intensive way. Using this new approach, we were able to enhance the training dataset, which improved the performance of NLP models up to 21%. Previous research works on stigmatizing language have primarily used rule-based NLP approaches or simple NLP models that focus on keywords or term identification, which may limit identifying nuanced and comprehensive stigmatizing language categories accurately.[7](#ocae290-B7),[29](#ocae290-B29) Our study provides an important addition to advancing the field by showcasing the sophisticated capabilities of pre-trained and fine-tuned BERT models to capture nuanced and semantically meaningful language patterns.[20](#ocae290-B20)

In the current study, ClinicalBERT and BERT base outperformed the 3 more traditional classification models. ClinicalBERT had the highest performance with an average F1-score of 0.78 in the final enhanced model. BERT models, with the self-attention mechanism, has a superior ability to handle complex language structures and effectively understands context and nuances in text.[20](#ocae290-B20) The self-attention mechanism is an important component of transformer-based models, such as BERT.[20](#ocae290-B20) This mechanism allows the model to weigh the importance of difference words in a sentence, which helps to better understand the context by focusing on relevant parts of the text.[20](#ocae290-B20),[30](#ocae290-B30) Another important factor contributing to ClinicalBERT’s superior performance is the initial pre-training of such models on a large corpus of text, which enables BERT models to quickly achieve good generalizability and performance on tasks, even with limited available training data.[20](#ocae290-B20) Thus, BERT models can be particularly advantageous at identifying stigmatizing language, which often involves subtle and context-dependent expressions that traditional classifiers might have missed. For example, difficult patient categories may have benefited from ClinicalBERT as it requires understanding context where a patient is subtly described as difficult. Furthermore, we found despite limited pre-training on clinical data, BERT base also performed well similar as ClinicalBERT. This may be because stigmatizing language is closely related to understanding social language and context, which aligns with previous study findings.[31](#ocae290-B31)

Challenges of BERT models include the higher computational cost associated with transformer-based models, which require significant processing power and memory.[32](#ocae290-B32),[33](#ocae290-B33) Additionally, the complexity of BERT models can contribute to longer training times and the need for more extensive hyperparameter tuning compared to traditional classifiers.[34](#ocae290-B34) Despite these challenges, the benefits of using BERT in accurately identifying subtle and nuanced stigmatizing language patterns in clinical notes were evident in the current study. Our NLP methods offer a promising opportunity for future research to advance the identification of stigmatizing language in obstetric settings. Future studies could build on this work by conducting external validations with new datasets from diverse geographic locations and varied clinical settings to establish robustness and generalizability.

We also examined how performances of NLP models improve by employing a streamlined approach based on semantic similarity to search and extract additional exemplars in clinical notes that can be used for model training. This approach effectively enhanced the performance by 7% to 21% in F1-scores across different NLP models. This approach is less labor-intensive than traditional human annotation because it can automatically search and extract semantically similar exemplars with the already annotated gold standard dataset. Thus, it is an efficient and practical solution to address challenges around having scarce exemplars following initial human annotation[15](#ocae290-B15) by expanding and enriching the initial training dataset with new, contextually relevant exemplars. Importantly, this approach still required manual human verification of the extracted exemplars. This is an important step to ensure the extracted exemplars accurately represented the intended language categories given that cosine similarity metric can result in arbitrary semantic similarities where identified candidates reflect low or meaningless similarities with the queries.[35](#ocae290-B35) While our approach was substantially less labor-intensive than fully annotating new data manually and effective in enhancing the performances of NLP models, eliminating the need for human efforts in the annotation process remains a challenging part of NLP work.

Even after such enhancement, further improvement is needed to accurately identify certain categories of stigmatizing language. For instance, the questioning patient credibility category consistently showed lower F1-scores, ranging from 0.57 to 0.69 in the enhanced models across different NLP models. Potential reasons for this include the low number of positive case exemplars (fewer than 100 cases identified in the enhanced model) and the highly nuanced nature of this category. During the initial human annotation process, expert annotators noted that questioning patient credibility is not as explicit or straightforward as other categories, often requiring a deep understanding of contextual meanings and subtle expressions unique to each situation. The following exemplars showcase the complexities of accurately interpret the subtle meaning of the text: “Pt \[patient\] does not think she has gestational diabetes. She states she ate very sweet rice (a dish from her country) the day before the glucose challenge which is what she believes this is the reason for the high value. states it has never been high before,” and “reports daily palpitations and atypical chest pain/SOB \[shortness of breath\] but able to walk several city blocks without issue.” This contrasts with more straightforward categories with common identifiable keywords frequently appearing in the clinical notes. For example, categories like marginalized language/identities often include explicit terms such as “obese” or “abuse,” which are easier to recognize consistently. These high-signaling keywords may be the reason why SVM performed better than ClinicalBERT for marginalized language/identities category. Further refinement of deep learning models that can better capture nuanced and context-specific language categories is needed in future research.

Importantly, identifying stigmatizing language in clinical notes is an emerging field of research that is highly nuanced and somewhat subjective. For example, language that can be interpreted as stigmatizing for some readers (eg, “she does not use drugs or smoke but drinks 6x/week” or “financially supports self”) may reflect objective assessments to other readers. It may also reflect standard and common language that are often used in clinical documentation without negative connotations (eg, “denies” or “complaints”). Although we cannot discern the true intention or sentiments of writers in the clinical documentation, we conducted rigorous qualitative analysis[12](#ocae290-B12) informed by previous research in this field[14](#ocae290-B14) to improve the rigor of our language categories. We also had a multidisciplinary team of experts, including obstetric and gynecology physicians, nurses, and nonclinical researchers, such as data scientists, to bring broader perspectives and further enhance the rigor and trustworthiness of our qualitative work.

For instance, we found that information such as “financially supports self” is not routinely documented in clinical notes for all patients. Including such information can inadvertently highlight or imply a socioeconomic status that may not be relevant to clinical care, potentially stigmatizing certain groups. This is particularly significant for individuals who might be perceived as belonging to a lower socioeconomic group, explicitly or implicitly through factors like appearance, language proficiency, or insurance status. Thus, the nuance in identifying stigmatizing language is important, as the patient may read their own notes and interpret this language in a negative way, or future clinicians who read the previous note may transmit implicit or explicit bias into their care of the patient. Although the language we identified may not appear stigmatizing on its own, when this type of language is applied more frequently to people with marginalized identities, it may reinforce implicit biases carried by clinicians. It is recommended to practice clinical documentation that is centered around the patient’s experience and circumstances to eliminate potential stigma and bias. For example, stating “patient reports drinking 6x/week” may introduce assumption or bias that the patient drinks 6-7 drinks a day, 6 days a week. In this case, providing additional contextual details such as “patient reports drinking 6x/week, one beer per day” or reasons why their drinking increased due to personal life events would be important to reduce such assumption or bias.

Additionally, positive language, such as “patient desires epidural,” could also reflect the writer perceiving patient as demanding to some readers. We identified “desires” as positive/preferred language based on previous literature[14](#ocae290-B14) and our rigorous qualitative analysis.[12](#ocae290-B12) We determined that, though we cannot know the true intention of the write, such positive language contrasts from other language that are more stigmatizing (eg, complaints). Future research can explore healthcare user perspectives around stigmatizing language to further improve the subjective nature of stigmatizing language. Healthcare users in birth settings can read their own notes and identify what they perceive as stigmatizing regardless of writers’ intention to use such language in clinical notes.

The findings of this study have significant clinical implications. One of the primary implications is the potential application of NLP models for real-time monitoring of clinical notes to automatically detect instances of stigmatizing language and re-iteration of biasing, unnecessary patient descriptors as they are being recorded. This can enable automatic alerts or prompts to clinicians and healthcare team members to modify their language to be more respectful. Additionally, applications could recommend an alternative, non-stigmatizing language clinicians can use. This approach can reduce the potential transmission of bias throughout the clinical team. For example, using language that implies a patient is “difficult” can give the next clinician a biased impression of the patient by reading the chart before even seeing them, which can impact the care delivered. Modern-day patients have quick and easy access to read their clinical notes and about at least 1 in 10 patients felt judged and/or offended by the language they see in clinical notes.[36](#ocae290-B36) Real-time monitoring and alerts would prevent such stigmatizing language from being recorded, contributing to supportive and non-stigmatizing care and improved patient experiences for all.

To further advance our work and the field of research in stigmatizing language, future studies should explore the differences in the use of stigmatizing language in different racial and ethnic subgroups. For instance, previous studies have found that notes containing stigmatizing language were more likely to be found in non-Hispanic Black individuals compared to non-Hispanic White individuals among patients with health conditions such as diabetes and chronic pain.[37](#ocae290-B37),[38](#ocae290-B38) Understanding similarities and differences in types and frequencies of stigmatizing language found in obstetric clinical notes can potentially reveal underlying biases and disparities in healthcare, particularly around communication and documentation patterns for minoritized individuals, which have not been investigated in previous research. Including diverse community members and experts is important to further refine the language categories in a way that reflects nuanced differences in future research. We plan to incorporate this approach in our ongoing and future studies to ensure the language categories are comprehensive and culturally sensitive.

Another important area for future research is to examine how stigmatizing language is associated with the quality of obstetric care and health outcomes. Studies found greater diabetes severity is associated with a higher probability of having stigmatizing language documented in clinical notes.[37](#ocae290-B37) In contrast, usage of non-stigmatizing language is associated with better follow-up care and referrals among patients who have opioid use disorder.[39](#ocae290-B39) Therefore, there is a strong potential that documentation of stigmatizing language may be associated with obstetric care quality and health outcomes, which should be further invested in future research. Our planned future studies aim to investigate these areas to provide further insights in reducing bias and disparities in healthcare for the perinatal population.

### Limitations

The current study has several limitations. First, this study was conducted in one geographic location, a large metropolitan city in the Northeast United States. Therefore, findings may not generalize to areas with substantially different geographic and demographic characteristics. We obtained EHR data from the birth admission only, and the use of stigmatizing and language in outpatient obstetric settings remains unexplored. Future research in diverse geographic and healthcare settings may be needed to validate the generalizability of findings and provide further insights into stigmatizing language in a more comprehensive care setting. Second, our NLP models were built based on our specific language categories and may not be apply to new or different stigmatizing or non-stigmatizing language categories. Third, we used TF-IDF for feature extraction and selection, which is widely used for NLP, but has some inherent limitations. TF-IDF examines how often words appear in a document compared to how often they appear across all documents. Although this helps highlighting important words, it is limited in understanding the context in which words are used. As a result, TF-IDF may have difficulty capturing more nuanced semantic meanings and understanding contextual relationships within the text. Future studies may consider using more advanced feature extraction techniques such as contextual embeddings to better capture semantic meanings. Fourth, despite our various preprocessing steps, separating clinical notes into sentences remains challenging, potentially limiting the NLP model performance. Lastly, we observed lower interrater reliability in creating the initial human-annotated dataset. The agreement rate among the annotators was 72% and Cohen’s Kappa was 0.4, indicating fair agreement.[40](#ocae290-B40) Several factors could contribute to this, including the subjectivity involved in interpreting clinical notes and language uses as well as complexity and nuanced nature of stigmatizing language. To ensure the quality and accuracy, we spent extensive effort and time to discuss any discrepancies among annotators to reach a consensus. The focus of annotation in computational linguistics is its usefulness for further computational processes, meaning that annotated data are still valuable even if interrater reliability is not high.[41](#ocae290-B41) In addition, deep learning models, such as BERT, can robustly handle noisy data with less reliable annotations and perform well.[42](#ocae290-B42) This robustness ensures that our final ClinicalBERT model can effectively learn from the provided data despite potential limitations.

## Conclusion

The current study provides advancement in identifying stigmatizing language in obstetric clinical notes by employing an advanced transformer-based language model, ClinicalBERT. Our approach based on semantic similarity to automatically search to extract additional exemplars for model training enhanced the performance while reducing the burden of human annotation. ClinicalBERT effectively captured nuanced and context-dependent stigmatizing language patterns in obstetric clinical notes, highlighting potential for real-time monitoring and alerts to prevent stigmatizing language use and to reduce bias in obstetric settings. Future research should explore stigmatizing language in diverse environments, including varied geographic locations and clinical settings, to contribute to high-quality and equitable care for the perinatal population.

## Supplementary Material

ocae290\_Supplementary\_Data

[ocae290\_supplementary\_data.docx](/articles/instance/11756426/bin/ocae290_supplementary_data.docx) (16.9KB, docx)

## Contributor Information

Jihye Kim Scroggins, School of Nursing, Columbia University, New York, NY 10032, United States.

Ismael I Hulchafo, School of Nursing, Columbia University, New York, NY 10032, United States.

Sarah Harkins, School of Nursing, Columbia University, New York, NY 10032, United States.

Danielle Scharp, Icahn School of Medicine, Mount Sinai, NY 10029, United States.

Hans Moen, Department of Computer Science, Aalto University, Espoo 02150, Finland.

Anahita Davoudi, VNS Health, New York, NY 10017, United States.

Kenrick Cato, School of Nursing, University of Pennsylvania, Philadelphia, PA 19104, United States.

Michele Tadiello, Center for Community-Engaged Health Informatics and Data Science, Columbia University Irving Medical Center, New York, NY 10032, United States.

Maxim Topaz, School of Nursing, Columbia University, New York, NY 10032, United States.

Veronica Barcelona, School of Nursing, Columbia University, New York, NY 10032, United States.

## Author contributions

All authors contributed to design, acquisition, analysis, or interpretation of this work. All authors contributed to drafting or reviewing the work. All authors approved the final version of the work. CRediT contributor roles are as follows. Jihye Kim Scroggins: contribution to analysis, visualization, writing original draft, and revising the manuscript. Ismael I. Hulchafo: contribution to data curation, analysis, writing original draft, and revising the manuscript. Sarah Harkins and Danielle Scharp: contribution to analysis and revising the manuscript. Anahita Davoudi: contribution to analysis, methodology, and revising the manuscript. Hans Moen: contribution to methodology and revising the manuscript. Kenrick Cato: contribution to data curation, funding acquisition, methodology, and revising the manuscript. Michele Tadiello: data curation, revising the manuscript. Maxim Topaz and Veronica Barcelona: equal contribution as senior authors in conceptualization, funding acquisition, methodology, supervision, and revising the manuscript.

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

Columbia University Data Science Institute Seed Funds and the Gordon and Betty Moore Foundation grant (GBMF9048) supported this project.

## Conflicts of interest

None declared.

## Data availability

Data are not available for public access due to the limitations imposed by the IRB protocol.

## References

*   1. Shattell M. Stigmatizing language with unintended meanings: “persons with mental illness” or “mentally ill persons”? Issues Ment Health Nurs. 2009;30:199. \[[DOI](https://doi.org/10.1080/01612840802694668)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/19291498/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Issues%20Ment%20Health%20Nurs.&title=Stigmatizing%20language%20with%20unintended%20meanings:%20%E2%80%9Cpersons%20with%20mental%20illness%E2%80%9D%20or%20%E2%80%9Cmentally%20ill%20persons%E2%80%9D?&volume=30&publication_year=2009&pages=199&pmid=19291498&doi=10.1080/01612840802694668&)\]
*   2. Sun M, Oliwa T, Peek ME, et al. Negative patient descriptors: documenting racial bias in the electronic health record. Health Aff (Millwood). 2022;41:203-211. \[[DOI](https://doi.org/10.1377/hlthaff.2021.01423)\] \[[PMC free article](/articles/PMC8973827/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35044842/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Health%20Aff%20\(Millwood\)&title=Negative%20patient%20descriptors:%20documenting%20racial%20bias%20in%20the%20electronic%20health%20record&volume=41&publication_year=2022&pages=203-211&pmid=35044842&doi=10.1377/hlthaff.2021.01423&)\]
*   3. FitzGerald C, Hurst S.. Implicit bias in healthcare professionals: a systematic review. BMC Med Ethics. 2017;18:19. \[[DOI](https://doi.org/10.1186/s12910-017-0179-8)\] \[[PMC free article](/articles/PMC5333436/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28249596/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Ethics&title=Implicit%20bias%20in%20healthcare%20professionals:%20a%20systematic%20review&volume=18&publication_year=2017&pages=19&pmid=28249596&doi=10.1186/s12910-017-0179-8&)\]
*   4. Hall WJ, Chapman MV, Lee KM, et al. Implicit racial/ethnic bias among health care professionals and its influence on health care outcomes: a systematic review. Am J Public Health. 2015;105:e60-e76. \[[DOI](https://doi.org/10.2105/AJPH.2015.302903)\] \[[PMC free article](/articles/PMC4638275/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26469668/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Public%20Health.&title=Implicit%20racial/ethnic%20bias%20among%20health%20care%20professionals%20and%20its%20influence%20on%20health%20care%20outcomes:%20a%20systematic%20review&volume=105&publication_year=2015&pages=e60-e76&pmid=26469668&doi=10.2105/AJPH.2015.302903&)\]
*   5. Benkert R, Cuevas A, Thompson HS, et al. Ubiquitous yet unclear: a systematic review of medical mistrust. Behav Med. 2019;45:86-101. \[[DOI](https://doi.org/10.1080/08964289.2019.1588220)\] \[[PMC free article](/articles/PMC6855383/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31343961/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Behav%20Med.&title=Ubiquitous%20yet%20unclear:%20a%20systematic%20review%20of%20medical%20mistrust&volume=45&publication_year=2019&pages=86-101&pmid=31343961&doi=10.1080/08964289.2019.1588220&)\]
*   6. Martin JA, Hamilton BE, Osterman MJK. Births in the United States, 2022. NCHS Data Brief Report No.: 477. Hyattsville, MD: National Center for Health Statistics; 2023. Accessed July 2024. 10.15620/cdc:131354 \[[DOI](https://doi.org/10.15620/cdc:131354)\]
*   7. Barcelona V, Scharp D, Idnay BR, Moen H, Cato K, Topaz M.. Identifying stigmatizing language in clinical documentation: A scoping review of emerging literature. PLoS One. 2024;196:e0303653. \[[DOI](https://doi.org/10.1371/journal.pone.0303653)\] \[[PMC free article](/articles/PMC11213326/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38941299/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=PLoS%20One&title=Identifying%20stigmatizing%20language%20in%20clinical%20documentation:%20A%20scoping%20review%20of%20emerging%20literature&volume=19&issue=6&publication_year=2024&pages=e0303653&pmid=38941299&doi=10.1371/journal.pone.0303653&)\]
*   8. Li I, Pan J, Goldwasser J, Verma N, et al. Neural natural language processing for unstructured data in electronic health records: a review. Comput Sci Rev. 2022;46:1-33. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Comput%20Sci%20Rev&title=Neural%20natural%20language%20processing%20for%20unstructured%20data%20in%20electronic%20health%20records:%20a%20review&volume=46&publication_year=2022&pages=1-33&)\]
*   9. Sim JA, Huang X, Horan MR, et al. Natural language processing with machine learning methods to analyze unstructured patient-reported outcomes derived from electronic health records: a systematic review. Artif Intell Med. 2023;146:102701. \[[DOI](https://doi.org/10.1016/j.artmed.2023.102701)\] \[[PMC free article](/articles/PMC10693655/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38042599/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Artif%20Intell%20Med.&title=Natural%20language%20processing%20with%20machine%20learning%20methods%20to%20analyze%20unstructured%20patient-reported%20outcomes%20derived%20from%20electronic%20health%20records:%20a%20systematic%20review&volume=146&publication_year=2023&pages=102701&pmid=38042599&doi=10.1016/j.artmed.2023.102701&)\]
*   10. Locke S, Bashall A, Al-Adely S, et al. Natural language processing in medicine: a review. Trends in Anaesth Criti Care. 2021;38:4-9. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Trends%20in%20Anaesth%20Criti%20Care&title=Natural%20language%20processing%20in%20medicine:%20a%20review&volume=38&publication_year=2021&pages=4-9&)\]
*   11. Khurana D, Koli A, Khatter K, et al. Natural language processing: state of the art, current trends and challenges. Multimed Tools Appl. 2023;82:3713-3744. \[[DOI](https://doi.org/10.1007/s11042-022-13428-4)\] \[[PMC free article](/articles/PMC9281254/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35855771/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Multimed%20Tools%20Appl.&title=Natural%20language%20processing:%20state%20of%20the%20art,%20current%20trends%20and%20challenges&volume=82&publication_year=2023&pages=3713-3744&pmid=35855771&doi=10.1007/s11042-022-13428-4&)\]
*   12. Barcelona V, Scharp D, Idnay BR,. et al. A qualitative analysis of stigmatizing language in birth admission clinical notes. Nurs Inq. 2023;303:e12557. \[[DOI](https://doi.org/10.1111/nin.12557)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37073504/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nurs%20Inq&title=A%20qualitative%20analysis%20of%20stigmatizing%20language%20in%20birth%20admission%20clinical%20notes&volume=30&issue=3&publication_year=2023&pages=e12557&pmid=37073504&doi=10.1111/nin.12557&)\]
*   13. Barcelona V, Scharp D, Moen H,. et al. Using Natural Language Processing to Identify Stigmatizing Language in Labor and Birth Clinical Notes. Matern Child Health J. 2024;283:578-586. \[[DOI](https://doi.org/10.1007/s10995-023-03857-4)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38147277/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Matern%20Child%20Health%20J&title=Using%20Natural%20Language%20Processing%20to%20Identify%20Stigmatizing%20Language%20in%20Labor%20and%20Birth%20Clinical%20Notes&volume=28&issue=3&publication_year=2024&pages=578-586&pmid=38147277&doi=10.1007/s10995-023-03857-4&)\]
*   14. Park J, Saha S, Chee B, et al. Physician use of stigmatizing language in patient medical records. JAMA Netw Open. 2021;4:e2117052. \[[DOI](https://doi.org/10.1001/jamanetworkopen.2021.17052)\] \[[PMC free article](/articles/PMC8281008/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34259849/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open.&title=Physician%20use%20of%20stigmatizing%20language%20in%20patient%20medical%20records&volume=4&publication_year=2021&pages=e2117052&pmid=34259849&doi=10.1001/jamanetworkopen.2021.17052&)\]
*   15. He H, Garcia EA.. Learning from imbalanced data. IEEE Trans Knowl Data Eng. 2009;21:1263-1284. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=IEEE%20Trans%20Knowl%20Data%20Eng&title=Learning%20from%20imbalanced%20data&volume=21&publication_year=2009&pages=1263-1284&)\]
*   16. Hugging Face. sentence-transformers/multi-qa-distilbert-cos-v1. Accessed July 2024. [https://huggingface.co/sentence-transformers/multi-qa-distilbert-cos-v1](https://huggingface.co/sentence-transformers/multi-qa-distilbert-cos-v1)
*   17. Reimers N, Gurevych I. Sentence-BERT: sentence embeddings using Siamese BERT-networks. In: Inui K, Jiang J, Ng V, Wan X, eds. _Conference on Empirical Methods in Natural Language Processing and the 9th International Joint Conference on Natural Language Processing_. Association for Computational Linguistics; 2019:3982-3992.
*   18. Johnson J, Douze M, Jégou H. Billion-scale similarity search with GPUs. 2017:1-12. arXiv, arXiv:1702.08734, preprint: not peer-reviewed.
*   19. Alsentzer E, Murphy JR, Boag W, et al. Publicly available clinical BERT embeddings. In: Rumshisky A, Roberts K, Bethard S, Naumann T, eds. _Proceedings of the 2nd Clinical Natural Language Processing Workshop_. Association for Computational Linguistics; 2019:72-78.
*   20. Devlin J, Chang M, Lee K, et al. BERT: pre-training of deep bidirectional transformers for language understanding. In: Burstein J, Doran C, Solorio T, eds. _Proceedings of the 2019 Conference of the North American Chapter of the Association for Computational Linguistics Human Language Technologies_. Association for Computational Linguistics; 2019:4171-4186.
*   21. Aizawa A. An information-theoretic perspective of tf-idf measures. Inf Process Manag. 2003;39:45-65. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Inf%20Process%20Manag&title=An%20information-theoretic%20perspective%20of%20tf-idf%20measures&volume=39&publication_year=2003&pages=45-65&)\]
*   22. Spencer R, Thabtah F, Abdelhamid N, et al. Exploring feature selection and classification methods for predicting heart disease. Digit Health. 2020;6:2055207620914777. \[[DOI](https://doi.org/10.1177/2055207620914777)\] \[[PMC free article](/articles/PMC7133070/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32284873/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Digit%20Health.&title=Exploring%20feature%20selection%20and%20classification%20methods%20for%20predicting%20heart%20disease&volume=6&publication_year=2020&pages=2055207620914777&pmid=32284873&doi=10.1177/2055207620914777&)\]
*   23. Williams S, Shaw JW, Emery C, Stokes KA.. Adding confidence to our injury burden estimates: is bootstrapping the solution? Br J Sports Med. 2024;58:57-58. \[[DOI](https://doi.org/10.1136/bjsports-2023-107496)\] \[[PMC free article](/articles/PMC10803980/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38050018/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Br%20J%20Sports%20Med.&title=Adding%20confidence%20to%20our%20injury%20burden%20estimates:%20is%20bootstrapping%20the%20solution?&volume=58&publication_year=2024&pages=57-58&pmid=38050018&doi=10.1136/bjsports-2023-107496&)\]
*   24. James G, Witten D, Hastie T, Tibshirani R, Taylor J.. _Resampling Methods: An Introduction to Statistical Learning_. Springer; 2023: 201-228.
*   25. Burch BD. Nonparametric bootstrap confidence intervals for variance components applied to interlaboratory comparisons. JABES. 2012;17:228-245. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JABES&title=Nonparametric%20bootstrap%20confidence%20intervals%20for%20variance%20components%20applied%20to%20interlaboratory%20comparisons&volume=17&publication_year=2012&pages=228-245&)\]
*   26. Rainio O, Teuho J, Klen R.. Evaluation metrics and statistical tests for machine learning. Sci Rep. 2024;14:6086. \[[DOI](https://doi.org/10.1038/s41598-024-56706-x)\] \[[PMC free article](/articles/PMC10937649/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38480847/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Rep.&title=Evaluation%20metrics%20and%20statistical%20tests%20for%20machine%20learning&volume=14&publication_year=2024&pages=6086&pmid=38480847&doi=10.1038/s41598-024-56706-x&)\]
*   27. Zhang J, He T, Sra S, et al. Why gradient clipping accelerates training: a theoretical justification for adaptivity. 2019:1-21. arXiv, arXiv:1905.11881, preprint: not peer-reviewed.
*   28. Akiba T, Sano S, Yanase T, et al. Optuna: a next-generation hyperparameter optimization framework. In: _Proceedings of the 25th ACM SIGKDD International Conference on Knowledge Discovery & Data Mining_. Association for Computing Machinery; 2019:2623-2631.
*   29. Kelly PJA, Snyder AM, Agénor M, et al. A scoping review of methodological approaches to detect bias in the electronic health record. Stigma Health. 2023:1-13. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Stigma%20Health&title=A%20scoping%20review%20of%20methodological%20approaches%20to%20detect%20bias%20in%20the%20electronic%20health%20record&publication_year=2023&pages=1-13&)\]
*   30. Vaswani A, Shazeer N, Parmar N, et al. Attention is all you need. Adv Neural Inf Process Syst. 2017;30:1-11. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Neural%20Inf%20Process%20Syst&title=Attention%20is%20all%20you%20need&volume=30&publication_year=2017&pages=1-11&)\]
*   31. Harrigan K, Zirikly A, Chee B, et al. Characterization of stigmatizing language in medical records. In: Rogers A, Boyd-Graber J, Okazaki N, eds. _Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics_. Association for Computational Linguistics; 2023:312-329.
*   32. Gillioz A, Casas J, Mugellini E, et al. Overview of the transformer-based models for NLP tasks. In: Ganzha M, Maciaszek L, Paprzycki M, eds. _Proceedings of the 2020 Federated Conference on Computer Science and Information Systems_. Annals of Computer Science and Information Systems; 2020:179-183.
*   33. Park S, Choi E. Multimodal transformer with a low-computational-cost guarantee. 2024:1-5. arXiv, arXiv:2402.15096, preprint: not peer reviewed.
*   34. Pati S, Aga S, Jayasena N, et al. Demystifying BERT: system design implications. In: _2022 IEEE International Symposium on Workload Characterization (IISWC)_. Institute of Electrical and Electronics Engineers (IEEE); 2022:296-309.
*   35. Steck H, Ekanadham C, Kallus N, et al. Is cosine-similarity of embeddings really about similarity? In: _Companion Proceedings of the ACM on Web Conference_. Association for Computing Machinery; 2024:887-890.
*   36. Fernandez L, Fossa A, Dong Z, et al. Words matter: what do patients find judgmental or offensive in outpatient notes? J Gen Intern Med. 2021;36:2571-2578. \[[DOI](https://doi.org/10.1007/s11606-020-06432-7)\] \[[PMC free article](/articles/PMC8390578/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33528782/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Gen%20Intern%20Med.&title=Words%20matter:%20what%20do%20patients%20find%20judgmental%20or%20offensive%20in%20outpatient%20notes?&volume=36&publication_year=2021&pages=2571-2578&pmid=33528782&doi=10.1007/s11606-020-06432-7&)\]
*   37. Himmelstein G, Bates D, Zhou L.. Examination of stigmatizing language in the electronic health record. JAMA Netw Open. 2022;5:e2144967. \[[DOI](https://doi.org/10.1001/jamanetworkopen.2021.44967)\] \[[PMC free article](/articles/PMC8796019/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35084481/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open.&title=Examination%20of%20stigmatizing%20language%20in%20the%20electronic%20health%20record&volume=5&publication_year=2022&pages=e2144967&pmid=35084481&doi=10.1001/jamanetworkopen.2021.44967&)\]
*   38. Bilotta I, Tonidandel S, Liaw WR, et al. Examining linguistic differences in electronic health records for diverse patients with diabetes: natural language processing analysis. JMIR Med Inform. 2024;12:e50428. \[[DOI](https://doi.org/10.2196/50428)\] \[[PMC free article](/articles/PMC11137426/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38787295/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JMIR%20Med%20Inform.&title=Examining%20linguistic%20differences%20in%20electronic%20health%20records%20for%20diverse%20patients%20with%20diabetes:%20natural%20language%20processing%20analysis&volume=12&publication_year=2024&pages=e50428&pmid=38787295&doi=10.2196/50428&)\]
*   39. Carpenter JE, Catalanotti J, Notis M, et al. Use of nonstigmatizing language is associated with improved outcomes in hospitalized people who inject drugs. J Hosp Med. 2023;18:670-676. \[[DOI](https://doi.org/10.1002/jhm.13146)\] \[[PMC free article](/articles/PMC10524912/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37286190/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Hosp%20Med.&title=Use%20of%20nonstigmatizing%20language%20is%20associated%20with%20improved%20outcomes%20in%20hospitalized%20people%20who%20inject%20drugs&volume=18&publication_year=2023&pages=670-676&pmid=37286190&doi=10.1002/jhm.13146&)\]
*   40. Landis JR, Koch GG.. The measurement of observer agreement for categorical data. Biometrics. 1977;33:159-174. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/843571/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Biometrics&title=The%20measurement%20of%20observer%20agreement%20for%20categorical%20data&volume=33&publication_year=1977&pages=159-174&pmid=843571&)\]
*   41. Artstein R, Poesio M.. Inter-coder agreement for computational linguistics. Comput Linguist Assoc Comput Linguist. 2008;34:555-596. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Comput%20Linguist%20Assoc%20Comput%20Linguist&title=Inter-coder%20agreement%20for%20computational%20linguistics&volume=34&publication_year=2008&pages=555-596&)\]
*   42. Rolnick D, Veit A, Belongie S, et al. Deep learning is robust to massive label noise. 2017:1-10. arXiv, arXiv:1705.10694, preprint: not peer reviewed.

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae290\_Supplementary\_Data

[ocae290\_supplementary\_data.docx](/articles/instance/11756426/bin/ocae290_supplementary_data.docx) (16.9KB, docx)

### Data Availability Statement

Data are not available for public access due to the limitations imposed by the IRB protocol.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**