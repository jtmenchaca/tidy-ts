
JOURNAL INFORMATION
==============================
NLM Title Abbreviation: J Am Med Inform Assoc
Journal ID: J Am Med Inform Assoc
Journal ID: jamia

Journal of the American Medical Informatics Association: JAMIA

ISSN: 1067-5027
EISSN: 1527-974X
Publisher: Oxford University Press

ARTICLE INFORMATION
==============================
PMCID: PMC12758480
PMID: 39862440
DOI: 10.1093/jamia/ocaf016
Article ID: ocaf016
Article version: 1
Subjects: Research and Applications, AcademicSubjects/MED00580, AcademicSubjects/SCI01060, AcademicSubjects/SCI01530

Machine learning-based risk prediction of outcomes in patients hospitalized with COVID-19 in Australia: the AUS-COVID Score

https://orcid.org/0000-0001-7352-900X Sritharan Hari P MD Conceptualization Data curation Formal analysis Funding acquisition Investigation Methodology Project administration Resources Software Validation Visualization Department of Cardiology, Royal North Shore Hospital, Sydney, NSW 2065, Australia
Faculty of Medicine and Health, University of Sydney, Sydney, NSW 2006, Australia

Nguyen Harrison PhD Formal analysis Methodology Software Validation Visualization Department of Cardiology, Royal North Shore Hospital, Sydney, NSW 2065, Australia

van Gaal William MBBS, MD Conceptualization Investigation Methodology Project administration Supervision Validation Visualization Department of Cardiology, Northern Hospital, Melbourne, VIC 3076, Australia
Faculty of Medicine, University of Melbourne, Melbourne, VIC 3010, Australia

Kritharides Leonard MBBS, PhD Conceptualization Investigation Methodology Project administration Supervision Validation Visualization Faculty of Medicine and Health, University of Sydney, Sydney, NSW 2006, Australia
Department of Cardiology, Concord Repatriation General Hospital, Sydney, NSW 2138, Australia

Chow Clara K MBBD, PhD Conceptualization Investigation Methodology Project administration Supervision Validation Visualization Faculty of Medicine and Health, University of Sydney, Sydney, NSW 2006, Australia
Westmead Applied Research Centre and Department of Cardiology, Westmead Hospital, Sydney, NSW 2145, Australia

Bhindi Ravinay MBBS, PhD Conceptualization Funding acquisition Investigation Methodology Project administration Resources Supervision Validation Visualization Department of Cardiology, Royal North Shore Hospital, Sydney, NSW 2065, Australia
Faculty of Medicine and Health, University of Sydney, Sydney, NSW 2006, Australia

