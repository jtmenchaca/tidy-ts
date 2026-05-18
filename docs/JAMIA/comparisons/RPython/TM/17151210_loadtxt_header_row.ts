/**
 * RPython SO#17151210 — numpy loadtxt skip first row
 * Effect: Crash
 * Bug class: Data loading
 *
 * Python bug: CSV has comment lines (#) and a header row (x,y,z). User uses
 * np.loadtxt(comments='#', skiprows=1) but the header row "x,y,z" is not a
 * comment and not skipped enough — numpy crashes: "could not convert string to
 * float: x". The non-numeric header was included in the numeric parse.
 *
 * In tidy-ts, readCSV with a Zod schema validates at runtime (z.number() rejects
 * "x" at parse). At the type level, if the schema uses z.string() (wrong schema),
 * downstream numeric operations on the resulting string columns are rejected.
 */
import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

// If loaded with wrong schema (string instead of number), the DataFrame
// columns are typed as string — downstream numeric ops are rejected.
const wrongSchema = z.object({ x: z.string(), y: z.string(), z: z.string() });

readCSV("x,y,z\n1,2,3\n4,5,6", wrongSchema).then((df) => {
  // @ts-expect-error — string[] is not assignable to number[]
  s.mean(df.extract("x"));
});
