import type { DataFrame } from "../../dataframe/types/dataframe.type.ts";

export type ColumnProfile = {
  column: string;
  type: string;
  count: number;
  nulls: number;
  null_pct: string;
  mean: string | undefined;
  median: string | undefined;
  min: string | undefined;
  max: string | undefined;
  sd: string | undefined;
  q1: string | undefined;
  q3: string | undefined;
  iqr: string | undefined;
  variance: string | undefined;
  unique: number | undefined;
  top_values: string | undefined;
};

export type ProfileMethod<Row extends object> = () => DataFrame<ColumnProfile>;
