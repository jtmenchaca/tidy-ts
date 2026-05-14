# Error Class Comparison Tables

## Category 1: Column & Schema Reference

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a: misspelled column name in expression | error | error | N/A | error | N/A | error | N/A |
| b: nonexistent column in predicate | error | error | N/A | error | N/A | error | N/A |
| c: misspelled column name in sort | error | error | N/A | error | N/A | error | N/A |
| d: column dropped by selection still referenced | error | error | N/A | error | N/A | error | N/A |
| e: original column referenced after aggregation | error | error | N/A | error | N/A | error | N/A |
| f: dropped column used in sort | error | error | N/A | error | N/A | error | N/A |
| g: old column name used after rename | error | error | N/A | error | N/A | error | N/A |
| h: pre-aggregation column referenced after summarize | error | error | N/A | error | N/A | error | N/A |
| i: undeclared column after pivot | error | error | N/A | error | N/A | error | N/A |
| j: consumed column referenced after pivot | error | error | N/A | error | N/A | error | N/A |
| k: unselected column referenced after distinct | error | error | N/A | silent | all columns kept silently | silent | physician col dropped |
| l: narrowed schema after distinct without keep-all | error | error | N/A | silent | all columns kept silently | silent | all cols kept, arbitrary vals |
| m: unselected column referenced after select | error | error | N/A | silent | Silently dropped 2 columns | silent | Silently dropped 2 columns |
| n: error message lists available columns | error | error | N/A | error | N/A | error | N/A |
| o: error message on invalid column access | error | error | N/A | error | N/A | error | N/A |

## Category 2: Type Safety

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a: arithmetic on string column | error | silent | produced NaN silently | error | N/A | error | N/A |
| b: numeric aggregation on string column | error | warning | returned null with warning | error | N/A | warning | returned NA for each group |
| c: number compared to string literal | error | silent | returned 0 rows, no error | silent | returned 0 rows, no error | silent | returned 0 rows, no error |
| d: unparseable string silently becomes null/NaN | error | silent | 1 value coerced to NaN | silent | 1 value coerced to NaN | warning | 1 value coerced to NA |
| e: arithmetic on nullable after conversion | error | silent | null*2=0, 1 null coerced | silent | NaN propagated, 1 NaN | silent | NA propagated, 1 NA |
| f: aggregation skips null/NaN after conversion | error | silent | 1 unparseable became null | silent | mean skipped NaN silently | silent | mean returned NA silently |
| g: arithmetic on mixed-type return column | error | silent | NaN from string * 2 | silent | string repeated, not math | warning | 2 NA from character * 2 |
| h: invalid date string parse | — | error | N/A | silent | Invalid date became NaT | silent | Invalid date produced NA |
| i: date compared to number | error | silent | 0 rows (date > 100) | error | N/A | silent | 2 rows (date > 100) |
| j: date + number arithmetic | error | error | N/A | error | N/A | silent | date+7=2024-01-22 |
| k: numeric function applied to string column | error | silent | Math.log returned NaN column | silent | String repeated, not doubled | error | N/A |
| l: arithmetic on transposed mixed-type column | error | silent | "systolic"*2=NaN | silent | str*2='systolicsystolic' | error | N/A |
| m: pre-transpose column name after transpose | error | error | N/A | error | N/A | error | N/A |
| n: filter on invalid enum value | error | silent | 0 rows (silent empty) | silent | 0 rows (silent empty) | silent | 0 rows (silent empty) |

