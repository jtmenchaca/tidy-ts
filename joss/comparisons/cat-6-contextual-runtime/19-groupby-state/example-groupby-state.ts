/**
 * Error Class 19: GroupBy State Tracking
 *
 * Tidy-TS's groupBy() returns a GroupedDataFrame. However, mutate()
 * and filter() ARE available on GroupedDataFrame at the type level
 * (they operate per-group). This is actually correct behavior but
 * differs from the claim that only summarize() is allowed.
 *
 * The real safety is that summarize's callback receives a DataFrame
 * (the group), not individual rows — preventing row-level confusion.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { patient_id: "P1", value: 100 },
  { patient_id: "P1", value: 200 },
  { patient_id: "P2", value: 300 },
]);

const grouped = labs.groupBy("patient_id");

// GroupedDataFrame allows summarize with typed group callbacks
const summary = grouped.summarize({
  mean_value: (group) => s.mean(group.value),
  count: (group) => group.nrows(),
});

// GroupedDataFrame also allows mutate and filter (per-group ops)
// This is NOT a compile error — they work on grouped data
grouped.mutate({ doubled: (r) => r.value * 2 });
grouped.filter((r) => r.value > 100);
