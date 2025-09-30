import { s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Min and Max with Date objects", () => {
  console.log("\n=== MIN AND MAX WITH DATE OBJECTS ===");

  // Sample date data
  const dates = [
    new Date("2024-01-01T10:00:00Z"),
    new Date("2024-01-02T11:30:00Z"),
    new Date("2024-01-03T09:15:00Z"),
    new Date("2024-01-04T14:45:00Z"),
    new Date("2024-01-05T16:20:00Z"),
  ];

  const mixedDates = [
    new Date("2024-01-01T10:00:00Z"),
    new Date("2024-01-02T11:30:00Z"),
    null, // null date
    new Date("2024-01-04T14:45:00Z"),
    undefined, // undefined date
  ];
  const minDate = s.min(dates); // should work
  const maxDate = s.max(dates); // should work
  const minMixedDates = s.min(mixedDates); // should have compile issue due to missing values (undefined/null)
  const maxMixedDates = s.max(mixedDates); // should have compile issue due to missing values (undefined/null)
  const minMixedDatesRemoveNA = s.min(mixedDates, true); // should work
  const maxMixedDatesRemoveNA = s.max(mixedDates, true); // should work

  console.log("Min date:", minDate);
  console.log("Max date:", maxDate);
  console.log("Min mixed dates:", minMixedDates);
  console.log("Max mixed dates:", maxMixedDates);
  console.log("Min mixed dates (removeNA):", minMixedDatesRemoveNA);
  console.log("Max mixed dates (removeNA):", maxMixedDatesRemoveNA);

  // Test expectations
  expect(minDate).toEqual(new Date("2024-01-01T10:00:00Z"));
  expect(maxDate).toEqual(new Date("2024-01-05T16:20:00.000Z"));
  expect(minMixedDates).toEqual(new Date("2024-01-01T10:00:00Z"));
  expect(maxMixedDates).toEqual(new Date("2024-01-04T14:45:00Z"));
  expect(minMixedDatesRemoveNA).toEqual(new Date("2024-01-01T10:00:00Z"));
  expect(maxMixedDatesRemoveNA).toEqual(new Date("2024-01-04T14:45:00Z"));
});
