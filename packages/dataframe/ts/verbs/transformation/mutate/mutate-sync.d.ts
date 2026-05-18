/**
 * Synchronous mutate implementation using copy-on-write columns
 *
 * NOTE: This is an internal implementation file called via `(verb as any)(...a)(df)`
 * from resolve-verb.ts. Generics here only waste tsc time — the typed API lives
 * in mutate.types.ts.
 */
export declare function mutateSyncImpl(df: any, spec: any): any;