for the AUS-COVID Investigators Sritharan Hari P Bhatia Kunwardeep S van Gaal William Kritharides Leonard Chow Clara Bhindi Ravinay Allahwala Usaid Chia Justin Ciofani Jonathan Nour Daniel Chui Karina Vasanthakumar Sheran Jayadeva Pavithra Kandadai Dhanvee Bhagwandeen Rohan Brieger David B Choong Christopher Y P Delaney Anthony Dwivedi Girish Harris Benjamin Hillis Graham Hudson Bernard Javorsky George Jepson Nigel Kanagaratnam Logan Kotsiou George Lee Astin Lo Sidney T H MacIsaac Andrew I McQuillan Brendan M Ranasinghe Isuru Walton Antony Weaver James Wilson William Yong Andy Zhu John
Corresponding author: Ravinay Bhindi, MBBS, PhD, Department of Cardiology, Royal North Shore Hospital, Level 4, Reserve Road, St Leonards, Sydney, NSW 2065, Australia (ravinay.bhindi@sydney.edu.au)
Publication date: 2026 Jan
Electronic publication date: 2025 Jan 25
Volume: 33
Issue: 1
First page: 210
Last page: 219
Received 2024 Aug 27; Revised 2024 Nov 27; 2025 Jan 16; Accepted 2025 Jan 17
Copyright: © The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association.
Copyright year: 2026
License: This is an Open Access article distributed under the terms of the Creative Commons Attribution-NonCommercial-NoDerivs licence (https://creativecommons.org/licenses/by-nc-nd/4.0/), which permits non-commercial reproduction and distribution of the work, in any medium, provided the original work is not altered or transformed in any way, and that the work is properly cited. For commercial re-use, please contact journals.permissions@oup.com
License URL: https://creativecommons.org/licenses/by-nc-nd/4.0/

Keywords: COVID-19, machine learning, mortality, cardiovascular disease, risk prediction

Funding: Paul Ramsay Foundation and the Northern Sydney Local Health District
Page count: 10

==============================
Abstract

Objectives

We aimed to develop a highly interpretable and effective, machine learning (ML)-based risk prediction algorithm to predict in-hospital mortality, intubation, and adverse cardiovascular events in patients hospitalized with coronavirus disease 2019 (COVID-19) in Australia (AUS-COVID Score).

Materials and Methods

This prospective study across 21 hospitals included 1714 consecutive patients aged ≥ 18 in their index hospitalization with COVID-19. The dataset was separated into training (80%) and test sets (20%). Eight supervised ML methods were used: least absolute shrinkage and selection operator (LASSO), ridge, elastic net (EN), decision tree, support vector machine, random forest, AdaBoost, and gradient boosting. A feature selection method was used to establish informative variables, which were considered in groups of 5/10/15/20/all. The final model was selected by balancing the optimal area under the curve (AUC) score with interpretability, through the number of included variables. The coefficients of the final models were used to build the AUS-COVID Score.

Results and Discussion

Among the patients, 181 (10.6%) died in-hospital, 148 (8.6%) required intubation, and 90 (5.3%) had adverse cardiovascular events. The LASSO model performed best for predicting in-hospital mortality (AUC 0.85) using 5 variables: age, respiratory rate, COVID-19 features on chest X-ray, troponin elevation, and COVID-19 vaccination (≥1 dose). The EN model performed best for predicting intubation (AUC 0.75) and adverse cardiovascular events (AUC 0.64), each with 5 variables. A user-friendly web-based application was built for clinician use at the bedside.

Conclusion

The AUS-COVID Score is an accurate and practical, ML-based risk score to predict in-hospital mortality, intubation, and adverse cardiovascular events in hospitalized COVID-19 patients.

Background

In late 2019, the first case of coronavirus disease 2019 (COVID-19) was reported in Wuhan, China. COVID-19 spread rapidly around the world and was declared a pandemic in March 2020. The consequent impact of the COVID-19 pandemic has been devastating with over 770 million cases and 6.9 million deaths reported worldwide thus far, across multiple waves.1 Despite the advent and widespread uptake of the COVID-19 vaccine, there remain multiple spikes in case numbers with associated morbidity and mortality. COVID-19 also has significant cardiovascular implications including arrhythmias, myocardial injury, and heart failure.2

Early identification of patients who are at highest risk of poorer outcomes from COVID-19 remains key in both mitigating these outcomes and the burden to the health care system. A predictive model that accurately predicts outcomes in patients with COVID-19, including mortality, intubation and adverse cardiovascular events, would allow for effective triage, resource allocation, and optimal patient management. Machine learning (ML) is a computer science discipline that focuses on outcome prediction in complex datasets using various algorithms that learn from the data through iterative processes.3–5 Unlike traditional approaches that rely on predefined assumptions about data behavior and preselected variables, ML algorithms enable the model to evolve by identifying and acquiring underlying patterns within the data.5–7 Machine-learning models have been demonstrated to have largely superior performance in comparison to traditional approaches for risk prediction, and their role has come to the fore during the COVID-19 pandemic.8

Previous studies reporting on machine learning-based risk prediction algorithms for COVID-19 outcomes are limited by single-center experiences, nongeneralizable selected populations, short time periods isolated to a particular COVID-19 strain, or absent data on vaccination that limits contemporary relevance.9–12 There remains a paucity of data specifically on risk prediction of adverse cardiovascular events in patients with COVID-19. Moreover, the COVID-19 pandemic posed significant strain on health care systems worldwide and the confounding impact of this on earlier studies of machine learning-based risk prediction models remains unknown. Australia provides a unique setting to investigate the unbiased outcomes of COVID-19 and build a contemporarily relevant risk prediction model, with its lower case numbers and lower health care system stress throughout the course of the pandemic yielding a comparatively stable environment to study these outcomes.13,14

The aim of our study is to develop a machine learning-based risk prediction algorithm derived from a multicenter dataset in a region where the overall health system was less impact by the pandemic, such an algorithm is likely to be more applicable in this postpandemic era where case load is not as high, but clarity on who will develop adverse outcomes remain important to guiding management.

Methods

Study cohort

Data were obtained from the Australian Cardiovascular COVID-19 Registry (AUS-COVID), a prospective observational cohort study established during the early stages of the COVID-19 pandemic to examine the impact of COVID-19 on the cardiovascular health of hospitalized patients in Australia. AUS-COVID spans 21 hospitals across 4 Australian states. The study comprises consecutive individuals aged 18 years or older in their index hospitalization with confirmed COVID-19 as documented in the AUS-COVID Registry. Patients with suspected COVID-19 without laboratory confirmation, and those who were transferred from another hospital were excluded. Additional information about the registry and the hospitals involved can be found at https://www.aus-covid.com/. The study received approval from the Northern Sydney Local Health District Human Research Ethics Committee (HREC 2020/ETH00732), including a waiver of consent and this study is registered with the Australian and New Zealand Clinical Trials Registry (ACTRN12620000486921).

Primary outcomes and exposure variables

The primary outcomes were in-hospital mortality, intubation, and adverse cardiovascular events. Adverse cardiovascular events were a composite outcome including new onset atrial fibrillation or flutter, high-grade atrioventricular block, sustained ventricular tachycardia, new heart failure or cardiomyopathy, pericarditis or myocarditis, pulmonary embolism, and cardiac arrest. The exposure variable of preexisting cardiovascular disease was a composite of preexisting coronary artery disease, heart failure or cardiomyopathy, atrial fibrillation or flutter, severe valvular disease, peripheral arterial disease, and stroke or transient ischemic attack. Data pertaining to COVID-19 vaccination status were gathered following the rollout of the vaccination program in Australia, and so any patients prior to this period were regarded as unvaccinated and patients with unknown vaccination status following this period were imputed as unvaccinated.

Machine learning models

The data were separated into 2 subsets where 80% of the dataset was used as training data for feature selection and training the parameters of the model and 20% was used as the test data to evaluate the performance of each model. Figure 1 shows the process of the methodology.

Figure 1. Overview of study methodology for data training and testing.

Overview of study methodology.

Eight supervised-learning classification models were used to experiment in the creation of a risk prediction algorithm for the outcome variables, probability of in-hospital mortality, intubation, and adverse cardiovascular events. The 3 linear, logistic regression (LR)-based models include least absolute shrinkage and selection operator (LASSO or L1), ridge (L2), and elastic net (EN). The 5 nonlinear, models include decision tree (DT), support vector machine (SVM), random forest (RF), AdaBoost (AB), and gradient boosting (GB).

Logistic regression

Logistic regression is used to predict the probability of an event taking place by having the log odds of the event be a linear combination of 1 or more independent variables. The goodness of fit for LR is calculated using the negative log likelihood. The LR can be extended to a regularized regression approach such as LASSO or L1 or L2 by putting constraints on the coefficients. These constraints reduce the size of the coefficients with the purpose of reducing overfitting on the training dataset. Elastic net is another type of regularized linear regression that combines both the LASSO and ridge approaches, utilizing both the L1 and L2 penalty functions.

Support vector machine

Support vector machine attempts to find an hyperplane that best separates data of one class from those of another. The optimal hyperplane that maximizes the margin, which is defined as the distance between the hyperplane and the nearest data points from each class. The support vectors are the data points that lie closest to the decision boundary.

In most cases, the data are not linearly separable in the original feature space and as such, the data are transformed to a higher dimensional space where it may become separable, often using techniques like the kernel trick. Common kernel functions include linear, polynomial, radial basis function, and sigmoid kernels. Furthermore, even with the kernel trick, the data are often not perfectly separable, and there may be some overlap or noise. Support vector machine allows for a “soft margin” that permits some misclassifications or overlapping data points. The balance between maximizing the margin and tolerating misclassifications is controlled by a parameter called C.

Decision tree

A DT consists of nodes that represent features, branches that depict decisions, and leaves that represent the final outcomes (class labels or numeric values). At each internal node, the tree evaluates a specific feature to make a decision. Based on the feature’s value, the tree follows the corresponding branch to reach another internal node or a leaf node. The process of choosing the best features and creating branches is called splitting. The goal is to create splits that maximize the separation of data points belonging to different classes.

Random Forest

An RF is an ensemble machine-learning method that consists of a collection of DTs. Each tree is trained independently from a random sample of training data and a random subset of features. To make a prediction, each tree in the RF generates its own prediction and the most popular class among the trees is chosen as the final prediction. By creating multiple DTs with different subsets of data and features, RF leverages the principles of bagging (Bootstrap Aggregating) to reduce variance.

AdaBoost

AdaBoost is an ensemble method by combining a series of weak learners (eg, DT with only 1 node). Initially, all data points are assigned equal weights. In each iteration, AB assigns higher weights to the data points that were misclassified by the previous weak learner. In each iteration, the next weak learner is trained on the weighted data. After each weak learner is trained, they are combined into a strong classifier through a weighted voting process. The weights of each weak learner’s prediction are determined based on its accuracy.

Gradient boosting

Similar to AB, GB combines multiple weak learners to form a strong predictive model. However, unlike AB, GB focuses on minimizing the residuals (the differences between the actual and predicted values) using a specified loss function such as the cross-entropy for classification problems. New weak learners are trained sequentially, with each one trying to fit the residuals of its predecessor.

Data preprocessing

The data used to train each of the models were oversampled by the minority class using SMOTENC, which is an extension of synthetic minority over-sampling technique (SMOTE) that caters for a mixed dataset of continuous and categorical features.15 Synthetic minority over-sampling technique improves model performance by generating synthetic samples for the minority class, helping to balance the dataset and mitigate the bias toward the majority class. By creating new data points that are interpolations between existing minority class samples, SMOTE reduces the risk of overfitting and enhances the model’s ability to learn from underrepresented outcomes. This leads to improved discrimination, more accurate predictions, and better calibration, as the model can now more effectively distinguish between classes and maintain performance across both majority and minority outcomes. Missing values were imputed with the median value of the respective feature and features were standardized by subtracting the mean and scaling to a variance of 1.

Feature selection

Features for LR were chosen in a sequential forward fashion. A subset of features was selected in a greedy fashion where the next best feature to add in the subset is based on the AUC cross-validation score. The best 5/10/15/20 features of the L1 LR trained in this sequential forward fashion as determined by the magnitude of the coefficient were used as features for the other models. All variables were also included. This process of extracting and ranking features, to include 5/10/15/20 features, was chosen for ease of interpretability and usability, and to reduce the dimensionality and complexity of models.

Model performance and statistical analysis

Hyperparameters of each model were chosen using 5-fold cross-validation using AUC as the scoring metric. After parameter tuning, each model was evaluated on the test set and the final model for each outcome variable was selected on the AUC score.

The final models were calibrated by fitting a sigmoid regressor and isotonic regressor. We evaluated the calibration of models with the Brier score.

The significance level was set to 5% for all statistical tests. All analyses were performed using Python (version 3.7), and the code of the methodology can be found on: https://github.com/harisritharan/cardiac_covid_model/blob/master/model_building_final.ipynb

Data stationarity assessment and temporal stability of model performance

The stationarity of the dataset and the temporal stability of model performance were assessed by dividing the cohort into 4 approximately equal quarters based on known admission dates. To evaluate whether the outcome distributions remained stable over time, χ2 tests were performed to assess changes in the proportion of patients experiencing each outcome (mortality, intubation, and adverse cardiovascular events) across the 4 quarters. For outcomes showing significant temporal variation, detailed analysis of the quarterly proportions was conducted to characterize the nature of these changes. The temporal stability of model performance was evaluated by analyzing the consistency of the models’ predictions across these same time periods. This purpose of this analysis was to provide insight into whether the models’ discriminative ability remained consistent over different time periods, which spanned multiple COVID-19 variants and changes in clinical practice.

Using the held-out test set, confusion matrices were generated for each quarter, comprising true positives, false positives, true negatives, and false negatives. Chi-squared tests were then performed to assess whether the distribution of these prediction outcomes varied significantly across quarters. A P-value<0.05 was considered statistically significant for all temporal analyses.

Application

A user-friendly web application was built to facilitate real-world use of our model using Python Dash. This web application has the optimal performing models based on AUC for mortality, intubation, and adverse cardiovascular events embedded within it, with manual selection of variables by the user yielding a risk assessment score as a percentage.

Results

Study cohort

The total study cohort included 1714 patients, with recorded admission dates spanning from September 4, 2020 to July 11, 2022. Of these patients, 181 (10.6%) patients died, 148 (8.6%) patients required intubation, and 90 (5.3%) patients had adverse cardiovascular events. The mean age of patients was 60.1 ± 20.6 years and 54.0% were male. Additional baseline study cohort characteristics are detailed in Table 1.

Table 1. Baseline characteristics.

	All patients	Proportion of missing values	
Demographics			
 Mean age (SD)—years	60.1 (20.6)	0%	
 Male—no. (%)	926 (54.0%)	0%	
 Health care worker—no. (%)	68 (4.0%)	0%	
 Nursing home resident—no. (%)	152 (8.9%)	0%	
Comorbidities			
 Hypertension—no (%)	722 (44.4%)	5.3%	
 Coronary artery disease—no. (%)	183 (11.3%)	5.3%	
 Heart failure or cardiomyopathy—no. (%)	110 (6.8%)	5.3%	
 Atrial fibrillation or flutter—no. (%)	169 (10.4%)	5.3%	
 PPM/ICD—no. (%)	59 (3.6%)	5.3%	
 Severe valvular disease—no. (%)	42 (2.6%)	5.3%	
 Stroke or TIA—no. (%)	98 (6.0%)	5.3%	
 Hypercholesterolemia—no. (%)	466 (28.7%)	5.3%	
 Diabetes mellitus—no. (%)	389 (23.9%)	5.3%	
 Peripheral arterial disease—no. (%)	23 (1.4%)	5.3%	
 Current or recent smoker (<1 year)—no. (%)	134 (8.3%)	5.3%	
 Chronic obstructive pulmonary disease—no. (%)	124 (7.6%)	5.3%	
 Asthma—no. (%)	192 (11.8%)	5.3%	
 Chronic kidney disease (eGFR<60 mL/min/1.73 m2)—no. (%)	131 (8.1%)	5.3%	
 Dialysis		5.3%	
  Yes—still receiving dialysis—no. (%)			
  Yes—was previously on dialysis, however is no longer on dialysis (eg, renal transplant)—no. (%)			
  No—no. (%)			
COVID-19 vaccination status		15.7%	
 One or more doses—no. (%)	348 (24.1%)		
 Unvaccinated—no. (%)	1097 (75.9%)		
Height and weight			
 Height (SD)—cm	169.0 (15.4)	64.2%	
 Weight (SD)—kg	83.2 (22.5)	50.9%	
First available vitals on presentation			
 Systolic blood pressure (SD)—mmHg	130.8 (22.3)	5.1%	
 Diastolic blood pressure (SD)—mmHg	75.9 (13.0)	8.8%	
 Heart rate (SD)—beats per minute	91.7 (18.2)	3.0%	
 Respiratory rate (SD)—breaths per minute	23.0 (6.8)	4.2%	
 Temperature (SD)—°C	37.4 (2.0)	6.7%	
 SpO2 (SD)—% on room air	94.3 (5.2)	8.1%	
First available serology within 24 h of admission			
 CRP (SD)—mg/L	69.3 (72.0)	16.8%	
 Lymphocyte count (SD)—×109/L	1.3 (3.1)	5.0%	
 Total white cell count (SD)—×109/L	6.8 (6.3)	4.4%	
 Platelets (SD)—×109/L	216.7 (145.8)	4.9%	
 Albumin (SD)—g/L	34.3 (11.1)	12.8%	
 Lactate dehydrogenase (SD)—unit/L	355.5 (194.7)	51.9%	
 d-dimer (SD)—mg/L	1.5 (6.1)	50.4%	
 Procalcitonin (SD)—µg/L			
 Ferritin (SD)—µg/L	920.2 (1378.9)	54.3%	
 Hemoglobin (SD)—g/L	133.2 (19.5)	4.7%	
 eGFR (SD)—mL/min/1.73 m2			
 Creatinine (SD)—µmol/L	97.5 (90.5)	4.6%	
 ALT (SD)—unit/L	43.3 (53.6)	16.0%	
 Lactate (venous) (SD)—mmol/L	2.3 (12.7)	56.1%	
 Troponin measurement above the upper limit of normal—no. (%)	369 (37.4%)	42.4%	
First chest X-ray during admission		0%	
 No chest X-ray performed during entire admission	201 (11.7%)		
 Features of COVID-19 present	974 (56.8%)		
 No features of COVID-19 present	539 (31.4%)		
Abbreviations: SD (standard deviation), PPM/ICD (permanent pacemaker/implantable cardioverter defibrillator), TIA (transient ischaemic attack), eGFR (estimated glomerular filtration rate), COVID-19 (Coronavirus disease 2019), SpO2 (oxygen saturation), CRP (C-reactive protein), ALT (alanine aminotransferase).

Predictive models for in-hospital mortality

From the 8 ML algorithms applied to the AUS-COVID database patients, the model obtained by RF had the best performance for the outcome of in-hospital mortality when including all features (AUC 0.864), 20 features (AUC 0.849), 15 features (AUC 0.848), and 10 features (AUC 0.833). However, when including 5 features, the model obtained by L1 had the best performance (AUC 0.852) which was marginally lower than the RF model with all features. The changes in model performance across the 8 ML algorithms based on the number of features included are shown in Figure 2A.

Figure 2. Predictive performance of models by number of variables for in-hospital mortality (A), intubation (B), and adverse cardiovascular events (C).

Predictive model performance by number of variables for in-hospital mortality, intubation and adverse cardiovascular events.

When balancing model performance with ease of interpretability and useability, the model obtained by L1 including 5 features was chosen as the final model (AUC 0.852, accuracy 0.831, precision 0.324, recall 0.697, F1 score 0.442). This model exhibited good calibration following the application of an isotonic regressor, with Brier score of 0.072, from the uncalibrated model’s Brier score of 0.125. The performance of this L1 model and its comparison against the performance of other models including 5 features derived by the remaining 7 ML algorithms are detailed in Table S1 and Figure S1.

The results of the final model found that higher age and higher respiratory rate were associated with increased in-hospital mortality. In contrast, the absence of features of COVID-19 on first chest X-ray, troponin measurement within normal limits, and COVID-19 vaccination with 1 or more doses were associated with lesser in-hospital mortality. The coefficients of the L1 model were used to build the in-hospital mortality component of the AUS-COVID Score (Figure 3A).

Figure 3. Included coefficients and weighting in final models for in-hospital mortality (A), intubation (B), and adverse cardiovascular events (C).

Coefficients included in final models for in-hospital mortality, intubation and adverse cardiovascular events.

Predictive models for intubation

The model obtained by RF had the best performance for the outcome of intubation when including all features (AUC 0.792). However, the model obtained by EN had the best performance when including 20 features (AUC 0.762), 15 features (AUC 0.762), 10 features (AUC 0.762), and 5 features (AUC 0.752). The changes in model performance across the 8 ML algorithms based on the number of features included are shown in Figure 2B.

When balancing model performance with ease of interpretability and useability, the model obtained by EN including 5 features was chosen as the final model (AUC 0.752, accuracy 0.700, precision 0.168, recall 0.679, F1 score 0.270). This model exhibited good calibration following the application of a sigmoid regressor, with Brier score of 0.070, from the uncalibrated model’s Brier score of 0.203. The performance of EN model and its comparison against the performance of other models including 5 features derived by the remaining 7 ML algorithms are detailed in Table S2 and Figure S2.

The results of the final model found that features of COVID-19 on first chest X-ray were associated with increased intubation. However, preexisting history of cardiovascular disease, female gender, COVID-19 vaccination with 1 or more doses, and higher oxygen saturation on room air on initial observations were associated with decreased intubation. The coefficients of this EN model were used to build the intubation component of the AUS-COVID Score (Figure 3B).

Predictive models for adverse cardiovascular events

Out of the 8 ML algorithms, the model obtained by GB had the best performance for the outcome of adverse cardiovascular events when including all features (AUC 0.651). The models obtained by RF had the best performance when including 20 features (AUC 0.603) and 15 features (AUC 0.607). When including 10 features, the model obtained by DT had the best performance (AUC 0.601). However, when including 5 features (AUC 0.636), the model obtained by EN had the best performance and this was marginally lower than the GB model with all features. The changes in model performance across the 8 ML algorithms based on the number of features included are shown in Figure 2C.

When balancing model performance with ease of interpretability and useability, the model obtained by EN including 5 features was chosen as the final model (AUC 0.636, accuracy 0.738, precision 0.070, recall 0.375, F1 score 0.118). This model exhibited good calibration following the application of a sigmoid regressor, with Brier score of 0.045, from the uncalibrated model’s Brier score of 0.219. The performance of EN model and its comparison against the performance of other models including 5 features derived by the remaining 7 ML algorithms are detailed in Table S3 and Figure S3.

The results of the final model found that features of COVID-19 on first chest X-ray, nonsmoker or ex-smoker (>1 year) status, and higher creatinine were associated with increased adverse cardiovascular events. However, preexisting history of cardiovascular disease and troponin measurement within normal limits were associated with decreased adverse cardiovascular events. The coefficients of this EN model were used to build the adverse cardiovascular events component of the AUS-COVID Score (Figure 3C).

Data stationarity assessment and model temporal stability analysis

Analysis of outcome distributions across the 4 quarters revealed significant temporal variation in intubation rates (χ2 = 7.828, P = .0497), with a consistent decreasing trend over time from 12.2% in the first quarter to 4.8% in the fourth quarter. In contrast, both mortality (χ2 = 4.371, P = .224) and adverse cardiovascular events (χ2 = 1.351, P = .717) showed no significant temporal variation in their occurrence rates across the study period.

However, despite the observed temporal variation in intubation rates, assessment of model performance stability demonstrated consistent predictive accuracy across all time periods. Chi-squared analysis of the confusion matrices across quarters showed no significant temporal variation in predictive performance for any of the 3 outcomes: intubation (χ2 = 16.72, P = .053), mortality (χ2 = 7.62, P = .572), and adverse cardiovascular events (χ2 = 9.73, P = .372).

The AUS-COVID Score application

Finally, we developed a web-based application for the individual probability for in-hospital mortality, intubation, and adverse cardiovascular events. This web application is available at: https://aus-covid-score.onrender.com/

Discussion

We present dedicated machine learning-based risk prediction models for in-hospital mortality, intubation, and adverse cardiovascular events in hospitalized patients with COVID-19. These models are pragmatic in their design, and utilize clinical, biochemical, and imaging data that are routinely collected during the initial evaluation when hospitalized. Moreover, a user-friendly, web-based application, the “AUS-COVID Score,” was developed to assist clinicians at the bedside in risk stratifying patients in real-time, early in hospital presentation.

The Australian setting is a key strength of our study, as the lower case numbers and health care system stress in Australia throughout the pandemic provides a setting that is more reflective of current times for outcomes such mortality, intubation, and adverse cardiovascular events and subsequently build a contemporarily relevant risk prediction model. We present the first machine learning-based risk prediction algorithm for Australian patients with COVID-19. A further strength of our study is the inclusion of patients across time periods where different SARS-CoV-2 variants, namely the Alpha (B.1.1.7), Delta (B.1.617.2), and Omicron (B.1.1.529) variants, predominated in Australia. Moreover, our study includes patient recruited both before and after the COVID-19 vaccine rollout in Australia on February 22, 2021, and so uniquely includes vaccination in its risk prediction models. While there has been a considerable uptake of vaccination worldwide, a distinction between vaccinated and unvaccinated patients in contemporary risk prediction algorithms for COVID-19 remains relevant considering newer COVID-19 strains with potentially incomplete vaccine coverage and an enduring need for booster vaccinations to address waning natural and vaccine immunity.

A key strength of our study is the demonstrated temporal stability of our models' predictive performance, despite changes in clinical practice patterns and COVID-19 variants over time. While we observed a significant decrease in intubation rates across the study period (from 12.2% to 4.8%), likely reflecting evolving clinical management strategies and potentially different COVID-19 variants, our models maintained consistent predictive accuracy across all time periods. This temporal stability is particularly important given the dynamic nature of the COVID-19 pandemic, where both viral variants and treatment approaches have evolved. The stable performance of our models across different phases of the pandemic, despite changing clinical practices, suggests they are robust and supports their utility even as clinical practices continue to evolve. Additionally, the observed stability in mortality and adverse cardiovascular event rates across the study period supports the generalizability of our findings and suggests that our models captured fundamental predictive factors that remained relevant despite the evolving pandemic landscape.

Many studies have created ML models to predict intubation and mortality in patients with COVID-19. However, most of these studies have involved small datasets including predominantly data from single centers and their generalizability consequently remains limited.16–18 Moreover, most models have not considered vaccination status in their predictive variables which is a key limitation. Our model performed similar, if not better than, other models trained on larger, multicenter data; with a key feature of increased interpretability and usability through lesser variables and a user-friendly, web-based application to translate application of our model to the patient bedside.9,19–25 To our knowledge, we present the first machine learning-based risk prediction score for adverse cardiovascular events in patients hospitalized with COVID-19. Our comparatively lower AUC for our final model for adverse cardiovascular events, likely relates to the heterogeneity of the composite outcome and its overall lower incidence.

While our models demonstrate good overall performance as measured by AUC-ROC, it is important to consider the clinical implications of their predictions, particularly in the context of our relatively rare outcomes. The lower precision and F1-scores observed, especially for adverse cardiovascular events, indicate a potential for false positive predictions. In a clinical setting, falsely predicting a severe outcome like death or need for intubation could lead to unnecessary interventions, increased patient anxiety, or misallocation of resources. However, it's crucial to balance this against the risks of false negatives, which could result in inadequate monitoring or delayed interventions for high-risk patients. The optimal use of these predictive models in clinical practice would likely involve using them as screening tools to identify patients who may benefit from closer monitoring or early interventions, rather than as definitive predictors of outcomes.

We also analyzed data from multiple Australian hospitals at different timepoints during the COVID-19 pandemic, during which clinical protocols and therapeutics for COVID-19 were still being established, and so this may affect outcomes. However, our recruitment began after dexamethasone had been established as a frontline treatment for COVID-19 in June 2020, following the landmark RECOVERY trial results in the United Kingdom.26 This timing is particularly significant given Australia’s later surge in COVID-19 cases compared to other countries, ensuring our cohort predominantly reflects patients treated under contemporary, evidence-based protocols. Additionally, our study period coincides with the approval of remdesivir as a COVID-19 treatment in July 2020, further aligning our cohort with current treatment standards where applicable.27 We deliberately chose not to include treatment modality in our model, with this decision made to optimize the model's utility at the point of initial patient contact in the Emergency Department, where treatment decisions have not yet been made and such information would not be relevant for risk stratification.

Our study has some important limitations. Due to the pragmatic design of our study, investigations were performed solely according to clinical need and clinician order, which can contribute to subclinical complications being missed and a higher proportion of missing data for some laboratory exams such as lactate dehydrogenase and ferritin. Moreover, there was a high proportion of missing height (64.2%) and weight (50.9%) data and while this was not used in our final models, more complete anthropometric data collection would be desirable in future studies. Moreover, our dataset had a lower incidence of the outcome variables, particularly adverse cardiovascular events; this is a common issue faced in the development of machine learning-based risk prediction algorithms for medical purposes. We mitigated the impact of this by oversampling the data used to train each of the models by the minority class.

Our model was validated on an internal, test dataset; external validation on a dataset from another country would be ideal and necessary prior to consideration of widespread use of our risk score. While the exact performance of risk prediction models varies across different settings, there are significant parallels in the key predictors used. Our AUS-COVID Score shares several important variables with other well-performing models such as the ABC2-SPH Score (developed in Brazil) and the 4C Mortality Score (developed in the United Kingdom).28–30 These common predictors include age, respiratory parameters (eg, respiratory rate, oxygen saturation), markers of organ dysfunction (eg, urea level), and inflammatory markers (eg, C-reactive protein). The consistency in these key predictors across various settings suggests that the fundamental factors influencing COVID-19 outcomes may be similar globally, despite differences in health care systems and populations. This observation lends support to the potential applicability of our model beyond Australia. However, it is important to note that the performance of these models can vary when applied in different contexts. For example, the ABC2-SPH Score, which performed excellently in its original validation (AUC 0.859-0.894), showed reduced discrimination (AUC 0.716) when applied at ICU admission in a different cohort.30 This highlights the importance of external validation in diverse settings. While we maintain that caution should be exercised in directly applying our model to significantly different health care contexts without prior validation, the parallels observed with other international models suggest that the AUS-COVID Score captures core elements of COVID-19 prognosis that may be relevant across various settings. To fully establish the applicability of our model in other countries, we encourage further external validation studies in diverse, contemporary international cohorts.

Conclusion

We present a highly interpretable and effective machine learning-based risk prediction algorithm to predict in-hospital mortality, intubation, and adverse cardiovascular events in patients hospitalized with COVID-19: the AUS-COVID Score. This may assist in the risk stratification, individualized monitoring, and management of COVID-19 patients.

Supplementary Material

ocaf016_Supplementary_Data

Acknowledgments

We acknowledge the AUS-COVID investigators listed in Table S4.

Author contributions

Hari P. Sritharan (Conceptualization, Data curation, Formal analysis, Funding acquisition, Investigation, Methodology, Project administration, Resources, Software, Validation, Visualization), Harrison Nguyen (Formal analysis, Methodology, Software, Validation, Visualization), William van Gaal (Conceptualization, Investigation, Methodology, Project administration, Supervision, Validation, Visualization), Leonard Kritharides (Conceptualization, Investigation, Methodology, Project administration, Supervision, Validation, Visualization), Clara K. Chow (Conceptualization, Investigation, Methodology, Project administration, Supervision, Validation, Visualization), and Ravinay Bhindi (Conceptualization, Funding acquisition, Investigation, Methodology, Project administration, Resources, Supervision, Validation, Visualization).

Supplementary material

Supplementary material is available at Journal of the American Medical Informatics Association online.

Funding

This study was funded by unrestricted grants from the Paul Ramsay Foundation and the Northern Sydney Local Health District. The funders played no role in study design, data collection, analysis or interpretation, reporting, or publication.

Conflicts of interest

We have no relevant disclosures or competing interests.

Data availability

The original contributions presented in the study are included in the article, further inquiries can be directed to the corresponding author.


References

1 WHO. WHO Coronavirus Disease (COVID-19) Dashboard. Updated January 13, 2023. Accessed January 15, 2023. https://covid19.who.int/
2 Bhatia KS , SritharanHP, ChiaJ, et al  Cardiac complications in patients hospitalised with COVID-19 in Australia. Heart Lung Circ. 2021;30:1834-1840. 10.1016/j.hlc.2021.08.001 34481762 PMC8410226
3 Quer G , ArnaoutR, HenneM, ArnaoutR.  Machine learning and the future of cardiovascular care: JACC state-of-the-art review. J Am Coll Cardiol. 2021;77:300-313. 10.1016/j.jacc.2020.11.030 33478654 PMC7839163
4 Chiarito M , LuceriL, OlivaA, StefaniniG, CondorelliG.  Artificial intelligence and cardiovascular risk prediction: all that glitters is not gold. Eur Cardiol. 2022;17:e29. 10.15420/ecr.2022.11 36845218 PMC9947926
5 Sritharan HP , NguyenH, CiofaniJ, BhindiR, AllahwalaUK.  Machine-learning based risk prediction of in-hospital outcomes following STEMI: the STEMI-ML score. Front Cardiovasc Med. 2024;11:1454321. 10.3389/fcvm.2024.1454321 39450234 PMC11499125
6 Al’Aref SJ , AnchoucheK, SinghG, et al  Clinical applications of machine learning in cardiovascular disease and its relevance to cardiac imaging. Eur Heart J. 2019;40:1975-1986. 10.1093/eurheartj/ehy404 30060039
7 Vidal-Perez R , Vazquez-RodriguezJM.  Role of artificial intelligence in cardiology. World J Cardiol. 2023;15:116-118. 10.4330/wjc.v15.i4.116 37124979 PMC10130891
8 Liu W , LaranjoL, KlimisH, et al  Machine-learning versus traditional approaches for atherosclerotic cardiovascular risk prognostication in primary prevention cohorts: a systematic review and meta-analysis. Eur Heart J Qual Care Clin Outcomes. 2023;9:310-322. 10.1093/ehjqcco/qcad017 36869800 PMC10284268
9 Barough SS , Safavi-NainiSAA, SiavoshiF, et al  Generalizable machine learning approach for COVID-19 mortality risk prediction using on-admission clinical and laboratory features. Sci Rep. 2023;13:2399. 10.1038/s41598-023-28943-z 36765157 PMC9911952
10 Giuste FO , HeL, LaisP, et al  Early and fair COVID-19 outcome risk assessment using robust feature selection. Sci Rep. 2023;13:18981. 10.1038/s41598-023-36175-4 37923795 PMC10624921
11 Zakariaee SS , NaderiN, EbrahimiM, Kazemi-ArpanahiH.  Comparing machine learning algorithms to predict COVID-19 mortality using a dataset including chest computed tomography severity score data. Sci Rep. 2023;13:11343. 10.1038/s41598-023-38133-6 37443373 PMC10345104
12 Ponce D , de AndradeLGM, Claure-Del GranadoR, Ferreiro-FuentesA, LombardiR.  Development of a prediction score for in-hospital mortality in COVID-19 patients with acute kidney injury: a machine learning approach. Sci Rep. 2021;11:24439. 10.1038/s41598-021-03894-5 34952908 PMC8709848
13 Sritharan HP , BhatiaKS, van GaalW, KritharidesL, ChowCK, BhindiR.  Association between pre-existing cardiovascular disease, mortality and cardiovascular outcomes in hospitalised patients with COVID-19. Front Cardiovasc Med. 2023;10:1224886. 10.3389/fcvm.2023.1224886 37476577 PMC10354424
14 Basseal JM , BennettCM, CollignonP, et al  Key lessons from the COVID-19 public health response in Australia. Lancet Reg Health West Pac. 2023;30:100616. 10.1016/j.lanwpc.2022.100616 36248767 PMC9549254
15 Blagus R , LusaL.  SMOTE for high-dimensional class-imbalanced data. BMC Bioinformatics. 2013;14:106. 10.1186/1471-2105-14-106 23522326 PMC3648438
16 Hu C , LiuZ, JiangY, et al  Early prediction of mortality risk among patients with severe COVID-19, using machine learning. Int J Epidemiol. 2021;49:1918-1929. 10.1093/ije/dyaa171 32997743 PMC7543461
17 Ko H , ChungH, KangWS, et al  An artificial intelligence model to predict the mortality of COVID-19 patients at hospital admission time using routine blood samples: development and validation of an ensemble model. J Med Internet Res. 2020;22:e25442. 10.2196/25442 33301414 PMC7759509
18 Noy O , CosterD, MetzgerM, et al  A machine learning model for predicting deterioration of COVID-19 inpatients. Sci Rep. 2022;12:2630. 10.1038/s41598-022-05822-7 35173197 PMC8850417
19 Arvind V , KimJS, ChoBH, GengE, ChoSK.  Development of a machine learning algorithm to predict intubation among hospitalized patients with COVID-19. J Crit Care. 2021;62:25-30. 10.1016/j.jcrc.2020.10.033 33238219 PMC7669246
20 Bertsimas D , LukinG, MingardiL, et al; Hellenic COVID-19 Study Group. COVID-19 mortality risk assessment: an international multi-center study. PLoS One. 2020;15:e0243262. 10.1371/journal.pone.0243262 33296405 PMC7725386
21 Chen Z , ChenJ, ZhouJ, et al  A risk score based on baseline risk factors for predicting mortality in COVID-19 patients. Curr Med Res Opin. 2021;37:917-927. 10.1080/03007995.2021.1904862 33729889 PMC8054492
22 Gao Y , CaiGY, FangW, et al  Machine learning based early warning system enables accurate mortality risk prediction for COVID-19. Nat Commun. 2020;11:5033. 10.1038/s41467-020-18684-2 33024092 PMC7538910
23 Guan X , ZhangB, FuM, et al  Clinical and inflammatory features based machine learning model for fatal risk prediction of hospitalized COVID-19 patients: results from a retrospective cohort study. Ann Med. 2021;53:257-266. 10.1080/07853890.2020.1868564 33410720 PMC7799376
24 Singh V , KamaleswaranR, ChalfinD, et al  A deep learning approach for predicting severity of COVID-19 patients using a parsimonious set of laboratory markers. iScience. 2021;24:103523. 10.1016/j.isci.2021.103523 34870131 PMC8626152
25 Vaid A , SomaniS, RussakAJ, et al  Machine learning to predict mortality and critical events in a cohort of patients with COVID-19 in New York City: model development and validation. J Med Internet Res. 2020;22:e24018. 10.2196/24018 33027032 PMC7652593
26 Horby P , LimWS, EmbersonJR, et al; RECOVERY Collaborative Group. Dexamethasone in hospitalized patients with Covid-19. N Engl J Med. 2021;384:693-704. 10.1056/NEJMoa2021436 32678530 PMC7383595
27 Polkinghorne A , BranleyJM.  Medications for early treatment of COVID-19 in Australia. Med J Aust. 2022;217:S7-S13. 10.5694/mja2.51750 PMC9828711 36273391
28 Gupta RK , HarrisonEM, HoA, et al; ISARIC4C Investigators. Development and validation of the ISARIC 4C deterioration model for adults hospitalised with COVID-19: a prospective cohort study. Lancet Respir Med. 2021;9:349-359. 10.1016/s2213-2600(20)30559-2 33444539 PMC7832571
29 Knight SR , HoA, PiusR, et al; ISARIC4C Investigators. Risk stratification of patients admitted to hospital with covid-19 using the ISARIC WHO Clinical Characterisation Protocol: development and validation of the 4C Mortality Score. BMJ. 2020;370:m3339. 10.1136/bmj.m3339 32907855 PMC7116472
30 Nogueira MCA , NobreV, PiresMC, et al  Assessment of risk scores to predict mortality of COVID-19 patients admitted to the intensive care unit. Front Med (Lausanne). 2023;10:1130218. 10.3389/fmed.2023.1130218 37153097 PMC10157088
