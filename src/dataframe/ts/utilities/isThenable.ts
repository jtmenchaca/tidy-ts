// Check if something is already a thenableDataFrame wrapper
export const isThenableDataFrame = (x: unknown): boolean =>
  !!x && typeof x === "object" &&
  // deno-lint-ignore no-explicit-any
  (x as any)[Symbol.for("__thenableDataFrame")] === true;

export const isThenable = (x: unknown): x is PromiseLike<unknown> =>
  !!x && (typeof x === "object" || typeof x === "function") &&
  typeof (x as Record<string, unknown>).then === "function" &&
  !isThenableDataFrame(x); // Don't treat thenableDataFrame wrappers as thenable
