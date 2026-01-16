import type { ColumnarStore } from "../index.ts";

/**
 * Lightweight iterable view over a column using a row-index view.
 * - Iteration yields values lazily (no arrays).
 * - Numeric indexing via Proxy for patterns like group.col[0].
 * - length property (view length).
 */
export function createColumnIterable<T = unknown>(
  store: ColumnarStore,
  baseIndex: Uint32Array,
  colName: string,
): Iterable<T> & { length: number } {
  const src = store.columns[colName] as readonly T[];
  const len = baseIndex.length;

  const target = {
    length: len,
    // Iterator
    [Symbol.iterator](): Iterator<T> {
      let i = 0;
      return {
        next: (): IteratorResult<T> => {
          if (i >= len) return { done: true, value: undefined as unknown as T };
          const v = src[baseIndex[i++]];
          return { done: false, value: v };
        },
      };
    },
  };

  // Proxy to support numeric index access: group.col[0]
  return new Proxy(target, {
    get(obj, prop) {
      if (prop === "length") return len;
      if (prop === Symbol.iterator) return obj[Symbol.iterator];
      // numeric index?
      const idx = typeof prop === "string" ? Number(prop) : NaN;
      if (Number.isInteger(idx) && idx >= 0 && idx < len) {
        return src[baseIndex[idx]];
      }
      // deno-lint-ignore no-explicit-any
      return (obj as any)[prop];
    },
    has(_obj, prop) {
      const idx = typeof prop === "string" ? Number(prop) : NaN;
      return (Number.isInteger(idx) && idx >= 0 && idx < len) || prop in target;
    },
    ownKeys(_obj) {
      // surface minimal keys; not meant to be a real Array
      return ["length"];
    },
  }) as unknown as Iterable<T> & { length: number };
}

/**
 * Create a minimal "group proxy" that looks like a DataFrame to user code:
 * - .nrows() works
 * - property access (e.g. group.score) returns a column iterable
 */
export function createGroupProxy<T extends object>(
  store: ColumnarStore,
  baseIndex: Uint32Array,
):
  & { nrows(): number }
  & { [K in keyof T]: Iterable<T[K]> & { length: number } } {
  const cache = new Map<string, unknown>();
  return new Proxy(Object.create(null), {
    get(_obj, prop: string) {
      if (prop === "nrows") return () => baseIndex.length;
      if (cache.has(prop)) return cache.get(prop);
      if (!(prop in store.columns)) return undefined;
      const it = createColumnIterable(store, baseIndex, prop);
      cache.set(prop, it);
      return it;
    },
  }) as unknown as
    & { nrows(): number }
    & { [K in keyof T]: Iterable<T[K]> & { length: number } };
}

/**
 * Optimized group proxy that materializes column arrays once for better stats performance.
 * This trades some memory for much faster aggregation operations.
 */
export function createZeroCopyGroupProxy<T extends object>(
  store: ColumnarStore,
  baseIndex: Uint32Array | null,
  headIdx: number,
  nextArray: Int32Array,
  groupSize: number,
  usesRawIndices: boolean,
):
  & { nrows(): number }
  & { [K in keyof T]: T[K][] } {
  const cache = new Map<string, T[keyof T][]>();

  return new Proxy(Object.create(null), {
    get(_obj, prop: string) {
      if (prop === "nrows") return () => groupSize;
      if (cache.has(prop)) return cache.get(prop);
      if (!(prop in store.columns)) return undefined;

      // Materialize column array once for better performance
      const materializedArray = materializeGroupColumn<T[keyof T]>(
        store,
        baseIndex,
        prop,
        headIdx,
        nextArray,
        groupSize,
        usesRawIndices,
      );
      cache.set(prop, materializedArray);
      return materializedArray;
    },
  }) as unknown as
    & { nrows(): number }
    & { [K in keyof T]: T[K][] };
}

/**
 * Materialize a single column for a group by traversing the adjacency list.
 * This is done once per column per group for optimal stats performance.
 */
function materializeGroupColumn<T = unknown>(
  store: ColumnarStore,
  baseIndex: Uint32Array | null,
  colName: string,
  headIdx: number,
  nextArray: Int32Array,
  groupSize: number,
  usesRawIndices: boolean,
): T[] {
  const src = store.columns[colName] as readonly T[];
  const result = new Array<T>(groupSize);

  let currentIdx = headIdx;
  let pos = 0;

  while (currentIdx !== -1 && pos < groupSize) {
    const actualIdx = usesRawIndices ? currentIdx : baseIndex![currentIdx];
    result[pos] = src[actualIdx];
    currentIdx = nextArray[currentIdx];
    pos++;
  }

  return result;
}
