
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
PMCID: PMC11833482
PMID: 39798153
DOI: 10.1093/jamia/ocaf002
Article ID: ocaf002
Article version: 1
Subjects: Research and Applications, AcademicSubjects/MED00580, AcademicSubjects/SCI01060, AcademicSubjects/SCI01530

RAMIE: retrieval-augmented multi-task information extraction with large language models on dietary supplements

Zhan Zaifu MEng Department of Electrical and Computer Engineering, University of Minnesota, Minneapolis, MN 55455, United States

Zhou Shuang PhD Division of Computational Health Sciences, Department of Surgery, University of Minnesota, Minneapolis, MN 55455, United States

Li Mingchen MS Division of Computational Health Sciences, Department of Surgery, University of Minnesota, Minneapolis, MN 55455, United States

https://orcid.org/0000-0001-8258-3585 Zhang Rui PhD Division of Computational Health Sciences, Department of Surgery, University of Minnesota, Minneapolis, MN 55455, United States

Corresponding author: Rui Zhang, PhD, Division of Computational Health Sciences, Department of Surgery, University of Minnesota, 11-132 Phillips-Wangensteen Building, 516 Delaware St SE, Minneapolis, MN 55455, United States (ruizhang@umn.edu)
Publication date: 2025 Mar
Electronic publication date: 2025 Jan 11
Volume: 32
Issue: 3
First page: 545
Last page: 554
Received 2024 Nov 26; Revised 2024 Dec 20; 2024 Dec 30; Accepted 2025 Jan 3
Copyright: © The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association.
Copyright year: 2025
License: This is an Open Access article distributed under the terms of the Creative Commons Attribution-NonCommercial-NoDerivs licence (https://creativecommons.org/licenses/by-nc-nd/4.0/), which permits non-commercial reproduction and distribution of the work, in any medium, provided the original work is not altered or transformed in any way, and that the work is properly cited. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.
License URL: https://creativecommons.org/licenses/by-nc-nd/4.0/

Keywords: dietary supplements, large language model, instruction fine-tuning, retrieval-augmented generation, multi-task learning

Funding: National Institutes of Health 10.13039/100000002 National Center for Complementary and Integrative Health 10.13039/100008460 R01AT009457 U01AT012871 National Institute on Aging 10.13039/100000049 R01AG078154 National Cancer Institute 10.13039/100000054 R01CA287413 National Institute of Diabetes and Digestive and Kidney Diseases 10.13039/100000062 R01DK115629 National Institute on Minority Health and Health Disparities 10.13039/100006545 1R21MD019134-01
Page count: 10

==============================
Abstract

Objective

To develop an advanced multi-task large language model (LLM) framework for extracting diverse types of information about dietary supplements (DSs) from clinical records.

Methods

We focused on 4 core DS information extraction tasks: named entity recognition (2 949 clinical sentences), relation extraction (4 892 sentences), triple extraction (2 949 sentences), and usage classification (2 460 sentences). To address these tasks, we introduced the retrieval-augmented multi-task information extraction (RAMIE) framework, which incorporates: (1) instruction fine-tuning with task-specific prompts; (2) multi-task training of LLMs to enhance storage efficiency and reduce training costs; and (3) retrieval-augmented generation, which retrieves similar examples from the training set to improve task performance. We compared the performance of RAMIE to LLMs with instruction fine-tuning alone and conducted an ablation study to evaluate the individual contributions of multi-task learning and retrieval-augmented generation to overall performance improvements.

Results

Using the RAMIE framework, Llama2-13B achieved an F1 score of 87.39 on the named entity recognition task, reflecting a 3.51% improvement. It also excelled in the relation extraction task with an F1 score of 93.74, a 1.15% improvement. For the triple extraction task, Llama2-7B achieved an F1 score of 79.45, representing a significant 14.26% improvement. MedAlpaca-7B delivered the highest F1 score of 93.45 on the usage classification task, with a 0.94% improvement. The ablation study highlighted that while multi-task learning improved efficiency with a minor trade-off in performance, the inclusion of retrieval-augmented generation significantly enhanced overall accuracy across tasks.

Conclusion

The RAMIE framework demonstrates substantial improvements in multi-task information extraction for DS-related data from clinical records.

Introduction

Dietary supplements (DSs) play a pivotal role in promoting health and wellness by providing essential nutrients that may be lacking in regular diets. According to the 2023 Council of Responsible Nutrition (CRN) consumer survey,1 74% of US adults use supplements, with 55% being regular users, and 92% of these users agree that DSs are essential for health. Despite their widespread acceptance, concerns persist regarding the quality,2 effectiveness,3 and safety3,4 of DSs due to their classification as food rather than medicine, exempting them from Food and Drug Administration (FDA) approval.5 This lack of regulation leads to several issues, including insufficient transparency regarding ingredient identities,6 a shortage of rigorously designed clinical trials,7 and limited laboratory studies clarifying their mechanisms,8 which could result in adverse events (AEs),9 some of which may be severe or even fatal.10

Clinical records contain extensive DS information and their AEs,11–13 offering valuable insights for public health, medical research, and regulation. However, this information is often embedded in unstructured text within electronic health records (EHRs),14–16 requiring advanced information extraction methods to comprehensively and accurately identify DS entities, related events, and their interrelations.17 Several tasks in extracting DS information include named entity recognition (NER) for identifying specific DS names,18 relation extraction (RE) for discerning associations between DSs and AEs vs indications or no relations,19,20 triple extraction (TE) or end-to-end NER with RE, and usage classification (UC) for capturing DS usage status (such as start, continuation, or discontinuation).13 Moreover, the variability in clinical language,21,22 including misspellings,23 abbreviations,24 and ambiguous terms, adds to the complexity of automated information extraction. Given these challenges, there is a pressing need for advanced methods that can handle the complexity and diversity of DS-related information embedded in clinical records.

To solve these challenges, there has been some prior research on using natural language processing (NLP) techniques to analyze DSs in text.25–27 For example, Fan et al used bidirectional long short-term memory (BiLSTM) and bidirectional encoder representations from transformers (BERT) models to recognize DS entities, extract relations between DSs and AEs from clinical text,17 and predict DSs use status.13 Zhou et al28 trained BERT and its variants to identify DS use status from clinical notes among patients with Alzheimer’s disease and related dementias. However, due to the analytical limitations of smaller models such as convolutional neural networks (CNNs) and BERT, these approaches often fall short in handling unseen text or complex clinical text, particularly when required to process multiple entity types and intricate relationships essential for comprehensive DS analysis. Recent advancements in large language models (LLMs), such as generative pre-trained transformer (GPT)29–31 and the Llama series32 have revolutionized the artificial intelligence domain33 and many efforts have reported the effectiveness of applying LLMs for health records34 and information extraction tasks.19,35–39 However, LLMs’ application (and with advanced techniques such as retrieval-augmented generation [RAG] and instruction fine-tuning) to DS-related information extraction remains under-explored. Although Zhou et al40 employed GPT-3.5-turbo to extract DS-related entities as part of broader therapies, LLM’s ability to extract DS entities is still unknown. To fill the gap, we investigate the potential of LLMs for comprehensive information extraction tasks in the DS domain as the first benchmark work.

In this work, considering that the efficiency of information extraction is essential in real-world scenarios,41–43 we propose the RAMIE (retrieval-augmented multi-task information extraction) framework for DSs via multi-task learning (MTL)44,45 and RAG to effectively handle multiple information extraction tasks simultaneously. On the one hand, MTL41–43 offers significant efficiency, reducing not only training costs but also storage requirements,46,47 laying the foundation for deploying healthcare applications on smaller devices in the future. For example, Mulyar et al48 sacrificed little performance to achieve multi-head BERT to tackle multiple tasks in 1 model. On the other hand, RAG49 offers a promising avenue to enhance LLMs for DSs. By incorporating retrieval mechanisms, RAG allows models to access additional relevant examples during generation.20,50 For instance, RAG has been successfully applied to improve question-answering systems.51

Our contributions are summarized as follows:

To the best of our knowledge, it is the first work to explore the potential of LLMs for multitask information extraction in the DS domain, encompassing 4 key tasks: NER, RE, TE, and UC.

We proposed the RAMIE framework, which combines RAG and instruction fine-tuning to achieve high performance and leverages MTL to enhance efficiency.

We conducted comprehensive experiments on 8 state-of-the-art LLMs across 3 settings: (1) single-task instruction fine-tuning, (2) the proposed RAMIE framework, and (3) multi-task instruction fine-tuning.

Methods

Overview of methods

In this work, we present a comprehensive framework for multi-task information extraction from clinical narratives related to DSs. Our proposed framework, RAMIE, is designed to perform 4 key tasks—NER, RE, TE, and UC. RAMIE combines MTL, RAG, and instruction fine-tuning to optimize extraction accuracy, model efficiency, and scalability across tasks. The framework demonstrates strong adaptability to the complexities of clinical text analysis by leveraging instruction-tuning and integrating retrievers to enhance contextual relevance. While primarily developed for DS-related tasks, RAMIE has the potential to be applied to other domains requiring complex information extraction. In the following sections, we detail the tasks, datasets, architectural innovations underpinning RAMIE, and the experimental setup used to evaluate its performance.

Tasks and datasets

In this work, we address 4 core information extraction tasks: NER,18 RE,19 TE,20 and UC.13 These tasks are foundational to NLP for extracting structured data from unstructured clinical text. Each task serves a specific role in transforming clinical text into a format that can support downstream applications, such as clinical decision-making or research on DSs.

NER: This task involves identifying and categorizing DS entities and event entities in the text. The model detects mentions of DS and potentially associated events in clinical notes, marking the entities with predefined categories. For instance, in a sentence like “The patient reported taking cranberry juice for a urinary tract infection,” the model would tag “cranberry juice” as a DS and “urinary tract infection” as an event.

RE: Once entities are identified, this task determines the relationships between them. In the context of DS-related data, RE identifies whether a supplement is positively or negatively associated with an event, or if there is no direct relationship. This task enables the identification of cause-effect relationships or therapeutic uses of DSs. For example, in “The patient experienced nausea after taking ginseng,” RE would identify a negative relationship between “ginseng” and “nausea.”

TE: TE is an end-to-end RE task by structuring information into subject-predicate-object triples directly from the inputs. This task identifies the named entities and then determined the relationships between identified entities into triples, which can be used for further analysis, such as creating knowledge graphs. In a sentence like “Cranberry is used to prevent urinary tract infections,” TE would extract the triple (Cranberry <has_indication> urinary tract infections).

UC: UC focuses on classifying the use status of DSs described in clinical notes. The model identifies whether a supplement is “Started,” “Continued,” “Discontinued,” or its status is “Uncertain” within a given sentence. For example, in “The patient stopped taking fish oil due to side effects,” the model would classify the use status as “Discontinued.”

The datasets for these 4 tasks were derived from the Clinical Data Repository (CDR) at the University of Minnesota. The CDR contains over 180 million clinical notes from more than 5 million patients,17 providing a rich source of information for DS-related tasks. The Institutional Review Board (IRB) approval was obtained for accessing the annotated electronic health records (EHRs) related to DSs. Each task is supported by a specific dataset, which was manually annotated by domain experts.17 The dataset was split into training, development, and test sets with a ratio of 8:1:1. The data statistics, annotation details, and examples for each task are summarized in Table 1.

Table 1. Overview of annotation details and the statistics of datasets.

Task	Statistics/annotations/examples	
NER	Train/Dev/Test size: 2365/292/292

DS entities: such as folic_acid, milk_thistle, ginger, chamomile, garlic, black_cohosh, ginkgo, lavender, melatonin, cranberry, glucosamine, dandelion, saw_palmetto, green_tea.

Event entities: disease or signs/symptoms, such as rash, nausea, pain, stomach upset, sedation, headache, drowsiness, sleepiness, insomnia, itching, bleeding, vomited, hypertension.

Examples:

DS:  ginger and ginkgo biloba are mild anticoagulants, so there is an increased risk of bleeding, especially with full-dose aspirin.

DS: pt expressed anxiety but comforted with support breathing and lavender.

Event: primary diagnosis: nausea vomiting possibly due to milk thistle.

Event: also offered ginger ale and lavender oil for nausea anxiety.

	
RE	Train/Dev/Test size: 3964/464/464

Relations: positive, negative, not_related, indicating the relation between the head DS entity and the corresponding adverse events.

Examples:

positive: ginkgo biloba and melatonin have both been studied for use in treating tinnitus. The relationship between melatonin and tinnitus is?

negative: she has tried melatonin, but it has increased the morning dizziness. The relationship between melatonin and dizziness is?

not_related: will add Maalox for indigestion, fiber to decrease constipation, and lavender aromatherapy for pain/anxiety relief. The relationship between fiber and pain is?

	
TE	Train/Dev/Test size: 2365/292/292

Same entities as NER task (head entities are DS entities and tail entities are the corresponding adverse events), relation types are same as RE task.

Examples:

ginseng tea | positive | constipation: constipation—use of ginseng tea—seems to be better with this

estrogen | positive | night sweat: She’s taking estrogen for night sweats; it helps a little.

folic acid | negative | rash: daughter calling back to inform this office that they accidentally purchased folic acid 400 mg and have been giving 1 po to pt since September 12, 2008. Daughter is asking if her recent skin rash could be due to this.

	
UC	Train/Dev/Test size: 2000/230/230

Use status: continue, discontinue, uncertain, start, describing the status of DS for patients.

Examples:

continue: continue Vitamin E selenium discharge

discontinue: note stop b6 b12 folic acid today

uncertain: suggest take co mg daily vitamin d3 unit daily

start: currently prescribe levo-thyroxine mcg daily melatonin

	
Abbreviations: DS = dietary supplement; NER = named entity recognition; RE = relation extraction; TE = triple extraction; UC = usage classification.

RAMIE framework

The motivation for the proposed RAMIE framework is to maintain the high performance of LLMs while achieving efficiency. As depicted in Figure 1, the RAMIE framework integrates MTL, RAG, and instruction fine-tuning, leveraging their complementary strengths to enhance task performance. MTL enables LLMs to handle multiple tasks within a single LLM. While MTL enhances efficiency, it also introduces complexity that can undermine performance. In an MTL framework, LLMs must differentiate between various task types, memorize specific response formats, and develop the necessary task-solving abilities. Instruction fine-tuning and RAG enhance the performance by providing various instructions for each task and providing task-relevant examples dynamically, respectively. This combination offers high-level guidance, similar examples, and response templates to enhance understanding and reduce ambiguity in predictions.

Figure 1. The retrieval-augmented multi-task information extraction (RAMIE) framework.

The complete structure of the RAMIE framework is depicted, with its subcomponents labeled as a, b, and c, representing multi-task learning, retrieval-augmented generation, and instruction fine-tuning, respectively.

To lay a solid groundwork, we evaluate 8 state-of-the-art LLMs in our framework. LLMs include Mistral-7B,52 Llama-2-7B,32 Llama-2-13B,32 Llama-3-8B53 which were pre-trained for general downstream tasks and BioMistral-7B,54 PMC-Llama13B,55 MedAlpaca-7B56 and MedAlpaca-13B56 which were pre-trained for biomedical domain.

Multi-task learning

The MTL in the RAMIE framework offers a practical and scalable solution for deploying LLMs to address diverse tasks, especially in resource-constrained environments. As shown in Figure 1, the RAMIE framework consolidates task-specific datasets for NER, RE, TE, and UC, each containing thousands of labeled sentences, into a unified training set. The task-specific labels serve dual purposes: they not only guide the training process but also play a crucial role in the retrieval and prompt construction phases, where retrieved examples are augmented with task-specific instructions.

The unified dataset is used in a multi-task instruction fine-tuning process, enabling the LLM to be trained simultaneously on sentences from all tasks. During training, the model learns to differentiate between distinct task instructions encoded in the dataset and generates accurate task-specific outputs. By employing the MTL approach, RAMIE allows a single LLM to acquire the capability to solve multiple tasks with just one fine-tuning operation. This significantly reduces storage redundancy, as only one model needs to be maintained, and minimizes computational resources required for training and deployment. Furthermore, the unified structure and shared learning strategy enhance the adaptability and efficiency of the model across a broad spectrum of information extraction tasks.

Retrieval-augmented generation

In the RAMIE framework, as illustrated in Figure 1, we incorporate RAG20,49,50 to further enhance the model’s performance across tasks. During both the training and testing phases, the framework employs retrievers to identify the most relevant sentence-response pair from the corresponding training set based on the cosine similarity of sentence embeddings, determined by the input sentence and its associated task label. To ensure alignment between the retrieved examples and the input format, the retrievers are constrained to search within the training set specific to the input’s labeled task.

The retrieval process involves concatenating the input sentence and its corresponding response to form a single representation, which is then compared to the input sentence embedding using cosine similarity. During training, the retrievers often identify pairs where the sentence is identical to the input sentence due to the high embedding similarity. However, such instances may cause the model to rely on copying the response directly from the example, rather than developing analytical reasoning. To mitigate this issue, the retrievers are restricted from selecting the input sentence itself during training and are instead configured to retrieve the most semantically similar example from the remaining dataset. Specifically, we calculate the cosine similarity between the input sentence and all other training sentences, sort the similarity scores, and select the sentence with the highest score to include in the prompt. Conversely, during testing, the retrievers are permitted to select the most relevant example from the entire training set, as there is no overlap between the input and retrieved examples.

The retrieved examples are incorporated into a dynamically constructed prompt, which is subsequently used for instruction fine-tuning within the LLM. To optimize retrieval quality, we utilize 3 state-of-the-art retrievers—MedCPT,57 Contriever,58 and BMRetriever.59 These retrievers are specifically tailored for domain-specific tasks and have demonstrated superior performance in biomedical information extraction, making them well suited for the diverse and complex tasks addressed in RAMIE.

Instruction fine-tuning

To optimize the performance of LLMs across multiple tasks, we employed instruction fine-tuning,60,61 a technique that helps models generalize by providing explicit task instructions within the input prompt. Following the LEAP framework,19 we designed the template of prompts for each task, as illustrated in Figure 1. The prompt consists of an instruction part, an example part, and the input sentence with its response. The input sentences are from the combined training set, and the examples are retrieved from the retrievers. The instructions are designed to provide instruction for each task as follows.

For the NER task, the model is instructed to extract DSs and AEs from a given sentence and recognize their entity types. The predefined entity types include DS and event. The output is expected in the format: a list of entities with their corresponding types, for example, [entity_name1: entity_type1, entity_name2: entity_type2, …].

In the RE task, the model is prompted to predict the relationship between a given head entity and tail entity within the provided sentence. The model was given the head entity and the tail entity from the gold standard by adding a follow-up question: “The relationship between <DS entity> and <event entity> is?” The relation must be selected from the predefined set: “negative,” “not_related,” or “positive.” The response is expected as a single-item list, such as [“negative”].

For the TE task, the model is asked to extract triples consisting of a head entity, relation, and tail entity from the sentence. The relation types are the same as in RE, and the entity types are the same as in NER. The output format is a list of dictionaries, where each dictionary represents a triple, for example, {“head entity”: “entity_name,” “relation”: “relation_type,” “tail entity”: “entity_name”}.

In the UC task, the model is required to predict the DS usage within the sentence, selecting from the predefined usage types: “continue,” “discontinue,” “uncertain,” or “start.” The expected output is a list containing the predicted usage type, such as [“continue”].

Experiments

We designed 3 groups of experiments to comprehensively evaluate the proposed RAMIE framework: (1) single-task instruction fine-tuning as a benchmark, (2) the RAMIE framework, and (3) multi-task instruction fine-tuning as an ablation study. The ablation study was designed to provide insights into the individual contributions of MTL and RAG within the RAMIE framework. All experiments were conducted on NVIDIA A100 GPUs with 80 GB memory. The training and evaluation batch sizes per device were set to 4, and inference was performed on a sentence-by-sentence basis. To fine-tune the model effectively, we employed the LoRA approach,62 with the rank set to 64, alpha to 32, and a dropout rate of 0.1. The AdamW optimizer was used with a learning rate of 1e-5, and the model was trained for 5 000 steps. Evaluations were performed every 1 000 steps, and the best-performing model was selected for inference.

For the baseline, we implemented a BERT-based model with separate task-specific heads to handle the 4 tasks, following the methodology in prior work.48 To evaluate model performance, we adopted Micro Precision, Recall, and F1-score metrics, in line with established studies.17,20 A prediction was considered correct only if the entire output exactly matched the ground truth.17,28 For single-task instruction fine-tuning, models were trained on a single dataset and evaluated on its corresponding test set. In contrast, for multi-task instruction fine-tuning, the models were trained on a blended dataset combining all tasks and evaluated on the test sets of each task individually, both with and without RAG integration. To further evaluate the effectiveness of the retrievers, experiments were conducted using a random retriever as a baseline for comparison.

Results

Instruction fine-tuning performance

Table 2 provides a detailed comparison of various models evaluated under a single-task instruction-tuning setting across 4 tasks. Overall, all LLMs demonstrated significantly higher performance than BERT, achieving F1 scores above 80, compared to BERT’s average score of 69.55. This underscores the superior effectiveness of LLMs on DS-related tasks. A key differentiator is the NER task, where BERT processes tokens individually, whereas LLMs extract information from entire sentences, resulting in a substantial performance gap.

Table 2. Performance of multi-task instruction fine-tuning setting without RAG.

	NER	RE	TE	UC		
Models	Precision	Recall	F1	Precision	Recall	F1	Precision	Recall	F1	Precision	Recall	F1	Avg. F1	
BERT	28.08	28.08	28.08	92.88	92.88	92.88	64.71	64.57	64.64	92.61	92.61	92.61	69.55	
BioMistral-7B	86.01	85.89	85.95	93.09	93.09	93.09	75.00	68.48	71.59	90.79	90.79	90.79	85.36	
Llama-2-7B	85.55	81.66	83.56	83.37	83.37	83.37	72.09	64.57	68.12	89.96	89.96	89.96	81.25	
Llama-2-13B	86.40	82.34	84.32	92.66	92.66	92.66	73.01	69.66	71.29	91.70	91.70	91.70	84.99	
Llama-3-8B	86.18	84.38	85.27	93.61	93.61	93.61	78.29	70.39	74.13	91.01	91.01	91.01	86.01	
MedAlpaca-7B	91.51	85.81	88.57	89.03	89.03	89.03	81.25	70.27	75.36	92.57	92.57	92.57	86.38	
MedAlpaca-13B	85.01	82.90	83.94	89.42	89.42	89.42	76.05	67.78	71.68	90.83	90.83	90.83	83.97	
Mistral-7B	84.01	84.83	84.42	92.66	92.66	92.66	74.88	73.33	74.09	89.08	89.08	89.08	85.06	
PMC-Llama-13B	85.37	82.90	84.11	90.50	90.50	90.50	70.46	63.82	66.97	89.08	89.08	89.08	82.67	
The performance drop is compared with single-task instruction fine-tuning.

Abbreviations: NER = named entity recognition; RAG = retrieval-augmented generation; RE = relation extraction; TE = triple extraction; UC = usage classification.

The highest F1 score for each task and the best average F1 score for each model are presented in bold.

Among the LLMs, the MedAlpaca-7B model achieved the highest average F1 score of 86.38, outperforming BioMistral-7B (85.36) and Mistral-7B (85.06). This highlights MedAlpaca-7B’s strong capability when fine-tuned for specific tasks.

For individual tasks, MedAlpaca-7B achieved an F1 score of 88.57 in the NER task. Llama3-8B excelled in the RE task with an F1 score of 93.61. In the TE task, MedAlpaca-7B scored 75.36, while BERT performed exceptionally in the UC task with the highest F1 score of 92.61, followed closely by the LLMs. These results further emphasize the notable advancements achieved by recent architectures, as traditional models like BERT continue to fall significantly behind.

Performance of RAMIE framework

Table 3 presents the performance of 8 LLMs across 4 tasks: NER, RE, TE, and UC. Each row summarizes the performance of a single model on the respective datasets. Overall, the BMRetriever configuration consistently delivers the highest average F1 scores across the models. For example, BioMistral-7B achieves its best average F1 score of 85.29 with BMRetriever. Similarly, Llama2-7B, MedAlpaca-7B, and Mistral-7B also perform best under this configuration. Notably, Llama2-13B achieves its highest average F1 score of 85.96 using Contriever, highlighting strong performance in this setting.

Table 3. Performance of RAMIE framework.

	NER	RE	TE	UC		
Models	Precision	Recall	F1	Precision	Recall	F1	Precision	Recall	F1	Precision	Recall	F1	Avg. F1	
BioMistral-7B	
 w/random example	85.69	79.64	82.56	90.83	90.93	90.93	64.20	60.70	62.40	82.97	82.97	82.97	79.72	
 w/MedCPT	87.00	84.70	85.84	93.30	93.30	93.30	71.15	63.26	66.97	89.96	89.96	89.96	84.02	
 w/Contriever	85.90	83.87	84.87	92.87	92.87	92.87	71.36	65.43	68.26	89.08	89.08	89.08	83.77	
 w/BMRetriever	86.87	84.20	85.51	92.66	92.66	92.66	73.56	70.80	72.15	90.83	90.83	90.83	85.29	
Llama2-7B	
 w/random example	78.41	81.99	80.16	82.51	82.51	82.51	62.86	64.90	63.86	69.87	69.87	69.87	74.10	
 w/MedCPT	83.14	82.68	82.91	89.20	89.20	89.20	75.20	69.52	72.25	86.03	86.03	86.03	82.60	
 w/Contriever	83.66	83.07	83.37	90.93	90.93	90.93	67.19	65.72	66.45	90.39	90.39	90.39	82.79	
 w/BMRetriever	84.67	84.20	84.43	88.55	88.55	88.55	70.98	90.18	79.45	89.08	89.08	89.08	85.38	
Llama2-13B	
 w/random example	86.16	83.66	84.89	93.95	93.95	93.95	73.27	65.20	69.00	79.48	79.48	79.48	81.83	
 w/MedCPT	89.42	85.46	87.39	92.22	92.22	92.22	75.74	70.67	73.12	86.03	86.03	86.03	84.69	
 w/Contriever	87.35	82.61	84.92	93.52	93.52	93.52	78.99	68.27	73.24	92.14	92.14	92.14	85.96	
 w/BMRetriever	87.98	85.42	86.68	93.74	93.74	93.74	73.13	72.45	72.79	87.28	87.28	87.28	85.12	
MedAlpaca-7B	
 w/random example	77.66	84.31	80.85	91.79	91.79	91.79	64.12	68.02	66.01	87.77	87.77	87.77	81.61	
 w/MedCPT	85.94	84.26	85.09	88.55	88.55	88.55	72.08	69.75	70.89	90.39	90.39	90.39	83.73	
 w/Contriever	83.33	83.45	83.39	92.01	92.01	92.01	69.45	69.15	69.30	93.45	93.45	93.45	84.54	
 w/BMRetriever	82.98	86.79	84.84	92.44	92.44	92.44	67.32	71.03	69.13	89.08	89.08	89.08	83.87	
MedAlpaca-13B	
 w/random example	78.79	81.95	80.33	87.26	87.26	87.26	56.06	56.32	56.19	80.52	81.22	80.87	76.16	
 w/MedCPT	86.61	84.40	85.49	87.70	88.91	88.30	64.88	66.97	65.91	86.46	86.46	86.46	81.54	
 w/Contriever	83.24	83.01	83.12	90.06	92.01	91.03	69.62	64.24	66.82	92.58	92.58	92.58	83.39	
 w/BMRetriever	80.48	80.82	80.65	89.42	89.42	89.42	66.82	68.22	67.51	87.34	87.34	87.34	81.23	
Llama3-8B	
 w/random example	84.91	80.96	82.89	90.93	90.93	90.93	73.24	63.62	68.09	85.15	85.15	85.15	81.77	
 w/MedCPT	88.14	83.73	85.88	92.66	92.66	92.66	71.46	76.00	73.66	88.65	88.65	88.65	82.21	
 w/Contriever	86.08	83.45	84.75	93.09	93.09	93.09	71.63	70.47	71.04	91.22	91.22	91.22	85.03	
 w/BMRetriever	88.12	84.21	86.12	92.66	92.66	92.66	72.27	73.10	72.69	88.21	88.21	88.21	84.92	
Mistral-7B	
 w/random example	82.52	82.75	82.64	88.34	88.34	88.34	74.39	60.26	66.59	86.46	86.46	86.46	81.01	
 w/MedCPT	87.32	83.54	85.39	91.36	91.36	91.36	78.17	67.99	72.73	88.64	88.64	88.64	84.53	
 w/Contriever	85.39	83.36	84.36	92.66	92.66	92.66	76.27	68.83	72.41	91.27	91.27	91.27	85.18	
 w/BMRetriever	86.74	83.73	85.21	91.58	91.58	91.58	75.62	71.23	73.36	89.08	89.08	89.08	84.81	
PMC-Llama-7B	
 w/random example	82.46	83.03	82.74	88.05	88.05	88.05	69.76	69.27	69.51	86.03	86.03	86.03	81.58	
 w/MedCPT	84.74	86.51	85.62	92.44	92.44	92.44	70.94	67.39	69.12	90.83	90.83	90.83	84.50	
 w/Contriever	83.45	83.45	83.45	93.09	93.09	93.09	72.58	72.07	72.32	92.58	92.58	92.58	85.36	
 w/BMRetriever	84.81	85.40	85.10	91.74	91.74	91.74	72.00	72.51	72.26	89.52	89.52	89.52	84.66	
The highest F1 score for each task and the best average F1 score for each model are presented in bold.

Abbreviations: NER = named entity recognition; RAMIE = retrieval-augmented multi-task information extraction; RE = relation extraction; TE = triple extraction; UC = usage classification.

When examining individual tasks, RE consistently achieves higher scores across the models compared to the other tasks, with several models surpassing an F1 score of 90. For instance, Llama2-13B with BMRetriever attains an impressive F1 score of 93.74 in the RE task. In contrast, TE exhibits more variability, with F1 scores ranging from ∼60 to 73 for most models, reflecting the relative challenge of this task.

Ablation study

Table 4 summarizes the evaluation results under the multi-task instruction fine-tuning setting without RAG. Among the models, Mistral-7B stands out with the highest average F1 score of 84.06, outperforming BioMistral-7B (82.10) and Llama3-8B (83.18). This demonstrates its strong and consistent performance across tasks. Most models perform particularly well on the RE task, with several achieving F1 scores of 92.22 or higher, including Llama3-8B, BioMistral-7B, and MedAlpaca-7B. In contrast, the TE task shows greater variability in performance, with Mistral-7B achieving the highest F1 score of 70.74, reflecting the relative difficulty of this task.

Table 4. Performance of multi-task instruction fine-tuning setting without RAG.

	NER	RE	TE	UC	Average	
Models	F1	Performance drop (%)	F1	Performance drop (%)	F1	Performance drop (%)	F1	Performance drop (%)	F1	Performance drop (%)	
BioMistral-7B	81.52	5.15	92.22	0.93	68.61	4.16	86.03	5.24	82.10	3.82	
Llama2-7B	81.07	2.98	87.90	−5.43	62.54	8.19	88.21	1.95	79.93	1.62	
Llama2-13B	83.30	1.21	92.22	0.47	67.12	5.85	86.03	6.18	82.17	3.32	
MedAlpaca-7B	81.95	3.89	90.28	3.56	70.66	4.68	89.08	2.12	82.99	3.51	
MedAlpaca-13B	82.10	7.30	90.06	−1.16	66.03	12.38	87.77	5.19	81.49	5.66	
Llama3-8B	83.85	0.11	92.22	−3.13	69.32	3.29	87.33	3.85	83.18	0.94	
Mistral-7B	83.32	1.30	91.79	0.94	70.74	4.52	90.39	−1.47	84.06	1.18	
PMC-Llama-7B	83.95	0.19	89.42	1.19	65.60	2.05	86.03	3.42	81.25	1.72	
The performance drop is compared with single-task instruction fine-tuning.

Abbreviations: NER = named entity recognition; RAMIE = retrieval-augmented multi-task information extraction; RE = relation extraction; TE = triple extraction; UC = usage classification.

The highest F1 score for each task and the best average F1 score for each model are presented in bold.

Additionally, we calculated the relative F1 score drop for each task and model compared to single-task instruction fine-tuning. Under the multi-task setting, MedAlpaca-13B experienced the largest drop at 5.66%, while the average performance drop across all models was 2.72%. Specifically, the average F1 score drops for the NER, TE, and UC tasks across the 8 LLMs were 2.77%, 5.64%, and 3.31%, respectively. Interestingly, the RE task showed a slight improvement under the multi-task instruction fine-tuning setting, suggesting potential task-specific benefits.

Discussion

Extracting DS information from clinical notes is vital due to the increasing use of DSs and the critical need for accurate data on their usage, efficacy, and safety. With limited regulatory oversight, reliable extraction of DS-related information from clinical records is essential to support patient safety and informed decision-making. LLMs, with their advanced NLP capabilities, are particularly well-suited for this task. Their proficiency in managing complex, unstructured data allows them to effectively handle multiple DS-related tasks. By leveraging techniques such as instruction fine-tuning, MTL, and RAG, LLMs improve the precision and relevance of extracted DS data, making them transformative tools for advancing DS safety and effectiveness in healthcare.

This section reflects on our findings in the context of single-task instruction fine-tuning, the RAMIE framework, and the implications of removing RAG from the framework. We also analyze errors and discuss limitations and future directions.

The first key finding is that LLMs consistently outperformed BERT-based models on DS-related tasks, demonstrating exceptional performance. For instance, MedAlpaca-7B achieved the highest F1 score of 86.38 under the single-task instruction fine-tuning setting, underscoring the superiority of LLMs in handling complex, multi-faceted tasks. LLMs’ advanced architectures and larger model sizes enable them to capture deeper semantic patterns and utilize richer contextual information compared to smaller models like BERT. Additionally, the generative capabilities of LLMs allow them to adapt across diverse tasks without requiring task-specific architectural changes, a notable limitation of BERT-based models.

This ability to generalize across tasks while maintaining high performance positions LLMs as ideal tools for complex domains such as biomedical information extraction, where precision and adaptability are paramount.

Second, our RAMIE framework demonstrated the effectiveness of MTL, achieving performance comparable to single-task instruction fine-tuning. For example, Llama2-13B, combined with the Contriever retriever, achieved an F1 score of 85.96, outperforming its single-task fine-tuning counterpart, which scored 84.99. We conducted an extensive evaluation, comparing model performance under single-task settings and the RAMIE framework with RAG across 4 tasks. This analysis involved pairing each model with 3 different retrievers, resulting in 96 experimental setups. Notably, 46 of these setups yielded better results using the RAMIE framework, indicating that it delivers outcomes comparable to single-task fine-tuning while offering additional benefits.

A key advantage of the RAMIE framework lies in its integration of RAG, which enhances LLM performance by incorporating relevant examples during training and testing. By dynamically retrieving examples, RAG augments the training data, enabling the model to generate more accurate predictions. As shown in Figure 2, we evaluated LLM performance across 5 configurations: zero-shot (labeled as “w/o RAG” in the table), random example, and 3 retrievers (MedCPT, Contriever, and BMRetriever). The zero-shot setting serves as the baseline without RAG, while the random example configuration acts as a baseline for using examples. Interestingly, using random examples in the prompt reduced model performance, whereas all 3 retrievers—MedCPT, Contriever, and BMRetriever—consistently improved performance.

Figure 2. Performance comparison (average F1 score) of the RAMIE framework and the MTL without RAG. We averaged the F1 scores of 4 tasks for each model. Abbreviations: MTL = multi-task learning; RAG = retrieval-augmented generation; RAMIE = retrieval-augmented multi-task information extraction.

A set of eight bar charts illustrating the performance of eight large language models across five different retrieval settings.

Contriever emerged as the top-performing retriever, with 6 out of 8 models achieving their highest scores in combination with it. BMRetriever followed closely, delivering the best results for 2 models. By dynamically retrieving task-specific examples, RAG alleviates the burden on the LLM to internally store all knowledge, allowing it to focus on generating contextually accurate predictions for DS-related information extraction.

Beyond comparable performance to single-task instruction fine-tuning, the RAMIE framework offers significant advantages in storage efficiency and reduced training costs. A single model trained within the framework can handle all 4 tasks simultaneously, eliminating the need to train separate models for each task. This makes RAMIE particularly effective in resource-constrained environments where running multiple LLMs across devices is not feasible. By reducing storage requirements and training costs while maintaining or even improving performance for some models, RAMIE represents a practical and efficient solution for DS-related information extraction.

Lastly, we conducted an ablation study by running MTL experiments without RAG. When compared to single-task instruction fine-tuning, the results revealed a decrease in overall average F1 scores, as shown in Figure 3. This decline can be attributed to the inherent complexity of MTL, which requires the model to handle multiple tasks simultaneously. The increased cognitive load of distinguishing between tasks and adapting to varying output formats challenges the model’s capacity, potentially impairing its performance on individual tasks. This negative impact, where learning multiple tasks slightly hinders task-specific performance, arises from the need to allocate resources for differentiating between tasks and managing their diverse requirements. Such trade-offs are consistent with findings from previous research,48 highlighting the challenges of balancing task complexity in MTL frameworks.

Figure 3. Average F1 scores comparison between single-task learning and multi-task learning.

A bar chart comparing the performance of eight large language models with BERT under single-task and multi-task settings.

Error analysis

Diving into these promising results, through observing the generation, we found LLMs are suffering from the following errors:

Redundant information: In tasks like NER and TE, the language model occasionally extracts unnecessary information. For instance, while expert annotations label “motion sickness” as an AE, the model often extracts “mild motion sickness” as the result. Here, “mild” is an adjective describing the AE rather than a core part of it.

Information omission: The model occasionally failed to capture all relevant information. In sentences with multiple entities, it might extract only a subset of them—capturing 3 out of 4 entities, for instance. Similarly, when there are multiple triples in a sentence, the model sometimes retrieves only one, overlooking additional relevant relationships.

Incorrect generation: It includes misclassifying entities, incorrectly assigning relationships between head and tail entities, and extracting non-entity words as entities.

Limitations and future directions

This work has a few limitations. First, we did not include particularly large models, such as Llama-2-70B, in our experiments. Larger models often have greater capacity to handle the complexities of learning multiple tasks concurrently, which could potentially enhance MTL performance. Second, to the best of our knowledge, no retriever specifically optimized for DS tasks currently exists. Such a retriever could further improve model accuracy and relevance in this domain. Lastly, we did not explore few-shot learning scenarios. Investigating model performance under few-shot conditions could provide valuable insights into its adaptability and ability to generalize with limited labeled data. For future research, we recommend expanding the exploration of retrieval-augmented multi-task frameworks using a broader range of LLM architectures and datasets to gain deeper insights into the framework’s scalability across domains. Additionally, experimenting with retrievers beyond MedCPT, Contriever, and BMRetriever may identify more effective approaches to enhance model performance. Finally, studying transfer learning between related tasks and integrating more advanced model architectures could address the observed performance limitations in MTL, leading to improved efficiency and accuracy across tasks.

Conclusion

This paper presented the RAMIE framework, a retrieval-augmented, multi-task LLM solution for extracting DS information from clinical records. RAMIE effectively handled NER, RE, TE, and UC tasks, achieving high accuracy and efficiency through instruction fine-tuning, MTL, and RAG. Experimental results demonstrated that RAMIE demonstrates its excellent abilities in DS information extraction while achieving efficiency, confirming its potential for scalable, efficient information extraction in healthcare applications.

Acknowledgments

We would like to express our sincere gratitude to the reviewers for any suggestions.

Author contributions

Z.Z. and R.Z. conceptualized and designed the study. Z.Z. and M.L. curated the data. Z.Z. executed the experiments. Z.Z. and S.Z. drafted the initial manuscript, and R.Z. reviewed and finalized the manuscript. R.Z. supervised the whole project.

Funding

This work was supported by the National Institutes of Health’s National Center for Complementary and Integrative Health under grant numbers R01AT009457 and U01AT012871, the National Institute on Aging under grant number R01AG078154, the National Cancer Institute under grant number R01CA287413, the National Institute of Diabetes and Digestive and Kidney Diseases under grant number R01DK115629, and the National Institute on Minority Health and Health Disparities under grant number 1R21MD019134-01. The content is solely the responsibility of the authors and does not represent the official views of the National Institutes of Health.

Conflicts of interest

The authors state that they have no competing interests to declare.

Data availability

The data underlying this article cannot be shared publicly due to the privacy of patient health information. All associated codes are available at https://github.com/Learner4everrr/RAMIE.


References

1 Council for Responsible Nutrition. 2023 CRN Consumer Survey on Dietary Supplements. 2023. Accessed September 1, 2024. https://www.crnusa.org/2023survey/infographics
2 Fu PP , ChiangH-M, XiaQ, et al  Quality assurance and safety of herbal dietary supplements. J Environ Sci Health C Environ Carcinog Ecotoxicol Rev. 2009;27:91-119.19412857 10.1080/10590500902885676
3 Dodge T , LittD, KaufmanA.  Influence of the dietary supplement health and education act on consumer beliefs about the safety and effectiveness of dietary supplements. J Health Commun. 2011;16:230-244.21120738 10.1080/10810730.2010.529493
4 Petroczi A , TaylorG, NaughtonD.  Mission impossible? Regulatory and enforcement issues to ensure safety of dietary supplements. Food Chem Toxicol. 2011;49:393-402.21087651 10.1016/j.fct.2010.11.014
5 U.S. Food and Drug Administration. Facts about dietary supplements. 2023. Accessed October 1, 2024. https://www.fda.gov/news-events/rumor-control/facts-about-dietary-supplements
6 Tucker J , FischerT, UpjohnL, MazzeraD, KumarM.  Unapproved pharmaceutical ingredients included in dietary supplements associated with us Food and Drug Administration warnings. JAMA Netw Open. 2018;1:e183337.30646238 10.1001/jamanetworkopen.2018.3337 PMC6324457
7 D’Cunha NM , GeorgousopoulouEN, DadigamuwageL, et al  Effect of long-term nutraceutical and dietary supplement use on cognition in the elderly: a 10-year systematic review of randomised controlled trials. Br J Nutr. 2018;119:280-298.29310724 10.1017/S0007114517003452
8 Van Norman GA.  Limitations of animal studies for predicting toxicity in clinical trials: is it time to rethink our current approach?  JACC Basic Transl Sci. 2019;4:845-854.31998852 10.1016/j.jacbts.2019.10.008 PMC6978558
9 Palmer ME , HallerC, McKinneyPE, et al  Adverse events associated with dietary supplements: an observational study. Lancet. 2003;361:101-106.12531576 10.1016/S0140-6736(03)12227-1
10 Timbo BB , ChirtelSJ, IhrieJ, et al  Dietary supplement adverse event report data from the FDA Center for Food Safety and Applied Nutrition Adverse Event Reporting System (CAERS), 2004-2013. Ann Pharmacother. 2018;52:431-438.29171279 10.1177/1060028017744316
11 Fan Y , AdamTJ, McEwanR, PakhomovSV, MeltonGB, ZhangR.  Detecting signals of interactions between warfarin and dietary supplements in electronic health records. Stud Health Technol Inform. 2017;245:370-374.29295118 PMC5760175
12 Zhang R , ManoharN, ArsoniadisE, et al  Evaluating term coverage of herbal and dietary supplements in electronic health records. AMIA Annu Symp Proc  2015;2015:1361-1370.26958277 PMC4765597
13 Fan Y , ZhangR.  Using natural language processing methods to classify use status of dietary supplements in clinical notes. BMC Med Inform Decis Mak. 2018;18:15-22.30066648 10.1186/s12911-018-0626-6 PMC6069512
14 Shickel B , TighePJ, BihoracA, RashidiP.  Deep EHR: a survey of recent advances in deep learning techniques for electronic health record (EHR) analysis. IEEE J Biomed Health Inform. 2018;22:1589-1604.29989977 10.1109/JBHI.2017.2767063 PMC6043423
15 Cowie MR , BlomsterJI, CurtisLH, et al  Electronic health records to facilitate clinical research. Clin Res Cardiol. 2017;106:1-9.10.1007/s00392-016-1025-6 PMC5226988 27557678
16 Jha AK , DesRochesCM, CampbellEG, et al  Use of electronic health records in U.S. hospitals. N Engl J Med. 2009;360:1628-1638.19321858 10.1056/NEJMsa0900592
17 Fan Y , ZhouS, LiY, ZhangR.  Deep learning approaches for extracting adverse events and indications of dietary supplements from clinical text. J Am Med Inform Assoc. 2021;28:569-577.33150942 10.1093/jamia/ocaa218 PMC7936508
18 Lee L-H , LuY.  Multiple embeddings enhanced multi-graph neural networks for Chinese healthcare named entity recognition. IEEE J Biomed Health Inform. 2021;25:2801-2810.33385314 10.1109/JBHI.2020.3048700
19 Zhou H , LiM, XiaoY, YangH, ZhangR.  LEAP: LLM instruction-example adaptive prompting framework for biomedical relation extraction. J Am Med Inform Assoc. 2024;31:2010-2018.38904416 10.1093/jamia/ocae147 PMC11339510
20 Li M , ZhanZ, YangH, XiaoY, HuangJ, ZhangR. Benchmarking retrieval-augmented large language models in biomedical NLP: application, robustness, and self-awareness. 2024. arXiv, arXiv:2405.08151, preprint: not peer reviewed.
21 Holper S , BarmanrayR, ColmanB, YatesCJ, LiewD, SmallwoodD.  Ambiguous medical abbreviation study: challenges and opportunities. Intern Med J  2020;50:1073-1078.31389137 10.1111/imj.14442
22 Grossman Liu L , GrossmanRH, MitchellEG, et al  A deep database of medical abbreviations and acronyms for natural language processing. Sci Data. 2021;8:149.34078918 10.1038/s41597-021-00929-4 PMC8172575
23 Fan Y , PakhomovS, McEwanR, ZhaoW, LindemannE, ZhangR.  Using word embeddings to expand terminology of dietary supplements on clinical notes. JAMIA Open. 2019;2:246-253.31825016 10.1093/jamiaopen/ooz007 PMC6904105
24 Rizvi RF , VasilakesJ, AdamTJ, et al  iDISK: the integrated dietary supplements knowledge base. J Am Med Inform Assoc. 2020;27:539-548.32068839 10.1093/jamia/ocz216 PMC7075538
25 Dang H , LeeK, HenryS, UzunerO. Ensemble BERT for classifying medication-mentioning tweets. In: Gonzalez-Hernandez G, Klein AZ, Flores I, et al., eds. Proceedings of the Fifth Social Media Mining for Health Applications Workshop & Shared Task. Association for Computational Linguistics; 2020:37-41.
26 Singh E , BompelliA, WanR, BianJ, PakhomovS, ZhangR.  A conversational agent system for dietary supplements use. BMC Med Inform Decis Mak. 2022;22:153.35799177 10.1186/s12911-022-01888-5 PMC9264487
27 Schutte D , VasilakesJ, BompelliA, et al Discovering novel drug-supplement interactions using a dietary supplements knowledge graph generated from the biomedical literature. 2021. arXiv, arXiv:2106.12741, preprint: not peer reviewed.10.1016/j.jbi.2022.104120 PMC9335448 35709900
28 Zhou S , SchutteD, XingA, et al Identification of dietary supplement use from electronic health records using transformer-based language models. In: 2021 IEEE 9th International Conference on Healthcare Informatics (ICHI), Victoria, BC, Canada, August 9-12, 2021, 513-514.
29 Radford A. Improving language understanding by generative pre-training. 2018. Accessed May 1, 2024. https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf
30 Radford A , WuJ, ChildR, et al  Language models are unsupervised multitask learners. OpenAI Blog. 2019;1:9.
31 Brown TB. Language models are few-shot learners. 2020. arXiv, arXiv:2005.14165, preprint: not peer reviewed.
32 Touvron H , MartinL, StoneK, et al Llama 2: open foundation and fine-tuned chat models. 2023. arXiv, arXiv:2307.09288, preprint: not peer reviewed.
33 Bent AA.  Large language models: AI’s legal revolution. Pace Law Rev. 2023;44:91.
34 Zhou S , XuZ, ZhangM, et al Large language models for disease diagnosis: a scoping review. 2024. arXiv, arXiv:2409.00097, preprint: not peer reviewed.
35 Goel A , GuetaA, GilonO, et al  LLMs accelerate annotation for medical information extraction. Proc Mach Learn Res. 2023;225:82-100.
36 Monajatipoor M , YangJ, StremmelJ, et al LLMs in biomedicine: a study on clinical named entity recognition. 2024. arXiv, arXiv:2404.07376, preprint: not peer reviewed.
37 Chen R , QinC, JiangW, ChoiD. Is a large language model a good annotator for event extraction? Proc AAAI Conf Artif Intell. 2024;38:17772-17780.
38 Sun Q , HuangK, YangX, TongR, ZhangK, PoriaS. Consistency guided knowledge retrieval and denoising in LLMs for zero-shot document-level relation triplet extraction. Proc ACM Web Conf.  2024;2024:4407-4416.
39 Zhang Y , WangM, RenC, et al Pushing the limit of LLM capacity for text classification. 2024. arXiv, arXiv:2402.07470, preprint: not peer reviewed.
40 Zhou H , AustinR, LuS-C, et al  Complementary and integrative health information in the literature: its lexicon and named entity recognition. J Am Med Inform Assoc. 2024;31:426-434.37952122 10.1093/jamia/ocad216 PMC10797266
41 Zhao T , YanZ, CaoY, LiZ. A unified multi-task learning framework for joint extraction of entities and relations. Proc AAAI Conf Artif Intell  2021;35:14524-14531.
42 Zheng S , WangF, BaoH, HaoY, ZhouP, XuB. Joint extraction of entities and relations based on a novel tagging scheme. 2017. arXiv, arXiv:1706.05075, preprint: not peer reviewed.
43 Qin H , TianY, SongY. Enhancing relation extraction via adversarial multi-task learning. In: Calzolari N, Béchet F, Blache P, et al., eds. Proceedings of the Thirteenth Language Resources and Evaluation Conference. Association for Computational Linguistics; 2022:6190-6199.
44 Chen S , ZhangY, YangQ.  Multi-task learning in natural language processing: an overview. ACM Comput Surv. 2024;56:1-32.
45 Ruder S. An overview of multi-task learning in deep neural networks. 2017. arXiv, arXiv:1706.05098, preprint: not peer reviewed.
46 Kang Z , GraumanK, ShaF. Learning with whom to share in multi-task feature learning. In: Getoor L, Scheffer T, eds. Proceedings of the 28th International Conference on Machine Learning (ICML-11). Omnipress; 2011:521-528.
47 Yin W , XuM, LiY, LiuX. LLM as a system service on mobile devices. 2024. arXiv, arXiv:2403.11805, preprint: not peer reviewed.
48 Mulyar A , UzunerO, McInnesB.  MT-clinical BERT: scaling clinical information extraction with multitask learning. J Am Med Inform Assoc. 2021;28:2108-2115.34333635 10.1093/jamia/ocab126 PMC8449623
49 Lewis P , PerezE, PiktusA, et al  Retrieval-augmented generation for knowledge-intensive NLP tasks. Adv Neural Inf Process Syst. 2020;33:9459-9474.
50 Wu S , ZhaoS, YasunagaM, et al STaRK: benchmarking LLM retrieval on textual and relational knowledge bases. 2024. arXiv, arXiv:2404.13207, preprint: not peer reviewed.
51 Hou Y , ZhangR. Enhancing dietary supplement question answer via retrieval-augmented generation (RAG) with LLM. medRxiv 24313513. 10.1101/2024.09.11.24313513, September 12, 2024, preprint: not peer reviewed.
52 Jiang AQ , SablayrollesA, MenschA, et al Mistral 7B. 2023. arXiv, arXiv:2310.06825, preprint: not peer reviewed.
53 Hugging Face. Meta-Llama 3 8B. 2024. Accessed May 2, 2024. https://huggingface.co/meta-llama/Meta-Llama-3-8B
54 Labrak Y , BazogeA, MorinE, GourraudP-A, RouvierM, DufourR. BioMistral: a collection of open-source pretrained large language models for medical domains. 2024. arXiv, arXiv:2402.10373, preprint: not peer reviewed.
55 Wu C , LinW, ZhangX, ZhangY, XieW, WangY.  PMC-LLaMA: toward building open-source language models for medicine. J Am Med Inform Assoc. 2024;31:1833-1843.38613821 10.1093/jamia/ocae045 PMC11639126
56 Han T , AdamsLC, PapaioannouJ-M, et al MedAlpaca—an open-source collection of medical conversational AI models and training data. 2023. arXiv, arXiv:2304.08247, preprint: not peer reviewed.
57 Jin Q , KimW, ChenQ, et al  MedCPT: contrastive pre-trained transformers with large-scale PubMed search logs for zero-shot biomedical information retrieval. Bioinformatics. 2023;39:btad651.37930897 10.1093/bioinformatics/btad651 PMC10627406
58 Izacard G , CaronM, HosseiniL, et al Unsupervised dense information retrieval with contrastive learning. 2021. arXiv, arXiv:2112.09118, preprint: not peer reviewed.
59 Xu R , ShiW, YuY, et al BMRetriever: tuning large language models as better biomedical text retrievers. 2024. arXiv, arXiv:2404.18443, preprint: not peer reviewed.
60 Longpre S , HouL, VuT, et al  The flan collection: designing data and methods for effective instruction tuning. Proc Mach Learn Res. 2023;941:22631-22648.
61 Zhang S , DongL, LiX, et al Instruction tuning for large language models: a survey. 2023. arXiv, arXiv:2308.10792, preprint: not peer reviewed.
62 Hu EJ , ShenY, WallisP, et al LoRA: low-rank adaptation of large language models. 2021. arXiv, arXiv:2106.09685, preprint: not peer reviewed.
