export { s, stats } from "./ts/stats/stats.ts";
export { str } from "./ts/stats/strings/str.ts";
export {
  createDataFrame,
  type DataFrame,
  type DataFrameOptions,
  type GroupedDataFrame,
  type PromisedDataFrame,
  type PromisedGroupedDataFrame,
} from "./ts/dataframe/index.ts";

// Use dynamic imports to conditionally load I/O functions
// deno-lint-ignore no-explicit-any
export const read_arrow: any = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async (...args: any[]) => {
      const { read_arrow } = await import("./ts/io/index.ts");
      // deno-lint-ignore no-explicit-any
      return (read_arrow as any)(...args);
    };
  } else {
    return () => {
      throw new Error(
        "read_arrow is only available in Node.js/Deno environments. Use ArrayBuffer input instead of file paths in browsers.",
      );
    };
  }
})();

// deno-lint-ignore no-explicit-any
export const read_csv: any = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async (...args: any[]) => {
      const { read_csv } = await import("./ts/io/index.ts");
      // deno-lint-ignore no-explicit-any
      return (read_csv as any)(...args);
    };
  } else {
    return () => {
      throw new Error(
        "read_csv is only available in Node.js/Deno environments. Use string input instead of file paths in browsers.",
      );
    };
  }
})();

// deno-lint-ignore no-explicit-any
export const read_parquet: any = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async (...args: any[]) => {
      const { read_parquet } = await import("./ts/io/index.ts");
      // deno-lint-ignore no-explicit-any
      return (read_parquet as any)(...args);
    };
  } else {
    return () => {
      throw new Error(
        "read_parquet is only available in Node.js/Deno environments. Use ArrayBuffer input instead of file paths in browsers.",
      );
    };
  }
})();

// deno-lint-ignore no-explicit-any
export const write_csv: any = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async (...args: any[]) => {
      const { write_csv } = await import("./ts/verbs/utility/index.ts");
      // deno-lint-ignore no-explicit-any
      return (write_csv as any)(...args);
    };
  } else {
    return () => {
      throw new Error(
        "write_csv is only available in Node.js/Deno environments",
      );
    };
  }
})();

// deno-lint-ignore no-explicit-any
export const write_parquet: any = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async (...args: any[]) => {
      const { write_parquet } = await import("./ts/verbs/utility/index.ts");
      // deno-lint-ignore no-explicit-any
      return (write_parquet as any)(...args);
    };
  } else {
    return () => {
      throw new Error(
        "write_parquet is only available in Node.js/Deno environments",
      );
    };
  }
})();
