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

// Case 3: Filter events using data from another table without adding columns.
// Use a Map lookup instead of join+drop to preserve the generic type T.
function testFilterWithLookup<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(
  events: DataFrame<T>,
  birthDates: DataFrame<{ id: string; _birthDate: Temporal.PlainDateTime }>,
  fieldName: K & keyof T,
): DataFrame<T> {
  const birthMap = new Map(
    birthDates.toRows().map((r) => [r.id, r._birthDate]),
  );
  return events.filter((r) => {
    const bd = birthMap.get(r.id);
    return bd != null && Temporal.PlainDateTime.compare(bd, r[fieldName]) < 0;
  });
}

// Case 4: same pattern with concrete type — join+drop works fine (no generic T)
type ConcreteEvent = { id: string; date: Temporal.PlainDateTime; code: string };

function testDropAfterJoinConcrete(
  events: DataFrame<ConcreteEvent>,
  birthDates: DataFrame<{ id: string; _birthDate: Temporal.PlainDateTime }>,
): DataFrame<ConcreteEvent> {
  return events
    .innerJoin(birthDates, "id")
    .filter((r) => Temporal.PlainDateTime.compare(r._birthDate, r.date) < 0)
    .drop("_birthDate");
}
