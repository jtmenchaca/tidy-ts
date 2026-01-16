import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("BUG: extractNthWhereSorted in grouped summarize returns wrong values", () => {
  // Create test data similar to the user's example
  const departmentStats = createDataFrame([
    { identity_id: "patient1", department_id: "deptA", encounter_count: 5 },
    { identity_id: "patient1", department_id: "deptB", encounter_count: 3 },
    { identity_id: "patient1", department_id: "deptC", encounter_count: 8 },
    { identity_id: "patient2", department_id: "deptA", encounter_count: 2 },
    { identity_id: "patient2", department_id: "deptB", encounter_count: 7 },
    { identity_id: "patient2", department_id: "deptC", encounter_count: 1 },
  ]);

  console.log("Original data:");
  departmentStats.print();

  // Test simple case first
  console.log("\nTesting extractNthWhereSorted on ungrouped data:");
  const testResult = departmentStats.extractNthWhereSorted(
    "department_id",
    "encounter_count",
    "desc",
    1,
  );
  console.log("Ungrouped result (should be deptC):", testResult);

  // This should work but might be buggy
  console.log("\nTesting grouped summarize:");
  const patientTopDepartments = departmentStats
    .groupBy("identity_id")
    .summarize({
      second_department_encounters: (g) =>
        g.extractNthWhereSorted(
          "encounter_count",
          "encounter_count",
          "desc",
          2,
        ),
      department_count: (g) => g.nrows(),
    });

  patientTopDepartments.print();
  console.log(patientTopDepartments.nrows());
  console.log(patientTopDepartments.columns());
});
