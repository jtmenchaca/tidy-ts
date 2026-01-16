# Result

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [Result](#result)
- [ok](#ok)
- [err](#err)
- [tryAsync](#tryasync)
- [defineError](#defineerror)
- [AppError](#apperror)

---

## Result

Type-safe Result pattern for explicit error handling. Either a successful value or an error, never both. Functions that can fail return Result<T, E> instead of throwing exceptions, making error handling explicit and type-safe.

### Signature

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
```

### Import

```typescript
import { type Result } from "@tidy-ts/shims";
```

### Parameters

- T: Type of the success value
- E: Type of the error

### Returns

Discriminated union with ok boolean, value on success, error on failure

### Examples

```typescript
// Basic Result handling
import { type Result } from "@tidy-ts/shims";

const result: Result<User, Error> = await fetchUser(1);

if (result.ok) {
  // TypeScript knows result.value is User
  console.log(result.value.name);
} else {
  // TypeScript knows result.error is Error
  console.error(result.error.message);
}
// Type narrowing with Result
function processResult(result: Result<number, string>) {
  if (result.ok) {
    return result.value * 2; // value is number
  }
  throw new Error(result.error); // error is string
}
```

### Best Practices

- ✓ GOOD: Use Result for operations that can fail predictably
- ✓ GOOD: Narrow types with if (result.ok) checks
- ✓ GOOD: Return typed errors instead of throwing exceptions
- ✓ GOOD: Use with async operations via tryAsync

### Anti-patterns

- ❌ BAD: Using Result for operations that should never fail
- ❌ BAD: Throwing inside Result-returning functions

### Related

`ok`, `err`, `tryAsync`, `AppError`

---

## ok

Create a successful Result. The returned Result has ok: true and contains the value. The error type is 'never' indicating this Result cannot be an error.

### Signature

```typescript
ok<T>(value: T): Result<T, never>
```

### Import

```typescript
import { ok } from "@tidy-ts/shims";
```

### Parameters

- value: The success value to wrap

### Returns

Result<T, never> - A successful Result containing the value

### Examples

```typescript
// Create success Result
import { ok, type Result } from "@tidy-ts/shims";

const success = ok(42);
// success.ok === true
// success.value === 42
// Return from function
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
}
```

### Best Practices

- ✓ GOOD: Use ok() for successful return values
- ✓ GOOD: Combine with err() for complete Result handling

### Related

`err`, `Result`

---

## err

Create an error Result. The returned Result has ok: false and contains the error. The value type is 'never' indicating this Result cannot be a success.

### Signature

```typescript
err<E>(error: E): Result<never, E>
```

### Import

```typescript
import { err } from "@tidy-ts/shims";
```

### Parameters

- error: The error value to wrap

### Returns

Result<never, E> - An error Result containing the error

### Examples

```typescript
// Create error Result
import { err, type Result } from "@tidy-ts/shims";

const failure = err(new Error("Something went wrong"));
// failure.ok === false
// failure.error.message === "Something went wrong"
// Return from function
function parseNumber(str: string): Result<number, string> {
  const num = parseInt(str, 10);
  if (isNaN(num)) return err(`Invalid number: ${str}`);
  return ok(num);
}
```

### Best Practices

- ✓ GOOD: Use err() for error return values
- ✓ GOOD: Use typed errors for better error handling

### Related

`ok`, `Result`

---

## tryAsync

Wrap an async operation in a Result, catching any thrown errors. Requires an error mapper to transform caught exceptions into typed errors. This ensures explicit error handling consistent with tidy-ts patterns.

### Signature

```typescript
tryAsync<T, E>({ fn, mapError }): Promise<Result<T, E>>
```

### Import

```typescript
import { tryAsync } from "@tidy-ts/shims";
```

### Parameters

- fn: Async function to execute (returns Promise<T>)
- mapError: Function to transform caught errors into typed errors (error: unknown) => E

### Returns

Promise<Result<T, E>> - Result with value or mapped error

### Examples

```typescript
// Database query with typed error
import { tryAsync, defineError, type AppError } from "@tidy-ts/shims";

const DatabaseError = defineError(
  "DatabaseError",
  ({ query, cause }: { query: string; cause: string }) =>
    `Query failed: ${cause} [${query}]`
);
type DatabaseError = AppError<"DatabaseError", { query: string; cause: string }>;

const query = "SELECT * FROM users";
const result = await tryAsync({
  fn: () => db.query(query),
  mapError: (e) => new DatabaseError({
    query,
    cause: e instanceof Error ? e.message : String(e)
  })
});

if (!result.ok) {
  console.error(result.error.query); // typed access
}
// File operations
const FileError = defineError(
  "FileError",
  ({ path, operation }: { path: string; operation: string }) =>
    `File ${operation} failed: ${path}`
);

const path = "config.json";
const result = await tryAsync({
  fn: () => Deno.readTextFile(path),
  mapError: () => new FileError({ path, operation: "read" })
});
```

### Best Practices

- ✓ GOOD: Always provide a mapError function for explicit error typing
- ✓ GOOD: Use with async operations that might throw
- ✓ GOOD: Create custom error types with defineError for better error context

### Anti-patterns

- ❌ BAD: Returning the raw caught error without mapping

### Related

`Result`, `ok`, `err`, `defineError`

---

## defineError

Factory function to create custom error classes with type-safe properties. Creates an error class that extends Error with proper prototype chain, has a fixed name property, and has additional typed properties from the Extra type.

### Signature

```typescript
defineError<ErrorName, Extra>(name: ErrorName, messageTemplate: (extra: Extra) => string): { new (extra: Extra): AppError<ErrorName, Extra> }
```

### Import

```typescript
import { defineError, type AppError } from "@tidy-ts/shims";
```

### Parameters

- name: The error name (becomes error.name)
- messageTemplate: Function that generates error message from extra properties

### Returns

Constructor for the custom error class

### Examples

```typescript
// Define custom error
import { defineError, type AppError } from "@tidy-ts/shims";

const NotFoundError = defineError(
  "NotFoundError",
  ({ resource, id }: { resource: string; id: string }) =>
    `${resource} with id ${id} not found`
);
type NotFoundError = AppError<"NotFoundError", { resource: string; id: string }>;

const error = new NotFoundError({ resource: "User", id: "123" });
console.log(error.name);     // "NotFoundError"
console.log(error.resource); // "User"
console.log(error.id);       // "123"
console.log(error.message);  // "User with id 123 not found"
// Validation error
const ValidationError = defineError(
  "ValidationError",
  ({ field, message }: { field: string; message: string }) =>
    `Validation failed for ${field}: ${message}`
);
type ValidationError = AppError<"ValidationError", { field: string; message: string }>;

const err = new ValidationError({ field: "email", message: "Invalid format" });
console.log(err.field); // "email"
```

### Best Practices

- ✓ GOOD: Define both class and type with same name for clean usage
- ✓ GOOD: Include context properties useful for debugging
- ✓ GOOD: Use descriptive message templates

### Related

`AppError`, `Result`, `tryAsync`

---

## AppError

Helper type for custom errors with additional properties. Used with defineError to create typed error classes. Extends Error with a specific name and extra typed properties.

### Signature

```typescript
type AppError<ErrorName extends string, Extra = object> = Error & Extra & { name: ErrorName }
```

### Import

```typescript
import { type AppError } from "@tidy-ts/shims";
```

### Parameters

- ErrorName: String literal type for the error name
- Extra: Object type with additional properties (default: object)

### Returns

Type that extends Error with name and extra properties

### Examples

```typescript
// Define error type
import { defineError, type AppError } from "@tidy-ts/shims";

// Define class
const MyError = defineError(
  "MyError",
  ({ code }: { code: number }) => `Error code: ${code}`
);

// Define matching type
type MyError = AppError<"MyError", { code: number }>;

// Use in function signatures
function processData(): Result<Data, MyError> {
  if (invalid) {
    return err(new MyError({ code: 400 }));
  }
  return ok(data);
}
```

### Best Practices

- ✓ GOOD: Define type alias alongside defineError class
- ✓ GOOD: Use in Result error position for type-safe error handling

### Related

`defineError`, `Result`

---
