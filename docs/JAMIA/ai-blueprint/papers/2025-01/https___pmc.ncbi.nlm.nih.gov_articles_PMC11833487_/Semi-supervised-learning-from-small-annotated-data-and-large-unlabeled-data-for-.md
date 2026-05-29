J Am Med Inform Assoc

. 2025 Jan 17;32(3):555–565. doi: [10.1093/jamia/ocae326](https://doi.org/10.1093/jamia/ocae326)

# Semi-supervised learning from small annotated data and large unlabeled data for fine-grained Participants, Intervention, Comparison, and Outcomes entity recognition

[Fangyi Chen](https://pubmed.ncbi.nlm.nih.gov/?term="Chen%20F"[Author])

### Fangyi Chen, MS

1 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

Conceptualization, Data curation, Formal analysis, Investigation, Methodology, Software, Validation, Visualization

Find articles by [Fangyi Chen](https://pubmed.ncbi.nlm.nih.gov/?term="Chen%20F"[Author])

1,#, [Gongbo Zhang](https://pubmed.ncbi.nlm.nih.gov/?term="Zhang%20G"[Author])

### Gongbo Zhang, PhD

2 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

Conceptualization, Data curation, Formal analysis, Investigation, Methodology, Software, Validation, Visualization

Find articles by [Gongbo Zhang](https://pubmed.ncbi.nlm.nih.gov/?term="Zhang%20G"[Author])

2,#, [Yilu Fang](https://pubmed.ncbi.nlm.nih.gov/?term="Fang%20Y"[Author])

### Yilu Fang, MA

3 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

Data curation, Investigation, Validation

Find articles by [Yilu Fang](https://pubmed.ncbi.nlm.nih.gov/?term="Fang%20Y"[Author])

3, [Yifan Peng](https://pubmed.ncbi.nlm.nih.gov/?term="Peng%20Y"[Author])

### Yifan Peng, PhD

4 Department of Population Health Sciences, Weill Cornell Medicine, New York, NY 10065, United States

Conceptualization, Funding acquisition, Investigation, Methodology, Project administration, Resources, Supervision, Validation

Find articles by [Yifan Peng](https://pubmed.ncbi.nlm.nih.gov/?term="Peng%20Y"[Author])

4,✉,#, [Chunhua Weng](https://pubmed.ncbi.nlm.nih.gov/?term="Weng%20C"[Author])

### Chunhua Weng, PhD

5 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

Conceptualization, Funding acquisition, Investigation, Methodology, Project administration, Resources, Supervision, Validation

Find articles by [Chunhua Weng](https://pubmed.ncbi.nlm.nih.gov/?term="Weng%20C"[Author])

5,✉,#

*   Author information
*   Article notes
*   Copyright and License information

1 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

2 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

3 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

4 Department of Population Health Sciences, Weill Cornell Medicine, New York, NY 10065, United States

5 Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States

✉

Corresponding authors: Chunhua Weng, PhD, Department of Biomedical Informatics, Columbia University, 622 W 168th Street, PH20 Room 407, New York, NY 10032, United States (chunhua@columbia.edu) and Yifan Peng, PhD, Department of Population Health Sciences, Weill Cornell Medicine, 425 E 61st Street, DIV 305, New York, NY 10065, United States (yip4002@med.cornell.edu)

#

F. Chen and G. Zhang contributed equally and are considered co-first authors of this work.

✉

Y. Peng and C. Weng contributed equally and are considered co-senior corresponding authors of this work.

#### Roles

**Fangyi Chen**: MS, Conceptualization, Data curation, Formal analysis, Investigation, Methodology, Software, Validation, Visualization

**Gongbo Zhang**: PhD, Conceptualization, Data curation, Formal analysis, Investigation, Methodology, Software, Validation, Visualization

**Yilu Fang**: MA, Data curation, Investigation, Validation

**Yifan Peng**: PhD, Conceptualization, Funding acquisition, Investigation, Methodology, Project administration, Resources, Supervision, Validation

**Chunhua Weng**: PhD, Conceptualization, Funding acquisition, Investigation, Methodology, Project administration, Resources, Supervision, Validation

Received 2024 Oct 4; Revised 2024 Dec 16; Accepted 2024 Dec 30; Collection date 2025 Mar.

© The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC11833487  PMID: [39823371](https://pubmed.ncbi.nlm.nih.gov/39823371/)

## Abstract

### Objective

Extracting PICO elements—Participants, Intervention, Comparison, and Outcomes—from clinical trial literature is essential for clinical evidence retrieval, appraisal, and synthesis. Existing approaches do not distinguish the attributes of PICO entities. This study aims to develop a named entity recognition (NER) model to extract PICO entities with fine granularities.

### Materials and Methods

Using a corpus of 2511 abstracts with PICO mentions from 4 public datasets, we developed a semi-supervised method to facilitate the training of a NER model, FinePICO, by combining limited annotated data of PICO entities and abundant unlabeled data. For evaluation, we divided the entire dataset into 2 subsets: a smaller group with annotations and a larger group without annotations. We then established the theoretical lower and upper performance bounds based on the performance of supervised learning models trained solely on the small, annotated subset and on the entire set with complete annotations, respectively. Finally, we evaluated FinePICO on both the smaller annotated subset and the larger, initially unannotated subset. We measured the performance of FinePICO using precision, recall, and F1.

### Results

Our method achieved precision/recall/F1 of 0.567/0.636/0.60, respectively, using a small set of annotated samples, outperforming the baseline model (F1: 0.437) by more than 16%. The model demonstrates generalizability to a different PICO framework and to another corpus, which consistently outperforms the benchmark in diverse experimental settings (_P_\-value < .001).

### Discussion

We developed FinePICO to recognize fine-grained PICO entities from text and validated its performance across diverse experimental settings, highlighting the feasibility of using semi-supervised learning (SSL) techniques to enhance PICO entities extraction. Future work can focus on optimizing SSL algorithms to improve efficiency and reduce computational costs.

### Conclusion

This study contributes a generalizable and effective semi-supervised approach leveraging large unlabeled data together with small, annotated data for fine-grained PICO extraction.

**Keywords:** fine-grained PICO extraction, PICO extraction, semi-supervised learning, named entity recognition

## Introduction

Evidence-based medicine (EBM) has gained increasing popularity over the past decades and has become the guiding principle of medical practice.[1–5](#ocae326-B1) Aggregating, synthesizing, and understanding the best available clinical evidence is essential to enhancing decision-making in medical practices and optimizing treatment outcomes.[6](#ocae326-B6) Meta-analysis is a crucial statistical technique in evidence synthesis that helps inform the best clinical actions by gathering and combining results from different research studies.[7](#ocae326-B7) However, it is a highly time-consuming and labor-intensive process, making it impractical to constantly keep pace with the rapidly rising number of published studies.[6](#ocae326-B6),[8](#ocae326-B8),[9](#ocae326-B9) The PICO (Participants, Intervention, Comparison, and Outcomes) framework serves as the basis for formulating clinical questions and facilitates the efficient retrieval, selection, and categorization of evidence from clinical studies. A more granular PICO characterization of each study enables more accurately capture and representation of the metadata from randomized controlled trials (RCTs) and can help streamline the workflow of automated meta-analysis. For example, instead of using the category of P to characterize participants, we need more information of different participant attributes such as age, sex, race, and ethnicity.

Automated PICO entity extraction is a named entity recognition (NER) task, wherein each token is tagged with a pre-defined label. Early methods relied on rule-based approaches, Conditional Random Fields (CRF) models, or a combination of basic classifiers.[10–12](#ocae326-B10) These approaches necessitate exhaustive feature engineering. More recently, the adoption of deep learning algorithms, such as bidirectional long short-term memory (BiLSTM) networks[13–15](#ocae326-B13) and BiLSTM models augmented with a CRF module,[16](#ocae326-B16),[17](#ocae326-B17) has demonstrated superior performance without laborious feature extraction. Later, transformer-based models (eg, BERT and its variants)[18–21](#ocae326-B18) have further advanced the field.

Despite these advancements, several widely acknowledged challenges persist. One primary challenge is the lack of large, high-quality annotated datasets since annotation is a labor-intensive and time-consuming task that often requires domain experts. Furthermore, the absence of standardized PICO annotation guidelines, which becomes impractical due to variations in study purposes and domains, has further complicated the annotation process. The largest publicly available corpus, EBM-NLP,[22](#ocae326-B22) was reported to exhibit significant inconsistency in annotated results.[23–25](#ocae326-B23) These inconsistencies are mainly attributed to unclear definitions of text span boundaries and complex annotation guidelines, resulting in suboptimal model performances.[23–25](#ocae326-B23) To address these limitations, manual corrections or heuristic rule-based approaches have been leveraged to relabel entities.[23](#ocae326-B23),[25](#ocae326-B25),[26](#ocae326-B26) Notably, Hu et al[23](#ocae326-B23) proposed a 2-step NLP pipeline that first classifies sections of sentences and then extracts PICO from sentences in Title and Method sections using BiomedBERT trained on re-annotated abstract. Although their proposed method reduced annotation time for sentences rich in PICO information and achieved high inter-annotator agreement, the overall number of annotated abstracts remained considerably limited.

Another issue is the lack of fine-grained annotation. Most public datasets only provide coarse-level PICO annotations,[27](#ocae326-B27) which do not always meet the requirements for many downstream tasks, such as meta-analysis or evidence appraisal. Although the EBM-NLP dataset was unusually annotated with fine-grained PICO entities, these annotations are unsuitable for meta-analysis because they do not capture numeric values associated with outcome measures for different study arms (eg, intervention and control). The ability to extract numerical data is critical for conducting a statistical analysis to evaluate the efficacy of the intervention.[28](#ocae326-B28) Nevertheless, limited effort has been dedicated to extracting detailed outcome information, eg, the number of subjects experiencing specific outcome events. Mutinda et al[29](#ocae326-B29) introduced a fully annotated dataset comprising 1011 RCTs on breast cancer. While their PICO annotation framework was suitable for conducting meta-analysis, it did not include annotations for key population characteristics (eg, sex) because their selected RCTs focused mainly on the female population. Therefore, the generalizability of NER models built using this dataset was significantly compromised.

Recognizing these challenges, we proposed FinePICO, a semi-supervised learning (SSL) algorithm to enhance the extraction of fine-grained PICO entities. SSL is a branch of machine learning model that utilizes both labeled and unlabeled data for model training.[30](#ocae326-B30) Compared to fully supervised learning, which demands a vast number of labeled samples to achieve optimal performance, SSL effectively leverages abundant unlabeled data combined with scarce labeled data to improve learning outcomes. Current PICO extraction models[13](#ocae326-B13),[17](#ocae326-B17),[22](#ocae326-B22),[23](#ocae326-B23) heavily depend on the availability and quality of annotated samples, which are challenging to obtain and inconsistent across sites, thereby limiting their robustness and generalizability. In contrast, SSL offers significant advantages in low-resource settings where labeled data are expensive and sparse. While several limitations have been acknowledged, such as higher computational costs, risk of propagating errors, and assumption about data distribution,[31](#ocae326-B31),[32](#ocae326-B32) SSL has been widely adopted and demonstrated promising results in various applications, such as object recognition and image segmentation,[33](#ocae326-B33),[34](#ocae326-B34) document retrieval and classification,[32](#ocae326-B32),[35–37](#ocae326-B35) and biomedical information mining.[38](#ocae326-B38) The primary focus of this study is to explore SSL in fine-grained PICO extraction, as its efficacy in this area remains uncertain.

Our main objective was to demonstrate that combining limited labeled data and a substantial volume of unlabeled data can achieve performance comparable to that of models trained using fully annotated data. Our findings suggested that SSL techniques can optimize fine-grained PICO extraction by greatly expanding the training sample size while minimizing reliance on extensive manual annotation efforts.

## Materials and methods

### Workflow overview

FinePICO employs an iterative SSL process to adjust model weights and generate pseudo-labels for unlabeled data. [Figure 1](#ocae326-F1) depicts the overview design of the model. Specifically, we first develop a NER model using the available annotated data via the traditional supervised learning approach. Once the initial model is trained, it is deployed to make inferences on the unlabeled data, referred to as pseudo-labels. We enrich the original labeled data with the high-confidence pseudo-labeled data for fine-tuning the model. We iteratively repeat the cycle of generating pseudo-labels and updating model weights until the model’s performance converges on the validation dataset or a predefined maximum number of iterations has been reached. To ensure the quality of the pseudo-labels and minimize the risk of error propagation, we incorporate a quality enhancement module. It performs a quality check and selects the generated labels with high confidence.

#### Figure 1.

[![Figure 1.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/7ac2/11833487/d633d59189bb/ocae326f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11833487_ocae326f1.jpg)

[Open in a new tab](figure/ocae326-F1/)

The overview of the study workflow. The study comprises of 4 main components: 1) establish initial model, 2) generate pseudo-labels, 3) quality enhancement mechanism and 4) iterative training process. The initial model (M0) is developed using the labeled data only. After training, M0 is used to generate pseudo-labels on the unlabeled data. We introduce a quality enhancement module to ensure the quality of the pseudo-labels and minimize the risk of error propagation. The new model is obtained by using the original labeled data in combination with the high-confidence pseudo-labeled data. We iteratively repeat the cycle of generating pseudo-labels and updating model weights.

#### Foundation model

To leverage the power of pre-trained language models, we select a BERT-based model as our foundation model.[39](#ocae326-B39) We define as the entire collection of sentences of interest, where refers to the sentences with pre-annotated named entity tags associated with their tokens. For each sentence , we have a sequence of tokens , where each token is associated with a label , and is the length of the sentence .

We also define as the set of sentences without annotated named entity tags. We leverage the BERT-based model that was previously trained on to make inferences on and generate the set of pseudo-labels () for each token in the unlabeled sentence .

The training and fine-tuning process involves applying the softmax function on the last layer of the neural network to compute the probability for the th entity class associated with the token . The predicted entity class is then determined as follows:

|  | (1) |
| --- | --- |

|  | (2) |
| --- | --- |

where is an embedding-based representation of each token, and is the total number of entity class. represents probabilities across entity tags for token . The target function is to minimize the cross-entropy loss function. The loss function at token is defined as follows:

|  | (3) |
| --- | --- |

The binary indicator equals to 1 if a token belongs to the th class and 0 otherwise. The overall loss function comprises of 2 parts: the supervised loss () and unsupervised loss ().

|  | (4) |
| --- | --- |

#### Supervised learning loss

We leveraged as the main dataset for training and developing our initial baseline models . The training process follows well-established supervised learning methods. In this stage, we aim to develop a model that can make reasonable inferences on unseen data. The baseline models were then iteratively refined using both and to minimize the learning loss. The total supervised learning loss at iteration is computed as follows:

|  | (5) |
| --- | --- |

where refers to the number of sentences with annotation and is the number of tokens at sentence. denotes as the supervised learning loss function at token .

#### The quality enhancement mechanism of pseudo-label generation

The baseline model infers labels for each token in the unlabeled sentences. We incorporated the sets of pseudo-labels with of the sentence into the original training pool to further improve . For a token in the sentence , its pseudo-label is formally defined as follows:

|  | (6) |
| --- | --- |

To maintain the quality and consistency of the generated pseudo-labels on a diverse set of training samples, we introduced a quality enhancement module to select the high-quality labels that would be used in subsequent training iterations. Specifically, we implemented 3 different quality enhancement approaches within the label selection process and evaluated their relative effectiveness in enhancing the overall model performances.

The selective unsupervised learning loss of a token is computed as follows:

|  | (7) |
| --- | --- |

|  | (8) |
| --- | --- |

where the binary indicator when the 2 conditions are met simultaneously. The quality enhancement function minimizes noises resulting from erroneous predictions by checking if the pseudo-label is accurate or has a high degree of certainty. In this study, we investigated 3 checking strategies.

1.  **Confident-based masking**. This approach leverages prior studies that revealed the benefits of masking out low-confident examples from the training set.[40](#ocae326-B40),[41](#ocae326-B41) It uses a predefined threshold to filter out pseudo-labels lower than this level. The threshold is empirically determined to balance between maintaining high label quality and retaining a sufficient volume of training samples.
    
2.  **Class adaptive threshold-based masking**. A recognized limitation of confident-based masking is its potential bias toward classes with higher quality pseudo-labels.[42](#ocae326-B42) To address this issue, we also implemented a class-wise threshold adjustment algorithm, where the threshold for entity class is dynamically calculated per iteration as follows:
    
    |  | (9) |
    | --- | --- |
    
    where denotes the number of unlabeled sentences and refers to the number of unlabeled tokens. We update the threshold for each class and filter the token and its label if the associated probability is less than the dynamic threshold .
    
3.  **Label selection via model distillation (GPT-based selection)**. We leverage GPT-4o to evaluate the pseudo-label quality. With the tokenized sentences as input, we prompt GPT-4o to confirm whether the pseudo-labels are correct. Inspired by Hu et al,[43](#ocae326-B43) we curate customized prompts for different entities. Each prompt includes annotation guideline, error-based instruction, as well as a few annotated examples ([Table S1](#sup1)**).** The labels confirmed as accurate by GPT-4o are then be incorporated into the new training dataset.
    

### Data source

We tested FinePICO with different data augmentation strategies, including the use of in-domain data, cross-domain data, and both. In-domain augmentation refers to the scenario where the labeled and unlabeled data are sampled from the same domain, while cross-domain augmentation refers to the scenario where the labeled and unlabeled are sampled from different domains.

For this purpose, we used 4 public datasets in this study, including PICO-Corpus,[29](#ocae326-B29) EBM-NLP[22](#ocae326-B22) samples (n = 1200 abstracts), and 2 sets of RCT abstracts[23](#ocae326-B23) focused on Alzheimer’s disease (AD) and COVID-19. The number of PICO entities is summarized in [Table 1](#ocae326-T1).

#### Table 1.

Characteristics for 4 datasets used in this study.

|  | PICO-Corpus | EBM-NLP | AD | COVID-19 |
| --- | --- | --- | --- | --- |
| Abstracts | 1011 | 1200 | 150 | 150 |
| Training | 1010 |  |  |  |
| Validation | 645 |  |  |  |
| Test | 944 |  |  |  |
| Population (P) |  | 3951 | 215 | 262 |
| Total sample size | 1094 | – | – | – |
| Sample size in INT | 887 |  |  |  |
| Sample size in CTL | 784 | – | – | – |
| Age | 231 | – | – | – |
| Eligibility | 925 | – | – | – |
| Ethnicity | 101 | – | – | – |
| Condition | 327 | – | – | – |
| Location | 186 | – | – | – |
| Intervention (I) | 1067 | 5916 | 467 | 602 |
| Control (C) | 979 | 563 | 103 | 180 |
| Outcome (O) |  | 7151 | 626 | 626 |
| Study outcomes | 5053 | – | – | – |
| Outcome measures | 1081 | – | – | – |
| Binary outcomes |  |  |  |  |
| Absolute value, INT/CTL | 556/465 | – | – | – |
| Percentage values, INT/CTL | 1376/1148 | – | – | – |
| Continuous outcomes |  |  |  |  |
| Mean, INT/CTL | 336/327 | – | – | – |
| Median, INT/CTL | 270/247 | – | – | – |
| Standard deviation, INT/CTL | 129/124 | – | – | – |
| q1, INT/CTL | 4/4 | – | – | – |
| q3, INT/CTL | 4/4 | – | – | – |

[Open in a new tab](table/ocae326-T1/)

“-” indicates unavailable. CTL: control group; INT: intervention arm.

PICO-Corpus[29](#ocae326-B29) includes 1011 RCTs related to breast cancer, where each abstract was manually annotated for the pre-defined PICO subcategories (eg, total sample size, age, and outcome values). EBM-NLP corpus composes RCT abstracts in diverse domains, where the training set of the abstracts was annotated by Amazon Mechanical Turk, and inter-annotator conflicts were resolved via a voting strategy. Previous studies[22](#ocae326-B22),[24](#ocae326-B24),[25](#ocae326-B25) reported a lack of consistency and agreement among the annotators, with Cohen’s kappa coefficient of inter-rater reliability being 0.3.[23](#ocae326-B23) Due to these limitations, we adopted the annotation scheme in PICO-Corpus and utilized EBM-NLP mainly for training data augmentation. We randomly picked 1200 abstracts from EBM-NLP. The 2 datasets of AD and COVID-19 did not provide fine-grained PICO annotation; as such, these 2 were reserved for testing purposes only.

Following the preprocessing workflow of earlier studies,[44](#ocae326-B44),[45](#ocae326-B45) we extracted PICO entities from each sentence in the abstract. The RCT abstracts (n = 2511) were tokenized into sentences using a Python library NLTK.[46](#ocae326-B46) We divided sentences from PICO-Corpus into training, validation, and testing sets. The train-test splitting ratio was set to 80:20, and within the training set, we reserved 10% of sentences for validation. Clinical trials in EBM-NLP with PICO annotations removed were included as the unlabeled data in the training set. The 2 datasets, AD and COVID-19, were reserved for testing purposes. We adopted the BIO2 tagging schema[47](#ocae326-B47),[48](#ocae326-B48) in this task, which is widely used in NER tasks. Specifically, each token in a sequence is labeled with a combination of a prefix and the type of predefined entities. The prefix indicates the beginning (B), inside (I), or outside (O) of the entities. The common method follows a 2-step process that first identifies the relevant entities and then performs relationship extraction to distinguish intervention from control. Our method does not need the relationship extraction step, as our detailed annotation labels explicitly classify these values into distinct entity categories ([Table 1](#ocae326-T1)).

### Foundation model choice and baseline model

We first tested several open-source models (eg, BiomedBERT,[39](#ocae326-B39) BioBERT,[19](#ocae326-B19) SciBERT,[21](#ocae326-B21) and ClinicalBERT[49](#ocae326-B49)) used by previous studies to extract fine-grained PICO entities. These models were built using all the labeled training data and were evaluated on the test set. We followed the same hyper-parameter settings described in the prior works,[23](#ocae326-B23),[45](#ocae326-B45) using a learning rate of 5e-5, a batch size of 8, and a total of 10 training epochs.

The performances of several BERT-based models (BioBERT, SciBERT, ClinicalBERT, and BiomedBERT) are detailed in [Table S2](#sup1). BiomedBERT achieved the highest macro-average precision of 0.662, recall of 0.716, and F1 score of 0.688 in extracting fine-grained PICO elements, outperforming the other models. Such results aligned with the findings of a previous study[44](#ocae326-B44) focusing on extracting granular PICO information from texts, suggesting the superior performance of BiomedBERT in identifying PICO entities. Therefore, in the remaining experiments, we used BiomedBERT as the baseline model.

Considering the constraints of limited available annotations, we defined an ideal scenario where the unlabeled data would be annotated by human experts. We used the model performance from this ideal scenario as the upper bound of SSL model performance in our experiments.

### Data augmentation with unlabeled data

We augmented the training data with unlabeled text corpus from 3 distinct domains: in-domain (similar domain with the labeled data), cross-domain (different domains from the labeled data: EBM-NLP), and all-domain (both in-domain and cross-domain unlabeled data). To evaluate the in-domain and all-domain cases, we masked out annotations with different ratios in the training data. Specifically, we randomly selected 10%, 30%, 50%, 70%, 90%, and 100% of the sentences from the training set to act as labeled data and treat the rest as unlabeled data ([Table S3](#sup1)). The proposed algorithm was assessed across these different masking ratios and compared with the performances of the baseline model.

### Generalizability test on an enhanced PICO scheme

To demonstrate generalizability, we evaluated FinePICO on a newly annotated dataset under a revised guideline adopted from the one used for PICO-Corpus. The first change is a new demographic entity representing the genders of participants. Gender is an important demographic characteristic[50](#ocae326-B50),[51](#ocae326-B51) that enables the exploration of varying treatment effects across different gender subgroups; however, it was not included in the original annotation scheme.

To streamline the gender entity labeling process, we constructed a gender entity tagger using the BiomedBERT fine-tuned on carefully selected samples from EBM-NLP. The samples were selected by first extracting sentences containing tokens tagged with the “sex” entity label, followed by manual validation, and supplemented by a keyword search approach to ensure accurate extraction of the sex entity from the text. The final data comprised 569 sentences, partitioned with 80% for training, 10% for validation, and 10% for testing.

We trained the model for 5 epochs with a learning rate of 5e-5, achieving a high F1 score of 0.989. The best-performing model was then utilized to recognize sex entity in the PICO-Corpus (training and validation set). Finally, 2 researchers (F.C. and Y.F.) manually annotated the sex entity in the testing set to provide a benchmark, with the Cohen’s kappa score of 0.98.

The second change involves replacing and consolidating several categories to enhance clarity and efficiency. The revised PICO scheme is illustrated in [Figure 2](#ocae326-F2), and the details of the entity counts can be found in [Table S4](#sup1). Specifically, we combined the “subject eligibility” and “conditions” into a single entity group now named “recruited participant eligibility conditions.” This merger reflects their interrelated nature and simplifies the tagging process. Additionally, we combined “outcome names” and “outcome measures” into one group to avoid redundancy and streamline the dataset.

#### Figure 2.

[![Figure 2.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/7ac2/11833487/573405d3d53e/ocae326f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11833487_ocae326f2.jpg)

[Open in a new tab](figure/ocae326-F2/)

The enhanced PICO scheme. RCT refers to randomized controlled trial. In the enhanced PICO scheme, the category of participants (P) includes the following entities: total sample size, sample size of the intervention/control group, overall age, sex, other demographics (e.g., race, ethnicity), and participant conditions. Names of intervention (I) and control (C) are extracted. Lastly, the primary and secondary outcomes are separated for intervention and control groups, where the values are divided into either binary or continuous.

### Evaluation metrics

We tested our models on 2 independent test sets (PICO-Corpus, AD, and COVID-19 from Hu et al[23](#ocae326-B23)). In the first test set derived from the PICO-Corpus, we evaluated our NER models at a strict entity level that requires the recognition of the complete span of each entity. Since token-level evaluation can be misleadingly high for the intended task, as missing tokens could result in significant misinterpretation, it is essential to accurately capture entire PICO entities. We computed the macro-average precision, recall, and F1 score using seqeval,[52](#ocae326-B52) a well-tested tool often deployed in numerous NLP studies for system evaluation.[53](#ocae326-B53) The 95% confidence interval of the performance was estimated based on the bootstrapped test samples.

Acknowledging the variance in annotated spans across different datasets, we conducted a second evaluation using partial-matching[54](#ocae326-B54) on AD and COVID-19 datasets. Here, we counted a predicted named entity as a true positive if it overlaps with the human-labeled entities with at least one token. It is worth noting that AD and COVID-19 did not include fine-grained PICO annotation. Therefore, we first converted the predicted fine-grained entities into coarse-level entities and evaluated them using a partial matching strategy.[54](#ocae326-B54)

## Results

### Performance on limited labeled samples

The baseline models were established solely using labeled samples. The lower bound performance refers to the baseline model evaluated on the test set, whereas the upper bound corresponds to the model trained on the entire set of labeled training samples and evaluated on the test set.

In scenarios where limited labeled samples were available (eg, case 1 with 10% labeled data, as shown in [Table S3](#sup1)), FinePICO notably surpassed the lower bound benchmarks in both data augmentation settings during the iterative training process ([Figure 3](#ocae326-F3)). For instance, employing the confident-based approach, the model augmented with cross-domain data achieved the highest macro-average F1 score of 0.589 at the 7th iteration. This score marked an approximately 15% improvement over the lower bound (F1-score of 0.44). Similarly, statistical improvements over the baseline model were observed when different data augmentation strategies were applied, and when the model was adapted to the revised PICO scheme.

#### Figure 3.

[![Figure 3.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/7ac2/11833487/ce5bcfccbda1/ocae326f3.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11833487_ocae326f3.jpg)

[Open in a new tab](figure/ocae326-F3/)

Performance of the proposed models using 10% annotated data augmented with in-domain, cross-domain data. Lower bound performance is detonated as the baseline model evaluated on the test set. The upper bound refers to the baseline model trained using the whole labeled training samples and evaluated on the test set. (A) Performances of deploying different quality control approaches (confident-based, class-adaptive threshold-based, GPT-based selection) during the iterative training process under the original PICO scheme. GPT-based selection approach achieved the highest F1 score of 0.617 when augmented using cross-domain data. (B) Performances of deploying different quality control approaches (confident-based, class-adaptive threshold-based, GPT-based selection) during the iterative training process under the revised PICO scheme. When augmented with in-domain data, class-adaptive threshold-based approach obtained the highest F1 score of 0.658.

### Performance comparison of different quality enhancement approaches

The performances of 3 quality enhancement strategies for optimizing pseudo-label selection are summarized in [Table 2](#ocae326-T2). All 3 quality enhancement methods outperformed the baseline models by over 10% in precisions, recall, and F1 scores, with their respective 95% confidence intervals (CIs) provided in [Table S5](#sup1). In the original PICO scheme, GPT-based selection achieved the highest performance (average F1 of 0.6, 95% CI between 0.609 and 0.664) among the 3 methods. However, we did not perceive any statistical enhancement (_P_\-value = .171) using GPT-based selection over the confident-based masking algorithm. In the revised PICO scheme, the adaptive threshold-based method was the most effective in selecting high-quality pseudo-labels among the 3 quality enhancement approaches, obtaining the highest average F1 score of 0.653 (95% CI: 0.657-0.706) when augmented with in-domain unlabeled data. Additionally, both confident-based and adaptive threshold-based masking methods have performed statistically better than GPT-based selection (_P_\-value < .05).

#### Table 2.

Average performance of different quality enhancement approaches evaluated on the bootstrapped testing samples.

| Quality enhancement approaches | Original scheme |  |  | Revised scheme |  |  |
| --- | --- | --- | --- | --- | --- | --- |
|  | Recall | Precision | F1 | Recall | Precision | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| Confident-based masking |  |  |  |  |  |  |
| In-domain | 0.607 | 0.566 | 0.586 | 0.675 | 0.628 | 0.651 |
| Cross-domain | 0.619 | 0.580 | 0.598 | 0.652 | 0.613 | 0.632 |
| Class adaptive threshold masking |  |  |  |  |  |  |
| In-domain | 0.636 | 0.561 | 0.596 | 0.682 | 0.626 | 0.653 |
| Cross-domain | 0.617 | 0.571 | 0.594 | 0.677 | 0.627 | 0.651 |
| GPT-based selection |  |  |  |  |  |  |
| In-domain | 0.607 | 0.591 | 0.599 | 0.639 | 0.607 | 0.622 |
| Cross-domain | 0.636 | 0.567 | 0.600 | 0.613 | 0.608 | 0.610 |
|  |  |  |  |  |  |  |
| Baseline model (BiomedBERT) | 0.489 | 0.394 | 0.437 | 0.568 | 0.480 | 0.520 |

[Open in a new tab](table/ocae326-T2/)

### Generalizability assessment

To assess the generalizability of FinePICO, with the consideration of available resources, we selected confident-based masking as the primary quality enhancement approach. The best-performing models were examined on additional data augmentation cases ranging from 30% to 100% of annotated samples.

#### Additional data augmentation scenarios

[Table 3](#ocae326-T3) presents the average performances of models with different data augmentation cases, with the baseline levels detailed in [Table S6](#sup1). Our analysis revealed a positive linear relationship between model performance and the number of annotated samples used for training. Specifically, performance increased from an F1 score of 0.667 (cross-domain) with 30% of the annotated data to 0.695 with the entire labeled data. This suggests that while additional labeled data continue to improve the model performance, the marginal gains diminish as the proportion of annotations approaches 100%.

##### Table 3.

Average performances on bootstrapped testing samples.

| Data augmentation cases | Original scheme |  |  | Revised scheme |  |  |
| --- | --- | --- | --- | --- | --- | --- |
|  | Recall | Precision | F1 | Recall | Precision | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| Case 2: 30% Annotation |  |  |  |  |  |  |
| In-domain | 0.673 | 0.623 | 0.647 | 0.722 | 0.668 | 0.694 |
| Cross-domain | 0.674 | 0.616 | 0.644 | 0.712 | 0.650 | 0.680 |
| All | 0.689 | 0.645 | 0.667 | 0.708 | 0.675 | 0.691 |
| Case 3: 50% Annotation |  |  |  |  |  |  |
| In-domain | 0.687 | 0.647 | 0.667 | 0.737 | 0.702 | 0.719 |
| Cross-domain | 0.699 | 0.647 | 0.672 | 0.717 | 0.691 | 0.703 |
| All | 0.699 | 0.650 | 0.673 | 0.730 | 0.700 | 0.714 |
| Case 4: 70% Annotation |  |  |  |  |  |  |
| In-domain | 0.699 | 0.663 | 0.681 | 0.734 | 0.699 | 0.716 |
| Cross-domain | 0.702 | 0.649 | 0.674 | 0.737 | 0.697 | 0.716 |
| All | 0.699 | 0.645 | 0.646 | 0.735 | 0.700 | 0.717 |
| Case 5: 90% Annotation |  |  |  |  |  |  |
| In-domain | 0.715 | 0.663 | 0.688 | 0.749 | 0.703 | 0.725 |
| Cross-domain | 0.728 | 0.672 | 0.699 | 0.750 | 0.706 | 0.727 |
| All | 0.717 | 0.678 | 0.697 | 0.742 | 0.693 | 0.717 |
| Case 6: 100% Annotation |  |  |  |  |  |  |
| In-domain | \- | \- | \- | \- | \- | \- |
| Cross-domain | 0.716 | 0.676 | 0.695 | 0.753 | 0.713 | 0.732 |
| All | 0.716 | 0.676 | 0.695 | 0.753 | 0.713 | 0.732 |

[Open in a new tab](table/ocae326-T3/)

As we increased the number of annotated samples while keeping the size of unlabeled training samples constant, we consistently observed statistically significant improvements (_P_\-value < .001) in the model’s performance compared to the benchmark. These improvements were particularly notable in the extreme case when the maximum amount of labeled data was used ([Figure 4](#ocae326-F4)). Furthermore, the performance of the proposed algorithm consistently surpassed the baseline levels across the revised PICO scheme, showcasing the model’s robustness and adaptability.

##### Figure 4.

[![Figure 4.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/7ac2/11833487/8f284220018d/ocae326f4.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11833487_ocae326f4.jpg)

[Open in a new tab](figure/ocae326-F4/)

(A) Statistical performance comparison to baseline models in 6 simulated cases with different experimental settings (in-domain, cross-domain, and all) under the original PICO scheme. The proposed algorithm exhibited statistical improvement over the baseline in all simulated cases. (B) Statistical performance comparison to baseline models in 6 simulated cases with different experimental settings (in-domain, cross-domain, and all) under the revised PICO scheme. The proposed algorithm exhibited statistical improvement over the baseline in all simulated cases. \*_P_ < .05, \*\*_P_ < .01, \*\*\*_P_ < .001.

Additionally, we examined the performance differences among SSL under various data augmentation approaches (in-domain, cross-domain, and all-domain). In the original PICO scheme, models trained on both cross-domain and all-domain data performed statistically better than models trained using in-domain data (_P_\-value < .001), whereas, in the revised scheme, we observed the opposite trend.

#### Evaluation on the independent testing sets

We further applied the best-performing model to another independent testing corpus (AD, COVID-19),[23](#ocae326-B23) and the averaged performances over 30 bootstrapped samples, along with the baseline levels, were recorded in [Table 4](#ocae326-T4). The proposed model demonstrated statistically significant improvement (_P_\-value = .014 in the original scheme and _P_\-value = .025 in the revised scheme) over the baselines evaluated under AD and COVID-19 corpus.

##### Table 4.

Partial-matching performances of the optimal model evaluated on the external testing corpus (ie, AD and COVID-19 datasets).

| Models | Original scheme |  |  | Revised scheme |  |  |
| --- | --- | --- | --- | --- | --- | --- |
|  | Recall | Precision | F1 | Recall | Precision | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline | 0.922 (0.902, 0.943) | 0.780 (0.756, 0.804) | 0.845 (0.825, 0.870) | 0.931 (0.913, 0.95) | 0.778 (0.745, 0.811) | 0.848 (0.825, 0.870) |
| FinePICO | 0.919 (0.896, 0.943) | 0.795 (0.762, 0.830) | 0.853 (0.826, 0.879) | 0.928 (0.91, 0.946) | 0.789 (0.767, 0.811) | 0.853 (0.826, 0.879) |

[Open in a new tab](table/ocae326-T4/)

The results were the average performances, and the 95% confidence interval obtained from bootstrapped samples with 30 iterations.

### Error analysis

We conducted an error analysis of our optimal model on 100 sentences randomly selected from the test set and identified the following error categories: (1) boundary detection error (n = 14), (2) entity misclassification (n = 10), and (3) failure to detect the presence of the entity (n = 9). Examples of these categories are summarized in [Table S7](#sup1). Boundary detection errors are the most prevalent, suggesting that the model often failed to capture the complete entity span, especially in the names of the intervention arms and measured outcome. For instance, in the sentence “A key secondary endpoint was the feasibility of achieving 12 meth/week (metabolic equivalent of task hours per week),” the outcome measured was annotated as the entire phrase “feasibility of achieving 12 meth/week (metabolic equivalent of task hours per week).” However, our model failed to identify the content within the paratheses as part of the outcome name. Entity misclassification was the second most common error, occurring when the model incorrectly assigned values to different arms; for example, it misclassified intervention outcomes values as belonging to the control arm.

## Discussion

In this study, we developed a SSL approach to overcome several key challenges in fine-grained PICO entity recognition, including the limited amount of high-quality annotated data and the lack of standardized fine-grained PICO annotation guidelines. These limitations have historically hindered the adaptability and generalizability of existing PICO extraction models.

FinePICO demonstrated substantial improvements (_P_\-value < .001) compared to the baseline models across various experimental settings, including in-domain, cross-domain, and all-domain datasets. This was especially evident in scenarios where a large percentage of trained samples were unannotated. For instance, in the case where only 10% of the training sample was labeled, FinePICO demonstrated an overall improvement of over 16% in F1 score compared to the conventional supervised learning-based approach (in the original PICO scheme, our best model using a GPT-based label selector achieved an average F1 of 0.60 vs 0.437 for the baseline model, _P_\-value < .001). FinePICO also consistently outperformed the benchmarks when applied to the revised PICO scheme, demonstrating its robustness and adaptability to varied annotation guidelines. This flexibility allows users to use their preferred fine-grained PICO scheme. As shown in the experiments ([Figure 4](#ocae326-F4)), the proposed algorithm effectively enhanced the model performance by augmenting training samples without needing an additional manual labeling process, significantly surpassing the models trained exclusively on fully annotated datasets.

Prior research[33](#ocae326-B33),[55](#ocae326-B55),[56](#ocae326-B56) suggested that leveraging abundant unlabeled data with a small portion of labeled data can greatly improve learning performance. Conversely, in certain situations, SSL offers no benefits and may even lead to performance degradation. Such situations include distribution mismatches between labeled and unlabeled data or when the labeled or unlabeled datasets are too small to extract any meaningful patterns and information.[57](#ocae326-B57),[58](#ocae326-B58) Additionally, in SSL algorithms, models are iteratively retrained with newly generated pseudo-labels to enhance the prediction outcomes. However, this process can potentially introduce or amplify error propagation and class imbalance. In this study, we implemented several quality-checking strategies (ie, a class-wise confident-based method and label checking via large language model distillation) to minimize the noise introduced by pseudo-labels. These quality enhancement approaches are simple yet effective, achieving better performance (_P_\-value < .05) than the model without such quality control measures ([Figure S1](#sup1)).

The outcomes from the study revealed the feasibility of using a SSL-based approach to optimize fine-grained PICO entity recognition. In our experiments, we also compared the performances of the models using unlabeled datasets from 3 different sources: in-domain (similar domain as the labeled data), cross-domain (different domain from the labeled data), and a combination of both. In the original PICO scheme, the models trained with cross-domain data consistently exhibited better (_P_\-value < .01) performances than those trained with in-domain data. This improvement may be due to the increased data diversity and the introduction of new useful context information. These findings suggested the potential of using published cross-domain RCTs to enhance PICO extraction, especially when in-domain RCT studies were scarce.

Despite the promising results of our model, several major types of errors were recognized. The major was the boundary detection error, which is common in other PICO NER models as well.[23](#ocae326-B23),[26](#ocae326-B26) Part of these errors is potentially attributed to a lack of consistency in human annotation. We believe that a clear annotation guideline that explicitly defines what to include and exclude in the labeling process can minimize these errors.

Second, for certain cases, we perceived that our model has difficulty differentiating between values in the intervention arm and control group. For example, the sentence “Patients were randomized to receive zoledronic acid administered intravenously every 4 weeks (n = 911) vs every 12 weeks (n = 911) for 2 years” from the RCT aims to compare the effect of a longer dosing interval (12 weeks) vs the standard dosing interval (every 4 weeks). The model misannotated the first “911” as the intervention sample size, and the second “911” as the control sample size; however, such confusion was understandable. It is also challenging for humans to make this decision without considering broader contextual information. To improve future outcomes, performing PICO recognition on a wider contextual level, rather than limiting it to the sentence level, may mitigate this confusion.

Lastly, we noticed that our model often confused with background information as one of the PICO population entities (eg, sex and race). Such as in the sentence “breast cancer, with an incidence of 32%, is the most frequent cancer among Egyptian women,” which depicts the general information of breast cancer in a subpopulation, our model identified the “Egyptian women” as the recruited population demographic characteristics. Even though the main recruited participants were under this category, it is inaccurate to assume the study recruited participants to match the population mentioned in the background section. Thus, it is beneficial to leverage section information in determining final participants and reported results. Recently, Hu et al[59](#ocae326-B59) developed a few-shot prompt learning-based approach to classifying sentences in RCTs into different subsections (Introduction, Background, Methods, and Results). This demonstrates state-of-the-art performance with minimal training samples required. In the future, we can potentially incorporate the sentence classifiers before applying fine-grained PICO extractors. Another limitation of the proposed algorithm is its scalability, especially as datasets grow larger, a challenge encountered by most algorithms. The computational demands of training SSL models can strain available resources, hindering the accessibility of organizations with financial constraints and inadequate support of computational infrastructure. Future research could focus on the optimization of SSL algorithms, such as distributed training and adaptive sampling methods to prioritize more informative data during the training process.

## Conclusion

In this paper, we proposed a SSL approach to address 2 notable challenges in fine-grained PICO extraction: the scarcity of high-quality annotation samples and the absence of standardized annotation guidelines. To our knowledge, this is the first attempt to comprehensively examine the performance of SSL in fine-grained PICO extraction across various experimental settings. The findings suggested that leveraging the SSL model can effectively enhance the performance of traditional supervised learning-based models by augmenting training datasets without relying on extensive human annotation. The approach exhibited superior results compared to the benchmark, with high robustness and generalizability to other user-defined annotation schemes. This encourages the adoption of SSL techniques in extracting fine-grained PICO entities from RCTs and inspires more innovative SSL algorithms in this field.

## Supplementary Material

ocae326\_Supplementary\_Data

[ocae326\_supplementary\_data.pdf](/articles/instance/11833487/bin/ocae326_supplementary_data.pdf) (1.1MB, pdf)

## Contributor Information

Fangyi Chen, Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States.

Gongbo Zhang, Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States.

Yilu Fang, Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States.

Yifan Peng, Department of Population Health Sciences, Weill Cornell Medicine, New York, NY 10065, United States.

Chunhua Weng, Department of Biomedical Informatics, Columbia University, New York, NY 10032, United States.

## Author contributions

Fangyi Chen: Conceptualization, data curation, formal analysis, investigation, methodology, software, validation, visualization, writing—original draft, writing—review & editing. Gongbo Zhang: Conceptualization, data curation, formal analysis, investigation, methodology, software, validation, visualization, writing—original draft, writing—review & editing. Yilu Fang: Data curation, investigation, validation, writing—review & editing. Yifan Peng: Conceptualization, funding acquisition, investigation, methodology, project administration, resources, supervision, validation, writing—review & editing. Chunhua Weng: Conceptualization, funding acquisition, investigation, methodology, project administration, resources, supervision, validation, writing—review & editing. All authors have read and approved the manuscript.

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

This project was sponsored by the National Library of Medicine grant R01LM014344, R01LM014573, R01LM009886, and T15LM007079; the National Human Genome Research Institute grant R01HG012655; and the National Center for Advancing Translational Sciences grant UL1TR001873 and UL1TR002384. The content is solely the responsibility of the authors and does not necessarily represent the official views of the National Institutes of Health.

## Conflicts of interest

All authors declare no competing interests.

## Data availability

The data and codes underlying the study will be available upon request.

## References

*   1. Collins J.  Evidence-based medicine. J Am Coll Radiol. 2007;4:551-554. \[[DOI](https://doi.org/10.1016/j.jacr.2006.12.007)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/17660119/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Coll%20Radiol&title=Evidence-based%20medicine&volume=4&publication_year=2007&pages=551-554&pmid=17660119&doi=10.1016/j.jacr.2006.12.007&)\]
*   2. You S.  Perspective and future of evidence-based medicine. Stroke Vasc Neurol. 2016;1:161-164. \[[DOI](https://doi.org/10.1136/svn-2016-000032)\] \[[PMC free article](/articles/PMC5435208/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28959479/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Stroke%20Vasc%20Neurol&title=Perspective%20and%20future%20of%20evidence-based%20medicine&volume=1&publication_year=2016&pages=161-164&pmid=28959479&doi=10.1136/svn-2016-000032&)\]
*   3. Akobeng AK.  Principles of evidence based medicine. Arch Dis Child. 2005;90:837-840. \[[DOI](https://doi.org/10.1136/adc.2005.071761)\] \[[PMC free article](/articles/PMC1720507/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/16040884/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Arch%20Dis%20Child&title=Principles%20of%20evidence%20based%20medicine&volume=90&publication_year=2005&pages=837-840&pmid=16040884&doi=10.1136/adc.2005.071761&)\]
*   4. Peng Y, Rousseau JF, Shortliffe EH, Weng C.  AI-generated text may have a role in evidence-based medicine. Nat Med. 2023;29:1593-1594. \[[DOI](https://doi.org/10.1038/s41591-023-02366-9)\] \[[PMC free article](/articles/PMC11193148/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37221382/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Med&title=AI-generated%20text%20may%20have%20a%20role%20in%20evidence-based%20medicine&volume=29&publication_year=2023&pages=1593-1594&pmid=37221382&doi=10.1038/s41591-023-02366-9&)\]
*   5. Zhang G, Jin Q, Jered McInerney D, et al.  Leveraging generative AI for clinical evidence synthesis needs to ensure trustworthiness. J Biomed Inform. 2024;153:104640. \[[DOI](https://doi.org/10.1016/j.jbi.2024.104640)\] \[[PMC free article](/articles/PMC11217921/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38608915/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Biomed%20Inform&title=Leveraging%20generative%20AI%20for%20clinical%20evidence%20synthesis%20needs%20to%20ensure%20trustworthiness&volume=153&publication_year=2024&pages=104640&pmid=38608915&doi=10.1016/j.jbi.2024.104640&)\]
*   6. Berlin JA, Golub RM.  Meta-analysis as evidence: building a better pyramid. Jama. 2014;312:603-605. \[[DOI](https://doi.org/10.1001/jama.2014.8167)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/25117128/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Jama&title=Meta-analysis%20as%20evidence:%20building%20a%20better%20pyramid&volume=312&publication_year=2014&pages=603-605&pmid=25117128&doi=10.1001/jama.2014.8167&)\]
*   7. Cook DJ, Mulrow CD, Haynes RB.  Systematic reviews: synthesis of best evidence for clinical decisions. Ann Intern Med. 1997;126:376-380. \[[DOI](https://doi.org/10.7326/0003-4819-126-5-199703010-00006)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/9054282/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Ann%20Intern%20Med&title=Systematic%20reviews:%20synthesis%20of%20best%20evidence%20for%20clinical%20decisions&volume=126&publication_year=1997&pages=376-380&pmid=9054282&doi=10.7326/0003-4819-126-5-199703010-00006&)\]
*   8. Bastian H, Glasziou P, Chalmers I.  Seventy-five trials and eleven systematic reviews a day: how will we ever keep up?  PLoS Med. 2010;7:e1000326. \[[DOI](https://doi.org/10.1371/journal.pmed.1000326)\] \[[PMC free article](/articles/PMC2943439/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/20877712/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=PLoS%20Med&title=Seventy-five%20trials%20and%20eleven%20systematic%20reviews%20a%20day:%20how%20will%20we%20ever%20keep%20up?&volume=7&publication_year=2010&pages=e1000326&pmid=20877712&doi=10.1371/journal.pmed.1000326&)\]
*   9. Borah R, Brown AW, Capers PL, Kaiser KA.  Analysis of the time and workers needed to conduct systematic reviews of medical interventions using data from the PROSPERO registry. BMJ Open. 2017;7:e012545. \[[DOI](https://doi.org/10.1136/bmjopen-2016-012545)\] \[[PMC free article](/articles/PMC5337708/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28242767/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMJ%20Open&title=Analysis%20of%20the%20time%20and%20workers%20needed%20to%20conduct%20systematic%20reviews%20of%20medical%20interventions%20using%20data%20from%20the%20PROSPERO%20registry&volume=7&publication_year=2017&pages=e012545&pmid=28242767&doi=10.1136/bmjopen-2016-012545&)\]
*   10. Dawes M, Pluye P, Shea L, Grad R, Greenberg A, Nie JY.  The identification of clinically important elements within medical journal abstracts: Patient—Population—Problem, Exposure—Intervention, Comparison, Outcome, Duration and Results (PECODR). Inform Prim Care. 2007;15:9-16. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/17612476/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Inform%20Prim%20Care&title=The%20identification%20of%20clinically%20important%20elements%20within%20medical%20journal%20abstracts:%20Patient%E2%80%94Population%E2%80%94Problem,%20Exposure%E2%80%94Intervention,%20Comparison,%20Outcome,%20Duration%20and%20Results%20\(PECODR\)&volume=15&publication_year=2007&pages=9-16&pmid=17612476&)\]
*   11. Demner-Fushman D, Lin J.  Answering clinical questions with knowledge-based and statistical techniques. Computational Linguistics. 2007;33:63-103. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Computational%20Linguistics&title=Answering%20clinical%20questions%20with%20knowledge-based%20and%20statistical%20techniques&volume=33&publication_year=2007&pages=63-103&)\]
*   12. Chabou S, Iglewski M.  Combination of conditional random field with a rule based method in the extraction of PICO elements. BMC Med Inform Decis Mak. 2018;18:128. \[[DOI](https://doi.org/10.1186/s12911-018-0699-2)\] \[[PMC free article](/articles/PMC6278016/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/30509272/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Inform%20Decis%20Mak&title=Combination%20of%20conditional%20random%20field%20with%20a%20rule%20based%20method%20in%20the%20extraction%20of%20PICO%20elements&volume=18&publication_year=2018&pages=128&pmid=30509272&doi=10.1186/s12911-018-0699-2&)\]
*   13. Jin D, Szolovits P. PICO element detection in medical text via long short-term memory neural networks. In _Proceedings of the BioNLP workshop._ 2018;67-75.
*   14. Graves A, Schmidhuber J.  Framewise phoneme classification with bidirectional LSTM and other neural network architectures. Neural Netw. 2005;18:602-610. \[[DOI](https://doi.org/10.1016/j.neunet.2005.06.042)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/16112549/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Neural%20Netw&title=Framewise%20phoneme%20classification%20with%20bidirectional%20LSTM%20and%20other%20neural%20network%20architectures&volume=18&publication_year=2005&pages=602-610&pmid=16112549&doi=10.1016/j.neunet.2005.06.042&)\]
*   15. Ma X, Hovy E. End-to-end sequence labeling via bi-directional LSTM-CNNs-CRF. In _Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics_ (Volume 1: Long Papers), Berlin, Germany: Association for Computational Linguistics, 2016;1064-1074.
*   16. Jin D, Szolovits P.  Advancing PICO element detection in biomedical text via deep neural networks. Bioinformatics. 2020;36:3856-3862. \[[DOI](https://doi.org/10.1093/bioinformatics/btaa256)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32311009/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Bioinformatics&title=Advancing%20PICO%20element%20detection%20in%20biomedical%20text%20via%20deep%20neural%20networks&volume=36&publication_year=2020&pages=3856-3862&pmid=32311009&doi=10.1093/bioinformatics/btaa256&)\]
*   17. Brockmeier AJ, Ju M, Przybyła P, Ananiadou S.  Improving reference prioritisation with PICO recognition. BMC Med Inform Decis Mak. 2019;19:256. \[[DOI](https://doi.org/10.1186/s12911-019-0992-8)\] \[[PMC free article](/articles/PMC6896258/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31805934/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Inform%20Decis%20Mak&title=Improving%20reference%20prioritisation%20with%20PICO%20recognition&volume=19&publication_year=2019&pages=256&pmid=31805934&doi=10.1186/s12911-019-0992-8&)\]
*   18. Devlin J, Chang MW, Lee K, Toutanova K.  2018. BERT: pre-training of deep bidirectional transformers for language understanding. arXiv, preprint arXiv:181004805, preprint: not peer reviewed
*   19. Lee J, Yoon W, Kim S, et al.  BioBERT: a pre-trained biomedical language representation model for biomedical text mining. Bioinformatics. 2020;36:1234-1240. \[[DOI](https://doi.org/10.1093/bioinformatics/btz682)\] \[[PMC free article](/articles/PMC7703786/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31501885/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Bioinformatics&title=BioBERT:%20a%20pre-trained%20biomedical%20language%20representation%20model%20for%20biomedical%20text%20mining&volume=36&publication_year=2020&pages=1234-1240&pmid=31501885&doi=10.1093/bioinformatics/btz682&)\]
*   20. Liu Y, Ott M, Goyal N, et al.  2019. ROBERTA: a robustly optimized BERT pretraining approach. arXiv, preprint arXiv:190711692, preprint: not peer reviewed
*   21. Beltagy I, Lo K, Cohan A.  2019. SciBERT: a pretrained language model for scientific text. arXiv, preprint arXiv:190310676, preprint: not peer reviewed
*   22. Nye B, Li JJ, Patel R, et al. A corpus with multi-level annotations of patients, interventions and outcomes to support language processing for medical literature.In _Proceedings of the conference. Association for Computational Linguistics_. Meeting 2018 Jul (Vol. 2018, p. 197). NIH Public Access. \[[PMC free article](/articles/PMC6174533/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/30305770/)\]
*   23. Hu Y, Keloth VK, Raja K, Chen Y, Xu H.  Towards precise PICO extraction from abstracts of randomized controlled trials using a section-specific learning approach. Bioinformatics. 2023;39:btad542. \[[DOI](https://doi.org/10.1093/bioinformatics/btad542)\] \[[PMC free article](/articles/PMC10500081/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37669123/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Bioinformatics&title=Towards%20precise%20PICO%20extraction%20from%20abstracts%20of%20randomized%20controlled%20trials%20using%20a%20section-specific%20learning%20approach&volume=39&publication_year=2023&pages=btad542&pmid=37669123&doi=10.1093/bioinformatics/btad542&)\]
*   24. Lee GE, Sun A. A study on agreement in PICO span annotations.In _Proceedings of the 42nd International ACM SIGIR Conference on Research and Development in Information Retrieval_. 2019;1149-1152.
*   25. Abaho M, Bollegala D, Williamson P, Dodd S. Correcting crowdsourced annotations to improve detection of outcome types in evidence based medicine. In KDH@ IJCAI 2019;1-5.
*   26. Dhrangadhariya A, Müller H.  Not so weak PICO: leveraging weak supervision for participants, interventions, and outcomes recognition for systematic review automation. JAMIA Open. 2023;6:ooac107. \[[DOI](https://doi.org/10.1093/jamiaopen/ooac107)\] \[[PMC free article](/articles/PMC9828146/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/36632329/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMIA%20Open&title=Not%20so%20weak%20PICO:%20leveraging%20weak%20supervision%20for%20participants,%20interventions,%20and%20outcomes%20recognition%20for%20systematic%20review%20automation&volume=6&publication_year=2023&pages=ooac107&pmid=36632329&doi=10.1093/jamiaopen/ooac107&)\]
*   27. Sanchez-Graillet O, Witte C, Grimm F, Cimiano P.  An annotated corpus of clinical trial publications supporting schema-based relational information extraction. J Biomed Semantics. 2022;13:14-18. \[[DOI](https://doi.org/10.1186/s13326-022-00271-7)\] \[[PMC free article](/articles/PMC9128209/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35606797/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Biomed%20Semantics&title=An%20annotated%20corpus%20of%20clinical%20trial%20publications%20supporting%20schema-based%20relational%20information%20extraction&volume=13&publication_year=2022&pages=14-18&pmid=35606797&doi=10.1186/s13326-022-00271-7&)\]
*   28. Ahn E, Kang H.  Introduction to systematic review and meta-analysis. Korean J Anesthesiol. 2018;71:103-112. \[[DOI](https://doi.org/10.4097/kjae.2018.71.2.103)\] \[[PMC free article](/articles/PMC5903119/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/29619782/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Korean%20J%20Anesthesiol&title=Introduction%20to%20systematic%20review%20and%20meta-analysis&volume=71&publication_year=2018&pages=103-112&pmid=29619782&doi=10.4097/kjae.2018.71.2.103&)\]
*   29. Mutinda F, Liew K, Yada S, Wakamiya S, Aramaki E. PICO corpus: a publicly available corpus to support automatic data extraction from biomedical literature. In _Proceedings of the first Workshop on Information Extraction from Scientific Publications_ 2022;26-31.
*   30. Adeva JG, Atxa JP, Carrillo MU, Zengotitabengoa EA.  Automatic text classification to support systematic reviews in medicine. Expert Systems with Applications. 2014;41:1498-1508. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Expert%20Systems%20with%20Applications&title=Automatic%20text%20classification%20to%20support%20systematic%20reviews%20in%20medicine&volume=41&publication_year=2014&pages=1498-1508&)\]
*   31. Yang X, Song Z, King I, Xu Z.  A survey on deep semi-supervised learning. IEEE Trans Knowl Data Eng. 2023;35:8934-8954. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=IEEE%20Trans%20Knowl%20Data%20Eng&title=A%20survey%20on%20deep%20semi-supervised%20learning&volume=35&publication_year=2023&pages=8934-8954&)\]
*   32. Yang W, Zhang R, Chen J, Wang L, Kim J. Prototype-guided pseudo labeling for semi-supervised text classification. In _Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics_. 2023;16369-16382.
*   33. Hong S, Noh H, Han B.  Decoupled deep neural network for semi-supervised semantic segmentation. Adv Neural Inform Process Syst. 2015;1495-1503 \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Neural%20Inform%20Process%20Syst&title=Decoupled%20deep%20neural%20network%20for%20semi-supervised%20semantic%20segmentation&volume=1495-1503&publication_year=2015&)\]
*   34. Roli F, Marcialis GL. Semi-supervised PCA-based face recognition using self-training. In: Springer; 2006:560-568. \[[Google Scholar](https://scholar.google.com/scholar_lookup?Roli%20F,%20Marcialis%20GL.%20Semi-supervised%20PCA-based%20face%20recognition%20using%20self-training.%20In:%20Springer;%202006:560-568.)\]
*   35. Bickel S. ECML-PKDD discovery challenge 2006 overview. In ECML-PKDD Discovery Challenge Workshop. 2006;1-9.
*   36. Li M, Li H, Zhou ZH.  Semi-supervised document retrieval. Inform Process Manage. 2009;45:341-355. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Inform%20Process%20Manage&title=Semi-supervised%20document%20retrieval&volume=45&publication_year=2009&pages=341-355&)\]
*   37. Duh K, Kirchhoff K.  Semi-supervised ranking for document retrieval. Comput Speech Lang. 2011;25:261-281. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Comput%20Speech%20Lang&title=Semi-supervised%20ranking%20for%20document%20retrieval&volume=25&publication_year=2011&pages=261-281&)\]
*   38. Erkan G, Özgür A, Radev D. Semi-supervised classification for extracting protein interaction sentences using dependency parsing. In _Proceedings of the 2007 Joint Conference on Empirical Methods in Natural Language Processing and Computational Natural Language Learning (EMNLP-CoNLL)_. 2007;228-237.
*   39. Gu Y, Tinn R, Cheng H, et al.  Domain-specific language model pretraining for biomedical natural language processing. ACM Trans Comput Healthcare (HEALTH). 2021;3:1-23. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=ACM%20Trans%20Comput%20Healthcare%20\(HEALTH\)&title=Domain-specific%20language%20model%20pretraining%20for%20biomedical%20natural%20language%20processing&volume=3&publication_year=2021&pages=1-23&)\]
*   40. Ferreira RE, Lee YJ, Dórea JR.  Using pseudo-labeling to improve performance of deep neural networks for animal identification. Sci Rep. 2023;13:13875. \[[DOI](https://doi.org/10.1038/s41598-023-40977-x)\] \[[PMC free article](/articles/PMC10449823/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37620446/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Rep&title=Using%20pseudo-labeling%20to%20improve%20performance%20of%20deep%20neural%20networks%20for%20animal%20identification&volume=13&publication_year=2023&pages=13875&pmid=37620446&doi=10.1038/s41598-023-40977-x&)\]
*   41. Xie Q, Dai Z, Hovy E, Luong T, Le Q.  Unsupervised data augmentation for consistency training. Adv Neural Inform Process Syst. 2020;33:6256-6268. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Neural%20Inform%20Process%20Syst&title=Unsupervised%20data%20augmentation%20for%20consistency%20training&volume=33&publication_year=2020&pages=6256-6268&)\]
*   42. Zhang W, Lin H, Han X, Sun L. De-biasing distantly supervised named entity recognition via causal intervention. _Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics and the 11th International Joint Conference on Natural Language Processing_. 2021;4803-4813.
*   43. Hu Y, Chen Q, Du J, et al.  Improving large language models for clinical named entity recognition via prompt engineering. J Am Med Inform Assoc. 2024;31:1812-1820. \[[DOI](https://doi.org/10.1093/jamia/ocad259)\] \[[PMC free article](/articles/PMC11339492/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38281112/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Improving%20large%20language%20models%20for%20clinical%20named%20entity%20recognition%20via%20prompt%20engineering&volume=31&publication_year=2024&pages=1812-1820&pmid=38281112&doi=10.1093/jamia/ocad259&)\]
*   44. Zhang G, Zhou Y, Hu Y, Xu H, Weng C, Peng Y.  A span-based model for extracting overlapping PICO entities from randomized controlled trial publications. J Am Med Inform Assoc. 2024;31:1163-1171. \[[DOI](https://doi.org/10.1093/jamia/ocae065)\] \[[PMC free article](/articles/PMC11031223/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38471120/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=A%20span-based%20model%20for%20extracting%20overlapping%20PICO%20entities%20from%20randomized%20controlled%20trial%20publications&volume=31&publication_year=2024&pages=1163-1171&pmid=38471120&doi=10.1093/jamia/ocae065&)\]
*   45. Mutinda FW, Liew K, Yada S, Wakamiya S, Aramaki E.  Automatic data extraction to support meta-analysis statistical analysis: a case study on breast cancer. BMC Med Inform Decis Mak. 2022;22:158. \[[DOI](https://doi.org/10.1186/s12911-022-01897-4)\] \[[PMC free article](/articles/PMC9206132/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35717167/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Inform%20Decis%20Mak&title=Automatic%20data%20extraction%20to%20support%20meta-analysis%20statistical%20analysis:%20a%20case%20study%20on%20breast%20cancer&volume=22&publication_year=2022&pages=158&pmid=35717167&doi=10.1186/s12911-022-01897-4&)\]
*   46. Bird S, Klein E, Loper E.  Natural Language Processing with Python: Analyzing Text with the Natural Language Toolkit. O’Reilly Media, Inc.; 2009. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Natural%20Language%20Processing%20with%20Python:%20Analyzing%20Text%20with%20the%20Natural%20Language%20Toolkit&publication_year=2009&)\]
*   47. Sang EF, Buchholz S.  2000. Introduction to the CoNLL-2000 shared task: Chunking. Fourth Conference on Computational Natural Language Learning and the Second Learning Language in Logic Workshop. 2000;127-132.
*   48. He S, Wang T, Lu Y, et al.  Document Information Extraction via Global Tagging. Springer; 2023:145-158. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Document%20Information%20Extraction%20via%20Global%20Tagging&publication_year=2023&)\]
*   49. Wang G, Liu X, Ying Z, et al.  Optimized glycemic control of type 2 diabetes with reinforcement learning: a proof-of-concept trial. Nat Med. 2023;29:2633-2642. \[[DOI](https://doi.org/10.1038/s41591-023-02552-9)\] \[[PMC free article](/articles/PMC10579102/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37710000/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Med&title=Optimized%20glycemic%20control%20of%20type%202%20diabetes%20with%20reinforcement%20learning:%20a%20proof-of-concept%20trial&volume=29&publication_year=2023&pages=2633-2642&pmid=37710000&doi=10.1038/s41591-023-02552-9&)\]
*   50. Assmann SF, Pocock SJ, Enos LE, Kasten LE.  Subgroup analysis and other (mis) uses of baseline data in clinical trials. Lancet. 2000;355:1064-1069. \[[DOI](https://doi.org/10.1016/S0140-6736\(00\)02039-0)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/10744093/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Lancet&title=Subgroup%20analysis%20and%20other%20\(mis\)%20uses%20of%20baseline%20data%20in%20clinical%20trials&volume=355&publication_year=2000&pages=1064-1069&pmid=10744093&doi=10.1016/S0140-6736\(00\)02039-0&)\]
*   51. Bhandari M, Devereaux PJ, Li P, et al.  Misuse of baseline comparison tests and subgroup analyses in surgical trials. Clin Orthop Relat Res. 2006;447:247-251. \[[DOI](https://doi.org/10.1097/01.blo.0000218736.23506.fe)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/16672904/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Clin%20Orthop%20Relat%20Res&title=Misuse%20of%20baseline%20comparison%20tests%20and%20subgroup%20analyses%20in%20surgical%20trials&volume=447&publication_year=2006&pages=247-251&pmid=16672904&doi=10.1097/01.blo.0000218736.23506.fe&)\]
*   52. Nakayama H. A Python framework for sequence labeling evaluation (named-entity recognition, pos tagging, etc) \[Internet\]. 2018. [https://github.com/chakki-works/seqeval](https://github.com/chakki-works/seqeval). Accessed February 18, 2024.
*   53. Heddes J, Meerdink P, Pieters M, Marx M.  The automatic detection of dataset names in scientific articles. Data. 2021;6:84. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Data&title=The%20automatic%20detection%20of%20dataset%20names%20in%20scientific%20articles&volume=6&publication_year=2021&pages=84&)\]
*   54. Seki K, Mostafa J.  A probabilistic model for identifying protein names and their name boundaries. Proc IEEE Comput Soc Bioinform Conf. 2003;2:251-258. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/16452800/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Proc%20IEEE%20Comput%20Soc%20Bioinform%20Conf&title=A%20probabilistic%20model%20for%20identifying%20protein%20names%20and%20their%20name%20boundaries&volume=2&publication_year=2003&pages=251-258&pmid=16452800&)\]
*   55. Banitalebi-Dehkordi A. Knowledge distillation for low-power object detection: a simple technique and its extensions for training compact models using unlabeled data. _2021 IEEE/CVF International Conference on Computer Vision Workshops (ICCVW)._ 2021;769-778.
*   56. Chen Y, Tan X, Zhao B. Boosting semi-supervised learning by exploiting all unlabeled data. _2023 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)._ 2023;7548-7557.
*   57. Oliver A, Odena A, Raffel CA, Cubuk ED, Goodfellow I.  Realistic evaluation of deep semi-supervised learning algorithms. Adv in Neural Inform Process Syst. 2018:3239-3250. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20in%20Neural%20Inform%20Process%20Syst&title=Realistic%20evaluation%20of%20deep%20semi-supervised%20learning%20algorithms&publication_year=2018&pages=3239-3250&)\]
*   58. Singh A, Nowak R, Zhu J.  Unlabeled data: now it helps, now it doesn’t. Adv Neural Inform Process Syst. 2008;1513-1520. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Neural%20Inform%20Process%20Syst&title=Unlabeled%20data:%20now%20it%20helps,%20now%20it%20doesn%E2%80%99t&volume=1513-1520.&publication_year=2008&)\]
*   59. Hu Y, Chen Y, Xu H.  Towards more generalizable and accurate sentence classification in medical abstracts with less data. J Healthc Inform Res. 2023;7:542-556. \[[DOI](https://doi.org/10.1007/s41666-023-00141-6)\] \[[PMC free article](/articles/PMC10620359/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37927376/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Healthc%20Inform%20Res&title=Towards%20more%20generalizable%20and%20accurate%20sentence%20classification%20in%20medical%20abstracts%20with%20less%20data&volume=7&publication_year=2023&pages=542-556&pmid=37927376&doi=10.1007/s41666-023-00141-6&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae326\_Supplementary\_Data

[ocae326\_supplementary\_data.pdf](/articles/instance/11833487/bin/ocae326_supplementary_data.pdf) (1.1MB, pdf)

### Data Availability Statement

The data and codes underlying the study will be available upon request.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**