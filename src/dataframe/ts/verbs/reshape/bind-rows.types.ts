import type { DataFrame, Prettify } from "../../dataframe/index.ts";

/**
 * Type for the bind_rows method that combines DataFrames vertically.
 *
 * @template Row - The row type of the DataFrame
 */
export type BindRowsMethod<Row extends object> = {
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
  ): DataFrame<Prettify<Row & Partial<OtherRow>>>;

  <
    OtherRow1 extends object,
    OtherRow2 extends object,
  >(
    other1: DataFrame<OtherRow1>,
    other2: DataFrame<OtherRow2>,
  ): DataFrame<Prettify<Row & Partial<OtherRow1> & Partial<OtherRow2>>>;

  <
    OtherRow1 extends object,
    OtherRow2 extends object,
    OtherRow3 extends object,
  >(
    other1: DataFrame<OtherRow1>,
    other2: DataFrame<OtherRow2>,
    other3: DataFrame<OtherRow3>,
  ): DataFrame<
    Prettify<Row & Partial<OtherRow1> & Partial<OtherRow2> & Partial<OtherRow3>>
  >;

  <OtherRow extends object>(
    ...others: DataFrame<OtherRow>[]
  ): DataFrame<Prettify<Row & Partial<OtherRow>>>;
};
