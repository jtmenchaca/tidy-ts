import { ai } from "../../mod.ts";
import { expect } from "@std/expect";


// Skip the network-touching tests when no API key is configured.
const SKIP = !Deno.env.get("OPENAI_API_KEY");

Deno.test({
  name: "ai.embed — single string returns a number[] of the model's dimensionality",
  ignore: SKIP,
  async fn() {
    const v = await ai.embed("Hello world");
    expect(Array.isArray(v)).toBe(true);
    // text-embedding-3-large is 3072 dims.
    expect(v.length).toBe(3072);
    expect(typeof v[0]).toBe("number");
  },
});

Deno.test({
  name: "ai.embed — array of strings returns number[][] preserving order",
  ignore: SKIP,
  async fn() {
    const vs = await ai.embed(["first", "second", "third"]);
    expect(vs.length).toBe(3);
    for (const v of vs) {
      expect(v.length).toBe(3072);
    }
    // Each input produces a distinct embedding (no all-zero / duplicate vector).
    expect(vs[0]).not.toEqual(vs[1]);
    expect(vs[1]).not.toEqual(vs[2]);
  },
});

Deno.test({
  name: "ai.embed — smaller model returns 1536-dim vectors",
  ignore: SKIP,
  async fn() {
    const v = await ai.embed("text", "text-embedding-3-small");
    expect(v.length).toBe(1536);
  },
});

Deno.test({
  name: "ai.compareEmbeddings — ranks semantic neighbors above unrelated text",
  ignore: SKIP,
  async fn() {
    const query = await ai.embed("a small house cat");
    const candidates = await ai.embed([
      "Python is a programming language",
      "a feline pet curled up on the windowsill",
      "the bond market closed up 2 points",
    ]);

    const ranked = ai.compareEmbeddings({ query, candidates });

    expect(ranked.length).toBe(3);
    // Distances ascend.
    expect(ranked[0].distance).toBeLessThanOrEqual(ranked[1].distance);
    expect(ranked[1].distance).toBeLessThanOrEqual(ranked[2].distance);
    // The cat sentence (index 1) must be the closest match.
    expect(ranked[0].index).toBe(1);
  },
});

Deno.test({
  name: "ai.compareEmbeddings — n caps the result count",
  ignore: SKIP,
  async fn() {
    const query = await ai.embed("apple");
    const candidates = await ai.embed(["fruit", "car", "computer", "banana"]);
    const top2 = ai.compareEmbeddings({ query, candidates, n: 2 });
    expect(top2.length).toBe(2);
  },
});
