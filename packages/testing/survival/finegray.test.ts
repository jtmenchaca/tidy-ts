// Translation of survival package test: finegray.R
// R reference JSON: finegray-source-test.R (sibling file)
// Tests Fine-Gray competing risks data transformation
//
// Coverage of finegray.R:
// [x] L3-9:    Test data set 1 — right-censored, etype=1 (type1) and etype=2 (type2)
// [x] L26-31:  Weights and extended stops for test1
// [x] L50-60:  Stratified finegray — reprises test1 and test2
// [x] L100-141: Left truncation (delayed entry) with counting process data

import { expect } from "@std/expect";
import { finegray } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  TOL,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./finegray-source-test.R", import.meta.url)
  .pathname;

interface FineGrayRef {
  test1_id: number[];
  test1_fgstart: number[];
  test1_fgstop: number[];
  test1_fgstatus: number[];
  test1_fgwt: number[];
  test1_fgcount: number[];

  test2_fgstart: number[];
  test2_fgstop: number[];
  test2_fgstatus: number[];
  test2_fgwt: number[];

  test3_fgstart_1: number[];
  test3_fgstop_1: number[];
  test3_fgstatus_1: number[];
  test3_fgwt_1: number[];
  test3_fgstart_2: number[];
  test3_fgstop_2: number[];
  test3_fgstatus_2: number[];
  test3_fgwt_2: number[];

  fg3_fgstart: number[];
  fg3_fgstop: number[];
  fg3_fgstatus: number[];
  fg3_fgwt: number[];
}

const ref = getReferenceFromRScript<FineGrayRef>(R_SOURCE_TEST);

// Input data: fdata from the R test
const time = [1, 2, 3, 4, 4, 4, 5, 5, 6, 8, 8, 9, 10, 12];
// status: 0=censor, 1=type1, 2=type2
const status = [1, 2, 0, 1, 0, 0, 2, 1, 0, 0, 2, 0, 1, 0];
const x = [5, 4, 3, 1, 2, 1, 1, 2, 2, 4, 6, 1, 2, 0];

Deno.test("finegray: right-censored etype=1 (type1)", () => {
  const result = finegray({
    tstop: time,
    status,
    etype: 1,
  });

  expect(result.start.length).toBe(ref.test1_fgstart.length);
  assertArrayClose(result.start, ref.test1_fgstart, TOL, "fgstart");
  assertArrayClose(result.stop, ref.test1_fgstop, TOL, "fgstop");
  assertArrayClose(
    result.status.map(Number),
    ref.test1_fgstatus,
    TOL,
    "fgstatus",
  );
  assertArrayClose(result.wt, ref.test1_fgwt, TOL, "fgwt");
  assertArrayClose(result.add, ref.test1_fgcount, TOL, "fgcount");
});

Deno.test("finegray: right-censored etype=2 (type2)", () => {
  const result = finegray({
    tstop: time,
    status,
    etype: 2,
  });

  expect(result.start.length).toBe(ref.test2_fgstart.length);
  assertArrayClose(result.start, ref.test2_fgstart, TOL, "fgstart");
  assertArrayClose(result.stop, ref.test2_fgstop, TOL, "fgstop");
  assertArrayClose(
    result.status.map(Number),
    ref.test2_fgstatus,
    TOL,
    "fgstatus",
  );
  assertArrayClose(result.wt, ref.test2_fgwt, TOL, "fgwt");
});

Deno.test("finegray: stratified — reprises test1 and test2", () => {
  // fdata2: fdata concatenated with itself, group 1 = original, group 2 = status swapped
  // In group 2: type1↔type2 are swapped (cen stays cen)
  // Original status: [1,2,0,1,0,0,2,1,0,0,2,0,1,0]
  // Swapped:  c(1,3,2)[as.numeric(fdata$status)] where levels are (cen=1,type1=2,type2=3)
  // as.numeric gives: 2,3,1,2,1,1,3,2,1,1,3,1,2,1
  // c(1,3,2)[...]:    3,2,1,3,1,1,2,3,1,1,2,1,3,1  → re-encoded to factor levels:
  //                    type2,type1,cen,type2,cen,cen,type1,type2,cen,cen,type1,cen,type2,cen
  // So in integer: 2,1,0,2,0,0,1,2,0,0,1,0,2,0
  const swappedStatus = [2, 1, 0, 2, 0, 0, 1, 2, 0, 0, 1, 0, 2, 0];
  const allTime = [...time, ...time];
  const allStatus = [...status, ...swappedStatus];
  const allStrata = [
    ...Array(14).fill(0),
    ...Array(14).fill(1),
  ];

  const result = finegray({
    tstop: allTime,
    status: allStatus,
    strata: allStrata,
    etype: 1,
  });

  // First 19 rows should match test1
  const start1 = result.start.slice(0, 19);
  const stop1 = result.stop.slice(0, 19);
  const status1 = result.status.slice(0, 19);
  const wt1 = result.wt.slice(0, 19);

  assertArrayClose(start1, ref.test3_fgstart_1, TOL, "strata1 fgstart");
  assertArrayClose(stop1, ref.test3_fgstop_1, TOL, "strata1 fgstop");
  assertArrayClose(
    status1.map(Number),
    ref.test3_fgstatus_1,
    TOL,
    "strata1 fgstatus",
  );
  assertArrayClose(wt1, ref.test3_fgwt_1, TOL, "strata1 fgwt");

  // Rows 20-38 should match test2
  const start2 = result.start.slice(19, 38);
  const stop2 = result.stop.slice(19, 38);
  const status2 = result.status.slice(19, 38);
  const wt2 = result.wt.slice(19, 38);

  assertArrayClose(start2, ref.test3_fgstart_2, TOL, "strata2 fgstart");
  assertArrayClose(stop2, ref.test3_fgstop_2, TOL, "strata2 fgstop");
  assertArrayClose(
    status2.map(Number),
    ref.test3_fgstatus_2,
    TOL,
    "strata2 fgstatus",
  );
  assertArrayClose(wt2, ref.test3_fgwt_2, TOL, "strata2 fgwt");
});

Deno.test("finegray: left truncation (delayed entry)", () => {
  const tstart = [0, 0, 0, 3, 2, 0, 0, 1, 0, 7, 5, 0, 0, 0];
  const tstop = [1, 2, 3, 4, 4, 4, 5, 5, 6, 8, 8, 9, 10, 12];
  const st = [1, 2, 0, 1, 0, 0, 2, 1, 0, 0, 2, 0, 1, 0];
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const result = finegray({
    tstart,
    tstop,
    status: st,
    id: ids,
    counting: true,
    etype: 1,
  });

  expect(result.start.length).toBe(ref.fg3_fgstart.length);
  assertArrayClose(result.start, ref.fg3_fgstart, TOL, "fg3 fgstart");
  assertArrayClose(result.stop, ref.fg3_fgstop, TOL, "fg3 fgstop");
  assertArrayClose(
    result.status.map(Number),
    ref.fg3_fgstatus,
    TOL,
    "fg3 fgstatus",
  );
  assertArrayClose(result.wt, ref.fg3_fgwt, TOL, "fg3 fgwt");
});
