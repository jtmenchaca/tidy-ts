# Runtime

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [getCurrentRuntime](#getcurrentruntime)
- [currentRuntime](#currentruntime)
- [Runtime](#runtime)
- [UnavailableAPIError](#unavailableapierror)
- [UnsupportedRuntimeError](#unsupportedruntimeerror)

---

## getCurrentRuntime

Detects the current JavaScript runtime environment. Returns an enum value identifying whether code is running in Deno, Bun, Node.js, Browser, or other environments. Useful for conditional logic based on runtime capabilities.

### Signature

```typescript
getCurrentRuntime(): Runtime
```

### Import

```typescript
import { getCurrentRuntime, Runtime } from "@tidy-ts/shims";
```

### Returns

Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)

### Examples

```typescript
// Detect current runtime
import { getCurrentRuntime, Runtime } from "@tidy-ts/shims";

const runtime = getCurrentRuntime();
if (runtime === Runtime.Deno) {
  console.log("Running in Deno");
} else if (runtime === Runtime.Node) {
  console.log("Running in Node.js");
}
// Use for conditional imports or logic
if (getCurrentRuntime() === Runtime.Browser) {
  // Browser-specific code
} else {
  // Server-side code
}
```

### Best Practices

- ✓ GOOD: Use for conditional logic based on runtime capabilities
- ✓ GOOD: Check runtime before using platform-specific APIs
- ✓ GOOD: Prefer runtime-agnostic shims over direct runtime checks when possible

### Related

`currentRuntime`, `Runtime`

---

## currentRuntime

Cached runtime detection result. Determined once when module loads, providing fast access to runtime information without repeated detection.

### Signature

```typescript
const currentRuntime: Runtime
```

### Import

```typescript
import { currentRuntime, Runtime } from "@tidy-ts/shims";
```

### Returns

Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)

### Examples

```typescript
// Quick runtime check
import { currentRuntime, Runtime } from "@tidy-ts/shims";

if (currentRuntime === Runtime.Deno) {
  console.log("Running in Deno");
}
// Conditional configuration
const config = {
  timeout: currentRuntime === Runtime.Browser ? 5000 : 30000,
};
```

### Best Practices

- ✓ GOOD: Use this constant for performance (cached value)
- ✓ GOOD: Prefer over repeated getCurrentRuntime() calls

### Related

`getCurrentRuntime`, `Runtime`

---

## Runtime

Enum of supported JavaScript runtime environments. Used with getCurrentRuntime() and currentRuntime for type-safe runtime detection.

### Signature

```typescript
enum Runtime { Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, Unsupported }
```

### Import

```typescript
import { Runtime } from "@tidy-ts/shims";
```

### Returns

Enum type

### Examples

```typescript
// Use enum values for comparison
import { currentRuntime, Runtime } from "@tidy-ts/shims";

switch (currentRuntime) {
  case Runtime.Deno:
    console.log("Deno runtime");
    break;
  case Runtime.Node:
    console.log("Node.js runtime");
    break;
  case Runtime.Bun:
    console.log("Bun runtime");
    break;
  case Runtime.Browser:
    console.log("Browser runtime");
    break;
}
```

### Best Practices

- ✓ GOOD: Use enum values for type-safe comparisons
- ✓ GOOD: Handle Runtime.Unsupported case for unknown environments

### Related

`getCurrentRuntime`, `currentRuntime`

---

## UnavailableAPIError

Error thrown when an API is not available in the current runtime. Contains information about which API was called and which runtime it was called in.

### Signature

```typescript
class UnavailableAPIError extends Error
```

### Import

```typescript
import { UnavailableAPIError } from "@tidy-ts/shims";
```

### Returns

Error instance

### Examples

```typescript
// Catch unavailable API
import { readFile, UnavailableAPIError } from "@tidy-ts/shims";

try {
  await readFile("./file.txt");
} catch (error) {
  if (error instanceof UnavailableAPIError) {
    console.error("File system not available in this runtime");
  }
}
```

### Best Practices

- ✓ GOOD: Check for this error when using file system APIs in browsers

### Related

`UnsupportedRuntimeError`

---

## UnsupportedRuntimeError

Error thrown when code is running in an unsupported runtime. Contains information about detected runtime and list of supported runtimes.

### Signature

```typescript
class UnsupportedRuntimeError extends Error
```

### Import

```typescript
import { UnsupportedRuntimeError } from "@tidy-ts/shims";
```

### Returns

Error instance

### Examples

```typescript
// Catch unsupported runtime
import { getCurrentRuntime, UnsupportedRuntimeError } from "@tidy-ts/shims";

try {
  const runtime = getCurrentRuntime();
  // Some runtime-specific logic
} catch (error) {
  if (error instanceof UnsupportedRuntimeError) {
    console.error("This runtime is not supported");
  }
}
```

### Best Practices

- ✓ GOOD: Use to gracefully handle unsupported environments

### Related

`UnavailableAPIError`, `getCurrentRuntime`

---
