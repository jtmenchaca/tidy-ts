/**
 * Error Class 8: Async/Sync Confusion
 *
 * When an async function is passed to a sync mutate, Tidy-TS silently
 * stores Promise objects in the column — same behavior as Python storing
 * coroutine objects. Neither catches this at compile time.
 *
 * Tidy-TS does offer mutateAsync() as the correct alternative.
 * Python has no equivalent — apply() always runs synchronously.
 * R does not have async/await.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const meds = createDataFrame([
  { drug: "Aspirin", dose_mg: 325 },
]);

async function lookupInteraction(_drug: string): Promise<string> {
  return "none";
}

// SILENT: Tidy-TS accepts async in mutate — stores Promise objects
// Same problem as Python storing coroutine objects
const bad = meds.mutate({
  interaction: async (r) => await lookupInteraction(r.drug),
});
// bad.interaction contains Promise { "none" }, not "none"

// CORRECT: Use mutateAsync and await the result
const good = await meds.mutateAsync({
  interaction: async (r) => await lookupInteraction(r.drug),
});
// good.interaction contains "none"