## Category 3: Null & Missing Data

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a: method call on nullable column | error | error | N/A | silent | NaN propagated silently | silent | NA propagated silently |
| b: arithmetic on nullable column | error | silent | null coerced to 0 silently | silent | NaN propagated silently | silent | NA propagated silently |
| c: comparison on nullable column | error | silent | null rows silently dropped (1) | silent | 2 NaN rows silently dropped | silent | 2 NA rows silently dropped |
| d: arithmetic on nullable before narrowing | error | silent | 1 Infinity from null div | silent | 2 NaN from null div | silent | 2 NA from null div |
| e: arithmetic after re-introducing null | error | silent | 1 Infinity after re-null | silent | 4 NaN after re-null div | silent | 4 NA after re-null div |
| f: mean on nullable column then arithmetic | error | silent | 1 null*2 coerced to 0 | silent | mean*2 skipped NaN silently | silent | mean*2 returned NA: TRUE |
| g: sum on nullable column then arithmetic | error | silent | 1 null*2 coerced to 0 | silent | sum*2 skipped NaN silently | silent | sum*2 returned NA: TRUE |
| h: min on nullable column then arithmetic | error | silent | 1 null*2 coerced to 0 | silent | min*2 skipped NaN silently | silent | min*2 returned NA: TRUE |
| i: groupby mean on nullable column then arithmetic | error | silent | 1 null+1 coerced to 1 | silent | 2 NaN+1 still NaN | silent | 2 NA+1 still NA |
| j: sum silently skips or returns null | error | silent | Skipped null, returned number | silent | Skipped 1 NaN, returned 1700 | silent | sum() returned NA silently |
| k: arithmetic on null-skipped aggregation result | error | silent | Divided null-skipped sum by 2 | silent | Divided NaN-skipped sum by 2 | silent | NA propagated through division |
| l: shift/lag introduces null at boundary | error | silent | lag() introduced 1 undefined | silent | shift() introduced 1 NaN | silent | lag() introduced 1 NA |
| m: arithmetic on lagged null propagates | error | silent | NaN produced in subtraction | silent | NaN propagated in subtraction | silent | NA propagated in subtraction |
| n: sort silently places null at end | error | silent | Nulls sorted to end | silent | NaN silently placed at end | silent | NA silently placed at end |
| o: arithmetic on null from missing pivot combination | error | silent | 145-undefined=NaN | silent | 145-NaN=nan | silent | 145-NA=NA |

## Category 4: Join Safety

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a: join on key not in left table | error | error | N/A | error | N/A | error | N/A |
| b: join on misspelled key | error | error | N/A | error | N/A | error | N/A |
| c: access missing column post-join | error | error | N/A | error | N/A | error | N/A |
| d: string method on join-introduced null | error | error | N/A | silent | produced 2 NaN silently | silent | produced 2 NA silently |
| e: arithmetic on join-introduced null | error | silent | produced NaN silently | silent | produced 2 NaN silently | silent | produced 2 NA silently |
| f: comparison silently excludes null rows | error | silent | excluded undefined rows | silent | excluded 2 NaN rows | silent | excluded 2 NA rows |
| g: explicit suffix then access original name | error | error | N/A | error | N/A | error | N/A |
| h: default suffix then access original name | error | error | N/A | error | N/A | error | N/A |

## Category 5: Schema Composition

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a: non-numeric value in numeric column at load time | — | error | N/A | silent | mixed types silently accepted | warning | non-numeric coerced to NA |
| b: accessing nonexistent column after schema-validated load | error | error | N/A | error | N/A | error | N/A |
| c: empty cell in non-null column at load time | — | error | N/A | silent | 2 cells silently became NaN | silent | 2 cells silently became NA |
| d: accessing optional column after mismatched row bind | error | error | N/A | silent | NaN-filled 2 missing cols | silent | NA-filled 2 missing cols |
| e: string operation on NaN/NA column after row bind | error | error | N/A | silent | NaN propagated to 2 rows | silent | NA propagated to 2 rows |
| f: implicit type coercion when binding rows with different column types | error | silent | mixed types in column | silent | coerced to 'object' dtype | error | N/A |
| g: arithmetic on mixed-type column after coerced row bind | error | silent | strings produce NaN | silent | strings repeated, not math | silent | logical coerced to numeric |
| h: appending row with missing column | error | error | N/A | silent | Missing col filled with NaN | silent | Missing col filled with NA |
| i: appending row with wrong column type | error | error | N/A | silent | Age dtype coerced to object | error | N/A |
| j: string operation on duplicate column name | error | silent | Last value wins, .upper() w... | error | N/A | error | N/A |

## Category 6: Contextual & Runtime Safety

| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a: residual grouping after summarize | error | error | N/A | silent | produced MultiIndex silently | silent | gave 2 rows, not 1 |
| b: arithmetic on empty sum | — | silent | [] (0 rows) | silent | sum()=0, 0*2=0 | silent | sum()=0, 0*2=0 |
| c: arithmetic on empty mean | — | silent | [] (0 rows) | silent | mean()=NaN, NaN*2=NaN | silent | mean()=NaN, NaN*2=NaN |
| d: null vs missing conflated | error | error | N/A | silent | null and missing both NaN | silent | null and missing both NA |
| e: conditional fill on null vs missing | error | error | N/A | silent | both filled identically | silent | both filled identically |

