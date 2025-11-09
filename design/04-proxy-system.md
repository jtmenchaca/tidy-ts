# Proxy System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Single object for all DataFrame functionality** | Use JavaScript Proxy to intercept property access. One DataFrame object provides columns, rows, methods, and iteration. |
| **Access columns like properties** | `df.columnName` returns the column array directly. Proxy intercepts property access and routes to column store. |
| **Access rows like array** | `df[0]` returns a row object. Proxy intercepts numeric indexing and reconstructs row on-demand. |
| **Call methods fluently** | `df.mutate()`, `df.filter()`, etc. work directly. Proxy routes method names to verb implementations. |
| **Prevent accidental mutation** | Block array methods like `map()`, `filter()`, `push()`. Return functions that throw errors nudging users to tidy verbs. |
| **Make columns read-only** | Return frozen arrays with `.toArray()` method for mutable copies. Prevents `df.col.push()` from working. |
| **Respect views automatically** | When accessing columns with filters/sorts, automatically apply the view. Users don't need to think about it. |
| **Type-safe column access** | TypeScript infers column types from DataFrame row type. `df.age` is typed as `readonly number[]`. |

## How It Works

### Column Access (`df.columnName`)

| Goal | Implementation |
|------|----------------|
| **Fast access** | Direct array reference from store - O(1) |
| **Apply views** | If view exists, materialize index and filter column array |
| **Read-only** | Return frozen array with `.toArray()` method for mutable copy |
| **Type-safe** | TypeScript infers type from `Row` type |

### Row Access (`df[0]`)

| Goal | Implementation |
|------|----------------|
| **Lazy reconstruction** | Only create row object when accessed, not upfront |
| **Respect views** | Use materialized index to get correct physical row |
| **Memory efficient** | Only one row object exists at a time during iteration |

### Method Calls (`df.mutate()`)

| Goal | Implementation |
|------|----------------|
| **Route to verbs** | Call `resolveVerb()` to find verb function |
| **Bind DataFrame** | Return wrapper that calls verb with `df` bound |
| **Handle async** | Wrap async results in `PromisedDataFrame` for chaining |
| **Keep it simple** | Users just call `df.mutate()`, don't need to know about routing |

### Array Method Blocking

| Goal | Implementation |
|------|----------------|
| **Prevent mutation** | Block methods like `push()`, `pop()`, `splice()` |
| **Prevent confusion** | Block methods like `map()`, `filter()` that have DataFrame equivalents |
| **Helpful errors** | Throw errors that explain to use tidy verbs instead |

## Type Safety

| Goal | Implementation |
|------|----------------|
| **Infer column types** | TypeScript sees `df.age` as `readonly number[]` based on `Row` type |
| **Method signatures** | TypeScript sees methods from `DataFrame` type definition |
| **Hide proxy complexity** | TypeScript sees final API, not proxy internals |

## Performance

| Goal | Reality |
|------|---------|
| **Minimal overhead** | ✅ Proxy trap adds ~10-50ns per access (negligible) |
| **Fast column access** | ✅ O(1) without view, O(N) with view (expected) |
| **Fast method routing** | ✅ O(1) lookup in `resolveVerb()` |
| **Lazy row reconstruction** | ✅ Only creates objects when accessed |

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Reserved column names** | Can't name columns `nrows`, `columns`, `groupKeys`, etc. (these are methods) |
| **Non-existent columns** | Returns `undefined` (not an error) |
| **Symbol properties** | `Symbol.iterator` returns generator, other symbols pass through |
| **Column assignment** | `df.newCol = [...]` validates length and adds column to store |

## Trade-offs

**What we get:**
- Clean, intuitive API (one object, natural property access)
- Lazy evaluation (rows only created when needed)
- Type safety (full TypeScript support)
- Immutability (read-only columns prevent accidents)

**What we trade:**
- Proxy overhead (minimal but exists)
- Column access with views has overhead (must filter)
- Complex property resolution logic (but hidden from users)
