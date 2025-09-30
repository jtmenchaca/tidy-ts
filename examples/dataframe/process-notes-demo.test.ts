import { createDataFrame, type DataFrame, s } from "@tidy-ts/dataframe";
import { z } from "zod";

/**
 * Zod schema for note records from Oracle queries
 */
const noteRecordSchema = z.object({
  identity_id: z.string(),
  note_id: z.number(),
  line: z.number(),
  note_text: z.string(),
  contact_date_real: z.date().optional(),
});

/**
 * Common structure for note records from Oracle queries
 */
type NoteRecord = z.infer<typeof noteRecordSchema>;

/**
 * Processes note records by combining multiple lines into single notes
 * and keeping only the latest version of each note.
 *
 * @param notes - Array of note records from Oracle
 * @returns DataFrame with consolidated notes
 */
export function processNotes<T extends NoteRecord>(
  notes: T[],
): DataFrame<{
  identity_id: string;
  note_id: number;
  contact_date_real?: Date | undefined;
  note_text: string;
  concat_line: string;
  num_lines: number;
  num_lines2: number;
  num_lines3: number;
}> {
  const df = createDataFrame(notes, noteRecordSchema); // Zod schema

  // Step 1: Group by all fields except line and note_text, combine note_text
  const combinedDf = df
    .groupBy("identity_id", "note_id", "contact_date_real")
    .summarize({
      note_text: (group) => group.note_text.join(""), // Combine all note_text
      concat_line: (group) => group.line.join(","), // Combine all line
      num_lines: (group) => group.line.length, // Combine all line
      num_lines2: (group) => group.nrows(), // Combine all line
      num_lines3: (group) => s.sum(group.line), // Combine all line
    });

  // Step 2: Keep only the latest version of each note
  const finalDf = combinedDf
    .groupBy(["identity_id", "note_id"])
    .sliceMax("contact_date_real", 1)
    .ungroup();

  return finalDf;
}

Deno.test("processNotes - Basic functionality with defined dates", () => {
  const notes: NoteRecord[] = [
    {
      identity_id: "user1",
      note_id: 1,
      line: 1,
      note_text: "First line of note",
      contact_date_real: new Date("2024-01-15"),
    },
    {
      identity_id: "user1",
      note_id: 1,
      line: 2,
      note_text: "Second line of note",
      contact_date_real: new Date("2024-01-15"),
    },
    {
      identity_id: "user1",
      note_id: 2,
      line: 1,
      note_text: "Another note",
      contact_date_real: new Date("2024-01-20"),
    },
  ];

  const result = processNotes(notes);
  result.print();
});
