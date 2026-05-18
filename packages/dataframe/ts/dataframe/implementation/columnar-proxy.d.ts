import type { ColumnarStore } from "./columnar-store.ts";
/** Disabled array APIs to nudge users to tidy verbs */
export declare const ARRAY_METHODS: Set<string>;
type ColumnarProxyDeps = {
    api: any;
    store: ColumnarStore;
    unique: (xs: readonly unknown[]) => unknown[];
    arrayMethods: Set<string>;
};
/**
 * Build columnar-optimized Proxy handlers for DataFrame
 *
 * Key optimizations:
 * - Direct column access without row reconstruction
 * - Lazy row reconstruction only when needed
 * - Efficient numeric indexing
 */
export declare function buildColumnarProxyHandlers({ api, store, unique, arrayMethods }: ColumnarProxyDeps): ProxyHandler<object>;
export {};
