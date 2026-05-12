// deno-lint-ignore-file no-explicit-any
import { usingNativeBackend, wasmInternal } from "../../dataframe/ts/wasm/wasm-init.ts";

console.log("Using native backend:", usingNativeBackend());
console.log("Has unique_f64:", "unique_f64" in wasmInternal);
console.log("typeof unique_f64:", typeof (wasmInternal as any).unique_f64);

const arr = new Float64Array([1, 2, 3, 1, 2, 4]);
try {
  const result = (wasmInternal as any).unique_f64(arr);
  console.log("unique_f64 result:", result);
  console.log("Type:", result?.constructor?.name);
} catch (e: any) {
  console.log("unique_f64 error:", e.message);
}
