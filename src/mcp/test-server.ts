/**
 * Simple test to verify the MCP server loads correctly
 */
import { server } from "./index.ts";

console.log("✓ Server imported successfully");
console.log("✓ Server object created:", typeof server);

// Test that we can check the server
console.log("\n✓ All imports successful!");
console.log("\nTo run the server:");
console.log("  deno task mcp");
console.log("\nTo test with MCP Inspector:");
console.log("  npx @modelcontextprotocol/inspector deno task mcp");
