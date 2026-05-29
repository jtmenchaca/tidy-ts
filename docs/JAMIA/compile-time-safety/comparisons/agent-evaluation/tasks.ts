// Five agent-evaluation tasks. Each is a plain-English intent statement
// the LLM is given along with fixture data; the LLM writes a source file
// in the target library, the rig runs it, the LLM iterates up to five
// turns. Tasks are drawn one per main scenario category (1/2/3/4/6).
//
// The intent statement comes verbatim from the scenario's frontmatter
// `Intent:` line. The fixture is small, inline, and identical across the
// three library arms — the LLM reads the same CSV regardless of arm.

export type TaskId = "1a" | "2a" | "3a" | "4a" | "5d";

export interface Task {
  id: TaskId;
  category: string;
  intent: string;
  /** CSV content the rig stages at `data/input.csv` (or two files for
   *  join/bind-rows tasks; see `fixtures`). */
  fixtures: Record<string, string>;
  /** Short description of the planted error: what goes wrong if the
   *  model writes the obvious idiom. Used only by the classifier
   *  prompt — never shown to the model under evaluation. */
  plantedError: string;
}

export const TASKS: Task[] = [
  {
    id: "1a",
    category: "Column reference",
    intent:
      "Compute a `full_name` column by concatenating the `first_name` and `last_name` columns of the patients table, separated by a space.",
    fixtures: {
      "data/patients.csv":
        "patient_id,first_name,last_name\nP001,Alice,Smith\nP002,Bob,Jones\n",
    },
    plantedError:
      "The obvious idiom misspells `first_name` as `firstName` (or `patientId` instead of `patient_id`). pandas / tidyverse silently produce a column of `NaN` / errors only on read. Tidy-TS rejects the misspelled property at compile time.",
  },
  {
    id: "2a",
    category: "Value type",
    intent:
      "Add an `adjusted` column equal to the `test_name` column plus 10. (The intent is intentionally ill-formed — `test_name` is a string. We are interested in what the library does when this is written.)",
    fixtures: {
      "data/labs.csv":
        "patient_id,test_name,result_value\nP001,BNP,7.2\nP002,WBC,140\n",
    },
    plantedError:
      "Arithmetic on a string column. pandas concatenates string+int = TypeError at runtime in some versions, silent in others; tidyverse coerces or errors depending on column. Tidy-TS rejects `string * number` at compile time.",
  },
  {
    id: "3a",
    category: "Missing value",
    intent:
      "Compute a `label` column that formats the `reference_high` column to one decimal place (e.g., `\"120.0\"`). Some rows are missing `reference_high`.",
    fixtures: {
      "data/labs.csv":
        "patient_id,result_value,reference_high\nP001,100,120\nP002,200,\n",
    },
    plantedError:
      "Calling `.toFixed` (or equivalent) on a possibly-null column. pandas / tidyverse silently propagate NaN or raise an opaque format error. Tidy-TS marks the column nullable; `.toFixed` is rejected at compile time without a null guard.",
  },
  {
    id: "4a",
    category: "Join",
    intent:
      "Left-join the labs table onto the patients table on the `encounter_id` key. Return the merged table.",
    fixtures: {
      "data/patients.csv": "patient_id,name\nP001,Alice\n",
      "data/labs.csv":
        "lab_id,encounter_id,patient_id,result_value\nL001,E001,P001,7.2\n",
    },
    plantedError:
      "The patients table has no `encounter_id` column. pandas raises `KeyError` only when the join executes; tidyverse errors similarly. Tidy-TS rejects the join key at compile time.",
  },
  {
    id: "5d",
    category: "Schema composition",
    intent:
      "Combine the two lab tables `labs_a.csv` and `labs_b.csv` row-wise into a single table, then add a `ref_upper` column equal to the uppercase of the `reference_range` column.",
    fixtures: {
      "data/labs_a.csv":
        "patient_id,test_name,result_value,lab_site\nP001,BNP,1250,Main\nP002,WBC,15.2,Main\n",
      "data/labs_b.csv":
        "patient_id,test_name,result_value,reference_range\nP003,HbA1c,8.9,4.0-5.6\nP004,Glucose,210,70-100\n",
    },
    plantedError:
      "After row-binding two tables with mismatched schemas, `reference_range` is `null` for the rows from `labs_a`. pandas / tidyverse silently propagate `NaN` through `.str.upper()`. Tidy-TS marks the column optional after `bindRows` and rejects `.toUpperCase()` without narrowing.",
  },
];
