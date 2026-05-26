// Tests for `aiTest`'s context proxy — `t.step()` and other Deno-side
// methods on the original `TestContext` must remain callable on the
// proxied object passed to the body. The proxy adds `datastore`
// without losing any of the underlying delegate methods.

import { expect } from "@std/expect";

import { aiTest } from "./testing.ts";

aiTest({
  name: "aiTest: t.step() works on the proxied context",
  async fn(t) {
    let stepRan = false;
    await t.step("inner step", () => {
      stepRan = true;
    });
    expect(stepRan).toBe(true);
  },
});

aiTest({
  name: "aiTest: t.name forwards from the underlying TestContext",
  fn(t) {
    expect(typeof t.name).toBe("string");
    expect(t.name).toContain("aiTest: t.name forwards");
  },
});

aiTest({
  name: "aiTest: datastore is exposed on the proxied context",
  fn(t) {
    expect(typeof t.datastore).toBe("object");
    expect(typeof t.datastore.get).toBe("function");
    expect(typeof t.datastore.set).toBe("function");
  },
});
