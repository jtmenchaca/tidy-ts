import type { DataFrame } from "../dataframe/index.ts";
/**
 * GLMM family options
 */
export type GlmmFamily = "gaussian" | "binomial" | "poisson" | "gamma" | "inverse_gaussian" | "nbinom2" | "nbinom1";
/**
 * GLMM link options
 */
export type GlmmLink = "identity" | "logit" | "probit" | "cauchit" | "log" | "cloglog" | "inverse" | "sqrt" | "inverse_squared";
/**
 * Random effect specification
 */
export interface RandomEffectSpec {
    /** Grouping variable name (e.g., "patient", "clinic") */
    groupingVar: string;
    /** Terms in the random effect (e.g., ["1"] for intercept, ["1", "time"] for slope) */
    terms: string[];
    /** Covariance structure type (optional) */
    covariance?: "independent" | "unstructured" | "compound_symmetry";
}
/**
 * GLMM control options
 */
export interface GlmmControl {
    /** Maximum iterations for outer optimization */
    maxIter?: number;
    /** Convergence tolerance */
    tolerance?: number;
    /** Use REML estimation (default: true) */
    reml?: boolean;
    /** Print progress information */
    verbose?: boolean;
}
/**
 * Variance component estimate
 */
export interface VarianceComponent {
    /** Name of the grouping variable */
    groupName: string;
    /** Names of random effect terms */
    termNames: string[];
    /** Variance-covariance matrix */
    vcov: number[][];
    /** Standard deviations */
    stdDev: number[];
    /** Correlation matrix (if applicable) */
    correlation?: number[][];
    /** Standard errors of variance parameters */
    stdErrors?: number[];
}
/**
 * Random effect estimates (BLUPs)
 */
export interface RandomEffectEstimates {
    /** Name of the grouping variable */
    groupName: string;
    /** Term names */
    termNames: string[];
    /** Group identifiers */
    groupIds: string[];
    /** BLUP estimates: n_groups x n_terms matrix */
    estimates: number[][];
    /** Conditional standard errors */
    stdErrors?: number[][];
    /** Conditional variance-covariance */
    conditionalVcov?: number[][][];
}
/**
 * GLMM fit summary
 */
export interface GlmmFitSummary {
    /** Number of observations */
    nObservations: number;
    /** Number of fixed effect parameters */
    nFixed: number;
    /** Number of random effect parameters */
    nRandom: number;
    /** Number of variance parameters */
    nVarianceParams: number;
    /** Residual degrees of freedom */
    dfResidual: number;
    /** Number of groups per random effect */
    nGroups: Record<string, number>;
    /** Method used (ML or REML) */
    method: string;
}
/**
 * GLMM fit result interface
 */
export interface GlmmFitResult {
    /** Fixed effect coefficients */
    coefficients: number[];
    /** Fixed effect standard errors */
    standardErrors: number[];
    /** Fixed effect names */
    coefficientNames: string[];
    /** Variance component estimates */
    varianceComponents: VarianceComponent[];
    /** Random effect estimates (BLUPs) */
    blups: RandomEffectEstimates[];
    /** Residual variance */
    residualVariance: number;
    /** Log-likelihood at convergence */
    logLikelihood: number;
    /** REML criterion (if REML was used) */
    remlCriterion?: number;
    /** AIC */
    aic: number;
    /** BIC */
    bic: number;
    /** Theta parameters (variance component parameterization) */
    theta: number[];
    /** Standard errors of theta */
    thetaSe?: number[];
    /** Number of outer iterations */
    outerIterations: number;
    /** Whether optimization converged */
    converged: boolean;
    /** Convergence message */
    convergenceMessage: string;
    /** Formula used */
    formula: string;
    /** Fit summary statistics */
    fitSummary: GlmmFitSummary;
    /** Raw GLM result for fixed effects */
    glmResult: {
        coefficients: number[];
        standardErrors: number[];
        modelMatrixColumnNames: string[];
        deviance: number;
        fittedValues: number[];
        linearPredictors: number[];
    };
}
/**
 * GLMM class with methods for fitted model
 */
declare class GLMM<Row extends Record<string, number | string>> {
    private result;
    private _formula;
    private _randomEffects;
    private familyName;
    private linkName;
    private data;
    constructor({ result, formula, randomEffects, family, link, data, }: {
        result: GlmmFitResult;
        formula: string;
        randomEffects: RandomEffectSpec[];
        family: string;
        link: string;
        data: DataFrame<Row>;
    });
    /** Fixed effect coefficients */
    get coefficients(): number[];
    /** Fixed effect standard errors */
    get std_errors(): number[];
    /** Coefficient names */
    get coefficient_names(): string[];
    /** Variance components */
    get variance_components(): VarianceComponent[];
    /** Random effect BLUPs */
    get blups(): RandomEffectEstimates[];
    /** Log-likelihood */
    get loglik(): number;
    /** AIC */
    get aic(): number;
    /** BIC */
    get bic(): number;
    /** Convergence status */
    get converged(): boolean;
    /** Number of outer iterations */
    get iterations(): number;
    /** Model formula */
    get formula(): string;
    /** Random effects specification */
    get randomEffects(): RandomEffectSpec[];
    /** Fit summary */
    get summary(): GlmmFitSummary;
    /**
     * Get the variance for a specific random effect grouping factor
     * @param groupName - Name of the grouping variable
     */
    getVariance(groupName: string): VarianceComponent | undefined;
    /**
     * Get the BLUPs for a specific grouping factor
     * @param groupName - Name of the grouping variable
     */
    getBlups(groupName: string): RandomEffectEstimates | undefined;
    /**
     * Get the raw result object
     */
    getRawResult(): GlmmFitResult;
    /**
     * Print a formatted summary of the model
     */
    print(): void;
}
/**
 * Fit a Generalized Linear Mixed Model
 *
 * @param formula - Fixed effects formula (e.g., "y ~ x1 + x2")
 * @param randomEffects - Array of random effect specifications
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - DataFrame containing the data
 * @param options - Optional control parameters
 * @returns GLMM model instance
 *
 * @example
 * ```typescript
 * import { glmm, createDataFrame } from "@tidy-ts/dataframe";
 *
 * const data = createDataFrame({
 *   columns: {
 *     y: [1.2, 2.3, 1.5, 2.8, ...],
 *     x: [0, 1, 0, 1, ...],
 *     group: [1, 1, 2, 2, ...],
 *   },
 * });
 *
 * const model = glmm({
 *   formula: "y ~ x",
 *   randomEffects: [{ groupingVar: "group", terms: ["1"] }],
 *   family: "gaussian",
 *   link: "identity",
 *   data,
 * });
 *
 * console.log(model.coefficients);
 * console.log(model.variance_components);
 * model.print();
 * ```
 */
export declare function glmm<Row extends Record<string, number | string>>({ formula, randomEffects, family, link, data, options, }: {
    formula: string;
    randomEffects: RandomEffectSpec[];
    family: GlmmFamily;
    link: GlmmLink;
    data: DataFrame<Row>;
    options?: GlmmControl;
}): GLMM<Row>;
/**
 * Low-level GLMM fitting function that returns raw result object
 *
 * @param formula - Fixed effects formula
 * @param randomEffects - Random effect specifications
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - Data object with column names as keys
 * @param options - Optional control parameters
 * @returns Raw GLMM fit result
 */
export declare function glmmFit(formula: string, randomEffects: RandomEffectSpec[], family: GlmmFamily, link: GlmmLink, data: Record<string, number[]>, options?: GlmmControl): GlmmFitResult;
export {};
