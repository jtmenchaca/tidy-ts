# TypeScript Type Generation Tutorial

A step-by-step guide to creating dynamic types that generate exact column names automatically.

## What We're Building

By the end of this tutorial, you'll be able to create types that automatically generate exact column names like this:

```typescript
// Input: columns ["score1", "score2"] with prefixes ["mean_", "sum_"]
// Output: exact type with all combinations
{
  mean_score1: number,
  mean_score2: number, 
  sum_score1: number,
  sum_score2: number
}
```

## Step 1: Literal Types - The Foundation

Before we can build complex types, we need to understand the difference between generic types and literal types.

### What's a Literal Type?

A literal type represents an exact value, not just any value of that type.

```typescript
// Generic types - can be any value
type AnyString = string;    // Any string: "hello", "world", "anything"
type AnyNumber = number;    // Any number: 1, 2, 3, 42, 100

// Literal types - exact values only  
type ExactString = "hello"; // Only the exact string "hello"
type ExactNumber = 42;      // Only the exact number 42
```

### Try It Yourself

```typescript
// These work because they match exactly
const greeting: ExactString = "hello";  // ✅
const answer: ExactNumber = 42;         // ✅

// These fail because they don't match exactly
const wrong: ExactString = "world";     // ❌ Error!
const wrong2: ExactNumber = 43;         // ❌ Error!
```

**Key Point**: Literal types are exact values, not categories of values.

## Step 2: Template Literal Types

Template literal types let you combine strings with other types to create new string types.

### Basic Template Literals

```typescript
// Combine a fixed string with a variable type
type Greeting = `Hello ${string}`;     // "Hello " + any string
type UserId = `user_${number}`;        // "user_" + any number
type ExactId = `user_${1}`;           // Exactly "user_1"
```

### How They Work

```typescript
// Template literal breakdown:
// `Hello ${string}` = "Hello " + any string
// `user_${number}` = "user_" + any number  
// `user_${1}` = "user_" + literal 1 = "user_1"
```

### Try It Yourself

```typescript
type UserId = `user_${string}`;
type UserId1 = `user_${1}`;

// These work:
const id1: UserId1 = "user_1";     // ✅ Exact match
const id2: UserId = "user_abc";    // ✅ Matches pattern

// These fail:
const id3: UserId1 = "user_2";     // ❌ Wrong number
const id4: UserId = "admin_123";   // ❌ Wrong prefix
```

**Key Point**: Template literals create new string types by combining fixed text with variable types.

## Step 3: Mapped Types - Transforming Objects

Mapped types let you take one object type and transform it into another by changing properties.

### Simple Mapped Type

Let's start with a basic example - making all properties optional:

```typescript
type MakeOptional<TObject> = {
  [Key in keyof TObject]?: TObject[Key];
};

// How it works:
type User = { name: string; age: number };
type OptionalUser = MakeOptional<User>;  // { name?: string; age?: number }
```

**Breaking it down:**
- `keyof TObject` gets all property names: `"name" | "age"`
- `[Key in keyof TObject]` iterates over each property name
- `TObject[Key]` gets the type of each property
- `?` makes each property optional

### Try It Yourself

```typescript
type User = { name: string; age: number };
type OptionalUser = MakeOptional<User>;

// These all work because properties are optional:
const user1: OptionalUser = { name: "John" };           // ✅
const user2: OptionalUser = { name: "Jane", age: 25 };  // ✅
const user3: OptionalUser = { age: 30 };                // ✅
const user4: OptionalUser = {};                         // ✅
```

### Key Remapping - Changing Property Names

You can also change the property names using the `as` keyword:

```typescript
type AddPrefix<TObject> = {
  [Key in keyof TObject as `prefix_${Key & string}`]: TObject[Key];
};

// How it works:
type Data = { name: string; age: number };
type PrefixedData = AddPrefix<Data>;  // { prefix_name: string; prefix_age: number }
```

**Breaking it down:**
- `Key in keyof TObject` iterates over property names
- `as` lets you change the property name
- `` `prefix_${Key & string}` `` creates new names by adding "prefix_"
- `TObject[Key]` keeps the original property type

### Try It Yourself

```typescript
type Data = { name: string; age: number };
type PrefixedData = AddPrefix<Data>;

// This works:
const data1: PrefixedData = { prefix_name: "John", prefix_age: 25 };  // ✅

// This fails:
const data2: PrefixedData = { name: "Jane", age: 30 };                // ❌ Wrong property names
```

**Key Point**: Mapped types let you transform objects by changing properties or their names.

