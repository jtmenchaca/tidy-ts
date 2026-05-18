export type DistributionDataConfig = {
    range?: [number, number];
    points?: number;
};
export declare function createDistributionData({ distribution, params, type, config, }: {
    distribution: {
        density: (params: any) => number;
        probability: (params: any) => number;
        quantile: (params: any) => number;
    };
    params: any;
    type: "pdf" | "cdf" | "inverse_cdf";
    config?: DistributionDataConfig;
}): any;
