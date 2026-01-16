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
    GroupName extends keyof Row,
    ColName extends string,
    const Categories extends readonly string[],
    const Prefix extends string = "",
    const Suffix extends string = "",
    const DropOriginal extends boolean = true,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    column: ValidateColumnExists<Row, ColName, MissingColumnDummyCol>,
    options: {
      expected_categories: Categories;
      prefix?: Prefix;
      suffix?: Suffix;
      drop_original?: DropOriginal;
      include_na?: boolean;
    },
  ): GroupedDataFrame<
    DummyColResult<Row, ColName, Categories, Prefix, Suffix, DropOriginal>,
    Extract<
      GroupName,
      keyof DummyColResult<
        Row,
        ColName,
        Categories,
        Prefix,
        Suffix,
        DropOriginal
      >
    >
  >;

  <GroupName extends keyof Row, ColName extends string>(
    this: GroupedDataFrame<Row, GroupName>,
    column: ValidateColumnExists<Row, ColName, MissingColumnDummyCol>,
    options?: {
      prefix?: string;
      suffix?: string;
      drop_original?: boolean;
      include_na?: boolean;
    },
  ): GroupedDataFrame<
    Prettify<Row & Record<string, boolean>>,
    Extract<GroupName, keyof Prettify<Row & Record<string, boolean>>>
  >;

  // Regular DataFrame overloads
  <
    ColName extends string,
    const Categories extends readonly string[],
    const Prefix extends string = "",
    const Suffix extends string = "",
    const DropOriginal extends boolean = true,
  >(
    column: ValidateColumnExists<Row, ColName, MissingColumnDummyCol>,
    options: {
      expected_categories: Categories;
      prefix?: Prefix;
      suffix?: Suffix;
      drop_original?: DropOriginal;
      include_na?: boolean;
    },
  ): DataFrame<
    DummyColResult<Row, ColName, Categories, Prefix, Suffix, DropOriginal>
  >;

  <ColName extends string>(
    column: ValidateColumnExists<Row, ColName, MissingColumnDummyCol>,
    options?: {
      prefix?: string;
      suffix?: string;
      drop_original?: boolean;
      include_na?: boolean;
    },
  ): DataFrame<Prettify<Row & Record<string, boolean>>>;
};
