# AI usage in JAMIA — February 2025 (Vol 32, Issue 2)

20 papers reviewed.

- **9 demonstrate AI/ML usage** (build, deploy, or evaluate an AI/ML system, with a method we can sketch as a `@tidy-ts/ai` topology)
- **5 discuss AI but do not demonstrate** (editorial, policy/regulation, or design perspective)
- **6 do not centrally discuss AI** (interoperability indices, data modeling, blockchain, EMR rule-based extraction, mobile imaging algorithm, correction notice)

Blueprints below use `@tidy-ts/ai` vocabulary: `start → agentNode | sandboxAgentNode | branching | flow | map | parallelMap | parallelFlow → end`, with tools (`server | client | remote | builtin | box`) and sandbox capabilities where relevant. Each blueprint sketches the *primary configuration*; any model/parameter sweep is noted separately.

---

## Papers that demonstrate AI/ML usage

### Application of large language models in clinical record correction ([PMC11756697](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756697_/))
- DOI: 10.1093/jamia/ocae302
- Models: GPT-3.5, GPT-4, Llama-2-7B, Llama-2-13B; adaptation methods: prompt engineering, full fine-tuning (FT), LoRA
- Blueprint (primary: LoRA-adapted Llama-2-7B):
  ```
  start({ clinical_record: string, language: "en" | "es" })
    → agentNode "assess_record"  (Llama-2-7B + LoRA, fine-tuned on CR data)
    → end({ assessment: string, score: number })
  ```
- Sweep: 2 languages (English, Spanish) × {GPT-3.5, GPT-4, Llama-2-13B baseline, Llama-2-7B with prompt eng / FT / LoRA / FT+LoRA}. The strongest open-source configuration (Llama-2-7B + FT + LoRA) surpassed GPT-3.5.

### Lessons learned on information retrieval in EHRs ([PMC11756698](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756698_/))
- DOI: 10.1093/jamia/ocae308
- Models: 7 embedding models (medical and general; encoder and decoder LLMs); 2 pooling strategies × {query side, document side}; winner: BGE (general-domain encoder)
- Blueprint (RAG retrieval stage; BGE primary):
  ```
  start({ query: string })
    → flow "retrieve"
        ├ agentNode "embed_query"     (BGE encoder, pooling-A)
        ├ agentNode "embed_passages"  (BGE encoder, pooling-B)
        └ serverTool  "vector_search" (cosine over EHR passage index)
    → end({ top_k_passages: string[] })
  ```
- Sweep: 7 models × 4 pooling combinations × 3 retrieval tasks × 2 EHR data sources. The paper is an ablation; no generation stage is included in scope.

### Ambient AI scribes: utilization and documentation time ([PMC11756633](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756633_/))
- DOI: 10.1093/jamia/ocae304
- System: DAX Copilot (Nuance) integrated with Epic Haiku at Stanford Health Care; QI study, 45 physicians, 17 428 encounters
- Blueprint (vendor system, treated as a single agent step):
  ```
  start({ audio_recording: bytes, encounter_metadata })
    → agentNode "transcribe_and_draft" (DAX Copilot proprietary LLM)
    → flow "split_into_smartsections"
        ├ HPI ├ Physical Exam ├ Results ├ Assessment & Plan
    → remoteTool "epic_haiku_write" (POST → Epic EHR)
    → end({ draft_note_id: string })
  ```
- The contribution is the deployment + outcomes study, not the model. The paper measures utilization rate, per-note time, daily/after-hours EHR time — it does not build or fine-tune the underlying LLM.

### Ambient AI scribes: physician burnout and usability ([PMC11756571](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756571_/))
- DOI: 10.1093/jamia/ocae295
- System: same DAX Copilot deployment as PMC11756633; 48 physicians, pre/post survey design
- Blueprint: identical topology to PMC11756633 (same vendor system). Contribution is the survey/burnout evaluation; no new AI architecture.

### Beyond EHR data: NLP/ML on patient-nurse audio for cognitive decline ([PMC11756603](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756603_/))
- DOI: 10.1093/jamia/ocae300
- Models: speech-processing + NLP pipeline extracting linguistic and interaction features; combined with structured EHR features in a classifier (best: audio + EHR, F1=88.89, AUC=90.23)
- Blueprint:
  ```
  start({ audio: bytes, ehr_features: record })
    → parallelFlow
        ├ flow "audio_branch"
        │     ├ serverTool "asr_transcribe"
        │     └ agentNode  "extract_linguistic_features"  (NLP — diversity, grammar, repetition, speech patterns)
        └ flow "ehr_branch"
              └ serverTool "ehr_feature_extract"
    → agentNode "fuse_and_classify" (supervised classifier → cognitive-decline risk)
    → end({ risk_score: number, key_indicators: string[] })
  ```
- 47 patients / 125 recordings; small sample, single home-healthcare site.

### LCD benchmark: long-document mortality prediction ([PMC11756648](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756648_/))
- DOI: 10.1093/jamia/ocae287
- Models: SVM bag-of-words, CNN, hierarchical transformer encoder, Mixtral-8x7B-Instruct (zero-shot), GPT-4 via Azure (zero-shot). Task: 30-day out-of-hospital mortality from MIMIC-IV discharge notes (median 1687 words)
- Blueprint (one of the LLM variants; GPT-4 example):
  ```
  start({ discharge_note: string })
    → agentNode "predict_mortality"
        agent: GPT-4 (Azure), zero-shot prompt
        outputSchema: { died_within_30d: boolean, rationale: string }
    → end({ prediction, confidence })
  ```
- Sweep: 5 model classes × prompt/architecture variants. Best F1: 32.2% (GPT-4) vs. 28.9% best supervised. Benchmark dataset is the primary contribution.

