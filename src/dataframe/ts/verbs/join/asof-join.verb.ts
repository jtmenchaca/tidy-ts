// deno-lint-ignore-file no-explicit-any
import {
  type ColumnarStore,
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  type Prettify,
} from "../../dataframe/index.ts";
import {
  getStoreAndIndex,
  NA_U32,
  processJoinColumns,
} from "./join-helpers.ts";
import { withGroupsRebuilt } from "../../dataframe/index.ts";
import type { StoreAndIndex } from "./types/index.ts";

function projectColumn(
  store: ColumnarStore,
  index: Uint32Array,
  name: string,
): unknown[] {
  const src = store.columns[name];
  if (!src) throw new Error(`Column '${name}' not found`);
  const out = new Array(index.length);
  for (let i = 0; i < index.length; i++) out[i] = src[index[i]];
  return out;
}

function ensureOrderable(v: unknown): "number" | "date" | "bigint" {
  if (typeof v === "number") return "number";
  if (typeof v === "bigint") return "bigint";
  if (v instanceof Date) return "date";
  throw new Error("join_asof: key must be number | bigint | Date");
}
function toScalar(
  x: unknown,
  kind: "number" | "date" | "bigint",
): number | bigint {
  if (kind === "number") return (x as number) ?? Number.NaN;
  if (kind === "bigint") {
    return (typeof x === "bigint") ? x : BigInt((x as number) ?? 0);
  }
  // date
  return x instanceof Date ? x.getTime() : Number(x);
}

function cmp(a: number | bigint, b: number | bigint): number {
  if (typeof a === "bigint") {
    const A = a as bigint, B = b as bigint;
    return A < B ? -1 : A > B ? 1 : 0;
  } else {
    const A = a as number, B = b as number;
    return A < B ? -1 : A > B ? 1 : 0;
  }
}
function diff(a: number | bigint, b: number | bigint): number {
  // returns a-b as a JS number (OK for timestamps / typical ranges)
  if (typeof a === "bigint") return Number((a as bigint) - (b as bigint));
  return (a as number) - (b as number);
}
function absdiff(a: number | bigint, b: number | bigint): number {
  const d = diff(a, b);
  return d < 0 ? -d : d;
}

function stableArgsort<T>(
  keys: T[],
  cmpFn: (a: T, b: T) => number,
): Uint32Array {
  const idx = new Uint32Array(keys.length);
  for (let i = 0; i < idx.length; i++) idx[i] = i;
  // TypedArray.sort comparator returns number; tie-breaker by index for stability.
  idx.sort((i, j) => {
    const c = cmpFn(keys[i], keys[j]);
    return c !== 0 ? c : (i - j);
  });
  return idx;
}

function groupKeyRow(
  row: Record<string, unknown>,
  names: string[],
): string {
  if (names.length === 0) return "";
  const parts = new Array(names.length);
  for (let i = 0; i < names.length; i++) {
    const v = row[names[i]];
    parts[i] = v === undefined ? "__u" : v === null ? "__n" : String(v);
  }
  return parts.join("\u0001");
}

function buildOutputStoreAsof(
  left: StoreAndIndex,
  right: StoreAndIndex,
  leftPickRight: readonly (number | null)[], // one right index or null per left row (in *view* order)
  joinKey: string,
  suffixRight: string,
): ColumnarStore {
  const n = leftPickRight.length;

  // Precompute base indices for left & right per output row
  const leftBase = new Uint32Array(n);
  const rightBase = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    leftBase[i] = left.index[i]; // pick array aligns to left view order
    const rv = leftPickRight[i];
    rightBase[i] = rv == null ? NA_U32 : right.index[rv];
  }

  // Process left columns (always present, no conflicts since asof join keeps all left)
  const leftResult = processJoinColumns({
    store: left,
    baseIndices: leftBase,
    columnNames: left.store.columnNames,
    nameSet: new Set(left.store.columnNames),
    conflictSet: new Set<string>(), // No conflicts for left side in asof join
    keySet: new Set<string>(), // No special key handling for left side
    dropKeys: new Set<string>(),
    suffix: "",
    useNullable: false,
  });

  // Process right columns (exclude join key; handle conflicts with suffixes)
  const leftNameSet = new Set(left.store.columnNames);
  const rightColumnsToProcess = right.store.columnNames.filter((name) =>
    name !== joinKey
  );
  const rightConflictSet = new Set<string>();

  // Identify conflicts for right columns
  for (const name of rightColumnsToProcess) {
    if (leftNameSet.has(name)) {
      rightConflictSet.add(name);
    }
  }

  const rightResult = processJoinColumns({
    store: right,
    baseIndices: rightBase,
    columnNames: rightColumnsToProcess,
    nameSet: new Set(rightColumnsToProcess),
    conflictSet: rightConflictSet,
    keySet: new Set<string>(),
    dropKeys: new Set([joinKey]), // Join key is already handled by exclusion above
    suffix: suffixRight,
    useNullable: true, // Right side can have nulls from no matches
  });

  // Merge results
  const columns = { ...leftResult.columns, ...rightResult.columns };
  const columnNames = [...leftResult.names, ...rightResult.names];

  return { columns, length: n, columnNames };
}

