export type AnyPredicateIsAsync<Preds extends readonly unknown[]> = [
    Extract<Preds[number] extends (...args: any[]) => any ? ReturnType<Preds[number]> : never, Promise<any>>
] extends [never] ? false : true;
export type AnyPropertyIsAsync<T extends Record<string, any>> = true extends {
    [K in keyof T]: IsAsyncFunction<T[K]>;
}[keyof T] ? true : false;
export type IsAsyncFunction<T> = T extends (...args: any[]) => Promise<any> ? true : false;
export type HasAsyncFunctions<T extends Record<string, any>> = {
    [K in keyof T]: IsAsyncFunction<T[K]>;
}[keyof T] extends false ? false : true;
