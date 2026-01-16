import { createDataFrame, type DataFrame, s } from "@tidy-ts/dataframe";
import { z } from "zod";
import { expect } from "@std/expect";

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

Deno.test("processNotes - Realistic scenario with nullable contact_date_real", () => {
  // Simulate real-world data where contact_date_real can be null/undefined
  // This represents notes from a system where some contacts don't have timestamps
  const notes: NoteRecord[] = [
    // Customer 1: Has multiple note versions with different dates
    {
      identity_id: "customer_12345",
      note_id: 1001,
      line: 1,
      note_text: "Initial customer inquiry about pricing",
      contact_date_real: new Date("2024-01-10T09:30:00Z"),
    },
    {
      identity_id: "customer_12345",
      note_id: 1001,
      line: 2,
      note_text: "Customer requested quote for premium package",
      contact_date_real: new Date("2024-01-10T09:30:00Z"),
    },
    {
      identity_id: "customer_12345",
      note_id: 1001,
      line: 1,
      note_text: "Follow-up call - customer interested in basic package",
      contact_date_real: new Date("2024-01-15T14:20:00Z"),
    },
    {
      identity_id: "customer_12345",
      note_id: 1001,
      line: 2,
      note_text: "Customer wants to proceed with purchase",
      contact_date_real: new Date("2024-01-15T14:20:00Z"),
    },

    // Customer 2: Has notes with undefined dates (system didn't record timestamps)
    {
      identity_id: "customer_67890",
      note_id: 2001,
      line: 1,
      note_text: "Customer complaint about delivery delay",
      contact_date_real: undefined, // System error - timestamp not recorded
    },
    {
      identity_id: "customer_67890",
      note_id: 2001,
      line: 2,
      note_text: "Customer requested refund",
      contact_date_real: undefined, // System error - timestamp not recorded
    },
    {
      identity_id: "customer_67890",
      note_id: 2001,
      line: 1,
      note_text: "Resolution provided - customer satisfied",
      contact_date_real: new Date("2024-01-12T11:45:00Z"), // Later timestamp available
    },

    // Customer 3: Mixed scenario - some notes have dates, others don't
    {
      identity_id: "customer_11111",
      note_id: 3001,
      line: 1,
      note_text: "Initial contact - no timestamp recorded",
      contact_date_real: undefined,
    },
    {
      identity_id: "customer_11111",
      note_id: 3001,
      line: 2,
      note_text: "Customer provided requirements",
      contact_date_real: undefined,
    },
    {
      identity_id: "customer_11111",
      note_id: 3001,
      line: 1,
      note_text: "Updated requirements after consultation",
      contact_date_real: new Date("2024-01-08T16:30:00Z"),
    },
    {
      identity_id: "customer_11111",
      note_id: 3001,
      line: 2,
      note_text: "Final proposal sent",
      contact_date_real: new Date("2024-01-08T16:30:00Z"),
    },

    // Customer 4: All notes have undefined dates (legacy system)
    {
      identity_id: "customer_99999",
      note_id: 4001,
      line: 1,
      note_text: "Legacy system note - no timestamps available",
      contact_date_real: undefined,
    },
    {
      identity_id: "customer_99999",
      note_id: 4001,
      line: 2,
      note_text: "Customer service interaction",
      contact_date_real: undefined,
    },
  ];

  console.log("=== REALISTIC SCENARIO: Nullable contact_date_real ===");
  console.log("Input data:");
  notes.forEach((note, i) => {
    console.log(
      `${
        i + 1
      }. ${note.identity_id} | Note ${note.note_id} | Line ${note.line} | Date: ${
        note.contact_date_real?.toISOString() || "UNDEFINED"
      } | Text: "${note.note_text}"`,
    );
  });

  const result = processNotes(notes);

  console.log("\n=== PROCESSED RESULT ===");
  result.print();

  console.log("\n=== ANALYSIS ===");
  const resultArray = result.toArray();

  // Analyze what sliceMax did with nullable dates
  resultArray.forEach((note, i) => {
    console.log(`${i + 1}. ${note.identity_id} | Note ${note.note_id}`);
    console.log(
      `   Date: ${note.contact_date_real?.toISOString() || "UNDEFINED"}`,
    );
    console.log(`   Text: "${note.note_text}"`);
    console.log(`   Lines: ${note.concat_line} (${note.num_lines} total)`);
    console.log(`   Sum of line numbers: ${note.num_lines3}`);
    console.log("");
  });

  // Test expectations
  expect(result.nrows()).toBe(4); // Should have 4 unique customer+note combinations

  // Customer 1 should have the latest date (2024-01-15)
  const customer1 = resultArray.find((n) =>
    n.identity_id === "customer_12345" && n.note_id === 1001
  );
  expect(customer1?.contact_date_real).toEqual(
    new Date("2024-01-15T14:20:00Z"),
  );
  expect(customer1?.note_text).toContain("Follow-up call");

  // Customer 2 should have the defined date (undefined dates should be ignored)
  const customer2 = resultArray.find((n) =>
    n.identity_id === "customer_67890" && n.note_id === 2001
  );
  expect(customer2?.contact_date_real).toEqual(
    new Date("2024-01-12T11:45:00Z"),
  );
  expect(customer2?.note_text).toContain("Resolution provided");

  // Customer 3 should have the defined date
  const customer3 = resultArray.find((n) =>
    n.identity_id === "customer_11111" && n.note_id === 3001
  );
  expect(customer3?.contact_date_real).toEqual(
    new Date("2024-01-08T16:30:00Z"),
  );
  expect(customer3?.note_text).toContain("Updated requirements");

  // Customer 4 should have undefined date (all were undefined)
  const customer4 = resultArray.find((n) =>
    n.identity_id === "customer_99999" && n.note_id === 4001
  );
  expect(customer4?.contact_date_real).toBeUndefined();
  expect(customer4?.note_text).toContain("Legacy system");
});
