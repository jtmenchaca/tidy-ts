J Am Med Inform Assoc

. 2024 Dec 20;32(2):341–348. doi: [10.1093/jamia/ocae302](https://doi.org/10.1093/jamia/ocae302)

# Application of large language models in clinical record correction: a comprehensive study on various retraining methods

[Ana M Maitin](https://pubmed.ncbi.nlm.nih.gov/?term="Maitin%20AM"[Author])

### Ana M Maitin, PhD

1 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Ana M Maitin](https://pubmed.ncbi.nlm.nih.gov/?term="Maitin%20AM"[Author])

1, [Alberto Nogales](https://pubmed.ncbi.nlm.nih.gov/?term="Nogales%20A"[Author])

### Alberto Nogales, PhD

2 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Alberto Nogales](https://pubmed.ncbi.nlm.nih.gov/?term="Nogales%20A"[Author])

2, [Sergio Fernández-Rincón](https://pubmed.ncbi.nlm.nih.gov/?term="Fern%C3%A1ndez-Rinc%C3%B3n%20S"[Author])

### Sergio Fernández-Rincón, PhD

3 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Sergio Fernández-Rincón](https://pubmed.ncbi.nlm.nih.gov/?term="Fern%C3%A1ndez-Rinc%C3%B3n%20S"[Author])

3, [Enrique Aranguren](https://pubmed.ncbi.nlm.nih.gov/?term="Aranguren%20E"[Author])

### Enrique Aranguren, BSc

4 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Enrique Aranguren](https://pubmed.ncbi.nlm.nih.gov/?term="Aranguren%20E"[Author])

4, [Emilio Cervera-Barba](https://pubmed.ncbi.nlm.nih.gov/?term="Cervera-Barba%20E"[Author])

### Emilio Cervera-Barba, PhD

5 Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Emilio Cervera-Barba](https://pubmed.ncbi.nlm.nih.gov/?term="Cervera-Barba%20E"[Author])

5, [Sophia Denizon-Arranz](https://pubmed.ncbi.nlm.nih.gov/?term="Denizon-Arranz%20S"[Author])

### Sophia Denizon-Arranz, PhD

6 Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Sophia Denizon-Arranz](https://pubmed.ncbi.nlm.nih.gov/?term="Denizon-Arranz%20S"[Author])

6, [Alonso Mateos-Rodríguez](https://pubmed.ncbi.nlm.nih.gov/?term="Mateos-Rodr%C3%ADguez%20A"[Author])

### Alonso Mateos-Rodríguez, PhD

7 Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Alonso Mateos-Rodríguez](https://pubmed.ncbi.nlm.nih.gov/?term="Mateos-Rodr%C3%ADguez%20A"[Author])

7, [Álvaro J García-Tejedor](https://pubmed.ncbi.nlm.nih.gov/?term="Garc%C3%ADa-Tejedor%20%C3%81J"[Author])

### Álvaro J García-Tejedor, PhD

8 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

Find articles by [Álvaro J García-Tejedor](https://pubmed.ncbi.nlm.nih.gov/?term="Garc%C3%ADa-Tejedor%20%C3%81J"[Author])

8,✉

*   Author information
*   Article notes
*   Copyright and License information

1 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

2 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

3 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

4 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

5 Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

6 Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

7 Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

8 CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain

✉

Corresponding author: Álvaro J. García-Tejedor, PhD, CEIEC, Universidad Francisco de Vitoria, Ctra. M-515 Km. 1,800, Pozuelo de Alarcón, 28223 Madrid, Spain (a.gtejedor@ceiec.es)

Received 2024 Jul 10; Revised 2024 Oct 23; Accepted 2024 Nov 25; Collection date 2025 Feb.

© The Author(s) 2024. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For permissions, please email: journals.permissions@oup.com

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC11756697  PMID: [39707579](https://pubmed.ncbi.nlm.nih.gov/39707579/)

## Abstract

### Objectives

We evaluate the effectiveness of large language models (LLMs), specifically GPT-based (GPT-3.5 and GPT-4) and Llama-2 models (13B and 7B architectures), in autonomously assessing clinical records (CRs) to enhance medical education and diagnostic skills.

### Materials and Methods

Various techniques, including prompt engineering, fine-tuning (FT), and low-rank adaptation (LoRA), were implemented and compared on Llama-2 7B. These methods were assessed using prompts in both English and Spanish to determine their adaptability to different languages. Performance was benchmarked against GPT-3.5, GPT-4, and Llama-2 13B.

### Results

GPT-based models, particularly GPT-4, demonstrated promising performance closely aligned with specialist evaluations. Application of FT on Llama-2 7B improved text comprehension in Spanish, equating its performance to that of Llama-2 13B with English prompts. Low-rank adaptation significantly enhanced performance, surpassing GPT-3.5 results when combined with FT. This indicates LoRA’s effectiveness in adapting open-source models for specific tasks.

### Discussion

While GPT-4 showed superior performance, FT and LoRA on Llama-2 7B proved crucial in improving language comprehension and task-specific accuracy. Identified limitations highlight the need for further research.

### Conclusion

This study underscores the potential of LLMs in medical education, providing an innovative, effective approach to CR correction. Low-rank adaptation emerged as the most effective technique, enabling open-source models to perform on par with proprietary models. Future research should focus on overcoming current limitations to further improve model performance.

**Keywords:** LLMs, artificial intelligence, retraining, clinical records

## Introduction

Clinical records (CRs) are essential documents created by healthcare professionals, including the reason for consultation, patient history (risk factors, habits, allergies, chronic conditions), current medications, test results, diagnosis, treatment, and prognostic information. Clinical records play a crucial role in identifying patient risk factors and ensuring accurate diagnoses, thereby avoiding potential therapeutic incompatibilities and promoting treatment effectiveness.[1](#ocae302-B1),[2](#ocae302-B2) Inadequate documentation can compromise patient safety,[3](#ocae302-B3) highlighting the need for comprehensive CRs, primarily the responsibility of physicians.[4](#ocae302-B4)

Medical students are taught to create CRs early in their training, practicing with real or simulated patients.[5](#ocae302-B5),[6](#ocae302-B6) They are tasked with gathering information, conducting examinations, or proposing complementary tests to fill out clinical histories and propose diagnoses and treatments, with professors reviewing these CRs to identify errors and inconsistencies. This process is repetitive and time-consuming, limiting professors’ ability to engage in other educational or healthcare tasks.

Technological advances have digitized much of this information, but the lack of a universal standard complicates CR generation, teaching, and correction. Artificial Intelligence (AI), particularly deep learning (DL) and natural language processing (NLP), offer promising solutions. Deep learning models, inspired by human neurons, are multilayered hierarchical models capable of learning data representations with various levels of abstraction.[7](#ocae302-B7) They require extensive data and meticulous training to solve complex problems. In NLP, Transformer architectures, introduced in 2017,[8](#ocae302-B8) have led to sophisticated models like large language models (LLMs), which can understand and generate human language. These models show potential in various fields, including finance[9](#ocae302-B9) and cybersecurity.[10](#ocae302-B10)

This research aims to evaluate different LLM techniques for improving CRs evaluation in medical schools, aiming for an open, accessible system. While GPT-based models by OpenAI are the current standard, their closed nature poses challenges. Open-source models like Llama-2, though initially less capable than GPT-4, can be enhanced. The goal is to create a specialized system that improves CR assessment quality, enhances medical education, and reduces the evaluative burden on teachers.

We will assess GPT-based models in comparison to Llama-2, using nonweight altering techniques like Zero-Shot and One-Shot prompt engineering allowing for a straightforward comparison among the GPT-3.5, GPT-4, and Llama-2 13B and 7B. Furthermore, we will investigate weight-modifying techniques like fine-tuning (FT) and LoRA on Llama-2. The results will be benchmarked against previous findings, with expert evaluation guiding the most efficient approach. This ensures superior performance in medical record correction, ultimately benefiting medical education and diagnostic accuracy.

## Background and significance

Large language models have shown significant potential in the medical field, particularly in assisting with diagnostic tasks.[11](#ocae302-B11) These models have demonstrated comprehensive knowledge essential for emergency care[12](#ocae302-B12) and substantial capabilities in interpreting general radiological reports.[13](#ocae302-B13) They employ various prompting strategies, from basic to complex, including techniques like chain of thought (CoT).[10](#ocae302-B10)

Since the introduction of ChatGPT in late 2022, LLM-related medical research publications have surged from fewer than 10 annually to well over a 100.[14](#ocae302-B14) Applications of LLMs extend to summarizing similar reports using numerical inputs or soft prompts obtained through encoders and prompt tuning to enhance text generation quality.[15](#ocae302-B15) However, there are no identified applications of LLMs for correcting CRs.

Currently, a wide range of LLMs exists, including proprietary systems like ChatGPT,[16](#ocae302-B16) GPT-4,[17](#ocae302-B17) Claude 3, and Gemini 1.5, as well as open-source models such as Llama-2,[18](#ocae302-B18) Vicuña, Alpaca, and Mistral. These models are increasingly used not only for routine text generation but also for informational queries, highlighting their growing importance in both academic and practical applications.

As far as we are aware, this is the only work that adapts LLMs for the specific medical task of evaluating CRs in an educational context. This highlights a gap in the literature, as systematic reviews such as those by Pressman et al[19](#ocae302-B19) and Meng et al[14](#ocae302-B14) cite various applications of LLMs, including the creation of learning tools, simulation of patient cases, and assistance for non-English-speaking students in developing language skills. However, none of these works address the evaluation of student-generated CRs. Furthermore, certain systematic reviews, like those by Nassiri and Akhloufi[20](#ocae302-B20) and Nazi and Peng,[21](#ocae302-B21) do not even mention the potential applications of LLMs in medical education.

Several reviews explore the trends and challenges of LLMs in the medical domain, with some taking a broad approach,[22](#ocae302-B22),[23](#ocae302-B23) while others focus specifically on medical education.[24](#ocae302-B24),[25](#ocae302-B25) The former group often includes sections on LLM applications in medical education, describing their utility in tasks such as exam preparation and information summarization, yet they fail to consider LLMs as potential tools for assisting educators. The latter group, although dedicated to educational applications, predominantly concentrates on tools for students, with only a few works addressing applications that could support educators, such as creating exercises or simulating scenarios. However, none of these works tackles the task of evaluating students’ CRs.

Finally, although we identified a practical implementation of biomedical LLMs, such as BioMistral,[26](#ocae302-B26) it too does not address the specific task that this work aims to solve.

The efficiency and potential accuracy of LLMs offer a compelling alternative to traditional, labor-intensive CR evaluation methods. This approach could reduce the workload on educators and enhance the educational process by providing immediate and precise feedback to students. Investigating the application of LLMs in medical education could significantly improve the quality of medical training, ultimately contributing to better patient care outcomes.

## Materials and methods

### Dataset

The dataset consists of documents written in Spanish, categorized into 4 subgroups:

*   CRs: Fifty CRs written by students from Francisco de Vitoria University. Of these, 40 reports pertain to patients with suspected rheumatic disease, while the remaining 10 concern abdominal pain, used to test the models. Patients are simulated by receiving staging training in clinical, communicative, and educational aspects by medical teachers dedicated to clinical simulation and accredited by the Association of Standardized Patient Educators. All CRs have been anonymized.
    
*   Corrections: Fifty Excel documents, each linked to a corresponding CR, containing evaluator corrections. These corrections include rubric items and a column indicating whether each item has been addressed.
    
*   Rubric: A single Excel document with 48 items outlining the required fields in the CRs. These items are organized into 6 subgroups: (1) patient’s affiliation data and reason for consultation (I1-I2), (2) personal history and lifestyle (I3-I6), (3) story of the current illness (I17-I27), (4) symptoms in other organs and systems (I28-I36), (5) physical examination (I37-I44), and (6) clinical judgment (I45-I47). Additionally, there is an item (I48) evaluating whether the report is structured orderly and understandable. Each criterion is evaluated with a “YES” or “NO.”
    
*   Semiology manuals: Forty-seven PDF manuals selected by field specialists. Medical semiology involves studying symptoms, somatic signs, laboratory signs, history taking, and physical examination.[27](#ocae302-B27) These manuals serve as reference works, providing a systematic and detailed guide on clinical signs and symptoms observable during a patient’s physical examination.
    

[Table 1](#ocae302-T1) summarizes the quantity and extent of these documents along with the preprocessing performed for each of the datasets.

#### Table 1.

Summary of document counts, size, and preprocessing steps for each dataset used in the study.

| Document type | Amount of data | Length | Preprocessing |
| --- | --- | --- | --- |
| CRs | 50 | 500 words | Anonymization, transcription by hand to .txt format |
| Corrections | 50 | 48 items | Content copied to a .txt format |
| Rubric | 1 | 48 items | Content copied to a .txt format |
| Semiology manuals | 47 | 400-1000 pages | Python tool PyMuPDFa has been used to extract text and transform PDFs into .txt files. Five manuals could not be processed due to format errors |

[Open in a new tab](table/ocae302-T1/)

a

[https://pymupdf.readthedocs.io/en/latest/](https://pymupdf.readthedocs.io/en/latest/)

### Techniques used on LLMs

We will use 3 strategies on LLMs to develop an expert system capable of correcting CRs: methods that do not alter the model’s weights, those that modify the model’s weights, and methods that introduce new weights.

#### Techniques that do not modify weights

Prompt engineering structures text for generative AI models, describing tasks in natural language.[28](#ocae302-B28) Prompts can vary from questions to complex instructions,[29](#ocae302-B29) sometimes including examples, known as few-shot learning.[30](#ocae302-B30) Chain of thought prompting helps LLMs to solve problems step by step before providing the final solution, improving reasoning.[31](#ocae302-B31)

For CRs correction, we will test Zero-Shot and One-Shot methods. In Zero-Shot, the rubric and CR are provided with instructions to apply the rubric. In One-Shot, we add a corrected report as an example. No additional information was introduced in the prompts to avoid bias in the evaluation. We aim to evaluate all GPT and Llama2-based models without altering their weights. Ten CRs were separated and used for evaluation.

#### Techniques that modify weights

Fine-tuning performs transfer learning adapting pretrained models to specific domains by training with new data. In LLMs, FT adapts them to specific domains by refining their context after extensive initial training and reusing the model’s parameters as a starting point.[32](#ocae302-B32) This requires a smaller dataset and specific hardware.

As Llama2 is an open-source model, we can deploy and fine-tune it by using preprocessed semiology books to develop an expert CR correction system. Then, we will assess the outcomes using the previously developed prompts.

#### Techniques that introduce new weights

Adapters adjust pretrained models for specific tasks without changing the entire architecture improving model efficiency while minimizing computational requirements. Low-rank adaptation adds a low-rank matrix to the original one, enhancing performance with fewer computational needs.[33](#ocae302-B33)

We will implement LoRA in Llama-2 using the remaining CRs dataset (40 reports) as a 2-column document: the first column includes the CR with the rubric and a prompt to apply the rubric; the second column contains the CR with the rubric embedded in the report. By using the previously developed prompts, we will test both Llama-2 with LoRA alone and combined with FT to determine if combining these methods creates a more reliable and accurate model for CR correction.

#### Hardware and evaluation

Weight modification techniques were executed on a server with AMD Ryzen Threadripper pro-5965WX 24-Core CPU, 128 GB RAM, CUDA version 12.2, Ubuntu 22.04, 500 GB SSD, 4 TB HDD, and 4 Nvidia RTX A-6000 GPUs (48 GB each, connected 2-by-2 with NVLink). Prompting and prompt engineering were performed on a computer with an Intel Core i5-8500 processor, 32 GB RAM, Windows 10 Pro, 250 GB SSD, and 1 TB HDD.

All results will be compared and assessed by researchers in LLM and specialists in CR evaluation to provide objective evaluations and enhance the evaluation method. Clinical record specialists were members of the faculty of the Faculty of Medicine trained and experienced in medical education, both undergraduate and postgraduate, and teach clinical simulation, semiology, and clinical history.

### Models used for each strategy

*   GPT-based: These closed models have limited publicly available technical details. We will use GPT-3.5, estimated to have 20 billion parameters,[34](#ocae302-B34) and GPT-4, with an unknown exact size but based on a mixture of experts architecture. GPT-3.5 has a context window of 16K tokens, while GPT-4 has 128K tokens.[29](#ocae302-B29) Evaluation will be done using Zero-Shot and One-Shot prompting techniques in Spanish.
    
*   Llama2-based: This model has been pretrained with around 2 trillion high-quality tokens and fine-tuned using reinforcement learning from human feedback techniques.[18](#ocae302-B18) It accepts a context window of 4096 tokens, beyond which results may become unreliable potentially causing nonsensical responses. We will use Llama-2 13B (13 billion parameters) and Llama-2 7B (7 billion parameters). Though primarily trained in English text, we will conduct prompting tests in both Spanish and English using Zero-Shot and One-Shot techniques. Additionally, for Llama-2 7B, we will perform FT, LoRA, and a combination of both, evaluated with prompts in Spanish and English. The models used for each of the presented strategies are as follows.
    

### Metrics

Two different metrics are considered to assess the performance of the presented strategies. Firstly, for each CR, the degree of agreement between the response generated by the AI model and the experts’ evaluation is calculated according to the expression:

|  | (1) |
| --- | --- |

where indicates the CR index, stands for the total number of items in the CR, is the number of items of the CR in which both the AI model and experts respond “YES”, and is the number of items in which the AI model and experts share the response “NO”. Secondly, the performance for independent items across different CRs is analyzed through the degree of error concerning the experts’ evaluation, which is calculated using the formula:

|  | (2) |
| --- | --- |

where stands for the item number, is the total number of CRs considered for the selected strategy, indicates the number of CRs in which the AI model responds “YES” but the experts’ response is “NO” for the item , and is the number of CRs where the AI model responds “NO” but the experts’ response is “YES” for the item .

## Results

### Tests that do not change the weights

In the Zero-Shot approach, we use the rubric across all 10 CRs in the test set. In the One-Shot approach, the rubric is applied to 9 CRs, with 1 CR and its corrections presented as an exemplar. The prompts remain consistent across all models to facilitate result comparison and mitigate biases from prompt discrepancies. [Table 2](#ocae302-T2) outlines the prompting process results for each scenario. For each CR, we calculated the degree of agreement between the AI-generated response and the experts’ evaluation, according to [eqn (1)](#E1). The results in [Table 2](#ocae302-T2) represent the mean percentage of agreement for the evaluated reports alongside theirSD.

#### Table 2.

Degree of agreement between the results of each model and the specialists’ evaluations using Zero-Shot and One-Shot prompting methods. Bold values indicate best results for each prompting method.

| Used model | Zero-Shot (%) | One-Shot (%) | Observations |
| --- | --- | --- | --- |
| GPT-4 | 81.25 ± 5.10 | 83.56 ± 7.11 | In most of the results, provide the reason in addition to the correction with “YES” and “NO” |
| GPT-3.5 | 72.29 ± 10.71 | 74.54 ± 6.72 | Occasionally it would give explanations along with corrections |
| Llama 2 7B (Spanish) | 64.58 ± 6.59 | — | Answer usually in English and usually add the German word (Unterscheidung = distinction). It provides only the answers because it has been indicated in the prompt by combining different items |
| Llama 2 7B (English) | 65.21 ± 4.76 | 65.97 ± 4.05 | Same response as with the Spanish prompt |
| Llama 2 13B (Spanish) | 65.83 ± 6.33 | — | It tends to interpret these as code commands. Added a specific line at the prompt indicating that it is not a Code task. It usually responds in English |
| Llama 2 13B (English) | 67.50 ± 7.35 | — | Same response as with the Spanish prompt. The One-Shot method has failed to generate results and has not been considered in the analyses |
| Total | 69.44 ± 5.86 | 74.69 ± 7.18 |  |

[Open in a new tab](table/ocae302-T2/)

Observations for each model are also indicated.

Llama-2 models (7B and 13B) use a maximum token length of 4096. One-Shot prompts, which include a CR and its corrections, often hit this limit. Exceeding it causes consistency issues in the model’s responses, flagged in the code during execution. To avoid this limitation, we also conducted prompting tests in English, as it uses fewer tokens and provides better context, especially since Llama-2 is primarily trained in English and lacks robust multilingual capabilities.

[Table 2](#ocae302-T2) reveals that GPT models deliver superior results in both prompting methodologies, with GPT-4 showing particularly promising performance. GPT-3.5 exhibits the highest SD, encompassing the outcomes of the Llama2-based model. Interestingly, the Llama2-based model, especially the 7B architecture with English prompts, shows the lowest SD values.

For Llama2-based models using Zero-Shot, there are notable discrepancies between the 7B and 13B versions, with the 13B version performing better. Additionally, results vary between Spanish and English prompts, with English instructions yielding better outcomes, more so in the higher capacity model.

Finally, a Mann-Whitney test was used to assess whether there is a statistically significant difference in performance between Zero-Shot and One-Shot prompting, as it is suitable for comparing groups without assuming a normal distribution. After applying the test using the results of the experiments (60 for Zero-Shot and 27 for One-Shot) from which the values in [Table 2](#ocae302-T2) are obtained, we have a _U_ = 585 and a _P_ = .0387.

### Tests that modify the weights

We conducted FT and LoRA on the Llama-2 7B model for consistent comparison with other retraining techniques. We conducted FT and LoRA on the Llama-2 7B model, ensuring a consistent comparison of results when applying this architecture along with other retraining techniques. The hyperparameters used in each methodology employed can be found at [supplementary materials](https://academic.oup.com/jamia/article-lookup/doi/10.1093/jamia/ocae302#supplementary-data)[Appendix S1](#sup1).

The FT process, using a preprocessed dataset of semiology books, lasted 250 h on 4 A6000 GPUs, with an early stop at 3000 steps utilizing 100% of the parameters. The model reached a steady state at step 180. Low-rank adaptation training, using 40 CRs and corrections, took less than 10 s for a 5-epoch process on 2 A6000 GPUs, utilizing 0.06% of the total model parameters with the _paged\_adamw\_32bit optimizer_.

Evaluations of the retrained models with Zero-Shot and One-Shot prompting methods in English and Spanish are presented in [Table 3](#ocae302-T3). Fine-tuning significantly improved Spanish prompts’ performance to match Llama-2 13B with English prompts. No significant differences were observed between prompt languages or between Zero-Shot and One-Shot methods.

#### Table 3.

Degree of agreement of the results for Llama-2 7B with the evaluation of the specialists, for the Zero-Shot and One-Shot prompting methods. Bold values indicate best results for each prompting method.

| Methodology | Zero-Shot (%) | One-Shot (%) | Observations |
| --- | --- | --- | --- |
| FT (Spanish) | 67.50 ± 7.41 | — | It presents better response information with explanations similar to those provided with GPT-3.5. No new inclusions in the prompt were necessary |
| FT (English) | 66.88 ± 6.00 | 67.59 ± 4.62 | Same response as with the Spanish prompt |
| LoRA (Spanish) | 71.25 ± 5.34 | — | Occasionally differentiate between “No information” and “There is information, but it is negative” improving the results of the corrections |
| LoRA (English) | 61.88 ± 5.82 | 68.06 ± 4.39 | The generation is incorrect, more often than with the Spanish prompt. There are no alterations to the prompt and the model provides explanations at times |
| FT+LoRA (Spanish) | 72.50 ± 8.11 | — | Results similar to LoRA |
| FT+LoRA (English) | 64.79 ± 6.87 | 65.97 ± 4.17 | Results similar to LoRA |
| Total | 67.47 ± 3.67 | 67.21 ± 0.89 |  |

[Open in a new tab](table/ocae302-T3/)

The observations of the models are also indicated.

Low-rank adaptation showed notable performance improvements when prompting in both languages, with Spanish Zero-Shot prompts surpassing GPT-3.5. Although slightly lower, the SD was much lower. For English Zero-Shot prompts, LoRA performed poorly, offering the worst results in the entire analysis, but the One-Shot method improved task performance significantly.

Combining FT and LoRA techniques showed that for Spanish Zero-Shot prompts, results surpassed GPT-3.5, with no significant difference from LoRA alone. However, for English prompts, the combination decreased performance, like FT, with no differences between the Zero-Shot and One-Shot methods.

The Mann-Whitney test comparing Zero-Shot in English and Spanish shows a _U_\-value of 656.5 and a _P_\-value of .0021. In contrast, when comparing Zero-Shot and One-Shot in Spanish and English, the _U_\-value is 308.5, and the _P_\-value is .1253.

### Comparison between prompt languages

To evaluate the results of different techniques based on the prompt language, it is crucial to consider that the rubric may contain ambiguous fields, potentially causing confusion in the model’s interpretation and resulting in incorrect responses. This ambiguity can lead to consistently incorrect results, affecting the overall performance metrics of the rubric evaluation.

We evaluated the error for each rubric item using [eqn (2)](#E2). The results showed that GPT-based models were quite heterogeneous, with no specific items showing a higher error tendency, likely due to their better understanding of the input text. The errors per item for English and Spanish prompts are listed in [Appendix S2](#sup1). [Figure 1](#ocae302-F1) shows a box plot based on the values of the 2 tables in [Appendix S2](#sup1).

#### Figure 1.

[![Graphical representation of error rates obtained for each language and methodology used in the experimentation.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/c775/11756697/1f4339db4bc1/ocae302f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=11756697_ocae302f1.jpg)

[Open in a new tab](figure/ocae302-F1/)

Error rates of models by methodology and language.

To compare the model’s understanding of the task when applying different procedures, we represented the error rate for each rubric question. Q1 represents a low error rate (0-25%), Q2 indicates a moderate error rate (25-50%), Q3 signals a higher error rate (50-75%), and Q4 represents a high error rate (75-100%). [Table 4](#ocae302-T4) shows the results for each method with the percentages for each quartile.

#### Table 4.

Number of items per quartile for each of the retraining techniques used with the two prompt languages. Bold values indicate the technique yielding the highest number of correctly classified items in Spanish and English respectively.

| Prompt language | Technique | Items in Q1 | Items in Q2 | Items in Q3 | Items in Q4 |
| --- | --- | --- | --- | --- | --- |
| Spanish | Prompting | 20 (41.67%) | 14 (29.17%) | 6 (12.50%) | 8 (16.67%) |
|  | FT | 24 (50.00%) | 10 (20.83%) | 11 (22.92%) | 3 (6.25%) |
|  | LoRA | 28 (58.33%) | 8 (16.67%) | 11 (22.92%) | 1 (2.08%) |
|  | FT+LoRA | 25 (52.08%) | 12 (25.00%) | 10 (20.83%) | 1 (2.08%) |
| English | Prompting | 21 (43.75%) | 15 (31.25%) | 9 (18.75%) | 3 (6.25%) |
|  | FT | 23 (47.92%) | 11 (22.92%) | 11 (22.92%) | 3 (6.25%) |
|  | LoRA | 11 (22.92%) | 25 (52.08%) | 11 (22.92%) | 1 (2.08%) |
|  | FT+LoRA | 20 (41.67%) | 15 (31.25%) | 9 (18.75%) | 4 (8.33%) |

[Open in a new tab](table/ocae302-T4/)

The percentages of the quartiles follow the expected trend with higher values in Q1 to lower ones in Q4 except for Q2 in the case of LoRA for English. For Spanish instructions, the highest error rate (8 items in Q4) and the lowest success rate (20 items in Q1) were obtained through the prompting technique. Although FT retraining improved these results, 3 items (I3, I4, and I5) remained problematic. The best results were achieved with LoRA, significantly better than prompting and FT. Combining both techniques provided intermediate results, improving FT but slightly inferior to LoRA alone.

For English prompts, LoRA significantly impacted results, reducing the number of Q1 items by 10 compared to prompting, indicating a diminished understanding of the original language. However, it also reduced Q4 errors. Fine-tuning provided the highest number of correctly classified items, while the combination of both techniques yielded results similar to FT.

## Discussion

In this study, we evaluated different methods of retraining LLMs to develop an open-source model for CRs correction, aiming for performance comparable to GPT-based models. We used GPT-3.5, GPT-4, and Llama-2 13B and 7B as prompting baseline models. The prompting process ([Table 2](#ocae302-T2)) measured the agreement between model evaluations and human evaluators. Results showed that GPT models, especially GPT-4, had a higher agreement. Among Llama-2 models, the 13B architecture with English prompts performed closest to GPT-3.5, while Llama-2 7B with Spanish prompts performed the worst. This suggests model size and training language significantly influence comprehension and performance. Regarding the prompting methods, the One-Shot method improves model performance with a higher average agreement with specialists. Still, it shows more variability, while the Zero-Shot method offers more consistent, slightly lower, performance. This can be complemented by the Mann-Whitney test which indicates a significant difference at the 5% level, suggesting that the method of prompting influences performance.

To enhance outcomes, we applied FT (for adjusting the model’s weights) and LoRA (to incorporate new weights) to Llama-2 7B. Fine-tuning aims for domain compression, and LoRA tailors the model to specific tasks ([Table 3](#ocae302-T3)). Using Spanish Zero-Shot prompts, FT matched Llama-2 13B with English prompts, but LoRA achieved the best performance, equaling GPT-3.5. Different datasets tailored to each technique were used, indicating that LoRA, which used specific clinical cases, provided better performance than those based on semiology books. The combination of FT and LoRA did not significantly differ from LoRA alone but surpassed GPT-3.5.

When using English prompts, FT maintained performance, but LoRA negatively impacted it. Fine-tuning improved Spanish comprehension without compromising English understanding, whereas LoRA hindered it. However, including an example (One-Shot) improved performance for all techniques, though results still lagged Spanish Zero-Shot prompts. The combination of techniques showed intermediate results. This suggests that since FT modified all model weights, its impact on the model’s comprehension ability is greater. At the prompting methodology level, the Zero-Shot and One-Shot prompting methods have similar accuracy (∼67%), but One-Shot provides more consistent results with less variability across models, making it more reliable for stable performance. The Mann-Whitney test comparing Zero-Shot in English indicates a statistically significant difference between the 2 languages. In contrast, when comparing Zero-Shot and One-Shot in both Spanish and English, it suggests no statistically significant difference between these 2 approaches.

[Figure 1](#ocae302-F1) shows varying performance across different models, with methodologies including prompting, FT, and LoRA in both Spanish and English. The median errors across methods are similar ranging from 20 to 30, suggesting consistent performance, but the variability in error rates, particularly in FT, is notably higher, especially in English. English models with LoRA also display outliers indicating occasional significantly higher errors. In contrast, Spanish models exhibit lower variability in most of the cases and slightly lower median errors, implying better performance for Spanish. It is important to note that all models, both in English and Spanish, were trained using Spanish data. This suggests that while advanced methodologies can potentially reduce error rates, they also introduce greater variability and potential for high-error outliers, particularly in English.

Error analysis of each rubric item revealed that FT highlighted 3 items with higher error percentages: I3 (allergies/adverse drug reactions), I4 (allergies/intolerances), and I5 (surgical history). The phrase “No allergies” was misinterpreted by the model as not introduced, suggesting the need for improved prompts. Low-rank adaptation introduced a new item with 10% agreement concerning symptom attribution (I26), possibly due to overfitting as the CRs used in LoRA involve the same clinical case, whereas the 10 reports used for testing represent different clinical cases. More data and varied clinical cases are needed to enhance model generalization.

For English instructions, FT showed the same contextual errors as prompting, indicating the need for more data to improve model comprehension within the medical field. Although LoRA had the worst performance, it reduced completely erroneous items. Items with the lowest error rates corresponded to standardized questions in the “Symptoms in other organs and systems” subgroup (I29-I36), indicating better identification of medical terms, probably due to the use of standardized questions by the students.

Different ethical aspects should be considered in the practical use of the present work as integrating automated assessment tools into medical education introduces certain risks. One significant concern is the potential for students to become overly reliant on AI systems, which could impair their development of critical thinking and diagnostic reasoning skills. Automated systems may also reinforce biases if trained on datasets that do not adequately represent the diversity of real-world clinical cases, potentially propagating biased clinical decision-making. Additionally, the use of automated tools in the evaluation process carries the risk of perpetuating errors if not regularly updated and carefully monitored. To address these issues, it is crucial to ensure that automated assessments are used as complementary tools, with human oversight playing a central role in maintaining high standards of education and feedback.

Other important ethical concerns are related to data privacy, biases in model predictions, and their impact on medical education and practice. While our study did not involve real patient data, the use of LLMs in real-world clinical environments raises concerns about the handling of sensitive patient information, with even anonymized data posing a risk of reidentification. Large language models also inherit biases from their training data, which could result in inequitable treatment recommendations, particularly affecting underrepresented patient groups. Moreover, the generation of incorrect information or “hallucinations” by these models may lead to erroneous clinical decisions, while the lack of accountability in AI systems means they cannot replace the clinical judgment of physicians. Therefore, integrating LLMs into healthcare must be done with caution, ensuring that AI serves to support, rather than supplant, medical education and practice while safeguarding patient data and ensuring fairness and transparency.

Although the results are promising, different limitations of the work should be highlighted. The number of CRs used to test the LoRA and FT methods was relatively limited. However, this quantity proved sufficient to prevent overfitting and achieve good performance. Despite the success of these trials, the small dataset presented certain limitations, particularly in the variety of clinical cases it covered. Since the dataset predominantly included a narrow range of conditions, the model’s ability to generalize to other conditions that follow different CR protocols was hindered, potentially affecting its broader applicability in clinical settings.

Another limitation is that the FT process required a significant number of computational resources, which constrained our ability to conduct a more in-depth study. For example, we were unable to incorporate acronym dictionaries to manage the diverse abbreviations found in clinical reports, a feature that could have improved the model’s overall contextual understanding. This limitation was particularly noticeable when the model encountered acronyms that were not explicitly defined.

To end with the imitations. In cases where acronyms were missing or unclear, the model occasionally struggled to accurately interpret a sentence’s context. While it sometimes succeeded in approximating the intended meaning by relying on the surrounding text, the accuracy of these interpretations often depended on how the sentence was structured. This highlights the need for future improvements in handling domain-specific language, such as medical abbreviations, to enhance the model’s performance.

Future steps will involve enhancing the open-source model by identifying inconsistencies between symptoms and diagnosis in CRs, using FT with more data to enhance understanding and applying other techniques to improve task performance. This will not only achieve reference LLM performance but also help to understand and evaluate these techniques’ limitations, facilitating LLM application in various fields.

## Conclusion

Throughout this study, we have applied various techniques to retrain LLMs to obtain an open-source model capable of accurately and autonomously evaluating CRs in the university setting. Using the 7B version of Llama-2, we implemented techniques with different properties, including those that do not modify weights (prompting), those that modify weights (FT), and those that introduce new weights (LoRA), along with a combination of both. The results were compared with prompting on GPT-4, GPT-3.5, and Llama-2 13B models.

The prompting results indicate that GPT-based models, especially GPT-4, show promising performance according to specialist evaluations. However, with FT, we improved text comprehension in Spanish, matching the results of Llama-2 13B with English instructions. In contrast, LoRA allowed us to match and even surpass the results obtained by GPT-3.5 through the combination of both techniques. Thus, we determined that LoRA is the most effective technique for enhancing the performance of an open-source model, achieving performance equivalent to ChatGPT.

Consequently, we conclude that we have succeeded in developing a specialized, open-source model for CRs’ correction with features comparable to current models. Additionally, we have identified limitations in these techniques that could be critical for improving text comprehension and detecting inconsistencies between different parts of the report, bringing us closer to the performance of the current standard model, GPT-4.

## Supplementary Material

ocae302\_Supplementary\_Data

[ocae302\_supplementary\_data.docx](/articles/instance/11756697/bin/ocae302_supplementary_data.docx) (64.6KB, docx)

## Contributor Information

Ana M Maitin, CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

Alberto Nogales, CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

Sergio Fernández-Rincón, CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

Enrique Aranguren, CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

Emilio Cervera-Barba, Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

Sophia Denizon-Arranz, Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

Alonso Mateos-Rodríguez, Facultad de Medicina, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

Álvaro J García-Tejedor, CEIEC, Universidad Francisco de Vitoria, Pozuelo de Alarcón, 28223 Madrid, Spain.

## Author contributions

Ana M. Maitin (Conceptualization, Formal analysis, Investigation, Methodology, Software, Supervision, Writing—original draft), Alberto Nogales (Formal analysis, Investigation, Writing—original draft), Sergio Fernández-Rincón (Formal analysis, Investigation, Methodology, Writing—original draft), Enrique Aranguren (Data curation, Software), Emilio Cervera-Barba (Conceptualization, Funding acquisition, Project administration, Validation, Writing—review and editing), Sophia Denizon-Arranz (Data curation, Methodology, Validation, Writing—review and editing), Alonso Mateos-Rodríguez (Data curation, Validation, Writing—review and editing), and Álvaro J. García-Tejedor (Conceptualization, Formal analysis, Funding acquisition, Methodology, Project administration, Writing—review and editing)

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

This work was supported by the Universidad Francisco de Vitoria, grant number UFV2024-05 in the context of the project “CLINiC: Evaluación de historias clínicas en el ámbito académico mediante el uso modelos de lenguaje con técnicas de Inteligencia Artificial”.

## Conflicts of interest

None declared.

## Data availability

The data underlying this article cannot be shared publicly due to privacy concerns related to student information. The data used in this study consist of real clinical records obtained from student evaluations and therefore, access to the data is restricted. The data will be shared on reasonable request to the corresponding author.

## References

*   1. Mann R, Williams J.. Standards in medical record keeping. Clin Med (Lond). 2003;3:329-332. \[[DOI](https://doi.org/10.7861/clinmedicine.3-4-329)\] \[[PMC free article](/articles/PMC5351947/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/12938746/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Clin%20Med%20\(Lond\)&title=Standards%20in%20medical%20record%20keeping&volume=3&publication_year=2003&pages=329-332&pmid=12938746&doi=10.7861/clinmedicine.3-4-329&)\]
*   2. Pullen I, Loudon J.. Improving standards in clinical record-keeping. Adv Psychiatr Treat. 2006;12:280-286. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Psychiatr%20Treat&title=Improving%20standards%20in%20clinical%20record-keeping&volume=12&publication_year=2006&pages=280-286&)\]
*   3. Wright P, Jansen C, Wyatt JC.. How to limit clinical errors in interpretation of data. Lancet. 1998;352:1539-1543. \[[DOI](https://doi.org/10.1016/S0140-6736\(98\)08308-1)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/9820319/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Lancet&title=How%20to%20limit%20clinical%20errors%20in%20interpretation%20of%20data&volume=352&publication_year=1998&pages=1539-1543&pmid=9820319&doi=10.1016/S0140-6736\(98\)08308-1&)\]
*   4. Huston JL. The need for mandatory clinical recording standards. Clin Med (Lond). 2004;4:255-257. \[[DOI](https://doi.org/10.7861/clinmedicine.4-3-255)\] \[[PMC free article](/articles/PMC4953589/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/15244361/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Clin%20Med%20\(Lond\)&title=The%20need%20for%20mandatory%20clinical%20recording%20standards&volume=4&publication_year=2004&pages=255-257&pmid=15244361&doi=10.7861/clinmedicine.4-3-255&)\]
*   5. Cleland JA, Abe K, Rethans JJ.. The use of simulated patients in medical education: AMEE Guide No 42. Med Teach. 2009;31:477-486. \[[DOI](https://doi.org/10.1080/01421590903002821)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/19811162/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Med%20Teach&title=The%20use%20of%20simulated%20patients%20in%20medical%20education:%20AMEE%20Guide%20No%2042&volume=31&publication_year=2009&pages=477-486&pmid=19811162&doi=10.1080/01421590903002821&)\]
*   6. Huang GC, Sacks H, DeVita M, et al. Characteristics of simulation activities at North American medical schools and teaching hospitals: an AAMC-SSH-ASPE-AACN collaboration. Simul Healthc J Soc Simul Healthc. 2012;7:329-333. \[[DOI](https://doi.org/10.1097/SIH.0b013e318262007e)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/22902605/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Simul%20Healthc%20J%20Soc%20Simul%20Healthc&title=Characteristics%20of%20simulation%20activities%20at%20North%20American%20medical%20schools%20and%20teaching%20hospitals:%20an%20AAMC-SSH-ASPE-AACN%20collaboration&volume=7&publication_year=2012&pages=329-333&pmid=22902605&doi=10.1097/SIH.0b013e318262007e&)\]
*   7. LeCun Y, Bengio Y, Hinton G.. Deep learning. Nature. 2015;521:436-444. \[[DOI](https://doi.org/10.1038/nature14539)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26017442/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nature&title=Deep%20learning&volume=521&publication_year=2015&pages=436-444&pmid=26017442&doi=10.1038/nature14539&)\]
*   8. Vaswani A, Shazeer N, Parmar N, et al. Attention is all you need. arXiv, 2017, preprint: not peer reviewed. 10.48550/arXiv.1706.03762 \[[DOI](https://doi.org/10.48550/arXiv.1706.03762)\]
*   9. Li Y, Wang S, Ding H, Chen H. Large language models in finance: a survey. In: _Proceedings of the 4th ACM International Conference on AI in Finance, ICAIF 2023_. Association for Computing Machinery; 2023:374-382.
*   10. Singla T, Anandayuvaraj D, Kalu KG, Schorlemmer TR, Davis JC. An empirical study on using large language models to analyze software supply chain security failures. In: _Proceedings of the 2023 Workshop on Software Supply Chain Offensive Research and Ecosystem Defenses, Scored 2023_. Association for Computing Machinery; 2023: 5-15.
*   11. McDuff D, Schaekermann M, Tu T, et al. Towards accurate differential diagnosis with large language models. arXiv, 2023, preprint: not peer reviewed. 10.48550/arXiv.2312.00164 \[[DOI](https://doi.org/10.48550/arXiv.2312.00164)\]
*   12. Igarashi Y, Nakahara K, Norii T, Miyake N, Tagami T, Yokobori S.. Performance of a large language model on Japanese Emergency Medicine Board Certification Examinations. J Nippon Med Sch. 2024;91:155-161. \[[DOI](https://doi.org/10.1272/jnms.JNMS.2024_91-205)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38432929/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Nippon%20Med%20Sch&title=Performance%20of%20a%20large%20language%20model%20on%20Japanese%20Emergency%20Medicine%20Board%20Certification%20Examinations&volume=91&publication_year=2024&pages=155-161&pmid=38432929&doi=10.1272/jnms.JNMS.2024_91-205&)\]
*   13. Liu Q, Hyland S, Bannur S, et al. Exploring the boundaries of GPT-4 in radiology. 2023. 10.48550/arXiv.2310.14573 \[[DOI](https://doi.org/10.48550/arXiv.2310.14573)\]
*   14. Meng X, Yan X, Zhang K, et al. The application of large language models in medicine: a scoping review. iScience. 2024;27:109713. \[[DOI](https://doi.org/10.1016/j.isci.2024.109713)\] \[[PMC free article](/articles/PMC11091685/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38746668/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=iScience&title=The%20application%20of%20large%20language%20models%20in%20medicine:%20a%20scoping%20review&volume=27&publication_year=2024&pages=109713&pmid=38746668&doi=10.1016/j.isci.2024.109713&)\]
*   15. Chuang YN, Tang R, Jiang X, Hu X. SPeC: a soft prompt-based calibration on performance variability of large language model in clinical notes summarization. arXiv, 2023, preprint: not peer reviewed. 10.48550/arXiv.2303.13035 \[[DOI](https://doi.org/10.48550/arXiv.2303.13035)\] \[[PMC free article](/articles/PMC11608453/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38325698/)\]
*   16.Introducing ChatGPT. Accessed December 4, 2024. [https://openai.com/index/chatgpt/](https://openai.com/index/chatgpt/)
*   17. OpenAI AJ, Adler S, Agarwal S, Ahmad L, Akkaya I, et al. GPT-4 Technical Report. arXiv, 2023, preprint: not peer reviewed. 10.48550/arXiv.2303.08774 \[[DOI](https://doi.org/10.48550/arXiv.2303.08774)\]
*   18. Touvron H, Martin L, Stone K, et al. Llama 2: open foundation and fine-tuned chat models. arXiv, 2023, preprint: not peer reviewed. 10.48550/arXiv.2307.09288 \[[DOI](https://doi.org/10.48550/arXiv.2307.09288)\]
*   19. Pressman SM, Borna S, Gomez-Cabello CA, Haider SA, Haider CR, Forte AJ.. Clinical and surgical applications of large language models: a systematic review. J Clin Med. 2024;13:3041. \[[DOI](https://doi.org/10.3390/jcm13113041)\] \[[PMC free article](/articles/PMC11172607/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38892752/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Clin%20Med&title=Clinical%20and%20surgical%20applications%20of%20large%20language%20models:%20a%20systematic%20review&volume=13&publication_year=2024&pages=3041&pmid=38892752&doi=10.3390/jcm13113041&)\]
*   20. Nassiri K, Akhloufi MA.. Recent advances in large language models for healthcare. BioMedInformatics. 2024;4:1097-1143. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BioMedInformatics&title=Recent%20advances%20in%20large%20language%20models%20for%20healthcare&volume=4&publication_year=2024&pages=1097-1143&)\]
*   21. Nazi ZA, Peng W.. Large language models in healthcare and medical domain: a review. Informatics. 2024;11:57. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Informatics&title=Large%20language%20models%20in%20healthcare%20and%20medical%20domain:%20a%20review&volume=11&publication_year=2024&pages=57&)\]
*   22. Yang R, Tan TF, Lu W, Thirunavukarasu AJ, Ting DSW, Liu N.. Large language models in health care: development, applications, and challenges. Health Care Sci. 2023;2:255-263. \[[DOI](https://doi.org/10.1002/hcs2.61)\] \[[PMC free article](/articles/PMC11080827/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38939520/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Health%20Care%20Sci&title=Large%20language%20models%20in%20health%20care:%20development,%20applications,%20and%20challenges&volume=2&publication_year=2023&pages=255-263&pmid=38939520&doi=10.1002/hcs2.61&)\]
*   23. Sallam M. The utility of ChatGPT as an example of large language models in healthcare education, research and practice: systematic review on the future perspectives and potential limitations. medRxiv, 2023, preprint: not peer reviewed. 10.1101/2023.02.19.23286155 \[[DOI](https://doi.org/10.1101/2023.02.19.23286155)\]
*   24. Benítez TM, Xu Y, Boudreau JD, et al. Harnessing the potential of large language models in medical education: promise and pitfalls. J Am Med Inform Assoc. 2024;31:776-783. \[[DOI](https://doi.org/10.1093/jamia/ocad252)\] \[[PMC free article](/articles/PMC10873781/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38269644/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Harnessing%20the%20potential%20of%20large%20language%20models%20in%20medical%20education:%20promise%20and%20pitfalls&volume=31&publication_year=2024&pages=776-783&pmid=38269644&doi=10.1093/jamia/ocad252&)\]
*   25. Abd-Alrazaq A, AlSaad R, Alhuwail D, et al. Large language models in medical education: opportunities, challenges, and future directions. JMIR Med Educ. 2023;9:e48291. \[[DOI](https://doi.org/10.2196/48291)\] \[[PMC free article](/articles/PMC10273039/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37261894/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JMIR%20Med%20Educ&title=Large%20language%20models%20in%20medical%20education:%20opportunities,%20challenges,%20and%20future%20directions&volume=9&publication_year=2023&pages=e48291&pmid=37261894&doi=10.2196/48291&)\]
*   26. Labrak Y, Bazoge A, Morin E, Gourraud PA, Rouvier M, Dufour R. BioMistral: a collection of open-source pretrained large language models for medical domains. arXiv, 2024, preprint: not peer reviewed. 10.48550/arXiv.2402.10373 \[[DOI](https://doi.org/10.48550/arXiv.2402.10373)\]
*   27. Goic GA. Origin and development of the book Medical Semiology. Rev Médica Chile. 2018;146:387-390. \[[DOI](https://doi.org/10.4067/s0034-98872018000300387)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/29999110/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Rev%20M%C3%A9dica%20Chile&title=Origin%20and%20development%20of%20the%20book%20Medical%20Semiology&volume=146&publication_year=2018&pages=387-390&pmid=29999110&doi=10.4067/s0034-98872018000300387&)\]
*   28. Radford A, Wu J, Child R, Luan D, Amodei D, Sutskever I. Language models are unsupervised multitask learners. 24.
*   29.OpenAI Platform. Accessed December 4, 2024. [https://platform.openai.com](https://platform.openai.com)
*   30. Brown T, Mann B, Ryder N, et al. Language models are few-shot learners. In: Larochelle H, Ranzato M, Hadsell R, Balcan MF, Lin H, eds. _Advances in Neural Information Processing Systems_. Vol. 33. Curran Associates, Inc.; 2020:1877-1901.
*   31. Wei J, Wang X, Schuurmans D, et al. Chain-of-thought prompting elicits reasoning in large language models. Adv Neural Inf Process Syst. 2022;35:24824-24837. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Neural%20Inf%20Process%20Syst&title=Chain-of-thought%20prompting%20elicits%20reasoning%20in%20large%20language%20models&volume=35&publication_year=2022&pages=24824-24837&)\]
*   32. Dodge J, Ilharco G, Schwartz R, Farhadi A, Hajishirzi H. Fine-tuning pretrained language models: weight initializations, data orders, and early stopping. arXiv, 2020, preprint: not peer reviewed. 10.48550/arXiv.2002.06305 \[[DOI](https://doi.org/10.48550/arXiv.2002.06305)\]
*   33. Hu EJ, Shen Y, Wallis P, et al. LoRA: low-rank adaptation of large language models. arXiv, 2021, preprint: not peer reviewed. 10.48550/arXiv.2106.09685 \[[DOI](https://doi.org/10.48550/arXiv.2106.09685)\]
*   34. Singh M, Cambronero J, Gulwani S, Le V, Negreanu C, Verbruggen G. CodeFusion: a pre-trained diffusion model for code generation. arXiv, 2023, preprint: not peer reviewed. 10.48550/arXiv.2310.17680 \[[DOI](https://doi.org/10.48550/arXiv.2310.17680)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae302\_Supplementary\_Data

[ocae302\_supplementary\_data.docx](/articles/instance/11756697/bin/ocae302_supplementary_data.docx) (64.6KB, docx)

### Data Availability Statement

The data underlying this article cannot be shared publicly due to privacy concerns related to student information. The data used in this study consist of real clinical records obtained from student evaluations and therefore, access to the data is restricted. The data will be shared on reasonable request to the corresponding author.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**