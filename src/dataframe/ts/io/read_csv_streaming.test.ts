import { z } from "zod";
import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { read_csv_streaming } from "./read_csv_streaming.ts";

const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
  active: z.boolean(),
});

Deno.test("streaming CSV with tidy-ts patterns", async () => {
  const dataframe = read_csv_streaming("./users.csv", userSchema, {
    batch_size: 100, // snake_case, not batchSize
    naValues: ["", "NULL"], // same as read_csv
    trim: true, // same as read_csv
  });

  const dataframe1 = await dataframe
    .mutate({
      email_domain: (row) => row.email.split("@")[1],
    })
    .filter((row) => row.active);

  let totalRows = 0;
  const processedEmails: string[] = [];

  expect(totalRows).toBeGreaterThan(0);
  expect(processedEmails.length).toBeGreaterThan(0);
});
