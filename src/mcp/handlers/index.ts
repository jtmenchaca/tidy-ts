import type { TidyMcp } from "../index.ts";
import * as tools from "./tools/index.ts";

export function setup_tools(server: TidyMcp) {
  for (const tool in tools) {
    tools[tool as keyof typeof tools](server);
  }
}
