/**
 * Minimal type-check reproduction for slow DataFrame type resolution.
 *
 * Self-contained — only depends on @tidy-ts/dataframe and zod.
 *
 * Run:  deno check scripts/type-profiling/repro.ts
 *
 * Context: In a real codebase with ~20 functions that accept DataFrame<T>
 * and chain .filter/.groupBy/.mutate/.summarize, type checking takes 28s+
 * with 55k recursive depth-limit hits and 13M type instantiations.
 *
 * This file reproduces the pattern: generic functions that accept
 * DataFrame<T extends SomeConstraint> and return DataFrame<SomeOtherType>,
 * each triggering full structural comparison of the DataFrame interface.
 */

import { createDataFrame, type DataFrame, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

// ── Zod schemas (mirrors QI-Core FHIR resource types) ───────────────────

const codeSystemEnum = z.enum([
  "ICD10CM", "ICD10PCS", "SNOMEDCT", "CPT4", "HCPCS",
  "LOINC", "RxNorm", "CVX", "CDT",
]);
type CodeSystem = z.infer<typeof codeSystemEnum>;

const plainDateTimeType = z.custom<Temporal.PlainDateTime>(
  (v) => v instanceof Temporal.PlainDateTime,
);

const periodSchema = z.object({
  start: plainDateTimeType,
  end: plainDateTimeType,
});

const quantitySchema = z.object({
  value: z.number(),
  unit: z.string(),
});

const encounterSchema = z.object({
  id: z.string(),
  type: z.string(),
  typeSystem: codeSystemEnum,
  class: z.string(),
  period: periodSchema,
  reasonCode: z.string().or(z.undefined()),
  reasonCodeSystem: codeSystemEnum.or(z.undefined()),
  length: quantitySchema.or(z.undefined()),
});
type Encounter = z.infer<typeof encounterSchema>;

const observationSchema = z.object({
  id: z.string(),
  code: z.string(),
  codeSystem: codeSystemEnum,
  effectiveDateTime: plainDateTimeType,
});
type Observation = z.infer<typeof observationSchema>;

const diagnosisSchema = z.object({
  id: z.string(),
  code: z.string(),
  codeSystem: codeSystemEnum,
  onsetDateTime: plainDateTimeType,
  clinicalStatus: z.string(),
  verificationStatus: z.string(),
  category: z.string(),
});
type Diagnosis = z.infer<typeof diagnosisSchema>;

const procedureSchema = z.object({
  id: z.string(),
  code: z.string(),
  codeSystem: codeSystemEnum,
  performedDateTime: plainDateTimeType,
});
type Procedure = z.infer<typeof procedureSchema>;

const medicationRequestSchema = z.object({
  id: z.string(),
  medicationCode: z.string(),
  medicationCodeSystem: codeSystemEnum,
  authoredOn: plainDateTimeType,
  intent: z.string(),
  dosageInstruction: z.string().or(z.undefined()),
  frequency: z.number().or(z.undefined()),
});
type MedicationRequest = z.infer<typeof medicationRequestSchema>;

const observationWithValueSchema = z.object({
  id: z.string(),
  code: z.string(),
  codeSystem: codeSystemEnum,
  effectiveDateTime: plainDateTimeType,
  valueCodeableConcept: z.string(),
  valueCodeableConceptSystem: codeSystemEnum,
});
type ObservationWithValue = z.infer<typeof observationWithValueSchema>;

type Roster = { id: string };

// ── Generic functions that accept/return DataFrames ─────────────────────
// Each function signature forces tsc to structurally compare DataFrame<T>
// against DataFrame<U> — this is where the 55k depth-limit hits come from.

function anyEventsWithCode<
  K extends string,
  C extends string,
  T extends Record<"id", string> & Record<K, Temporal.PlainDateTime> & Record<C, string>,
>(opts: {
  roster: DataFrame<Roster>;
  events: DataFrame<T>;
  fieldName: K;
  codeField: C;
  codes: Set<string>;
  start: Temporal.PlainDateTime;
  end: Temporal.PlainDateTime;
}): DataFrame<{ id: string; value: boolean }> {
  const filtered = opts.events
    .filter((r) => opts.codes.has(r[opts.codeField]))
    .filter((r) => {
      const d = r[opts.fieldName];
      return Temporal.PlainDateTime.compare(d, opts.start) >= 0 &&
        Temporal.PlainDateTime.compare(d, opts.end) <= 0;
    });
  return opts.roster.leftJoin(
    filtered.distinct("id").mutate({ value: () => true }),
    { keys: { left: "id", right: "id" } },
  ).mutate({ value: (r) => r.value ?? false }).select("id", "value");
}

function countEncountersOverlapping<
  T extends Record<"id", string> & Record<"type", string>,
>(opts: {
  roster: DataFrame<Roster>;
  events: DataFrame<T>;
  codes: Set<string>;
  getStart: (r: T) => Temporal.PlainDateTime;
  getEnd: (r: T) => Temporal.PlainDateTime;
  start: Temporal.PlainDateTime;
  end: Temporal.PlainDateTime;
}): DataFrame<{ id: string; value: number }> {
  const filtered = opts.events
    .filter((r) => opts.codes.has(r.type))
    .filter((r) => {
      const s = opts.getStart(r);
      const e = opts.getEnd(r);
      return Temporal.PlainDateTime.compare(s, opts.end) <= 0 &&
        Temporal.PlainDateTime.compare(e, opts.start) >= 0;
    });
  const counts = filtered.count("id");
  return opts.roster.leftJoin(counts, { keys: { left: "id", right: "id" } })
    .mutate({ value: (r) => r.count ?? 0 })
    .select("id", "value");
}

function ageAtDate(opts: {
  roster: DataFrame<Roster>;
  birthDates: DataFrame<Observation>;
  referenceDate: Temporal.PlainDateTime;
}): DataFrame<{ id: string; value: number }> {
  return opts.roster.leftJoin(
    opts.birthDates.select("id", "effectiveDateTime"),
    { keys: { left: "id", right: "id" } },
  ).mutate({
    value: (r) => {
      if (!r.effectiveDateTime) return 0;
      const years = r.effectiveDateTime.until(opts.referenceDate).total({ unit: "years" });
      return Math.floor(years);
    },
  }).select("id", "value");
}

function collapsedDaysPerPatient(
  intervals: DataFrame<{ id: string; _ivStart: Temporal.PlainDateTime; _ivEnd: Temporal.PlainDateTime }>,
): DataFrame<{ id: string; value: number }> {
  return intervals
    .arrange(["id", "_ivStart"], ["asc", "asc"])
    .groupBy("id")
    .mutate({
      _maxEndSoFar: (_, i, df) =>
        s.cummax(df.extract("_ivEnd") as Temporal.PlainDateTime[])[i],
    })
    .mutate({
      _prevMaxEnd: (_, i, df) =>
        s.lag(df.extract("_maxEndSoFar") as Temporal.PlainDateTime[])[i],
    })
    .mutate({
      _effectiveStart: (r) =>
        r._prevMaxEnd &&
          Temporal.PlainDateTime.compare(r._ivStart, r._prevMaxEnd) <= 0
          ? r._prevMaxEnd
          : r._ivStart,
    })
    .mutate({
      _contribution: (r) =>
        Math.max(0, r._effectiveStart.until(r._ivEnd).total({ unit: "days" })),
    })
    .groupBy("id")
    .summarize({
      value: (g) => Math.floor(s.sum(g.extract("_contribution"))),
    });
}

function consecutiveValues(opts: {
  roster: DataFrame<Roster>;
  events: DataFrame<{ id: string; effectiveDateTime: Temporal.PlainDateTime; value: number }>;
  threshold: number;
  minCount: number;
}): DataFrame<{ id: string; value: boolean }> {
  const metDf = opts.events
    .arrange(["id", "effectiveDateTime"], ["asc", "asc"])
    .groupBy("id")
    .mutate({ _match: (r) => (r.value >= opts.threshold ? 1 : 0) })
    .mutate({
      _prevMatch: (_, i, df) =>
        s.lag(df.extract("_match") as number[], { defaultValue: 0 })[i]!,
    })
    .mutate({
      _streakStart: (r) => (r._match === 1 && r._prevMatch === 0 ? 1 : 0),
    })
    .groupBy("id")
    .mutate({
      _streakId: (_, i, df) =>
        s.cumsum(df.extract("_streakStart") as number[])[i],
    })
    .filter((r) => r._match === 1)
    .count("id", "_streakId")
    .filter((r) => r.count >= opts.minCount)
    .distinct("id");

  return opts.roster.leftJoin(
    metDf.mutate({ value: () => true }),
      { keys: { left: "id", right: "id" } },
  ).mutate({ value: (r) => r.value ?? false }).select("id", "value");
}

// ── Create DataFrames ───────────────────────────────────────────────────

const dt = (d: string) => Temporal.PlainDateTime.from(d);

const MP_START = dt("2025-01-01");
const MP_END = dt("2025-12-31");

const roster = createDataFrame([
  { id: "P1" }, { id: "P2" }, { id: "P3" }, { id: "P4" }, { id: "P5" },
]);

const birthDates = createDataFrame([
  { id: "P1", code: "DOB", codeSystem: "SNOMEDCT" as CodeSystem, effectiveDateTime: dt("1980-06-15") },
  { id: "P2", code: "DOB", codeSystem: "SNOMEDCT" as CodeSystem, effectiveDateTime: dt("2016-03-01") },
  { id: "P3", code: "DOB", codeSystem: "SNOMEDCT" as CodeSystem, effectiveDateTime: dt("1963-01-10") },
  { id: "P4", code: "DOB", codeSystem: "SNOMEDCT" as CodeSystem, effectiveDateTime: dt("1995-08-20") },
  { id: "P5", code: "DOB", codeSystem: "SNOMEDCT" as CodeSystem, effectiveDateTime: dt("1975-04-05") },
]);

const encounters = createDataFrame([
  { id: "P1", type: "99213", typeSystem: "CPT4" as CodeSystem, class: "AMB", period: { start: dt("2025-03-01"), end: dt("2025-03-01") }, reasonCode: undefined, reasonCodeSystem: undefined, length: undefined },
  { id: "P1", type: "99213", typeSystem: "CPT4" as CodeSystem, class: "AMB", period: { start: dt("2025-06-01"), end: dt("2025-06-01") }, reasonCode: undefined, reasonCodeSystem: undefined, length: undefined },
  { id: "P2", type: "99213", typeSystem: "CPT4" as CodeSystem, class: "AMB", period: { start: dt("2025-03-01"), end: dt("2025-03-01") }, reasonCode: undefined, reasonCodeSystem: undefined, length: undefined },
  { id: "P3", type: "99213", typeSystem: "CPT4" as CodeSystem, class: "AMB", period: { start: dt("2025-02-01"), end: dt("2025-02-01") }, reasonCode: undefined, reasonCodeSystem: undefined, length: undefined },
  { id: "P4", type: "99213", typeSystem: "CPT4" as CodeSystem, class: "AMB", period: { start: dt("2025-04-01"), end: dt("2025-04-01") }, reasonCode: undefined, reasonCodeSystem: undefined, length: undefined },
], encounterSchema);

const diagnoses = createDataFrame([], diagnosisSchema);
const medications = createDataFrame([], medicationRequestSchema);

const procedures = createDataFrame([
  { id: "P3", code: "99406", codeSystem: "CPT4" as CodeSystem, performedDateTime: dt("2025-09-15") },
]);

const screenings = createDataFrame([
  { id: "P1", code: "72166-2", codeSystem: "LOINC" as CodeSystem, effectiveDateTime: dt("2025-06-15"), valueCodeableConcept: "266919005", valueCodeableConceptSystem: "SNOMEDCT" as CodeSystem },
  { id: "P3", code: "72166-2", codeSystem: "LOINC" as CodeSystem, effectiveDateTime: dt("2025-03-15"), valueCodeableConcept: "428041000124106", valueCodeableConceptSystem: "SNOMEDCT" as CodeSystem },
]);

// ── Call the generic functions — each triggers DataFrame structural comparison ─

const visitCodes = new Set(["99213"]);
const screeningCodes = new Set(["72166-2"]);
const counselingCodes = new Set(["99406"]);

const ages = ageAtDate({ roster, birthDates, referenceDate: MP_START });

const visitCounts = countEncountersOverlapping({
  roster,
  events: encounters,
  codes: visitCodes,
  getStart: (r) => r.period.start,
  getEnd: (r) => r.period.end,
  start: MP_START,
  end: MP_END,
});

const hasScreening = anyEventsWithCode({
  roster,
  events: screenings,
  fieldName: "effectiveDateTime",
  codeField: "code",
  codes: screeningCodes,
  start: MP_START,
  end: MP_END,
});

const hasCounseling = anyEventsWithCode({
  roster,
  events: procedures,
  fieldName: "performedDateTime",
  codeField: "code",
  codes: counselingCodes,
  start: MP_START,
  end: MP_END,
});

const hasDiagnosis = anyEventsWithCode({
  roster,
  events: diagnoses,
  fieldName: "onsetDateTime",
  codeField: "code",
  codes: new Set<string>(),
  start: MP_START,
  end: MP_END,
});

const hasMedication = anyEventsWithCode({
  roster,
  events: medications,
  fieldName: "authoredOn",
  codeField: "medicationCode",
  codes: new Set<string>(),
  start: MP_START,
  end: MP_END,
});

// ── Use results so tsc doesn't skip ─────────────────────────────────────

console.log(
  ages.nrows(),
  visitCounts.nrows(),
  hasScreening.nrows(),
  hasCounseling.nrows(),
  hasDiagnosis.nrows(),
  hasMedication.nrows(),
);
