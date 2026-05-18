import type { DataFrame } from "../dataframe/index.ts";
/**
 * GLM family information interface
 */
export interface GlmFamilyInfo {
    family: string;
    link: string;
    linkfun?: string;
    linkinv?: string;
    variance?: string;
    devResids?: string;
    aic?: string;
    muEta?: string;
    initialize?: string;
    validmu?: string;
    valideta?: string;
}
/**
 * QR decomposition interface
 */
export interface QrDecomposition {
    qr: number[][];
    rank: number;
    qraux: number[];
    pivot: number[];
    tol: number;
}
export interface ModelMatrix {
    matrix: number[];
    nRows: number;
    nCols: number;
    columnNames: string[];
    termAssignments: number[];
    rowNames?: string[] | null;
}
/**
 * Model frame interface
 */
export interface ModelFrame {
    y: number[];
    predictors: Record<string, number[]>;
    factors: Record<string, string[]>;
}
/**
 * Terms object interface
 */
export interface TermsObject {
    variables: string[];
    factors: string[];
    termLabels: string[];
    order: number[];
    intercept: number;
    response: number;
    dataClasses: Record<string, string>;
}
/**
 * GLM control interface
 */
export interface GlmControl {
    epsilon: number;
    maxIter: number;
    trace: boolean;
}
/**
 * Comprehensive GLM fit result interface
 * Matches the Rust GlmResult structure with all 50+ fields
 */
export interface GlmFitResult {
    coefficients: number[];
    residuals: number[];
    fittedValues: number[];
    effects: number[];
    workingResiduals: number[];
    responseResiduals: number[];
    pearsonResiduals: number[];
    r: number[][];
    rank: number;
    qr: QrDecomposition;
    family: GlmFamilyInfo;
    linearPredictors: number[];
    deviance: number;
    aic: number;
    nullDeviance: number;
    iter: number;
    weights: number[];
    priorWeights: number[];
    dfResidual: number;
    dfNull: number;
    y: number[];
    converged: number;
    boundary: number;
    model: ModelFrame;
    call: string;
    formula: string;
    terms: TermsObject;
    data: string;
    x?: ModelMatrix;
    offset?: number[];
    control: GlmControl;
    method: string;
    contrasts: Record<string, string>;
    xlevels: Record<string, string[]>;
    modelMatrix: number[][];
    modelMatrixDimensions: [number, number];
    modelMatrixColumnNames: string[];
    residualStandardError: number;
    rSquared: number;
    adjustedRSquared: number;
    devianceExplainedPercent: number;
    fStatistic: number;
    fPValue: number;
    nObservations: number;
    responseVariableName: string;
    predictorVariableNames: string[];
    factorLevels: Record<string, string[]>;
    referenceLevels: Record<string, string>;
    dispersionParameter: number;
    devianceResiduals: number[];
    covarianceMatrix: number[][];
    standardErrors: number[];
    tStatistics: number[];
    pValues: number[];
    leverage: number[];
    cooksDistance: number[];
    qrRank: number;
    pivot: number[];
    tol: number;
    pivoted: number;
    naAction?: string;
    dispersion: number;
    confintLower: number[];
    confintUpper: number[];
}
/**
 * GLM family options
 */
export type GlmFamily = "gaussian" | "binomial" | "quasibinomial" | "poisson" | "gamma" | "inverse_gaussian" | "quasipoisson";
/**
 * GLM link options
 */
export type GlmLink = "identity" | "logit" | "probit" | "cauchit" | "log" | "cloglog" | "inverse" | "sqrt" | "inverse_squared";
/**
 * GLM options
 */
export interface GlmOptions {
    weights?: number[];
    naAction?: string;
    epsilon?: number;
    maxIter?: number;
    trace?: boolean;
}
/**
 * Fit a GLM model using WASM (internal function for testing)
 *
 * Note: This is the low-level function that returns raw GlmFitResult.
 * For the main API, use glm() which returns a GLM class instance with methods.
 *
 * @param formula - Model formula (e.g., "y ~ x1 + x2")
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - Data object with column names as keys
 * @param options - Optional GLM parameters
 * @returns GLM fit result (raw object)
 */
