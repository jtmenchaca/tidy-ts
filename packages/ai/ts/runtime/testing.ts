// Test infrastructure for the AI package.
//
// Real-API tests use gpt-5.4-nano (see CONTEXT.md test policy). Every
// such test must run against a fresh in-memory datastore so prior
// cached outputs can't fake token counts, latency, or `cachedNodes`.
// `aiTest` wraps `Deno.test` to enforce that isolation: it installs a
// fresh `memoryDatastore` before the body runs and restores the
// previous binding after — so no test relies on cross-file ordering
// and no test ever writes to the default `.tidy-ai-cache.db`.
//
// Use exactly like Deno.test:
//   aiTest({ name: "…", ignore: !Deno.env.get("OPENAI_API_KEY"), async fn() { … } });
// Or with the (name, fn) shorthand:
//   aiTest("structural test", async () => { … });
//
// The wrapper does not gate on OPENAI_API_KEY itself — `ignore` is the
// caller's call. Real-API tests in this repo follow the convention of
// `ignore: !Deno.env.get("OPENAI_API_KEY")`.

import {
  clearDatastore,
  currentDatastore,
  type DatastoreAdapter,
  memoryDatastore,
  setDatastore,
} from "./datastore.ts";

/** Test context passed to an `aiTest` body. Carries Deno's own context
 *  plus a handle to the fresh in-memory `datastore` installed for this
 *  test — useful for pre-seeding cache entries with `nodeCacheKey`. */
export interface AiTestContext extends Deno.TestContext {
  datastore: DatastoreAdapter;
}

type AiTestBody = (t: AiTestContext) => void | Promise<void>;

interface AiTestDefinition extends Omit<Deno.TestDefinition, "fn"> {
  fn: AiTestBody;
}

function withIsolatedDatastore(
  body: AiTestBody,
): (t: Deno.TestContext) => Promise<void> {
  return async (t) => {
    // Snapshot the prior adapter (if any) so we can put it back after
    // this test — a test that runs inside a process where the user has
    // explicitly installed (e.g.) a sqliteDatastore for legitimate
    // reasons gets that binding back when the test finishes.
    const prior = currentDatastore();
    const datastore = memoryDatastore();
    setDatastore({ adapter: datastore });
    try {
      // Proxy the real `Deno.TestContext` so `t.step()`, `t.name`, etc.
      // are forwarded as-is (Reflect.get preserves `this` binding); the
      // only field we add is `datastore`. Beats the previous `{...t}`
      // spread which copied own-properties but missed prototype methods.
      const proxied = new Proxy(t, {
        get(target, prop, receiver) {
          if (prop === "datastore") return datastore;
          const value = Reflect.get(target, prop, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }) as AiTestContext;
      await body(proxied);
    } finally {
      // MCP server lifecycle is owned by the SDK bridge: every
      // executeAgentNode wraps `await built.cleanup()` in a finally
      // block, so stdio children and HTTP sessions don't survive
      // an `ai.evaluate` call.
      if (prior) {
        setDatastore({ adapter: prior });
      } else {
        // No prior binding — tear ours down rather than leaving a
        // memoryDatastore installed. That way the next test (or the
        // first `ai.evaluate` after the test suite) hits the lazy
        // default again, matching the pre-test state.
        clearDatastore();
      }
    }
  };
}

/** Drop-in replacement for `Deno.test` that isolates the per-node cache.
 *
 *  Installs a fresh `memoryDatastore` for the duration of the test and
 *  replaces it with another empty one after. The body receives the
 *  installed adapter as `t.datastore` for pre-seeding. */
export function aiTest(definition: AiTestDefinition): void;
export function aiTest(name: string, fn: AiTestBody): void;
export function aiTest(
  nameOrDef: string | AiTestDefinition,
  maybeFn?: AiTestBody,
): void {
  if (typeof nameOrDef === "string") {
    if (!maybeFn) throw new Error("aiTest: fn is required");
    Deno.test(nameOrDef, withIsolatedDatastore(maybeFn));
    return;
  }
  const { fn, ...rest } = nameOrDef;
  Deno.test({ ...rest, fn: withIsolatedDatastore(fn) });
}