export function asof_join<
  L extends Record<string, unknown>,
  R extends Record<string, unknown>,
  K extends keyof L & keyof R,
>(
  right: DataFrame<R>,
  by: K,
  opts?: {
    direction?: "backward" | "forward" | "nearest";
    tolerance?: number; // in key units; NaN/undefined => no limit
    group_by?: (keyof L & keyof R)[];
    suffixes?: { right?: string };
  },
) {
  return (left: DataFrame<L>): DataFrame<Prettify<L & Partial<R>>> => {
    const Ls = getStoreAndIndex(left);
    const Rs = getStoreAndIndex(right);

    if (left.nrows() === 0) {
      return createColumnarDataFrameFromStore({
        columns: {},
        length: 0,
        columnNames: [],
      }) as unknown as DataFrame<Prettify<L & Partial<R>>>;
    }
    if (right.nrows() === 0) {
      const outDf = createColumnarDataFrameFromStore({
        columns: { ...Ls.store.columns },
        length: Ls.index.length,
        columnNames: [...Ls.store.columnNames],
      }) as unknown as DataFrame<Prettify<L & Partial<R>>>;
      if ((left as any).__groups) {
        const src = left as unknown as GroupedDataFrame<L, keyof L>;
        const outRows = outDf.toArray() as readonly (L & Partial<R>)[];
        return withGroupsRebuilt(src, outRows, outDf) as unknown as DataFrame<
          Prettify<L & Partial<R>>
        >;
      }
      return outDf;
    }

    const key = String(by);
    const groupNames = opts?.group_by?.map(String) ?? [];
    const suffixRight = opts?.suffixes?.right ?? "_y";
    const direction = opts?.direction ?? "backward";
    const tol = opts?.tolerance;
    const tolEnabled = typeof tol === "number" && Number.isFinite(tol);

    // Keys & optional group keys in *view* order
    const lKeyRaw = projectColumn(Ls.store, Ls.index, key);
    const rKeyRaw = projectColumn(Rs.store, Rs.index, key);

    const probe = lKeyRaw.find((v) => v != null) ??
      rKeyRaw.find((v) => v != null);
    const kind = ensureOrderable(probe);

    const kL = new Array<number | bigint>(lKeyRaw.length);
    for (let i = 0; i < kL.length; i++) kL[i] = toScalar(lKeyRaw[i], kind);
    const kR = new Array<number | bigint>(rKeyRaw.length);
    for (let j = 0; j < kR.length; j++) kR[j] = toScalar(rKeyRaw[j], kind);

    const lGroupKey = (groupNames.length === 0)
      ? null
      : new Array<string>(Ls.index.length);
    const rGroupKey = (groupNames.length === 0)
      ? null
      : new Array<string>(Rs.index.length);
    if (groupNames.length > 0) {
      for (let i = 0; i < Ls.index.length; i++) {
        const row: Record<string, unknown> = {};
        for (const g of groupNames) row[g] = Ls.store.columns[g][Ls.index[i]];
        lGroupKey![i] = groupKeyRow(row, groupNames);
      }
      for (let j = 0; j < Rs.index.length; j++) {
        const row: Record<string, unknown> = {};
        for (const g of groupNames) row[g] = Rs.store.columns[g][Rs.index[j]];
        rGroupKey![j] = groupKeyRow(row, groupNames);
      }
    }

    // Sort by (groupKey, key) — stable
    const ordR = stableArgsort(
      rGroupKey
        ? rGroupKey.map((gk, j) => [gk, kR[j]] as const)
        : kR.map((v) => ["", v] as const),
      (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : cmp(a[1], b[1])),
    );

    const ordL = stableArgsort(
      lGroupKey
        ? lGroupKey.map((gk, i) => [gk, kL[i]] as const)
        : kL.map((v) => ["", v] as const),
      (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : cmp(a[1], b[1])),
    );

    // IMPORTANT: don't use TypedArray.map() when projecting to non-numbers.
    const gR = rGroupKey ? Array.from(ordR, (j) => rGroupKey[j]) : null;
    const gL = lGroupKey ? Array.from(ordL, (i) => lGroupKey[i]) : null;
    const skR = Array.from(ordR, (j) => kR[j]); // number|bigint[]
    const skL = Array.from(ordL, (i) => kL[i]);

    // Asof sweep over sorted arrays
    const pickR_sorted = new Array<number | null>(skL.length);
    let i = 0, j = 0;

    const sameGroup = (iIdx: number, jIdx: number) =>
      (gL ? gL[iIdx] : "") === (gR ? gR[jIdx] : "");

    while (i < skL.length) {
      // If grouping, fast-forward to the start of the matching right group
      while (gL && gR && j < skR.length && gR[j] < gL[i]) j++;

      if (gL && gR && (j >= skR.length || gR[j] !== gL[i])) {
        pickR_sorted[i++] = null;
        continue;
      }

      const x = skL[i];

      if (direction === "backward") {
        // advance jj while kR[jj] <= x
        let jj = j;
        while (jj < skR.length && sameGroup(i, jj) && cmp(skR[jj], x) <= 0) {
          jj++;
        }
        const cand = jj - 1;
        if (cand >= j && sameGroup(i, cand)) {
          const ok = !tolEnabled || absdiff(x, skR[cand]) <= (tol as number);
          pickR_sorted[i] = ok ? cand : null;
        } else {
          pickR_sorted[i] = null;
        }
        i++;
        j = Math.max(j, cand);
      } else if (direction === "forward") {
        while (j < skR.length && sameGroup(i, j) && cmp(skR[j], x) < 0) j++;
        if (j < skR.length && sameGroup(i, j)) {
          const ok = !tolEnabled || absdiff(skR[j], x) <= (tol as number);
          pickR_sorted[i] = ok ? j : null;
        } else {
          pickR_sorted[i] = null;
        }
        i++;
      } else { // nearest
        let jj = j;
        while (jj < skR.length && sameGroup(i, jj) && cmp(skR[jj], x) <= 0) {
          jj++;
        }
        const pred = (jj - 1 >= j && sameGroup(i, jj - 1)) ? (jj - 1) : -1;
        const succ = (jj < skR.length && sameGroup(i, jj)) ? jj : -1;

        let pick: number | null = null;
        if (pred >= 0 && succ >= 0) {
          const d1 = absdiff(x, skR[pred]);
          const d2 = absdiff(skR[succ], x);
          pick = (d2 < d1) ? succ : pred; // tie -> pred
        } else if (pred >= 0) pick = pred;
        else if (succ >= 0) pick = succ;

        if (pick != null && tolEnabled) {
          const d = pick === pred
            ? absdiff(x, skR[pred])
            : absdiff(skR[pick], x);
          if (!(d <= (tol as number))) pick = null;
        }
        pickR_sorted[i] = pick;
        i++;
        j = Math.max(j, pred >= 0 ? pred : j);
      }
    }

    // Map back to left view order
    const pickR_viewOrder = new Array<number | null>(Ls.index.length);
    for (let si = 0; si < pickR_sorted.length; si++) {
      const lv = ordL[si]; // left view position
      const pr = pickR_sorted[si];
      pickR_viewOrder[lv] = (pr == null) ? null : ordR[pr];
    }

    const outStore = buildOutputStoreAsof(
      Ls,
      Rs,
      pickR_viewOrder,
      key,
      suffixRight,
    );

    const outDf = createColumnarDataFrameFromStore(
      outStore,
    ) as unknown as DataFrame<
      Prettify<L & Partial<R>>
    >;
    if ((left as any).__groups) {
      const src = left as unknown as GroupedDataFrame<L, keyof L>;
      const outRows = outDf.toArray() as readonly (L & Partial<R>)[];
      return withGroupsRebuilt(src, outRows, outDf) as unknown as DataFrame<
        Prettify<L & Partial<R>>
      >;
    }
    return outDf;
  };
}
