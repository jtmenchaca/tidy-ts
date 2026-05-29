J Am Med Inform Assoc

. 2024 Dec 26;32(2):365–374. doi: [10.1093/jamia/ocae310](https://doi.org/10.1093/jamia/ocae310)

# CARE-SD: classifier-based analysis for recognizing provider stigmatizing and doubt marker labels in electronic health records: model development and validation

[Andrew Walker](https://pubmed.ncbi.nlm.nih.gov/?term="Walker%20A"[Author])

### Andrew Walker, PhD

1 Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States

Find articles by [Andrew Walker](https://pubmed.ncbi.nlm.nih.gov/?term="Walker%20A"[Author])

1,✉, [Annie Thorne](https://pubmed.ncbi.nlm.nih.gov/?term="Thorne%20A"[Author])

### Annie Thorne, PA-C, MPH

2 Department of Infectious Disease, Children’s Healthcare of Atlanta, Atlanta, GA 30329, United States

Find articles by [Annie Thorne](https://pubmed.ncbi.nlm.nih.gov/?term="Thorne%20A"[Author])

2, [Sudeshna Das](https://pubmed.ncbi.nlm.nih.gov/?term="Das%20S"[Author])

### Sudeshna Das, PhD

3 Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States

Find articles by [Sudeshna Das](https://pubmed.ncbi.nlm.nih.gov/?term="Das%20S"[Author])

3, [Jennifer Love](https://pubmed.ncbi.nlm.nih.gov/?term="Love%20J"[Author])

### Jennifer Love, MD, MSCR

4 Department of Emergency Medicine, Mount Sinai, New York, NY 10029, United States

Find articles by [Jennifer Love](https://pubmed.ncbi.nlm.nih.gov/?term="Love%20J"[Author])

4, [Hannah L F Cooper](https://pubmed.ncbi.nlm.nih.gov/?term="Cooper%20HLF"[Author])

### Hannah L F Cooper, ScD

5 Department of Behavioral, Social, Health Education Sciences, Rollins School of Public Health, Emory University, Atlanta, GA 30322, United States

Find articles by [Hannah L F Cooper](https://pubmed.ncbi.nlm.nih.gov/?term="Cooper%20HLF"[Author])

5, [Melvin Livingston III](https://pubmed.ncbi.nlm.nih.gov/?term="Livingston%20M"[Author])

### Melvin Livingston III, PhD

6 Department of Behavioral, Social, Health Education Sciences, Rollins School of Public Health, Emory University, Atlanta, GA 30322, United States

Find articles by [Melvin Livingston III](https://pubmed.ncbi.nlm.nih.gov/?term="Livingston%20M"[Author])

6, [Abeed Sarker](https://pubmed.ncbi.nlm.nih.gov/?term="Sarker%20A"[Author])

### Abeed Sarker, PhD

7 Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States

8 Department of Biomedical Engineering, Georgia Institute of Technology and Emory University, Atlanta, GA 30332, United States

Find articles by [Abeed Sarker](https://pubmed.ncbi.nlm.nih.gov/?term="Sarker%20A"[Author])

7,8

*   Author information
*   Article notes
*   Copyright and License information

1 Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States

2 Department of Infectious Disease, Children’s Healthcare of Atlanta, Atlanta, GA 30329, United States

3 Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States

4 Department of Emergency Medicine, Mount Sinai, New York, NY 10029, United States

5 Department of Behavioral, Social, Health Education Sciences, Rollins School of Public Health, Emory University, Atlanta, GA 30322, United States

6 Department of Behavioral, Social, Health Education Sciences, Rollins School of Public Health, Emory University, Atlanta, GA 30322, United States

7 Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States

8 Department of Biomedical Engineering, Georgia Institute of Technology and Emory University, Atlanta, GA 30332, United States

✉

Corresponding author: Andrew Walker, PhD, Department of Biomedical Informatics, School of Medicine, Emory University, 2968 Fantasy Lane, Decatur, GA 30033, United States (andrew.walker@emory.edu)

Received 2024 May 9; Revised 2024 Nov 14; Accepted 2024 Dec 10; Collection date 2025 Feb.

© The Author(s) 2024. Published by Oxford University Press on behalf of the American Medical Informatics Association.

This is an Open Access article distributed under the terms of the Creative Commons Attribution-NonCommercial-NoDerivs licence ([https://creativecommons.org/licenses/by-nc-nd/4.0/](https://creativecommons.org/licenses/by-nc-nd/4.0/)), which permits non-commercial reproduction and distribution of the work, in any medium, provided the original work is not altered or transformed in any way, and that the work is properly cited. For commercial re-use, please contact journals.permissions@oup.com

[PMC Copyright notice](/about/copyright/)

PMCID: PMC11756621  PMID: [39724920](https://pubmed.ncbi.nlm.nih.gov/39724920/)

## Abstract

### Objective

To detect and classify features of stigmatizing and biased language in intensive care electronic health records (EHRs) using natural language processing techniques.

### Materials and Methods

We first created a lexicon and regular expression lists from literature-driven stem words for linguistic features of stigmatizing patient labels, doubt markers, and scare quotes within EHRs. The lexicon was further extended using Word2Vec and GPT 3.5, and refined through human evaluation. These lexicons were used to search for matches across 18 million sentences from the de-identified Medical Information Mart for Intensive Care-III (MIMIC-III) dataset. For each linguistic bias feature, 1000 sentence matches were sampled, labeled by expert clinical and public health annotators, and used to supervised learning classifiers.

### Results

Lexicon development from expanded literature stem-word lists resulted in a doubt marker lexicon containing 58 expressions, and a stigmatizing labels lexicon containing 127 expressions. Classifiers for doubt markers and stigmatizing labels had the highest performance, with macro _F_1\-scores of 0.84 and 0.79, positive-label recall and precision values ranging from 0.71 to 0.86, and accuracies aligning closely with human annotator agreement (0.87).

### Discussion

This study demonstrated the feasibility of supervised classifiers in automatically identifying stigmatizing labels and doubt markers in medical text and identified trends in stigmatizing language use in an EHR setting. Additional labeled data may help improve lower scare quote model performance.

### Conclusions

Classifiers developed in this study showed high model performance and can be applied to identify patterns and target interventions to reduce stigmatizing labels and doubt markers in healthcare systems.

**Keywords:** stigma, electronic health record, text classification, natural language processing

## Background and significance

### Provider biases and stigmatization of patients drive healthcare inequities

Provider stigmas and biases are widely believed to contribute to discrimination and health inequities among patients.[1](#ocae310-B1),[2](#ocae310-B2) Patients experience stigma and biases by providers as a result of their race, gender, sexual orientation, disease status, drug use, socioeconomic status, and many other characteristics.[3](#ocae310-B3) Current approaches to reducing provider stigmatization struggle with limited effect over time, with difficulty in establishing accountability and long-term behavioral change.[3](#ocae310-B3) The ability to identify patient stigmatization within the electronic health record (EHR) can inform future interventions and facilitate real-time audits of healthcare team communication.

### Stigmatization in language

Stigma is defined by social psychologists Link and Phelan as a social process that is characterized by the interplay of labeling, stereotyping, and separation, which leads to status loss and discrimination, occurs within a context of power, like the patient-provider relationship.[4](#ocae310-B4) Beukeboom and Burgers[5](#ocae310-B5) recently developed the Social Categories and Stereotype Communication (SCSC) Framework to understand how stigmatization can manifest in language. This framework posits that stereotypes are communicated through systematic differences in how other groups are (1) labeled and (2) how their behaviors and characteristics are described. Recent research investigating EHR linguistic bias has focused on language features such as stigmatizing labels, doubt markers and “scare quotes.”[6–8](#ocae310-B6)

### Stigmatizing labels

Stigmatizing labels to describe groups are used to perpetuate stereotypes, which can lead to feelings of stigmatization and reduced trust among their patients. NIDA recently published a list of words to avoid using around patients with substance use disorders, including “addict,” “abuser,” “user,” or “junkie.”[9](#ocae310-B9) Similar studies have been applied to other chronic illness populations, identifying terms like “sickler” or “frequent flier.”[7](#ocae310-B7),[10](#ocae310-B10) Research led by Michael Sun et al.[11](#ocae310-B11) on over 40 000 clinical notes found disparities in presence of “Negative Descriptor” words, which included “nonadherent, aggressive, agitated, angry, challenging, combative, and noncompliant.” Research guided by the SCSC has found that even seemingly innocuous category labels cause others to perceive individual actions and characteristics as static, “essentialist” aspects of identity, which exaggerate differences across groups and similarities within them.[12](#ocae310-B12)

### Doubt markers

Doubt markers are words and expressions used to confer disbelief or uncertainty in patient condition or testimonies, which include terms like: _allegedly_, _apparently_, or _claimed_. Providers may use words when describing patient testimony in combination with stigmatizing labels or negative descriptors of patients to transmit their stance, or expression of attitudes, feelings, and judgment about patients to other providers, which may impact future treatment and care decisions.[13](#ocae310-B13) Inequities have been found among usage of these terms across race and gender, where patients who were women and patients who were Black were found to have significantly higher frequencies of evidentials in their provider notes than patients who were men or White.[14](#ocae310-B14)

### Scare quotes

“Scare quotes” are the utilization of quotation marks to mock and challenge patient credibility.[14](#ocae310-B14) While quotations are useful to describe symptoms using exact language and document patient wishes or concerns, recent linguistic research has identified quotations usage in ways which mock or manipulate the voices of patients (Beach and Saha, p. 202).[6](#ocae310-B6),[14](#ocae310-B14) For example, consider the ambiguity added to the sentence: “Patient reports 10/10 pain related to sickle cell crisis,” when you add “Patient reports ‘10/10’ pain related to ‘sickle cell crisis’.” Scare quotes have also been found to be more prevalent among patients who were Black and among patients who were women.[6](#ocae310-B6),[14](#ocae310-B14)

### Natural language processing to identify stigma and bias in EHR data

Despite advances in natural language processing, a recent scoping review revealed only a handful of other recent works applying NLP to identify stigmatizing language in the EHR.[15](#ocae310-B15) Of existing papers, many compile lexica of terms found in literature and match notes using only regular expressions, defining the exposure of stigmatizing language as any which match with any word in the lexicon. While lexicon matching has illuminated significant differential trends among marginalized patient populations, particularly among patients who women or who are Black, it is possible that word use alone may not fully capture patient stigmatization.[11](#ocae310-B11),[14](#ocae310-B14),[16](#ocae310-B16) Harrigian et al.’s[17](#ocae310-B17) and Barcelona et al.’s[18](#ocae310-B18) recent studies addressed this limitation by adding the steps of note annotation and supervised learning classification toward notes that had matched with predetermined lexicons. These studies demonstrate the benefit of combining lexicon matching with more refined supervised classification. However, they lack the ability to expand pre-existing lexicons to identify additional stigmatizing language features, which may appear in new data.

This paper aims to apply advanced methods in natural language processing to identify stigmatizing language in the EHR for ICU patients. This study extends qualitative and NLP methods to detect provider stigma by (1) applying a unique automated lexicon expansion step, utilizing data-specific word embeddings and chain-of-thought large language model (LLM) prompting toward identify new stigmatizing or doubt marking lexicon words, and (2) applying 0, 1, few-shot, and fine-tuned LLMs toward stigmatizing, doubt marking, and scare quote classification. Doubt marker and stigmatizing label lexicons, as well as the full suite of classification models, are available for use.[19](#ocae310-B19)

## Methods

Our methods for identifying doubt markers, stigmatizing labels, and scare quotes within provider notes consisted of 3 steps:

1.  Lexicon development, expansion, and sample preparation
    
2.  Sentence-level annotation, and
    
3.  Supervised classification using bag-of-words and transformer-based models
    

### MIMIC-III dataset

The Medical Information Mart for Intensive Care, or “MIMIC-III,” is a freely available database of de-identified EHR, free-text notes, and event documentation for over 40 000 patients admitted to the ICU at Beth Israel Deaconess Medical Center in Boston, MA from 2001 to 2012.[20](#ocae310-B20) This dataset contains over 1.2 million clinical provider notes, across nearly 50 000 admissions.

### Lexicon development and sample preparation

The lexicon development process for doubt markers and stigmatizing patient labels began with a stem-word list of words previously identified as demarcating doubt or perpetuating stigmatizing patient labels within medical charts. We expanded these word lists to include misspellings or words with high semantic similarity and relevance in the domain by using 2 subsequent techniques: (1) BioWordVec, a word embeddings model trained on medical text, which generated the top 10 most semantically similar words for each stem word,[21](#ocae310-B21),[22](#ocae310-B22) and (2) GPT 3.5, which suggested an additional 25 words and spelling deviations for each lexicon derived from the literature and expanded in step 1, which was provided via chain-of-thought prompting, described in detail in [Appendix S1A](#sup1).[23](#ocae310-B23) Number of similar and expanded words were determined by balancing effort required in manual validation with decreasing relevance of additional similar words as determined by prior experimentation with BioWordVec. Following the first round of word embeddings expansion, we manually validated the generated words for task relevance, and assessed interrater reliability on whether each word was relevant to each specific bias feature. After the round of GPT 3.5 expansions, we assessed 10-20 sample matches from the highest top-frequency terms’ to remove any extremely high-frequency word matches from the lexicon that were not related to the transmission of stigmatizing labels or doubt markers and could have a significant impact on the annotation sample. Our analytic pipeline is outlined in [Figure 1](#ocae310-F1), with intermediary results described in [Appendix S1B](#sup1).

#### Figure 1.

[![This figure describes the natural language processing analytic steps carried out in the methods, beginning with the MIMIC-III dataset, lexicon development and expansion, regular expression matching, annotation of 1000 sentence samples, and examples of the matched sentences and annotation scores prior to training/evaluation of classifiers.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/a654/11756621/d4b98a362823/ocae310f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756621_ocae310f1.jpg)

[Open in a new tab](figure/ocae310-F1/)

Natural language processing analytic pipeline for lexicon development, regular expression matching, annotation, and classifier model training for stigmatizing linguistic features in MIMIC-III.

Coding ontologies for each of the 3 linguistic bias features were developed originally by AW, then iterated on during the first round of reliability coding. The original ontologies were guided by the SCSC framework, as well as previous work led by Beach, Park, and Goddu on the role of stigmatizing language in patient charts.[7](#ocae310-B7),[14](#ocae310-B14),[24](#ocae310-B24)

### Stigmatizing labels

Stigmatizing label lexicon development was guided by literature on stigmatizing language in medical care, specifically from the NIDA “Words Matter” publication, Sun’s “Negative Patient Descriptors: Documenting Racial Bias in the Electronic Health Record,” as well as Zestcott’s “Health Care Providers’ Negative Implicit Attitudes and Stereotypes of American Indians.”[9](#ocae310-B9),[11](#ocae310-B11),[25](#ocae310-B25) The initial stem word list consisted of 18 words: “abuser,” “junkie,” “alcoholic,” “drunk,” “drug-seeking,” “nonadherent,” “agitated,” “angry,” “combative,” “noncompliant,” “confront,” “noncooperative,” “defensive,” “hysterical,” “unpleasant,” “refuse,” “frequent-flyer,” “reluctant.” These words, particularly when used to describe a patient in terms of static characteristics, as opposed to describing specific behaviors, would be considered stigmatizing labels by our coding ontology. Coding ontologies for all language features are provided in [Appendix S2](#sup1).

### Doubt markers

Doubt marker lexicon development was guided by literature on use of “doubt markers” in medical care, specifically led by Beach and et al.,[14](#ocae310-B14) which identified words such as “claims,” “insists,” and “adamant” or “apparently,” which have been found to be used to discredit or invalidate patient testimony. The 6 words included on the initial stem list were: “adamant,” “claimed,” “insists,” “allegedly,” “disbelieves,” and “dubious.” When these words were used in a sentence to imbue doubt upon patient testimony, character, or behaviors, they were coded as positive for doubt markers.

### Scare quotes

Scare quote sample preparation was created by searching the MIMIC-III notes using regular expression ((?=.\*\\”.\*\\”)(?=.\*\\b(pt|patient|pateint|he|she|they)\\b)), which caught matching closed quotes, and references to patients by “patient” derivations and pronouns, in order to more accurately capture quotes with patient attributions. Finally, several words were added to filter rows, where matches with quoted words were commonly referring to answers for “alert and oriented” examinations—ie, “Patient Name,” “Hospital,” “Year,” etc. When quotations were used in a sentence to mock, cast doubt, or question patient testimony, in a way which would not help inform the care team with insight on clinical condition, patient description of symptoms, values, or preferences, preferences, it was coded as positive for scare quotes.

### Matching with sentences in MIMIC-III, creating coding samples

Regular expression matches for each linguistic feature were used to filter through patient free-text clinical notes, which had been tokenized at the sentence level to allow for easier readability and classification feasibility. All duplicate sentences were removed from the dataset, and charts labeled as EEG or Radiology were removed in order to restrict to charts more likely to have subjective narrative and patient history text data, such as progress notes, history and prognosis notes, and discharge summaries. Each linguistic feature dataset was randomly sampled for annotation in non-replacement groups of 100 (for double-coder reliability scores), 400 (coded by AT, a Physician’s Assistant), and 500 (coded by AW, a behavioral data scientist).

### Annotation process

Annotators met once to discuss each of the 3 coding ontologies, as well as co-code 5 sentence examples from each linguistic bias dataset. Following the first meeting, each coder completed the same set of 100 sentences for each of the linguistic bias feature datasets. After inter-rater reliability was assessed, the coders met to discuss disagreements and sentences marked as “close calls,” or difficult labeling decisions, and “exemplary” sentences, which were particularly obvious examples to review. After all disagreements were adjudicated by the coders, they solo-coded 400 (AT) and 500 (AW) sentences to complete the 1000 samples for each linguistic bias feature.

### Sentence classification

Annotation data were used to train supervised models for the binary classification task of identifying sentences that do or do not contain each of the linguistic bias features. This supervised learning task was carried out using 7 models: Naive Bayes, Logistic Regression, Random Forest, as well as the state-of-the-art transformer-based RoBERTa,[26](#ocae310-B26) and Meta’s open source LLM, LLAMA-3-70B, assessing performance of this model using 0, 1, and 3-shot training.[27](#ocae310-B27) Additionally, we experimented with QLoRA, a fine-tuning LLM approach leveraging quantization and Low-Rank Adapters with LLAMA-3-8B.[28](#ocae310-B28)

For Naive Bayes, Logistic Regression, and Random Forest models, sentences were count vectorized using uni and bigrams, with a max of 10 000 features. A grid search approach was used for hyperparameter optimization for these models, using the training data set, which was split at 80/20%. For Naive Bayes, Logistic Regression, and Random Forest, we utilized a stratified k-fold, with 5 splits, in order to create training and test sets which preserved the percentage of samples for each class.

Following model training, each model was evaluated on a held-out 20% of the data, in which we selected the best-performing model based on _F_1\-score to select the highest-performing model of each model type. Hyperparameter values for each of the best-performing models for each linguistic feature, as well as full LLM prompts, are available in [Appendices S2-S4](#sup1). We applied bootstrapping to model evaluation by assessing prediction and ground-truth labels of 1000 samples, generated without replacement. The performance metrics of F1, precision, accuracy, and recall were aggregated to calculate the confidence intervals of all model metrics. Feature importance was assessed using Gini importance mean impurity reduction method for decision trees in the random forest classifiers, and regression coefficients were calculated from the logistic regression classifiers.[29–31](#ocae310-B29) Error analyses for each linguistic feature included assessment of confusion matrices, differences in frequencies of matched terms (or quoted text, for scare quotes), and top term frequency inverse document frequency scores for 1-3 gram phrases between false-positive and false-negative classifications.

## Results

### Lexicon development

The initial list of stigmatizing labels of 18, initially expanded to 180, was then assessed by annotators A.W. and S.D., removing 83 terms (agreement = 75%). The final expanded and pruned list of stigmatizing labels used to search the MIMIC-III dataset totaled 127 words, and is provided in [Appendix S1B](#sup1). We removed the following terms due to high proportion of noise referring to illness characteristics or clinical situations, rather than patients or patient testimonies: “difficult,” “suspicious,” “aggressive,” “unstable,” “dramatic,” “unreliable,” “entitled,” “invalid,” “violent,” and “dangerous.”

The initial list of 6 doubt marker terms was expanded to 60, which was then pruned by annotators to remove 2 terms (annotator agreement = 80%). The final expanded list of doubt markers used to search the MIMIC-III dataset totaled 58 words, and is provided in [Appendix S1B](#sup1). Following regular expression searching and assessments of most frequent term matches, we removed the following terms due to high proportion of noise referring to uncertainty in illness or clinical presentations, rather than patient testimonies: “suspicion,” “suspicious,” “questionable,” “questioning,” “uncertain,” “hesitancy,” “hesitant,” and “unsure.”

### Regular expression search results

Results describing the text data of the preprocessed MIMIC-III full sample, as well as of search results for each of the feature regular expression (regex) matched corpa, as well as classification predictions for doubt markers and stigmatizing labels are summarized in [Table 1](#ocae310-T1). Due to the lower performance of scare quote classifiers, estimates of average numbers of scare quotes per patient and provider were not calculated.

#### Table 1.

Summary statistics of MIMIC-III Dataset, compared with linguistic bias corpa.

|  | MIMIC-III sample | Stigmatizing label corpus | Doubt marker corpus | Scare quotes corpus |
| --- | --- | --- | --- | --- |
| Number of unique notes | 814 548 notes | 8950 notes | 3682 notes | 4806 notes |
| Avg note length | 654 words | 623 words | 937 words | 763 words |
| Number of total sentences | 18 288 213 sentences | 10 278 sentences | 3856 sentences | 5156 sentences |
| Average sentence length | 12 words | 48 words | 35 words | 55 words |
| Number of patients with at least 1 feature | 11 633 patients | 3483 patients | 2368 patients | 2830 patients |
|  |  | (29.9%) | (20.4%) | (24.3%) |
| Classifier-predicted average number of features per patient | — | 0.5 (1.99) | 0.09 (0.48) | — |
| Mean (SD) |  | 0 \[0, 90\] | 0 \[0, 29\] |  |
| Median \[Min, Max\] |  |  |  |  |
| Number of providers | 1879 providers | 1056 providers | 800 providers | 677 providers |
|  |  | (56.2%) | (42.6%) | (36.0%) |
| Classifier-predicted average number of features written per provider | — | 3.09 (14.40) | 0.56 (5.58) | — |
| Mean (SD) |  | 0 \[0, 557\] | 0 \[0, 236\] |  |
| Median \[Min, Max\] |  |  |  |  |

[Open in a new tab](table/ocae310-T1/)

The most frequent matching terms from our lexicon, along with the most commonly occurring trigrams within quoted text, are provided for each of the 3 bias features in [Figure 2](#ocae310-F2).

#### Figure 2.

[![Three horizontal bar frequency charts are displayed, showing top 20 matched terms or quoted text from Stigmatizing Labels, Doubt Markers, and Scare Quote Lexicons.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/a654/11756621/838ee324c741/ocae310f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756621_ocae310f2.jpg)

[Open in a new tab](figure/ocae310-F2/)

Top 20 matched terms stigmatizing labels, doubt markers, and scare quotes.

For stigmatizing labels, versions of “refusing” and “refuses” were by far the most frequently matched terms. In the doubt marker label lexicon, “believes” was the most frequently matched term, followed by insisted and insisting. Scare quote quoted text frequent words, bigrams, and trigrams were less led by any particular phrases or words, but were mostly used describing patient chief complaints, descriptions of symptoms, or condition.

### Annotation

Annotation coding ontologies, detailing the labeling instructions for each of the 3 linguistic bias features, were informed largely through the literature-based stem word operationalizations of each set of linguistic bias features. [Appendices S1-S3](#sup1) detail the coding ontologies for each corpus. [Table 2](#ocae310-T2) provides the interrater agreement and kappa score for the first 100 samples of each linguistic feature, and positive class frequency in the final 1000 sentence sample.

#### Table 2.

Annotation sample reliability, linguistic bias features positive class frequencies, and notable examples.

| Bias feature | Agreement (%) | Interrater reliability (Kappa) | Positive class frequency in final sample (N = 1000) (%) |
| --- | --- | --- | --- |
| Stigmatizing labels | 87 | .74 | 43.9 |
| Doubt markers | 87 | .73 | 31.0 |
| Scare quotes | 87 | .73 | 20.7 |

[Open in a new tab](table/ocae310-T2/)

[Table 3](#ocae310-T3) provides notable positive class examples for each of the 3 linguistic features.

#### Table 3.

Notable annotation examples for stigmatizing labels, doubt markers, and scare quotes.

| Bias feature | Notable positive class sentence examples(Flagged as containing biased feature, matching or quoted text underlined) |
| --- | --- |
| Stigmatizing labels | Pt very uncooperative, will barely allow any nursing care. Neuro: Is very needy, needs to be incouraged to do more for herself. Refuses blood draws, calling out, asking for dilaudid despite med not being due, requiring much emotional support. |
| Doubt markers | “Pain control (acute pain, chronic pain) Assessment: Pt has chronic abd pain constantly claiming pain scale 10.” “His last drink of alcohol was supposedly 3 weeks ago.” Insisting on making phone calls becomes very irritated if don’t jump to his requests. |
| Scare quotes | Easily frustrated, especially when asked questions to assess orientation…pt states “you have already asked me this 100 times”. NO nausea/vomiting although pt states he does not want to eat because he “fears” being nauseated. At 10:06, pt put on call light to request “pain pill” and then put on the call light 5 more times over the next 8 minutes to make same demand, at one point saying to the nurse responding to the call light, “What the hell is going on.” |

[Open in a new tab](table/ocae310-T3/)

### Linguistic bias classifier model evaluation results

[Table 4](#ocae310-T4) displays the results of the best-performing models across types and linguistic bias features, with the best-performing model hyperparameters in [Appendix S5](#sup1). We were able to achieve the highest performance on doubt markers and stigmatizing labels, with scare quote models underperforming other linguistic bias models across nearly every evaluation metric.

#### Table 4.

Linguistic bias classifier model performance (best model of each feature in bold).

| Bias feature | Model | Accuracy | Precision | Recall | F1 | Train run duration |
| --- | --- | --- | --- | --- | --- | --- |
| Stigmatizing labels | Regex (stem list) | 0.57 (0.50, 0.64) | 0.50 (0.37, 0.64) | 0.32 (0.22, 0.41) | 0.39 (0.29, 0.49) | N/A |
|  | Regex (expanded) | 0.43 (0.36, 0.50) | 0.43 (0.36, 0.50) | 1.0 (1.0, 1.0) | 0.60 (0.53, 0.67) | N/A |
|  | LLAMA-3 zero shot | 0.43 (0.36, 0.50) | 0.43 (0.36, 0.50) | 1.0 (1.0, 1.0) | 0.60 (0.53, 0.67) | 134.6 s |
|  | LLAMA-3 1-shot | 0.61 (0.54, 0.67) | 0.54 (0.44, 0.63) | 0.60 (0.49, 0.70) | 0.56 (0.48, 0.65) | 185.2 s |
|  | LLAMA-3 3-shot | 0.52 (0.45, 0.59) | 0.46 (0.37, 0.54) | 0.68 (0.58, 0.78) | 0.55 (0.46, 0.62) | 166.7 s |
|  | LLAMA-3 QLoRA | 0.77 (0.71, 0.83) | 0.76 (0.65, 0.86) | 0.71 (0.60, 0.81) | 0.73 (0.65, 0.81) | 21 771.4 s |
|  | RoBERTa | 0.69 (0.63, 0.76) | 0.63 (0.54, 0.72) | 0.75 (0.67, 0.84) | 0.69 (0.63, 0.75) | 484.1 s |
|  | Random forest | 0.79 (0.73, 0.84) | 0.77 (0.68, 0.86) | 0.73 (0.63, 0.82) | 0.75 (0.67, 0.82) | 148.4 s |
|  | Logistic regression | 0.81 (0.75, 0.86) | 0.75 (0.66, 0.85) | 0.84 (0.75, 0.91) | 0.79 (0.72, 0.86) | 3.2 s |
|  | Naive Bayes | 0.71 (0.64, 0.77) | 0.62 (0.53, 0.70) | .86 (.79, .93) | 0.72 (0.64, 0.78) | 0.1 s |
| Doubt markers | Regex (stem list) | 0.70 (0.64, 0.77) | 0.81 (0.58, 1.0) | 0.18 (0.08, 0.27) | 0.29 (0.14, 0.41) | N/A |
|  | Regex (expanded) | 0.34 (0.28, 0.42) | 0.34 (0.28, 0.42) | 1.0 (1.0, 1.0) | 0.51 (0.44, 0.59) | N/A |
|  | LLAMA-3 zero-shot | 0.57 (0.50, 0.63) | 0.44 (0.36, 0.52) | 0.90 (0.83, 0.96) | 0.59 (0.51, 0.67) | 71.9 s |
|  | LLAMA-3 1-shot | 0.58 (0.51, 0.65) | 0.36 (0.26, 0.46) | 0.54 (0.41, 0.66) | 0.43 (0.32, 0.53) | 154.3 s |
|  | LLAMA-3 3-shot | 0.63 (0.56, 0.70) | 0.37 (0.24, 0.50) | 0.36 (0.24, 0.48) | 0.36 (0.25, 0.47) | 158.0 s |
|  | LLAMA-3 QLoRA | 0.84 (0.77, 0.89) | .79 (.66, .89) | .70 (.57, .82) | .74 (.64, .84) | 20 329.9 s |
|  | RoBERTa | 0.86 (0.81, 0.91) | 0.86 (0.75, 0.96) | 0.71 (0.59, 0.81) | .84 (.78, .88) | 790.72 s |
|  | Random forest | 0.85 (0.80, 0.89) | 0.76 (0.64, 0.86) | 0.76 (0.65, 0.85) | 0.76 (0.67, 0.84) | 18.0 s |
|  | Logistic regression | 0.85 (0.80, 0.90) | 0.71 (0.61, 0.81) | 0.89 (0.80, 0.96) | 0.78 (0.69, 0.85) | 2.4 s |
|  | Naive Bayes | 0.85 (0.80, 0.89) | 0.70 (0.60, 0.80) | 0.89 (0.80, 0.96) | 0.78 (0.69, 0.85) | 0.1 s |
| Scare quotes | Regex | 0.21 (0.16, 0.27) | 0.21 (0.16, 0.27) | 1.0 (1.0, 1.0) | 0.35 (0.28, 0.43) | N/A |
|  | LLAMA-3 zero-shot | 0.46 (0.39, 0.53) | 0.23 (0.17, 0.31) | 0.69 (0.55, 0.83) | 0.35 (0.26, 0.44) | 100.1 s |
|  | LLAMA-3 1-shot | 0.42 (0.35, 0.49) | 0.20 (0.13, 0.26) | 0.74 (0.59, 0.88) | 0.31 (0.22, 0.40) | 107.3 s |
|  | LLAMA-3 3-shot | 0.49 (0.41, 0.56) | 0.19 (0.12, 0.26) | 0.60 (0.42, 0.77) | 0.29 (0.19, 0.38) | 227.7 s |
|  | LLAMA-3 QLoRA | 0.65 (0.58, 0.72) | 0.33 (0.22, 0.44) | 0.60 (0.43, 0.76) | 0.43 (0.30, 0.54) | 20 209.9 s |
|  | RoBERTa | 0.75 (0.69, 0.81) | 0.40 (0.24, 0.58) | 0.30 (0.17, 0.45) | 0.62 (0.52, 0.70) | 810.0 s |
|  | Random forest | 0.79 (0.74, 0.85) | 0.00 (0, 0) | 0.00 (0, 0) | 0.00 (0, 0) | 148.9 s |
|  | Logistic regression | 0.77 (0.71, 0.82) | 0.30 (0.07, 0.56) | 0.10 (0.02, 0.20) | 0.14 (0.04, 0.28) | 1.7 s |
|  | Naive Bayes | 0.78 (0.72, 0.83) | 0.43 (0.22, 0.63) | 0.24 (0.12, 0.38) | 0.31 (0.16, 0.45) | 0.1 s |

[Open in a new tab](table/ocae310-T4/)

The best-performing model type for doubt markers and scare quotes was RoBERTa, with Logistic Regression achieving the best performance in classifying stigmatizing label sentences. LLM models showed poorer performance than supervised classifiers, but were still superior to regular expression lexicon matching alone. LLMs showed decreased performance with 1 and 3-shot models as compared with zero-shot. QLoRA fine-tuning of LLM resulted in increased performance across all language features when compared to other LLM-based models.

[Figure 3](#ocae310-F3) highlights terms or phrases that are most informative to random forest models during categorization (left-hand side), and the right-hand side displays the terms with the highest regression coefficients (negative and positive), which are more likely to be labeled as negative (blue), or positive (red). Error analysis, detailed in [Appendix S6](#sup1), indicated that stigmatizing label errors often involved the forms of “refusing,” “noncompliant,” or “uncooperative,” occurring frequently in false negatives and positives when describing patient refusal of medications, turning in bed, or care in general. Doubt marker errors often involved terms like “accused,” and “adamantly” for false positives, and terms like “believes,” and “supposedly” for false negatives, with forms of “insisting” appearing frequently in both. Scare quote false positives often included quotations of patients saying “no,” and several false negatives included references to substance use, including “sober up” and “wanting to smoke,”

#### Figure 3.

[![3 pairs of horizontal bar charts are displayed, showing the feature importance (left column) from random forest models, and logistic regression feature contributions, with blue lines indicating negative class contribution and red indicating positive.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/a654/11756621/84425cf7487e/ocae310f3.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756621_ocae310f3.jpg)

[Open in a new tab](figure/ocae310-F3/)

Top 30 stigmatizing label tokens by importance and feature contributions.

## Discussion

This study demonstrated the viability of scaling up previous research on stigma in language to develop tools that can be applied to identifying stigmatizing text in the EHR. For the task of lexicon development, our expanded word lists successfully produced terms that frequently matched with sentences that were eventually labeled as stigmatizing or doubt-marking by coders. These lexicons are valuable tools for researchers seeking to focus on EHR sentences with a higher frequency of stigmatizing or doubt-marking signals. Our process of expanding word lists using word embeddings and chain-of-thought prompting LLMs was able to identify several additional high-frequency terms not previously identified, including “needy,” “challenging,” “delusional,” “lazy,” and “manipulative.” This method shows great potential in addressing the difficulties in capturing stigmatizing language as it evolves over time, which has been previously identified as a major challenge in this field.[17](#ocae310-B17)

Classifiers for stigmatizing labels and doubt markers demonstrated near-human agreement performance. Scare quote classifiers were less effective, which underscores the lack of precision using regular expression matching methods alone, which to date has been the only method used to identify them in EHR.[14](#ocae310-B14) Because scare quotes had the lowest frequency of positive annotations of the 3 features, performance may improve with additional positive examples. All supervised learning classifiers performed better than LLM models and regular expression matching alone, indicating the importance of considering language context, not merely the presence of words, in the task of identifying stigmatizing language.

Several patterns in stigmatizing label and doubt marker use arose that may help inform clinical practice. Among stigmatizing labels, the use of “needy” was predictive of positive stigmatizing labels. “Needy” was often used to describe an inherent trait, which is highly problematic for anyone seeking care in the ICU. Other providers may wrongfully assume the patient is “needy” in other contexts, including pain management, daily activity assistance, or any other genuine health complaint. “Noncompliant,” a word identified in the expanded stigmatizing labels lexicon and present in false-negative and false-positive error analysis, was labeled as stigmatizing chiefly when it was used to define the patient directly as such and not when describing a specific behavior or when providing more context (ie, due to lack of funds). Labeling patients as “noncompliant” has been hotly debated, though recent EHR-related NLP work is increasingly operationalizing its use as one that has negative connotations, and points blame at the patient, rather than structural factors which may have stronger impacts and constraints on patient health.[11](#ocae310-B11),[16](#ocae310-B16)

We encountered many usages of “refusing” among stigmatizing label charts. We sought to negatively label when providers were specific about the behavior and context in which the patient was refusing a specific treatment, or when the context was surrounding end-of-life or do not resuscitate. We positively labeled examples when the language around how patients were refusing was vague, or painted the patient as refusing any care in a way that could portray the patient as inherently stubborn. We also positively labeled any examples that depicted a patient as refusing to try/assert effort. Our rationale was that this could be interpreted as labeling a patient as lazy or unwillful, potentially overlooking patient discomfort with activity or decreased health status. Error analysis showing forms of “refusing” in both false negative and false positive examples show challenges with automated classification in this context.

Use of “insisted” and “insisting” were frequently labeled as positive for doubt markers, though also often appeared in false negative and false positive examples. While these words may be helpful in expressing strong conviction behind patient needs, it is frequently also laden with negative, stubborn, or difficult connotations. The word “claimed,” particularly when describing pain or severity of illness symptoms or pain, was highly likely to be labeled as a doubt marker. “Alcohol” also had a high feature contribution toward positive doubt marker labels. Both annotators described that doubt marker words were frequently employed to report patient alcohol and drug use history, as exemplified in [Table 2](#ocae310-T2). While certain words may predict the likelihood of positive stigma or doubt marking classification more than others, the mere use of the words themselves did not automatically signal stigmatization. Providers are encouraged to consider how their language about patients may be received by others in ways that can further perpetuate stereotypes, de-individualize, doubt, and mock patients in a way that is not necessary or helpful for their care.[5](#ocae310-B5),[14](#ocae310-B14)

### Limitations

Low performance on scare quotes may be indicative of the need for additional data to train future models. Due to the high variety of quote usage in language, it is important to consider different approaches and linguistic structural features within scare quotes. Additionally, our dataset consists only of notes from ICU admissions from 1 site. Many stigmatized patients, particularly those with mental health or substance use problems, may not be admitted due to a variety of structural barriers, interactions with healthcare providers, or concomitant illness.[32–34](#ocae310-B32)

Another limitation to consider is the limitation of 2 annotators for this task, with a need for further validation across variety of clinical experts. Further, while the uni-grams and bigrams were useful as features in our supervised classifiers, there may be broader phrase windows, which more accurately identify the complex nature of stigmatizing language.

Finally, as language and medicine have changed from 2001 to 2012 in MIMIC-III notes, there may be words that were acceptable at 1 time and are only realized to be derogatory over time. These patterns of language may be structurally different than current EHR language, particularly in light of increased transparency of patient records brought by the 21st Century Cures Act and OpenNotes.[35](#ocae310-B35),[36](#ocae310-B36) It is important also to test and potentially adapt these lexicons and classifiers across different care contexts outside of the ICU. Due to the constantly evolving means of communicating and conveying stereotype and stigmatizing language, the process of identifying stigma and bias must be a continuous effort.[37](#ocae310-B37),[38](#ocae310-B38)

## Conclusions

The CARE-SD 1.0 models and lexicons produced in this study hold high utility for identifying patterns of stigmatizing labels and doubt markers in healthcare systems, particularly for targeting and designing interventions. Our goal in sharing these tools is to accelerate research efforts in the study of linguistic stigma and bias in healthcare. With additional validation, these models can be used to audit and evaluate healthcare systems for units, providers, or patients who experience higher rates of stigmatizing labels and doubt markers. By utilizing these classifiers in a larger NLP pipeline, generative LLMs could be incorporated downstream to destigmatize the identified stigmatizing sentences, which could allow for valuable real-time feedback for providers in a way that has not been possible with traditional implicit bias training approaches.[3](#ocae310-B3)

## Supplementary Material

ocae310\_Supplementary\_Data

[ocae310\_supplementary\_data.docx](/articles/instance/11756621/bin/ocae310_supplementary_data.docx) (399.7KB, docx)

## Contributor Information

Andrew Walker, Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States.

Annie Thorne, Department of Infectious Disease, Children’s Healthcare of Atlanta, Atlanta, GA 30329, United States.

Sudeshna Das, Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States.

Jennifer Love, Department of Emergency Medicine, Mount Sinai, New York, NY 10029, United States.

Hannah L F Cooper, Department of Behavioral, Social, Health Education Sciences, Rollins School of Public Health, Emory University, Atlanta, GA 30322, United States.

Melvin Livingston, III, Department of Behavioral, Social, Health Education Sciences, Rollins School of Public Health, Emory University, Atlanta, GA 30322, United States.

Abeed Sarker, Department of Biomedical Informatics, School of Medicine, Emory University, Atlanta, GA 30322, United States; Department of Biomedical Engineering, Georgia Institute of Technology and Emory University, Atlanta, GA 30332, United States.

## Author contributions

Andrew L. Walker (Conceptualization, Data curation, Formal analysis, Funding acquisition, Investigation, Methodology, Project administration, Software, Visualization, Writing—original draft, Writing—review & editing), Annie Thorne (Data curation, Investigation, Writing—review & editing), Sudeshna Das (Data curation, Formal analysis, Writing—review & editing), Jennifer Love (Data curation, Investigation, Writing—review & editing), Hannah L.F. Cooper (Funding acquisition, Conceptualization, Investigation, Project administration, Writing—review & editing), Melvin Livingston (Conceptualization, Formal analysis, Investigation, Methodology, Supervision, Writing—review & editing), and Abeed Sarker (Formal analysis, Investigation, Methodology, Supervision, Writing—review & editing)

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

This work was supported by National Institute on Drug Abuse \[grant numbers T32DA0505552 and R01DA057599\]. The results and opinions expressed therein represent those of the authors and do not necessarily reflect those of NIH or NIDA.

## Conflicts of interest

The authors have no competing interests to share.

## Data availability

Information on the MIMIC-III Clinical Dataset and how to access data is available here: [https://physionet.org/content/mimiciii/1.4/](https://physionet.org/content/mimiciii/1.4/)

## References

*   1. Hatzenbuehler ML, Phelan JC, Link BG.. Stigma as a fundamental cause of population health inequalities. Am J Public Health. 2013;103:813-821. 10.2105/AJPH.2012.301069 \[[DOI](https://doi.org/10.2105/AJPH.2012.301069)\] \[[PMC free article](/articles/PMC3682466/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/23488505/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Public%20Health&title=Stigma%20as%20a%20fundamental%20cause%20of%20population%20health%20inequalities&volume=103&publication_year=2013&pages=813-821&pmid=23488505&doi=10.2105/AJPH.2012.301069&)\]
*   2. Maina IW, Belton TD, Ginzberg S, Singh A, Johnson TJ.. A decade of studying implicit racial/ethnic bias in healthcare providers using the implicit association test. Soc Sci Med. 2018;199:219-229. 10.1016/j.socscimed.2017.05.009 \[[DOI](https://doi.org/10.1016/j.socscimed.2017.05.009)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28532892/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Soc%20Sci%20Med&title=A%20decade%20of%20studying%20implicit%20racial/ethnic%20bias%20in%20healthcare%20providers%20using%20the%20implicit%20association%20test&volume=199&publication_year=2018&pages=219-229&pmid=28532892&doi=10.1016/j.socscimed.2017.05.009&)\]
*   3. FitzGerald C, Hurst S.. Implicit bias in healthcare professionals: a systematic review. BMC Med Ethics. 2017;18:19. 10.1186/s12910-017-0179-8 \[[DOI](https://doi.org/10.1186/s12910-017-0179-8)\] \[[PMC free article](/articles/PMC5333436/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28249596/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Ethics&title=Implicit%20bias%20in%20healthcare%20professionals:%20a%20systematic%20review&volume=18&publication_year=2017&pages=19&pmid=28249596&doi=10.1186/s12910-017-0179-8&)\]
*   4. Link BG, Phelan JC.. Conceptualizing stigma. Annu Rev Sociol. 2001;27:363-385. 10.1146/annurev.soc.27.1.363 \[[DOI](https://doi.org/10.1146/annurev.soc.27.1.363)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Annu%20Rev%20Sociol&title=Conceptualizing%20stigma&volume=27&publication_year=2001&pages=363-385&doi=10.1146/annurev.soc.27.1.363&)\]
*   5. Beukeboom CJ, Burgers C, Reviews R of CROAHQL. How stereotypes are shared through language—a review and introduction of the social categories and stereotypes communication (SCSC) framework. Rev Commun Res. 2019;7:1-37. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Rev%20Commun%20Res&title=How%20stereotypes%20are%20shared%20through%20language%E2%80%94a%20review%20and%20introduction%20of%20the%20social%20categories%20and%20stereotypes%20communication%20\(SCSC\)%20framework&volume=7&publication_year=2019&pages=1-37&)\]
*   6. Beach MC, Saha S.. Quoting patients in clinical notes: first, do no harm. Ann Intern Med. 2021;174:1454-1455. 10.7326/M21-2449 \[[DOI](https://doi.org/10.7326/M21-2449)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34399061/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Ann%20Intern%20Med&title=Quoting%20patients%20in%20clinical%20notes:%20first,%20do%20no%20harm&volume=174&publication_year=2021&pages=1454-1455&pmid=34399061&doi=10.7326/M21-2449&)\]
*   7. Goddu AP, O’Conor KJ, Lanzkron S, et al. Do words matter? Stigmatizing language and the transmission of bias in the medical record. J Gen Intern Med. 2018;33:685-691. 10.1007/s11606-017-4289-2 \[[DOI](https://doi.org/10.1007/s11606-017-4289-2)\] \[[PMC free article](/articles/PMC5910343/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/29374357/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Gen%20Intern%20Med&title=Do%20words%20matter?%20Stigmatizing%20language%20and%20the%20transmission%20of%20bias%20in%20the%20medical%20record&volume=33&publication_year=2018&pages=685-691&pmid=29374357&doi=10.1007/s11606-017-4289-2&)\]
*   8. Zhang H, Lu AX, Abdalla M, McDermott M, Ghassemi M. Hurtful words: quantifying biases in clinical contextual word embeddings. In: _Proceedings of the ACM Conference on Health, Inference, and Learning_. CHIL ’20. Association for Computing Machinery; 2020:110-120. 10.1145/3368555.3384448 \[[DOI](https://doi.org/10.1145/3368555.3384448)\]
*   9. Abuse NI on D. Words matter—terms to use and avoid when talking about addiction. National Institute on Drug Abuse. November 29, 2021. Accessed January 22, 2022. [https://www.drugabuse.gov/nidamed-medical-health-professionals/health-professions-education/words-matter-terms-to-use-avoid-when-talking-about-addiction](https://www.drugabuse.gov/nidamed-medical-health-professionals/health-professions-education/words-matter-terms-to-use-avoid-when-talking-about-addiction)
*   10. Glassberg J, Tanabe P, Richardson L, DeBaun M.. Among emergency physicians, use of the term “Sickler” is associated with negative attitudes toward people with sickle cell disease. Am J Hematol. 2013;88:532-533. 10.1002/ajh.23441 \[[DOI](https://doi.org/10.1002/ajh.23441)\] \[[PMC free article](/articles/PMC5027173/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/23526459/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Hematol&title=Among%20emergency%20physicians,%20use%20of%20the%20term%20%E2%80%9CSickler%E2%80%9D%20is%20associated%20with%20negative%20attitudes%20toward%20people%20with%20sickle%20cell%20disease&volume=88&publication_year=2013&pages=532-533&pmid=23526459&doi=10.1002/ajh.23441&)\]
*   11. Sun M, Oliwa T, Peek ME, Tung EL.. Negative patient descriptors: documenting racial bias in the electronic health record. Health Aff (Millwood). 2022;41:203-211. 10.1377/hlthaff.2021.01423 \[[DOI](https://doi.org/10.1377/hlthaff.2021.01423)\] \[[PMC free article](/articles/PMC8973827/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35044842/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Health%20Aff%20\(Millwood\)&title=Negative%20patient%20descriptors:%20documenting%20racial%20bias%20in%20the%20electronic%20health%20record&volume=41&publication_year=2022&pages=203-211&pmid=35044842&doi=10.1377/hlthaff.2021.01423&)\]
*   12. Beukeboom CJ, Burgers C.. Linguistic bias. In: Giles H, Harwood J, eds. Oxford Research Encyclopedia of Communication. Oxford University Press; 2017. 10.1093/acrefore/9780190228613.013.439 \[[DOI](https://doi.org/10.1093/acrefore/9780190228613.013.439)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Oxford%20Research%20Encyclopedia%20of%20Communication&publication_year=2017&)\]
*   13. Benamara F, Taboada M, Mathieu Y.. Evaluative language beyond bags of words: linguistic insights and computational applications. Comput Linguist. 2017;43:201-264. 10.1162/COLI\_a\_00278 \[[DOI](https://doi.org/10.1162/COLI_a_00278)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Comput%20Linguist&title=Evaluative%20language%20beyond%20bags%20of%20words:%20linguistic%20insights%20and%20computational%20applications&volume=43&publication_year=2017&pages=201-264&doi=10.1162/COLI_a_00278&)\]
*   14. Beach MC, Saha S, Park J, et al. Testimonial injustice: linguistic bias in the medical records of Black patients and women. J Gen Intern Med. 2021;36:1708-1714. 10.1007/s11606-021-06682-z \[[DOI](https://doi.org/10.1007/s11606-021-06682-z)\] \[[PMC free article](/articles/PMC8175470/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33754318/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Gen%20Intern%20Med&title=Testimonial%20injustice:%20linguistic%20bias%20in%20the%20medical%20records%20of%20Black%20patients%20and%20women&volume=36&publication_year=2021&pages=1708-1714&pmid=33754318&doi=10.1007/s11606-021-06682-z&)\]
*   15. Kelly PJA, Snyder AM, Agénor M, et al. A scoping review of methodological approaches to detect bias in the electronic health record \[published online ahead of print\]. Stigma Health. 2023. 10.1037/sah0000497 \[[DOI](https://doi.org/10.1037/sah0000497)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Stigma%20Health&title=A%20scoping%20review%20of%20methodological%20approaches%20to%20detect%20bias%20in%20the%20electronic%20health%20record%20[published%20online%20ahead%20of%20print]&publication_year=2023&doi=10.1037/sah0000497&)\]
*   16. Himmelstein G, Bates D, Zhou L.. Examination of stigmatizing language in the electronic health record. JAMA Netw Open. 2022;5:e2144967. 10.1001/jamanetworkopen.2021.44967 \[[DOI](https://doi.org/10.1001/jamanetworkopen.2021.44967)\] \[[PMC free article](/articles/PMC8796019/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35084481/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open&title=Examination%20of%20stigmatizing%20language%20in%20the%20electronic%20health%20record&volume=5&publication_year=2022&pages=e2144967&pmid=35084481&doi=10.1001/jamanetworkopen.2021.44967&)\]
*   17. Harrigian K, Zirikly A, Chee B, et al. Characterization of stigmatizing language in medical records. In: Rogers A, Boyd-Graber J, Okazaki N, eds. _Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (Volume 2: Short Papers)_. Association for Computational Linguistics; 2023:312-329. 10.18653/v1/2023.acl-short.28 \[[DOI](https://doi.org/10.18653/v1/2023.acl-short.28)\]
*   18. Barcelona V, Scharp D, Moen H, et al. Using natural language processing to identify stigmatizing language in labor and birth clinical notes. Matern Child Health J. 2024;28:578-586. 10.1007/s10995-023-03857-4 \[[DOI](https://doi.org/10.1007/s10995-023-03857-4)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38147277/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Matern%20Child%20Health%20J&title=Using%20natural%20language%20processing%20to%20identify%20stigmatizing%20language%20in%20labor%20and%20birth%20clinical%20notes&volume=28&publication_year=2024&pages=578-586&pmid=38147277&doi=10.1007/s10995-023-03857-4&)\]
*   19. Walker D. drew-walkerr/CARE-SD-Stigma-and-Doubt-EHR-Detection. Published online February 22, 2024. Accessed May 6, 2024. [https://github.com/drew-walkerr/CARE-SD-Stigma-and-Doubt-EHR-Detection](https://github.com/drew-walkerr/CARE-SD-Stigma-and-Doubt-EHR-Detection)
*   20. Johnson AEW, Pollard TJ, Shen L, et al. MIMIC-III, a freely accessible critical care database. Sci Data. 2016;3:160035. 10.1038/sdata.2016.35 \[[DOI](https://doi.org/10.1038/sdata.2016.35)\] \[[PMC free article](/articles/PMC4878278/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27219127/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Data&title=MIMIC-III,%20a%20freely%20accessible%20critical%20care%20database&volume=3&publication_year=2016&pages=160035&pmid=27219127&doi=10.1038/sdata.2016.35&)\]
*   21. Zhang Y, Chen Q, Yang Z, Lin H, Lu Z.. BioWordVec, improving biomedical word embeddings with subword information and MeSH. Sci Data. 2019;6:52. 10.1038/s41597-019-0055-0 \[[DOI](https://doi.org/10.1038/s41597-019-0055-0)\] \[[PMC free article](/articles/PMC6510737/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31076572/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Data&title=BioWordVec,%20improving%20biomedical%20word%20embeddings%20with%20subword%20information%20and%20MeSH&volume=6&publication_year=2019&pages=52&pmid=31076572&doi=10.1038/s41597-019-0055-0&)\]
*   22.BioWordVec & BioSentVec: pre-trained embeddings for biomedical words and sentences. Published online October 27, 2022. Accessed November 1, 2022. [https://github.com/ncbi-nlp/BioSentVec](https://github.com/ncbi-nlp/BioSentVec)
*   23.OpenAI Platform. Accessed December 27, 2023. [https://platform.openai.com](https://platform.openai.com)
*   24. Park J, Saha S, Chee B, Taylor J, Beach MC.. Physician use of stigmatizing language in patient medical records. JAMA Netw Open. 2021;4:e2117052. 10.1001/jamanetworkopen.2021.17052 \[[DOI](https://doi.org/10.1001/jamanetworkopen.2021.17052)\] \[[PMC free article](/articles/PMC8281008/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34259849/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Netw%20Open&title=Physician%20use%20of%20stigmatizing%20language%20in%20patient%20medical%20records&volume=4&publication_year=2021&pages=e2117052&pmid=34259849&doi=10.1001/jamanetworkopen.2021.17052&)\]
*   25. Zestcott CA, Spece L, McDermott D, Stone J.. Health care providers’ negative implicit attitudes and stereotypes of American Indians. J Racial Ethn Health Disparities. 2021;8:230-236. 10.1007/s40615-020-00776-w \[[DOI](https://doi.org/10.1007/s40615-020-00776-w)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32445056/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Racial%20Ethn%20Health%20Disparities&title=Health%20care%20providers%E2%80%99%20negative%20implicit%20attitudes%20and%20stereotypes%20of%20American%20Indians&volume=8&publication_year=2021&pages=230-236&pmid=32445056&doi=10.1007/s40615-020-00776-w&)\]
*   26. Liu Y, Ott M, Goyal N, et al. RoBERTa: a robustly optimized BERT pretraining approach. ArXiv190711692 Cs. Published online July 26, 2019. Accessed February 7, 2022. [http://arxiv.org/abs/1907.11692](http://arxiv.org/abs/1907.11692)
*   27.meta-llama/Meta-Llama-3-70B-Instruct · Hugging Face. April 18, 2024. Accessed July 22, 2024. [https://huggingface.co/meta-llama/Meta-Llama-3-70B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3-70B-Instruct)
*   28. Dettmers T, Pagnoni A, Holtzman A, Zettlemoyer L. QLoRA: efficient finetuning of quantized LLMs. Published online May 23, 2023. 10.48550/arXiv.2305.14314 \[[DOI](https://doi.org/10.48550/arXiv.2305.14314)\]
*   29. Nembrini S, König IR, Wright MN.. The revival of the Gini importance? Bioinformatics. 2018;34:3711-3718. 10.1093/bioinformatics/bty373 \[[DOI](https://doi.org/10.1093/bioinformatics/bty373)\] \[[PMC free article](/articles/PMC6198850/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/29757357/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Bioinformatics&title=The%20revival%20of%20the%20Gini%20importance?&volume=34&publication_year=2018&pages=3711-3718&pmid=29757357&doi=10.1093/bioinformatics/bty373&)\]
*   30.sklearn.linear\_model.LinearRegression. scikit-learn. Accessed January 9, 2024. [https://scikit-learn/stable/modules/generated/sklearn.linear\_model.LinearRegression.html](https://scikit-learn/stable/modules/generated/sklearn.linear_model.LinearRegression.html)
*   31.Feature importances with a forest of trees. scikit-learn. Accessed January 9, 2024. [https://scikit-learn/stable/auto\_examples/ensemble/plot\_forest\_importances.html](https://scikit-learn/stable/auto_examples/ensemble/plot_forest_importances.html)
*   32. Chen LY, Crum RM, Martins SS, Kaufmann CN, Strain EC, Mojtabai R.. Service use and barriers to mental health care among adults with major depression and comorbid substance dependence. Psychiatr Serv. 2013;64:863-870. 10.1176/appi.ps.201200289 \[[DOI](https://doi.org/10.1176/appi.ps.201200289)\] \[[PMC free article](/articles/PMC4049190/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/23728427/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Psychiatr%20Serv&title=Service%20use%20and%20barriers%20to%20mental%20health%20care%20among%20adults%20with%20major%20depression%20and%20comorbid%20substance%20dependence&volume=64&publication_year=2013&pages=863-870&pmid=23728427&doi=10.1176/appi.ps.201200289&)\]
*   33. Ross LE, Vigod S, Wishart J, et al. Barriers and facilitators to primary care for people with mental health and/or substance use issues: a qualitative study. BMC Fam Pract. 2015;16:135. 10.1186/s12875-015-0353-3 \[[DOI](https://doi.org/10.1186/s12875-015-0353-3)\] \[[PMC free article](/articles/PMC4604001/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26463083/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Fam%20Pract&title=Barriers%20and%20facilitators%20to%20primary%20care%20for%20people%20with%20mental%20health%20and/or%20substance%20use%20issues:%20a%20qualitative%20study&volume=16&publication_year=2015&pages=135&pmid=26463083&doi=10.1186/s12875-015-0353-3&)\]
*   34. Bremer W, Plaisance K, Walker D, et al. Barriers to opioid use disorder treatment: a comparison of self-reported information from social media with barriers found in literature. Front Public Health. 2023;11:1141093. 10.3389/fpubh.2023.1141093 \[[DOI](https://doi.org/10.3389/fpubh.2023.1141093)\] \[[PMC free article](/articles/PMC10158842/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37151596/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Front%20Public%20Health&title=Barriers%20to%20opioid%20use%20disorder%20treatment:%20a%20comparison%20of%20self-reported%20information%20from%20social%20media%20with%20barriers%20found%20in%20literature&volume=11&publication_year=2023&pages=1141093&pmid=37151596&doi=10.3389/fpubh.2023.1141093&)\]
*   35. Rodriguez JA, Clark CR, Bates DW.. Digital health equity as a necessity in the 21st century cures act era. JAMA. 2020;323:2381-2382. 10.1001/jama.2020.7858 \[[DOI](https://doi.org/10.1001/jama.2020.7858)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32463421/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=Digital%20health%20equity%20as%20a%20necessity%20in%20the%2021st%20century%20cures%20act%20era&volume=323&publication_year=2020&pages=2381-2382&pmid=32463421&doi=10.1001/jama.2020.7858&)\]
*   36. DesRoches CM. Healthcare in the new age of transparency. Semin Dial. 2020;33:533-538. 10.1111/sdi.12934 \[[DOI](https://doi.org/10.1111/sdi.12934)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33210371/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Semin%20Dial&title=Healthcare%20in%20the%20new%20age%20of%20transparency&volume=33&publication_year=2020&pages=533-538&pmid=33210371&doi=10.1111/sdi.12934&)\]
*   37. Smith RA. Language of the lost: an explication of stigma communication. Commun Theory. 2007;17:462-485. 10.1111/j.1468-2885.2007.00307.x \[[DOI](https://doi.org/10.1111/j.1468-2885.2007.00307.x)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Commun%20Theory&title=Language%20of%20the%20lost:%20an%20explication%20of%20stigma%20communication&volume=17&publication_year=2007&pages=462-485&doi=10.1111/j.1468-2885.2007.00307.x&)\]
*   38. Link BG, Phelan JC.. Stigma and its public health implications. Lancet. 2006;367:528-529. 10.1016/S0140-6736(06)68184-1 \[[DOI](https://doi.org/10.1016/S0140-6736\(06\)68184-1)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/16473129/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Lancet&title=Stigma%20and%20its%20public%20health%20implications&volume=367&publication_year=2006&pages=528-529&pmid=16473129&doi=10.1016/S0140-6736\(06\)68184-1&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae310\_Supplementary\_Data

[ocae310\_supplementary\_data.docx](/articles/instance/11756621/bin/ocae310_supplementary_data.docx) (399.7KB, docx)

### Data Availability Statement

Information on the MIMIC-III Clinical Dataset and how to access data is available here: [https://physionet.org/content/mimiciii/1.4/](https://physionet.org/content/mimiciii/1.4/)

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**