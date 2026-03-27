# Causal Inference & Survival Analysis Package Comparison

Reference implementations relevant to target trial emulation (TTE) data analysis and preparation.

## Package Overview

| Package | Language | Maintainer / Origin | Primary Citation | Scope |
|---------|----------|-------------------|-----------------|-------|
| **`survival`** | R | Terry Therneau (Mayo Clinic, since 1986) | Therneau & Grambsch (2000), Springer | Survival analysis primitives (KM, Cox, parametric, multi-state) |
| **`TrialEmulation`** | R | Li Su (MRC Biostatistics Unit, Cambridge); Isaac Gravestock (Roche) | Su et al. (2024), arXiv 2402.12083 | End-to-end sequential TTE pipeline (descended from Harvard CAUSALab INITIATORS SAS macro) |
| **`debiasedTrialEmulation`** | R | CRAN | — | PS-based TTE with negative control outcome calibration |
| **`lmtp`** | R | Nicholas Williams & Iván Díaz | Díaz et al. (2021), JASA; Williams & Díaz (2023), Observational Studies | Longitudinal causal effects via modified treatment policies (TMLE, SDR) |
| **`PSweight`** | R | Tianhui Zhou, Fan Li et al. | Zhou et al. (2022), The R Journal | Propensity score weighting with augmented estimators |
| **`WeightIt`** | R | Noah Greifer | References Robins, Hernán & Brumback (2000); Austin & Stuart (2015) | Unified interface for many weighting methods; longitudinal MSMs |
| **`cobalt`** | R | Noah Greifer | — | Balance diagnostics (pairs with WeightIt, MatchIt, etc.) |
| **`MatchIt`** | R | Kosuke Imai et al. | Ho et al. (2011), JSS | Propensity score matching (many algorithms) |
| **`cmprsk` / `tidycmprsk`** | R | Bob Gray / Daniel Sjoberg (MSKCC) | Fine & Gray (1999) | Competing risks: subdistribution hazards, cumulative incidence |
| **`lifelines`** | Python | Cam Davidson-Pilon | — | Survival analysis (KM, Nelson-Aalen, Cox, AFT, parametric) |

---

## Detailed Functionality Comparison

### 1. Survival Analysis Primitives

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Kaplan-Meier estimator** | **Yes** (`survfit`) | — | — | — | — | — | — | **Yes** (`KaplanMeierFitter`) | — |
| **Nelson-Aalen estimator** | **Yes** | — | — | — | — | — | — | **Yes** (`NelsonAalenFitter`) | — |
| **Cox proportional hazards** | **Yes** (`coxph`) | — | — | — | — | — | — | **Yes** (`CoxPHFitter`) | — |
| **Stratified Cox models** | **Yes** (strata term) | — | — | — | — | — | — | **Yes** (strata arg) | — |
| **Time-varying covariates** | **Yes** (`tt()` transform) | — | — | — | — | — | — | Partial (episode splitting) | — |
| **Parametric AFT models** | **Yes** (`survreg`: Weibull, exponential, log-normal, log-logistic) | — | — | — | — | — | — | **Yes** (Weibull, log-normal, log-logistic, generalized gamma) | — |
| **Frailty / random effects** | **Yes** (`frailty()`, `coxme`) | — | — | — | — | — | — | — | — |
| **Multi-state models** | **Yes** (Aalen-Johansen) | — | — | — | — | — | — | — | — |
| **PH assumption diagnostics** | **Yes** (Schoenfeld residuals, `cox.zph`) | — | — | — | — | — | — | **Yes** (`check_assumptions`) | — |
| **Log-rank test** | **Yes** (`survdiff`) | — | — | — | — | — | — | **Yes** (logrank + weighted variants) | — |
| **Weighted fitting (for IPTW)** | **Yes** (`weights` arg in `coxph`) | — | — | — | — | — | — | **Yes** (`weights_col` in `CoxPHFitter.fit`) | — |
| **Robust / sandwich SEs** | **Yes** (`cluster` arg) | — | — | — | — | — | — | **Yes** (`robust=True`, `cluster_col`) | — |

### 2. Competing Risks

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Cumulative incidence function (CIF)** | **Yes** (Aalen-Johansen) | — | — | — | — | — | **Yes** (`cuminc`) | — | — |
| **Fine-Gray subdistribution hazard** | — | — | — | — | — | — | **Yes** (`crr`) | — | — |
| **Cause-specific hazard** | **Yes** (via `coxph` on subset) | — | — | — | — | — | — | — | — |
| **Competing risks in causal framework** | — | — | **Yes** (SDR/TMLE with competing risks) | — | — | — | — | Custom via `ParametricRegressionFitter` | — |
| **Tidy interface** | — | — | — | — | — | — | **Yes** (`tidycmprsk`: tidy/glance/augment) | — | — |

