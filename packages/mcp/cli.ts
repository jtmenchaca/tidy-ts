#!/usr/bin/env -S deno run --allow-read --allow-env
import { server } from "./server-base.ts";
import { setup_tools } from "./handlers/index.ts";
import { StdioTransport } from "@tmcp/transport-stdio";

setup_tools(server);

const transport = new StdioTransport(server);
transport.listen();
