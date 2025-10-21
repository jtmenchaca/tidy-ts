/**
 * Tests to prove variants and durations are independent of event order
 */

import { expect } from "@std/expect";
import { readXES } from "../readXES.ts";

Deno.test("variants & durations are independent of event order", async () => {
  // Create two XES documents with events in different order but same timestamps
  const xes1 = `<?xml version="1.0" encoding="utf-8" ?>
<log>
  <trace>
    <string key="concept:name" value="case1" />
    <event>
      <string key="concept:name" value="A" />
      <date key="time:timestamp" value="2024-01-01T10:00:00Z" />
    </event>
    <event>
      <string key="concept:name" value="B" />
      <date key="time:timestamp" value="2024-01-01T10:05:00Z" />
    </event>
  </trace>
</log>`;

  // Same events but swapped in XML (B appears first in file, but has later timestamp)
  const xes2 = `<?xml version="1.0" encoding="utf-8" ?>
<log>
  <trace>
    <string key="concept:name" value="case1" />
    <event>
      <string key="concept:name" value="B" />
      <date key="time:timestamp" value="2024-01-01T10:05:00Z" />
    </event>
    <event>
      <string key="concept:name" value="A" />
      <date key="time:timestamp" value="2024-01-01T10:00:00Z" />
    </event>
  </trace>
</log>`;

  // Both should produce the same variant sequence: A → B
  const log1 = await readXES(xes1);
  const log2 = await readXES(xes2);
  const v1 = log1.variants();
  const v2 = log2.variants();

  expect([...v1.keys()][0]).toBe("A → B");
  expect([...v2.keys()][0]).toBe("A → B");

  // Both should produce the same duration: 5 minutes = 300,000ms
  const d1 = [...log1.caseDurations().values()][0];
  const d2 = [...log2.caseDurations().values()][0];

  expect(d1).toBe(5 * 60 * 1000);
  expect(d2).toBe(5 * 60 * 1000);
});

Deno.test("variants handle three events in shuffled order", async () => {
  const xes1 = `<?xml version="1.0" encoding="utf-8" ?>
<log>
  <trace>
    <string key="concept:name" value="case1" />
    <event>
      <string key="concept:name" value="A" />
      <date key="time:timestamp" value="2024-01-01T10:00:00Z" />
    </event>
    <event>
      <string key="concept:name" value="B" />
      <date key="time:timestamp" value="2024-01-01T10:05:00Z" />
    </event>
    <event>
      <string key="concept:name" value="C" />
      <date key="time:timestamp" value="2024-01-01T10:10:00Z" />
    </event>
  </trace>
</log>`;

  // Completely shuffled: C, A, B in file
  const xes2 = `<?xml version="1.0" encoding="utf-8" ?>
<log>
  <trace>
    <string key="concept:name" value="case1" />
    <event>
      <string key="concept:name" value="C" />
      <date key="time:timestamp" value="2024-01-01T10:10:00Z" />
    </event>
    <event>
      <string key="concept:name" value="A" />
      <date key="time:timestamp" value="2024-01-01T10:00:00Z" />
    </event>
    <event>
      <string key="concept:name" value="B" />
      <date key="time:timestamp" value="2024-01-01T10:05:00Z" />
    </event>
  </trace>
</log>`;

  const log1 = await readXES(xes1);
  const log2 = await readXES(xes2);
  const v1 = log1.variants();
  const v2 = log2.variants();

  expect([...v1.keys()][0]).toBe("A → B → C");
  expect([...v2.keys()][0]).toBe("A → B → C");
});

Deno.test("durations use min/max not first/last", async () => {
  // Events with timestamps out of order
  const xes = `<?xml version="1.0" encoding="utf-8" ?>
<log>
  <trace>
    <string key="concept:name" value="case1" />
    <event>
      <string key="concept:name" value="Middle" />
      <date key="time:timestamp" value="2024-01-01T10:05:00Z" />
    </event>
    <event>
      <string key="concept:name" value="Last" />
      <date key="time:timestamp" value="2024-01-01T10:15:00Z" />
    </event>
    <event>
      <string key="concept:name" value="First" />
      <date key="time:timestamp" value="2024-01-01T10:00:00Z" />
    </event>
  </trace>
</log>`;

  const log = await readXES(xes);
  const durations = log.caseDurations();
  const duration = [...durations.values()][0];

  // Duration should be max - min = 15 minutes, not middle - last
  expect(duration).toBe(15 * 60 * 1000);
});
