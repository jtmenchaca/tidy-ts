# Error Handling

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Know which subsystem failed** | Hierarchical error classes: `DataFrameError`, `GroupedDataFrameError`, `VerbError`, `JoinError`. Error type tells you where problem occurred. |
| **Helpful error messages** | Clear messages with context. Know what went wrong and why. |
| **Programmatic error handling** | Error codes for catching specific error types. Can handle errors in code. |
| **Easy debugging** | Error hierarchy makes it clear where to look. Stack traces point to right place. |

## Error Hierarchy

```typescript
TidyError (base)
  ├─ DataFrameError          // General DataFrame operations
  ├─ GroupedDataFrameError   // Grouping-related errors
  ├─ VerbError              // Verb operation errors
  └─ JoinError              // Join operation errors
```

## Usage

| Goal | Implementation |
|------|----------------|
| **Catch specific errors** | `catch (e) { if (e instanceof JoinError) { ... } }` |
| **Error codes** | Errors can have codes for programmatic handling |
| **Context in messages** | Error messages include relevant context (column names, row counts, etc.) |

## Benefits

- **Better debugging**: Know which subsystem failed
- **Error handling**: Can catch and handle specific error types
- **Clear messages**: Understand what went wrong
- **Programmatic**: Error codes enable automated handling
