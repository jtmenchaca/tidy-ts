import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";
import type {
  MissingColumnDummyCol,
  ValidateColumnExists,
} from "../../dataframe/types/error-types.ts";

/**
 * Result row type after dummyCol expansion.
 * Single mapped type — flat in hover without Prettify.
 *
 * Keys:
 *   - if DropOriginal: (keyof Row minus ColName) | generated category columns
 *   - otherwise:        keyof Row | generated category columns
 */
type DummyColResult<
  Row extends object,
  ColName extends string,
  Categories extends readonly string[],
  Prefix extends string,
  Suffix extends string,
  DropOriginal extends boolean,
> = {
  [
    K in
      | (DropOriginal extends true ? Exclude<keyof Row, ColName> : keyof Row)
      | `${Prefix}${Categories[number]}${Suffix}`
  ]: K extends keyof Row ? Row[K]
    : K extends `${Prefix}${Categories[number]}${Suffix}` ? boolean
    : never;
};

export type DummyColMethod<Row extends object> = {
  // Grouped overloads (preserve groups)
  <
    R extends object,
    GroupName extends keyof R,
    ColName extends string,
    const Categories extends readonly string[],
    const Prefix extends string = "",
    const Suffix extends string = "",
    const DropOriginal extends boolean = true,
  >(
    this: GroupedDataFrame<R, GroupName>,
    column: ValidateColumnExists<R, ColName, MissingColumnDummyCol>,
    options: {
      expected_categories: Categories;
      prefix?: Prefix;
      suffix?: Suffix;
      drop_original?: DropOriginal;
      include_na?: boolean;
    },
  ): GroupedDataFrame<
    DummyColResult<R, ColName, Categories, Prefix, Suffix, DropOriginal>,
    Extract<
      GroupName,
      keyof DummyColResult<
        R,
        ColName,
        Categories,
        Prefix,
        Suffix,
        DropOriginal
      >
    >
  >;

  <R extends object, GroupName extends keyof R, ColName extends string>(
    this: GroupedDataFrame<R, GroupName>,
    column: ValidateColumnExists<R, ColName, MissingColumnDummyCol>,
    options?: {
      prefix?: string;
      suffix?: string;
      drop_original?: boolean;
      include_na?: boolean;
    },
  ): GroupedDataFrame<
    { [K in keyof R | string]: K extends keyof R ? R[K] : boolean },
    Extract<GroupName, keyof R | string>
  >;

  // Regular DataFrame overloads
  <
    R extends object,
    ColName extends string,
    const Categories extends readonly string[],
    const Prefix extends string = "",
    const Suffix extends string = "",
    const DropOriginal extends boolean = true,
  >(
    this: DataFrame<R>,
    column: ValidateColumnExists<R, ColName, MissingColumnDummyCol>,
    options: {
      expected_categories: Categories;
      prefix?: Prefix;
      suffix?: Suffix;
      drop_original?: DropOriginal;
      include_na?: boolean;
    },
  ): DataFrame<
    DummyColResult<R, ColName, Categories, Prefix, Suffix, DropOriginal>
  >;

  <R extends object, ColName extends string>(
    this: DataFrame<R>,
    column: ValidateColumnExists<R, ColName, MissingColumnDummyCol>,
    options?: {
      prefix?: string;
      suffix?: string;
      drop_original?: boolean;
      include_na?: boolean;
    },
  ): DataFrame<
    { [K in keyof R | string]: K extends keyof R ? R[K] : boolean }
  >;
};