### Health system-wide access to generative AI: NYU Langone ([PMC11756645](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756645_/))
- DOI: 10.1093/jamia/ocae285
- System: Azure OpenAI Service ("GenAI Studio") deployed enterprise-wide; >1007 users, ~671 queries/week over 6 months
- Blueprint:
  ```
  start({ user_prompt: string, user_role: enum })
    → agentNode "respond"  (Azure OpenAI / GPT family)
        tools: none enabled at study time (general chat)
    → end({ response: string })
  ```
- Deployment + usage study, not a new model. Survey-driven outcomes (perceived utility, ease, prompt-construction challenges, hallucinations observed).

### CARE-SD: classifier for provider stigmatizing/doubt-marker labels ([PMC11756621](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756621_/))
- DOI: 10.1093/jamia/ocae310
- Pipeline: lexicon (literature stems → expanded with Word2Vec + GPT-3.5 → human-curated) → search 18M MIMIC-III sentences → 1000-sentence labeled samples → supervised classifiers. Best: macro F1 = 0.84 (doubt markers), 0.79 (stigmatizing labels)
- Blueprint:
  ```
  start({ sentence: string })
    → flow "lexicon_match"
        └ serverTool "regex_match"   (58 doubt-marker + 127 stigma expressions)
    → branching on hit?
        ├ "miss" → end({ label: "none" })
        └ "hit"  → agentNode "classify"  (supervised classifier — doubt / stigma / scare-quote)
    → end({ label: enum, confidence: number })
  ```
- Lexicon construction itself used GPT-3.5 as a server-tool helper to expand seed terms (not an inference-time agent step).

### Establishing best practices in LLM research: repeat prompting ([PMC11756642](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756642_/))
- DOI: 10.1093/jamia/ocae294
- System: repeat-prompt analysis of an existing LLM peer-review-bias study; demonstrates that ignoring the within-prompt correlation inflates effective N >100×. ICC = 0.69. A small significant finding reverses to null when random effects are used.
- Blueprint (the *exemplar* methodology, applicable to any per-row LLM study):
  ```
  start({ abstract: string, n_repeats: number })
    → map over 1..n_repeats
        └ agentNode "rate"  (LLM, same prompt each iteration)
    → serverTool "fit_random_effects_model"   (accounts for within-abstract correlation)
    → end({ effect_estimate: number, ci: [number, number] })
  ```
- The contribution is statistical methodology for *evaluating* topologies whose nodes call an LLM repeatedly — directly relevant to `ai.evaluateColumn` style row-wise runs.

### Identifying stigmatizing language in obstetric clinical notes ([PMC11756426](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756426_/))
- DOI: 10.1093/jamia/ocae290
- Models compared: SVM, Decision Tree, Random Forest, BERT-base, ClinicalBERT. Winner: ClinicalBERT, avg F1 = 0.78. Pipeline includes semantic-similarity-based data augmentation to expand low-frequency categories.
- Blueprint (primary: ClinicalBERT):
  ```
  start({ note_sentence: string })
    → agentNode "classify_stigma"
        agent: ClinicalBERT fine-tune
        outputSchema: { category: enum (5 stigma + 1 positive), score: number }
    → end({ category, score })
  ```
- Sweep: 5 model classes × {initial dataset, semantic-similarity-augmented dataset}. 1771 annotated notes from a Northeast US birth-admission cohort.

---

## Papers that discuss AI but do not demonstrate usage

### Hot topics in artificial intelligence ([PMC11756649](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756649_/))
- DOI: 10.1093/jamia/ocae324
- Why no blueprint: editorial summarizing the 5 AI-themed papers in this issue.

### Toward an AI code of conduct for health and healthcare ([PMC11756637](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756637_/))
- DOI: 10.1093/jamia/ocae306
- Why no blueprint: policy piece from the NAM Digital Health Action Collaborative; recommendation, no system.

### Regulation of AI in healthcare: CLIA as a model ([PMC11756634](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756634_/))
- DOI: 10.1093/jamia/ocae296
- Why no blueprint: regulatory perspective proposing CLIA-style oversight; no system implemented or evaluated.

### Human factors methods to mitigate bias in AI-based CDS ([PMC11756570](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756570_/))
- DOI: 10.1093/jamia/ocae291
- Why no blueprint: perspective on UI-design contribution to bias; uses one prior ML-CDS as illustration but does not build, evaluate, or benchmark a system.

### Application of LLMs in clinical record correction — note ([PMC11756428](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756428_/))
- DOI: 10.1093/jamia/ocae309
- Why no blueprint: correction notice for an unrelated systematic review on ML infection diagnostics; ~2 KB of errata text.

---

## Papers that do not centrally discuss AI

- **Efficacy of the mLab App** ([PMC11756647](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756647_/)) — HIV-testing RCT (n=525). The app uses a rule-based **Python + OpenCV image-processing algorithm** on smartphone photos of OraQuick test strips. The paper explicitly contrasts this with deep-learning approaches cited as future work; no ML model is trained or evaluated.
- **New indices to track interoperability among US hospitals** ([PMC11756636](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756636_/)) — psychometric index construction from AHA survey items.
- **EMR-based strategies for death and hospitalization endpoint capture** ([PMC11756702](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756702_/)) — rule-based ICD-code algorithms with time-window optimization; no ML.
- **N3C data enhancements** ([PMC11756694](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756694_/)) — common-data-model design and adoption.
- **Distributed LDS request management** ([PMC11756586](./https___pmc.ncbi.nlm.nih.gov_articles_PMC11756586_/)) — blockchain smart-contracts system; no ML.
