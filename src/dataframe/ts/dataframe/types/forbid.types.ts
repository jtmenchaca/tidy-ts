// src/dataframe/ts/core/forbid-helpers.ts

/** Block disallowed array API from leaking on DataFrame via proxy */
export type Forbid<Key extends PropertyKey> = { [PropertyName in Key]?: never };

/** Standard array methods that should be forbidden on DataFrame */
export type ForbiddenArrayMethods =
  | "map"
  | "reduce"
  | "concat"
  | "find"
  | "some"
  | "every"
  | "flat"
  | "flatMap"
  | "push"
  | "pop"
  | "shift"
  | "unshift"
  | "splice"
  | "reverse"
  | "includes"
  | "indexOf"
  | "lastIndexOf"
  | "join"
  | "entries"
  | "keys"
  | "toLocaleString"
  | "valueOf"
  | "copyWithin"
  | "fill";
