import type { DataFrame } from "@tidy-ts/dataframe";

type HasIdDateAndCode<K extends string, C extends string> =
  { id: string } & Record<K, Temporal.PlainDateTime> & Record<C, string>;

function testUngroupReturnType<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  intervals: DataFrame<{ id: string; start: Temporal.PlainDateTime; end: Temporal.PlainDateTime }>;
}): DataFrame<Pick<T, "id" | K | C>> {

  // Step 1: filter
  const step1 = opts.events.filter((r) => r[opts.codeField] === "test");

  // Step 2: innerJoin
  const step2 = step1.innerJoin(opts.intervals, "id");

  // Step 3: filter on joined result
  const step3 = step2.filter(
    (r) =>
      Temporal.PlainDateTime.compare(r[opts.fieldName], r.start) >= 0 &&
      Temporal.PlainDateTime.compare(r[opts.fieldName], r.end) <= 0,
  );

  // Step 4: select
  const step4 = step3.select("id", opts.fieldName, opts.codeField);

  // Step 5: groupBy
  const step5 = step4.groupBy("id");

  // Step 6: sliceMax
  const step6 = step5.sliceMax(opts.fieldName, 1);

  // Step 7: ungroup
  const step7 = step6.ungroup();

  return step7;
}
