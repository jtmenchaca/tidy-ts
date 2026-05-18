export declare class TidyError extends Error {
    readonly code?: string;
    constructor(message: string, code?: string);
}
export declare class DataFrameError extends TidyError {
    constructor(message: string, code?: string);
}
export declare class GroupedDataFrameError extends TidyError {
    constructor(message: string, code?: string);
}
export declare class VerbError extends TidyError {
    constructor(message: string, code?: string);
}
export declare class JoinError extends TidyError {
    constructor(message: string, code?: string);
}
/**
 * Issue a tidy-ts warning (like R's warning()).
 * Emits via console.warn so callers can intercept.
 */
export declare function tidyWarn(message: string): void;
/**
 * Throw a standardized "column not found" error.
 */
export declare function throwColumnNotFound(column: string, availableColumns: string[]): never;
/**
 * Validate that all requested columns exist, throwing if any are missing.
 */
export declare function validateColumnsExist(requested: string[], availableColumns: string[]): void;
