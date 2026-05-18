/**
 * Process method call results for async contexts (with Promise chaining)
 * Common pattern in async method call handlers
 */
export declare function processAsyncMethodResult(result: unknown, isDataFrame: (x: unknown) => boolean, isGroupedDataFrame: (x: unknown) => boolean, chainFn: (df: any) => any, chainGroupedFn: (gdf: any) => any): any;
/**
 * Create a print method handler that returns the chain proxy
 * Common pattern in print method handlers
 */
export declare function createPrintMethodHandler(chainFn: (obj: any) => any): (prop: string | number | symbol, objOrPromise: any, promise: Promise<any>) => any;
/**
 * Create a writeCSV method handler that returns the chain proxy
 * Common pattern in writeCSV method handlers
 */
export declare function createWriteCSVMethodHandler(chainFn: (obj: any) => any): (prop: string | number | symbol, objOrPromise: any, promise: Promise<any>) => any;
/**
 * Create a numeric index handler
 * Common pattern for numeric property access
 */
export declare function createNumericIndexHandler(): (prop: string | number | symbol, objOrPromise: any, promise: Promise<any>) => any;
/**
 * Create a symbol property handler
 * Common pattern for symbol property access
 */
export declare function createSymbolPropertyHandler(): (prop: string | number | symbol, objOrPromise: any, promise: Promise<any>) => any;
/** Sync methods that should be accessible without await on thenable DataFrames */
export declare const SYNC_METHODS: string[];
/**
 * Create a sync methods handler for specific method names
 * Common pattern for internal properties and core methods
 */
export declare function createSyncMethodsHandler(syncMethods: string[]): (prop: string | number | symbol, objOrPromise: any, promise: Promise<any>) => any;
/**
 * Create a column access handler
 * Common pattern for checking if property is a column name
 */
export declare function createColumnAccessHandler(getColumns: (obj: any) => string[] | undefined): (prop: string | number | symbol, objOrPromise: any, promise: Promise<any>) => any;
/**
 * Create error message for missing properties
 * Common pattern for error handling
 */
export declare function createPropertyError(prop: string | number | symbol, type: string): Error;
