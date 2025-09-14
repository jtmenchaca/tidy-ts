# Join Type Rules

This document defines the formal type rules for all join operations in tidy-ts. These rules ensure type safety and predictable behavior across all join types.

## Notation

- `L` = Left DataFrame row type
- `R` = Right DataFrame row type  
- `K` = Join key(s) - subset of `keyof L & keyof R`
- `L\K` = All fields from L except the join keys
- `R\K` = All fields from R except the join keys
- `T | undefined` = Explicit undefined union (required property that can be undefined)
- `T?` = Optional property (property may not exist) - **NOT USED** in joins

## Core Principle

**All join operations return properties with explicit undefined unions (`T | undefined`), never optional properties (`T?`)**

This ensures that:
1. All properties always exist on result rows
2. TypeScript can properly narrow types using standard checks
3. Destructuring works predictably
4. Runtime behavior matches type expectations

## Join Type Laws

### Inner Join
```typescript
InnerJoin<L, R, K> → L ∪ (R\K)
```
- **Key fields**: Required (from L)
- **Non-key fields from L**: Required (preserved as-is)
- **Non-key fields from R**: Required (no undefined values)
- **Example**: `{ id: number, name: string, homeworld: string }`

### Left Join  
```typescript
LeftJoin<L, R, K> → L ∪ (R\K)?
```
- **Key fields**: Required (from L)
- **Non-key fields from L**: Required (preserved as-is)  
- **Non-key fields from R**: `T | undefined` (explicit undefined union)
- **Example**: `{ id: number, name: string, homeworld: string | undefined }`

### Right Join
```typescript
RightJoin<L, R, K> → (L\K)? ∪ R
```
- **Key fields**: Required (from R)
- **Non-key fields from L**: `T | undefined` (explicit undefined union)
- **Non-key fields from R**: Required (preserved as-is)
- **Example**: `{ id: number, name: string | undefined, homeworld: string }`

### Outer Join (Full Join)
```typescript
OuterJoin<L, R, K> → (L\K)? ∪ (R\K)? ∪ Pick<L, K>
```
- **Key fields**: Required (union of matching keys from both sides)
- **Non-key fields from L**: `T | undefined` (explicit undefined union)
- **Non-key fields from R**: `T | undefined` (explicit undefined union)  
- **Example**: `{ id: number, name: string | undefined, homeworld: string | undefined }`

### Cross Join
```typescript
CrossJoin<L, R> → L ∪ R
```
- **All fields**: Required (Cartesian product, no undefined values)
- **Name conflicts**: Resolved using suffixes
- **Example**: `{ id: number, name: string, homeworld: string }`

### As-of Join
```typescript
AsofJoin<L, R, K> → L ∪ (R\K)?
```
- **Same as Left Join**: Temporal matching with left join semantics
- **Key fields**: Required (from L)
- **Non-key fields from R**: `T | undefined` (explicit undefined union)

## Implementation Details

### Utility Types

```typescript
// Convert all properties to explicit undefined unions
type MakeUndefined<T> = { [K in keyof T]: T[K] | undefined };

// Remove keys and make remaining properties undefined-able
type ExcludeKeysAndMakeUndefined<T, K extends keyof T> = 
  MakeUndefined<Omit<T, K>>;
```

### Type Enforcement

The type system enforces these rules through:

1. **Compile-time checking**: TypeScript validates join result types
2. **Runtime consistency**: Actual data structure matches type definitions
3. **Property existence**: All declared properties exist (never missing)
4. **Value consistency**: Undefined values are explicit, not missing properties

### Multi-Key Support

All join operations support both single keys and arrays of keys:

```typescript
// Single key
df1.leftJoin(df2, "id")

// Multiple keys  
df1.leftJoin(df2, ["dept_id", "year"])
```

### Different Column Names

When joining on columns with different names, **both key columns are preserved** in the result:

```typescript
// Object API with different column names
const employees = createDataFrame([
  { emp_id: 1, emp_dept: 10, name: "Alice" },
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
]);

const result = employees.leftJoin(departments, {
  keys: { left: "emp_dept", right: "dept_id" }
});

// Type: DataFrame<{
//   emp_id: number;
//   emp_dept: number;        // Left join key (preserved)
//   name: string;
//   dept_id: number | undefined;  // Right join key (preserved with undefined)
//   dept_name: string | undefined;
// }>

// Result data:
// [{ emp_id: 1, emp_dept: 10, name: "Alice", dept_id: 10, dept_name: "Engineering" }]
```

**Rationale**: Preserving both key columns:
1. **Maintains data integrity** - no information is lost
2. **Follows SQL semantics** - similar to `SELECT * FROM a LEFT JOIN b ON a.x = b.y`
3. **Enables verification** - you can verify the join worked correctly
4. **Supports complex scenarios** - useful when key values might differ slightly

## Examples

### Left Join Example
```typescript
const employees = createDataFrame([
  { id: 1, name: "Alice", dept_id: 10 },
  { id: 2, name: "Bob", dept_id: 20 },
  { id: 3, name: "Charlie", dept_id: 99 }, // No matching dept
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Sales" },
]);

const result = employees.leftJoin(departments, "dept_id");
// Type: DataFrame<{
//   id: number;
//   name: string; 
//   dept_id: number;
//   dept_name: string | undefined; // Explicit undefined union
// }>

// Result data:
// [
//   { id: 1, name: "Alice", dept_id: 10, dept_name: "Engineering" },
//   { id: 2, name: "Bob", dept_id: 20, dept_name: "Sales" }, 
//   { id: 3, name: "Charlie", dept_id: 99, dept_name: undefined }
// ]
```

### Type Safety Benefits

```typescript
// ✅ Safe destructuring (property always exists)
const { dept_name } = result.at(0)!; // dept_name: string | undefined

// ✅ Type narrowing works
if (dept_name !== undefined) {
  console.log(dept_name.toUpperCase()); // dept_name: string
}

// ✅ Property always accessible
result.dept_name; // readonly (string | undefined)[]
```

## Migration Notes

If upgrading from previous versions that used optional properties (`T?`):

1. **Type changes**: `homeworld?: string | undefined` becomes `homeworld: string | undefined`
2. **Runtime unchanged**: Data structure and values remain identical
3. **Code changes**: Remove optional chaining where properties are guaranteed to exist
4. **Type narrowing**: Standard `!== undefined` checks work reliably

## Validation

All join type rules are validated through:

1. **Unit tests**: Type assertions in test files verify correct inference
2. **Integration tests**: Multi-key joins test complex scenarios  
3. **Compiler checks**: `deno check` ensures type correctness
4. **Runtime tests**: Actual data matches expected structure