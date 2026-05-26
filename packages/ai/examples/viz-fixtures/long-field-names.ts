// Viz fixture: long field names + long enum values.
//
// Stresses the per-node width calculator. The enum has too many values
// to render inline, so it should collapse to `enum[N]`. Field names are
// snake_case and verbose to test that the calculator handles them.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const InsuranceCarrier = z.enum([
  "BlueCrossBlueShield",
  "Aetna",
  "UnitedHealthcare",
  "Cigna",
  "Humana",
  "Kaiser",
  "Anthem",
  "Centene",
  "Molina",
  "Other",
]);

const start = build.start({
  name: "start",
  inputSchema: z.object({
    patient_account_number_with_check_digit: z.string(),
  }),
});

const lookup = build.agentNode({
  name: "lookup_carrier",
  agent: build.agent({
    name: "lookup_carrier",
    llmConfig: nano,
    systemPromptTemplate: `Identify the insurance carrier from the account number prefix.\n\nAccount: {{patient_account_number_with_check_digit}}`,
    inputSchema: z.object({
    patient_account_number_with_check_digit: z.string(),
  }),
    outputSchema: z.object({
    primary_insurance_carrier: InsuranceCarrier,
    secondary_insurance_carrier: InsuranceCarrier.nullable(),
    eligibility_verification_status: z.enum([
      "verified",
      "pending_verification",
      "verification_failed",
      "expired_coverage",
    ]),
  }),
  }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({
    primary_insurance_carrier: InsuranceCarrier,
    secondary_insurance_carrier: InsuranceCarrier.nullable(),
    eligibility_verification_status: z.enum([
      "verified",
      "pending_verification",
      "verification_failed",
      "expired_coverage",
    ]),
  }),
});

export default build.create({
  id: "INSURANCE_LOOKUP",
  name: "INSURANCE_LOOKUP",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, lookup, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: lookup }),
    build.controlFlowEdge({ name: "l->e", fromNode: lookup, toNode: end }),
  ],
});
