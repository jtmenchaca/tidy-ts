import * as aq from "arquero";

const a = aq.table({ x: [1, 2], y: ["a", "b"] });
const b = aq.table({ x: [3, 4], z: ["c", "d"] });
const c = a.concat(b);
console.log("columns:", c.columnNames());
console.log("objects:", JSON.stringify(c.objects()));
