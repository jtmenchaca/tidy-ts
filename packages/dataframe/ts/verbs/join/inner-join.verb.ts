// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import { tracer } from "../../telemetry/tracer.ts";
import { inner_join_typed_multi_u32 } from "../../wasm/wasm-loader.ts";
import { getStoreAndIndex, parseJoinArgs } from "./join-helpers.ts";

// Simple helper to build result columns
function buildJoinResult(
  leftStore: any,
  rightStore: any,
  leftIndices: number[],
  rightIndices: number[],
  leftKeys: string[],
  suffixes: { left?: string; right?: string },
  leftDataFrame: any,
  rightDataFrame: any,
  leftIndex: Uint32Array,
  rightIndex: Uint32Array,
) {
  const n = leftIndices.length;
  const outCols: Record<string, unknown[]> = {};
  const outNames: string[] = [];

  const leftSuffix = suffixes.left ?? "";
  const rightSuffix = suffixes.right ?? "_y";
  const leftKeySet = new Set(leftKeys);

  // Use DataFrame.columns() to get schema even for empty DataFrames
  const leftColumnNames = leftDataFrame.columns() as string[];
  const rightColumnNames = rightDataFrame.columns() as string[];
  const leftNameSet = new Set(leftColumnNames);

  // Add left columns — map through view index to get physical store positions
  for (const name of leftColumnNames) {
    const hasConflict = !leftKeySet.has(name) &&
      rightColumnNames.includes(name);
    const outName = hasConflict && leftSuffix ? `${name}${leftSuffix}` : name;
    outNames.push(outName);

    const src = leftStore.columns[name];
    const dst = new Array(n);
    for (let i = 0; i < n; i++) {
      dst[i] = src?.[leftIndex[leftIndices[i]]];
    }
    outCols[outName] = dst;
  }

  // Add right columns (skip keys that match left keys)
  for (const name of rightColumnNames) {
    if (leftKeySet.has(name) && leftKeys.includes(name)) continue;

    const hasConflict = leftNameSet.has(name);
    const outName = hasConflict && rightSuffix ? `${name}${rightSuffix}` : name;
    outNames.push(outName);

    const src = rightStore.columns[name];
    const dst = new Array(n);
    for (let i = 0; i < n; i++) {
      dst[i] = src?.[rightIndex[rightIndices[i]]];
    }
    outCols[outName] = dst;
  }

  return { columns: outCols, columnNames: outNames, length: n };
}

// API
export function inner_join(
  right: any,
  byOrOptions: any,
  options?: any,
): (left: any) => any {
  return (left: any): any => {
    const span = tracer.startSpan(left, "inner_join");

    try {
      // Handle empty DataFrames - inner join = empty result, but preserve schema
      if (left.nrows() === 0 || right.nrows() === 0) {
        const leftCols = left.columns() as string[];
        const rightCols = right.columns() as string[];
        const allCols = [...new Set([...leftCols, ...rightCols])];
        const columns: Record<string, unknown[]> = {};
        for (const col of allCols) {
          columns[col] = [];
        }
        return createColumnarDataFrameFromStore({
          columns,
          length: 0,
          columnNames: allCols,
        });
      }

      // Parse arguments
      const { leftKeys, rightKeys, suffixes } = parseJoinArgs(
        byOrOptions,
        options,
      );

      // Get stores and indices
      const L = getStoreAndIndex(left);
      const R = getStoreAndIndex(right);

      // Ultra-optimized typed array join
      const { leftIndices, rightIndices } = tracer.withSpan(
        left,
        "join-operation",
        () => {
          // Convert to typed arrays and gather through view index
          const leftTypedRaw = convertToTypedArrays(
            L.store.columns,
            leftKeys,
          );
          const rightTypedRaw = convertToTypedArrays(
            R.store.columns,
            rightKeys,
          );

          // Gather only visible rows through the view index
          const leftColumnData = leftKeys.map((name) => {
            const raw = leftTypedRaw[name];
            const out = new Uint32Array(L.index.length);
            for (let i = 0; i < L.index.length; i++) out[i] = raw[L.index[i]];
            return out;
          });
          const rightColumnData = rightKeys.map((name) => {
            const raw = rightTypedRaw[name];
            const out = new Uint32Array(R.index.length);
            for (let i = 0; i < R.index.length; i++) out[i] = raw[R.index[i]];
            return out;
          });

          // Call WASM
          try {
            const wasmResult = inner_join_typed_multi_u32(
              leftColumnData,
              rightColumnData,
            );
            const leftIndices = Array.from((wasmResult as any).takeLeft());
            const rightIndices = Array.from((wasmResult as any).takeRight());
            return { leftIndices, rightIndices };
          } catch {
            // JavaScript fallback — columnData arrays are already view-gathered
            const rightMap = new Map<string, number[]>();

            for (let i = 0; i < rightColumnData[0].length; i++) {
              const keyParts: string[] = new Array(rightColumnData.length);
              for (let c = 0; c < rightColumnData.length; c++) {
                keyParts[c] = String(rightColumnData[c][i]);
              }
              const key = keyParts.join("|");
              if (!rightMap.has(key)) rightMap.set(key, []);
              rightMap.get(key)!.push(i);
            }

            const leftIndices: number[] = [];
            const rightIndices: number[] = [];

            for (let i = 0; i < leftColumnData[0].length; i++) {
              const keyParts: string[] = new Array(leftColumnData.length);
              for (let c = 0; c < leftColumnData.length; c++) {
                keyParts[c] = String(leftColumnData[c][i]);
              }
              const key = keyParts.join("|");
              const matches = rightMap.get(key);
              if (matches) {
                for (const match of matches) {
                  leftIndices.push(i);
                  rightIndices.push(match);
                }
              }
            }

            return { leftIndices, rightIndices };
          }
        },
      );

      if (leftIndices.length === 0) {
        return createColumnarDataFrameFromStore({
          columns: {},
          length: 0,
          columnNames: [],
        });
      }

      // Build result
      const outStore = buildJoinResult(
        L.store,
        R.store,
        leftIndices as number[],
        rightIndices as number[],
        leftKeys,
        suffixes,
        left,
        right,
        L.index,
        R.index,
      );
      const outDf = createColumnarDataFrameFromStore(outStore) as any;

      // Handle groups
      if (left.__groups) {
        const outRows = outDf.toArray();
        return withGroupsRebuilt(left, outRows as any, outDf) as any;
      }

      return outDf;
    } finally {
      tracer.endSpan(left, span);
    }
  };
}
