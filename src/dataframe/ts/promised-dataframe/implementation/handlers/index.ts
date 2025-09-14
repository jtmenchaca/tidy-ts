// Re-export only the complex handlers that still need separate files
export { handleMethodForwarding } from "./method-forwarding-handler.ts";

// Re-export shared utilities for common patterns
export * from "./shared-handler-utils.ts";
