# Error Class Comparison Tables

## Error Class 01: Column Reference Errors

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1a: mutate(r.patientId) | error | error | N/A | error | N/A | error | N/A |
| 1b: filter(r.diagnosis) | error | error | N/A | error | N/A | error | N/A |
| 1c: arrange('result_values') | error | error | N/A | error | N/A | error | N/A |

## Error Class 02: Type Mismatch Errors

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2a: test_name * 10 | error | silent | produced NaN silently | error | N/A | error | N/A |
| 2b: mean(test_name) | error | warning | returned null with warning | error | N/A | warning | returned NA for each group |
| 2c: result_value === 'high' | error | silent | returned 0 rows, no error | silent | returned 0 rows, no error | silent | returned 0 rows, no error |

## Error Class 03: Join Key Errors

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3a: join on missing key | error | error | N/A | error | N/A | error | N/A |
| 3b: join on misspelled key | error | error | N/A | error | N/A | error | N/A |
| 3c: access missing col post-join | error | error | N/A | error | N/A | error | N/A |

## Error Class 04: Schema Evolution Through Pipelines

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4a: access dropped col after select | error | error | N/A | error | N/A | error | N/A |
| 4b: access col after summarize | error | error | N/A | error | N/A | error | N/A |
| 4c: sort by dropped col | error | error | N/A | error | N/A | error | N/A |

## Error Class 05: Null Safety Errors

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5a: method on nullable col | error | error | N/A | silent | NaN propagated silently | silent | NA propagated silently |
| 5b: arithmetic on nullable col | error | silent | null coerced to 0 silently | silent | NaN propagated silently | silent | NA propagated silently |
| 5c: comparison on nullable col | error | silent | null rows silently dropped (1) | silent | 2 NaN rows silently dropped | silent | 2 NA rows silently dropped |

## Error Class 06: Schema Validation at Data Boundaries

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6a: non-numeric in numeric col | — | error | N/A | silent | mixed types silently accepted | warning | non-numeric coerced to NA |
| 6b: missing column after load | error | error | N/A | error | N/A | error | N/A |
| 6c: empty cells in non-null col | — | error | N/A | silent | 2 cells silently became NaN | silent | 2 cells silently became NA |

## Error Class 07: Pipeline Composition Errors

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7a: old name after rename | error | error | N/A | error | N/A | error | N/A |
| 7b: col removed by summarize | error | error | N/A | error | N/A | error | N/A |

## Error Class 08: Async/Sync Confusion

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8a: filter on async-mutated col | error | error | N/A | silent | 0 rows (coroutine != 'none') | — | — |

## Error Class 09: Forbidden Array Methods / API Escape

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9a: .map() / direct mutation | error | error | N/A | silent | age set to -5, no error | warning | typo returned NULL silently |
| 9b: .push() / mixed apply | error | error | N/A | silent | dtype became object (mixed) | silent | col type changed to character |
| 9c: .reduce() / type coercion | error | error | N/A | silent | string concat via .values | silent | loop concat: 17 chars |

## Error Class 10: Type Conversion and Narrowing

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10a: arithmetic on string col | error | silent | 1 value coerced to NaN | silent | 1 value coerced to NaN | warning | 1 value coerced to NA |
| 10b: arithmetic on nullable | error | silent | null*2=0, 1 null coerced | silent | NaN propagated, 1 NaN | silent | NA propagated, 1 NA |
| 10c: mean after conversion | error | silent | 1 unparseable became null | silent | mean skipped NaN silently | silent | mean returned NA silently |

## Error Class 11: Null Narrowing via replaceNull / removeNull

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11a: arithmetic on nullable col | error | silent | 1 Infinity from null div | silent | 2 NaN from null div | silent | 2 NA from null div |
| 11b: arithmetic after re-introducing null | error | silent | 1 Infinity after re-null | silent | 4 NaN after re-null div | silent | 4 NA after re-null div |

## Error Class 12: Aggregation on Columns with Missing Data

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12a: mean on NaN/NA col | error | silent | 1 null*2 coerced to 0 | silent | mean*2 skipped NaN silently | silent | mean*2 returned NA: TRUE |
| 12b: sum on NaN/NA col | error | silent | 1 null*2 coerced to 0 | silent | sum*2 skipped NaN silently | silent | sum*2 returned NA: TRUE |
| 12c: min on NaN/NA col | error | silent | 1 null*2 coerced to 0 | silent | min*2 skipped NaN silently | silent | min*2 returned NA: TRUE |
| 12d: groupby mean NaN/NA | error | silent | 1 null+1 coerced to 1 | silent | 2 NaN+1 still NaN | silent | 2 NA+1 still NA |

## Error Class 13: Bind Rows Schema Mismatch

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 13a: access optional col | error | error | N/A | silent | NaN-filled 2 missing cols | silent | NA-filled 2 missing cols |
| 13b: string op on NaN/NA | error | error | N/A | silent | NaN propagated to 2 rows | silent | NA propagated to 2 rows |

## Error Class 14: Pivot Type Safety

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 14a: undeclared pivot col | error | error | N/A | error | N/A | error | N/A |
| 14b: pre-pivot col gone | error | error | N/A | error | N/A | error | N/A |

## Error Class 15: Distinct Column Narrowing

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15a: access dropped col | error | error | N/A | silent | all columns kept silently | silent | physician col dropped |
| 15b: distinct .keep_all | error | error | N/A | silent | all columns kept silently | silent | all cols kept, arbitrary vals |

