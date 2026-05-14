# Type System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **TypeScript knows column types automatically** | Generic `DataFrame<Row>` type preserves row structure. When you access `df.age`, TypeScript knows it's `readonly number[]` based on your data. |
| **Types update through operations** | Operations compute new types: `mutate()` adds columns to type, `select()` narrows to selected columns, `join()` merges types correctly. |
| **Grouping tracked in types** | `GroupedDataFrame<Row, "category">` tracks which columns you grouped by. TypeScript knows grouping keys. |
| **Async operations stay type-safe** | `PromisedDataFrame<Row>` preserves types through async chains. After `await`, you get back `DataFrame<Row>` with correct types. |
| **Join results have correct types** | Left joins add `undefined` to right-side columns in type. Properties always exist (can be `undefined`), enabling type narrowing. |
| **IntelliSense works everywhere** | TypeScript provides autocomplete for columns, methods, and parameters based on DataFrame type. |
| **Catch errors at compile time** | Type errors prevent common mistakes like accessing non-existent columns or using wrong types in operations. |

## Join Type Rules

| Goal | Implementation |
|------|----------------|
| **Properties always exist** | Join results use `T \| undefined` (explicit undefined), never `T?` (optional property). This means properties are always present, values may be undefined. |
| **Type narrowing works** | You can use `if (row.homeworld !== undefined)` and TypeScript narrows the type correctly. |
| **Destructuring works** | `const { homeworld } = row` always works - property exists, just might be undefined. |

## Benefits

- **Compile-time safety**: Catch errors before running code
- **IntelliSense**: Autocomplete for columns and methods
- **Type narrowing**: Standard checks work correctly
- **Prevents bugs**: Can't accidentally access wrong columns
