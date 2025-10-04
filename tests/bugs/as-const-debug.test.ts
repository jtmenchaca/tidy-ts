import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("bindRows issue", () => {
  type Diagnosis = {
    identity_id: number;
    diagnosis_code: string;
    record_type: "diagnosis";
  };
  type Procedure = {
    procedure_code: string;
    record_type: "procedure";
  };
  const diagnosisDf = createDataFrame([
    { identity_id: 1, diagnosis_code: "A123", record_type: "diagnosis" },
  ]);
  const procedureDf = createDataFrame([
    { procedure_code: "A123", record_type: "procedure" },
  ]);
  // Combine both datasets and sort
  const combinedDf = diagnosisDf
    .bindRows(procedureDf);

  const _typeCheck: DataFrame<{
    identity_id: number;
    diagnosis_code: string;
    record_type: string;
    procedure_code?: string | undefined;
  }> = combinedDf;
  combinedDf.print();

  // Create DataFrames with as const directly
  const diagnosisDf2 = createDataFrame([
    {
      identity_id: 1,
      diagnosis_code: "A123",
      record_type: "diagnosis" as const,
    },
  ]);
  const procedureDf2 = createDataFrame([
    { procedure_code: "A123", record_type: "procedure" as const },
  ]);

  const combinedDf2 = diagnosisDf2
    .bindRows(procedureDf2);

  const _typeCheck2: DataFrame<{
    identity_id: number;
    diagnosis_code: string;
    record_type: "diagnosis" | "procedure";
    procedure_code?: string | undefined;
  }> = combinedDf2;
  combinedDf2.print();
});