## Step 4: Working with Arrays - The Magic Key

Now we'll learn the secret to transforming arrays into objects at the type level.

### Understanding Tuple Types

First, let's understand the difference between regular arrays and tuple types:

```typescript
// Regular array - can have any number of strings
type RegularArray = string[];

// Tuple type - exactly 3 specific strings
type TupleType = ["apple", "banana", "cherry"];
```

**Key difference**: Tuple types tell TypeScript exactly what elements are in the array.

### The Magic: `TArray[number]`

This is the key to array iteration in types:

```typescript
type Fruits = ["apple", "banana", "cherry"];
type AllFruits = Fruits[number];  // "apple" | "banana" | "cherry"
```

**What's happening:**
- `Fruits[number]` means "give me the type of any element in this array"
- Since there are multiple elements, it creates a union type
- `"apple" | "banana" | "cherry"` means "any one of these three strings"

### Try It Yourself

```typescript
type Colors = ["red", "green", "blue"];
type AllColors = Colors[number];  // What do you think this will be?

// Answer: "red" | "green" | "blue"
```

### Transforming Arrays to Objects

Now let's use this to create objects from arrays:

```typescript
type ArrayToObject<TStringArray extends readonly string[]> = {
  [Key in TStringArray[number]]: string;
};

// How it works:
type Columns = ["name", "age", "city"];
type ColumnObject = ArrayToObject<Columns>;
// Result: { name: string; age: string; city: string }
```

**Breaking it down:**
1. `TStringArray[number]` extracts: `"name" | "age" | "city"`
2. `[Key in TStringArray[number]]` iterates over each element
3. Creates object properties for each element

### Try It Yourself

```typescript
type Columns = ["name", "age", "city"];
type ColumnObject = ArrayToObject<Columns>;

// This works:
const obj1: ColumnObject = { name: "John", age: "25", city: "NYC" };  // ✅

// This fails:
const obj2: ColumnObject = { name: "Jane", age: "30" };               // ❌ Missing "city"
```

### Adding Prefixes to Array Elements

Now let's combine arrays with template literals to add prefixes:

```typescript
type AddPrefixToArray<TStringArray extends readonly string[], TPrefix extends string> = {
  [Key in TStringArray[number] as `${TPrefix}${Key}`]: string;
};

// How it works:
type Columns = ["score1", "score2"];
type PrefixedColumns = AddPrefixToArray<Columns, "mean_">;
// Result: { mean_score1: string; mean_score2: string }
```

**Breaking it down:**
1. `TStringArray[number]` extracts: `"score1" | "score2"`
2. `as` lets us change the property name
3. `` `${TPrefix}${Key}` `` combines: `"mean_" + "score1" = "mean_score1"`

### Try It Yourself

```typescript
type Columns = ["score1", "score2"];
type PrefixedColumns = AddPrefixToArray<Columns, "mean_">;

// This works:
const data1: PrefixedColumns = { mean_score1: "85", mean_score2: "92" };  // ✅

// This fails:
const data2: PrefixedColumns = { score1: "85", score2: "92" };            // ❌ Wrong property names
```

### Practice Exercise

What will these types produce?

```typescript
type Colors = ["red", "green", "blue"];
type PrefixedColors = AddPrefixToArray<Colors, "color_">;
// Your guess: ?

type Numbers = ["1", "2", "3"];
type NumberedItems = AddPrefixToArray<Numbers, "item_">;
// Your guess: ?
```

<details>
<summary>Click to see answers</summary>

```typescript
// PrefixedColors = { color_red: string; color_green: string; color_blue: string }
// NumberedItems = { item_1: string; item_2: string; item_3: string }
```
</details>

**Key Point**: `T[number]` is the magic that lets you iterate over array elements in types.

## Step 5: The Problem We Need to Solve

Now that we can add prefixes to arrays, let's try to create our goal: multiple prefixes with multiple columns.

### What We Want to Build

```typescript
// Input: columns ["score1", "score2"] with prefixes ["mean_", "sum_"]
// Goal: { mean_score1: number, mean_score2: number, sum_score1: number, sum_score2: number }
```

### The Problem We Encounter

Let's try to build this step by step:

```typescript
type Columns = ["score1", "score2"];
type Prefixes = ["mean_", "sum_"];

// Step 1: Create mean columns
type MeanColumns = AddPrefixToArray<Columns, "mean_">;
// Result: { mean_score1: string; mean_score2: string }

// Step 2: Create sum columns  
type SumColumns = AddPrefixToArray<Columns, "sum_">;
// Result: { sum_score1: string; sum_score2: string }

// Step 3: Try to combine them
type AllColumns = MeanColumns | SumColumns;  // This doesn't work!
```

