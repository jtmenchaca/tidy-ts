import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("toString()", () => {
  const df = createDataFrame([
    { name: "John", age: 30 },
    { name: "Jane", age: 25 },
  ]);

  const stringval = df.toString();

  console.log("--------------------------------");
  console.log(stringval);
});
