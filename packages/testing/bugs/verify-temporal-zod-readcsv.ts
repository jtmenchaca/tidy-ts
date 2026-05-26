import { readCSV } from "@tidy-ts/dataframe";
import { zPlainDate, zPlainDateTime, zInstant } from "@tidy-ts/shims";
import { z } from "zod";

const csv = `id,d,dt,inst
1,2024-03-04,2024-03-04T09:30:00,2024-03-04T09:30:00Z
2,2024-03-05,2024-03-05T10:30:00,2024-03-05T10:30:00Z`;

const schema = z.object({
  id: z.number(),
  d: zPlainDate,
  dt: zPlainDateTime,
  inst: zInstant,
});

const df = await readCSV(csv, schema);
const row = df.toRows()[0];
console.log("typeof row.d:        ", row.d.constructor.name);
console.log("typeof row.dt:       ", row.dt.constructor.name);
console.log("typeof row.inst:     ", row.inst.constructor.name);
console.log("row.d.toString():    ", row.d.toString());
console.log("row.dt.toString():   ", row.dt.toString());
console.log("row.inst.toString(): ", row.inst.toString());

// Can we sort by a Temporal column?
const sorted = df.arrange("dt", "desc");
console.log("sorted first dt:     ", sorted.dt[0].toString());

// Can we filter by Temporal?
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";
const cutoff = Temporal.PlainDateTime.from("2024-03-04T12:00:00");
const filtered = df.filter((r) => Temporal.PlainDateTime.compare(r.dt, cutoff) > 0);
console.log("filtered nrows:      ", filtered.nrows());