**The Problem**: When you combine multiple objects with `|`, you get a union type that can only access one object at a time:

```typescript
// This creates a union type - you can only access 'mean_' properties OR 'sum_' properties
type Union = { mean_score1: string; mean_score2: string } | { sum_score1: string; sum_score2: string };

// This fails because you can't access both sets of properties:
const obj: Union = { 
  mean_score1: "85", 
  mean_score2: "92", 
  sum_score1: "170", 
  sum_score2: "184" 
};  // ❌ Error!
```

### The Solution: UnionToIntersection

We need a way to convert union types to intersection types. Here's the magic utility:

```typescript
type UnionToIntersection<TUnion> = (TUnion extends any ? (k: TUnion) => void : never) extends
  (k: infer TIntersection) => void ? TIntersection : never;

// This converts: { a: 1 } | { b: 2 } → { a: 1 } & { b: 2 } → { a: 1, b: 2 }
```

**How it works:**
- Takes a union type like `{ a: 1 } | { b: 2 }`
- Converts it to an intersection type like `{ a: 1 } & { b: 2 }`
- The result is `{ a: 1, b: 2 }` - you can access both properties

### Try It Yourself

```typescript
// Without UnionToIntersection:
type Without = { a: 1 } | { b: 2 };  // Can only access 'a' OR 'b'

// With UnionToIntersection:
type With = UnionToIntersection<{ a: 1 } | { b: 2 }>;  // Can access 'a' AND 'b'

// This works:
const obj: With = { a: 1, b: 2 };  // ✅
```

### Now We Can Solve Our Original Problem

```typescript
type Columns = ["score1", "score2"];
type Prefixes = ["mean_", "sum_"];

// Step 1: Create mean columns
type MeanColumns = AddPrefixToArray<Columns, "mean_">;
// Result: { mean_score1: string; mean_score2: string }

// Step 2: Create sum columns  
type SumColumns = AddPrefixToArray<Columns, "sum_">;
// Result: { sum_score1: string; sum_score2: string }

// Step 3: Combine them properly
type AllColumns = UnionToIntersection<MeanColumns | SumColumns>;
// Result: { mean_score1: string; mean_score2: string; sum_score1: string; sum_score2: string }

// This works:
const data: AllColumns = { 
  mean_score1: "85", 
  mean_score2: "92", 
  sum_score1: "170", 
  sum_score2: "184" 
};  // ✅
```

**Key Point**: UnionToIntersection lets you combine multiple objects into one, which is exactly what we need for multiple prefixes.

## Step 6: Building Our First Dynamic Type

Now let's combine everything to create dynamic column types.

### Step 1: Map One Prefix to All Columns

```typescript
type MapPrefixToColumns<TColumnNames extends readonly string[], TPrefix extends string> = {
  [Key in TColumnNames[number] as `${TPrefix}${Key}`]: number;
};

// Test it:
type Columns = ["score1", "score2"];
type MeanColumns = MapPrefixToColumns<Columns, "mean_">;
// Result: { mean_score1: number; mean_score2: number }
```

### Step 2: Handle Multiple Prefixes

```typescript
type MapAllPrefixes<TColumnNames extends readonly string[], TPrefixes extends readonly string[]> = 
  UnionToIntersection<
    {
      [Index in keyof TPrefixes]: TPrefixes[Index] extends string
        ? MapPrefixToColumns<TColumnNames, TPrefixes[Index]>
        : never;
    }[number]
  >;

// Test it:
type Columns = ["score1", "score2"];
type Prefixes = ["mean_", "sum_"];
type AllColumns = MapAllPrefixes<Columns, Prefixes>;
// Result: { mean_score1: number; mean_score2: number; sum_score1: number; sum_score2: number }
```

### Try It Yourself

```typescript
type Columns = ["score1", "score2"];
type Prefixes = ["mean_", "sum_"];
type AllColumns = MapAllPrefixes<Columns, Prefixes>;

// This works:
const data: AllColumns = { 
  mean_score1: 85, 
  mean_score2: 92, 
  sum_score1: 170, 
  sum_score2: 184 
};  // ✅
```

## Step 7: The Complete Pattern

Here's the final, production-ready type that handles function definitions:

