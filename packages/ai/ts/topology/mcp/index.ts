// MCP barrel — transport variants + the McpTool / McpToolSpec declarations.

export {
  type ClientTransport,
  ClientTransportUnion,
  createRemoteTransport,
  createSSEmTLSTransport,
  createSSETransport,
  createStdioTransport,
  createStreamableHTTPmTLSTransport,
  createStreamableHTTPTransport,
  type RemoteTransport,
  RemoteTransportSchema,
  type SSEmTLSTransport,
  SSEmTLSTransportSchema,
  type SSETransport,
  SSETransportSchema,
  type StdioTransport,
  StdioTransportSchema,
  type StreamableHTTPmTLSTransport,
  StreamableHTTPmTLSTransportSchema,
  type StreamableHTTPTransport,
  StreamableHTTPTransportSchema,
} from "./client-transport.ts";

export {
  createMcpTool,
  createMcpToolSpec,
  type McpTool,
  McpToolSchema,
  type McpToolSpec,
  McpToolSpecSchema,
} from "./mcp-tool.ts";
