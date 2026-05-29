# Supplemental Table 2. Type Rules for Tidy-TS Operations

**Notation.**

- ρ — a generic row type (a set of named, typed columns)
- L, R — left and right row types in a join
- dom(ρ) — the set of column names in ρ
- ρ[c] — the type of column c in ρ
- k — a single column name; C, G, K — sets of column names (general / group keys / join keys)
- ρ[C] — ρ restricted to columns C ⊆ dom(ρ)
- ρ \ C — ρ with columns C removed
- T — the type of a value or function return (e.g. the return type of a mutate function, or the type of a replacement value)
- T | ⊥ — the type T with undefined added (field-level optionality)
- { ∀f ∈ ρ : f | ⊥ } — lift every field of a schema (here ρ, but any derived schema is allowed) to optional
- ρ₁ ∪ ρ₂ — schema union; defined when dom(ρ₁) ∩ dom(ρ₂) = ∅, or when the operation specifies a suffix rule for collisions

| Operation | Type rule | Plain language |
|---|---|---|
| **Schema preservation** | | Row type unchanged |
| filter | ρ → ρ | Keep rows matching a predicate |
| **Schema narrowing** | | Remove columns |
| select(C) | ρ → ρ[C] | Keep only columns C |
| drop(C) | ρ → ρ \ C | Remove columns C |
| distinct(C) | ρ → ρ[C] | Deduplicate, keep only columns C |
| **Schema extension** | | Add or replace columns |
| mutate({k: fn}), fn: (r: ρ) => T, k ∉ dom(ρ) | ρ → ρ ∪ { k: T } | Add column k with type T |
| mutate({k: fn}), fn: (r: ρ) => T, k ∈ dom(ρ) | ρ → (ρ \ {k}) ∪ { k: T } | Replace column k's type with T |
| rename({a: b}) | ρ → (ρ \ {a}) ∪ { b: ρ[a] } | Renames column a to b, preserves its type |
| **Schema replacement** | | Reshape into a new row type |
| summarise(S) | ρ → S | Only summary columns remain |
| groupBy(G).summarise(S) | ρ → ρ[G] ∪ S | Group keys + summary columns |
| **Joins** | | Combine two datasets on shared keys K |
| innerJoin(L, R, K) | L ∪ (R \ K) | All fields required |
| leftJoin(L, R, K) | L ∪ { ∀f ∈ R \ K : f \| ⊥ } | Right non-key fields may be undefined |
| rightJoin(L, R, K) | { ∀f ∈ L \ K : f \| ⊥ } ∪ R | Left non-key fields may be undefined |
| outerJoin(L, R, K) | L[K] ∪ { ∀f ∈ L \ K : f \| ⊥ } ∪ { ∀f ∈ R \ K : f \| ⊥ } | Both sides' non-key fields may be undefined |
| Collision handling | shared non-key columns get a suffix (default `_x` / `_y`) | Suffixed to disambiguate; the rules above assume disjoint non-key domains |
| **Missing value handling** | | Remove null or undefined from a column's type, optionally substituting a replacement |
| replaceNull({k: v}), v: T | ρ → (ρ \ {k}) ∪ { k: (ρ[k] \ null) ∪ T } | Substitute v for null; null is removed but T joins k's type |
| replaceUndefined({k: v}), v: T | ρ → (ρ \ {k}) ∪ { k: (ρ[k] \ ⊥) ∪ T } | Substitute v for undefined; ⊥ is removed but T joins k's type |
| removeNull(k) | ρ → (ρ \ {k}) ∪ { k: ρ[k] \ null } | Drop rows where k is null, narrow k's type |
| removeUndefined(k) | ρ → (ρ \ {k}) ∪ { k: ρ[k] \ ⊥ } | Drop rows where k is undefined, narrow k's type |
