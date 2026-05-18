export interface CSVOptions {
    comma?: string;
    quote?: string;
    skipEmptyLines?: boolean;
}
/** Splits a CSV string into rows of cells without any 3rd-party libs */
export declare function parseCSV(input: string, { comma, quote, skipEmptyLines, }?: CSVOptions): string[][];
