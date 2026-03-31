import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  MissingColumnDummyCol,
  ValidateColumnExists,
} from "../../dataframe/types/error-types.ts";

type DummyColResult<
  Row extends object,
  ColName extends string,
  Categories extends readonly string[],
  Prefix extends string,
  Suffix extends string,
  DropOriginal extends boolean,
> = Prettify<
  & (DropOriginal extends true ? Omit<Row, ColName & keyof Row> : Row)
  & {
    [Category in Categories[number] as `${Prefix}${Category}${Suffix}`]:
      boolean;
  }
>;

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
    Prettify<R & Record<string, boolean>>,
    Extract<GroupName, keyof Prettify<R & Record<string, boolean>>>
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
  ): DataFrame<Prettify<R & Record<string, boolean>>>;
};
