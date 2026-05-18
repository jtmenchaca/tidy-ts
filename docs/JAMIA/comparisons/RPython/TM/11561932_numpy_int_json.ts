/**
 * RPython SO#11561932 — json.dumps(list(np.arange(5))) fails while .tolist() works
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In numpy, list() preserves numpy scalar types (int64) which are not JSON
 * serializable. .tolist() converts to native Python ints.
 *
 * In tidy-ts, all values are native JS types. There are no wrapper scalar types.
 * JSON.stringify works on number[] directly. The bug is structurally absent.
 * The type system still catches passing wrong column types to numeric operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { idx: 0, label: "a" },
  { idx: 1, label: "b" },
  { idx: 2, label: "c" },
]);

// Values are native JS — JSON.stringify works
const indices = df.extract("idx"); // number[]
console.log(JSON.stringify(indices));

// Type system catches wrong column type in numeric operations
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.sum(df.extract("label"));
