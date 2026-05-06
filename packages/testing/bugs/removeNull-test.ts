import type { DataFrame } from "/Users/jtmenchaca/tidy-ts/packages/dataframe/ts/dataframe/index.ts";

type HasIdDateAndCode<K extends string, C extends string> =
  { id: string } & Record<K, Temporal.PlainDateTime> & Record<C, string>;

// Case 1: sliceMin can sort by fieldName directly — no temp column needed
function testDropSimplifiesToT<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(
  events: DataFrame<T>,
  fieldName: K & keyof T,
): DataFrame<T> {
  return events
    .groupBy("id")
    .sliceMin(fieldName, 1)
    .ungroup();
}

// Case 2: .removeNull() narrows nullable field to non-null
type ObservationWithValueQuantity = {
  id: string;
  effectiveDateTime: Temporal.PlainDateTime;
  code: string;
  status: string;
  valueQuantity: {
    value: number | null;
    code: string | null;
    unit: string | null;
  };
};

type ObservationWithValueQuantityAndUnit = {
  id: string;
  effectiveDateTime: Temporal.PlainDateTime;
  code: string;
  status: string;
  valueQuantity: {
    value: number;
    code: string;
    unit: string;
  };
};

function testRemoveNullNarrows(
  events: DataFrame<ObservationWithValueQuantity>,
): DataFrame<ObservationWithValueQuantityAndUnit> {
  const result = events
    .removeNull(["valueQuantity", "value"])
    .removeNull(["valueQuantity", "code"])
    .removeNull(["valueQuantity", "unit"])

    const result1 = result
    .groupBy("id")

    const result2 = result1
    .sliceMax("effectiveDateTime", 1)
    .ungroup();

    return result2;
}
