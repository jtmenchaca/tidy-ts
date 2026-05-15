// Unified suffix-aware join type — fully inlined, no intermediate helper types.
//
// Structure: mapped type (suffix columns) & intersection overlay (generic indexability) & {}
// - Mapped type: computes correct _x/_y or custom suffix columns for concrete types
// - Intersection overlay: L & Omit<R,K> etc. lets TS index when L is generic T
// - `& {}`: forces TS to drop alias names and expand in hover
// -----------------------------------------------------------------------------

export type SuffixAwareJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R = keyof L & keyof R,
  // deno-lint-ignore ban-types
  Options = {},
  LReq extends boolean = true,
  RReq extends boolean = true,
> =
  // ── HasDefinedSuffixes ────────────────────────────────────────────────
  (
    Options extends { suffixes: infer S }
      ? S extends { left: string } | { right: string } ? true : false
      : false
  ) extends true

  // ══════════════════════════════════════════════════════════════════════
  // CUSTOM SUFFIXES PATH
  // ══════════════════════════════════════════════════════════════════════
  ? (
    // Bind ResolvedK
    (
      Options extends { keys: infer _K }
        ? (
          Options extends { keys: infer Keys }
            ? Keys extends readonly (infer KK)[]
              ? KK extends string ? KK : never
              : Keys extends { left: infer LL; right: infer _RR }
                ? LL extends readonly (infer LK)[]
                  ? LK extends string ? LK : never
                  : LL extends string ? LL : never
                : never
            : never
        )
        : K extends string ? K : never
    ) extends infer ResolvedKeys ?
    // Bind JK
    (ResolvedKeys extends keyof L & keyof R ? ResolvedKeys : never) extends infer JK ?
    // Bind CC
    (Exclude<Extract<keyof L, string> & Extract<keyof R, string>, JK extends string ? JK : never>) extends infer CC ?
    // Bind LS
    (Options extends { suffixes: infer S }
      ? S extends { left: infer SL } ? SL extends string ? SL : "" : ""
      : ""
    ) extends infer LS ?
    // Bind RS
    (Options extends { suffixes: infer S2 }
      ? S2 extends { right: infer SR } ? SR extends string ? SR : "" : ""
      : ""
    ) extends infer RS ?

    // ── Mapped type for custom suffixes ──────────────────────────────
    & {
      [Out in
        | (JK extends keyof L ? JK : never)
        | Exclude<keyof L, (JK extends keyof L ? JK : never) | (CC extends string ? CC : never)>
        | `${CC extends string ? CC : never}${LS extends string ? LS : ""}`
        | Exclude<keyof R, Extract<keyof L, string> | (JK extends keyof R ? JK : never)>
        | `${CC extends string ? CC : never}${RS extends string ? RS : ""}`
      ]:
        Out extends JK
          ? L[(Out extends keyof L ? Out : never)]
        // Try left-suffix match
        : LS extends string
          ? Out extends `${infer Base}${LS & string}`
            ? Base extends CC
              ? Base extends keyof L
                ? LReq extends true ? L[Base] : L[Base] | undefined
              : never
            // Base isn't a conflict → try right suffix
            : RS extends string
              ? Out extends `${infer Base2}${RS & string}`
                ? Base2 extends CC
                  ? Base2 extends keyof R
                    ? RReq extends true ? R[Base2] : R[Base2] | undefined
                  : never
                : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
                  : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
                  : never
              : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
                : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
                : never
            : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
              : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
              : never
          // LS didn't match → try RS
          : RS extends string
            ? Out extends `${infer Base2}${RS & string}`
              ? Base2 extends CC
                ? Base2 extends keyof R
                  ? RReq extends true ? R[Base2] : R[Base2] | undefined
                : never
              : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
                : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
                : never
            : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
              : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
              : never
          : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
            : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
            : never
        // No LS → try RS directly
        : RS extends string
          ? Out extends `${infer Base2}${RS & string}`
            ? Base2 extends CC
              ? Base2 extends keyof R
                ? RReq extends true ? R[Base2] : R[Base2] | undefined
              : never
            : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
              : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
              : never
          : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
            : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
            : never
        : Out extends keyof L ? LReq extends true ? L[Out] : L[Out] | undefined
          : Out extends keyof R ? RReq extends true ? R[Out] : R[Out] | undefined
          : never;
    }
    // ── Intersection overlay for generic indexability ─────────────────
    & (LReq extends true
      ? RReq extends true
        ? L & { [P in keyof R as P extends (JK extends keyof L & keyof R ? JK : never) ? never : P]: R[P] }
        : L & { [P in keyof R as P extends (JK extends keyof L & keyof R ? JK : never) ? never : P]-?: R[P] | undefined }
      : RReq extends true
        ? { [P in keyof L]-?: L[P] | undefined } & R
        : L & { [P in keyof R]-?: R[P] | undefined })
    // deno-lint-ignore ban-types
    & {}

    : never // RS
    : never // LS
    : never // CC
    : never // JK
    : never // ResolvedKeys
  )

  // ══════════════════════════════════════════════════════════════════════
  // DEFAULT _x / _y PATH
  // ══════════════════════════════════════════════════════════════════════
  : (
    // Bind RK (resolved join keys)
    (
      Options extends { keys: infer _K }
        ? (
          Options extends { keys: infer Keys }
            ? Keys extends readonly (infer KK)[]
              ? KK extends string ? KK : never
              : Keys extends { left: infer LL; right: infer _RR }
                ? LL extends readonly (infer LK)[]
                  ? LK extends string ? LK : never
                  : LL extends string ? LL : never
                : never
            : never
        ) extends infer T
          ? T extends keyof L & keyof R ? T : never
          : never
        : K
    ) extends infer RK ?

    // Bind CC (conflicting columns)
    (Exclude<Extract<keyof L, string> & Extract<keyof R, string>, RK extends string ? RK : never>) extends infer CC ?

    // ── Mapped type for default _x/_y suffixes ──────────────────────
    & {
      [Out in
        | (RK extends keyof L ? RK : never)
        | Exclude<keyof L, (RK extends keyof L ? RK : never) | (CC extends string ? CC : never)>
        | `${CC extends string ? CC : never}_x`
        | Exclude<keyof R, Extract<keyof L, string> | (RK extends keyof R ? RK : never)>
        | `${CC extends string ? CC : never}_y`
      ]:
        Out extends RK
          ? L[(Out extends keyof L ? Out : never)]
        : Out extends `${infer Base}_x`
          ? Base extends keyof L
            ? LReq extends true ? L[Base] : L[Base] | undefined
          : never
        : Out extends `${infer Base}_y`
          ? Base extends keyof R
            ? RReq extends true ? R[Base] : R[Base] | undefined
          : never
        : Out extends keyof L
          ? LReq extends true ? L[Out] : L[Out] | undefined
        : Out extends keyof R
          ? RReq extends true ? R[Out] : R[Out] | undefined
        : never;
    }
    // ── Intersection overlay for generic indexability ─────────────────
    & (LReq extends true
      ? RReq extends true
        ? L & { [P in keyof R as P extends K ? never : P]: R[P] }
        : L & { [P in keyof R as P extends K ? never : P]-?: R[P] | undefined }
      : RReq extends true
        ? { [P in keyof L]-?: L[P] | undefined } & R
        : L & { [P in keyof R]-?: R[P] | undefined })
    // deno-lint-ignore ban-types
    & {}

    : never // CC
    : never // RK
  );
