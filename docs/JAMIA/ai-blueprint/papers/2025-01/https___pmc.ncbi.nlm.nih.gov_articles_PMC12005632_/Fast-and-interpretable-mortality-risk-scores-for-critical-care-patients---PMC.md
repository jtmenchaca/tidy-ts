J Am Med Inform Assoc

. 2025 Jan 28;32(4):736–747. doi: [10.1093/jamia/ocae318](https://doi.org/10.1093/jamia/ocae318)

# Fast and interpretable mortality risk scores for critical care patients

[Chloe Qinyu Zhu](https://pubmed.ncbi.nlm.nih.gov/?term="Zhu%20CQ"[Author])

### Chloe Qinyu Zhu, BS

1 Department of Computer Science, Duke University, Durham, NC 27708, United States

Find articles by [Chloe Qinyu Zhu](https://pubmed.ncbi.nlm.nih.gov/?term="Zhu%20CQ"[Author])

1,#, [Muhang Tian](https://pubmed.ncbi.nlm.nih.gov/?term="Tian%20M"[Author])

### Muhang Tian, BS

2 Department of Computer Science, Duke University, Durham, NC 27708, United States

Find articles by [Muhang Tian](https://pubmed.ncbi.nlm.nih.gov/?term="Tian%20M"[Author])

2,#, [Lesia Semenova](https://pubmed.ncbi.nlm.nih.gov/?term="Semenova%20L"[Author])

### Lesia Semenova, PhD

3 Microsoft Research, New York, NY 10012, United States

Find articles by [Lesia Semenova](https://pubmed.ncbi.nlm.nih.gov/?term="Semenova%20L"[Author])

3, [Jiachang Liu](https://pubmed.ncbi.nlm.nih.gov/?term="Liu%20J"[Author])

### Jiachang Liu, PhD

4 Cornell University, Ithaca, NY 14853, United States

Find articles by [Jiachang Liu](https://pubmed.ncbi.nlm.nih.gov/?term="Liu%20J"[Author])

4, [Jack Xu](https://pubmed.ncbi.nlm.nih.gov/?term="Xu%20J"[Author])

### Jack Xu, MS

5 Department of Computer Science, Duke University, Durham, NC 27708, United States

Find articles by [Jack Xu](https://pubmed.ncbi.nlm.nih.gov/?term="Xu%20J"[Author])

5, [Joseph Scarpa](https://pubmed.ncbi.nlm.nih.gov/?term="Scarpa%20J"[Author])

### Joseph Scarpa, BS

6 Department of Computer Science, Duke University, Durham, NC 27708, United States

Find articles by [Joseph Scarpa](https://pubmed.ncbi.nlm.nih.gov/?term="Scarpa%20J"[Author])

6, [Cynthia Rudin](https://pubmed.ncbi.nlm.nih.gov/?term="Rudin%20C"[Author])

### Cynthia Rudin, PhD

7 Department of Computer Science, Duke University, Durham, NC 27708, United States

Find articles by [Cynthia Rudin](https://pubmed.ncbi.nlm.nih.gov/?term="Rudin%20C"[Author])

7,✉

*   Author information
*   Article notes
*   Copyright and License information

1 Department of Computer Science, Duke University, Durham, NC 27708, United States

2 Department of Computer Science, Duke University, Durham, NC 27708, United States

3 Microsoft Research, New York, NY 10012, United States

4 Cornell University, Ithaca, NY 14853, United States

5 Department of Computer Science, Duke University, Durham, NC 27708, United States

6 Department of Computer Science, Duke University, Durham, NC 27708, United States

7 Department of Computer Science, Duke University, Durham, NC 27708, United States

✉

Corresponding author: Cynthia Rudin, PhD, Department of Computer Science, Duke University, LSRC Building, Durham, NC 27708, United States (cynthia@cs.duke.edu)

#

Chloe Qinyu Zhu and Muhang Tian contributed equally to this work.

Received 2024 Apr 8; Revised 2024 Dec 6; Accepted 2024 Dec 24; Collection date 2025 Apr.

© The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC12005632  PMID: [39873685](https://pubmed.ncbi.nlm.nih.gov/39873685/)

## Abstract

### Objective

Prediction of mortality in intensive care unit (ICU) patients typically relies on black box models (that are unacceptable for use in hospitals) or hand-tuned interpretable models (that might lead to the loss in performance). We aim to bridge the gap between these 2 categories by building on modern interpretable machine learning (ML) techniques to design interpretable mortality risk scores that are as accurate as black boxes.

### Material and Methods

We developed a new algorithm, GroupFasterRisk, which has several important benefits: it uses both hard and soft direct sparsity regularization, it incorporates group sparsity to allow more cohesive models, it allows for monotonicity constraint to include domain knowledge, and it produces many equally good models, which allows domain experts to choose among them. For evaluation, we leveraged the largest existing public ICU monitoring datasets (MIMIC III and eICU).

### Results

Models produced by GroupFasterRisk outperformed OASIS and SAPS II scores and performed similarly to APACHE IV/IVa while using at most a third of the parameters. For patients with sepsis/septicemia, acute myocardial infarction, heart failure, and acute kidney failure, GroupFasterRisk models outperformed OASIS and SOFA. Finally, different mortality prediction ML approaches performed better based on variables selected by GroupFasterRisk as compared to OASIS variables.

### Discussion

GroupFasterRisk’s models performed better than risk scores currently used in hospitals, and on par with black box ML models, while being orders of magnitude sparser. Because GroupFasterRisk produces a variety of risk scores, it allows design flexibility—the key enabler of practical model creation.

### Conclusion

GroupFasterRisk is a fast, accessible, and flexible procedure that allows learning a diverse set of sparse risk scores for mortality prediction.

**Keywords:** interpretable machine learning, interpretable AI, risk scores, mortality risk, sparsity

## Introduction

Prediction of in-hospital mortality risk is a crucial task in medical decision-making,[1–3](#ocae318-B1) assisting medical practitioners to better estimate the patient’s state and allocate resources appropriately for better treatment, disease staging, and triage support.[4–6](#ocae318-B4) Mortality risk is usually performed with _risk scores_, where, first, each variable is transformed into an integer-valued component function based on its degree of deviation from normal values, and then a nonlinear function transforms the sum of component functions into an estimate of risk. Risk scores are designed to be easy to understand, troubleshoot, and use in practice. They are often _sparse_, which means they use a small number of variables. Risk scores have important advantages: they are transparent, easy to calculate, easy to use, easy to troubleshoot, and easy to display and understand, which is why they are popular across medicine.[7–13](#ocae318-B7)

Severity of illness risk scores have been constructed in various ways since the early 1980s, starting with the APACHE,[14](#ocae318-B14) SOFA,[15](#ocae318-B15),[16](#ocae318-B16) APACHE II,[17](#ocae318-B17) and SAPS[8](#ocae318-B8) scores, which are still in use presently, as well as the more recent APACHE IV[18](#ocae318-B18) score. All of these scores were built using a combination of basic statistical techniques and domain expertise. Statistical hypothesis testing was generally used for variable selection, and techniques such as logistic regression and locally weighted least squares[19](#ocae318-B19) were often used for combining variables. This process left many manual choices for analysts: at what significance level should we stop including variables? Of the many variables selected by hypothesis testing, how should we choose which ones would be included? How should the cutoffs for risk increases for each variable be determined? How do the risk scores from logistic regression become integer point values that doctors can easily sum, troubleshoot, and understand? While a variety of heuristics have been used to answer these questions, the answers would ideally be determined automatically by an algorithm that optimizes predictive performance; humans, even equipped with heuristics, are not naturally adept at high-dimensional constrained optimization. It is particularly important that these models are _sparse_ in the number of variables so they are easy to calculate in practice. For instance, because APACHE scores require 142 variables, they are potentially more error-prone, and not all variables may be available for every patient.

If we abandon sparsity in order to maximize predictive performance, we could use black box machine learning (ML) approaches for mortality risk prediction.[20–26](#ocae318-B20) This would give us a baseline of performance for risk scores. To this end, OASIS+ researchers[21](#ocae318-B21) used a variety of black box ML algorithms (such as random forest[27](#ocae318-B27) and XGBoost[28](#ocae318-B28)) on a subset of variables (those used for the OASIS score[21](#ocae318-B21)) to develop models that mostly outperform other severity of illness scores, including SAPS II. Black box models combine variables in highly nonlinear ways, and are not easy to troubleshoot or use in practice, which is why, to the best of our knowledge, OASIS+ models have not been adopted for mortality risk prediction in ICUs. Black box models have caused problems in high-stakes areas like healthcare, where they have high accuracy in predicting psychiatric disorders like schizophrenia but offer no clue to how the prediction is made.[29](#ocae318-B29) Black box models with “explanations” are also insufficient.[30](#ocae318-B30) However, it is useful to benchmark with black box models to determine whether there is a gap in accuracy between interpretable and black box models. In this work, our goal is to develop risk scores that close this gap while maintaining interpretability.

There is prior work on machine learning approaches for creating interpretable mortality prediction models without the need for manual intervention. Specifically, the OASIS score[31](#ocae318-B31) was built using a genetic algorithm[32](#ocae318-B32) to select predictive variables, particle swarm optimization[33](#ocae318-B33) to determine integer scores for variables’ deciles, and logistic regression to transform integer scores into probabilities. However, genetic algorithms and particle swarm optimization suffer from sub-optimal accuracy and long training times, leading to the possibility of improved performance using other techniques.

More importantly, most machine learning model development suffers from the _interaction bottleneck_[34](#ocae318-B34) that arises because machine learning algorithms produce one model at a time, and it is difficult to interact with these algorithms to express user preferences. Designing risk scores requires an interactive and iterative process, where users may need to explore many models to develop one suitable for deployment. Hence, we desire ML algorithms that can rapidly produce a collection of models that are sparse and accurate so users can easily select a model they would use.

In this work, we introduce GroupFasterRisk—an interpretable machine learning algorithm capable of producing a set of diverse, high-quality risk scores—and use it to generate severity of illness scores. GroupFasterRisk simultaneously automates variable selection, cutoffs for risk increases, and integer weight assignments. [Figure 1](#ocae318-F1) provides a risk score for all-cause mortality learned by GroupFasterRisk on our processed version of the MIMIC III dataset with a group sparsity constraint of 15 variables. Our approach optimizes more carefully than the approach of OASIS and another risk-score generation method called AutoScore.[35](#ocae318-B35)  GroupFasterRisk is much more scalable than its predecessor RiskSLIM[36](#ocae318-B36),[37](#ocae318-B37) and is more customizable than its predecessor FasterRisk.[38](#ocae318-B38)  GroupFasterRisk’s optimization process yields higher-quality interpretable models than competitors; in fact, its models are as performant as black box models.

### Figure 1.

[![Graphical demonstration of a risk score formula involving 15 variables. Each of the 15 variables has integer numbers paired with every possible range of values, and one integer is selected for one variable based on the variable’s value. The sum of the 15 integer numbers predicts mortality risk.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/1e6b/12005632/9f00fbf22fe4/ocae318f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005632_ocae318f1.jpg)

[Open in a new tab](figure/ocae318-F1/)

Risk score produced by GroupFasterRisk. This model has a group sparsity of 15 (GFR-15), which means that the model uses 15 variables with multiple splits per variable, which create that variable’s component function. The total number of splits (overall sparsity) is regularized as well as the total number of variables (group sparsity). _Max_ and _Min_ represent the maximum and minimum value of the measurement over the first 24 h of a patient’s ICU stay. We applied monotonicity constraint to _Max Bilirubin_, _Max BUN_, _Min GCS_, and _Min SBP_ as we discuss in [Supplementary Material C.3](#sup1).

## Methods

### Setup description and evaluation metrics

#### Datasets and setup

We consider the Medical Information Mart for Intensive Care III (MIMIC III)[39](#ocae318-B39) and the eICU Collaborative Research Database (eICU)[40](#ocae318-B40) datasets. We trained our models on MIMIC III. We selected a subset of 49 variables (including physiological measurements, lab measurements, and patient comorbidities) from the union of variables in existing severity of illness scores based on a ranking by area under the receiver-operating characteristic curve (AUROC). We transformed continuous and categorical variables into binary and used indicator variables for missing values to indicate whether the value is known. To test the generalization ability of our models, we used the eICU dataset for out-of-distribution (OOD) testing. We provide the details on our cohort selection in [Supplementary Material A.1](#sup1), the datasets and preprocessing in [Supplementary Material A.2](#sup1), the variable selection procedure in [Supplementary Material A.3](#sup1), and on our training and test procedures in [Supplementary Material C.1](#sup1).[64–72](#ocae318-B64) The standard deviation of performance on MIMIC-III was calculated via cross validation.

#### Predictive metrics

We adopt the AUROC and the area under the precision-recall curve (AUPRC) as our metrics for predictive accuracy. Since our datasets are highly imbalanced, AUROC alone may not accurately capture the performance of models on the minority class (expired patients);[41](#ocae318-B41) we use AUPRC as an additional evaluation metric to provide a more complete view of the predictive accuracy.

#### Sparsity metrics

We define a model’s sparsity informally as a way of measuring the model’s size. For linear models such as logistic regression, explainable boosting machine (EBM),[42](#ocae318-B42) AutoScore,[35](#ocae318-B35) and GroupFasterRisk, sparsity is the total number of coefficients, intercepts, and multipliers, including those for all splits for all variables. For tree-based models such as XGBoost,[43](#ocae318-B43) AdaBoost,[44](#ocae318-B44) and Random Forest,[27](#ocae318-B27) sparsity is the number of splits in all trees.

#### Calibration metrics

High AUROC and AUPRC do not ensure that the model precisely estimates the risk probability. This is because they are rank statistics.[45](#ocae318-B45) We evaluate reliability based on Brier score, Hosmer-Lemeshow statistics (HL ), and the standardized mortality ratio (SMR).[46](#ocae318-B46),[47](#ocae318-B47) We use \-statistics for HL , calculated from deciles of predicted probabilities. Unless mentioned otherwise, we use paired \-tests for statistical testing.

### Finding high-quality solutions with GroupFasterRisk

GroupFasterRisk produces high-quality risk scores. It improves over its predecessor FasterRisk,[38](#ocae318-B38) which is a data-driven ML approach that learns high-quality scoring systems within a relatively short time. Although FasterRisk achieves excellent performance, it has limitations: (1) it does not allow users to add hard constraints on the number of variables used in the model; and (2) it does not incorporate monotonicity constraints, which means it can learn unrealistic component functions that might rise and fall, rather than (for instance) just rising. To handle (1) and (2), GroupFasterRisk includes _group sparsity_ and _monotonicity constraints_. Group sparsity provides regularization on all sections of a variable’s component function simultaneously; it controls the overall number of variables or raw features used in the model (like heart rate). We also include a standard sparsity regularization term to reduce the number of splits and binarized features (such as percentiles of heart rate). By including both sparsity terms, our models tend to include use a small number of variables, each of which has a sparse component function. The monotonicity constraints ensure that the models are nondecreasing (or nonincreasing) along certain variables. Together, these constraints encourage GroupFasterRisk to select meaningful variables and assign meaningful weights while obeying domain knowledge. GroupFasterRisk then produces multiple diverse, equally accurate models obeying these constraints. The trained models (risk scores) could be easily visualized with a scorecard representation using our software ([Figure 1](#ocae318-F1)) or with the Riskomon app.[48](#ocae318-B48)  [Figure 2](#ocae318-F2) summarizes the algorithmic approach of GroupFasterRisk.

#### Figure 2.

[![Graphical demonstration of the algorithm’s workflow. First, it solve sparse logistic regression with box constraint, sparsity constraint, beam search size, and group sparsity constraint. Second, it finds many near-optimal sparse logistic regression solutions by feature swapping. Third, it uses a rounding algorithm to find integer valued solutions for all the diverse sparse solutions and produces risk scores.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/1e6b/12005632/01122d61f7b9/ocae318f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005632_ocae318f2.jpg)

[Open in a new tab](figure/ocae318-F2/)

GroupFasterRisk algorithm workflow. We first find a near-optimal solution for a sparse logistic regression problem without the integer constraints. (Beam search involves finding _B_ solutions at each iteration before arriving at the final solution.) This solution is used in the second stage to search for a diverse pool of sparse continuous solutions that also satisfy various constraints while having similar predictive accuracy. We subsequently select the top _M_ solutions and apply a rounding search subroutine to obtain integer-valued solutions. Our algorithm is carefully designed to ensure that the integer-valued solutions maintain similar performance to real-valued solutions.

We now formally present the optimization problem for GroupFasterRisk. Consider a dataset , where is a label such as an in-hospital mortality indicator, is a binarized feature vector, and is the raw feature vector. The set of binarized feature indices is arbitrarily partitioned into disjoint sets (groups), denoted as . Let be a scaled dataset, where we scale by a multiplier , ( will be learned by the algorithm). Consider hypothesis space of linear models , where and . We denote as entries in that belong to a group .

We formulate the problem of creating risk scores as an optimization problem in eqn (1). Our goal is to obtain _integer-valued_ solutions of a _sparse_ ( regularized) logistic regression under sparsity, group sparsity, and box constraint. We denote a solution as . The sparsity constraint \[[eqn (1b)](#E2)\] is the number of non-zero elements in the solution vector and directly controls the model complexity. Group sparsity constraint \[[eqn (1e)](#E5)\], where denotes the indicator function) allows users to control the number of partitions on the binarized features. Box constraint , where , \[[eqn (1c)](#E3)\] allows users to limit the solution values to their desired range, ie, . We provide more details on hyperparameters in [Supplementary Material B.1](#sup1) and demonstrate the effects of group sparsity constraint and monotonicity constraint in [Supplementary Material D.4](#sup1).

The problem of computing a provably optimal integer-valued linear model is NP-hard.[49](#ocae318-B49) We find good approximate solutions using as a multiplier to do so. While must be integer-valued, the product does not need to be. Therefore, we optimize logistic loss for real-valued solution \[[eqn (1a)](#E1)\].

|  | (1a) |
| --- | --- |

|  | (1b) |
| --- | --- |

|  | (1c) |
| --- | --- |

|  | (1d) |
| --- | --- |

|  | (1e) |
| --- | --- |

We solve the optimization problem in eqn (1) similarly to Liu _et al._[38](#ocae318-B38) The process involves solving 3 sub-problems (as in [Figure 2](#ocae318-F2)) using coordinate descent and dynamic programming (see [Supplementary Material B.2](#sup1) for more details).

For a given solution , we compute risk predictions as , where is a sigmoid function. We perform the Sequential Rounding algorithm to find an integer risk score (see [Supplementary Material B.2](#sup1)).

GroupFasterRisk provides the option of a monotonicity constraint so that the risk score is forced to increase (or decrease) along a variable. This allows users to better align the modeling process with domain knowledge. The ablation study in [Supplementary Material D.1](#sup1), [Table S4](#sup1) shows its impact.

For conciseness, we denote GroupFasterRisk models with the prefix GFR and group sparsity as the suffix. For instance, a GroupFasterRisk model trained with a group sparsity of 10 is GFR-10.

### Baseline methods

To demonstrate the superiority of our proposed method, we compare it with 2 sets of baselines. The first set includes existing severity of illness scores such as OASIS,[31](#ocae318-B31) SAPS II,[7](#ocae318-B7) SOFA,[15](#ocae318-B15) and APACHE IV/IVa[18](#ocae318-B18) (we provide details on severity of illness score evaluations in [Supplementary Material C.2](#sup1)). The second set of baselines consists of widely used ML algorithms, such as Logistic Regression, EBM,[50](#ocae318-B50) Random Forest,[27](#ocae318-B27) AdaBoost,[44](#ocae318-B44) and XGBoost.[28](#ocae318-B28) We further categorize these baselines into 2 groups based on the number of variables: sparse (no more than 17 variables, including OASIS, SOFA, and SAPS II) and not sparse (more than 40 variables, like APACHE IV/IVa). Our goal is to develop sparse models since they are highly interpretable,[51](#ocae318-B51) but we still evaluate GroupFasterRisk models against APACHE IV/IVa. For fair comparison, we set the same or lower group sparsity constraint (number of variables) on GroupFasterRisk than the baselines across all the experiments. Note that FasterRisk[38](#ocae318-B38) and RiskSLIM[36](#ocae318-B36),[37](#ocae318-B37) are predecessors of GroupFasterRisk. RiskSLIM does not scale to produce the sizes of risk scores we study here, and FasterRisk is GroupFasterRisk without monotonicity and group sparsity constraints. Thus, we do not include them as baselines.

## Results

### All-cause mortality prediction

We first focus on evaluating how GroupFasterRisk performs when predicting all-cause in-hospital mortality. We then consider patients with different critical illnesses.

#### In-distribution performance and sparsity

GroupFasterRisk models predicted in-hospital mortality with the best AUROC and AUPRC across all internal evaluations on MIMIC III test folds ([Figure 3b](#ocae318-F3)). Specifically, GFR-10 achieves an AUROC of 0.813 (0.007) and AUPRC of 0.368 (0.011), around 0.05 higher than OASIS. When using 15 variables, GFR-15 achieves an AUROC of 0.836 (0.006) and AUPRC of 0.403 (0.011), both around 0.05 higher than SAPS II (all the reported results are statistically significant with ). GroupFasterRisk models are less complex than the competing scoring systems ([Figure 3b](#ocae318-F3)) on MIMIC III. Indeed, when using 10 variables, GFR-10 has model complexity of 42 (0) whereas OASIS has 47. For 15 variables, GFR-15 is 48 (4.9) while SAPS II is 58.

##### Figure 3.

[![Comparison of GroupFasterRisk performances with baselines. GroupFasterRisk outperforms OASIS, SAPS II on both internal evaluation and out-of-distribution testing while performs on-par with APACHE IV/IVa on out-of-distribution testing. Note that for all the comparisons, GroupFasterRisk uses fewer variables than the baselines.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/1e6b/12005632/79526ea6bd84/ocae318f3.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005632_ocae318f3.jpg)

[Open in a new tab](figure/ocae318-F3/)

Comparison of GroupFasterRisk models with OASIS, SAPS II, APACHE IV, and APACHE IVa on all-cause in-hospital mortality prediction task. (A) ROC (left) and PR (right) curves for predicting all-cause in-hospital mortality on OOD evaluation. Our GroupFasterRisk models achieve better performance than all scoring system baselines except for APACHE IV/IVa. (B) GroupFasterRisk compared with the well-known severity of illness scores under different group sparsity constraints (constraints on number of variables). Evaluated on the internal MIMIC III dataset using 5-fold nested cross-validation, the best model from GroupFasterRisk is then evaluated in an OOD setting on the eICU cohort.

#### Out-of-distribution performance and sparsity

We evaluated GroupFasterRisk models on the OOD eICU dataset ([Figure 3b](#ocae318-F3)). We find that GFR-10 outperforms OASIS for both AUROC and AUPRC, with a noticeable margin of +0.039 and +0.075 for AUROC and AUPRC, respectively. Furthermore, GFR-15 achieves better predictive accuracy than SAPS II, with a margin of +0.015 for AUROC and +0.043 for AUPRC. We show the ROC and PR curves for the eICU dataset in [Figure 4a](#ocae318-F4).

##### Figure 4.

[![Figure A is a graphical description of the relationship between group sparsity and performance measured by AUROC and AUPRC, where GroupFasterRisk performs better as group sparsity increases. Figure B is a graphical description of the relationship between sparsity, group sparsity, and runtime. There is an inverse relationship between group sparsity and runtime, and a direct relationship between sparsity and runtime.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/1e6b/12005632/3035b2b19b35/ocae318f4.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005632_ocae318f4.jpg)

[Open in a new tab](figure/ocae318-F4/)

Group sparsities and time consumption of GroupFasterRisk. (A) Performance of GroupFasterRisk under different levels of group sparsity. (Left) Internal evaluation on MIMIC III. (Right) OOD evaluation on eICU. (B) Time consumption to train GroupFasterRisk under various sparsity and group sparsity constraints. Evaluated on an Apple MacBook Pro, M2, using 5 repeated trials on the entire MIMIC III dataset, with sample size of 30 238 and 49 variables.

Although GroupFasterRisk is designed to optimize for sparse models, we included a more complex version, GFR-40, in our OOD evaluation for a thorough comparison with APACHE IV/IVa. GFR-40 outperforms APACHE IV/IVa in terms of AUPRC with a margin of +0.008 for IV and +0.006 for IVa. Although APACHE IV/IVa has higher AUROC scores (+0.007 for IV and +0.009 for IVa), GFR-40 uses significantly less variables (40 compared to 142 for APACHE IV/IVa). (In fact, APACHE cannot be calculated on the MIMIC III dataset, which highlights disadvantage of complicated models in general.)

#### Group sparsity and runtime

[Figure 4a](#ocae318-F4) shows the predictive performance of GroupFasterRisk models under different levels of group sparsity. We find that more group sparsity (using more variables) is positively correlated with an increase in AUROC. A similar observation is found for AUPRC ([Supplementary Material D.2](#sup1), [Figures S8 and S9](#sup1)). However, the increase in AUROC becomes relatively small (saturates) after 30 variables. Note that under different group sparsity levels, GroupFasterRisk’s models outperform OASIS and SAPS-II. It takes at most 2 h to train GroupFasterRisk on our MIMIC III cohort using a MacBook Pro laptop with M2 chip ([Figure 4b](#ocae318-F4)) (recall that MIMIC III cohort has 30 238 patients). This is a relatively short amount of time considering that GroupFasterRisk aims to solve an NP-hard combinatorial optimization problem.[49](#ocae318-B49) We have also benchmarked GroupFasterRisk’s training time for creating multiple models in a single run, and the results are in [Supplementary Material D.8](#sup1).

#### Fairness and calibration

GroupFasterRisk produces reliable and fair risk predictions when we evaluated GroupFasterRisk models across various demographic subgroups, including ethnicity and gender ([Table 1](#ocae318-T1)). (Note that we follow MIMIC-III’s definition of ethnicity in this study.) GroupFasterRisk models are not particularly biased towards the majority race (Caucasians) and are well-calibrated on specific subgroups in our eICU cohort. The models consistently achieve low Brier scores and HL across subgroups. Except in a few cases, GroupFasterRisk models’ Brier scores, HL , and SMR are better than those of OASIS, SAPS II, and APACHE IV/IVa. Furthermore, among sparser models (no more than 17 variables), GroupFasterRisk achieves the highest AUROC and AUPRC. We present ROC, PR, and calibration curves in [Figure S10](#sup1) in [Supplementary Material D.3](#sup1) and provide training details in [Supplementary Material C.4](#sup1).

##### Table 1.

Fairness and calibration across population subgroups in eICU. Similar to the settings aforementioned, GFR-10 compares against OASIS, GFR-15 compares against SAPS II, and GFR-40 compares against APACHE IV/IVa. The better performing methods are in bold.

|  |  | Ethnicity (alphabetical order) |  |  |  |  |  | Gender |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  | African American | Asian | Caucasian | Hispanic | Native American | Other/Unknown | Female | Male |
| Percentage () |  | 11.17 | 1.49 | 76.91 | 3.86 | 0.68 | 4.68 | 45.08 | 54.90 |
| AUROC () | GFR-10 | 0.829 | 0.833 | 0.837 | 0.856 | 0.881 | 0.849 | 0.835 | 0.840 |
|  | OASIS | 0.811 | 0.797 | 0.803 | 0.825 | 0.824 | 0.809 | 0.806 | 0.805 |
|  | GFR-15 | 0.846 | 0.848 | 0.854 | 0.873 | 0.895 | 0.860 | 0.853 | 0.856 |
|  | SAPS II | 0.846 | 0.828 | 0.843 | 0.859 | 0.893 | 0.842 | 0.844 | 0.845 |
|  | GFR-40 | 0.859 | 0.861 | 0.859 | 0.881 | 0.902 | 0.873 | 0.857 | 0.865 |
|  | APACHE IV | 0.873 | 0.858 | 0.869 | 0.890 | 0.903 | 0.884 | 0.867 | 0.875 |
|  | APACHE IVa | 0.875 | 0.866 | 0.870 | 0.893 | 0.901 | 0.886 | 0.869 | 0.876 |
| AUPRC () | GFR-10 | 0.415 | 0.390 | 0.422 | 0.480 | 0.558 | 0.418 | 0.418 | 0.429 |
|  | OASIS | 0.345 | 0.330 | 0.364 | 0.410 | 0.370 | 0.328 | 0.356 | 0.365 |
|  | GFR-15 | 0.453 | 0.454 | 0.466 | 0.534 | 0.555 | 0.477 | 0.466 | 0.471 |
|  | SAPS II | 0.424 | 0.408 | 0.435 | 0.470 | 0.598 | 0.395 | 0.440 | 0.428 |
|  | GFR-40 | 0.488 | 0.500 | 0.489 | 0.553 | 0.585 | 0.512 | 0.488 | 0.499 |
|  | APACHE IV | 0.488 | 0.467 | 0.484 | 0.536 | 0.536 | 0.479 | 0.478 | 0.493 |
|  | APACHE IVa | 0.487 | 0.492 | 0.487 | 0.538 | 0.522 | 0.484 | 0.481 | 0.496 |
| Brier Score () | GFR-10 | 0.064 | 0.070 | 0.068 | 0.065 | 0.059 | 0.065 | 0.068 | 0.067 |
|  | OASIS | 0.068 | 0.076 | 0.072 | 0.068 | 0.072 | 0.070 | 0.072 | 0.070 |
|  | GFR-15 | 0.062 | 0.068 | 0.065 | 0.061 | 0.059 | 0.061 | 0.065 | 0.064 |
|  | SAPS II | 0.080 | 0.080 | 0.082 | 0.074 | 0.072 | 0.078 | 0.080 | 0.081 |
|  | GFR-40 | 0.060 | 0.064 | 0.064 | 0.060 | 0.057 | 0.059 | 0.064 | 0.062 |
|  | APACHE IV | 0.063 | 0.069 | 0.066 | 0.062 | 0.066 | 0.064 | 0.066 | 0.064 |
|  | APACHE IVa | 0.061 | 0.065 | 0.064 | 0.060 | 0.062 | 0.061 | 0.064 | 0.062 |
| HL () | GFR-10 | 27.90 | 11.00 | 113.70 | 24.68 | 5.48 | 12.53 | 58.65 | 102.74 |
|  | OASIS | 43.48 | 21.02 | 135.52 | 5.23 | 14.84 | 11.75 | 82.52 | 79.11 |
|  | GFR-15 | 23.64 | 9.88 | 63.40 | 10.62 | 4.43 | 3.73 | 13.62 | 57.75 |
|  | SAPS II | 1070.09 | 94.34 | 6599.71 | 228.75 | 62.95 | 333.65 | 3575.48 | 4750.90 |
|  | GFR-40 | 8.72 | 5.20 | 120.03 | 12.03 | 11.57 | 6.09 | 58.34 | 97.92 |
|  | APACHE IV | 308.51 | 34.51 | 1257.11 | 78.93 | 42.53 | 114.22 | 835.14 | 950.18 |
|  | APACHE IVa | 167.60 | 13.04 | 502.27 | 42.78 | 23.21 | 62.48 | 372.68 | 384.89 |
| SMR () | GFR-10 | 0.946 | 0.915 | 1.028 | 1.017 | 0.949 | 1.013 | 0.993 | 1.031 |
|  | OASIS | 0.882 | 1.204 | 0.922 | 0.994 | 0.844 | 1.002 | 0.917 | 0.940 |
|  | GFR-15 | 0.974 | 0.921 | 1.040 | 1.046 | 1.003 | 0.996 | 1.002 | 1.046 |
|  | SAPS II | 0.501 | 0.570 | 0.517 | 0.560 | 0.513 | 0.552 | 0.525 | 0.517 |
|  | GFR-40 | 1.022 | 0.936 | 1.039 | 1.063 | 0.889 | 1.033 | 1.000 | 1.058 |
|  | APACHE IV | 0.663 | 0.732 | 0.731 | 0.710 | 0.606 | 0.697 | 0.716 | 0.725 |
|  | APACHE IVa | 0.730 | 0.820 | 0.823 | 0.784 | 0.704 | 0.778 | 0.802 | 0.815 |

[Open in a new tab](table/ocae318-T1/)

AUROC: area under the receiver-operating characteristic curve; AUPRC: area under the precision-recall curve; HL: Hosmer-Lemeshow statistics; SMR: standardized mortality ratio.

### Critical illness mortality prediction for patients with “sepsis,” acute kidney failure, acute myocardial infarction, and heart failure

For mortality prognosis tasks, patients with specific critical illnesses are often more prone to risk in ICU[15](#ocae318-B15),[52–57](#ocae318-B52); thus, we evaluated whether GroupFasterRisk models can provide accurate risk prediction for those population sub-groups. We utilized International Classification of Diseases (ICD) codes in both MIMIC III and eICU to select patients with sepsis or septicemia, acute kidney failure, acute myocardial infarction, and heart failure. Given that the ICD9 codes are not a strict definition of sepsis, we refer to it as “sepsis” to reflect this potentially simplified definition in the rest of the paper. For simplicity, we refer to patients in those 4 subgroups as _disease-specific_ cohorts. We incorporated SOFA[15](#ocae318-B15) as an additional baseline, as different studies have validated SOFA’s utility in mortality prediction.[58](#ocae318-B58),[59](#ocae318-B59)

[Figure 5a](#ocae318-F5) shows an evaluation across all 4 critical illnesses on internal MIMIC III test folds. Here, we trained GroupFasterRisk models on disease-specific cohorts in the MIMIC III dataset. GFR-17 achieves higher mean AUROC and AUPRC for all disease-specific cohorts when compared to OASIS, SOFA, and SAPS-II.

#### Figure 5.

[![Comparison of GroupFasterRisk with SOFA, OASIS, and SAPS II on disease-specific patients. In internal evaluation, GroupFasterRisk performs better or at least on par with all baselines. In out-of-distribution evaluation, GroupFasterRisk performs better or similar to all the baselines.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/1e6b/12005632/17afeed4d407/ocae318f5.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005632_ocae318f5.jpg)

[Open in a new tab](figure/ocae318-F5/)

Evaluation on disease-specific cohorts. (A) Results on internal MIMIC III cohort. (Top) performance evaluations based on AUROC. (Bottom) based on AUPRC. We show mean and standard deviation over 5 MIMIC III test folds. When compared to OASIS, GFR-17 has 0.068 higher mean AUROC for the “sepsis” sub-group (_P_ < .05), 0.058 higher mean AUROC for the acute kidney failure sub-group (_P_ < .05), 0.041 higher mean AUROC for the heart failure sub-group (_P_ < .05), and 0.023 higher mean AUROC for acute myocardial infarction sub-group (_P_ = .138). We use GFR-17 because SAPS II, the best-performing baseline, also uses 17 variables. (B) Results on OOD eICU cohort. GroupFasterRisk is trained on the entire MIMIC III cohort (not on subgroups) using various group sparsity constraints. For each severity of illness score, our GroupFasterRisk models perform on par or better than baselines while using fewer variables.

[Figure 5b](#ocae318-F5) contains our results for OOD evaluation on eICU dataset. Here, we trained on the entire MIMIC III dataset to be consistent with our previous experiments on the all-cause mortality prediction. Our GroupFasterRisk models outperform OASIS and SOFA across all disease-specific cohorts. GFR-40 models outperform APACHE IV/IVa for “sepsis” and acute kidney failure cohorts. For GFR-15, we observe higher predictive accuracy than SAPS II on “sepsis” or septicemia and acute kidney failure cohorts.

### GroupFasterRisk variables are more informative than OASIS variables

Since GroupFasterRisk is designed to find solutions for sparse logistic regression, we can alternatively use GroupFasterRisk as a tool for automated, data-driven variable selection. In particular, variables selected by GroupFasterRisk should be more informative in predicting the outcome than nonselected ones. Furthermore, the risk scores reveal how the risks change as each variable increases.

We evaluated the ability of GroupFasterRisk to select good variables on the MIMIC III dataset. We compared results with the OASIS+ approach[21](#ocae318-B21) that demonstrated higher predictive accuracy of ML models trained on OASIS variables.[21](#ocae318-B21) To match the number of OASIS variables, we selected 14 distinct variables (including all of their thresholds) by training a GFR-14 model and extracting the variables it chose. We then trained black box and interpretable ML models, including Logistic Regression, EBM, Random Forest, AdaBoost, and XGBoost, using variables selected by GFR-14. [Figure 6a](#ocae318-F6) shows a comparison of predictive accuracy between GFR-14 and OASIS variables. All models trained on GFR-14 variables achieve statistically significantly () higher AUROC and AUPRC than those trained on OASIS variables.

#### Figure 6.

[![Figure A is a graphical description that GroupFasterRisk features allow machine learning models to make better prediction than OASIS features. Figure B is a graphical demonstration that GroupFasterRisk performs similar to complex black-box machine learning models while being much simpler.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/1e6b/12005632/a5d4b3f2d32d/ocae318f6.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12005632_ocae318f6.jpg)

[Open in a new tab](figure/ocae318-F6/)

Evaluation of GroupFasterRisk performance, sparsity, and variables. (A) Predictive performance of GroupFasterRisk variables against OASIS variables. When evaluating the MIMIC III cohort, we find that GFR-14 variables empower ML models to perform better than their counterparts when trained on OASIS variables. (B) Performance vs. Complexity of GroupFasterRisk and baselines for all 49 variables. (C) Performance vs. Complexity of GroupFasterRisk and baselines for OASIS variables.

### GroupFasterRisk models are accurate and sparse

As we observed in [Figures 3](#ocae318-F3) and [5](#ocae318-F5), GroupFasterRisk models outperform existing risk scores in mortality prediction while being simpler. We further illustrate this point by comparing GroupFasterRisk with more complex machine learning approaches.

We conducted 2 experiments to assess the relationship between our methods’ model complexity and AUROC or AUPRC. In the first experiment, we trained different ML models using the OASIS variables, including Logistic Regression, Random Forest, AdaBoost, EBM, XGBoost, and AutoScore. We compared their performance against our GFR-14 model (using our own variables) and GroupFasterRisk trained on OASIS variables, namely GFR-OASIS. We use GFR-14 rather than GFR-10 even though we have 10 original variables because 4 of them are continuous, and we use both the maximum and minimum of each continuous variable over an interval within our models. In the second experiment, we trained the same ML models using all 49 variables we obtained from the MIMIC III dataset. We compared these models with GFR-40.

We show results based on OASIS variables in [Figure 6c](#ocae318-F6) and results based on all variables in [Figure 6b](#ocae318-F6). In both cases, we find that GroupFasterRisk models (GFR-14, GFR-40, and GFR-OASIS) consistently achieve the best tradeoff between sparsity and either AUROC or AUPRC. AutoScore models are the least complex and rely on around 100 parameters, but their performance is substantially worse. Random Forest models achieve the highest AUROC and AUPRC scores; however, these models are very complex and rely on parameters, while GroupFasterRisk models use at most 82 parameters. Other methods such as \-regularized Logistic Regression and EBM were as complex as boosted decision trees in terms of the total number of splits across all trees, .

## Discussion

There are multiple aspects of our study worthy of discussion: we first focus on the advantages of GroupFasterRisk (summarized in [Table 2](#ocae318-T2)) and then on the limitations of our study.

### Table 2.

Comparison of GroupFasterRisk with other current mortality prediction methods.

|  | GroupFasterRisk | Severity of illness scoresa | Black-box ML | AutoScore |
| --- | --- | --- | --- | --- |
| Interpretable models? | ✓ | ✓ | ✗ | ✓ |
| High predictive accuracy? | ✓ | ✓ | ✓ | ✗ |
| Are easy to construct? | ✓ | ✗ | ✓ | ✓ |
| Can be trained on specific subpopulations? | ✓ | ✗ | ✓ | ✓ |
| Create risk cards end-to-end directly from data? | ✓ | ✓ | ✗ | ✓ |
| Allow automatic feature selection? | ✓ | ✓ | ✗ | ✓ |
| Allow hard constraints in optimization? | ✓ | ✗ | ✗ | ✓ |

[Open in a new tab](table/ocae318-T2/)

a

We consider the following severity of illness scores: OASIS, SOFA, SAPS II, and APACHE IV/Iva.

### Interpretability

GroupFasterRisk generates scorecard displays (such as the one in [Figure 1](#ocae318-F1)). From those displays, one can quickly evaluate the correctness of the model and make adjustments if desired. For instance, the variable component scores, shown as the rows in [Figure 1](#ocae318-F1), allow medical practitioners to interpret the relationship between risk and the possible values of the variables. Additionally, the group sparsity constraint enforces the selection of, at most, the top useful variables, informing the user about the meaningful variables in the prediction-making process ([Figure 6a](#ocae318-F6)). Combined together, this score calculation process from GroupFasterRisk models is transparent and interpretable to the user at any level of medical expertise, which could be beneficial for healthcare applications as it enables the discovery of new knowledge or potential bias in the model without the need for post-hoc explanations. The risk scorecards can be used at both bedside or by leadership to predict the risk of patient outcomes. For instance, it can be used by nurses and physicians when deciding about the next procedures for the patients at the bedside. At the leadership level, the interpretable and transparent nature of GroupFasterRisk means that thoughtful decisions can be made regarding the adoption of the model before official deployment. Besides interpretability, GroupFasterRisk’ models tend to be robust and fair across different ethnic and gender groups ([Table 1](#ocae318-T1)).

### Monotonicity constraints

If the model disagrees with medical knowledge due to noise in data, practitioners could adopt monotonicity constraints. We find that models with monotonicity constraints demonstrate increased predictive accuracy in out-of-distribution evaluations compared to the original, uncorrected models ([Supplementary Material D.1](#sup1), [Table S4](#sup1) and [Supplementary Material D.2](#sup1), [Table S5](#sup1)). This suggests that incorporating domain-relevant knowledge into risk score design could further enhance performance.

### Sparsity

The most accurate baselines we considered, APACHE IV/IVa, rely on 142 variables. In comparison, our most complex model, GFR-40, achieves similar performance to APACHE IV/IVa while requiring only 40 variables ([Figure 3](#ocae318-F3)). In practice, this 3.5 times difference in the number of variables can be quite significant, especially when accounting for missing values or other collection errors that commonly occur in medical data.[60](#ocae318-B60) While there are several ways to handle missing data,[61](#ocae318-B61),[62](#ocae318-B62) these methods can negatively affect prediction accuracy, limit performance guarantees, and create an extra burdensome task for medical practitioners to complete. Furthermore, compared to other machine learning approaches, GroupFasterRisk models are 1000 times sparser in model complexity while achieving comparable performance ([Figure 6b and c](#ocae318-F6)).

### Flexibility

Most existing severity of illness scores are fixed (making them difficult to re-train or adjust to sub-population) and can be time- and resource-costly to construct. By contrast, GroupFasterRisk is a data-driven algorithm capable of adapting to different datasets and producing risk scores tailored to any population (like disease-specific cohorts in [Figure 5](#ocae318-F5) or demographic subgroups in [Table 1](#ocae318-T1)) in a reasonable amount of time (GroupFasterRisk creates risk scores within hours on a personal laptop Apple MacBook Pro, M2, [Figure 4b](#ocae318-F4)). The diverse pool of GroupFasterRisk solutions provides users with a set of equally accurate risk scorecards, which helps to resolve the “interaction bottleneck” between people and algorithms.[34](#ocae318-B34) Users can set arbitrary groupings of the binarized features, sparsity, and box constraints to design risk scores of their choice as well as choose among numerous available models to pick one that best aligns with medical knowledge. Moreover, GroupFasterRisk is a generalized approach for risk prediction tasks, meaning that it can be applied to predict risks of other outcomes. We have also evaluated GroupFasterRisk on predicting other outcomes, and the results are in [Supplementary Material D.6](#sup1).

### Generalization

Our out-of-distribution evaluation demonstrates that GroupFasterRisk can generalize well when trained on MIMIC III and tested on eICU for all-cause and disease-specific cohorts ([Figures 3](#ocae318-F3) and [5b](#ocae318-B5)). Since eICU was collected from medical centers independent of MIMIC III, our estimate of generalization error takes important factors into consideration,[63](#ocae318-B63) such as (1) differences in practice between health systems; (2) variations in patient demographics, genotypes, and phenotypes; and (3) variations in hardware and software for data capture.

### Notes and limitations

#### Patients with comfort measures only

For evaluating GroupFasterRisk on a broad spectrum of patients in the ICU, our study cohort included patients on comfort measures. However, we performed additional experimentation after excluding such patients and conclusions did not change. The result is in [Supplementary Material D.5](#sup1).

#### Uncertainty quantification

Our eICU out-of-distribution evaluations did not take a resampling approach, because we were interested in how GroupFasterRisk performs on a large number of patients on the scale of a hundred thousand. Nevertheless, to provide a comprehensive evaluation, we present our results evaluated with the resampling approach in [Supplementary Material D.7](#sup1).

#### Monotonicity constraints

Monotonicity constraints are currently limited to component functions that increase or decrease. They could be generalized to include U-shaped risks, which become higher away from their normal values.

#### Data sources

While MIMIC III and eICU are among the largest and most detailed publicly available datasets that have ever existed on ICU monitoring, they were collected from hospitals in the United States between 2001-2012 and 2014-2015, respectively. Further evaluation on samples collected from other locations or time periods would be useful.

#### Data aggregation

Changes in patterns over time are still not fully measured due to how MIMIC III and eICU collect data. For instance, vital signs in eICU are first recorded as 1-min averages and then stored as 5-min medians. Although we use summary statistics, the data collection issues may still be affected by changes in measurement processing or aggregation.

#### Cohort

To have more access to the measurements of the patients, our MIMIC III cohort considers patients who stayed in the ICU for more than 24 h (see [Supplementary Material A.1](#sup1)), which may cause bias in predicting mortality for patients admitted to the ICU for less than 1 day. Thus, to provide a more comprehensive evaluation, our eICU cohort includes all patients who have been admitted for more than 4 h (this is consistent with cohorts used to create OASIS and APACHE IV). The results in the previous section fully support that GroupFasterRisk performs well under these shifted hours of ICU stay.

#### Outcome definition

In order to ensure consistency with our risk score baselines, which are calculated using data during the first 24 h, our study did not consider predicting patient outcomes throughout their entire hospitalization since the length of stay highly varies among individuals. However, we believe predicting such outcomes is a worthwhile direction for future research. Furthermore, for the sake of consistency with baseline methods, our study is conducted on patients’ first ICU stays, but further analysis on GroupFasterRisk performance in subsequent stays could be a worthwhile direction for future research.

#### Visualization

We have visualized risk scores in terms of scorecards for this paper. If a user would like to visualize a collection of risk scores, they can use the interactive _Riskomon_ visualization tool[48](#ocae318-B48) that provides a customizable bird’s eye view of many risk scores.

## Conclusion

Our work introduces GroupFasterRisk, a machine learning algorithm capable of creating a diverse set of accurate severity of illness scores. We demonstrate that our approach generally outperforms existing severity of illness scores; is capable of selecting highly predictive variables; and performs well on population sub-groups based on race and gender in terms of robustness, accuracy, fairness, and calibration. Our framework provides an accessible and fast procedure to learn an interpretable model from data and could be used to support medical practitioners in the development of severity of illness scores and beyond.

## Supplementary Material

ocae318\_Supplementary\_Data

[ocae318\_supplementary\_data.pdf](/articles/instance/12005632/bin/ocae318_supplementary_data.pdf) (8MB, pdf)

## Acknowledgments

We would like to thank Brandon Westover for helpful discussions.

## Contributor Information

Chloe Qinyu Zhu, Department of Computer Science, Duke University, Durham, NC 27708, United States.

Muhang Tian, Department of Computer Science, Duke University, Durham, NC 27708, United States.

Lesia Semenova, Microsoft Research, New York, NY 10012, United States.

Jiachang Liu, Cornell University, Ithaca, NY 14853, United States.

Jack Xu, Department of Computer Science, Duke University, Durham, NC 27708, United States.

Joseph Scarpa, Department of Computer Science, Duke University, Durham, NC 27708, United States.

Cynthia Rudin, Department of Computer Science, Duke University, Durham, NC 27708, United States.

## Author contributions

Muhang Tian and Chloe Qinyu Zhu equally contributed to the conception, implementation, and editing; Lesia Semenova, Jiachang Liu, and Cynthia Rudin contributed to the conception and editing; Jack Xu contributed to the implementation; and Joseph Scarpa contributed to the implementation and editing.

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

Funding for this work was partially provided by the NSF under grant IIS-2130250 and by the NIH under grants 1R01NS131347-01A1 and 1R01HL166233-01 as well as NIDA grant R01 DA054994.

## Conflicts of interest

The authors have no competing interests to declare.

## Data availability

MIMIC III[39](#ocae318-B39) and eICU[40](#ocae318-B40) are both publicly available at [https://mimic.mit.edu/](https://mimic.mit.edu/) and [https://eicu-crd.mit.edu/](https://eicu-crd.mit.edu/), respectively. The software developed in this study is available at [https://github.com/interpretml/FasterRisk](https://github.com/interpretml/FasterRisk). The source code for experiments involved in this study is available at [https://github.com/MuhangTian/GFR-Experiments](https://github.com/MuhangTian/GFR-Experiments).

## References

*   1. McNamara RL, Kennedy KF, Cohen DJ, et al.  Predicting in-hospital mortality in patients with acute myocardial infarction. J Am Coll Cardiol. 2016;68:626-635. \[[DOI](https://doi.org/10.1016/j.jacc.2016.05.049)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27491907/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Coll%20Cardiol&title=Predicting%20in-hospital%20mortality%20in%20patients%20with%20acute%20myocardial%20infarction&volume=68&publication_year=2016&pages=626-635&pmid=27491907&doi=10.1016/j.jacc.2016.05.049&)\]
*   2. Edwards FH, Cohen DJ, O'Brien SM, et al. ; Steering Committee of the Society of Thoracic Surgeons/American College of Cardiology Transcatheter Valve Therapy Registry. Development and validation of a risk prediction model for in-hospital mortality after transcatheter aortic valve replacement. JAMA Cardiol. 2016;1:46-52. \[[DOI](https://doi.org/10.1001/jamacardio.2015.0326)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27437653/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA%20Cardiol&title=Development%20and%20validation%20of%20a%20risk%20prediction%20model%20for%20in-hospital%20mortality%20after%20transcatheter%20aortic%20valve%20replacement&volume=1&publication_year=2016&pages=46-52&pmid=27437653&doi=10.1001/jamacardio.2015.0326&)\]
*   3. Fonarow GC, Adams KF, Abraham WT, et al. ; ADHERE Scientific Advisory Committee, Study Group, and Investigators. Risk stratification for in-hospital mortality in acutely decompensated heart failure: classification and regression tree analysis. JAMA. 2005;293:572-580. \[[DOI](https://doi.org/10.1001/jama.293.5.572)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/15687312/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=Risk%20stratification%20for%20in-hospital%20mortality%20in%20acutely%20decompensated%20heart%20failure:%20classification%20and%20regression%20tree%20analysis&volume=293&publication_year=2005&pages=572-580&pmid=15687312&doi=10.1001/jama.293.5.572&)\]
*   4. Barriere SL, Lowry SF.  An overview of mortality risk prediction in sepsis. Crit Care Med. 1995;23:376-393. \[[DOI](https://doi.org/10.1097/00003246-199502000-00026)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/7867363/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=An%20overview%20of%20mortality%20risk%20prediction%20in%20sepsis&volume=23&publication_year=1995&pages=376-393&pmid=7867363&doi=10.1097/00003246-199502000-00026&)\]
*   5. El-Solh AA, Lawson Y, Carter M, El-Solh DA, Mergenhagen KA.  Comparison of in-hospital mortality risk prediction models from COVID-19. PLoS One. 2020;15:e0244629. \[[DOI](https://doi.org/10.1371/journal.pone.0244629)\] \[[PMC free article](/articles/PMC7769558/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33370409/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=PLoS%20One&title=Comparison%20of%20in-hospital%20mortality%20risk%20prediction%20models%20from%20COVID-19&volume=15&publication_year=2020&pages=e0244629&pmid=33370409&doi=10.1371/journal.pone.0244629&)\]
*   6. Kar S, Chawla R, Haranath SP, et al.  Multivariable mortality risk prediction using machine learning for COVID-19 patients at admission (AICOVID). Sci Rep. 2021;11:12801. \[[DOI](https://doi.org/10.1038/s41598-021-92146-7)\] \[[PMC free article](/articles/PMC8211710/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34140592/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Rep&title=Multivariable%20mortality%20risk%20prediction%20using%20machine%20learning%20for%20COVID-19%20patients%20at%20admission%20\(AICOVID\)&volume=11&publication_year=2021&pages=12801&pmid=34140592&doi=10.1038/s41598-021-92146-7&)\]
*   7. Le Gall J-R, Lemeshow S, Saulnier F.  A new simplified acute physiology score (SAPS II) based on a European/North American multicenter study. JAMA. 1993;270:2957-2963. \[[DOI](https://doi.org/10.1001/jama.270.24.2957)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/8254858/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=A%20new%20simplified%20acute%20physiology%20score%20\(SAPS%20II\)%20based%20on%20a%20European/North%20American%20multicenter%20study&volume=270&publication_year=1993&pages=2957-2963&pmid=8254858&doi=10.1001/jama.270.24.2957&)\]
*   8. Le Gall JR, Loirat P, Alperovitch A, et al.  A simplified acute physiology score for ICU patients. Crit Care Med. 1984;12:975-977. \[[DOI](https://doi.org/10.1097/00003246-198411000-00012)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/6499483/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=A%20simplified%20acute%20physiology%20score%20for%20ICU%20patients&volume=12&publication_year=1984&pages=975-977&pmid=6499483&doi=10.1097/00003246-198411000-00012&)\]
*   9. Apgar V.  A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32:260-267. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/13083014/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Curr%20Res%20Anesth%20Analg&title=A%20proposal%20for%20a%20new%20method%20of%20evaluation%20of%20the%20newborn%20infant&volume=32&publication_year=1953&pages=260-267&pmid=13083014&)\]
*   10. Than M, Flaws D, Sanders S, et al.  Development and validation of the Emergency Department Assessment of Chest pain score and 2h accelerated diagnostic protocol. Emerg Med Australas. 2014;26:34-44. \[[DOI](https://doi.org/10.1111/1742-6723.12164)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/24428678/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Emerg%20Med%20Australas&title=Development%20and%20validation%20of%20the%20Emergency%20Department%20Assessment%20of%20Chest%20pain%20score%20and%202h%20accelerated%20diagnostic%20protocol&volume=26&publication_year=2014&pages=34-44&pmid=24428678&doi=10.1111/1742-6723.12164&)\]
*   11. Six AJ, Backus BE, Kelder JC.  Chest pain in the emergency room: value of the HEART score. Neth Heart J. 2008;16:191-196. \[[DOI](https://doi.org/10.1007/BF03086144)\] \[[PMC free article](/articles/PMC2442661/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/18665203/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Neth%20Heart%20J&title=Chest%20pain%20in%20the%20emergency%20room:%20value%20of%20the%20HEART%20score&volume=16&publication_year=2008&pages=191-196&pmid=18665203&doi=10.1007/BF03086144&)\]
*   12. MCCalc. 2024. Accessed September 12, 2024. [https://www.mdcalc.com](https://www.mdcalc.com)
*   13. QxMD. 2024. Accessed September 12, 2024. [https://qxmd.com/calculate](https://qxmd.com/calculate)
*   14. Knaus WA, Zimmerman JE, Wagner DP, Draper EA, Lawrence DE.  APACHE—acute physiology and chronic health evaluation: a physiologically based classification system. Crit Care Med. 1981;9:591-597. \[[DOI](https://doi.org/10.1097/00003246-198108000-00008)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/7261642/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=APACHE%E2%80%94acute%20physiology%20and%20chronic%20health%20evaluation:%20a%20physiologically%20based%20classification%20system&volume=9&publication_year=1981&pages=591-597&pmid=7261642&doi=10.1097/00003246-198108000-00008&)\]
*   15. Vincent JL, Moreno R, Takala J, et al.  The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure: on behalf of the Working Group on Sepsis-Related Problems of the European Society of Intensive Care Medicine. Intens Care Med. 1996;22:707-710. \[[DOI](https://doi.org/10.1007/BF01709751)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/8844239/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Intens%20Care%20Med&title=The%20SOFA%20\(Sepsis-related%20Organ%20Failure%20Assessment\)%20score%20to%20describe%20organ%20dysfunction/failure:%20on%20behalf%20of%20the%20Working%20Group%20on%20Sepsis-Related%20Problems%20of%20the%20European%20Society%20of%20Intensive%20Care%20Medicine&volume=22&publication_year=1996&pages=707-710&pmid=8844239&doi=10.1007/BF01709751&)\]
*   16. Singer M, Deutschman CS, Seymour CW, et al.  The third international consensus definitions for sepsis and septic shock (Sepsis-3). JAMA. 2016;315:801-810. \[[DOI](https://doi.org/10.1001/jama.2016.0287)\] \[[PMC free article](/articles/PMC4968574/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26903338/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=The%20third%20international%20consensus%20definitions%20for%20sepsis%20and%20septic%20shock%20\(Sepsis-3\)&volume=315&publication_year=2016&pages=801-810&pmid=26903338&doi=10.1001/jama.2016.0287&)\]
*   17. Knaus WA, Draper EA, Wagner DP, Zimmerman JE.  APACHE II: a severity of disease classification system. Crit Care Med. 1985;13:818-829. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/3928249/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=APACHE%20II:%20a%20severity%20of%20disease%20classification%20system&volume=13&publication_year=1985&pages=818-829&pmid=3928249&)\]
*   18. Zimmerman JE, Kramer AA, McNair DS, Malila FM.  Acute Physiology and Chronic Health Evaluation (APACHE) IV: hospital mortality assessment for today’s critically ill patients. Crit Care Med. 2006;34:1297-1310. \[[DOI](https://doi.org/10.1097/01.CCM.0000215112.84523.F0)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/16540951/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=Acute%20Physiology%20and%20Chronic%20Health%20Evaluation%20\(APACHE\)%20IV:%20hospital%20mortality%20assessment%20for%20today%E2%80%99s%20critically%20ill%20patients&volume=34&publication_year=2006&pages=1297-1310&pmid=16540951&doi=10.1097/01.CCM.0000215112.84523.F0&)\]
*   19. Cleveland WS.  Robust locally weighted regression and smoothing scatterplots. J Am Stat Assoc. 1979;74:829-836. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Stat%20Assoc&title=Robust%20locally%20weighted%20regression%20and%20smoothing%20scatterplots&volume=74&publication_year=1979&pages=829-836&)\]
*   20. Choi MH, Kim D, Choi EJ, et al.  Mortality prediction of patients in intensive care units using machine learning algorithms based on electronic health records. Sci Rep. 2022;12:7180. \[[DOI](https://doi.org/10.1038/s41598-022-11226-4)\] \[[PMC free article](/articles/PMC9065110/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35505048/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Rep&title=Mortality%20prediction%20of%20patients%20in%20intensive%20care%20units%20using%20machine%20learning%20algorithms%20based%20on%20electronic%20health%20records&volume=12&publication_year=2022&pages=7180&pmid=35505048&doi=10.1038/s41598-022-11226-4&)\]
*   21. El-Manzalawy Y, Abbas M, Hoaglund I, et al.  OASIS+: leveraging machine learning to improve the prognostic accuracy of OASIS severity score for predicting in-hospital mortality. BMC Med Inform Decis Mak. 2021;21:156. \[[DOI](https://doi.org/10.1186/s12911-021-01517-7)\] \[[PMC free article](/articles/PMC8118103/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33985483/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Med%20Inform%20Decis%20Mak&title=OASIS+:%20leveraging%20machine%20learning%20to%20improve%20the%20prognostic%20accuracy%20of%20OASIS%20severity%20score%20for%20predicting%20in-hospital%20mortality&volume=21&publication_year=2021&pages=156&pmid=33985483&doi=10.1186/s12911-021-01517-7&)\]
*   22. Levin S, Toerper M, Hamrock E, et al.  Machine-learning-based electronic triage more accurately differentiates patients with respect to clinical outcomes compared with the emergency severity index. Ann Emerg Med. 2018;71:565-574.e2. \[[DOI](https://doi.org/10.1016/j.annemergmed.2017.08.005)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/28888332/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Ann%20Emerg%20Med&title=Machine-learning-based%20electronic%20triage%20more%20accurately%20differentiates%20patients%20with%20respect%20to%20clinical%20outcomes%20compared%20with%20the%20emergency%20severity%20index&volume=71&publication_year=2018&pages=565-574.e2&pmid=28888332&doi=10.1016/j.annemergmed.2017.08.005&)\]
*   23. Klug M, Barash Y, Bechler S, et al.  A gradient boosting machine learning model for predicting early mortality in the emergency department triage: devising a nine-point triage score. J Gen Intern Med. 2020;35:220-227. \[[DOI](https://doi.org/10.1007/s11606-019-05512-7)\] \[[PMC free article](/articles/PMC6957629/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/31677104/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Gen%20Intern%20Med&title=A%20gradient%20boosting%20machine%20learning%20model%20for%20predicting%20early%20mortality%20in%20the%20emergency%20department%20triage:%20devising%20a%20nine-point%20triage%20score&volume=35&publication_year=2020&pages=220-227&pmid=31677104&doi=10.1007/s11606-019-05512-7&)\]
*   24. Hong WS, Haimovich AD, Taylor RA.  Predicting hospital admission at emergency department triage using machine learning. PLoS One. 2018;13:e0201016. \[[DOI](https://doi.org/10.1371/journal.pone.0201016)\] \[[PMC free article](/articles/PMC6054406/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/30028888/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=PLoS%20One&title=Predicting%20hospital%20admission%20at%20emergency%20department%20triage%20using%20machine%20learning&volume=13&publication_year=2018&pages=e0201016&pmid=30028888&doi=10.1371/journal.pone.0201016&)\]
*   25. Gonźalez-Ńovoa JA, et al.  Using explainable machine learning to improve intensive care unit alarm systems. Sensors. 2021;21:7125. \[[DOI](https://doi.org/10.3390/s21217125)\] \[[PMC free article](/articles/PMC8587076/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34770432/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sensors&title=Using%20explainable%20machine%20learning%20to%20improve%20intensive%20care%20unit%20alarm%20systems&volume=21&publication_year=2021&pages=7125&pmid=34770432&doi=10.3390/s21217125&)\]
*   26. Taylor RA, Pare JR, Venkatesh AK, et al.  Prediction of in-hospital mortality in emergency department patients with sepsis: a local big data-driven, machine learning approach. Acad Emerg Med. 2016;23:269-278. \[[DOI](https://doi.org/10.1111/acem.12876)\] \[[PMC free article](/articles/PMC5884101/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26679719/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Acad%20Emerg%20Med&title=Prediction%20of%20in-hospital%20mortality%20in%20emergency%20department%20patients%20with%20sepsis:%20a%20local%20big%20data-driven,%20machine%20learning%20approach&volume=23&publication_year=2016&pages=269-278&pmid=26679719&doi=10.1111/acem.12876&)\]
*   27. Breiman L.  Random forests. Mach Learn. 2001;45:5-32. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Mach%20Learn&title=Random%20forests&volume=45&publication_year=2001&pages=5-32&)\]
*   28. Chen T, He T, Benesty M, et al.  Xgboost: eXtreme gradient boosting. R Package Version 0.4-2. 2015;1:1-4. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=R%20Package%20Version%200.4-2&title=Xgboost:%20eXtreme%20gradient%20boosting&volume=1&publication_year=2015&pages=1-4&)\]
*   29. Xu H, Shuttleworth KMJ.  Medical artificial intelligence and the black box problem: a view based on the ethical principle of “do no harm”. Intell Med. 2024;4:52-57. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Intell%20Med&title=Medical%20artificial%20intelligence%20and%20the%20black%20box%20problem:%20a%20view%20based%20on%20the%20ethical%20principle%20of%20%E2%80%9Cdo%20no%20harm%E2%80%9D&volume=4&publication_year=2024&pages=52-57&)\]
*   30. Rudin C.  Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead. Nat Mach Intell. 2019;1:206-215. \[[DOI](https://doi.org/10.1038/s42256-019-0048-x)\] \[[PMC free article](/articles/PMC9122117/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35603010/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat%20Mach%20Intell&title=Stop%20explaining%20black%20box%20machine%20learning%20models%20for%20high%20stakes%20decisions%20and%20use%20interpretable%20models%20instead&volume=1&publication_year=2019&pages=206-215&pmid=35603010&doi=10.1038/s42256-019-0048-x&)\]
*   31. Johnson AE, Kramer AA, Clifford GD.  A new severity of illness scale using a subset of acute physiology and chronic health evaluation data elements shows comparable predictive accuracy. Crit Care Med. 2013;41:1711-1718. \[[DOI](https://doi.org/10.1097/CCM.0b013e31828a24fe)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/23660729/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=A%20new%20severity%20of%20illness%20scale%20using%20a%20subset%20of%20acute%20physiology%20and%20chronic%20health%20evaluation%20data%20elements%20shows%20comparable%20predictive%20accuracy&volume=41&publication_year=2013&pages=1711-1718&pmid=23660729&doi=10.1097/CCM.0b013e31828a24fe&)\]
*   32. Katoch S, Chauhan SS, Kumar V.  A review on genetic algorithm: past, present, and future. Multimed Tools Appl. 2021;80:8091-8126. \[[DOI](https://doi.org/10.1007/s11042-020-10139-6)\] \[[PMC free article](/articles/PMC7599983/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33162782/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Multimed%20Tools%20Appl&title=A%20review%20on%20genetic%20algorithm:%20past,%20present,%20and%20future&volume=80&publication_year=2021&pages=8091-8126&pmid=33162782&doi=10.1007/s11042-020-10139-6&)\]
*   33. Kennedy J, Eberhart R.  Particle swarm optimization. Proc Int Conf Neural Network  1995;4:1942-1948. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Proc%20Int%20Conf%20Neural%20Network&title=Particle%20swarm%20optimization&volume=4&publication_year=1995&pages=1942-1948&)\]
*   34. Rudin C, et al. Amazing things come from having many good models. In: _Proceedings of the International Conference on Machine Learning (ICML)_; 2024.
*   35. Xie F, Chakraborty B, Ong MEH, Goldstein BA, Liu N.  AutoScore: a machine learning–based automatic clinical score generator and its application to mortality prediction using electronic health records. JMIR Med Inform. 2020;8:e21798. \[[DOI](https://doi.org/10.2196/21798)\] \[[PMC free article](/articles/PMC7641783/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33084589/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JMIR%20Med%20Inform&title=AutoScore:%20a%20machine%20learning%E2%80%93based%20automatic%20clinical%20score%20generator%20and%20its%20application%20to%20mortality%20prediction%20using%20electronic%20health%20records&volume=8&publication_year=2020&pages=e21798&pmid=33084589&doi=10.2196/21798&)\]
*   36. Ustun B, Rudin C. Optimized risk scores. In: _Proceedings of the 23rd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining._ Association for Computing Machinery; 2017: 1125-1134.
*   37. Ustun B, Rudin C.  Learning optimized risk scores. J Mach Learn Res. 2019;20:1-75. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Mach%20Learn%20Res&title=Learning%20optimized%20risk%20scores&volume=20&publication_year=2019&pages=1-75&)\]
*   38. Liu J, Zhong C, Li B, Seltzer M, Rudin C.  FasterRisk: fast and accurate interpretable risk scores. Adv Neural Inform Process Syst  2022;35:17760-17773. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Adv%20Neural%20Inform%20Process%20Syst&title=FasterRisk:%20fast%20and%20accurate%20interpretable%20risk%20scores&volume=35&publication_year=2022&pages=17760-17773&)\]
*   39. Johnson AEW, Pollard TJ, Shen L, et al.  MIMIC-III, a freely accessible critical care database. Sci Data. 2016;3:160035-160039. \[[DOI](https://doi.org/10.1038/sdata.2016.35)\] \[[PMC free article](/articles/PMC4878278/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27219127/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Data&title=MIMIC-III,%20a%20freely%20accessible%20critical%20care%20database&volume=3&publication_year=2016&pages=160035-160039&pmid=27219127&doi=10.1038/sdata.2016.35&)\]
*   40. Pollard TJ, Johnson AEW, Raffa JD, et al.  The eICU Collaborative Research Database, a freely available multi-center database for critical care research. Sci Data. 2018;5:180178-180113. \[[DOI](https://doi.org/10.1038/sdata.2018.178)\] \[[PMC free article](/articles/PMC6132188/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/30204154/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sci%20Data&title=The%20eICU%20Collaborative%20Research%20Database,%20a%20freely%20available%20multi-center%20database%20for%20critical%20care%20research&volume=5&publication_year=2018&pages=180178-180113&pmid=30204154&doi=10.1038/sdata.2018.178&)\]
*   41. Davis J, Goadrich M. The relationship between Precision-Recall and ROC curves. In: _Proceedings of the 23rd International Conference on Machine Learning._ Proceedings of Machine Learning Research; 2006: 233-240.
*   42. Lou Y, Caruana R, Gehrke J. Intelligible models for classification and regression. In: _Proceedings of the 18th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining_. Association for Computing Machinery; 2012: 150-158.
*   43. Chen T, Guestrin C. Xgboost: a scalable tree boosting system. In: _Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining_. Association for Computing Machinery; 2016: 785-794.
*   44. Freund Y, Schapire RE.  A decision-theoretic generalization of on-line learning and an application to boosting. J Comput Syst Sci. 1997;55:119-139. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Comput%20Syst%20Sci&title=A%20decision-theoretic%20generalization%20of%20on-line%20learning%20and%20an%20application%20to%20boosting&volume=55&publication_year=1997&pages=119-139&)\]
*   45. Huang Y, Li W, Macheret F, Gabriel RA, Ohno-Machado L.  A tutorial on calibration measurements and calibration models for clinical prediction models. J Am Med Inform Assoc. 2020;27:621-633. \[[DOI](https://doi.org/10.1093/jamia/ocz228)\] \[[PMC free article](/articles/PMC7075534/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32106284/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=A%20tutorial%20on%20calibration%20measurements%20and%20calibration%20models%20for%20clinical%20prediction%20models&volume=27&publication_year=2020&pages=621-633&pmid=32106284&doi=10.1093/jamia/ocz228&)\]
*   46. Brier GW.  Verification of forecasts expressed in terms of probability. Mon Wea Rev. 1950;78:1-3. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Mon%20Wea%20Rev&title=Verification%20of%20forecasts%20expressed%20in%20terms%20of%20probability&volume=78&publication_year=1950&pages=1-3&)\]
*   47. Lemeshow S, Hosmer DW. Jr. A review of goodness of fit statistics for use in the development of logistic regression models. Am J Epidemiol. 1982;115:92-106. \[[DOI](https://doi.org/10.1093/oxfordjournals.aje.a113284)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/7055134/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am%20J%20Epidemiol&title=A%20review%20of%20goodness%20of%20fit%20statistics%20for%20use%20in%20the%20development%20of%20logistic%20regression%20models&volume=115&publication_year=1982&pages=92-106&pmid=7055134&doi=10.1093/oxfordjournals.aje.a113284&)\]
*   48. Oddo M, Liu J, Munzner T, Francis Nguyen CR, Seltzer M. RISKOMON: card deck explorer for a FasterRisk Rashomon set. 2024. Accessed 2024. [https://riskomon.netlify.app](https://riskomon.netlify.app)
*   49. Li D, Sun X, et al.  Nonlinear Integer Programming. Springer; 2006. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Nonlinear%20Integer%20Programming&publication_year=2006&)\]
*   50. Lou Y, Caruana R, Gehrke J, Hooker G. Accurate intelligible models with pairwise interactions. In: _Proceedings of the 19th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining_. Association for Computing Machinery; 2013: 623-631.
*   51. Rudin C, et al.  Interpretable machine learning: fundamental principles and 10 grand challenges. Stat Surv. 2022;16:1-85. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Stat%20Surv&title=Interpretable%20machine%20learning:%20fundamental%20principles%20and%2010%20grand%20challenges&volume=16&publication_year=2022&pages=1-85&)\]
*   52. Chen YC, Lin SF, Liu CJ, et al.  Risk factors for ICU mortality in critically ill patients. J Formos Med Assoc. 2001;100:656-661. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/11760370/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Formos%20Med%20Assoc&title=Risk%20factors%20for%20ICU%20mortality%20in%20critically%20ill%20patients&volume=100&publication_year=2001&pages=656-661&pmid=11760370&)\]
*   53. Angus DC, Linde-Zwirble WT, Lidicker J, et al.  Epidemiology of severe sepsis in the United States: analysis of incidence, outcome, and associated costs of care. Crit Care Med. 2001;29:1303-1310. \[[DOI](https://doi.org/10.1097/00003246-200107000-00002)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/11445675/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=Epidemiology%20of%20severe%20sepsis%20in%20the%20United%20States:%20analysis%20of%20incidence,%20outcome,%20and%20associated%20costs%20of%20care&volume=29&publication_year=2001&pages=1303-1310&pmid=11445675&doi=10.1097/00003246-200107000-00002&)\]
*   54. Members WG, et al.  Heart disease and stroke statistics—2012 update: a report from the American Heart Association. Circulation. 2012;125:e2-e220. \[[DOI](https://doi.org/10.1161/CIR.0b013e31823ac046)\] \[[PMC free article](/articles/PMC4440543/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/22179539/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Circulation&title=Heart%20disease%20and%20stroke%20statistics%E2%80%942012%20update:%20a%20report%20from%20the%20American%20Heart%20Association&volume=125&publication_year=2012&pages=e2-e220&pmid=22179539&doi=10.1161/CIR.0b013e31823ac046&)\]
*   55. Marshall JC, Cook DJ, Christou NV, et al.  Multiple organ dysfunction score: a reliable descriptor of a complex clinical outcome. Crit Care Med. 1995;23:1638-1652. \[[DOI](https://doi.org/10.1097/00003246-199510000-00007)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/7587228/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care%20Med&title=Multiple%20organ%20dysfunction%20score:%20a%20reliable%20descriptor%20of%20a%20complex%20clinical%20outcome&volume=23&publication_year=1995&pages=1638-1652&pmid=7587228&doi=10.1097/00003246-199510000-00007&)\]
*   56. Bellomo R, Ronco C, Kellum JA, Mehta RL, Palevsky P, the ADQI Workgroup. Acute renal failure—definition, outcome measures, animal models, fluid therapy and information technology needs: the Second International Consensus Conference of the Acute Dialysis Quality Initiative (ADQI) Group. Crit Care. 2004;8:1-9. \[[DOI](https://doi.org/10.1186/cc2872)\] \[[PMC free article](/articles/PMC522841/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/15312219/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care&title=Acute%20renal%20failure%E2%80%94definition,%20outcome%20measures,%20animal%20models,%20fluid%20therapy%20and%20information%20technology%20needs:%20the%20Second%20International%20Consensus%20Conference%20of%20the%20Acute%20Dialysis%20Quality%20Initiative%20\(ADQI\)%20Group&volume=8&publication_year=2004&pages=1-9&pmid=15312219&doi=10.1186/cc2872&)\]
*   57. Seymour CW, Liu VX, Iwashyna TJ, et al.  Assessment of clinical criteria for sepsis: for the Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315:762-774. \[[DOI](https://doi.org/10.1001/jama.2016.0288)\] \[[PMC free article](/articles/PMC5433435/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26903335/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=Assessment%20of%20clinical%20criteria%20for%20sepsis:%20for%20the%20Third%20International%20Consensus%20Definitions%20for%20Sepsis%20and%20Septic%20Shock%20\(Sepsis-3\)&volume=315&publication_year=2016&pages=762-774&pmid=26903335&doi=10.1001/jama.2016.0288&)\]
*   58. Minne L, Abu-Hanna A, de Jonge E.  Evaluation of SOFA-based models for predicting mortality in the ICU: a systematic review. Crit Care. 2008;12:1-13. \[[DOI](https://doi.org/10.1186/cc7160)\] \[[PMC free article](/articles/PMC2646326/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/19091120/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care&title=Evaluation%20of%20SOFA-based%20models%20for%20predicting%20mortality%20in%20the%20ICU:%20a%20systematic%20review&volume=12&publication_year=2008&pages=1-13&pmid=19091120&doi=10.1186/cc7160&)\]
*   59. Fayed M, Patel N, Angappan S, et al.  Sequential Organ Failure Assessment (SOFA) score and mortality prediction in patients with severe respiratory distress secondary to COVID-19. Cureus. 2022;14:e26911. \[[DOI](https://doi.org/10.7759/cureus.26911)\] \[[PMC free article](/articles/PMC9290429/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35865183/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Cureus&title=Sequential%20Organ%20Failure%20Assessment%20\(SOFA\)%20score%20and%20mortality%20prediction%20in%20patients%20with%20severe%20respiratory%20distress%20secondary%20to%20COVID-19&volume=14&publication_year=2022&pages=e26911&pmid=35865183&doi=10.7759/cureus.26911&)\]
*   60. Zhou Y, Shi J, Stein R, et al.  Missing data matter: an empirical evaluation of the impacts of missing EHR data in comparative effectiveness research. J Am Med Inform Assoc. 2023;30:1246-1256. \[[DOI](https://doi.org/10.1093/jamia/ocad066)\] \[[PMC free article](/articles/PMC10280351/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/37337922/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Am%20Med%20Inform%20Assoc&title=Missing%20data%20matter:%20an%20empirical%20evaluation%20of%20the%20impacts%20of%20missing%20EHR%20data%20in%20comparative%20effectiveness%20research&volume=30&publication_year=2023&pages=1246-1256&pmid=37337922&doi=10.1093/jamia/ocad066&)\]
*   61. Van Buuren S, Groothuis-Oudshoorn K.  mice: multivariate imputation by chained equations in R. J Stat Soft. 2011;45:1-67. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Stat%20Soft&title=mice:%20multivariate%20imputation%20by%20chained%20equations%20in%20R&volume=45&publication_year=2011&pages=1-67&)\]
*   62. Lin W-C, Tsai C-F.  Missing value imputation: a review and analysis of the literature (2006–2017). Artif Intell Rev. 2020;53:1487-1509. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Artif%20Intell%20Rev&title=Missing%20value%20imputation:%20a%20review%20and%20analysis%20of%20the%20literature%20\(2006%E2%80%932017\)&volume=53&publication_year=2020&pages=1487-1509&)\]
*   63. Futoma J, Simons M, Panch T, Doshi-Velez F, Celi LA.  The myth of generalisability in clinical research and machine learning in health care. Lancet Digit Health. 2020;2:e489-e492. \[[DOI](https://doi.org/10.1016/S2589-7500\(20\)30186-2)\] \[[PMC free article](/articles/PMC7444947/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/32864600/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Lancet%20Digit%20Health&title=The%20myth%20of%20generalisability%20in%20clinical%20research%20and%20machine%20learning%20in%20health%20care&volume=2&publication_year=2020&pages=e489-e492&pmid=32864600&doi=10.1016/S2589-7500\(20\)30186-2&)\]
*   64. De Carvalho VF, Paggiaro AO, Goldner A, Gemperli R.  Retrospective evaluation of the accuracy of five different severity scores to predict the mortality in burn patients. J Burn Care Res. 2024;45:1175-1182. \[[DOI](https://doi.org/10.1093/jbcr/irab057)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33882125/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Burn%20Care%20Res&title=Retrospective%20evaluation%20of%20the%20accuracy%20of%20five%20different%20severity%20scores%20to%20predict%20the%20mortality%20in%20burn%20patients&volume=45&publication_year=2024&pages=1175-1182&pmid=33882125&doi=10.1093/jbcr/irab057&)\]
*   65. Foley FD, Moncrief JA, Mason AD Jr. Pathology of the lung in fatally burned patients. Ann Surg. 1968;167:251-264. \[[DOI](https://doi.org/10.1097/00000658-196802000-00015)\] \[[PMC free article](/articles/PMC1387412/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/5635705/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Ann%20Surg&title=Pathology%20of%20the%20lung%20in%20fatally%20burned%20patients&volume=167&publication_year=1968&pages=251-264&pmid=5635705&doi=10.1097/00000658-196802000-00015&)\]
*   66. Snell JA, Loh N-HW, Mahambrey T, Shokrollahi K.  Clinical review: the critical care management of the burn patient. Crit Care. 2013;17:241-210. \[[DOI](https://doi.org/10.1186/cc12706)\] \[[PMC free article](/articles/PMC4057496/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/24093225/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Crit%20Care&title=Clinical%20review:%20the%20critical%20care%20management%20of%20the%20burn%20patient&volume=17&publication_year=2013&pages=241-210&pmid=24093225&doi=10.1186/cc12706&)\]
*   67. Ferreira FL, Bota DP, Bross A, M’elot C, Vincent J-L.  Serial evaluation of the SOFA score to predict outcome in critically ill patients. JAMA. 2001;286:1754-1758. \[[DOI](https://doi.org/10.1001/jama.286.14.1754)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/11594901/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=Serial%20evaluation%20of%20the%20SOFA%20score%20to%20predict%20outcome%20in%20critically%20ill%20patients&volume=286&publication_year=2001&pages=1754-1758&pmid=11594901&doi=10.1001/jama.286.14.1754&)\]
*   68. Knaus WA, Wagner DP, Draper EA, et al.  The APACHE III prognostic system: risk prediction of hospital mortality for critically III hospitalized adults. Chest. 1991;100:1619-1636. \[[DOI](https://doi.org/10.1378/chest.100.6.1619)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/1959406/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Chest&title=The%20APACHE%20III%20prognostic%20system:%20risk%20prediction%20of%20hospital%20mortality%20for%20critically%20III%20hospitalized%20adults&volume=100&publication_year=1991&pages=1619-1636&pmid=1959406&doi=10.1378/chest.100.6.1619&)\]
*   69. Le Gall JR, Klar J, Lemeshow S, et al.  The Logistic Organ Dysfunction system: a new way to assess organ dysfunction in the intensive care unit. JAMA. 1996;276:802-810. \[[DOI](https://doi.org/10.1001/jama.276.10.802)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/8769590/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=JAMA&title=The%20Logistic%20Organ%20Dysfunction%20system:%20a%20new%20way%20to%20assess%20organ%20dysfunction%20in%20the%20intensive%20care%20unit&volume=276&publication_year=1996&pages=802-810&pmid=8769590&doi=10.1001/jama.276.10.802&)\]
*   70. Bone RC, Balk RA, Cerra FB, et al.  Definitions for sepsis and organ failure and guidelines for the use of innovative therapies in sepsis. Chest. 1992;101:1644-1655. \[[DOI](https://doi.org/10.1378/chest.101.6.1644)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/1303622/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Chest&title=Definitions%20for%20sepsis%20and%20organ%20failure%20and%20guidelines%20for%20the%20use%20of%20innovative%20therapies%20in%20sepsis&volume=101&publication_year=1992&pages=1644-1655&pmid=1303622&doi=10.1378/chest.101.6.1644&)\]
*   71. Hastie TJ, Tibshirani RJ.  Generalized Additive Models. CRC Press; 1990. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=Generalized%20Additive%20Models&publication_year=1990&)\]
*   72. Wang C, Han B, Patel B, Rudin C.  In pursuit of interpretable, fair and accurate machine learning for criminal recidivism prediction. J Quant Criminol. 2023;39:519-581. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Quant%20Criminol&title=In%20pursuit%20of%20interpretable,%20fair%20and%20accurate%20machine%20learning%20for%20criminal%20recidivism%20prediction&volume=39&publication_year=2023&pages=519-581&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae318\_Supplementary\_Data

[ocae318\_supplementary\_data.pdf](/articles/instance/12005632/bin/ocae318_supplementary_data.pdf) (8MB, pdf)

### Data Availability Statement

MIMIC III[39](#ocae318-B39) and eICU[40](#ocae318-B40) are both publicly available at [https://mimic.mit.edu/](https://mimic.mit.edu/) and [https://eicu-crd.mit.edu/](https://eicu-crd.mit.edu/), respectively. The software developed in this study is available at [https://github.com/interpretml/FasterRisk](https://github.com/interpretml/FasterRisk). The source code for experiments involved in this study is available at [https://github.com/MuhangTian/GFR-Experiments](https://github.com/MuhangTian/GFR-Experiments).

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**