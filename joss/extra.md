
_______


<!-- 
Static type systems offer a different point of intervention. Rather than inspecting output for errors after the fact, they flag potential errors in code before it runs. differ from programming languages with static type systems, which may offer a different point of intervention to minimize analysis errors. 

Rather than inspecting output for errors after the fact, they flag potential errors in code before it runs. The theoretical foundation for this mechanism is well established. Sound static type systems guarantee the absence of certain classes of runtime errors by construction.[18][19] -->


<!-- Institutional knowledge about data quality is typically needed to account for Institutional knowledge about data quality is fragile and poorly shared, and the same mistakes recur across teams and projects.[12]

Despite the importance of any of the errors that occur can be silent when the code is being written and executed. 

The most dangerous failures are not the ones that crash the program. They are the ones where the code runs to completion and produces a plausible but wrong result. Decision support systems are particularly vulnerable.  -->

<!-- Some of these are due to initial data source issues. For example, a large data table with results for a Vitamin B12 assay might have a 'RESULT' column with numeric results. One single row on that data table might include a number alongside the unit: 'pg/mL'. That text can silently convert every other numeric value into a text value as well. How exactly the abberant value is managed - dropped automatically, converted to null, treated it as the number 0, etc - can vary based on the programming language and statistical tools being used.  -->



<!-- Indeed, how data are prepared before analysis can matter more than the analysis itself. One analysis of simulated RCT data found that preparation decisions accounted for up to 99% of the variance in estimated treatment effects, while the choice of statistical model accounted for less than 8%.[8]  Another study found that a single preparation decision, such as how a prescription stop date is calculated, can change estimated treatment effects by orders of magnitude.[3] 

A scoping review across a major national clinical data research network concluded that quality assessments report inconsistent definitions and uneven use of available methods.[13] A national survey of clinical studies found that nearly half did not use data management software, and fewer than half of responsible staff received training on data quality monitoring.[14]  -->



Schmidt et al. developed an R-based data quality framework with 34 indicators covering integrity, completeness, consistency, and accuracy for observational health research.[25] Reproducible analysis pipelines using bioinformatics workflow managers have been developed to standardize data quality analysis tools for deployment across clinical data research network sites.[26] Automated frameworks for medical data curation have been developed to detect inconsistencies, missing values, outliers, and duplicates at runtime.[1] Vocabularies, ontologies, and natural language processing have been applied to improve EHR data quality across dimensions such as conformance, portability, and usability.[7]

These approaches largely do not extend to the numerous errors that can occur during the analysis of this data. 

Despite the prevalence and consequences of mistakes made during the implementation of data analyses, existing infrastructure for everyday work is limited and inconsistent. - Would like a citation here -. Even in top-tier journals, only 40% of observational studies reported any data cleaning procedures.[15]

These tools can only intervene after transformation code has already run. They check the finished dataset for unexpected missing values or implausible numbers, but they cannot identify which line of code caused the problem. This matters because many clinical data errors originate in transformation code rather than source data. A misspelled column name, a join that silently introduces nulls, or a type conversion that truncates values are mistakes in code, not in data. Some of these mistakes cause the program to stop with an error message. But the mistakes that produce plausible, structurally valid output go undetected. Even recent proposals acknowledge that current approaches remain reactive.[16] When transformation processes are formally validated, errors on the order of several percent are consistently found.[17]

### Static Type Checking Offers a Complementary Layer of Prevention

Static type systems offer a different point of intervention. Rather than inspecting output for errors after the fact, they flag potential errors in code before it runs. The theoretical foundation for this mechanism is well established. Sound static type systems guarantee the absence of certain classes of runtime errors by construction.[18][19]

Empirical evidence supports the practical effectiveness of this mechanism for specific defect classes. Gao, Bird, and Barr (2017) replayed public, checked-in JavaScript bugs through TypeScript-family type checkers and found that approximately 15% were detectable by static typing alone. The authors frame this as a lower bound, since the analyzed bugs had already survived code review and testing.[20] Khan et al. (2021) conducted an analogous study for Python and found that mypy-style static checking could likely avoid approximately 15% of corrective defects, with null handling, dynamic attribute initialization, and reference redefinition among the most common type-related defect categories.[21] These defect categories correspond closely to the error classes relevant to dataframe pipelines: nullable value misuse, stale column references, and type mismatches after transformation.

The evidence also establishes clear boundaries on what static typing can and cannot achieve. Hanenberg et al. (2014) found that static types improved maintainability for tasks involving understanding undocumented code and fixing type errors, but did not help with semantic errors.[22] Berger et al. (2019) reanalyzed a large-scale GitHub mining study and found that language-defect associations, while statistically significant, were small in practical magnitude and methodologically fragile.[23] Tang, Alimadadi, and Sumner (2026) found that while TypeScript has reduced traditional runtime and type errors, it has shifted fragility toward tooling, configuration, and API misuse.[24] Static typing addresses one layer of defects without eliminating others.

This evidence supports a specific claim. Static typing reliably prevents or exposes particular classes of defects: interface mismatches, null and type misuse, stale references, and type confusion. The strongest quantified estimates place the preventable share at approximately 15% of public defects for both JavaScript/TypeScript and Python.[20][21] Broader claims that static typing generally reduces production bug rates are supported by some observational evidence but are methodologically contested.[23] This study does not make such broad claims. Instead, it applies compile-time detection of structural type errors to the specific domain of clinical dataframe transformations, where null misuse, column reference errors, and type mismatches are among the most common and consequential failure modes.

### TypeScript Is Increasingly Used in Clinical Data Work



A growing share of upstream data work in clinical informatics, however, occurs in TypeScript, an increasingly popular statically typed language. TypeScript recently became the most used programming language on GitHub, in part because typed languages make AI-assisted coding more reliable in production.[25] In clinical medicine, TypeScript is increasingly used for FHIR-based interoperability platforms, web dashboards, and application programming interfaces.[26][27][28]

The stakes of catching transformation errors early are rising. Data quality evaluation is moving from best practice toward regulatory expectation for clinical AI products.[29][30] Data-level problems in deployment environments have been shown to degrade clinical model performance in hospital-specific ways.[31]

Despite this prevalence, TypeScript has not traditionally been treated as a primary language for data analysis. Clinical applications that receive, transform, and display patient data in TypeScript typically export that data to Python or R for analysis, then re-import results. This boundary crossing introduces its own opportunities for error and makes end-to-end type safety impossible.

This study evaluates whether a data analysis framework built on TypeScript's static type system can detect a meaningful class of clinical data transformation errors compared to conventional dynamic workflows, and characterizes the practical limits of this approach.



### Type-Checker Performance

Because the approach depends on TypeScript’s compiler, we measured how long it takes to check representative files. Measurements included the full verification file, workflows with varying numbers of columns, and workflows with increasing numbers of chained operations. The chained-operation tests also identified the point at which deeply repeated transformations reach a TypeScript compiler limit.

### Statistical Function Validation

Tidy-TS includes statistical functions and hypothesis tests. These are separate from the error-detection evaluation but are part of the broader framework. Statistical results are validated against R using randomized tests with agreement within 1e-6 for test statistics and p-values. 