### 3. Propensity Score Estimation

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic regression PS** | — | **Yes** (internal) | — | **Yes** | **Yes** (`"glm"`) | **Yes** (default) | — | — | **Yes** |
| **GBM / boosted PS** | — | — | — | — | **Yes** (`"gbm"`) | — | — | — | — |
| **CBPS** | — | — | — | — | **Yes** (`"cbps"`) | — | — | — | — |
| **Entropy balancing** | — | — | — | — | **Yes** (`"ebal"`) | — | — | — | — |
| **Energy balancing** | — | — | — | — | **Yes** (`"energy"`) | — | — | — | — |
| **SuperLearner / ensemble ML** | — | — | **Yes** (built on SuperLearner) | — | **Yes** (`"super"`) | — | — | — | — |
| **Binary treatments** | — | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | — | — | **Yes** |
| **Multi-category treatments** | — | — | **Yes** | **Yes** | **Yes** | **Yes** | — | — | — |
| **Continuous treatments** | — | — | **Yes** | — | **Yes** | — | — | — | — |

### 4. Weighting Methods (IPTW and Variants)

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **ATE weights (IPTW)** | — | **Yes** (IP treatment weights) | — | **Yes** | **Yes** | — | — | — | **Yes** |
| **ATT weights** | — | — | — | **Yes** | **Yes** | — | — | — | — |
| **ATO (overlap) weights** | — | — | — | **Yes** | **Yes** | — | — | — | — |
| **ATM (matching) weights** | — | — | — | **Yes** | **Yes** | — | — | — | — |
| **Entropy weights** | — | — | — | **Yes** | **Yes** | — | — | — | — |
| **IP censoring weights (IPCW)** | — | **Yes** | — | — | — | — | — | — | — |
| **Stabilized weights** | — | **Yes** | — | — | **Yes** | — | — | — | — |
| **Weight trimming / truncation** | — | — | — | — | **Yes** | — | — | — | — |
| **Longitudinal / time-varying weights** | — | **Yes** (sequential trials) | **Yes** (density ratio) | — | **Yes** (`weightitMSM`) | — | — | — | — |

### 5. Matching Methods

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Nearest neighbor** | — | — | — | — | — | **Yes** | — | — | — |
| **Optimal pair matching** | — | — | — | — | — | **Yes** | — | — | — |
| **Full matching** | — | — | — | — | — | **Yes** | — | — | — |
| **Generalized full matching** | — | — | — | — | — | **Yes** (`"quick"`) | — | — | — |
| **Genetic matching** | — | — | — | — | — | **Yes** | — | — | — |
| **Exact matching** | — | — | — | — | — | **Yes** | — | — | — |
| **CEM (coarsened exact)** | — | — | — | — | — | **Yes** | — | — | — |
| **Subclassification** | — | — | — | — | — | **Yes** | — | — | **Yes** (stratification) |
| **PS matching** | — | — | — | — | — | — | — | — | **Yes** |