```typescript
export type MapColsWithPrefix<
  TColumnNames extends readonly string[],
  TNewColumnDefs extends readonly { prefix: string; fn: (...a: any[]) => any }[],
> = UnionToIntersection<
  {
    [Index in keyof TNewColumnDefs]: TNewColumnDefs[Index] extends {
      prefix: infer TPrefix;
      fn: (...a: any[]) => infer TResult;
    }
      ? TPrefix extends string
        ? { [ColName in TColumnNames[number] as `${TPrefix}${ColName}`]: TResult }
      : never
      : never;
  }[number]
>;
```

### How to Read This Type

1. **Input**: Two arrays - column names and function definitions
2. **Iterate**: Over each function definition
3. **Extract**: The prefix and return type from each function
4. **Generate**: Column names by combining prefix + column name
5. **Combine**: All the generated objects into one type

### Usage Example

```typescript
const result = df.summariseColumns({
  col_type: "number",
  columns: ["score1", "score2"],           // Your column names
  new_columns: [                           // Your function definitions
    { prefix: "mean_", fn: (col) => mean(col) },
    { prefix: "sum_", fn: (col) => sum(col) }
  ]
});

// TypeScript automatically generates:
// { mean_score1: number, mean_score2: number, sum_score1: number, sum_score2: number }
```

## Step 8: Generating Number Sequences (Advanced)

For the `transpose` function, we need to generate number sequences like `[0, 1, 2, 3]`.

### Recursive Tuple Generation

```typescript
type GenerateNumberTuple<TLength extends number, TAccumulator extends number[] = []> = 
  TAccumulator['length'] extends TLength ? TAccumulator : GenerateNumberTuple<TLength, [...TAccumulator, TAccumulator['length']]>;

// Examples:
type Tuple3 = GenerateNumberTuple<3>;  // [0, 1, 2]
type Tuple5 = GenerateNumberTuple<5>;  // [0, 1, 2, 3, 4]
```

**How it works:**
1. **Base case**: If accumulator length equals TLength, return the accumulator
2. **Recursive case**: Add the current length to the accumulator and continue
3. **Result**: A tuple with numbers from 0 to TLength-1

### Converting Numbers to Column Names

```typescript
type MapRowNumbersWithTypes<TRowNumbers extends readonly number[], TValue = unknown> = 
  UnionToIntersection<
    {
      [Index in keyof TRowNumbers]: TRowNumbers[Index] extends number 
        ? { [ColName in `row_${TRowNumbers[Index]}`]: TValue }
        : never;
    }[number]
  >;

// Usage:
type RowNumbers = [0, 1, 2];
type RowColumns = MapRowNumbersWithTypes<RowNumbers, string>;
// Result: { row_0: string; row_1: string; row_2: string }
```

### Try It Yourself

```typescript
type RowNumbers = [0, 1, 2];
type RowColumns = MapRowNumbersWithTypes<RowNumbers, string>;

// This works:
const rows1: RowColumns = { row_0: "A", row_1: "B", row_2: "C" };  // ✅

// This fails:
const rows2: RowColumns = { row_0: "A", row_1: "B" };              // ❌ Missing row_2
```

## Step 9: Putting It All Together

The complete `transpose` type combines everything:

```typescript
export type RowAfterTranspose<
  TRow extends Record<string, unknown>,
  TRowNumbers extends readonly number[] = readonly number[]
> = {
  variable: keyof TRow;
} & MapRowNumbersWithTypes<TRowNumbers, TRow[keyof TRow]>;
```

### Usage

```typescript
const transposed = df.transpose(3);  // User provides expected rows

// TypeScript generates:
// { 
//   variable: "name" | "age" | "score", 
//   row_0: string | number, 
//   row_1: string | number, 
//   row_2: string | number 
// }
```

## Key Takeaways

You've learned the essential building blocks for creating dynamic types:

1. **Literal Types**: Exact values like `"hello"` instead of generic `string`
2. **Template Literals**: Combine strings with types using `` `prefix_${string}` ``
3. **Mapped Types**: Transform objects using `[Key in keyof T]`
4. **Array Iteration**: Use `T[number]` to iterate over array elements in types
5. **UnionToIntersection**: Combine multiple objects into one

## Why This Approach Works

- **Exact Types**: Every column name is known at compile time
- **Type Safety**: TypeScript can track every property
- **IntelliSense**: Perfect autocomplete in your IDE
- **Scalable**: Works for any reasonable number of columns

## Next Steps

Now you can create APIs that are both powerful and perfectly typed! Try building your own dynamic types using these patterns.

**Remember**: Start simple with literal types and template literals, then gradually add complexity with mapped types and array iteration.