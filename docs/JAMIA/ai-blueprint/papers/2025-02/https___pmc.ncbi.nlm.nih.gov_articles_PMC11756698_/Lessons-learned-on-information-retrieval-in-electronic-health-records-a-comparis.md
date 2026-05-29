J Am Med Inform Assoc

. 2024 Dec 20;32(2):357–364. doi: [10.1093/jamia/ocae308](https://doi.org/10.1093/jamia/ocae308)

# Lessons learned on information retrieval in electronic health records: a comparison of embedding models and pooling strategies

[Skatje Myers](https://pubmed.ncbi.nlm.nih.gov/?term="Myers%20S"[Author])

### Skatje Myers, PhD

1 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

Find articles by [Skatje Myers](https://pubmed.ncbi.nlm.nih.gov/?term="Myers%20S"[Author])

1,✉, [Timothy A Miller](https://pubmed.ncbi.nlm.nih.gov/?term="Miller%20TA"[Author])

### Timothy A Miller, PhD

2 Computational Health Informatics Program, Boston Children’s Hospital, Boston, MA 02215, United States

3 Department of Pediatrics, Harvard Medical School, Boston, MA 02215, United States

Find articles by [Timothy A Miller](https://pubmed.ncbi.nlm.nih.gov/?term="Miller%20TA"[Author])

2,3, [Yanjun Gao](https://pubmed.ncbi.nlm.nih.gov/?term="Gao%20Y"[Author])

### Yanjun Gao, PhD

4 Department of Biomedical Informatics, University of Colorado-Anschutz, Aurora, CO 80045, United States

Find articles by [Yanjun Gao](https://pubmed.ncbi.nlm.nih.gov/?term="Gao%20Y"[Author])

4,2, [Matthew M Churpek](https://pubmed.ncbi.nlm.nih.gov/?term="Churpek%20MM"[Author])

### Matthew M Churpek, MD, PhD

5 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

Find articles by [Matthew M Churpek](https://pubmed.ncbi.nlm.nih.gov/?term="Churpek%20MM"[Author])

5, [Anoop Mayampurath](https://pubmed.ncbi.nlm.nih.gov/?term="Mayampurath%20A"[Author])

### Anoop Mayampurath, PhD

6 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

Find articles by [Anoop Mayampurath](https://pubmed.ncbi.nlm.nih.gov/?term="Mayampurath%20A"[Author])

6, [Dmitriy Dligach](https://pubmed.ncbi.nlm.nih.gov/?term="Dligach%20D"[Author])

### Dmitriy Dligach, PhD

7 Department of Computer Science, Loyola University Chicago, Chicago, IL 60626, United States

Find articles by [Dmitriy Dligach](https://pubmed.ncbi.nlm.nih.gov/?term="Dligach%20D"[Author])

7, [Majid Afshar](https://pubmed.ncbi.nlm.nih.gov/?term="Afshar%20M"[Author])

### Majid Afshar, MD, MSCR

8 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

Find articles by [Majid Afshar](https://pubmed.ncbi.nlm.nih.gov/?term="Afshar%20M"[Author])

8

*   Author information
*   Article notes
*   Copyright and License information

1 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

2 Computational Health Informatics Program, Boston Children’s Hospital, Boston, MA 02215, United States

3 Department of Pediatrics, Harvard Medical School, Boston, MA 02215, United States

4 Department of Biomedical Informatics, University of Colorado-Anschutz, Aurora, CO 80045, United States

5 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

6 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

7 Department of Computer Science, Loyola University Chicago, Chicago, IL 60626, United States

8 Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States

✉

Corresponding author: Skatje Myers, PhD, Department of Medicine, University of Wisconsin-Madison, 610 Walnut St. #513, Madison, WI 53726, United States (skatje.myers@wisc.edu)

2

Work performed at the University of Wisconsin-Madison.

Received 2024 Jul 25; Revised 2024 Oct 30; Accepted 2024 Nov 27; Collection date 2025 Feb.

© The Author(s) 2024. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For permissions, please email: journals.permissions@oup.com

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC11756698  PMID: [39703187](https://pubmed.ncbi.nlm.nih.gov/39703187/)

## Abstract

### Objectives

Applying large language models (LLMs) to the clinical domain is challenging due to the context-heavy nature of processing medical records. Retrieval-augmented generation (RAG) offers a solution by facilitating reasoning over large text sources. However, there are many parameters to optimize in just the retrieval system alone. This paper presents an ablation study exploring how different embedding models and pooling methods affect information retrieval for the clinical domain.

### Materials and Methods

Evaluating on 3 retrieval tasks on 2 electronic health record (EHR) data sources, we compared 7 models, including medical- and general-domain models, specialized encoder embedding models, and off-the-shelf decoder LLMs. We also examine the choice of embedding pooling strategy for each model, independently on the query and the text to retrieve.

### Results

We found that the choice of embedding model significantly impacts retrieval performance, with BGE, a comparatively small general-domain model, consistently outperforming all others, including medical-specific models. However, our findings also revealed substantial variability across datasets and query text phrasings. We also determined the best pooling methods for each of these models to guide future design of retrieval systems.

### Discussion

The choice of embedding model, pooling strategy, and query formulation can significantly impact retrieval performance and the performance of these models on other public benchmarks does not necessarily transfer to new domains. The high variability in performance across different query phrasings suggests that the choice of query may need to be tuned and validated for each task, or even for each institution’s EHR.

### Conclusion

This study provides empirical evidence to guide the selection of models and pooling strategies for RAG frameworks in healthcare applications. Further studies such as this one are vital for guiding empirically-grounded development of retrieval frameworks, such as in the context of RAG, for the clinical domain.

**Keywords:** natural language processing, text embedding, electronic health records, information retrieval

## Introduction

Large language models (LLMs) have demonstrated remarkable performance on a wide range of natural language processing tasks, showcasing their potential to advance various domains. However, bringing this benefit to the clinical domain poses significant challenges. The number of progress reports, radiology reports, and other clinical notes in the electronic health record (EHR) that build up over the course of a patient’s hospitalization can quickly exceed most current LLM context windows. Furthermore, the utilization of the full context window can cause LLMs to suffer from the _lost-in-the-middle_ effect,[1](#ocae308-B1) where their ability to utilize information towards the middle of the context decreases as the length of the text increases.

Retrieval-augmented generation (RAG)[2](#ocae308-B2) has emerged as a promising technique for enabling reasoning over large text sources. This approach allows for the retrieval of relevant passages to provide as context within the prompt for the generated response. This reduces the prompt size and has also been shown to enhance accuracy in various applications dealing with expansive textual data.[3](#ocae308-B3)

While the generative LLM component can be easily upgraded as new models are released, creating the vector database that stores the embedded documents is an expensive investment at scale and not as trivially replaceable. It is, therefore, vital that the decisions made in designing the retrieval pipeline are well-grounded. For example, one must select a suitable model to create text embeddings, and while public benchmarks such as Massive Text Embedding Benchmark (MTEB)[4](#ocae308-B4) exist, there is no guarantee that the highest performing models were not influenced by data contamination[5](#ocae308-B5) or that they perform well for other domains or texts of other lengths. Furthermore, the optimal choice of embedding pooling method may vary depending on factors such as model architecture, length of text, and the nature of the text. The security around protected health information often requires healthcare organizations to develop and validate tools in-house, rather than using vendor solutions or closed-source models. This makes empirical evaluation of open-source components especially important for the clinical domain.

In this paper, we aim to provide a better understanding of the effects of some of these early decisions on the performance of information retrieval over unstructured EHR. While general-domain retrieval systems are well-studied, the unique characteristics of EHR text demand specialized evaluation. We constructed 3 novel clinically relevant tasks to retrieve the patient’s primary diagnosis, antibiotic medications, and the notable procedures that occurred during the encounter. We created datasets for 2 sources to examine reproducibility: the publicly available MIMIC-III and a private EHR source. These tasks allowed us to perform comprehensive ablation studies over recent models and varying embedding pooling methods. This pipeline is illustrated in [Figure 1](#ocae308-F1).

### Figure 1.

[![Graphical representation of the pipeline of chunking clinical notes, embedding them, and then ranking them by similarity to the embedding of the query “What is the primary diagnosis?”.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/ec62/11756698/9f84f78410f3/ocae308f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756698_ocae308f1.jpg)

[Open in a new tab](figure/ocae308-F1/)

Process of embedding and querying clinical notes.

We provide a thorough testing of embedding pooling methods independently on the query and note text, providing statistically verified recommendations on pooling methods to be used for each tested model on the larger text chunks, though we found the choice of pooling strategy for queries to be less significant.

In our comparison of embedding models, both those explicitly trained for text representation and decoder-only models, we find that the choice of embedding model significantly impacts retrieval performance, with BGE,[6](#ocae308-B6) a comparatively small general-domain model, consistently outperforming all others, including medical-specific models and 2 models which are ranked higher on MTEB. However, our findings also reveal substantial variability across datasets and query text phrasings, highlighting the difficulty in developing a robust retrieval system for novel datasets and tasks.

## Statement of significance

### Problem

Applying LLMs to EHRs is challenging due to the vast amount of text per patient, often exceeding LLM context limits. While RAG shows promise in addressing this, the optimal configurations for the retrieval step—specifically, embedding models and pooling strategies—remains unclear in the clinical domain.

### What is already known

Public benchmarks exist for evaluating embedding models, but their performance on these benchmarks may not translate directly to other domains. Additionally, optimal pooling strategies for embedding models may vary depending on nature and length of the text to represent. The impact of these factors on information retrieval performance for EHR in particular remains understudied.

### What this paper adds

This study provides a systematic comparison of 7 embedding models, including both general-domain and medical-specific models, across 3 clinical information retrieval tasks using 2 distinct EHR data sources. Our findings offer empirical evidence on the performance of different embedding models and pooling strategies in the clinical domain, providing guidance for optimizing retrieval systems for EHR and highlighting the need for domain-specific evaluation.

## Related work

In a similar vein to our work, Aperdannier et al[7](#ocae308-B7) provided a rich comparison of embedding models for the search of German-language insurance text. They tested different document splitting methods, chunk sizes, and models. The pooling method was not a variable they included, instead using mean pooling for all experiments. Our experiments tested different models and tasks than their work, which found the closed source OpenAI text-embedding-ada-002 model[8](#ocae308-B8) to perform best. Although their systematic comparison provided valuable insights for German-language insurance text retrieval, the transferability of these findings to clinical contexts remains unclear.

The dearth of best practices for the various components of RAG systems, specifically in the clinical domain, has been recently addressed by the MedRAG toolkit.[9](#ocae308-B9) This toolkit allows for convenient swapping of components—the text to search over, the retrieval method, and LLMs for generation. They evaluated a number of permutations on their newly proposed Mirage benchmark, which is comprised of 5 medical question-answering corpora, although none incorporate EHR documents. In contrast, our work is concerned primarily with EHR documents, and our methodological focus is on optimizing the retrieval step before the introduction of the numerous decisions that go into the generative process of the framework.

## Methods

### Tasks

We designed 3 information retrieval tasks to test on 2 EHR data sources, motivated by future use cases of generating a discharge summary for a hospital encounter or question answering. To evaluate the efficacy of retrieval approaches for these tasks, we developed a semi-automatic approach for generating labeled data.

Each hospital encounter consists of a discharge summary and the unstructured notes for the hospitalization that temporally preceded it. We identified 3 types of information of interest:

1.  Primary diagnosis (eg, _aspiration pneumonia_, _type 2 diabetes_)
    
2.  Antibiotics (eg, _amoxicillin_, _doxycycline_)
    
3.  Invasive/surgical procedures (eg, _left ICA endarterectomy_, _flexible bronchoscopy_)
    

For the antibiotic task, we automatically mapped the text to medical concepts from the National Library of Medicine’s Unified Medical Language System (UMLS) with semantic type T195 (Antibiotics) within the notes using the tool QuickUMLS[10](#ocae308-B10) and treated all such mentions as the target for retrieval.

For the primary diagnosis and surgical procedure tasks, we aimed to simulate the use case of generating a discharge summary through a RAG framework by specifically targeting the ground truth found in the summary. For each encounter, we attempted to extract the primary diagnosis and the surgical procedures sections from the summary using regular expressions. For encounters where this information was available, we then identified mentions of the target diagnosis and procedures within the rest of the notes as our retrieval goals.

Due to the frequent use of acronyms and the numerous ways of expressing the same medical concept, we needed to employ a fuzzy matching technique to find these mentions. We first employed QuickUMLS to identify UMLS concepts within the text as potential matches, restricting by appropriate semantic types ([Table 1](#ocae308-T1)). In the case of the primary diagnosis, we calculated the cosine similarity between the BioLORD-2023[11](#ocae308-B11) embedding of the known diagnosis and that of each of the UMLS entity spans. If the similarity was ≥0.6, this was considered a positive match. This threshold value was determined after manual review of similarity scores from 0.2 to 1.0 of several encounters for both the diagnosis and procedures tasks. This allowed the ground-truth diagnosis “Left forearm cellulitis” to match with “cellulitis of left upper extremity” (0.89) and “cellulitis of left forearm” (0.99) and the diagnosis “R femoral neck fracture” to match with “femoral neck fx” (0.67). Entities with similarity scores closer to 0.2 were typically unrelated (in the case of “Left forearm cellulitis,” this included “hyperlipidemia” \[0.21\]), while those from 0.3 to under 0.6 were typically related conditions or anatomical locations (“left arm” \[0.53\], “the forearm laceration” \[0.58\]), and sometimes descriptions of the target with less specificity (“cellulitis” \[0.53\]). In this latter case, we acknowledge that using 0.6 as the cutoff can result in false negatives, but we prioritized constructing the dataset with less noise by avoiding false positives.

#### Table 1.

Allowable semantic types when identifying mentions of the target.

|  | Valid UMLS types |
| --- | --- |
| Diagnosis | T047, T046, T191, T190, T184, T033, T037 |
| Antibiotics | T195 |
| Procedures | T061, T060 |

[Open in a new tab](table/ocae308-T1/)

UMLS = Unified Medical Language System.

In the case of surgical procedures, where the ground truth section of the discharge summary typically contained more free text, we identified the procedures from the section using QuickUMLS and considered mentions within the rest of the encounter notes to be matches if their BioLORD-2023 embeddings were similar to any of the procedure entities.

We note that it should not be expected that any retrieval method achieves a perfect score for the “diagnosis” and “procedures” tasks. The understanding, for instance, of _which_ diagnosis is the primary diagnosis is not necessarily represented in text embeddings, merely that the text contains _a_ diagnosis. Additionally, not all invasive procedures are noted in the discharge summary, and therefore, “incorrect” procedures mentioned in the text may be ranked highly. In a RAG framework, the generative step would provide this reasoning. The design of these tasks is intended to facilitate using the same datasets for future work that explores the relation between performance on retrieval and the final performance of a RAG system.

### Datasets

We used 2 data sources to construct the testing data for each task independently—private EHR sourced from the University of Wisconsin (UW) hospital and the publicly available MIMIC-III dataset.[12](#ocae308-B12)

Our task datasets consist of varying numbers of patient encounters, which are comprised of all available notes prior to the discharge summary for a given hospital encounter. These notes were segmented into chunks of a maximum of 256 token lengths, with a sliding overlap window of 50. To determine the necessary sample size of our datasets, we used the Sample Size Calculator for Evaluations (SLiCE),[13](#ocae308-B13) which uses predefined confidence intervals and levels to calculate the minimum sample size required for robust metrics of performance that are adequately powered to detect a statistical difference. With a maximally conservative setting of precision and recall of 0.5 and the variance around the 95% confidence level set to 0.05, for all 6 datasets we exceeded the required sample size to meet these criteria by at least 38%.

For computational practicality, we limited our consideration of the UW dataset to encounters of 5 days or less in length of stay. Even with this restriction, the encounters included were comprised of 5245 to 63 376 tokens each, highlighting the importance of retrieval solutions for the clinical domain. We described the dataset statistics further in [Table 2](#ocae308-T2). There was some variance between the UW data and MIMIC-III in the prevalence of relevant note chunks that contain the target information. Additionally, MIMIC-III typically consisted of fewer tokens than those in the UW data.

#### Table 2.

Statistics about the 6 datasets.

|  | Diagnosis | Procedures | Antibiotics |
| --- | --- | --- | --- |
|  | MIMIC-III |  |  |
| \# encounters | 20 | 15 | 15 |
| Avg notes/enc. | 19.7 | 25.7 | 33.4 |
| Avg tokens/enc. | 11 569 | 15 250 | 20 012 |
| \# chunks | 3503 | 3501 | 4557 |
| Relevant chunks | 18.2% | 36.1% | 14.9% |
|  | UW |  |  |
| \# encounters | 10 | 10 | 10 |
| Avg notes/enc. | 42.7 | 46 | 47.7 |
| Avg tokens/enc. | 24 684 | 31 793 | 29 468 |
| \# chunks | 3956 | 5208 | 4741 |
| Relevant chunks | 17.62% | 10.62% | 11.79% |

[Open in a new tab](table/ocae308-T2/)

“Relevant chunks” are those that contain at least one occurrence of the target information, such as the primary diagnosis.

### Models and pooling methods

Although there is a wide array of language models available today, practical constraints limit the number of models we were able to evaluate. We aimed to cover a diverse set of models in our study, including both medical- and general-domain models, as well as encoder models specialized for text embeddings and decoder-only architectures.

We included 4 models designed for embedding representations:

*   BGE-en-large-v1.5[6](#ocae308-B6) (335M parameters): A general-purpose BERT-based embedding model trained through contrastive learning.
    
*   Gatortron-large[14](#ocae308-B14) (8.9B parameters): A clinical BERT model trained on a large amount of EHR and PubMed. Note: A small portion of the pre-training data was text from MIMIC-III.
    
*   SFR-Embedding-Mistral[15](#ocae308-B15): A further fine-tuned version of E5-Mistral-7B-Instruct,[16](#ocae308-B16) which is a fine-tuned Mistral-7B-Instruct trained on synthetic data through contrastive loss.
    
*   LLM2Vec-Meta-Llama-3-8B-Instruct-mntp-supervised[17](#ocae308-B17): This model modified the Llama-3-8B-Instruct model to enable bi-directional attention and trained it with their novel masked next token prediction method.
    

We included 3 generative decoder-only models:

*   Llama-3-8B-Instruct[18](#ocae308-B18)
    
*   Mistral-7B-Instruct[19](#ocae308-B19)
    
*   BioMistral[20](#ocae308-B20): A version of Mistral-7B-Instruct which has been further pre-trained on PubMed Central.
    

Our goal in selecting these models was to compare several facets: (1) how recent general-purpose decoder-only models (Llama-3-8B, Mistral-7B) perform against popular embedding models used for RAG applications (BGE, SFR-Embedding-Mistral), (2) how well those decoder-only models perform against their embedding-tuned counterparts (SFR-Embedding-Mistral, LLM2Vec-Llama-3), and (3) how models trained for the biomedicine domain (Gatortron, BioMistral) compare to the other general-domain models.

Due to the datasets containing PHI and being subject to a data use agreement, we did not evaluate on any closed source models.

For each model, we used between 4 and 7 different phrasings of the query per task, constructed to be simple and intuitive and without system prompting or extensive tuning in order to provide a generalizable statistical approximation of using these configurations in new use cases. These queries include the most concise formulation of the question (eg, “antibiotics”), an expanded version (eg, “antibiotic medications”), a complete question (eg, “What antibiotics are the patient taking?”), and a query that uses a prompting structure (eg, “The antibiotics the patient is taking are”), based on Ref.[21](#ocae308-B21) The full list of queries are available in [Tables S4-S6](#sup1).

In order to extract text embeddings from these models, we must pool the last hidden layer. We investigate the established strategies used for pooling text embeddings (mean pooling, weighted mean pooling, max pooling, the last token, and the CLS token) to determine the optimal method for each model. While there is no established method to extract embeddings from decoder-only models, a subset of the tested models were trained to use a particular pooling method. SFR-Embedding-Mistral and LLM2Vec-Llama-3 were both trained to use their own particular query formats, with the embedding derived from either the final token or from mean pooling, respectively. BGE and Gatortron were trained to use a CLS token, with BGE also trained to use a particular query prompt. Because the data that these models were trained on may not match the length or domain of the text that we are embedding, we chose to go beyond these to consider other query formats and test all models on mean pooling, weighted mean pooling, and max pooling. For BGE and Gatortron, we also tested using the CLS token, and for the models where this is not used, we tested using the last token. We assessed the pooling strategy on note chunks and queries independently.

### Evaluation plan

The final step was ranking the note embeddings by cosine similarity to the query embedding and evaluate the ranking by average precision, where a note chunk that contains a mention of the target information is considered a positive instance.

We calculated the success of the various configuration permutations using mean average precision (MAP). The average precision of a ranked list of chunks is an approximation of the Area Under the Precision-Recall Curve. By performing a repeated measures analysis of variance (ANOVA) for each model, we found that the pooling method for the note chunks has a significant effect on performance and, therefore, aim to control for this in our later comparisons.

For each model, we determined the most robust note pooling strategies across all experiments by performing a post-hoc pairwise Tukey’s test between the different strategies to examine the significance of the differences between them. For our further evaluations, we examined the experiments that use each model/dataset’s best pooling method. We also compared performance to a baseline of randomly ordered note chunks using a 1-sample t-test.

Through these permutations of models, datasets, queries, query pooling methods, and note pooling methods, we have tested 3488 configurations on their ability to retrieve the chunks of clinical notes that contain information relevant to the task target.

## Results

In [Figures 2](#ocae308-F2) and [3](#ocae308-F3), we present our findings on the best _note_ embedding pooling strategies for each model by dataset, across all queries and tasks. These results were largely consistent between the datasets, although we found some notable divergences. The “last token” method for SFR-Embedding-Mistral, which is its original training method, performed similarly to “weighted mean” and “mean” on the UW dataset, while its performance was better on MIMIC-III, albeit still not significantly better than mean pooling. Similarly, for LLM2Vec-Llama-3 we also only see a significant performance gain from using its training method (“mean,” but also “weighted mean”) over the other options on the MIMIC-III data. While BGE was trained to use a CLS token, “mean” and “weighted mean” are the consistently high performing methods between the datasets. Through the same testing method, we found that the query pooling method has an insignificant effect on performance for most models.

### Figure 2.

[![Grouped bar graph showing relative performance between each pooing method for each model on the MIMIC-III dataset.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/ec62/11756698/0895b8f08a80/ocae308f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756698_ocae308f2.jpg)

[Open in a new tab](figure/ocae308-F2/)

Performance of models based on _note pooling_ strategy on MIMIC-III data. \* denotes methods not statistically different (_P_ < .05) from the method with the highest mean. If the model was trained to produce embeddings with a certain pooling method, this is denoted with a red star. 95% confidence intervals were generated by bootstrapping 1000 samples.

### Figure 3.

[![Grouped bar graph showing relative performance between each pooing method for each model on the UW dataset.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/ec62/11756698/707661982d4d/ocae308f3.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756698_ocae308f3.jpg)

[Open in a new tab](figure/ocae308-F3/)

Performance of models based on _note pooling_ strategy on UW data. \* denotes methods not statistically different (_P_ < .05) from the method with the highest mean. If the model was trained to produce embeddings with a certain pooling method, this is denoted with a red star. 95% confidence intervals were generated by bootstrapping 1000 samples.

In [Table 3](#ocae308-T3), we present the mean average precision for the different models, using only the best note pooling strategy for each model, across the various query/query pooling configurations. It should be noted that, due to the prevalence of the target information being different between datasets, these scores should not be directly interpreted as whether models perform better on one type of data than the other. With MIMIC-III having a higher prevalence of relevant information for all 3 tasks, higher scores on that dataset are expected.

### Table 3.

Mean average precision \[95% CI\] for the models across the queries, with the highest performance for each dataset denoted in bold text.

|  | University of Wisconsin | MIMIC-III |
| --- | --- | --- |
| BGE-large-en | 0.403 \[0.385, 0.421\] | 0.475 \[0.457, 0.493\] |
| BioMistral | 0.276 \[0.255, 0.298\] | 0.328 \[0.300, 0.357\] |
| Gatortron-large | 0.191 \[0.184, 0.198\] | 0.270 \[0.241, 0.298\] |
| Llama3-8B-Instruct | 0.313 \[0.292, 0.334\] | 0.359 \[0.332, 0.385\] |
| LLM2Vec-Llama-3-8B | 0.229 \[0.207, 0.251\] | 0.422 \[0.408, 0.437\] |
| Mistral-7B-Instruct | 0.258 \[0.239, 0.278\] | 0.362 \[0.336, 0.387\] |
| SFR-Embedding-Mistral | 0.302 \[0.283, 0.322\] | 0.417 \[0.394, 0.439\] |

[Open in a new tab](table/ocae308-T3/)

BGE had a mean average precision of 0.403 across the tasks for the UW dataset and 0.475 for the MIMIC datasets. These results were significantly (_P_ < .05) better than all other models tested. On the other end of the spectrum, we found Gatortron to perform significantly (_P_ < .05) worse than all other models on the UW dataset and all models other than LLM2Vec-Llama-3-8B on the UW dataset.

Performance differences among the remaining models were less pronounced, with overlapping confidence intervals in some cases. LLM2Vec-Meta-Llama-3-8B, which was based on Llama3-8B-Instruct, performed significantly better than its base model on the MIMIC-III data, but significantly worse on the UW data. However, SFR-Embedding-Mistral significantly outperformed Mistral-7B-Instruct on both datasets.

Interestingly, we found no significant difference between the performance of Mistral-7B-Instruct and its medical domain counterpart, BioMistral (_P_ = .91 and 0.50 on UW and MIMIC-III datasets, respectively).

Overall, most models improved over the baseline of randomly ranking the note chunks, with a few exceptions. After performing 1-sample t-tests against the random baseline for each dataset and task, with Bonferroni correction applied to control for multiple comparisons, we found that Gatortron performed significantly _worse_ than baseline (adjusted ) for the MIMIC-III “diagnosis” task and not significantly different from baseline on UW “procedures” (adjusted _P_ = 1). BioMistral, Mistral-Instruct, and LLM2Vec-Llama-3 also did not differ from the baseline for MIMIC-III “diagnosis” (adjusted _P_ = 1 in all cases), and furthermore, LLM2Vec-Llama-3 performed significantly worse (adjusted ) on UW “diagnosis” and did not differ from the baseline (adjusted _P_ = 1) on UW “procedures.”

We found that performance was very sensitive to the phrasing of the query, potentially even dropping it below baseline. For instance, using “primary diagnosis” with Llama3-8B-Instruct and mean pooling, the average precision was 27.44. Simply changing the query to “patient’s primary diagnosis” drastically improved retrieval to 36.68. Furthermore, we did not observe the use of the query prompt formats for BGE, SFR-Embedding-Mistral, and LLM2Vec-Llama-3 to provide consistent benefit compared with those without the format. In [Figures 4](#ocae308-F4) and [5](#ocae308-F5), we present box plots to illustrate the distribution of scores for each model and task, focusing only on the experiments where the note pooling method is the ideal method for the given model and dataset. We observed that the UW dataset experiences more variability compared to MIMIC, regardless of model or task.

### Figure 4.

[![Box-and-whisker plots of the distributions for each model + task combination for MIMIC-III, showing the range of performance of all the queries + query pooling strategies tested.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/ec62/11756698/3718f8383c34/ocae308f4.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756698_ocae308f4.jpg)

[Open in a new tab](figure/ocae308-F4/)

Boxes represent the interquartile range (IQR) of mean average precision scores for different query/query pooling samples for the different tasks and models on the MIMIC-III data, with the median marked. Whiskers extend to 1.5\*IQR; outliers are shown as individual points. The dashed line is a baseline of random ordering of note chunks.

### Figure 5.

[![Box-and-whisker plots of the distributions for each model + task combination for UW data, showing the range of performance of all the queries + query pooling strategies tested.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/ec62/11756698/5b2370d8fbf2/ocae308f5.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756698_ocae308f5.jpg)

[Open in a new tab](figure/ocae308-F5/)

Boxes represent the interquartile range (IQR) of mean average precision scores for different query/query pooling samples for the different tasks and models on the UW data, with the median marked. Whiskers extend to 1.5\*IQR; outliers are shown as individual points. The dashed line is a baseline of random ordering of note chunks.

## Discussion

In this study, we examined the impact of embedding methods for a RAG framework by examining various language models for embedding a corpus of clinical text and pooling methods for information retrieval on clinical tasks using both private and publicly available datasets. Our results demonstrated that BGE significantly outperformed all other models tested, despite scoring lower on the MTEB benchmark compared to SFR-Embedding-Mistral (54.29 vs 59 nDCG@10 on retrieval tasks) and LLM2Vec-Llama-3 (56.63), as well as being smaller than all other models tested. This discrepancy between benchmark performance and our evaluation underscores the importance of domain-specific assessments when deploying models in new contexts.

We tested 2 embedding models that are adapted from decoder-only LLMs. We found that the LLM2Vec-Llama-3 model performed significantly better than its base model on the MIMIC-III data, but significantly worse on the UW data, which raises concerns for generalizability of this type of adaptation. However, SFR-Embedding-Mistral significantly outperformed its base model Mistral-7B-Instruct on both datasets.

We also found substantial variability in the success of different queries, where small variations to the phrasing can result in drastically different performance. We also found that the best performing queries do not consistently rank highest across datasets. These findings indicate that the query for a RAG use case may need to be tuned and validated, not just for the task, but for optimal performance on a given institution’s clinical documentation. Additionally, the more pronounced variability on the UW dataset compared to MIMIC-III warrants further exploration to understand the factors contributing to this difference.

Given the resources and time needed to perform over 3000 experiments, which took multiple days on a single NVIDIA A100 GPU with 80 GB of RAM, we left several components of an RAG framework for future work. One important factor is the decision on how to break the data into chunks. Typical approaches include segmenting based on formatting (such as headers and paragraph breaks) or simply choosing a chunk size that fits within the embedding model’s context limit. The length of these segments may significantly impact the performance of retrieval, either due to models’ capability of representing larger amounts of text or their downstream effect on a generative model once retrieved.

### Limitations

There are many other popular models for embeddings that we did not test, such as those in the GTE family,[22](#ocae308-B22) as well as other medical-domain models, such as Meditron.[23](#ocae308-B23) Due to legal and ethical restrictions on sharing the EHR data we use, we were unable to test on many of the popular closed-source models that are currently used, such as OpenAI’s text-embedding family of models[8](#ocae308-B8) or Voyage AI’s.[24](#ocae308-B24) Furthermore, for this reason, the UW data we evaluated on cannot be publicly released for the community to reproduce our results.

In the absence of extensive human annotation of all relevant mentions of the target diagnoses, antibiotics, and procedures, we rely on automated approaches for the identification of target information within all the notes in the encounters. While we have manually vetted a subset of the outputs of these processes to ensure they meet a reasonable threshold of accuracy, they can produce false negatives and positives that impact evaluation.

## Conclusions

In conclusion, our ablation study underscores the importance of carefully selecting and evaluating components when designing retrieval systems for the clinical domain. The choice of embedding model, pooling strategy, and query formulation can significantly impact retrieval performance, and further empirical studies like this one are crucial for making informed decisions that guide us toward more robust and effective retrieval systems. As the information in EHRs continues to grow exponentially, retrieval systems and vector databases that are scalable and reproducible in quality are becoming a viable solution to the information overload and note bloat problem.[25](#ocae308-B25) Our initial work highlights the variants that can occur in the embedding quality and indexing for the later generative component of a RAG framework.

## Supplementary Material

ocae308\_Supplementary\_Data

[ocae308\_supplementary\_data.docx](/articles/instance/11756698/bin/ocae308_supplementary_data.docx) (16.8KB, docx)

## Contributor Information

Skatje Myers, Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States.

Timothy A Miller, Computational Health Informatics Program, Boston Children’s Hospital, Boston, MA 02215, United States; Department of Pediatrics, Harvard Medical School, Boston, MA 02215, United States.

Yanjun Gao, Department of Biomedical Informatics, University of Colorado-Anschutz, Aurora, CO 80045, United States.

Matthew M Churpek, Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States.

Anoop Mayampurath, Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States.

Dmitriy Dligach, Department of Computer Science, Loyola University Chicago, Chicago, IL 60626, United States.

Majid Afshar, Department of Medicine, University of Wisconsin-Madison, Madison, WI 53726, United States.

## Author contributions

Skatje Myers (Writing—original draft, Methodology, Data curation, Investigation, Conceptualization, Formal analysis, Software), Timothy A. Miller (Writing—review and editing, Methodology, Conceptualization, Funding acquisition, Supervision), Yanjun Gao (Methodology, Writing—review and editing), Matthew Churpek (Methodology, Writing—review and editing), Anoop Mayampurath (Methodology, Writing—review and editing), Dmitriy Dligach (Conceptualization, Methodology, Writing—review and editing, Supervision), and Majid Afshar (Supervision, Methodology, Formal analysis, Writing—review and editing, Conceptualization, Funding acquisition)

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

This work was supported by the National Library of Medicine of the National Institutes of Health under award number R01LM012973. The content is solely the responsibility of the authors and does not necessarily represent the official views of the National Institutes of Health.

## Conflicts of interest

The authors declare that they have no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.

## Data availability

The data underlying this article cannot be shared publicly due to privacy and data use agreements. The encounter IDs used for the MIMIC-III portion of the work will be shared on reasonable request to the corresponding author.

## References

*   1. Liu NF, Lin K, Hewitt J, et al. Lost in the middle: how language models use long contexts. Trans Assoc Comput Linguist. 2024;12:157-173. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Trans%20Assoc%20Comput%20Linguist&title=Lost%20in%20the%20middle:%20how%20language%20models%20use%20long%20contexts&volume=12&publication_year=2024&pages=157-173&)\]
*   2. Lewis P, Perez E, Piktus A, et al. Retrieval-augmented generation for knowledge-intensive NLP tasks. Adv Neural Inform Process Syst. 2020;33:9459-9474. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Neural%20Inform%20Process%20Syst&title=Retrieval-augmented%20generation%20for%20knowledge-intensive%20NLP%20tasks&volume=33&publication_year=2020&pages=9459-9474&)\]
*   3. Gao Y, Xiong Y, Gao X, et al. Retrieval-augmented generation for large language models: a survey. arXiv, arXiv:231210997, 2023, preprint: not peer reviewed.
*   4. Muennighoff N, Tazi N, Magne L, Reimers N. MTEB: Massive Text Embedding Benchmark. In: _Proceedings of the 17th Conference of the European Chapter of the Association for Computational Linguistics_, Dubrovnik, Croatia. Association for Computational Linguistics; 2023:2014-2037.
*   5. Sainz O, Campos J, García-Ferrero I, Etxaniz J, de Lacalle OL, Agirre E. NLP evaluation in trouble: on the need to measure LLM data contamination for each benchmark. In: Bouamor H, Pino J, Bali K, eds. _Findings of the Association for Computational Linguistics: EMNLP 2023_. Association for Computational Linguistics; 2023: 10776-10787. [https://aclanthology.org/2023.findings-emnlp.722](https://aclanthology.org/2023.findings-emnlp.722)
*   6. Xiao S, Liu Z, Zhang P, Muennighoff N, Lian D, Nie J. C-Pack: packaged resources to advance general Chinese embedding. In: _Proceedings of the 47th International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR '24)_. New York, NY: Association for Computing Machinery; 2024:641-649.
*   7. Aperdannier R, Koeppel M, Unger T, Schacht S, Barkur SK.. Systematic evaluation of different approaches on embedding search. In: Arai K, ed. Advances in Information and Communication. Springer Nature Switzerland; 2024: 526-536. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Advances%20in%20Information%20and%20Communication&publication_year=2024&)\]
*   8. Zhuang J, Baltescu P, Jiao J, et al. New embedding models and API updates; 2024. Accessed June 15, 2024. [https://openai.com/index/new-embedding-models-and-api-updates/](https://openai.com/index/new-embedding-models-and-api-updates/)
*   9. Xiong G, Jin Q, Lu Z, Zhang A. Benchmarking retrieval-augmented generation for medicine. In: _Findings of the Association for Computational Linguistics: ACL,_ Bangkok, Thailand. Association for Computational Linguistics; 2024:6233-6251.
*   10. Soldaini L, Goharian N. QuickUMLS: a fast, unsupervised approach for medical concept extraction. In: _MedIR Workshop, SIGIR_. 2016: 1-4.
*   11. Remy F, Demuynck K, Demeester T.. BioLORD-2023: semantic textual representations fusing large language models and clinical knowledge graph insights. J Am Med Inform Assoc. 2024;31:1844-1855. 10.1093/jamia/ocae029 \[[DOI](https://doi.org/10.1093/jamia/ocae029)\] \[[PMC free article](/articles/PMC11339519/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38412333/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=BioLORD-2023:%20semantic%20textual%20representations%20fusing%20large%20language%20models%20and%20clinical%20knowledge%20graph%20insights&volume=31&publication_year=2024&pages=1844-1855&pmid=38412333&doi=10.1093/jamia/ocae029&)\]
*   12. Johnson AEW, Pollard TJ, Shen L, et al. MIMIC-III, a freely accessible critical care database. Sci Data. 2016;3:160035-160039. \[[DOI](https://doi.org/10.1038/sdata.2016.35)\] \[[PMC free article](/articles/PMC4878278/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27219127/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Data&title=MIMIC-III,%20a%20freely%20accessible%20critical%20care%20database&volume=3&publication_year=2016&pages=160035-160039&pmid=27219127&doi=10.1038/sdata.2016.35&)\]
*   13. Canales L, Menke S, Marchesseau S, et al. Assessing the performance of clinical natural language processing systems: development of an evaluation methodology. JMIR Med Inform. 2021;9:e20492. \[[DOI](https://doi.org/10.2196/20492)\] \[[PMC free article](/articles/PMC8367121/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34297002/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JMIR%20Med%20Inform&title=Assessing%20the%20performance%20of%20clinical%20natural%20language%20processing%20systems:%20development%20of%20an%20evaluation%20methodology&volume=9&publication_year=2021&pages=e20492&pmid=34297002&doi=10.2196/20492&)\]
*   14. Yang X, Chen A, PourNejatian N, et al. A large language model for electronic health records. NPJ Digit Med. 2022;5:194. \[[DOI](https://doi.org/10.1038/s41746-022-00742-2)\] \[[PMC free article](/articles/PMC9792464/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/36572766/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=NPJ%20Digit%20Med&title=A%20large%20language%20model%20for%20electronic%20health%20records&volume=5&publication_year=2022&pages=194&pmid=36572766&doi=10.1038/s41746-022-00742-2&)\]
*   15. Meng R, Liu Y, Joty SR, Xiong C, Zhou Y, Yavuz S, SFR-embedded-mistral. Salesforce AI Research Blog. 2024. Accessed June 15, 2024. [https://blog.salesforceairesearch.com/sfr-embedded-mistral/](https://blog.salesforceairesearch.com/sfr-embedded-mistral/)
*   16. Wang L, Yang N, Huang X, Yang L, Majumder R, Wei F. Improving text embeddings with large language models. In: _Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)_, Bangkok, Thailand. Association for Computational Linguistics; 2024:11897-11916.
*   17. BehnamGhader P, Adlakha V, Mosbach M, Bahdanau D, Chapados N, Reddy S. LLM2Vec: large language models are secretly powerful text encoders. arXiv, arXiv:[2404.05961](https://arxiv.org/abs/2404.05961), 2024, preprint: not peer reviewed.
*   18. AI@Meta. Llama 3 model card. 2024. Accessed June 15, 2024. [https://github.com/meta-llama/llama3/blob/main/MODEL\_CARD.md](https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md)
*   19. Jiang AQ, Sablayrolles A, Mensch A, et al. Mistral 7B. arXiv, arXiv:231006825, 2023, preprint: not peer reviewed.
*   20. Labrak Y, Bazoge A, Morin E, Gourraud PA, Rouvier M, Dufour R. BioMistral: a collection of open-source pretrained large language models for medical domains. In: _Findings of the Association for Computational Linguistics: ACL,_ Bangkok, Thailand. Association for Computational Linguistics; 2024:5848-5864.
*   21. Jiang T, Huang S, Luan Z, Wang D, Zhuang F. Scaling sentence embeddings with large language models. In: _Findings of the Association for Computational Linguistics: EMNLP,_ Miami, FL. Association for Computational Linguistics; 2024:3182-3196.
*   22. Li Z, Zhang X, Zhang Y, Long D, Xie P, Zhang M. Towards general text embeddings with multi-stage contrastive learning. arXiv, arXiv:230803281, 2023, preprint: not peer reviewed.
*   23. Chen Z, Hernández-Cano A, Romanou A, et al. MEDITRON-70B: scaling medical pretraining for large language models. arXiv, arXiv:2311.16079, 2023, preprint: not peer reviewed.
*   24. AI V. Embeddings—docs. voyageai.com; 2024. Accessed June 15, 2024. [https://blog.voyageai.com/2024/05/05/voyage-large-2-instruct-instruction-tuned-and-rank-1-on-mteb/](https://blog.voyageai.com/2024/05/05/voyage-large-2-instruct-instruction-tuned-and-rank-1-on-mteb/)
*   25. Patterson BW, Hekman DJ, Liao FJ, Hamedani AG, Shah MN, Afshar M.. Call me Dr Ishmael: trends in electronic health record notes available at emergency department visits and admissions. JAMIA Open. 2024;7:ooae039. \[[DOI](https://doi.org/10.1093/jamiaopen/ooae039)\] \[[PMC free article](/articles/PMC11110617/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38779571/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMIA%20Open&title=Call%20me%20Dr%20Ishmael:%20trends%20in%20electronic%20health%20record%20notes%20available%20at%20emergency%20department%20visits%20and%20admissions&volume=7&publication_year=2024&pages=ooae039&pmid=38779571&doi=10.1093/jamiaopen/ooae039&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae308\_Supplementary\_Data

[ocae308\_supplementary\_data.docx](/articles/instance/11756698/bin/ocae308_supplementary_data.docx) (16.8KB, docx)

### Data Availability Statement

The data underlying this article cannot be shared publicly due to privacy and data use agreements. The encounter IDs used for the MIMIC-III portion of the work will be shared on reasonable request to the corresponding author.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**