### 6. Balance Diagnostics

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cobalt` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Standardized mean differences** | — | — | — | **Yes** (`SumStat`) | Via `cobalt` | Via `cobalt` | **Yes** (`bal.tab`) | — | **Yes** |
| **Love plots** | — | — | — | — | — | — | **Yes** (`love.plot`) | — | — |
| **Distributional balance plots** | — | — | — | **Yes** (`plot.SumStat`) | Via `cobalt` | Via `cobalt` | **Yes** (`bal.plot`) | — | — |
| **KS statistics** | — | — | — | — | — | — | **Yes** | — | — |
| **Variance ratios** | — | — | — | — | — | — | **Yes** | — | — |
| **Multi-category treatment balance** | — | — | — | **Yes** | Via `cobalt` | Via `cobalt` | **Yes** | — | — |
| **Longitudinal balance** | — | — | — | — | Via `cobalt` | — | **Yes** | — | — |
| **Clustered / multiply-imputed data** | — | — | — | — | — | — | **Yes** | — | — |

### 7. Target Trial Emulation Pipeline

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Sequential trial expansion (clone-censor-weight)** | — | **Yes** (`data_preparation`) | — | — | — | — | — | — | — |
| **Pooled logistic regression (MSM)** | — | **Yes** (`trial_msm`) | — | — | — | — | — | — | — |
| **Intention-to-treat effect** | — | **Yes** | — | — | — | — | — | — | — |
| **Per-protocol effect** | — | **Yes** | — | — | — | — | — | — | — |
| **Marginal risk difference estimation** | — | **Yes** (`predict.TE_msm`) | — | — | — | — | — | — | — |
| **Marginal cumulative incidence curves** | — | **Yes** | — | — | — | — | — | — | — |
| **Case-control sampling (for large EHR data)** | — | **Yes** (chunk processing) | — | — | — | — | — | — | — |
| **INITIATORS-compatible workflow** | — | **Yes** (`initiators()`) | — | — | — | — | — | — | — |
| **Bias calibration (negative control outcomes)** | — | — | — | — | — | — | — | — | **Yes** |
| **Immortal time bias correction** | — | — | — | — | — | — | — | — | In development |
| **Equipoise assessment** | — | — | — | — | — | — | — | — | **Yes** |

### 8. Causal Estimators

| Functionality | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **TMLE** | — | — | **Yes** (`lmtp_tmle`) | — | — | — | — | — | — |
| **Sequentially doubly robust (SDR)** | — | — | **Yes** (`lmtp_sdr`) | — | — | — | — | — | — |
| **Substitution / G-computation** | — | — | **Yes** (`lmtp_sub`) | — | — | — | — | — | — |
| **IPW estimator** | — | **Yes** (MSM-based) | **Yes** (`lmtp_ipw`) | **Yes** (Hájek) | **Yes** | — | — | — | **Yes** |
| **Augmented IPW (AIPW / doubly robust)** | — | — | **Yes** (TMLE is DR) | **Yes** (MOM, CVR, WET) | — | — | — | — | — |
| **Sandwich variance** | — | — | — | **Yes** | — | — | — | — | — |
| **Multiply robust** | — | — | **Yes** | — | — | — | — | — | — |
| **Point treatment** | — | — | **Yes** | **Yes** | **Yes** | **Yes** | — | — | **Yes** |
| **Longitudinal treatment** | — | **Yes** | **Yes** | — | **Yes** (`weightitMSM`) | — | — | — | — |

### 9. Outcome Types Supported

| Outcome type | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Binary** | — | — | **Yes** | **Yes** | — | — | — | — | **Yes** |
| **Continuous** | — | — | **Yes** | **Yes** | — | — | — | — | — |
| **Time-to-event** | **Yes** | **Yes** | **Yes** | — | — | — | **Yes** | **Yes** | **Yes** |
| **Time-to-event with competing risks** | **Yes** (multi-state) | — | **Yes** | — | — | — | **Yes** (Fine-Gray) | Custom | — |
| **Censored** | **Yes** | **Yes** (IPCW) | **Yes** | — | — | — | **Yes** | **Yes** | — |

### 10. Effect Measures

| Effect measure | `survival` | `TrialEmulation` | `lmtp` | `PSweight` | `WeightIt` | `MatchIt` | `cmprsk`/`tidycmprsk` | `lifelines` | `debiasedTrialEmulation` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Hazard ratio** | **Yes** | — | — | — | — | — | **Yes** (subdistribution) | **Yes** | **Yes** |
| **Risk difference** | — | **Yes** (marginal) | **Yes** | **Yes** | — | — | — | — | — |
| **Risk ratio** | — | — | **Yes** | **Yes** | — | — | — | — | **Yes** |
| **Odds ratio** | — | — | **Yes** | **Yes** | — | — | — | — | **Yes** |
| **Mean difference** | — | — | **Yes** | **Yes** | — | — | — | — | — |
| **Cumulative incidence** | **Yes** | **Yes** | — | — | — | — | **Yes** | **Yes** | — |
| **Survival function** | **Yes** | — | — | — | — | — | — | **Yes** | — |

---

## How Packages Compose for a TTE Workflow

A typical target trial emulation analysis uses several of these packages together. Here's how they map to the TTE pipeline:

```
Step 1: Define eligibility & create person-time data
  └─ TrialEmulation::data_preparation()  (sequential trial expansion)

Step 2: Estimate propensity scores
  └─ WeightIt::weightit() or PSweight (for PS estimation)
  └─ TrialEmulation (uses internal GLM for IP weights)

Step 3: Compute IPTW / IPCW
  └─ TrialEmulation (treatment + censoring weights)
  └─ WeightIt::weightitMSM() (for longitudinal weights outside TTE framework)

Step 4: Assess covariate balance
  └─ cobalt::bal.tab() + cobalt::love.plot()
  └─ PSweight::SumStat()

Step 5: Fit outcome model
  └─ TrialEmulation::trial_msm() (pooled logistic MSM)
  └─ survival::coxph() with weights (weighted Cox)
  └─ lmtp::lmtp_tmle() / lmtp::lmtp_sdr() (non-parametric, doubly robust)

