type StrKey = string;
type ConflictingColumns<L extends object, R extends object, K extends StrKey> = Exclude<Extract<keyof L, StrKey> & Extract<keyof R, StrKey>, K>;
type ExtractJoinKeys<Options> = Options extends {
    keys: infer Keys;
} ? Keys extends readonly (infer K)[] ? Extract<K, StrKey> : Keys extends {
    left: infer L;
    right: infer _R;
} ? L extends readonly (infer LK)[] ? Extract<LK, StrKey> : Extract<L, StrKey> : never : never;
type ExtractSuffixes<Options> = Options extends {
    suffixes: infer S;
} ? (S extends {
    left: infer SL;
    right: infer SR;
} ? {
    left: Extract<SL, string>;
    right: Extract<SR, string>;
} : S extends {
    left: infer SL;
} ? {
    left: Extract<SL, string>;
    right: undefined;
} : S extends {
    right: infer SR;
} ? {
    left: undefined;
    right: Extract<SR, string>;
} : {
    left: undefined;
    right: undefined;
}) : {
    left: undefined;
    right: undefined;
};
type HasDefinedSuffixes<Options> = Options extends {
    suffixes: infer S;
} ? S extends {
    left: string;
} | {
    right: string;
} ? true : false : false;
/**
 * Second-stage lookup for custom suffixes: tries R-suffix match, then plain
 * L/R non-conflicting columns.
 */
type SecondaryLookup<L extends object, R extends object, K extends StrKey, S extends {
    left?: string;
    right?: string;
}, LReq extends boolean, RReq extends boolean, Out> = S["right"] extends string ? Out extends `${infer Base}${S["right"]}` ? Base extends ConflictingColumns<L, R, K> ? Base extends keyof R ? RReq extends true ? R[Base] : R[Base] | undefined : never : PlainLookup<L, R, LReq, RReq, Out> : PlainLookup<L, R, LReq, RReq, Out> : PlainLookup<L, R, LReq, RReq, Out>;
/** Plain L or R non-conflicting column lookup. */
type PlainLookup<L extends object, R extends object, LReq extends boolean, RReq extends boolean, Out> = Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined : never;
type ResolveJoinKeys<L extends object, R extends object, K extends keyof L & keyof R, Options> = Options extends {
    keys: infer _K;
} ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R> : Extract<K, StrKey>;
type SuffixAwareJoinResult<L extends object, R extends object, K extends keyof L & keyof R = keyof L & keyof R, Options = {}, LReq extends boolean = true, RReq extends boolean = true> = HasDefinedSuffixes<Options> extends true ? {
    [Out in Extract<keyof L, ResolveJoinKeys<L, R, K, Options>> | Exclude<keyof L, ConflictingColumns<L, R, ResolveJoinKeys<L, R, K, Options>>> | `${Extract<ConflictingColumns<L, R, ResolveJoinKeys<L, R, K, Options>>, StrKey>}${ExtractSuffixes<Options>["left"] extends string ? ExtractSuffixes<Options>["left"] : ""}` | Exclude<keyof R, Extract<keyof L, StrKey> | ResolveJoinKeys<L, R, K, Options>> | `${Extract<ConflictingColumns<L, R, ResolveJoinKeys<L, R, K, Options>>, StrKey>}${ExtractSuffixes<Options>["right"] extends string ? ExtractSuffixes<Options>["right"] : ""}`]: Out extends ResolveJoinKeys<L, R, K, Options> ? L[Extract<Out, keyof L>] : ExtractSuffixes<Options>["left"] extends string ? Out extends `${infer Base}${ExtractSuffixes<Options>["left"]}` ? Base extends ConflictingColumns<L, R, ResolveJoinKeys<L, R, K, Options>> ? Base extends keyof L ? LReq extends true ? L[Base] : L[Base] | undefined : never : SecondaryLookup<L, R, ResolveJoinKeys<L, R, K, Options>, ExtractSuffixes<Options>, LReq, RReq, Out> : SecondaryLookup<L, R, ResolveJoinKeys<L, R, K, Options>, ExtractSuffixes<Options>, LReq, RReq, Out> : SecondaryLookup<L, R, ResolveJoinKeys<L, R, K, Options>, ExtractSuffixes<Options>, LReq, RReq, Out>;
} : {
    [Out in ResolvedK<L, R, K, Options> | Exclude<keyof L, ResolvedK<L, R, K, Options> | ConflictingColumns<L, R, Extract<ResolvedK<L, R, K, Options>, StrKey>>> | `${Extract<ConflictingColumns<L, R, Extract<ResolvedK<L, R, K, Options>, StrKey>>, string>}_x` | Exclude<keyof R, ResolvedK<L, R, K, Options> | Extract<keyof L, StrKey>> | `${Extract<ConflictingColumns<L, R, Extract<ResolvedK<L, R, K, Options>, StrKey>>, string>}_y`]: Out extends ResolvedK<L, R, K, Options> ? L[Extract<Out, keyof L>] : Out extends `${infer Base}_x` ? Base extends keyof L ? LReq extends true ? L[Base] : L[Base] | undefined : never : Out extends `${infer Base}_y` ? Base extends keyof R ? RReq extends true ? R[Base] : R[Base] | undefined : never : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined : never;
};
/** Resolve K for the default _x/_y path: use Options.keys if present, else K */
type ResolvedK<L extends object, R extends object, K extends keyof L & keyof R, Options> = Options extends {
    keys: infer _K;
} ? Extract<ExtractJoinKeys<Options>, keyof L & keyof R> : K;
/** Inner: both sides required */
export type SuffixAwareInnerJoinResult<L extends object, R extends object, K extends keyof L & keyof R = keyof L & keyof R, Options = {}> = SuffixAwareJoinResult<L, R, K, Options, true, true>;
/** Left: left required, right optional */
export type SuffixAwareLeftJoinResult<L extends object, R extends object, K extends keyof L & keyof R = keyof L & keyof R, Options = {}> = SuffixAwareJoinResult<L, R, K, Options, true, false>;
/** Right: left optional, right required */
export type SuffixAwareRightJoinResult<L extends object, R extends object, K extends keyof L & keyof R = keyof L & keyof R, Options = {}> = SuffixAwareJoinResult<L, R, K, Options, false, true>;
/** Outer: both sides optional (keys still required) */
export type SuffixAwareOuterJoinResult<L extends object, R extends object, K extends keyof L & keyof R = keyof L & keyof R, Options = {}> = SuffixAwareJoinResult<L, R, K, Options, false, false>;
/** Asof: same semantics as left join */
export type SuffixAwareAsofJoinResult<L extends object, R extends object, K extends keyof L & keyof R = keyof L & keyof R, Options = {}> = SuffixAwareJoinResult<L, R, K, Options, true, false>;
export {};
