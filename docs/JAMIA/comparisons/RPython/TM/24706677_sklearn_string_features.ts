/**
 * RPython SO#24706677 — sklearn GradientBoostingClassifier with string features
 * Effect: Crash
 * Bug class: Type coercion
 *
 * Python bug: GradientBoostingClassifier.fit(X, y) requires all numeric features.
 * One column contains strings (e.g., iris species names mixed with numeric features).
 * sklearn crashes: "could not convert string to float".
 *
 * In tidy-ts, statistical modeling functions require number[] inputs. Passing a string
 * column where a numeric feature vector is expected is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const X_train = createDataFrame([
  { feature0: "setosa", feature1: 5.1, feature2: 3.5, feature3: 1.4, feature4: 0.2 },
  { feature0: "versicolor", feature1: 4.9, feature2: 3.0, feature3: 1.4, feature4: 0.2 },
  { feature0: "virginica", feature1: 7.0, feature2: 3.2, feature3: 4.7, feature4: 1.4 },
]);

// The SO user's intent: fit a model using all features including the string column.
// sklearn.fit() requires numeric arrays — the string feature crashes it.
// tidy-ts: s.glm requires Row extends Record<string, number>. A DataFrame with
// a string column does not satisfy this constraint — the model fit is rejected.
// @ts-expect-error — Type '{ feature0: string; ... }' does not satisfy 'Record<string, number>'
s.glm({ formula: "feature1 ~ feature0 + feature2", family: "gaussian", link: "identity", data: X_train });
