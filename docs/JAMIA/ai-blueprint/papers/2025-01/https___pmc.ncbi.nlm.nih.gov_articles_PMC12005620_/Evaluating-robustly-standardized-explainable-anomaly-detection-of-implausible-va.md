J Am Med Inform Assoc

. 2025 Jan 28;32(4):724–735. doi: [10.1093/jamia/ocaf011](https://doi.org/10.1093/jamia/ocaf011)

# Evaluating robustly standardized explainable anomaly detection of implausible variables in cancer data

[Philipp Röchner](https://pubmed.ncbi.nlm.nih.gov/?term="R%C3%B6chner%20P"[Author])

### Philipp Röchner, MSc

1 Information Systems and Business Administration, Johannes Gutenberg University, Mainz 55128, Germany

2 Cancer Registry Rhineland-Palatinate, Institute for Digital Health Data, Mainz 55116, Germany

Find articles by [Philipp Röchner](https://pubmed.ncbi.nlm.nih.gov/?term="R%C3%B6chner%20P"[Author])

1,2,✉, [Franz Rothlauf](https://pubmed.ncbi.nlm.nih.gov/?term="Rothlauf%20F"[Author])

### Franz Rothlauf, Prof. Dr

3 Information Systems and Business Administration, Johannes Gutenberg University, Mainz 55128, Germany

Find articles by [Franz Rothlauf](https://pubmed.ncbi.nlm.nih.gov/?term="Rothlauf%20F"[Author])

3

*   Author information
*   Article notes
*   Copyright and License information

1 Information Systems and Business Administration, Johannes Gutenberg University, Mainz 55128, Germany

2 Cancer Registry Rhineland-Palatinate, Institute for Digital Health Data, Mainz 55116, Germany

3 Information Systems and Business Administration, Johannes Gutenberg University, Mainz 55128, Germany

✉

Corresponding author: Philipp Röchner, MSc, Information Systems and Business Administration, Johannes Gutenberg University, Jakob-Welder-Weg 9, Mainz 55128, Germany (roechner@uni-mainz.de)

Received 2024 Jul 31; Revised 2024 Dec 20; Accepted 2025 Jan 15; Collection date 2025 Apr.

© The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC12005620  PMID: [39873664](https://pubmed.ncbi.nlm.nih.gov/39873664/)

## Abstract

### Objectives

Explanations help to understand why anomaly detection algorithms identify data as anomalous. This study evaluates whether _robustly standardized explanation scores_ correctly identify the implausible variables that make cancer data anomalous.

### Materials and Methods

The dataset analyzed consists of 18 587 truncated real-world cancer registry records containing 8 categorical variables describing patients diagnosed with bladder and lung tumors. We identified 800 anomalous records using an autoencoder’s per-record reconstruction error, which is a common neural network-based anomaly detection approach. For each variable of a record, we determined a _robust explanation score_, which indicates how anomalous the variable is. A variable’s robust explanation score is the autoencoder’s per-variable reconstruction error measured by cross-entropy and robustly standardized across records; that is, large reconstruction errors have a small effect on standardization. To evaluate the explanation scores, medical coders identified the implausible variables of the anomalous records. We then compare the explanation scores to the medical coders’ validation in a classification and ranking setting. As baselines, we identified anomalous variables using the raw autoencoder’s per-variable reconstruction error, the non-robustly standardized per-variable reconstruction error, the empirical frequency of implausible variables according to the medical coders’ validation, and random selection or ranking of variables.

### Results

When we sort the variables by their robust explanation scores, on average, the 2.37 highest-ranked variables contain all implausible variables. For the baselines, on average, the 2.84, 2.98, 3.27, and 4.91 highest-ranked variables contain all the variables that made a record implausible.

### Discussion

We found that explanations based on robust explanation scores were better than or as good as the baseline explanations examined in the classification and ranking settings. Due to the international standardization of cancer data coding, we expect our results to generalize to other cancer types and registries. As we anticipate different magnitudes of per-variable autoencoder reconstruction errors in data from other medical registries and domains, these may also benefit from robustly standardizing the reconstruction errors per variable. Future work could explore methods to identify subsets of anomalous variables, addressing whether individual variables or their combinations contribute to anomalies. This direction aims to improve the interpretability and utility of anomaly detection systems.

### Conclusions

Robust explanation scores can improve explanations for identifying implausible variables in cancer data.

**Keywords:** anomaly detection, outlier detection, data quality, cancer registration, machine learning, explainability, plausibility

## Introduction

### Verifying the plausibility of cancer data

Cancer registries collect a large amount of data from cancer patients. To be meaningfully analyzed, the data collected must be _plausible_. Plausible data are medically possible but do not have to describe reality correctly, which cancer registries have little ability to verify.[1](#ocaf011-B1)

Expert-defined rules typically automatically check the plausibility of cancer data.[2–5](#ocaf011-B2) These rules check the plausibility of a single variable or the plausibility of combinations of variables. For a single variable, such rules check whether categorical variables have predefined values or whether numerical variables are in a predefined range. For multiple variables, plausibility checks verify that the combination of values matches predefined combinations of values. In addition to identifying implausible records, these plausibility checks provide users with predefined error and warning messages that indicate which variable or combination of variables violates a particular rule.[6](#ocaf011-B6)

Although expert-defined validation checks work well for static records with a few variables, they are difficult to define and maintain for complex error patterns involving multiple variables in a dynamic database: First, the number of potential validations increases exponentially with the number of variables and values. As a result, experts often define validations for only a few variables: Martos et al[4](#ocaf011-B4) and Ferlay et al,[5](#ocaf011-B5) for example, mainly defined validations for single variables or the combination of 2 variables. Second, changes in medical coding require plausibility checks to be updated regularly while often still being able to process the old data format during a transition period. Third, as we expect cancer registries to collect more information per patient in the future, such as information for more personalized therapies, it will be necessary to define even more plausibility checks.

In addition to expert-defined and maintained plausibility checks, unsupervised anomaly detection can identify implausible cancer registry data without human guidance.[7](#ocaf011-B7) Unsupervised anomaly detection algorithms learn from the data to find rare observations that are different from most other observations.[8–10](#ocaf011-B8) Medical coders then validate the identified records. However, they often do not know why anomaly detection approaches, especially those using neural networks, identify certain records as anomalous.

### Explainable anomaly detection

_Explainable anomaly detection_,[11](#ocaf011-B11),[12](#ocaf011-B12) also called _anomaly localization_[13](#ocaf011-B13) or _outlier explanations_,[14](#ocaf011-B14) highlights anomalous variables in records identified as anomalous. Although medical coders typically validate variables of tumor data in their logical order, such as starting with tumor localization, explanations for anomalous tumor data could aid in validation by highlighting the variables that led to their selection as anomalies.

Explanations should correctly refer to the anomalous variables in anomalous records.[15](#ocaf011-B15) But evaluating explainable anomaly detection is challenging. First, there is no standard approach to evaluating explainable anomaly detection.[12](#ocaf011-B12) Often, explainable anomaly detection is evaluated by examining only a few examples,[16](#ocaf011-B16),[17](#ocaf011-B17) making it difficult to generalize the results to other data.[18](#ocaf011-B18) Second, users rarely evaluate explanations generated by machine learning approaches, such as explainable anomaly detection.[18](#ocaf011-B18) Third, we are unaware of publicly available real-world tabular medical datasets with categorical variables that can be used to evaluate explainable anomaly detection.

This article evaluates whether _robustly standardized explanations_ generated without human guidance correctly identify implausible variables in cancer data. We examine 18 587 truncated real-world records with 8 categorical variables from bladder and lung cancer patients. First, we identify 800 anomalous records using the per-record reconstruction error of an autoencoder. Autoencoders compress the records and then reconstruct them using neural networks so that, on average, the reconstructed records match the original records well. We consider records with a high reconstruction error to be anomalous (see “Background: Anomaly Score per Record” for more details on anomaly detection with autoencoders). Second, we generate explanations for the anomalous records using robust explanation scores, which are the autoencoder’s robustly standardized per-variable reconstruction errors; that is, large reconstruction errors have a small effect on standardization. Finally, medical coders review the anomalous records and flag implausible variables. To our knowledge, this is the first study to evaluate explainable anomaly detection for finding implausible variables in cancer data.

## Methods

### Background: anomaly score per record

We calculate _anomaly scores_ to detect anomalous records: high anomaly scores correspond to anomalous records; low anomaly scores correspond to normal records. As anomaly score, we choose the reconstruction error of an autoencoder because autoencoders are an established approach to detect anomalies[19](#ocaf011-B19) and can find implausible cancer data.[7](#ocaf011-B7) We computed the anomaly scores without the validation of the medical coders.

[Figure 1A](#ocaf011-F1) shows a schematic autoencoder. The idea of autoencoders for anomaly detection is that anomalies are harder to reconstruct than normal records: the autoencoder’s _encoder_ first compresses records with intentional information loss using a neural network; the autoencoder’s _decoder_, another neural network, then reconstructs the compressed records. The encoder and decoder learn from the provided records to reconstruct the records well on average. We consider records that are not reconstructed well as anomalies.

#### Figure 1.

[![Diagram of an autoencoder consisting of an encoder and a decoder visualizing the total and per-variable reconstruction error (subfigure A) and its robust standardization per variable (subfigure B).](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/52a3/12005620/b95fdd0e8068/ocaf011f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005620_ocaf011f1.jpg)

[Open in a new tab](figure/ocaf011-F1/)

First, we identify anomalous records using the per-record reconstruction error of an autoencoder (A). We then detect anomalous variables using the per-variable reconstruction errors of the autoencoder (A), which are robustly standardized (B). (A) Diagram of an autoencoder : The encoder compresses a record into a lower dimensional representation. The decoder reconstructs the compressed record. During training, the parameters of the encoder and decoder are iteratively adjusted to minimize the reconstruction error between the records and the reconstructed records . We then identify anomalous records based on the per-record reconstruction errors between the input records and the reconstructed records . For each anomalous record , anomalous variables are selected using the per-variable reconstruction error between the input variables and the reconstructed variables . (B) Robust standardization per variable of raw explanation scores in robust explanation scores as described by [eqn (2)](#E6).

Technically, an autoencoder is a neural network trained to reconstruct its inputs. The inputs of the autoencoder are the _N_ records with categorical variables that are one-hot encoded; that is, each record is a binary vector: for , where _d_ is the number of different one-hot encoded input values. During training, we iteratively updated the weights of the autoencoder by weights to minimize the average _reconstruction error_  between the input records and the reconstructed output records . The reconstruction error of a record for an autoencoder is

|  |
| --- |

where is the _binary cross-entropy_, that is,

|  |
| --- |

for 2 L-dimensional vectors and .[20](#ocaf011-B20) The autoencoder’s hyperparameters (see “Hyperparameters and Training the Autoencoder”) are chosen so that the autoencoder trained on the records cannot reconstruct all records perfectly, resulting in a positive reconstruction error for some records.

### Robust explanation scores per variable

To indicate how anomalous each variable of a record is, we calculate _explanation scores_ per variable: Higher explanation scores indicate more anomalous values; lower explanation scores indicate less anomalous values (see “Examples of Implausible Cancer Data” in the [Appendix S1](#sup1)).

Similar to identifying anomalous records by their reconstruction error, we use the per-variable reconstruction error to identify anomalous variables in a record (see [Figure 1A](#ocaf011-F1)).[12](#ocaf011-B12) For a record , we denote the one-hot encoded value of the _j_\-th variable by , where is the number of different one-hot encoded values of the _j_\-th variable, such that

|  |
| --- |

where _M_ is the number of variables. For the _j_\-th variable of the record , the _raw explanation score_  of the value is the reconstruction error between the input value and its reconstructed output value using the autoencoder , that is,

|  | (1) |
| --- | --- |

where is the value of the _j_\-th variable of the reconstructed record:

|  |
| --- |

The same autoencoder that detected the anomalous records also calculated the raw explanation scores for each variable.

The autoencoder reconstruction error for different variables can vary in magnitude (see [Figure 2](#ocaf011-F2)): For example, variables that contain random values unrelated to the other variables are difficult for autoencoders to reconstruct. Such random variables would have high reconstruction errors, indicating anomalous variables. But explanations pointing to random variables may be useless when reviewing records. Other variables may be easier to reconstruct, while a slightly larger reconstruction error may be critical.

#### Figure 2.

[![Boxplots showing raw (left subfigure), standardized (middle subfigure), and robust (right subfigure) reconstruction errors per variable.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/52a3/12005620/4e2746890782/ocaf011f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005620_ocaf011f2.jpg)

[Open in a new tab](figure/ocaf011-F2/)

Explanation score distributions per variable of the 800 anomalous records: The raw explanation scores **(left)** are dominated by high reconstruction errors for . The standardized explanation scores **(middle)**, which standardize the raw reconstruction errors per variable to zero mean and unit variance (see “Explanation Score Baselines”), are still dominated by high scores for . Moreover, the variable , which has few implausible values (see [Figure 4](#ocaf011-F4)), is the variable with the second highest standardized explanation scores. Robust explanation scores **(right)** have a similar scale across variables while emphasizing the variables with many implausibilities, such as .

We standardize the raw reconstruction error to have the same magnitude for each variable (see [Figure 1B](#ocaf011-F1)). Since some records typically have anomalous values and thus large reconstruction errors, causing the empirical distribution of raw reconstruction errors to be skewed toward large values (see [Figure 2](#ocaf011-F2)), we use robust estimates for standardization.[21](#ocaf011-B21) For the _j_\-th variable of the record , the _robust explanation score_  of the value is then

|  | (2) |
| --- | --- |

where is the median and the normalized median absolute deviation to the median (nMAD)[21](#ocaf011-B21) of the raw explanation scores

|  |
| --- |

of the _j_\-th variable over all records. Consequently, the robust explanation scores for the _j_\-th variable

|  |
| --- |

have a median of zero and a nMAD of one.

### Experimental design

Our experiments test the hypothesis that robust explanation scores improve the identification of implausible variables in cancer data compared to raw or standardized explanation scores (see “Explanation Score Baselines”).

We programmed our experiments in R, implemented the autoencoder using the package _TensorFlow_,[22](#ocaf011-B22) and evaluated the results using the package _mldr._[23](#ocaf011-B23) We provide a notebook with code that demonstrates our approach: [https://gitlab.rlp.net/proechne/robust-explainable-anomaly-detection](https://gitlab.rlp.net/proechne/robust-explainable-anomaly-detection).

[Figure 3](#ocaf011-F3) shows our experimental design: First, the autoencoder computed the reconstruction error of all 18 587 records (see “Dataset and Preprocessing”), and we selected the 800 records with the highest per-record reconstruction error as anomalies for review. We then generated explanations for the variables of the anomalous records based on the robust explanation scores. Afterward, the medical coders validated the anomalous records and flagged implausible variables (see “Medical Coders’ Validation”). As baselines, we generated explanations using the raw, standardized, and frequency explanation scores and randomly selected or ranked the variables (see Explanation Score Baselines). Finally, we compared the explanation scores with the implausible variables identified by the medical coders (see “Explanation Score Evaluation”).

##### Figure 3.

[![Flowchart visualizing the sequential steps of the experiments performed.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/52a3/12005620/522f3ddcc0c3/ocaf011f3.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005620_ocaf011f3.jpg)

[Open in a new tab](figure/ocaf011-F3/)

Approach for evaluating explanations pointing to anomalous variables in cancer data. First, we selected anomalous records using the per-record reconstruction error of an autoencoder. Next, we identified explanations for the anomalous records using the raw and (robustly) standardized autoencoder reconstruction error per variable. Medical coders then reviewed the plausibility of the anomalous records. Finally, we evaluated the explanation scores using the medical coders’ validation.

### Dataset and preprocessing

Healthcare professionals electronically collected our study data for the Cancer Registry Rhineland-Palatinate, Germany, which coded the records according to a national data format ([https://basisdatensatz.de/](https://basisdatensatz.de/)). The registry then performed rule-based plausibility checks, and medical coders validated the records as needed. The registry also developed the software for coding and plausibility checks according to international guidelines.[2–4](#ocaf011-B2) All records in our study passed quality control.

We analyzed truncated real-world cancer registry records of patients with bladder (  , malignant neoplasm of the bladder, and , carcinoma in situ of the bladder) and lung tumors (  , malignant neoplasm of the bronchus and lung) in Rhineland-Palatinate, Germany. We chose these 2 tumor types because they are medically very different, allowing us to evaluate anomaly explanations from different perspectives. The data cover diagnoses from January 1, 2019 to March 19, 2022.

[Table 1](#ocaf011-T1) shows the tumor type, sex, and age group distribution of all records. Each record examined contains medical categorical variables (see [Table 2](#ocaf011-T2)). For the missing values, we created a dedicated value to avoid excluding incomplete records.

#### Table 1.

Absolute (_n_) and relative (%) distribution of all and anomalous records by tumor type, sex, and age.

|  | All records |  | Anomalous records |  |
| --- | --- | --- | --- | --- |
|  | n | % | n | % |
| All | 18 587 | 100.0 | 800 | 100.0 |
| Tumor type |  |  |  |  |
| Lung | 10 656 | 57.3 | 456 | 57.0 |
| Bladder | 7931 | 42.7 | 344 | 43.0 |
| Sex |  |  |  |  |
| Male | 12 148 | 65.4 | 476 | 59.5 |
| Female | 6430 | 34.6 | 324 | 40.5 |
| Gender not reported | 9 | 0.0 | 0 | 0.0 |
| Age group (years) |  |  |  |  |
| (0,20\] | 10 | 0.1 | 1 | 0.1 |
| (20,40\] | 84 | 0.5 | 3 | 0.4 |
| (40,60\] | 3018 | 16.2 | 130 | 16.2 |
| (60,80\] | 11 743 | 63.2 | 480 | 60.0 |
| (80,100\] | 3729 | 20.1 | 185 | 23.1 |
| (100,120\] | 3 | 0.0 | 1 | 0.1 |
| Age (years) |  |  |  |  |
| Median |  | 70.4 |  | 70.8 |
| IQR |  | 15.4 |  | 16.4 |

[Open in a new tab](table/ocaf011-T1/)

Overall, the distributions are similar for the anomalous records and the entire dataset.

#### Table 2.

Medical variables of the studied records with description, number of unique values, and percentage of missing values.

|  |  |  |  | Most frequent value |  |  |
| --- | --- | --- | --- | --- | --- | --- |
| Variable | Description | Unique values (n) | Missing values (%) | Value | n | % |
| ICD-O-3 morphology | Cell type and behavior of tumor | 89 | 2.0 | 8140/3 | 4553 | 24.5 |
| TNM T | Size of tumor | 49 | 10.0 | a | 3587 | 19.3 |
| TNM N | Degree of spread to lymph nodes | 31 | 40.2 | 0 | 4967 | 26.7 |
| TNM M | Presence of distant metastases | 19 | 37.4 | 0 | 7468 | 40.2 |
| ICD-10 code | Classification of disease | 17 | 0.0 | C34.1 | 4321 | 23.2 |
| ICD-O-3 topography | Location of tumor | 16 | 0.0 | C67.9 | 4437 | 23.9 |
| TNM stage | Degree of tumor differentiation | 11 | 1.5 | 3 | 4689 | 25.2 |
| Laterality | Laterality of paired organs | 6 | 0.0 | T | 7590 | 40.8 |

[Open in a new tab](table/ocaf011-T2/)

We also show the most frequent value of each variable with the absolute number and percentage of occurrence. All variables are categorical and sorted by the number of unique values.

### Hyperparameters and training the autoencoder

Our autoencoder trained to reconstruct the studied records had 3 hidden layers with , and 4 nodes. As activation functions, we used rectified linear units for the hidden layers and sigmoid functions for the output layer. To regularize the autoencoder, we applied dropout, which randomly sets the hidden layer nodes to zero with a probability of 0.2. We trained the autoencoder using the Adam optimizer with a learning rate of 0.001 and batches of size 128 for 30 epochs. We analyze the autoencoder’s sensitivity to its hyperparameters in Sensitivity Analysis.

Because the autoencoder randomly initializes its parameters and randomly samples the mini-batches used to optimize them, the explanation scores generated by the autoencoder will vary as we train the autoencoder multiple times. To evaluate this variability in the autoencoder’s output, we train the autoencoder and generate explanation scores 10 times. We select anomalous records based on a single trained autoencoder.

In this study, we train and evaluate the autoencoder on the same dataset because we do not expect the autoencoder to generalize to unseen and unlabeled data, as it is common in supervised learning: Suppose we need to detect implausible variables in other data. In this case, we can train the autoencoder from scratch, using the new data as input and labels.

### Medical coders’ validation

Six medical coders validated 800 records by determining whether a variable was plausible or implausible, but they could not verify that the records accurately described reality. According to Weiskopf and Weng,[1](#ocaf011-B1) a record is plausible if every single value in the record and every combination of values could occur in reality. We selected 800 records for validation to balance the medical coders’ manual effort for validation while ensuring that the selected records represented the entire dataset concerning tumor type, sex, and age (see [Table 1](#ocaf011-T1)).

The 6 coders had at least 3 years of medical training and worked at the cancer registry, where they handled records with specific tumor localizations. We assigned the records to the coders as tables based on tumor localization. The coders could review the records and variables in any order. In the provided tables, we highlighted the variable with the highest raw reconstruction error (see “Robust Explanation Scores per Variable”); the tables did not include any other results from the anomaly detection algorithm. The medical coders marked implausible variables by selecting them from a drop-down list and could provide additional free text to describe the implausibilities if necessary.

Each record was reviewed once by one medical coder. Physicians provided validation guidelines to the medical coders before the validation to ensure a consistent and accurate review of the anomalous records. During validation, the medical coders had access to all patient information in the cancer registry in addition to the 8 variables used to detect anomalies. If the plausibility of a record required further clarification, the coders could contact other medical coders or physicians who specialized in tumor documentation.

[Table 3](#ocaf011-T3) shows 2 example records with 3 medical variables, their values, and the medical coders’ validation indicating whether the variable is implausible (first 2 rows of each record). [Tables SA1](#sup1) and [SA2](#sup1) show 2 additional implausible bladder and lung cancer records with the 8 medical variables examined.

#### Table 3.

Example records with robust explanation scores (row) per variable, where higher explanation scores correspond to more anomalous variables.

|  |  | Variables |  |  |
| --- | --- | --- | --- | --- |
|  | Threshold | ICD-10 code | ICD-O-3 topography | ICD-O-3 morphology |
| Record 1 |  |  |  |  |
| Medical value |  | C67.9 (bladder, unspecified) | C67.9 (bladder, unspecified) | 8441/3 (serous cystadenocarcinoma, unspecified) |
| Coders’ validation |  | Plausible | Plausible | Implausible |
| Explanation score |  | 0.01 | −1.14 | 14.51 |
| Classification |  | Anomalous | Anomalous | Anomalous |
|  | and | Anomalous | Normal | Anomalous |
|  | and | Normal | Normal | Anomalous |
|  |  | Normal | Normal | Normal |
| Ranking |  | 2 | 3 | 1 |
| Record 2 |  |  |  |  |
| Medical value |  | C67.9 (bladder, unspecified) | C67.9 (bladder, unspecified) | 8120/3 (transitional cell carcinoma, unspecified) |
| Coders’ validation |  | Plausible | Plausible | Plausible |
| Explanation score |  | 0.68 | −0.02 | 0.34 |
| Classification |  | Anomalous | Anomalous | Anomalous |
|  | and | Anomalous | Normal | Anomalous |
|  | and | Anomalous | Normal | Normal |
|  |  | Normal | Normal | Normal |
| Ranking |  | 1 | 3 | 2 |

[Open in a new tab](table/ocaf011-T3/)

Every single value in both records and every combination of values in the second record is plausible. For the first record, the combination of and   (bladder, unspecified) is plausible, but the combination of and with an  (serous cystadenocarcinoma, unspecified) is implausible because is associated with ovarian cancer (); this is captured by the higher explanation score for the of the first record. The classification and ranking rows illustrate how we converted the explanation scores into explanations (see “Explanation Score Evaluation”). In the classification setting, the number of variables identified as normal increases with a higher explanation score threshold (column _threshold_).

The coders’ validation may be unclear because we can interchange the labels for plausible and implausible variables. For example, the first record in [Table 3](#ocaf011-T3) may have implausible and instead of implausible . When multiple combinations of variables described the implausibilities of a record, we chose the combination with the fewest variables.

[Figure 4](#ocaf011-F4) shows the implausibilities identified by the medical coders: Of the 800 records reviewed, 412 were plausible, 388 were implausible, with 498 implausible variables. The variable had the most implausibilities with 160, followed by with 127 and with 61 implausibilities. Records had up to 3 implausible variables, and certain combinations occurred: for example, 32 records had an implausible and .

#### Figure 4.

[![Combined barplot showing the number of implausibilities per variable (left) and the combination of implausibilities (bottom right) with their number of occurrences (top).](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/52a3/12005620/b5550f493ffa/ocaf011f4.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005620_ocaf011f4.jpg)

[Open in a new tab](figure/ocaf011-F4/)

Implausible variables found by medical coders: The horizontal bars on the left show the number of implausibilities per variable; the connected dots on the lower right show the combinations of implausibilities per record; and the vertical bars at the top show their number of occurrences. The variable is most often implausible (160 times). Implausible and implausible is the combination of implausible variables that occurs most often (32 times).

### Explanation score baselines

#### Raw explanation scores

As a baseline, we take the raw explanation scores as described in [eqn (1)](#E4).

#### Standardized explanation scores

Similar to the robust explanation scores in [eqn (2)](#E6) using the median and nMAD, we standardize the raw explanation scores using the mean and standard deviation to obtain _standardized explanation scores_ as a baseline.

#### Frequency explanation scores

The frequency explanation scores are motivated by the review approach of experienced medical coders, who prioritize their review of variables based on how often a variable was implausible in the past. Therefore, we determine the empirical relative frequency of each variable being implausible.

For a record , the _frequency explanation score_  of its _j_\-th variable with value is the proportion of records in which the _j_\-th variable is implausible out of all records reviewed, that is,

|  |
| --- |

The frequency explanation scores are independent of the individual record and depend only on the variables. For example, because 160 of the 800 records reviewed had an implausible (see [Figure 4](#ocaf011-F4)), the variable has a frequency explanation score for all records.

Because medical coders have not previously validated the tumor data, we can only generate frequency explanation scores after their validation.

#### Random baselines

As additional baselines, we have included the _random classification_ of variables, where normal and anomalous have equal probability, and the _random ranking_ of variables, where each rank and each variable have the same probability.

We compute the raw, standardized, and robust explanation scores without the guidance of medical coders.

### Explanation score evaluation

We evaluate the quality of the explanation scores in a classification and ranking setting.

#### Classification evaluation

Because each of a record’s variables can be either plausible or implausible, we study the identification of implausible variables as a binary classification task with the 2 classes _normal_ and _anomalous_. To transform the continuous explanation scores into classes, we use a threshold and identify all variables of a record with explanation scores above a certain threshold as anomalous. Cancer registries can then highlight anomalous variables during validation by medical coders (see [Tables SA1a](#sup1) and [SA2a](#sup1)).

Technically, for a record , any variable with an explanation score higher than the explanation score threshold _t_ gets the class anomalous, that is,

|  |
| --- |

The higher the explanation score threshold _t_, the more variables we classify as normal.

[Table 3](#ocaf011-T3) shows the robust explanation scores (row) and explanations (row _classification_) for the 2 example records depending on the explanation score threshold (column). For a threshold of 10, for example, the variable of the first record is classified as anomalous; the variables and of the first and all variables of the second record are classified as normal.

We evaluate the explanations in the classification setting using recall, precision, and score per record, averaged over all records examined.[24](#ocaf011-B24) For the 3 measures, higher values are better.

#### Ranking evaluation

In the ranking setting, we rank the record’s variables according to the explanation scores. Registries can then highlight the variables using a descending color map, such as from dark red for high-ranked variables to light red for low-ranked variables (see [Tables SA1b](#sup1) and [SA2b](#sup1)).

We assign the average rank to variables with identical explanation scores. Formally, for a record , each variable with explanation score then has rank , where

|  |
| --- |

The larger a variable’s explanation score, the higher the rank and the more anomalous it is. For the first record in [Table 3](#ocaf011-T3), the highest ranked (row _ranking_) and most anomalous variable (row _explanation score_) is followed by and .

Since we want to find all implausible variables in a record, not just, for example, the first implausible variable, we choose _coverage_ to evaluate the explanations, which considers the ranking of all implausible variables. Coverage measures how often, on average, a coder would have to move from one variable to the next to find all implausible variables in a record when going down the list of variables ranked by explanation scores.[24](#ocaf011-B24) Consequently, the number of highest-ranked variables that contain all implausible variables is coverage plus one. Formally, the coverage of the records with the variables of each record ranked by explanation scores is

|  |
| --- |

Better rankings have lower coverage. For example, the first record in [Table 3](#ocaf011-T3) has one implausible variable with rank one (row _ranking_): the coverage of this ranking is zero.

## Results

In “Performance to Detect Implausible Records” in the [Appendix S1](#sup1), we investigate the performance of the autoencoder in detecting implausible records. Furthermore, we compared the performance of an autoencoder with the anomaly detection method FPOF[25](#ocaf011-B25) to identify implausible records in a previous study.[7](#ocaf011-B7) There, we also performed a false negative analysis using a manually validated random sample.

### Classification results

#### Which explanation scores classify the implausible variables better?

First, we examine the quality of the explanations in the classification setting. The explanation score threshold determines which and how many variables per record we classify as anomalous. Therefore, [Figure 5](#ocaf011-F5) shows the recall (A), precision (B), and score (C) of the selected explanations depending on the average number of variables per record classified as anomalous.

##### Figure 5.

[![Three line plots showing the recall (left subplot), precision (middle subplot), and F1 score (right subplot) as a function of the average number of variables per record classified as anomalous for the five explanation score approaches.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/52a3/12005620/101ce547b7a0/ocaf011f5.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005620_ocaf011f5.jpg)

[Open in a new tab](figure/ocaf011-F5/)

Recall **(A)**, precision **(B)**, and  score **(C)** as a function of the average number of variables per record that were classified as anomalous. We report the mean (line) and standard deviation (area) over the 10 runs. For each run, we compute the measures for each record and report the average over all 800 anomalous records. Explanations using the robust explanation scores perform more consistently well than those using the other explanation scores. In contrast, explanations using the raw explanation score can perform worse than those using the frequency explanation scores.

For more than 3 variables per record classified as anomalous, the explanations using the raw explanation scores are equal to or worse than those using the frequency explanation scores for all measures examined. For all numbers of variables classified as anomalous and all 3 measures, the explanations using the robust explanation scores are better than or equal to the explanations using the other explanation scores. For example, for an average of 3 explanations, the recall of the frequency, raw, and standardized explanation scores is 0.33, 0.31, and 0.39 and their precision is 0.15, 0.14, and 0.18, respectively. The recall increases to 0.43 and the precision to 0.19 when using robust explanation scores.

### Ranking results

#### Which explanation scores rank the implausible variables better?

Next, we examine the quality of the variables ranked by the explanation scores. [Table 4](#ocaf011-T4) shows the coverage of the explanation score approaches (left) for all implausible records (top) and records with 1, 2, or 3 implausible variables out of all implausible records (middle) and the corresponding absolute and relative number of records (right).

##### Table 4.

Coverage for all implausible records **(top)**, for records with a given number of implausible variables **(middle)**, and for records with a given implausible variable **(bottom)**.

|  | Coverage () of explanation scores (meanstandard deviation) |  |  |  |  | Number of records |  |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  | Robust | Standardized | Raw | Frequency | Random | n | % |
| All implausible records | 1.37 0.06 | 1.840.06 | 2.270.05 | 1.980 | 3.910.09 | 388 | 100.0 |
| n implausible variables |  |  |  |  |  |  |  |
| 1 | 0.87 0.07 | 1.350.05 | 1.50.06 | 1.660 | 3.490.1 | 293 | 75.5 |
| 2 | 2.63 0.07 | 3.050.11 | 4.40.05 | 2.840 | 5.110.2 | 80 | 20.6 |
| 3 | 4.360.06 | 4.960.11 | 5.870.06 | 3.67 0 | 5.720.27 | 15 | 3.9 |
| Given implausible variable |  |  |  |  |  |  |  |
| TNM stage | 1.410.18 | 2.540.14 | 1.930.04 | 0.62 0 | 4.110.16 | 160 | 41.2 |
| TNM M | 1.510.08 | 2.120.07 | 3.180.07 | 1.43 0 | 4.290.15 | 127 | 32.7 |
| ICD-O-3 morphology | 2.3 0.11 | 2.620.11 | 6.070.07 | 2.310 | 4.510.22 | 61 | 15.7 |
| Laterality | 0.950.14 | 0.610.02 | 0.43 0.04 | 3.10 | 3.590.2 | 56 | 14.4 |
| TNM T | 2.220.03 | 2.15 0.04 | 3.420.23 | 4.140 | 4.080.4 | 38 | 9.8 |
| ICD-10 code | 3.560.11 | 3.080.11 | 2.94 0.09 | 5.950 | 4.760.36 | 22 | 5.7 |
| ICD-O-3 topography | 3.680.09 | 3.270.07 | 3.05 0.18 | 6.50 | 5.050.43 | 17 | 4.4 |
| TNM N | 2.240.16 | 1.82 0.04 | 3.190.12 | 6.50 | 4.220.4 | 17 | 4.4 |

[Open in a new tab](table/ocaf011-T4/)

We report the meanstandard deviation over 10 runs. We also show the absolute (_n_) and relative (%) number of records with a given number of implausible variables or a given implausible variable **(right)**. In bold, we highlighted the best coverage values per explanation score method (row) and sorted the rows by the number of records. Overall, the robust explanation scores rank the implausible variables better than the other approaches.

When we rank the variables of all implausible records by the robust explanation scores, all implausibilities are, on average, in the 2.37 highest-ranked variables, which increases to 2.84 for the standardized, 3.27 for the raw, and 2.98 for the frequency explanation scores.

We tested the statistical significance of the results using a pairwise Wilcoxon signed-rank test[26](#ocaf011-B26) with Holm correction[27](#ocaf011-B27) under the null hypothesis that the average coverage over the 800 anomalous records of 2 explanation score approaches is from the same distribution.[28](#ocaf011-B28),[29](#ocaf011-B29) Given a significance level of 0.05 and the coverage values for the 10 runs, we could reject the null hypothesis for all pairwise comparisons of explanation score approaches.

#### Does the quality of the explanations depend on the record’s anomaly score?

Since the 800 records reviewed are anomalous to varying degrees, as measured by their anomaly scores, we examine the quality of the ranked explanations depending on their anomaly scores. [Figure 6](#ocaf011-F6) shows coverage depending on the number of records selected, where we first selected records with a high anomaly score. A higher anomaly score corresponds to more anomalous records.

##### Figure 6.

[![Line plot showing the coverage as a function of the number of anomalous records selected for the five explanation score approaches.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/52a3/12005620/542892be2bc8/ocaf011f6.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005620_ocaf011f6.jpg)

[Open in a new tab](figure/ocaf011-F6/)

Coverage as a function of the number of anomalous records selected: We first selected records with a high anomaly score, corresponding to more anomalous records. We report the mean (line) and standard deviation (area) of the coverage over 10 runs. The robust explanation scores rank the implausible variables better than the other explanation scores for almost all numbers of selected records. Only for less than 200 selected records the robust and standardized explanation scores are similarly good. As the number of selected records increases, the coverage of the explanations ranked by the standardized and frequency explanation scores becomes more similar.

For example, suppose the explanation scores rank the variables of the 200 records with the highest anomaly scores. For the raw and standardized explanation scores, all implausibilities are, on average, in the 2.23 and 1.86 highest ranked variables, respectively; this decreases to 1.77 using the robust explanation scores. As the number of selected records increases, the coverage of the explanations ranked by the standardized and frequency explanation scores becomes more similar.

## Discussion

### Principal findings

This study evaluates the quality of explanations generated by an autoencoder’s robustly standardized per-variable reconstruction error. The explanations point to anomalous variables in cancer data and answer why an anomaly detection algorithm assessed records as anomalous.

Our results in the classification setting suggest that explanations using the robust explanation scores perform more consistently well than those using other explanation scores. In the ranking setting, we also observed that the robust explanation scores ranked the implausible variables better overall than the other explanation scores. In particular, when we select less than 800 anomalies for review, the robust explanation scores rank the implausible variables better than the other explanation scores for almost all numbers of selected records.

In summary, we found that explanations based on robust explanation scores were better than or as good as the baseline explanations examined. Thus, our results support our hypothesis that robust explanation scores can improve the identification of implausible variables in cancer data compared to raw or standardized explanation scores. Consequently, we recommend using the robustly standardized reconstruction error to detect implausible variables in cancer data.

### Limitations

A single medical coder reviewed each anomalous record in our experiments to reduce the manual validation effort. Consequently, we cannot measure inter-annotator agreement among coders. To reduce validation variability, we provided validation guidelines and gave coders the possibility to consult with other coders or physicians who specialize in tumor documentation, as described in “Medical Coders’ Validation.”

A single cancer registry provided the dataset that contains records of bladder and lung tumor patients. Our experiments did not evaluate whether our results generalize to other cancer types, cancer registries, medical registries, or domains. Because we observed our results in records of patients with bladder and lung cancer, which are medically quite different, we assume that our results also apply to other cancer types. In addition, because the coding of cancer registry data is highly standardized internationally, we anticipate similar results for data from other cancer registries. Finally, as we expect different magnitudes of per-variable autoencoder reconstruction errors (see [Figure 2](#ocaf011-F2)) in data from other medical registries and domains, these could also benefit from robustly standardizing the reconstruction errors per variable.

In the examined dataset of 18 587 records, we evaluated the explanations for the 800 most anomalous records, corresponding to approximately 4.3%. We expect similar results to our study when reviewing a comparable fraction of records from a larger dataset. When evaluating a larger fraction of anomalous records, further investigation is required.

### Future work

If there are explanations for multiple variables in a record, it is unclear whether each variable or the combination of variables is anomalous. For example, if we select and as explanations for the first record in [Table 3](#ocaf011-T3), medical coders may wonder whether alone and alone are anomalous; or whether the combination of and is anomalous. To clarify whether individual variables or combinations of variables are anomalous, one can select anomalous subsets of variables where the combination of variables is anomalous, such as , which indicates that the combination of and is anomalous.[30–32](#ocaf011-B30) In future work, we plan to investigate methods for finding subsets of anomalous variables in medical data.

## Conclusion

This study evaluates explanations that point to anomalous variables in truncated cancer registry records and answers why an anomaly detection algorithm considers a record anomalous. We find that robustly standardizing an autoencoder’s reconstruction error can improve explanations for anomalous variables compared to the baseline explanations studied. When we rank a record’s variables by an autoencoder’s robustly standardized reconstruction error, all implausibilities were, on average, in the 2.37 highest-ranked variables, which is lower than 2.84, 2.98, 3.27, and 4.91 for the baselines examined. Better explanations that point to anomalous variables could help to review cancer data.

## Supplementary Material

ocaf011\_Supplementary\_Data

[ocaf011\_supplementary\_data.pdf](/articles/instance/12005620/bin/ocaf011_supplementary_data.pdf) (276.8KB, pdf)

## Acknowledgments

We thank the Cancer Registry Rhineland-Palatinate in the Institute for Digital Health Data for providing the data for this study and the participating medical coders for reviewing the anomalous records.

## Contributor Information

Philipp Röchner, Information Systems and Business Administration, Johannes Gutenberg University, Mainz 55128, Germany; Cancer Registry Rhineland-Palatinate, Institute for Digital Health Data, Mainz 55116, Germany.

Franz Rothlauf, Information Systems and Business Administration, Johannes Gutenberg University, Mainz 55128, Germany.

## Author contributions

Philipp Röchner processed, analyzed, and interpreted the data. Both the authors drafted, revised, read, and approved the article for publication.

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

This study was partially funded by the German Federal Ministry of Health (Bundesministerium für Gesundheit) as part of the project Merging and Validating Cancer Registry Data using AI Methods (Zusammenführen und Validieren von Krebsregisterdaten durch KI-Verfahren).

## Conflicts of interest

The authors declare that they have no competing interests.

## Data availability

The data supporting the results of this study are available from the authors upon reasonable request and with the permission of the Cancer Registry Rhineland-Palatinate in the Institute for Digital Health Data.

## Generative AI and AI-assisted technologies in the writing process

While preparing this work, the authors checked spelling and grammar with Grammarly and DeepL Write. After using these services, the authors reviewed and edited the content as needed and take full responsibility for the content of the publication.

## Ethics approval and consent to participate

The Joint Ethics Committee of the Faculty of Economics and Business Administration of the Goethe University Frankfurt and the Johannes Gutenberg University Mainz has found the research project is ethically unobjectionable. The consent to participate is based on the German Cancer Early Detection and Registry Act (Krebsfrüherkennungs- und -registergesetz, § 65c Sozialgesetzbuch V) and its regional implementation (Landeskrebsregistergesetz). The Cancer Registry Rhineland-Palatinate at the Institute for Digital Health Data (IDG Institut für digitale Gesundheitsdaten RLP gGmbH Geschäftsbereich Krebsregister) has granted administrative access to anonymized patient data.

## References

*   1. Weiskopf NG, Weng C.  Methods and dimensions of electronic health record data quality assessment: enabling reuse for clinical research. J. Am. Medical Informatics Assoc. 2013;20:144-151. \[[DOI](https://doi.org/10.1136/amiajnl-2011-000681)\] \[[PMC free article](/articles/PMC3555312/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/22733976/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J.%20Am.%20Medical%20Informatics%20Assoc&title=Methods%20and%20dimensions%20of%20electronic%20health%20record%20data%20quality%20assessment:%20enabling%20reuse%20for%20clinical%20research&volume=20&publication_year=2013&pages=144-151&pmid=22733976&doi=10.1136/amiajnl-2011-000681&)\]
*   2. Martos C, Crocetti E, Visser O, Rous B, Giusti F, et al. A proposal on cancer data quality checks: one common procedure for European cancer registries. Publications Office of the European Union, Luxembourg; 2014.
*   3. Martos JMDC, Crocetti E, Visser O, Rous B, Giusti F, et al. A proposal on cancer data quality checks: one common procedure for European cancer registries (version 1.1). Publications Office of the European Union, Luxembourg; 2018.
*   4. Martos C, Giusti F, Van Eycken E, Visser O. A common data quality check procedure for European cancer registries. JRC132486, European Commission, Ispra, Italy; 2023.
*   5. Ferlay J, Burkhard C, Whelan S, Parkin DM. Check and conversion programs check and conversion programs. IARC Technical Report; 2005.
*   6. Giusti F, Martos C, Adriani S, et al.  The Joint Research Centre–European Network of Cancer Registries Quality Check Software (JRC-ENCR QCS). Front Oncol. 2023;13:1250195. \[[DOI](https://doi.org/10.3389/fonc.2023.1250195)\] \[[PMC free article](/articles/PMC10641391/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37965471/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Front%20Oncol&title=The%20Joint%20Research%20Centre%E2%80%93European%20Network%20of%20Cancer%20Registries%20Quality%20Check%20Software%20\(JRC-ENCR%20QCS\)&volume=13&publication_year=2023&pages=1250195&pmid=37965471&doi=10.3389/fonc.2023.1250195&)\]
*   7. Röchner P, Rothlauf F.  Unsupervised anomaly detection of implausible electronic health records: a real-world evaluation in cancer registries. BMC Med Res Methodol. 2023;23:125. \[[DOI](https://doi.org/10.1186/s12874-023-01946-0)\] \[[PMC free article](/articles/PMC10207857/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37226114/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Res%20Methodol&title=Unsupervised%20anomaly%20detection%20of%20implausible%20electronic%20health%20records:%20a%20real-world%20evaluation%20in%20cancer%20registries&volume=23&publication_year=2023&pages=125&pmid=37226114&doi=10.1186/s12874-023-01946-0&)\]
*   8. Hawkins DM.  Identification of Outliers. Monographs on Applied Probability and Statistics. Springer; 1980. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Identification%20of%20Outliers.%20Monographs%20on%20Applied%20Probability%20and%20Statistics&publication_year=1980&)\]
*   9. Chandola V, Banerjee A, Kumar V.  Anomaly detection: a survey. ACM Comput Surv. 2009;41:1-58. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=ACM%20Comput%20Surv&title=Anomaly%20detection:%20a%20survey&volume=41&publication_year=2009&pages=1-58&)\]
*   10. Ruff L, Kauffmann JR, Vandermeulen RA, et al.  A unifying review of deep and shallow anomaly detection. Proc IEEE. 2021;109:756-795. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Proc%20IEEE&title=A%20unifying%20review%20of%20deep%20and%20shallow%20anomaly%20detection&volume=109&publication_year=2021&pages=756-795&)\]
*   11. Yepmo V, Smits G, Pivert O.  Anomaly explanation: a review. Data Knowl Eng. 2022;137:101946. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Data%20Knowl%20Eng&title=Anomaly%20explanation:%20a%20review&volume=137&publication_year=2022&pages=101946&)\]
*   12. Li Z, Zhu Y, van Leeuwen M.  A survey on explainable anomaly detection. ACM Trans Knowl Discov Data. 2024;18:1-54. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=ACM%20Trans%20Knowl%20Discov%20Data&title=A%20survey%20on%20explainable%20anomaly%20detection&volume=18&publication_year=2024&pages=1-54&)\]
*   13. Tao X, Gong X, Zhang X, Yan S, Adak C.  Deep learning for unsupervised anomaly localization in industrial images: a survey. IEEE Trans Instrum Meas. 2022;71:1-21. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=IEEE%20Trans%20Instrum%20Meas&title=Deep%20learning%20for%20unsupervised%20anomaly%20localization%20in%20industrial%20images:%20a%20survey&volume=71&publication_year=2022&pages=1-21&)\]
*   14. Panjei E, Gruenwald L, Leal E, Nguyen C, Silvia S.  A survey on outlier explanations. VLDB J. 2022;31:977-1008. \[[DOI](https://doi.org/10.1007/s00778-021-00721-1)\] \[[PMC free article](/articles/PMC8789379/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35095253/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=VLDB%20J&title=A%20survey%20on%20outlier%20explanations&volume=31&publication_year=2022&pages=977-1008&pmid=35095253&doi=10.1007/s00778-021-00721-1&)\]
*   15. Silva W, Fernandes K, Cardoso MJ, Cardoso JS.  Towards complementary explanations using deep neural networks. In: Stoyanov D, Taylor Z, Mostafa Kia S, et al., eds. MLCN/DLF/iMIMIC@MICCAI, Lecture Notes in Computer Science, Vol. 11038. Springer; 2018:133-140. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=MLCN/DLF/iMIMIC@MICCAI,%20Lecture%20Notes%20in%20Computer%20Science&publication_year=2018&)\]
*   16. Baehrens D, Schroeter T, Harmeling S, Kawanabe M, Hansen K, Müller K-R.  How to explain individual classification decisions. J Mach Learn Res  2010;11:1803-1831. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Mach%20Learn%20Res&title=How%20to%20explain%20individual%20classification%20decisions&volume=11&publication_year=2010&pages=1803-1831&)\]
*   17. Dang X-H, Micenková B, Assent I, Ng RT.  Local outlier detection with interpretation. In: Blockeel H, Kersting K, Nijssen S, Zelezný F, eds. ECML/PKDD (3), Lecture Notes in Computer Science, Vol. 8190. Springer; 2013:304-320. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=ECML/PKDD%20\(3\),%20Lecture%20Notes%20in%20Computer%20Science&publication_year=2013&)\]
*   18. Nauta M, Trienes J, Pathak S, et al.  From anecdotal evidence to quantitative evaluation methods: a systematic review on evaluating explainable AI. ACM Comput Surv. 2023;55:1-42. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=ACM%20Comput%20Surv&title=From%20anecdotal%20evidence%20to%20quantitative%20evaluation%20methods:%20a%20systematic%20review%20on%20evaluating%20explainable%20AI&volume=55&publication_year=2023&pages=1-42&)\]
*   19. Sakurada M, Yairi T. Anomaly detection using autoencoders with nonlinear dimensionality reduction. In: Rahman A, Deng J, Li J, eds. _MLSDA@PRICAI_. ACM, 2014:4.
*   20. Bishop CM, Bishop H.  Deep Learning – Foundations and Concepts. Springer; 2024. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Deep%20Learning%20%E2%80%93%20Foundations%20and%20Concepts&publication_year=2024&)\]
*   21. Maronna RA, Martin RD, Yohai VJ, Salibián-Barrera M.  Robust Statistics: Theory and Methods (with R). John Wiley & Sons; 2019. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Robust%20Statistics:%20Theory%20and%20Methods%20\(with%20R\)&publication_year=2019&)\]
*   22. Allaire JJ, Tang Y.  _tensorflow: R Interface to ‘TensorFlow’_. R package version 2.14.0; 2023. Accessed December 10, 2024. [https://CRAN.R-project.org/package=tensorflow](https://CRAN.R-project.org/package=tensorflow)
*   23. Charte F, Charte D.  Working with multilabel datasets in R: the mldr package. R J. 2015;7:149. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=R%20J&title=Working%20with%20multilabel%20datasets%20in%20R:%20the%20mldr%20package&volume=7&publication_year=2015&pages=149&)\]
*   24. Tsoumakas G, Katakis I, Vlahavas IP.  Mining multi-label data. In: Maimon O, Rokach L, eds. Data Mining and Knowledge Discovery Handbook. Springer; 2010:667-685. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Data%20Mining%20and%20Knowledge%20Discovery%20Handbook&publication_year=2010&)\]
*   25. He Z, Xu X, Huang JZ, Deng S.  FP-outlier: frequent pattern based outlier detection. ComSIS. 2005;2:103-118. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=ComSIS&title=FP-outlier:%20frequent%20pattern%20based%20outlier%20detection&volume=2&publication_year=2005&pages=103-118&)\]
*   26. Wilcoxon F.  Individual comparisons by ranking methods. Biometrics. 1945;1:80-83. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Biometrics&title=Individual%20comparisons%20by%20ranking%20methods&volume=1&publication_year=1945&pages=80-83&)\]
*   27. Holm S.  A simple sequentially rejective multiple test procedure. Scand J Stat. 1979;6:65-70. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Scand%20J%20Stat&title=A%20simple%20sequentially%20rejective%20multiple%20test%20procedure&volume=6&publication_year=1979&pages=65-70&)\]
*   28. Demsar J.  Statistical comparisons of classifiers over multiple data sets. J Mach Learn Res  2006;7:1-30. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Mach%20Learn%20Res&title=Statistical%20comparisons%20of%20classifiers%20over%20multiple%20data%20sets&volume=7&publication_year=2006&pages=1-30&)\]
*   29. Benavoli A, Corani G, Mangili F.  Should we really use post-hoc tests based on mean-ranks?  J Mach Learn Res  2016;17:5:1-5:10. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Mach%20Learn%20Res&title=Should%20we%20really%20use%20post-hoc%20tests%20based%20on%20mean-ranks?&volume=17&publication_year=2016&pages=5:1-5:10&)\]
*   30. Micenková B, Ng RT, Dang X-H, Assent I.  Explaining outliers by subspace separability. In: Xiong H, Karypis G, Thuraisingham B, Cook D, Wu X, eds. ICDM. IEEE Computer Society; 2013:518-527. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=ICDM&publication_year=2013&)\]
*   31. Kriegel H-P, Kröger P, Schubert E, Zimek A.  Outlier detection in axis-parallel subspaces of high dimensional data. In: Theeramunkong T, Kijsirikul B, Cercone N, Ho T, eds. PAKDD, Lecture Notes in Computer Science, Vol. 5476. Springer; 2009:831-838. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=PAKDD,%20Lecture%20Notes%20in%20Computer%20Science&publication_year=2009&)\]
*   32. Kriegel H-P, Kröger P, Schubert E, Zimek A.  Outlier detection in arbitrarily oriented subspaces In: Zaki M, Siebes A, Yu J, Goethals B, Webb G, Wu X, eds. ICDM. IEEE Computer Society; 2012:379-388. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=ICDM&publication_year=2012&)\]
*   33. Brierley JD, Gospodarowicz MK, Wittekind C.  TNM Classification of Malignant Tumours. John Wiley & Sons; 2017. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=TNM%20Classification%20of%20Malignant%20Tumours&publication_year=2017&)\]
*   34. Detterbeck FC.  The eighth edition TNM stage classification for lung cancer: what does it mean on main street?  J Thorac Cardiovasc Surg. 2018;155:356-359. \[[DOI](https://doi.org/10.1016/j.jtcvs.2017.08.138)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/29061464/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Thorac%20Cardiovasc%20Surg&title=The%20eighth%20edition%20TNM%20stage%20classification%20for%20lung%20cancer:%20what%20does%20it%20mean%20on%20main%20street?&volume=155&publication_year=2018&pages=356-359&pmid=29061464&doi=10.1016/j.jtcvs.2017.08.138&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocaf011\_Supplementary\_Data

[ocaf011\_supplementary\_data.pdf](/articles/instance/12005620/bin/ocaf011_supplementary_data.pdf) (276.8KB, pdf)

### Data Availability Statement

The data supporting the results of this study are available from the authors upon reasonable request and with the permission of the Cancer Registry Rhineland-Palatinate in the Institute for Digital Health Data.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**