Step 6: Estimate causal effects
  └─ TrialEmulation::predict.TE_msm() (marginal risk differences, cumulative incidence)
  └─ lmtp (risk differences via TMLE/SDR)
  └─ PSweight::PSweight() (ATE/ATT/ATO with augmented estimators)

Step 7: Sensitivity & diagnostics
  └─ debiasedTrialEmulation (negative control outcome calibration)
  └─ survival::cox.zph() (PH assumption)
  └─ cobalt (post-weighting balance)
```

---

## Key Overlaps & Distinctions

### Where packages genuinely overlap
- **PS estimation**: `WeightIt`, `PSweight`, `MatchIt`, and `TrialEmulation` all estimate propensity scores internally. `WeightIt` offers the most methods; `PSweight` offers the most estimand targets; `TrialEmulation` only does what's needed for its pipeline.
- **IPTW**: `WeightIt`, `PSweight`, and `TrialEmulation` all compute inverse probability weights. `WeightIt` is the most flexible (many methods, longitudinal). `PSweight` has the best variance estimation (sandwich). `TrialEmulation` handles both treatment AND censoring weights jointly.
- **Causal effect estimation**: `lmtp`, `PSweight`, and `TrialEmulation` all estimate causal contrasts, but with fundamentally different statistical approaches (non-parametric TMLE/SDR vs. augmented weighting vs. pooled logistic MSM).

### Where each is uniquely authoritative
- **`survival`**: The only package here for core survival modeling (KM curves, Cox regression, parametric AFT, multi-state, frailty). Everything else delegates to it or reimplements subsets.
- **`TrialEmulation`**: The only package that implements the full sequential trial expansion / clone-censor-weight pipeline with pooled logistic MSMs. Direct lineage from Hernán/Robins methodology.
- **`lmtp`**: The only package offering non-parametric, multiply-robust longitudinal causal inference with ML integration. Uniquely handles continuous and mixture exposures.
- **`cmprsk`/`tidycmprsk`**: The only packages for Fine-Gray subdistribution hazard regression specifically.
- **`cobalt`**: The only dedicated balance diagnostics package that integrates with all conditioning packages.
- **`MatchIt`**: The only package focused on the full range of matching algorithms.
- **`debiasedTrialEmulation`**: The only package with negative control outcome calibration for TTE.

### Recommended minimal set for TTE
For a standard target trial emulation with time-to-event outcome:
1. **`TrialEmulation`** — pipeline orchestration (data expansion, weights, MSM)
2. **`survival`** — underlying survival modeling when needed outside the MSM
3. **`cobalt`** — balance diagnostics
4. **`cmprsk`** — if competing risks are present

For a non-parametric / doubly-robust approach:
1. **`lmtp`** — estimation (replaces steps 2-6 above with a single framework)
2. **`survival`** — descriptive survival curves
3. **`cobalt`** — balance diagnostics (still useful for transparency)

---

## Sources

- [survival CRAN (Therneau, 2026)](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf)
- [TrialEmulation arXiv paper](https://arxiv.org/abs/2402.12083) · [CRAN](https://cran.r-project.org/package=TrialEmulation) · [Getting Started](https://causal-lda.github.io/TrialEmulation/articles/Getting-Started.html)
- [debiasedTrialEmulation CRAN](https://cran.r-project.org/web/packages/debiasedTrialEmulation/index.html)
- [lmtp JASA paper: Díaz et al. (2021)](https://doi.org/10.1080/01621459.2021.1955691) · [Package paper (Williams & Díaz, 2023)](https://muse.jhu.edu/article/883479) · [CRAN](https://cran.r-project.org/package=lmtp)
- [PSweight R Journal paper (2022)](https://journal.r-project.org/articles/RJ-2022-011/) · [CRAN](https://cran.r-project.org/web/packages/PSweight/PSweight.pdf)
- [WeightIt CRAN](https://cran.r-project.org/package=WeightIt) · [Docs](https://ngreifer.github.io/WeightIt/)
- [cobalt CRAN](https://cran.r-project.org/package=cobalt) · [Vignette](https://cran.r-project.org/web/packages/cobalt/vignettes/cobalt.html)
- [MatchIt CRAN](https://cran.r-project.org/web//packages/MatchIt/MatchIt.pdf) · [Methods vignette](https://cran.r-project.org/web/packages/MatchIt/vignettes/matching-methods.html)
- [cmprsk CRAN](https://cran.r-project.org/web/packages/cmprsk/cmprsk.pdf) · [tidycmprsk](https://mskcc-epi-bio.github.io/tidycmprsk/)
- [lifelines GitHub](https://github.com/CamDavidsonPilon/lifelines) · [Docs](https://lifelines.readthedocs.io/en/latest/)
- [Harvard CAUSALab Software](https://www.hsph.harvard.edu/causal/software/)
