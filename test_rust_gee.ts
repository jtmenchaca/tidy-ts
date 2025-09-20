import { geeglmFit } from "./src/dataframe/ts/wasm/stats-functions.ts";

const data = {
  y: [1.1, 2.2, 3.3, 4.4, 5.5, 6.6],
  x1: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
  x2: [0.1, 0.3, 0.2, 0.4, 0.6, 0.5],
};

const id = [1, 1, 2, 2, 3, 3];

const result = geeglmFit(
  "y ~ x1 + x2",
  "gaussian",
  "identity",
  data,
  id,
  null,
  "exchangeable",
  "san.se",
);

console.log("Rust result:", JSON.stringify(result, null, 2));
