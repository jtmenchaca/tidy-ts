# Concurrency System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Prevent overwhelming servers** | Limit concurrent async operations. Default 10 parallel operations, configurable. |
| **Handle transient failures** | Retry strategies with exponential/linear backoff. Automatically retry failed operations. |
| **Control resource usage** | Concurrency limits prevent too many simultaneous requests. Protects both client and server. |
| **Configurable retry logic** | Choose retry strategy (exponential, linear, custom). Configure max retries, delays, retry conditions. |

## Features

| Feature | Implementation |
|---------|----------------|
| **Concurrency limits** | Max parallel operations (default: 10). Queue excess operations until slot available. |
| **Retry strategies** | Exponential backoff (`delay = baseDelay * multiplier^attempt`) or linear (`delay = baseDelay * attempt`). |
| **Error handling** | Configurable function to determine if error should trigger retry. |
| **Progress tracking** | Optional callbacks to track operation progress. |

## Usage

```typescript
df.mutate({
  data: async (row) => await fetch(row.id)
}, { concurrency: 5 })  // Max 5 parallel requests
```

## Retry Strategies

| Strategy | When to Use |
|----------|-------------|
| **Exponential** | Network requests, API calls. Backs off quickly to avoid hammering server. |
| **Linear** | Rate-limited APIs. Predictable delay increases. |
| **Custom** | Special cases. Define your own retry logic. |

## Benefits

- **Prevents overload**: Limits concurrent requests
- **Handles failures**: Automatic retries for transient errors
- **Configurable**: Adapt to different use cases
- **Protects resources**: Both client and server benefit
