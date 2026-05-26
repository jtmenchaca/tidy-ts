import { peekCSV } from "@tidy-ts/dataframe";

const result = await peekCSV(
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/component_names.csv",
);
console.log(result);
