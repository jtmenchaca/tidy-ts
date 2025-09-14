// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  type Prettify,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { cross_join_u32 } from "../../wasm-loader.ts";

function getStoreAndIndex<T extends Record<string, unknown>>(df: DataFrame<T>) {
  const api: any = df as any;
  const store = api.__store;
  const view = api.__view;

  const index = new Uint32Array(df.nrows());
  for (let i = 0; i < index.length; i++) {
    index[i] = i;
  }

  if (view?.filteredIndex) {
    return { store, index: view.filteredIndex };
  }
  if (view?.sortedIndex) {
    return { store, index: view.sortedIndex };
  }
  return { store, index };
}

function buildJoinResult<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
>(
  left: { store: any; index: Uint32Array },
  right: { store: any; index: Uint32Array },
  leftIndices: Uint32Array,
  rightIndices: Uint32Array,
  suffixes?: { left?: string; right?: string },
) {
  const n = leftIndices.length;
  const outCols: Record<string, unknown[]> = {};
  const outNames: string[] = [];

  const suffixLeft = suffixes?.left ?? "";
  const suffixRight = suffixes?.right ?? "";
  const leftNameSet = new Set(left.store.columnNames);
  const rightNameSet = new Set(right.store.columnNames);

  // Add left columns
  for (const name of left.store.columnNames) {
    const hasConflict = rightNameSet.has(name);
    const outName = hasConflict && suffixLeft ? `${name}${suffixLeft}` : name;

    // Only skip left column if there's a conflict and NO suffixes are provided
    if (hasConflict && !suffixLeft && !suffixRight) {
      continue;
    }

    outNames.push(outName);
    const leftCol = left.store.columns[name];
    const outCol = new Array(n);
    for (let i = 0; i < n; i++) {
      outCol[i] = leftCol[left.index[leftIndices[i]]];
    }
    outCols[outName] = outCol;
  }

  // Add right columns
  for (const name of right.store.columnNames) {
    const hasConflict = leftNameSet.has(name);
    const outName = hasConflict && suffixRight ? `${name}${suffixRight}` : name;

    outNames.push(outName);
    const rightCol = right.store.columns[name];
    const outCol = new Array(n);
    for (let i = 0; i < n; i++) {
      outCol[i] = rightCol[right.index[rightIndices[i]]];
    }
    outCols[outName] = outCol;
  }

  return { columns: outCols, columnNames: outNames, length: n };
}

/**
 * Cross join: create Cartesian product of all rows.
 */
export function cross_join<
  LeftRow extends Record<string, unknown>,
  RightRow extends Record<string, unknown>,
>(
  right: DataFrame<RightRow>,
  maxRows?: number,
  suffixes?: { left?: string; right?: string },
) {
  return (
    left: DataFrame<LeftRow>,
  ): DataFrame<Prettify<LeftRow & RightRow>> => {
    if (left.nrows() === 0 || right.nrows() === 0) {
      return createColumnarDataFrameFromStore({
        columns: {},
        length: 0,
        columnNames: [],
      }) as unknown as DataFrame<Prettify<LeftRow & RightRow>>;
    }

    const expectedRows = left.nrows() * right.nrows();
    const actualRows = maxRows && maxRows < expectedRows
      ? maxRows
      : expectedRows;

    if (actualRows > 2147483647) {
      throw new Error(
        `Cross join would create ${actualRows} rows, exceeding JavaScript's maximum array length.`,
      );
    }

    const L = getStoreAndIndex(left);
    const R = getStoreAndIndex(right);

    const res = cross_join_u32(left.nrows(), right.nrows());
    let leftIdxView = res.takeLeft();
    let rightIdxView = res.takeRight();

    if (maxRows && maxRows < leftIdxView.length) {
      leftIdxView = leftIdxView.subarray(0, maxRows);
      rightIdxView = rightIdxView.subarray(0, maxRows);
    }

    const outStore = buildJoinResult<LeftRow, RightRow>(
      L,
      R,
      leftIdxView,
      rightIdxView,
      suffixes,
    );

    const outDf = createColumnarDataFrameFromStore(
      outStore,
    ) as unknown as DataFrame<Prettify<LeftRow & RightRow>>;

    if ((left as any).__groups) {
      const src = left as unknown as GroupedDataFrame<LeftRow, keyof LeftRow>;
      const outRows = outDf.toArray() as readonly (LeftRow & RightRow)[];
      return withGroupsRebuilt(src, outRows, outDf) as unknown as DataFrame<
        Prettify<LeftRow & RightRow>
      >;
    }

    return outDf;
  };
}
