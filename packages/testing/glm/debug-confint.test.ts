#!/usr/bin/env -S deno test --allow-all
import { glmFit } from "../../dataframe/ts/wasm/glm-functions.ts";
import { initWasm, wasmInternal } from "../../dataframe/ts/wasm/wasm-init.ts";

Deno.test("debug field types", () => {
  initWasm();

  const data = {
    y: [1.2, 2.3, 3.1, 4.5, 5.2, 6.1, 7.3, 8.0, 9.1, 10.2],
    x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  };

  const result = glmFit("y ~ x", "gaussian", "identity", data) as any;

  // Check all string fields
  const stringFields = ["call", "formula", "data", "method", "naAction", "responseVariableName"];
  for (const f of stringFields) {
    console.log(`${f}: ${typeof result[f]} = ${typeof result[f] === 'string' ? result[f].substring(0, 60) : JSON.stringify(result[f])?.substring(0, 60)}`);
  }

  // Check family object
  console.log("\nfamily:", typeof result.family);
  if (result.family) {
    for (const k of Object.keys(result.family)) {
      const v = result.family[k];
      console.log(`  family.${k}: ${typeof v} = ${typeof v === 'string' ? v.substring(0, 60) : v}`);
    }
  }

  // Check model
  console.log("\nmodel:", typeof result.model);
  if (result.model) {
    for (const k of Object.keys(result.model)) {
      const v = result.model[k];
      console.log(`  model.${k}: ${typeof v}`);
    }
  }

  // Check terms
  console.log("\nterms:", typeof result.terms);
  if (result.terms) {
    for (const k of Object.keys(result.terms)) {
      const v = result.terms[k];
      console.log(`  terms.${k}: ${typeof v} = ${typeof v === 'string' ? v : Array.isArray(v) ? `array[${v.length}]` : typeof v}`);
    }
  }

  // Check x (ModelMatrix)
  console.log("\nx:", typeof result.x);
  if (result.x) {
    for (const k of Object.keys(result.x)) {
      const v = result.x[k];
      console.log(`  x.${k}: ${typeof v} = ${typeof v === 'string' ? v.substring(0, 60) : Array.isArray(v) ? `array[${v.length}]` : v}`);
    }
  }
});
