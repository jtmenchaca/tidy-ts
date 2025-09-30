import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("Debug groupBy with dates", () => {
  const data = [
    {
      identity_id: "user1",
      note_id: 1,
      line: 1,
      note_text: "First line",
      contact_date_real: new Date("2024-01-15"),
    },
    {
      identity_id: "user1",
      note_id: 1,
      line: 2,
      note_text: "Second line",
      contact_date_real: new Date("2024-01-15"),
    },
  ];

  const df = createDataFrame(data);

  console.log("Original data:");
  df.print();

  console.log("\nGrouping by identity_id, note_id, contact_date_real:");
  const grouped = df.groupBy("identity_id", "note_id", "contact_date_real");

  const result = grouped.summarize({
    lines: (g) => g.line.join(","),
    texts: (g) => g.note_text.join(" + "),
    count: (g) => g.line.length,
  });

  console.log("\nSummarized result:");
  result.print();

  console.log("\nChecking date equality:");
  const date1 = new Date("2024-01-15");
  const date2 = new Date("2024-01-15");
  console.log("date1:", date1);
  console.log("date2:", date2);
  console.log("date1 === date2:", date1 === date2);
  console.log(
    "date1.getTime() === date2.getTime():",
    date1.getTime() === date2.getTime(),
  );
});
