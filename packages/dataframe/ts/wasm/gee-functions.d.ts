export type GeeCorstr = "independence" | "exchangeable" | "ar1" | "unstructured" | "userdefined" | "fixed";
export interface GeeglmFitOptions {
    epsilon?: number;
    maxIter?: number;
    trace?: boolean;
}
export interface GeeglmResult {
    coefficients: number[];
    residuals: number[];
    fittedValues: number[];
    clusterInfo: {
        nClusters: number;
        maxClusterSize: number;
    };
    correlationStructure: string;
    stdErr: string;
    vcov?: number[][] | null;
}
