import { peekCSV } from "@tidy-ts/dataframe";

const result = await peekCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/survival/flchain.csv",
);
console.log(result);
