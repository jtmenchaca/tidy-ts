#!/usr/bin/env -S deno run --allow-read

import { ptukey } from "../../../ts/stats/distributions/studentized-range.ts";

console.log("=== DEBUGGING PTUKEY ===");
console.log("Testing ptukey(1.414214, 3, 12)");
console.log("Expected from R: 0.4092294");
console.log("My implementation:", ptukey(1.414214, 3, 12, true));
console.log("1 - my implementation:", 1 - ptukey(1.414214, 3, 12, true));
console.log("");
console.log("Expected final p-value: 0.5907706");
console.log("My tukeyPValue gives:", 1 - ptukey(1.414214, 3, 12, true));