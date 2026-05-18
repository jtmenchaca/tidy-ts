export interface EffectSize {
    value: number;
    name: string;
}
export interface ConfidenceInterval {
    lower: number;
    upper: number;
    confidenceLevel: number;
}
export interface TestStatistic {
    value: number;
    name: string;
}
export interface OneWayAnovaTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    dfBetween: number;
    dfWithin: number;
    rSquared: number;
    adjustedRSquared: number;
    sampleSize: number;
    sampleMeans: number[];
    sampleStdDevs: number[];
    sumOfSquares: number[];
    alpha: number;
    errorMessage: string | null;
}
export interface WelchAnovaTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    df1: number;
    df2: number;
    rSquared: number;
    adjustedRSquared: number;
    sampleSize: number;
    sampleMeans: number[];
    sampleStdDevs: number[];
    alpha: number;
    errorMessage: string | null;
}
export interface AnovaTableComponent {
    component: string;
    ss: number;
    df: number;
    ms: number | null;
    fStatistic: number | null;
    pValue: number | null;
    etaSquared: number | null;
    partialEtaSquared: number | null;
    omegaSquared: number | null;
}
export interface AnovaTestComponent {
    testStatistic: TestStatistic;
    pValue: number;
    degreesOfFreedom: number;
    effectSize: EffectSize;
    meanSquare: number;
    sumOfSquares: number;
}
export interface TwoWayAnovaTestResult {
    testName: string;
    factorA: AnovaTestComponent;
    factorB: AnovaTestComponent;
    interaction: AnovaTestComponent;
    rSquared: number;
    sampleSize: number;
    sampleMeans: number[];
    sampleStdDevs: number[];
    sumOfSquares: number[];
    grandMean: number;
    anovaTable: AnovaTableComponent[];
    dfError: number;
    msError: number;
    dfTotal: number;
    alpha: number;
    errorMessage: string | null;
}
export interface ChiSquareIndependenceTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    degreesOfFreedom: number;
    sampleSize: number;
    phiCoefficient: number;
    chiSquareExpected: number[];
    residuals: number[];
    alpha: number;
    errorMessage: string | null;
}
export interface ChiSquareGoodnessOfFitTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    degreesOfFreedom: number;
    sampleSize: number;
    chiSquareExpected: number[];
    alpha: number;
    errorMessage: string | null;
}
export interface ChiSquareVarianceTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    degreesOfFreedom: number;
    sampleSize: number;
    confidenceInterval: ConfidenceInterval;
    alpha: number;
    errorMessage: string | null;
}
export interface MannWhitneyTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    method: string;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface WilcoxonSignedRankTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    method: string;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface KruskalWallisTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    degreesOfFreedom: number;
    sampleSize: number;
    alpha: number;
    errorMessage: string | null;
}
export interface PearsonCorrelationTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    degreesOfFreedom: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface SpearmanCorrelationTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    degreesOfFreedom: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface KendallCorrelationTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface OneSampleTTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    degreesOfFreedom: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface TwoSampleTTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    degreesOfFreedom: number;
    meanDifference: number;
    standardError: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface PairedTTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    degreesOfFreedom: number;
    meanDifference: number;
    standardError: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface OneSampleZTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface TwoSampleZTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    meanDifference: number;
    standardError: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface OneSampleProportionTestResult {
    testName: string;
    pValue: number;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    sampleProportion: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface TwoSampleProportionTestResult {
    testName: string;
    pValue: number;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    proportionDifference: number;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface ShapiroWilkTestResult {
    testName: string;
    pValue: number;
    testStatistic: TestStatistic;
    sampleSize: number;
    alpha: number;
    errorMessage: string | null;
}
export interface AndersonDarlingTestResult {
    testName: string;
    pValue: number;
    testStatistic: TestStatistic;
    sampleSize: number;
    alpha: number;
    errorMessage: string | null;
}
export interface DAgostinoPearsonTestResult {
    testName: string;
    pValue: number;
    testStatistic: TestStatistic;
    sampleSize: number;
    skewness: number;
    kurtosis: number;
    alpha: number;
    errorMessage: string | null;
}
export interface FishersExactTestResult {
    testName: string;
    pValue: number;
    effectSize: EffectSize;
    testStatistic: TestStatistic;
    confidenceInterval: ConfidenceInterval;
    method: string;
    methodType: string;
    midPValue: number | null;
    alternative: string;
    alpha: number;
    errorMessage: string | null;
}
export interface KolmogorovSmirnovTestResult {
    testName: string;
    pValue: number;
    testStatistic: TestStatistic;
    sample1Size: number;
    sample2Size: number;
    criticalValue: number;
    dStatistic: number;
    dPlus: number;
    dMinus: number;
    alternative: string;
    alpha: number;
}
export interface PairwiseComparison {
    group1: string;
    group2: string;
    meanDifference: number;
    standardError: number;
    testStatistic: TestStatistic;
    pValue: number;
    confidenceInterval: ConfidenceInterval;
    significant: boolean;
    adjustedPValue: number;
}
export interface TukeyHsdTestResult {
    testName: string;
    pValue: number;
    testStatistic: TestStatistic;
    nGroups: number;
    nTotal: number;
    comparisons: PairwiseComparison[];
    correctionMethod: string;
    note: string | null;
    alpha: number;
    errorMessage: string | null;
}
export interface GamesHowellTestResult {
    testStatistic: TestStatistic;
    pValue: number;
    testName: string;
    alpha: number;
    errorMessage: string | null;
    note: string | null;
    correctionMethod: string;
    nGroups: number;
    nTotal: number;
    comparisons: PairwiseComparison[];
}
export interface DunnTestResult {
    testStatistic: TestStatistic;
    pValue: number;
    testName: string;
    alpha: number;
    errorMessage: string | null;
    note: string | null;
    correctionMethod: string;
    nGroups: number;
    nTotal: number;
    comparisons: PairwiseComparison[];
}
