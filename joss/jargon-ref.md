# De-Jargoning Reference

Guidelines and examples for keeping the paper accessible to clinical researchers who may not write TypeScript.

## Principle

Replace terms that assume the reader writes TypeScript with descriptions of **what happens to the data**. A clinical researcher should be able to read every table cell and figure label without needing to look anything up.

## Category and Header Names

| Before | After | Why |
|---|---|---|
| Schema composition | Data loading & validation | "Schema" is developer jargon |
| Contextual & runtime | Hidden state | Describes the problem, not the mechanism |
| Example clinical error | Example error | Not all examples are specifically clinical |
| Type effect | What changes | Plain English |
| Clinical relevance | Clinical example | More direct |
| Tables and Figures to Include | *(removed)* | Unnecessary heading |

## TypeScript Type Notation → Plain English

| Before | After |
|---|---|
| `Pick<Row, Cols>` | Keeps only chosen columns |
| `Omit<Row, Cols>` | Removes specified columns |
| `Row & { col: T }` | Adds a new column |
| `GroupKeys & SummaryCols` | Produces a new, smaller table |
| `T \| undefined` | may be missing |
| Key substitution | Replaces a column name |
| Returns `(T \| undefined)[]` | Shifted values introduce missing at boundaries |
| Removes `null` from column type | Removes missing status from a column |
| Preserves row type | Nothing — columns unchanged |
| Column type replaced | Changes a column's data type |

## Example Errors Rewritten as Stories

The old versions described abstract operations. The new versions describe a scenario — how the error happens and what goes wrong.

| Before | After |
|---|---|
| Multiply lab test name by numeric factor | Lab result imported as text instead of number, then used in arithmetic |
| Divide by nullable reference range | Divide by a reference range that may be missing |
| Use department after left join without null check | Use department name after merging tables, without checking for unmatched records |
| Load invalid enum value for encounter status | Load an invalid status value for an encounter record |
| Residual grouping after summarize | Unexpected grouped behavior after computing a summary |

## Figure Text

| Before | After |
|---|---|
| nullability, and grouping state | *(evolved through several rounds)* |
| Row type tracks columns, value types, nullability, and grouping state. Each operation updates the type. | Tracks exact type of data in each column, including potential for missing or undefined values. Each data operation can update the tracked column data types. |
| type contract | data contract |
| Zod-backed runtime validation: reject wrong types, missing required fields, null in non-nullable fields, invalid categoricals | Runtime validation: rejects unexpected data types, missing required fields, unexpected null values, invalid categorical values |
| through a runtime validation boundary | through runtime data validation |
| Typed Transformations | Typed Data Transformations |

## Word-Level Swaps

These apply throughout the paper when appearing in clinical-facing descriptions (tables, figures, captions). Technical terms are still appropriate in the Methods and code-level discussion.

| Jargon | Plain |
|---|---|
| string | text |
| null / nullable | missing / may be missing |
| enum | status value, categorical value |
| left join | merging tables |
| null check | checking for unmatched records |
| binding rows | stacking tables |
| lagging | looking at a previous value |
