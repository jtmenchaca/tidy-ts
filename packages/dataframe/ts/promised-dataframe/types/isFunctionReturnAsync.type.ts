// deno-lint-ignore-file no-explicit-any

// Does a function's return type include Promise in its union?

type ReturnsPromise<F> = F extends (...args: any[]) => infer R
  ? [Extract<R, Promise<any>>] extends [never] ? false : true
  : false;

// Do any predicates possibly return a Promise?
export type AnyPredicateIsAsync<Preds extends readonly unknown[]> = [
  Extract<
    Preds[number] extends (...args: any[]) => any ? ReturnType<Preds[number]>
      : never,
    Promise<any>
  >,
] extends [never] ? false : true;

// Check if any value in an object is an async function or returns a Promise
export type AnyPropertyIsAsync<T extends Record<string, any>> = [
  Extract<
    T[keyof T] extends (...args: any[]) => any ? ReturnType<T[keyof T]>
      : never,
    Promise<any>
  >,
] extends [never] ? false : true;

// Legacy types kept for backward compatibility

export type IsAsyncFunction<T> = T extends (...args: any[]) => Promise<any>
  ? true
  : false;

export type HasAsyncFunctions<T extends Record<string, any>> = {
  [K in keyof T]: IsAsyncFunction<T[K]>;
}[keyof T] extends false ? false : true;
