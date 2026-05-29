/**
 * ID: SO#24706677
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: sklearn GradientBoosting doesn't handle string/categorical features. Numeric expected.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
from sklearn import datasets
from sklearn.ensemble import GradientBoostingClassifier
import pandas

iris = datasets.load_iris()
X = iris.data[(iris.target == 0) | (iris.target == 1)]
Y = iris.target[(iris.target == 0) | (iris.target == 1)]

train_indices = list(range(40)) + list(range(50, 90))
X_train = pandas.DataFrame(X[train_indices])
X_train[0] = ["a"] * 40 + ["b"] * 40
y_train = Y[train_indices]

GradientBoostingClassifier(learning_rate=0.01, max_depth=8, n_estimators=50).fit(X_train, y_train)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const X_train = createDataFrame([
  { feature0: "setosa", feature1: 5.1, feature2: 3.5, feature3: 1.4, feature4: 0.2 },
  { feature0: "versicolor", feature1: 4.9, feature2: 3.0, feature3: 1.4, feature4: 0.2 },
  { feature0: "virginica", feature1: 7.0, feature2: 3.2, feature3: 4.7, feature4: 1.4 },
]);

// @ts-expect-error — Type 'DataFrame<{ feature0: string; ... }>' is not assignable to type 'DataFrame<Record<string, number>>'.
s.glm({ formula: "feature1 ~ feature0 + feature2", family: "gaussian", link: "identity", data: X_train });