## Error Class 16: Return Type Consistency in Mutate

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 16a: arithmetic on union col | error | silent | NaN from string * 2 | silent | string repeated, not math | warning | 2 NA from character * 2 |

## Error Class 17: Join Nullability

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 17a: method on join-null | error | error | N/A | silent | produced 2 NaN silently | silent | produced 2 NA silently |
| 17b: arithmetic on join-null | error | silent | produced NaN silently | silent | produced 2 NaN silently | silent | produced 2 NA silently |
| 17c: comparison excludes null | error | silent | excluded undefined rows | silent | excluded 2 NaN rows | silent | excluded 2 NA rows |

## Error Class 18: Column Name Collision in Joins

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 18a: explicit suffix — access original name | error | error | N/A | error | N/A | error | N/A |
| 18b: no suffix — access original name | error | error | N/A | error | N/A | error | N/A |

## Error Class 19: GroupBy State Tracking

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 19b: multi-group state | error | error | N/A | silent | produced MultiIndex silently | silent | gave 2 rows, not 1 |

## Error Class 20: Implicit Type Coercion in Row Binding

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20a: bindRows type mismatch | error | silent | mixed types in column | silent | coerced to 'object' dtype | error | N/A |
| 20b: arithmetic on mixed col | error | silent | strings produce NaN | silent | strings repeated, not math | silent | logical coerced to numeric |

## Error Class 21: Aggregation Return Type Narrowing

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21a: sum skips/returns NA | error | silent | Skipped null, returned number | silent | Skipped 1 NaN, returned 1700 | silent | sum() returned NA silently |
| 21b: arithmetic on NA result | error | silent | Divided null-skipped sum by 2 | silent | Divided NaN-skipped sum by 2 | silent | NA propagated through division |

## Error Class 22: Temporal Type Safety

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 22a: invalid date parse | — | error | N/A | silent | Invalid date became NaT | silent | Invalid date produced NA |
| 22b: date compared to number | error | silent | 0 rows (date > 100) | error | N/A | silent | 2 rows (date > 100) |
| 22c: date + number arithmetic | error | error | N/A | error | N/A | silent | date+7=2024-01-22 |

## Error Class 24: Window Function Output Type

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 24a: shift/lag introduces null | error | silent | lag() introduced 1 undefined | silent | shift() introduced 1 NaN | silent | lag() introduced 1 NA |
| 24b: arithmetic on lagged null | error | silent | NaN produced in subtraction | silent | NaN propagated in subtraction | silent | NA propagated in subtraction |

## Error Class 25: Column Type Constraint in Specialized Verbs

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25a: numeric op on string col | error | silent | Math.log returned NaN column | silent | String repeated, not doubled | error | N/A |

## Error Class 26: Sorting on Nullable Columns

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 26a: sort places null at end | error | silent | Nulls sorted to end | silent | NaN silently placed at end | silent | NA silently placed at end |
| 26b: rank with null | error | silent | null * 2 coerced to 0 | silent | NaN rank returned as NaN | silent | 1 NA rank produced silently |

## Error Class 27: Append Row Type Mismatch

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 27a: missing col in append | error | error | N/A | silent | Missing col filled with NaN | silent | Missing col filled with NA |
| 27b: wrong type in append | error | error | N/A | silent | Age dtype coerced to object | error | N/A |

## Error Class 28: Reorder vs Select Schema Preservation

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 28a: access dropped after select | error | error | N/A | silent | Silently dropped 2 columns | silent | Silently dropped 2 columns |

## Error Class 29: Empty DataFrame Operations

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 29a: arithmetic on empty sum | — | silent | [] (0 rows) | silent | sum()=0, 0*2=0 | silent | sum()=0, 0*2=0 |
| 29b: arithmetic on empty mean | — | silent | [] (0 rows) | silent | mean()=NaN, NaN*2=NaN | silent | mean()=NaN, NaN*2=NaN |

## Error Class 30: Row Label Transpose Type Safety

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 30a: arithmetic on transposed col | error | silent | "systolic"*2=NaN | silent | str*2='systolicsystolic' | error | N/A |
| 30b: pre-transpose col after transpose | error | error | N/A | error | N/A | error | N/A |

## Error Class 31: Nullable vs Optional Distinction

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31a: null vs missing conflated | error | error | N/A | silent | null and missing both NaN | silent | null and missing both NA |
| 31b: conditional fill on null vs missing | error | error | N/A | silent | both filled identically | silent | both filled identically |

## Error Class 33: Duplicate Column Names

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 33a: .upper() on duplicate col | error | silent | Last value wins, .upper() w... | error | N/A | error | N/A |

## Error Class 34: Enum Validation

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 34a: filter on invalid enum value | error | silent | 0 rows (silent empty) | silent | 0 rows (silent empty) | silent | 0 rows (silent empty) |

## Error Class 35: Pivot Column Mismatch

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 35a: arithmetic on pivot null | error | silent | 145-undefined=NaN | silent | 145-NaN=nan | silent | 145-NA=NA |

## Error Class 36: Column Existence Error Messages

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 36a: error with col list | error | error | N/A | error | N/A | error | N/A |
| 36b: dot access error msg | error | error | N/A | error | N/A | error | N/A |

