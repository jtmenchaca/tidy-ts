/**
 * Exploring how Prettify and related utility types behave
 * with concrete vs generic type parameters in tooltips.
 */

import type { DataFrame } from "@tidy-ts/dataframe";

type Row = { id: string; value: number };

// ─── Prettify<T> = { [Key in keyof T]: T[Key] } & {} ───

// 1. Prettify on concrete Pick — does Pick alone already flatten?
type A_Pick = Pick<Row, "id">;
type A_Prettify = { [K in keyof Pick<Row, "id">]: Pick<Row, "id">[K] } & {};
const _a1: A_Pick = null!;
const _a2: A_Prettify = null!;

// 2. Prettify on concrete Omit & intersection (the mutate case)
type B_Raw = Omit<Row, "doubled" & keyof Row> & { doubled: number };
type B_Prettify = { [K in keyof B_Raw]: B_Raw[K] } & {};
const _b1: B_Raw = null!;
const _b2: B_Prettify = null!;

// 3. Generic T — how does each form look?
function generic_pick<T extends Row>(df: DataFrame<T>) {
  const pick: Pick<T, "id"> = null!;
  const prettify_pick: { [K in keyof Pick<T, "id">]: Pick<T, "id">[K] } & {} = null!;
  return { pick, prettify_pick };
}

function generic_omit_intersect<T extends Row>() {
  const raw: Omit<T, "doubled" & keyof T> & { doubled: number } = null!;
  const prettified: { [K in keyof (Omit<T, "doubled" & keyof T> & { doubled: number })]: (Omit<T, "doubled" & keyof T> & { doubled: number })[K] } & {} = null!;
  return { raw, prettified };
}

// 4. What about just T itself?
function generic_passthrough<T extends Row>() {
  const plain: T = null!;
  const prettified: { [K in keyof T]: T[K] } & {} = null!;
  return { plain, prettified };
}

// 5. What about T & {} (simpler "prettify")?
function generic_ampersand_empty<T extends Row>() {
  // deno-lint-ignore ban-types
  const result: T & {} = null!;
  return result;
}

// 6. Does Omit<T, never> simplify to T?
function generic_omit_never<T extends Row>() {
  const result: Omit<T, never> = null!;
  return result;
}

// 7. Single mapped type for mutate (no intersection, no Prettify)
function generic_single_mapped<T extends Row>() {
  const result: {
    [K in keyof T | "doubled"]: K extends "doubled" ? number : K extends keyof T ? T[K] : never;
  } = null!;
  return result;
}

// Suppress unused
void _a1; void _a2; void _b1; void _b2;
void generic_pick; void generic_omit_intersect;
void generic_passthrough; void generic_ampersand_empty;
void generic_omit_never; void generic_single_mapped;
