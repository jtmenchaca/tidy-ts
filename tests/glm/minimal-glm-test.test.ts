import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "../../src/dataframe/mod.ts";
import { test } from "../shims/test.ts";

test("glm", () => {
  const data = createDataFrame({
    columns: {
      y: [1, 3, 18, 10, 25],
      x: [1, 2, 3, 4, 5],
    },
  });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data,
  });
  console.log(result);
});
