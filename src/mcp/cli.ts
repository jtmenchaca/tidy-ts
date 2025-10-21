#!/usr/bin/env -S deno run --allow-read --allow-env
import { server } from "./index.ts";
import { StdioTransport } from "@tmcp/transport-stdio";

const transport = new StdioTransport(server);
transport.listen();