export declare function glmFit(formula: string, family: GlmFamily, link: GlmLink, data: Record<string, number[]>, options?: GlmOptions): GlmFitResult;
declare class GLM<Row extends Record<string, number>> {
    private result;
    private _wasmSafeResult;
    private formula;
    private familyName;
    private linkName;
    private data;
    constructor({ result, formula, family, link, data, }: {
        result: GlmFitResult;
        formula: string;
        family: string;
        link: string;
        data: DataFrame<Row>;
    });
    /**
     * Get a JSON-serialized version of the result for passing back to WASM/NAPI
     * functions that need to deserialize it. The raw WASM result object has
     * circular references in the `family` field that prevent JSON.stringify,
     * so we use a replacer to handle circulars and replace family with a clean object.
     */
    private get resultJson();
    get coefficients(): number[];
    get fitted_values(): number[];
    get linear_predictors(): number[];
    get deviance(): number;
    get aic(): number;
    get null_deviance(): number;
    get df_residual(): number;
    get df_null(): number;
    get converged(): boolean;
    get iter(): number;
    get family(): GlmFamilyInfo;
    get weights(): number[] | undefined;
    get prior_weights(): number[] | undefined;
    get rank(): number;
    get leverage(): number[];
    get cooks_distance(): number[];
    get standard_errors(): number[];
    get std_errors(): number[];
    get p_values(): number[];
    get t_statistics(): number[];
    get covariance_matrix(): number[][];
    get r(): number[][];
    get residual_standard_error(): number;
    get r_squared(): number;
    get adjusted_r_squared(): number;
    get dispersion_parameter(): number;
    get model_matrix_dimensions(): [number, number];
    get model_matrix_column_names(): string[];
    /**
     * Get variance-covariance matrix of the parameters
     *
     * Returns the covariance matrix of the estimated coefficients.
     * For GLM, this is the scaled covariance matrix (cov.scaled in R).
     *
     * @returns Variance-covariance matrix as 2D array
     */
    vcov(): number[][];
    /**
     * Extract different types of residuals
     *
     * @param type - Type of residuals to extract:
     *   - "deviance": Deviance residuals (default)
     *   - "pearson": Pearson residuals
     *   - "working": Working residuals
     *   - "response": Response residuals (y - fitted)
     * @returns Array of residuals
     */
    residuals({ type, }?: {
        type?: "deviance" | "pearson" | "working" | "response";
    }): number[];
    /**
     * Get model summary with coefficient table
     *
     * Returns formatted summary with coefficients, standard errors, z/t-values, and p-values
     *
     * @returns Summary object with coefficient table and model statistics
     */
    summary(): {
        coefficients: {
            estimate: number[];
            std_error: number[];
            statistic: number[];
            p_value: number[];
            names: string[];
        };
        dispersion: number;
        null_deviance: number;
        residual_deviance: number;
        df_null: number;
        df_residual: number;
        aic: number;
        family: string;
        link: string;
    };
    /**
     * Compute standardized residuals
     *
     * @param type - Type of residuals: "deviance" (default) or "pearson"
     * @returns Standardized residuals
     */
    rstandard({ type }?: {
        type?: "deviance" | "pearson";
    }): number[];
    /**
     * Compute studentized residuals (leave-one-out)
     *
     * @returns Studentized residuals
     */
    rstudent(): number[];
    /**
     * Compute influence measures
     *
     * Returns dfbeta, dfbetas, dffits, covratio, cook.d, and hat values
     *
     * @returns Object with influence measures
     */
    influence(): {
        dfbeta: number[][];
        dfbetas: number[][];
        dffits: number[];
        covratio: number[];
        cooksDistance: number[];
        hat: number[];
    };
    /**
     * Analysis of deviance table (single model)
     *
     * NOTE: This is a placeholder implementation. Full sequential analysis of deviance
     * requires refitting the model multiple times with different subsets of predictors,
     * which is not yet implemented. This would require exposing the GLM fitting algorithm
     * to TypeScript and managing the original data and formula.
     *
     * For now, this returns the null and full model deviances only.
     *
     * @returns Deviance table with null and full model statistics only
     */
    anova(): {
        terms: string[];
        df: number[];
        deviance: number[];
        residual_df: number[];
        residual_deviance: number[];
    };
    /**
     * Compute confidence intervals for coefficients
     *
     * @param level - Confidence level (default: 0.95 for 95% CI)
     * @returns Object with names, lower, and upper bounds
     */
    confint({ level }?: {
        level?: number;
    }): {
        names: string[];
        lower: number[];
        upper: number[];
    };
    /**
     * Make predictions on new data
     *
     * @param newdata - DataFrame with same predictor columns as training data
     * @param options - Prediction options
     * @returns Array of predictions
     */
    predict<NewRow extends Record<string, unknown> = Row>(newdata?: DataFrame<NewRow>, options?: {
        type?: "link" | "response";
    }): number[];
    /**
     * Get the raw result object (for advanced users or debugging)
     */
    getRawResult(): GlmFitResult;
}
/**
 * Fit a GLM model with DataFrame (primary API)
 *
 * Returns a GLM class instance with methods for prediction and diagnostics.
 * For low-level access to raw results, use glmFit() instead.
 *
 * @param formula - Model formula (e.g., "y ~ x1 + x2")
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - DataFrame containing the data
 * @param options - Optional GLM parameters
 * @returns GLM model instance with predict() and other methods
 */
export declare function glm<Row extends Record<string, number>>({ formula, family, link, data, options, }: {
    formula: string;
    family: GlmFamily;
    link: "identity" | "logit" | "probit" | "cauchit" | "log" | "cloglog" | "inverse" | "sqrt" | "inverse_squared";
    data: DataFrame<Row>;
    options?: {
        weights?: number[];
        naAction?: string;
        epsilon?: number;
        maxIter?: number;
        trace?: boolean;
    };
}): GLM<Row>;
/**
 * Result from vcovCL — clustered robust covariance matrix
 */
export interface VcovCLResult {
    /** The robust variance-covariance matrix (p × p) */
    matrix: number[][];
    /** Coefficient names */
    names: string[];
    /** Type of HC correction applied */
    type: string;
    /** Number of clusters */
    nClusters: number;
}
/**
 * Compute clustered robust covariance matrix for a GLM (sandwich::vcovCL).
 *
 * Implements the sandwich estimator: vcov = (1/n) × bread × meat × bread
 * where bread = n × (X'WX)^{-1} × dispersion and meat is the
 * cluster-aggregated outer product of score contributions.
 *
 * @param result - A fitted GlmFitResult (from glmFit or glm().result)
 * @param cluster - Integer cluster IDs, one per observation
 * @param type - HC correction type: "HC0" (default), "HC1", "HC2", or "HC3"
 * @param cadjust - Apply cluster adjustment g/(g-1), default true
 * @param fix - Fix non-positive-definite result, default false
 * @returns VcovCLResult with the robust covariance matrix
 */
export declare function vcovCL({ result, cluster, type, cadjust, fix, }: {
    result: GlmFitResult;
    cluster: number[];
    type?: "HC0" | "HC1" | "HC2" | "HC3";
    cadjust?: boolean;
    fix?: boolean;
}): VcovCLResult;
export {};
