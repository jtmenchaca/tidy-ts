
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
PMCID: PMC11833468
PMID: 39812778
DOI: 10.1093/jamia/ocaf006
Article ID: ocaf006
Article version: 1
Subjects: Research and Applications, AcademicSubjects/MED00580, AcademicSubjects/SCI01060, AcademicSubjects/SCI01530

Development and evaluation of a 4M taxonomy from nursing home staff text messages using a fine-tuned generative language model

https://orcid.org/0000-0003-0989-2968 Farmer Matthew Steven PhD, RN Conceptualization Data curation Formal analysis Funding acquisition Investigation Methodology Software Validation Visualization Sinclair School of Nursing, University of Missouri, Columbia, MO 65211, United States

Popescu Mihail PhD Conceptualization Data curation Project administration Supervision Validation Department of Biomedical Informatics, Biostatistics, and Medical Epidemiology, School of Medicine, University of Missouri, Columbia, MO 65211, United States

Powell Kimberly PhD, RN Conceptualization Data curation Project administration Resources Supervision Validation Sinclair School of Nursing, University of Missouri, Columbia, MO 65211, United States

Corresponding author: Matthew Steven Farmer, PhD, RN, Sinclair School of Nursing, University of Missouri, 915 Hitt Street, Columbia, MO 65211, United States (msfppy@missouri.edu)
Publication date: 2025 Mar
Electronic publication date: 2025 Jan 15
Volume: 32
Issue: 3
First page: 535
Last page: 544
Received 2024 Oct 17; Revised 2024 Dec 21; 2024 Dec 31; Accepted 2025 Jan 3
Copyright: © The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association.
Copyright year: 2025
License: This is an Open Access article distributed under the terms of the Creative Commons Attribution License (https://creativecommons.org/licenses/by/4.0/), which permits unrestricted reuse, distribution, and reproduction in any medium, provided the original work is properly cited.
License URL: https://creativecommons.org/licenses/by/4.0/

Keywords: health services for the aged, text messaging, pattern recognition, automated, clinical decision-making, communication, ontology, taxonomy, LLM

Funding: National Institute on Aging 10.13039/100000049 National Institutes of Health 10.13039/100000002 R01AG078281
Page count: 11

==============================
Abstract

Objective

This study aimed to explore the utilization of a fine-tuned language model to extract expressions related to the Age-Friendly Health Systems 4M Framework (What Matters, Medication, Mentation, and Mobility) from nursing home worker text messages, deploy automated mapping of these expressions to a taxonomy, and explore the created expressions and relationships.

Materials and Methods

The dataset included 21 357 text messages from healthcare workers in 12 Missouri nursing homes. A sample of 860 messages was annotated by clinical experts to form a “Gold Standard” dataset. Model performance was evaluated using classification metrics including Cohen’s Kappa (κ), with κ ≥ 0.60 as the performance threshold. The selected model was fine-tuned. Extractions were clustered, labeled, and arranged into a structured taxonomy for exploration.

Results

The fine-tuned model demonstrated improved extraction of 4M content (κ = 0.73). Extractions were clustered and labeled, revealing large groups of expressions related to care preferences, medication adjustments, cognitive changes, and mobility issues.

Discussion

The preliminary development of the 4M model and 4M taxonomy enables knowledge extraction from clinical text messages and aids future development of a 4M ontology. Results compliment themes and findings in other 4M research.

Conclusion

This research underscores the need for consensus building in ontology creation and the role of language models in developing ontologies, while acknowledging their limitations in logical reasoning and ontological commitments. Further development and context expansion with expert involvement of a 4M ontology are necessary.

Objective

Controlled Terminologies such as the Systematized Nomenclature of Medicine Clinical Terms (SNOMED CT), International Classification of Diseases (ICD), and Logical Observation Identifies Names and Codes (LOINC) assist researchers and clinicians by having a standardized representation of concepts, categories, and their relationships in specific health domains.1,2 This aids in data integration, reasoning, natural language processing research, and sematic interoperability. To date, there is no controlled terminology developed to describe the 4M Framework for Age-Friendly Health Systems.3 The 4M Framework includes four evidence-based concepts (What Matters, Medication, Mentation, and Mobility) that are fundamental to providing quality care for older adults and driving decision-making toward their health and satisfaction.4–6 By creating a taxonomy of expressions representing the 4M framework, researchers and clinicians can further develop analysis and interventions that promote and improve the integration of the 4M framework into clinical practice, documentation, and communications to improve care for older adults. For example, developing a standardized 4M vocabulary and describing semantic relationships between terms could lead to automated data extraction from multiple sources such as medical records, research databases, and provider notes. In addition, clinical decision support systems could leverage the taxonomy to identify gaps in documentation or clinical communication, prompting a clinician to address the gaps, potentially leading to improved outcomes.

Development of clinical ontologies is a challenging task.7 This is due to the complexity of the multi-disciplinary clinical domain, the need for sematic precision, consensus for standardization, and the dynamic nature of clinical science and knowledge development.8–13 However, recent advancements in natural language processing, specifically generative pretrained transformer (GPT) language models, may present an alternative to traditional ontology development.14–17 A modern ontology development can leverage these architectures in the following ways: (1) automated knowledge extraction through large scale text mining and dynamic updates to the knowledge base18; (2) contextual awareness and sematic understanding that removes single- or multi-word restraints on traditional natural language processing (NLP) techniques19; (3) scalability by adaptation in domain-specific tasks while maintaining the generalized ability to handle diverse language tasks20; (4) interoperability by unifying multiple ranges of medical knowledge and aspects of healthcare through the transformer model21; and (5) cost and resource efficiency through reducing manual labor and maintenance of complex ontology systems.22

These methods can depart from the traditional methods of ontology development but can be better viewed through the lens of constructivist epistemology.7,23 In this philosophy of science, knowledge is created and constructed by the scientific community, existing as an emergent part of human and social structures. Within the domain of medical language, taxonomies, and ontology engineering,24 this is an important perspective to recognize, as language itself is recognized as a human construct.25 The creation of any ontology, within this theory, is therefore an approximation of a reality within language which evolves alongside scientific exploration and experimentation.26 The utilization of a language model to support ontology learning augments this process by complementing traditional ontology development methods. The use of language models in ontology engineering is not new, but is an active research area in ontology engineering.14,27–29 It is currently recognized that language models show promise in automating specific tasks of ontology development but have limitations in creating consensus and persistent ontological commitments. This study focuses on developing a robust, structured taxonomy for the 4M framework that enables knowledge extraction and may facilitate the next steps of ontology creation. To achieve this, we utilize a generative language model fine-tuned on expert consensus, which then automates text extraction, labeling of hierarchical subclasses, and generation of synonyms, related words, and taxonomic relationships.

4M Framework and Age-Friendly Health Systems

The United States healthcare systems are positioned to carry an increasingly heavy volume of older adult care as our aging population grows. As the population of older adults outpaces the supply of clinicians to care for them, strategies to improve care and reduce burden on these providers must be adopted.30 One such strategy is the Age-friendly health systems, developed by the Institute for Healthcare Improvement (IHI) in collaboration with the John A. Hartford Foundation, which seeks to follow evidence-based practices and provide a reduced cognitive burden on clinicians when providing care for older adults.5 The evidence-based framework includes concepts of What Matters, Medication, Mentation, and Mobility (4Ms). In Figure 1, a visual representation from IHI is presented. These four concepts provide essential characteristics for medical decision making, clinical communication, and documentation that improve care for older adults.

Figure 1. 4M framework for age-friendly health systems.

An infographic showing the 4Ms Framework for Age-Friendly Health Systems. The framework is displayed as four interconnected circles around a central gray area labeled “4Ms Framework.” The circles are: “What Matters” (yellow) with an icon of two people, “Medication” (green) with pill and liquid icons, “Mentation” (blue) with a person reading icon, and “Mobility” (orange) with a walking person icon. To the right are detailed descriptions of each M.

Data context and text messages

The data utilized for analysis included text messages sent by and to healthcare workers from 12 nursing homes (NH) participating in the Missouri Quality Initiative (MOQI). This initiative was a CMS-funded innovation and coordination project that began in 2012.3 During MOQI, one of the aspects of the improvement process was to document, through the INTERACT survey, key factors related to NH-to-hospital transfer events. Text message content was derived from a HIPAA-compliant communication tool, utilized by the workers of the participating nursing homes including features such as read receipts, response time tracking, modifying recipients, and multiuser accounts. This tool is accessed by a desktop browser or mobile device that allows nursing home workers to communicate timely resident information in a secure way. Examination of text messages is ideal in this setting due to the asynchronous nature of communication in healthcare, particularly in nursing homes where the physician or advanced practice provider may not be physically present. Furthermore, text messages offer a glimpse into the daily challenges and decision-making processes of healthcare workers, providing valuable insight not typically found in retrospective chart reviews or surveys.

Study aims

The aims of this study was to: (1) explore the utilization of a fine-tuned small language model to extract 4M expressions from nursing home clinician text messages; (2) deploy automated mapping of these expressions to taxonomies; and (3) explore the created expressions and relationships in preparation for ontology development. Since text messages can include complex variation in communication style, typos, emotional responses, ambiguous context, short- and long-form expressions, and different work environments, a constructivist approach, leveraging generative language models is warranted to accomplish these objectives.

Materials and methods

Data processing and standard

The text message data were imported into a Python Jupyter notebook (version 3.12.4). The data were comprised of individual text messages and related attributes including sender, receiver, date, and timestamp. For the purposes of a larger ongoing study, these transfer events were linked to text messages sent up to two weeks prior to the transfer by the NH workers. This cutoff-time was determined by the aims of the larger study, to examine 4M communication and NH-to-hospital transfers.3 Preprocessing of these data and text only included removal of duplicates. To create an evaluation dataset, a sample of 860 messages, referred to as the “Gold Standard” were extracted from the full dataset and annotated by two clinical experts familiar with the 4M framework. The Gold Standard was a random sampling of 40 transfer events recorded through MOQI data and extraction of the corresponding text messages surrounding the transfer event. Currently, the 4M framework lacks a structured ontology to create specific guidelines, like words or phrases, for the annotators to extract. Therefore, the annotators reviewed the text message independently, identifying the presence of words or phrases that match any of the 4M concepts based on their understanding of the literature regarding Age-Friendly Health Systems and the 4M framework. After independent annotation, differences between the annotators were aligned via simultaneous discussion and review of the differing extractions. These words or phrases were recorded and used to calculate a total count of What Matters, Medication, Mentation, or Mobility expressions for each text message. If the message had no content related to any of the 4Ms, this was recorded as zero.

Initial model selection and fine-tuning

Due to the identifiable nature of these data, generative language models were selected that could be ran on a local device, without access to the internet. These included small-sized, open-source licensed, generative language models that were capable of following task-specific prompts. Multiple feasibility tests were first conducted on 25% random sample of the Gold Standard dataset. Accuracy, Precision, Recall, F1, Receiver-Operator Characteristics Area-Under-Curve (ROC AUC), and Cohen’s Kappa (κ) were used to assess the model’s capability in extracting any 4M content that aligned with the Gold Standard. Models were evaluated with the same prompt structure and model parameters. The research team set κ ≥ 0.60 as the threshold to determine sufficient model performance, indicating “moderate” agreement.31 This threshold suggests a reliability of the extractions beyond chance that we considered acceptable in this exploratory model evaluation. Given the complexity of the 4M concepts and variability in language processing, achieving “moderate” agreement in these initial tests was deemed a reasonable benchmark, balancing the need for rigorous evaluation and practical constraints of small, locally run models. A final test was conducted against the full Gold Standard dataset to identity the best performing open-source model out of these selections.

After a final model was selected, the correct extractions and incorrect extractions (judged by the Gold Standard dataset) were labeled as “accepted” or “rejected.” This label was used to conduct parameter-efficient fine-tuning32 on the selected model with a reward-training methodology called Odds Ratio Preference Optimization (ORPO).33 The model was fine-tuned with multiple epochs then compared with the Gold Standard to evaluate changes after tuning.

Words and phrases were extracted from text messages using a structured response framework that created JSON output. Initial prompt engineering and model parameters remained unchanged to provide consistency with prior testing. This output was then assessed for presence of extraction (binary value of 4Ms concept) and then each word or phrase was counted (integer value). The binary value and integer values were used to compare against the Gold Standard dataset.

Semi-automated taxonomy creation

After extraction, the text was processed with sentence embeddings34 for further language processing. First, similar extractions were removed using cosine similarity with a threshold of 0.95. Then the full dataset was split by the respective 4M classes (What Matters, Medication, Mentation, Mobility). These embeddings were then clustered with hierarchical agglomerative clustering using Euclidean distance and Ward linkage.35 Optimal hierarchical clustering was determined through visual review of dendrograms. Distance thresholds for four levels of hierarchy were chosen for each M allowing for discriminative separation of each cluster while avoiding excessive specific clustering. Words from each cluster were then given as a list to the language model for labeling. Each label was stored as a list to check for cosine similarity threshold of 0.9999 to avoid duplicative labeling. Labeling progressed until similarity was resolved. Prompts utilized to achieve extraction and labeling from the language model are included in the Appendix S1.

Taxonomy exploration

With the 4Ms extracted and clustered into subclasses, we utilized the language model to define properties and relationships. Relationships were assessed by word and associated embeddings. A priori competency questions were created by the authors to determine the scope and evaluate taxonomy creation. The list of competency questions is included in the Data S1. Lastly, the final dataset was explored and visualized using descriptive statistics and network graphs.36,37

Human-subjects protection

This study was approved by the University of Missouri Institutional Review Board (#2009109); PI: Kimberly Powell.

Results

Data processing and standard

The text message data included 21 209 text messages with dates, timestamps, text message IDs, resident IDs, and associated nursing home after duplicate removal. The Gold Standard dataset was annotated by two expert annotators independently, then differences were discussed. There were 93 differences in What Matters, 28 differences in Medication, 25 differences in Mentation, and 40 differences in Mobility. For example: annotator A extracted “symbolic disfunction” as Mentation for the text message “She is a DNR. She has DX of HTN and other symbolic dysfunction,” while annotator B did not extract this expression. Annotators agreed symbolic dysfunction should be included in Mentation. This process continued until all disagreements had resolution. The final Gold Standard dataset represented 594 expressions related to the 4M framework from the 860 text messages.

Initial model selection and fine-tuning

Four open-source models were chosen for testing including: (1) Gemma 2 9b (9 billion parameters); (2) Gemma 2 2b; (3) Llama 3.1 8b; and (4) Mistral Nemo 12.2b.38–40 The model parameters included temperature = 0.0, repeat_penalty = None, top_p = 0.9, top_k = 40, seed = 418. Models extracted terms from 860 messages that matched the message IDs from the gold standard dataset. Without fine-tuning, Gemma 2 9b exhibited the best performance in 4M extraction with What Matters (κ = 0.41), Medication (κ = 0.78), Mentation (κ = 0.62), and Mobility (κ = 0.45).

Gemma 2 9b was then ORPO fine-tuned using 266 “accepted” and “rejected” examples, with 66 held for validation. Full parameters, configuration, and visualization of training loss are presented in the Appendix S1. The model was fine-tuned with 1, 2, and 4 epochs of training. Overall, 2 epochs of training demonstrated the greatest improvement in classification metrics, without overfitting. The final model resulted in What Matters (κ = 0.60), Medication (κ = 0.93), Mentation (κ = 0.83), and Mobility (κ = 0.55), with overall κ = 0.73. Full results of each stage are presented in Table 1.

Table 1. ORPO fine-tuning evaluation.a

		What Matters	Medication	Mentation	Mobility	
Model	1	2	3	4	1	2	3	4	1	2	3	4	1	2	3	4	
BINARY	Recall	0.42	0.66	0.64	0.66	0.97	0.94	0.97	0.97	0.67	0.75	0.88	0.88	0.35	0.42	0.44	0.44	
F1	0.50	0.63	0.66	0.66	0.82	0.90	0.94	0.95	0.64	0.73	0.84	0.79	0.48	0.57	0.59	0.58	
AUC	0.68	0.79	0.79	0.80	0.95	0.96	0.98	0.98	0.82	0.87	0.93	0.93	0.67	0.71	0.72	0.78	
Cohen’s Kappa	0.41	0.55	0.60	0.60	0.78	0.88	0.93	0.93	0.62	0.72	0.83	0.78	0.45	0.55	0.55	0.56	
COUNT	Spearman Rho	0.44	0.57	0.61	0.61	0.82	0.89	0.93	0.94	0.63	0.73	0.84	0.79	0.50	0.60	0.63	0.61	
Cohen’s Kappa (binned)	0.27	0.45	0.47	0.49	0.53	0.75	0.80	0.80	0.50	0.62	0.75	0.66	0.26	0.39	0.48	0.43	
MAE	0.24	0.19	0.18	0.18	0.26	0.10	0.09	0.09	0.07	0.05	0.03	0.05	0.08	0.08	0.07	0.07	
a Models: (1) Gemma 2 9b q4_0, (2) Gemma 2 9b ORPO q4_0 (1 epoch), (3) Gemma 2 9b ORPO q4_0 (2 epochs), (4) Gemma 2 9b ORPO q4_0 (4 epochs).

Bolded text indicates the highest score.

Semi-automated taxonomy creation

The fine-tuned language model, hereafter referred to as the “4M Model,” was then used to extract 4M expressions from the 21 209 text messages. To contextualize the results below, summary statistics of the final dataset are as follows:

Unique residents represented = 386

Unique transfer events = 627 (some residents transferred multiple times)

Unique text messages with 4M content = 7077

Total of 4M extractions = 13 716

Average age of resident at time of transfer = 68.16

Count of 4M content by sender

Nursing Staff = 5546 (40.5%)

Advanced Practice Registered Nurses (APRN) = 4599 (33.6%)

Physician = 1276 (9.3%)

Other Staff (eg, Director of nursing, administrative staff, Unit manager, etc.) = 2281 (16.6%)

Total extractions by 4M concept

What Matters = 2825

Medication = 7557

Mentation = 2034

Mobility = 1300

The first level of clustering included eight clusters for What Matters, nine for Medication, four for Mentation, and four for Mobility. The unique expressions identified in the first subclass and the size of the subsequent subclasses are presented in Table 2. A dendrogram representing the thresholds for What Matters is presented in Figure 2.

Figure 2. A dendrogram depicting the thresholds for hierarchical clustering.

This plot shows clusters merging at various levels of distance. Different clusters are represented by distinct colors, and horizontal red dashed lines indicate potential cutoffs for cluster formation at different distances.

Table 2. 4M subclass labels and distribution.

Class	Subclass Level 1	Number of Unique Expressions	N clusters at Level 2	N clusters at Level 3	N clusters at Level 4	
What Matters	Resident Preferences and End-of-Life Care	310	28	69	176	
Resident Care Coordination	303	
Resident Care Preferences	121	
Resident Preferences and Family Input	102	
Nutrition and Sleep Issues	94	
Resident Health Status	77	
Resident Well-being Concerns	76	
Resident Preferences and States	39	
Medication	Medication Adjustments	729	40	69	173	
Medication Management	685	
Pharmacological Interventions	289	
Hypodermoclysis and Fluids Management	287	
Resident Care Instructions	269	
Prescription Adjustments	176	
Scheduled Drug Administration	160	
Potassium Management	67	
Medication Schedules	58	
Mentation	Behavioral and Cognitive Changes	482	12	52	127	
Cognitive and Physiological Distress	146	
Cognitive Health Status	89	
Ocular Signs and Symptoms	28	
Mobility	Mobility Issues	261	16	40	90	
Mobility Support Needs	125	
Patient Mobility Actions	99	
Mobility Impairment Symptoms	65	

To illustrate the clustering and labeling, the message M19415 includes the words “pain worse with movement.” This was extracted as class = Mobility, first cluster = Mobility Impairment Symptoms, second cluster = Mobility Symptom Indicators, third cluster = Mobility Pain Indicators, fourth cluster = Mobility-Related Pain Symptoms.

Taxonomy exploration

Key concepts

The 4M concept of Medication is the most frequent expression in the text message dataset including thousands of examples including prescribing, monitoring, and administration. According to the sender and receiver data, these medication messages were most frequently exchanged by nursing staff sending and advanced practice registered nurses receiving (12.1%), followed by nursing staff to DON (9.3%), and APRN to DON (4.9%). What Matters, as the second largest class, showed many expressions representing end-of-life terms, care coordination, and family preferences. For example, the level 1 cluster “Resident Preferences and End-of-Life Care” included 310 expressions. What Matters messages were primarily sent by the nursing staff to APRN roles (8.8%), followed by nursing staff to DON (7.0%) and APRN to other APRN roles (5.9%).

Categories

The subclasses created by the 4M model demonstrate a diversity of the clusters and the homogeny of the Medication class. The first level of clustering is shown in Table 2.

To illustrate an exploration of this taxonomy, the word “pain” was queried for its presence in related terms or direct quotation across the data. One can assume that the concept of pain could exist in all classes. The absence of pain could be a central care preference in What Matters, driving treatment decisions for Medication, is moderated by ensuring a resident’s mental status (Mentation), and some treatment decisions may impact Mobility. The terms related to pain had the highest presence in the Medications class (n = 662) followed by What Matters (n = 494), Mobility (n = 113) and Mentation (n = 73). Figure 3 depicts how pain and related terms are found in the hierarchy of the taxonomy. This query led to a linked cluster labeled “Resident Health Status” which links the 4Ms together. Aspects of mobility challenges, pain complaints, cognitive functioning, and PRN medications are among the subclasses found in the query.

Figure 3. Network visualization of the 4Ms Framework components and interconnected clusters for the concept of pain.

A complex network diagram visualized with four main hubs: What Matters, Medication, Mentation, and Mobility at the center. Each hub branches out into multiple interconnected nodes represented by circles of varying sizes, connected by light blue lines. The nodes contain specific terms such as "Pain Management," "Resident Care Coordination," and "Mobility Indicators." The diagram uses a teal and white color scheme, with larger nodes indicating primary concepts and smaller nodes showing related subcategories. The network structure demonstrates the intricate relationships between different aspects of patient care assessment and documentation.

In contrast, the word “family” had multiple related expressions in What Matters and is not found in the other M’s. Seen in Figure 4, the family includes expressions related to support, decision making, end-of-life discussions, authorization, preferences, and concerns.

Figure 4. Network visualization of the 4Ms Framework components and interconnected clusters for the concept of family.

A complex network diagram visualized as a mind map with one hub: What Matters, at the center. This hub branches out into multiple interconnected nodes represented by circles of varying sizes, connected by light blue lines. The nodes contain specific terms such as “Resident Care Preferences,” “Nutrition and Sleep Issues,” “Resident Preferences and Family Input” and “Resident Care Coordination” The diagram uses the same color and size scheme as Figure 3. The network structure demonstrates the intricate relationships between different aspects of family involvement in resident care.

The last example explores the term “fall.” Falls in older adults present significant complications impacting the 4M concepts. In Figure 5, we can observed the interconnectedness of falls to Mobility, What Matters, and Mentation. These concepts were linked by cognitive dysfunction, physiological changes, nutrition, and therapy adherence.

Figure 5. Network visualization of the 4Ms Framework components and interconnected clusters for the concept of falls.

A complex network diagram visualized as a mind map with three hubs: What Matters, Mentation, and Mobility at the center. This hub branches out into multiple interconnected nodes represented by circles of varying sizes, connected by light blue lines. The nodes contain specific terms such as “Cognitive and Physiological Distress,” “Mobility Support Needs,” “Behavioral and Cognitive Changes" and “Mobility Issues” The diagram uses the same color and size scheme as Figure 3 and 4. The network structure demonstrates the intricate relationships between different aspects and complexity of falls.

Discussion

Qualitative data

Current qualitative studies assessing the 4M framework reveal that many of the clusters and terms extracted from the text messages align with themes identified from residents and clinicians. For example, surveys associated with text messages utilized in this study show subthemes of family and resident preferences within What Matters which aligns with the clusters “Resident Preferences and End-of-Life Care,” “Resident Preferences and Family Input,” and “Resident Care Preferences” identified within our taxonomy.41 In their 2023 qualitative study, Yi et al. assembled a focus group from a purposive sample of clinicians to better understand barriers and unmet needs of inpatient care for older adults in Korea within the context of the Age-Friendly Health System Model and 4M framework. For What Matters, the participants expressed a variety of challenging individual care preferences that require focused, individualized care plans. Medication themes included complexity and challenges in medication review. Delerium management emerged as an important theme in the mentation domain. Finally, the most important theme identified in Mobility included awareness of reduced mobility and risk for falls.42 In our text message data, many of these themes align with the concepts and relationships we have explored. The breadth of What Matters expressions represent the complex individualized needs of each patient including family dynamics, pain, advanced care planning, and satisfaction of care.

Additional M’s have been proposed including Malnutrition43 and Multicomplexity,44 also known as the Geriatrics 5Ms.45 While these concepts were not included in the annotation, fine-tuning, extraction, or clustering phases of this study, there is an indication that these concepts are integrated into the taxonomy in some ways. In the first level clustering of What Matters, “Nutrition and Mobility” emerged as an independent subclass with 94 expressions. Multicomplexity includes many factors such as multimorbidity and polypharmacy.24 This concept was not explicitly addressed in our initial taxonomy development; however, the existing framework for the Medication concept provides a foundation for future elaboration on this phenomenon.

Semi-automated ontology creation

The development of knowledge graphs, taxonomies, and ontologies aided by language models is not new.27,46–48 It is understood that the limitations of language models in ontology engineering include lack of logical reasoning, failure to adhere to ontological commitments, and inability to create consensus among experts.27 Our study presents an advanced approach to creating an ontology precursor. This approach involves fine-tuning a language model using a consensus Gold Standard dataset, as discussed by Mai, Chu, and Paulheim (2024). The inherent limitations are still present, due to the architecture of transformer-based language models, but the model was able to achieve higher agreement (κ = 0.73) with the Gold Standard. The Data S1 presents examples of model extractions compared to expert annotations, including failed extractions, hallucinations, and extractions missed by the annotators. We found that all of the models consistently performed well within the Medication and Mentation concepts yet performed poorly with What Matters and Mobility. The discrepancy likely arises from the model's training on formal language (eg, medication names, medical symptoms), while What Matters and Mobility uses less formal terminology (eg, care preferences, words related to extremities) requiring more complex reasoning. Interestingly, these are the same two areas which had the highest disagreement among the independent annotators.

Limitations

One of the fundamental components of ontology creation is creating consensus in terminology and relationships associated with the ideas, concepts, and classifications present in the domain.49 Additional research and analysis have yet to be completed on a full 4M ontology to support this component. Highlighting the need for an ontology, we observed that expert annotators did not agree on independent annotated expressions before comparing them simultaneously. This illustrates the need for additional consensus-building to create a functional and robust 4M ontology.

The source of this taxonomy development was limited to unstructured text message data from nursing home workers in some Missouri nursing homes. This limits the context and depth of expressions that fully represent the 4M framework. The taxonomy would benefit from additional contexts such as inpatient communications, multidisciplinary experts, physicians’ notes, and resident/patient input. Also, the text message data in this study were for residents with a transfer event from the nursing homes participating in MOQI. The 4Ms extracted and represented in this model are, therefore, related to communication preceding a transfer event from nursing homes. Contexts such as routine communication, end-of-life discussions, safety events, etc. are not necessarily included. Lastly, these extractions are derived from NH worker communication which do not include messages to families or caregivers outside of the NH staff. The taxonomy presented here lacks input from residents, families, and other external stakeholders which would enrich the understanding of 4M concepts. Efforts to standardize the classifications and representations within the 4M ontology are far from complete.

Conclusion

Informal clinician communication is unstructured, nuanced, and complex.51–53 The use of generative models can be a useful tool allowing ontologies to scale and adapt to new contexts.14,15,22,54,55 This study uses a language model fine-tuned on consensus data, annotated by clinical experts, to accelerate ontology engineering. This represents a novel approach to ontology development. In the current state of language models, an end-to-end ontology development still requires expert annotation and consensus. Language models lack a strict ontological commitments, can contain hallucinations, and demonstrate limitations in logical reasoning.27,28 Within this study, the development of a taxonomy is aided by the fine-tuned 4M language model, but a fully developed 4M ontology will still need input from experts in the field of Age-Friendly Health systems. The preliminary creation of the fine-tuned 4M model and initial taxonomy development aides in future research, ontology development, and application in resident care and precision medicine.50 Additional development of features, axioms, and expanding contexts of a 4M ontology are needed.

Supplementary Material

ocaf006_Supplementary_Data

Author contributions

Matthew Steven Farmer conceived the study, developed the methodology, wrote and validated the software, performed the formal analysis and investigation, created the visualizations, and drafted and reviewed the manuscript. Kimberly Powell contributed to conceptualization, validation, resource acquisition, data curation, manuscript review and editing, supervision, project administration, and funding acquisition. Mihail Popescu contributed to conceptualization, validation, resource acquisition, and manuscript review and editing, and provided supervision.

Supplementary material

Supplementary material is available at Journal of the American Medical Informatics Association online.

Funding

This work was supported by the National Institute on Aging of the National Institutes of Health under Award Number R01AG078281. The content is solely the responsibility of the authors and does not necessarily represent the official views of the National Institutes of Health.

Conflicts of interest

None declared.

Data availability

The data underlying this article cannot be shared publicly due to the privacy of individuals (residents, family members, and healthcare workers) mentioned within the text messages. The data will be shared on reasonable request to the corresponding author.


References

1 Despotou G , KorkontzelosI, ArvanitisTN.  Bottom-up natural language processing based evaluation of the fitness of UMLS as a semantic source for a computer interpretable guidelines ontology. In: MEDINFO 2021: One World, One Health—Global Partnership for Digital Innovation. IOS Press; 2022:1060-1061. 10.3233/SHTI220267 35673205
2 Zuo X , LiJ, ZhaoB, et al  Normalizing clinical document titles to LOINC document ontology: an initial study. AMIA Annu Symp Proc. 2020;2020:1441-1450.33936520 PMC8075502
3 Powell KR , PopescuM, LeeS, MehrDR, AlexanderGL.  Examining the use of text messages among multidisciplinary care teams to reduce avoidable hospitalization of nursing home residents with dementia: protocol for a secondary analysis. JMIR Res Protoc. 2023;12:e50231. 10.2196/50231 37556199 PMC10448283
4 Lesser S , ZakharkinS, LouieC, EscobedoMR, WhyteJ, FulmerT.  Clinician knowledge and behaviors related to the 4Ms framework of Age-Friendly Health Systems. J Am Geriatr Soc. 2022;70:789-800. 10.1111/jgs.17571 34837381 PMC9299469
5 Mate K , FulmerT, PeltonL, et al  Evidence for the 4Ms: interactions and outcomes across the care continuum. J Aging Health. 2021;33:469-481. 10.1177/0898264321991658 33555233 PMC8236661
6 Thombley RL , RogersSE, Adler-MilsteinJ.  Developing electronic health record-based measures of the 4Ms to support implementation and evidence generation for age-friendly health systems. J Am Geriatr Soc. 2024;72:882-891. 10.1111/jgs.18722 38126964
7 Bodeneider O , SmithB, BurgunA.  The ontology-epistemology divide: a case study in medical terminology. Form Ontol Inf Syst Proc Int Conf FOIS Conf. 2004;2004:185-195.PMC4346778 25745641
8 Panzer M.  Increasing patient findability of medical research: annotating clinical trials using standard vocabularies. Bull Assoc Inf Sci. 2017;43:40-43. 10.1002/bul2.2017.1720430213
9 Sahay R , NtalaperasD, KamateriE, et al An ontology for clinical trial data integration. In: 2013 IEEE International Conference on Systems, Man, and Cybernetics. IEEE; 2013:3244-3250. 10.1109/SMC.2013.553
10 Malec SA , TanejaSB, AlbertSM, et al  Causal feature selection using a knowledge graph combining structured knowledge from the biomedical literature and ontologies: a use case studying depression as a risk factor for Alzheimer’s disease. J Biomed Inform. 2023;142:104368. 10.1016/j.jbi.2023.104368 37086959 PMC10355339
11 Rahim NR.  Integrated ontology development for clinical decision support system in the case study of methadone maintenance therapy. IJATCSE. 2019;8:272-282. 10.30534/ijatcse/2019/4181.62019
12 El-Atawy SS , KhalefaME. Building an ontology-based electronic health record system. In: Proceedings of the 2nd Africa and Middle East Conference on Software Engineering. ACM; 2016:40-45. 10.1145/2944165.2944172
13 Hsu W. Representing evidence from biomedical literature for clinical decision support: challenges on semantic computing and biomedicine. In: 2014 IEEE Int Conf Semantic Comput. IEEE; 2014:1-2. 10.1109/ICSC.2014.67
14 Giglou HB , D’SouzaJ, AuerS.  LLMs4OL: large language models for ontology learning. arXiv. 2023;2. 10.48550/arXiv.2307.16648
15 Keloth VK , HuY, XieQ, et al  Advancing entity recognition in biomedicine via instruction tuning of large language models. Bioinformatics. 2024;40:btae163. 10.1093/bioinformatics/btae163 38514400 PMC11001490
16 Burnell R , HaoH, ConwayARA, OralloJH.  Revealing the structure of language model capabilities. arXiv. 2023;14. 10.48550/arXiv.2306.10062
17 Bumgardner VKC , MullenA, ArmstrongS, HickeyC, TalbertJ.  Local large language models for complex structured medical tasks. arXiv. 2023;3. 10.48550/arXiv.2308.01727 PMC11141822 38827047
18 Rula A , D’SouzaJ. Procedural text mining with large language models. arXiv. 2023. 10.48550/arXiv.2310.03376
19 John Basha M , VijayakumarS, JayashankariJ, AlawadiAH, DurdonaP.  Advancements in natural language processing for text understanding. In: VijayanV, Senthil KumarTS, eds. E3S Web Conf. 2023;399:04031. 10.1051/e3sconf/202339904031
20 Zayyanu ZM.  Revolutionising translation technology: a comparative study of variant transformer models—BERT, GPT, and T5. CSEIJ. 2024;14:15-27. 10.5121/cseij.2024.14302
21 Thakkar KY , JagdishbhaiN.  Exploring the capabilities and limitations of GPT and Chat GPT in natural language processing. JMRA. 2023;10:18-20. 10.18231/j.jmra.2023.004
22 Haridy S , IsmailRM, BadrN, HashemM.  An ontology development methodology based on ontology-driven conceptual modeling and natural language processing: tourism case study. BDCC. 2023;7:101. 10.3390/bdcc7020101
23 Smith B. Beyond concepts: ontology as reality representation. 2004. Accessed September 30, 2024. https://www.semanticscholar.org/paper/Beyond-Concepts%3A-Ontology-as-Reality-Representation-Smith/6aab8a108f355f57a2b29dedd4c3f50f6e1f9d6e
24 Monette PJ , SchwartzAW.  Optimizing medications with the geriatrics 5Ms: an age-friendly approach. Drugs Aging. 2023;40:391-396. 10.1007/s40266-023-01016-6 37043166 PMC10092911
25 Fujita H , FujitaK.  Human language evolution: a view from theoretical linguistics on how syntax and the lexicon first came into being. Primates. 2022;63:403-415. 10.1007/s10329-021-00891-0 33821365 PMC9463227
26 Rees CE , CramptonPES, MonrouxeLV.  Revisioning academic medicine through a constructionist lens. Acad Med. 2020;95:846-850. 10.1097/ACM.0000000000003109 31809294
27 Neuhaus F.  Ontologies in the era of large language models—a perspective. AO. 2023;18:399-407. 10.3233/AO-230072
28 Neuhaus F , HastingsJ.  Ontology development is consensus creation, not (merely) representation. AO. 2022;17:495-513. 10.3233/AO-220273
29 Mai HT , ChuCX, PaulheimH. Do LLMs really adapt to domains? An ontology learning perspective. arXiv. 2024. 10.48550/ARXIV.2407.19998
30 IHI. Age-Friendly Health Systems | Institute for Healthcare Improvement. Accessed September 20, 2024. https://www.ihi.org/networks/initiatives/age-friendly-health-systems
31 McHugh ML.  Interrater reliability: the kappa statistic. Biochem Med. 2012;22:276-282.PMC3900052 23092060
32 Xu L , XieH, QinSZJ, TaoX, WangFL.  Parameter-efficient fine-tuning methods for pretrained language models: a critical review and assessment. arXiv. 2023. 10.48550/arXiv.2312.12148
33 Hong J , LeeN, ThorneJ. ORPO: monolithic preference optimization without reference model. arXiv. 2024. 10.48550/arXiv.2403.07691
34 Reimers N , GurevychI. Sentence-BERT: sentence embeddings using siamese BERT-networks. arXiv. 2019. 10.48550/arXiv.1908.10084
35 AgglomerativeClustering. scikit-learn. Accessed October 8, 2024. https://scikit-learn/stable/modules/generated/sklearn.cluster.AgglomerativeClustering.html
36 Uschold M , GruningerM.  Ontologies: principles, methods and applications. Knowl Eng Rev. 1996;11:93-136. 10.1017/S0269888900007797
37 Grüninger M , FoxM. The role of competency questions in enterprise engineering. In: Benchmarking — Theory and Practice. IFIP Advances in Information and Communication Technology. Springer; 1995:22-31. 10.1007/978-0-387-34847-6_3
38 Google Deepmind. Gemma 2 is now available to researchers and developers. Google. June 27, 2024. Accessed September 27, 2024. https://blog.google/technology/developers/google-gemma-2/
39 Dubey A , JauhriA, PandeyA, et al The Llama 3 Herd of Models. arXiv. 2024. 10.48550/arXiv.2407.21783
40 Mistral AI Team. Mistral NeMo. July 18, 2024. Accessed September 27, 2024. https://mistral.ai/news/mistral-nemo/
41 Powell KR , IsnainyM, AmewudahP, et al  Untangling the complex web of avoidable nursing home-to-hospital transfers of residents with dementia. Alzheimers Dement. 2024;20:8038-8047. 10.1002/alz.14292 39369299 PMC11567868
42 Yi Y , LeeY, KangS, et al  Unmet needs and barriers in providing hospital care for older adults: a qualitative study using the age-friendly health system framework. Clin Interv Aging. 2023;18:1321-1332. 10.2147/CIA.S409348 37588681 PMC10426405
43 Chao CT.  Enhancing the 4M framework: the critical role of malnutrition in immobility among hospitalized patients. Can J Cardiol. 2024;40:1500. 10.1016/j.cjca.2024.04.024 38734206
44 Moye J , DriverJA, OwsianyMT, et al  Assessing what matters most in older adults with multicomplexity. Gerontologist. 2022;62:e224-e234. 10.1093/geront/gnab071 34043004 PMC8982330
45 Tinetti M , HuangA, MolnarF.  The geriatrics 5M’s: a new way of communicating what we do. J Am Geriatr Soc. 2017;65:2115-2115. 10.1111/jgs.14979 28586122
46 Lopes A , CarboneraJ, SchmidtD, GarciaL, RodriguesF, AbelM.  Using terms and informal definitions to classify domain entities into top-level ontology concepts: an approach based on language models. Knowl-Based Syst. 2023;265:110385. 10.1016/j.knosys.2023.110385
47 Mateiu P , GrozaA. Ontology engineering with large language models. arXiv. 2023. 10.48550/arXiv.2307.16699
48 Pan S , LuoL, WangY, ChenC, WangJ, WuX.  Unifying large language models and knowledge graphs: a roadmap. IEEE Trans Knowl Data Eng. 2024;36:3580-3599. 10.1109/TKDE.2024.3352100
49 Köhler N , NeuhausF.  The mercurial top-level ontology of large language models. arXiv. 2024;26. 10.48550/arXiv.2405.01581
50 Haendel MA , ChuteCG, RobinsonPN.  Classification, ontology, and precision medicine. N Engl J Med. 2018;379:1452-1462. 10.1056/NEJMra1615014 30304648 PMC6503847
51 Hart GK , HoskingN, ToddJG, MartinL. Technology based challenges of informal clinical communication in an Australian tertiary referral hospital—a mixed methods assessment of the need for change. medRxiv. 2024. 10.1101/2024.06.26.24308798
52 Redjdal A , BouaudJ, GuézennecG, GligorovJ, SeroussiB.  Creating synthetic patients to address interoperability issues: a case study with the management of breast cancer patients. Stud Health Technol Inform. 2020;275:177-181. 10.3233/SHTI200718 33227764
53 Sherimon V , SherimonPC, NairRV, et al  eCOVID19—development of ontology-based clinical decision support system for COVID-19. Front Health Inform. 2022;11:101. 10.30699/fhi.v11i1.339
54 Gomez-Perez JM , DenauxR, Garcia-SilvaA. Aligning embedding spaces and applications for knowledge graphs. In: A Practical Guide to Hybrid Natural Language Processing: Combining Neural Models and Knowledge Graphs for NLP. Springer; 2020:152-154. 10.1007/978-3-030-44830-1
55 Van Veen D , Van UdenC, BlankemeierL, et al  Clinical text summarization: adapting large language models can outperform human experts. Res Sq [Preprint]. 2023. 10.21203/rs.3.rs-3483777/v1 PMC11479659 38413730
