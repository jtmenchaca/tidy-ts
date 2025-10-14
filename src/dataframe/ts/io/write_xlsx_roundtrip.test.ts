import { readXLSX } from "./read_xlsx.ts";
import { writeXLSX } from "./write_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

/**
 * Roundtrip tests: Read XLSX → Write to temp XLSX → Read temp XLSX → Compare
 *
 * These tests ensure that writeXLSX produces valid XLSX files that can be
 * read back by readXLSX with identical data.
 */

Deno.test("roundtrip - mixed-types.xlsx", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    score: z.number(),
    active: z.boolean(),
    date: z.number(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/mixed-types.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.ncols()).toBe(original.ncols());
    expect(reloaded.columns()).toEqual(original.columns());
    expect(reloaded.toArray()).toEqual(original.toArray());
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - single-row.xlsx", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.toArray()).toEqual(original.toArray());
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - empty-cells.xlsx", async () => {
  const schema = z.object({
    col1: z.string().optional(),
    col2: z.string().optional(),
    col3: z.string().optional(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/empty-cells.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.toArray()).toEqual(original.toArray());
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - wide-table.xlsx", async () => {
  // Wide table has columns: a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,aa,ab,ac,ad,ae
  const cols = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "aa",
    "ab",
    "ac",
    "ad",
    "ae",
  ];
  const schemaObj: Record<string, z.ZodString> = {};
  for (const col of cols) {
    schemaObj[col] = z.string();
  }
  const schema = z.object(schemaObj);

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/wide-table.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.ncols()).toBe(original.ncols());
    expect(reloaded.toArray()).toEqual(original.toArray());
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - large-numbers.xlsx", async () => {
  const schema = z.object({
    id: z.number(),
    value: z.number(),
    scientific: z.number(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/large-numbers.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());

    const origRows = original.toArray();
    const reloadRows = reloaded.toArray();

    for (let i = 0; i < origRows.length; i++) {
      expect(reloadRows[i].id).toBe(origRows[i].id);
      expect(reloadRows[i].value).toBe(origRows[i].value);
      // Use toBeCloseTo for scientific notation numbers
      expect(reloadRows[i].scientific).toBeCloseTo(origRows[i].scientific, 10);
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - long-strings.xlsx", async () => {
  const schema = z.object({
    id: z.number(),
    description: z.string(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/long-strings.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.toArray()).toEqual(original.toArray());
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - special-chars.xlsx", async () => {
  const schema = z.object({
    text: z.string().optional(),
    symbols: z.string().optional(),
    unicode: z.string().optional(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/special-chars.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.toArray()).toEqual(original.toArray());
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - date-boolean.xlsx", async () => {
  const schema = z.object({
    id: z.number(),
    ok: z.boolean(),
    when: z.date(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/date-boolean.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());

    const origRows = original.toArray();
    const reloadRows = reloaded.toArray();

    for (let i = 0; i < origRows.length; i++) {
      expect(reloadRows[i].id).toBe(origRows[i].id);
      expect(reloadRows[i].ok).toBe(origRows[i].ok);
      // Compare dates by time value
      expect(reloadRows[i].when.getTime()).toBe(origRows[i].when.getTime());
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - mtcars.xlsx", async () => {
  const schema = z.object({
    model: z.string(),
    mpg: z.number(),
    cyl: z.number(),
    disp: z.number(),
    hp: z.number(),
    drat: z.number(),
    wt: z.number(),
    qsec: z.number(),
    vs: z.number(),
    am: z.number(),
    gear: z.number(),
    carb: z.number(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/mtcars.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.ncols()).toBe(original.ncols());

    const origRows = original.toArray();
    const reloadRows = reloaded.toArray();

    for (let i = 0; i < origRows.length; i++) {
      expect(reloadRows[i].model).toBe(origRows[i].model);
      // Compare numeric columns with toBeCloseTo to handle floating point precision
      expect(reloadRows[i].mpg).toBeCloseTo(origRows[i].mpg, 5);
      expect(reloadRows[i].cyl).toBe(origRows[i].cyl);
      expect(reloadRows[i].disp).toBeCloseTo(origRows[i].disp, 5);
      expect(reloadRows[i].hp).toBe(origRows[i].hp);
      expect(reloadRows[i].drat).toBeCloseTo(origRows[i].drat, 5);
      expect(reloadRows[i].wt).toBeCloseTo(origRows[i].wt, 5);
      expect(reloadRows[i].qsec).toBeCloseTo(origRows[i].qsec, 5);
      expect(reloadRows[i].vs).toBe(origRows[i].vs);
      expect(reloadRows[i].am).toBe(origRows[i].am);
      expect(reloadRows[i].gear).toBe(origRows[i].gear);
      expect(reloadRows[i].carb).toBe(origRows[i].carb);
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - penguins.xlsx", async () => {
  const schema = z.object({
    species: z.string(),
    island: z.string(),
    bill_length_mm: z.number().optional(),
    bill_depth_mm: z.number().optional(),
    flipper_length_mm: z.number().optional(),
    body_mass_g: z.number().optional(),
    sex: z.string().optional(),
    year: z.number(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/penguins.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.ncols()).toBe(original.ncols());

    const origRows = original.toArray();
    const reloadRows = reloaded.toArray();

    // Spot check a few rows
    for (let i = 0; i < Math.min(10, origRows.length); i++) {
      expect(reloadRows[i].species).toBe(origRows[i].species);
      expect(reloadRows[i].island).toBe(origRows[i].island);
      expect(reloadRows[i].year).toBe(origRows[i].year);

      // Handle optional numeric fields
      if (origRows[i].bill_length_mm !== undefined) {
        expect(reloadRows[i].bill_length_mm).toBeCloseTo(
          origRows[i].bill_length_mm!,
          5,
        );
      } else {
        expect(reloadRows[i].bill_length_mm).toBeUndefined();
      }
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("roundtrip - user-info.xlsx", async () => {
  const schema = z.object({
    user_id: z.number(),
    full_name: z.string(),
    email_address: z.string(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/user-info.xlsx",
    schema,
  );
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);

    expect(reloaded.nrows()).toBe(original.nrows());
    expect(reloaded.toArray()).toEqual(original.toArray());
  } finally {
    await Deno.remove(tempPath);
  }
});
