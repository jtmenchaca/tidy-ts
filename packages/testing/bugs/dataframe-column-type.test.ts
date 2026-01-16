import { expect } from "@std/expect";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("DataFrame as column type", () => {
  // Create a simple nested DataFrame
  const nested = createDataFrame([
    { id: 1, value: "a" },
    { id: 2, value: "b" },
  ]);

  // Create a DataFrame with a DataFrame column
  const df = createDataFrame([
    { name: "group1", data: nested },
    { name: "group2", data: nested },
  ]);

  const _typeCheck: DataFrame<{
    name: string;
    data: DataFrame<{ id: number; value: string }>;
  }> = df;

  expect(df.nrows()).toBe(2);
  expect(df.columns()).toEqual(["name", "data"]);
});

Deno.test("Create nested dataframe", () => {
  // Create a simple nested DataFrame

  type NestedRow = {
    id: number;
    value: string;
  };
  const nested: (NestedRow | null)[] = [
    { id: 1, value: "a" },
    { id: 2, value: "b" },
    null,
  ];

  // Create a DataFrame with a DataFrame column
  const df = createDataFrame([
    { name: "group1", data: nested },
    { name: "group2", data: nested },
  ])
    .mutate({
      data: (row) => row.data.filter((r) => r !== null),
    })
    .mutate({
      data: (row) => createDataFrame(row.data),
    });

  const _typeCheck: DataFrame<{
    name: string;
    data: DataFrame<{ id: number; value: string }>;
  }> = df;

  expect(df.nrows()).toBe(2);
  expect(df.columns()).toEqual(["name", "data"]);
});

// FHIR-like patterns: mimicking the Bundle structure
type Resource = {
  resourceType: string;
  id: string;
  name?: string;
};

type BundleEntry = {
  fullUrl?: string;
  resource?: Resource; // Single optional resource (not an array!)
  search?: {
    mode: string;
    score?: number;
  };
};

Deno.test("FHIR Pattern 1: Filter entries with resources and keep as objects", () => {
  const entries: BundleEntry[] = [
    {
      fullUrl: "http://example.com/Patient/1",
      resource: { resourceType: "Patient", id: "1", name: "Alice" },
      search: { mode: "match" },
    },
    {
      fullUrl: "http://example.com/Patient/2",
      resource: { resourceType: "Patient", id: "2", name: "Bob" },
      search: { mode: "match" },
    },
    {
      fullUrl: "http://example.com/Patient/3",
      // No resource - this entry should be filtered out
      search: { mode: "include" },
    },
  ];

  // Correct approach: filter out entries without resources
  const df = createDataFrame(entries)
    .filter((row) => row.resource !== undefined);

  expect(df.nrows()).toBe(2);
  expect(df.columns()).toEqual(["fullUrl", "resource", "search"]);
});

Deno.test("FHIR Pattern 2: Flatten entries to extract resources only", () => {
  const entries: BundleEntry[] = [
    {
      fullUrl: "http://example.com/Patient/1",
      resource: { resourceType: "Patient", id: "1", name: "Alice" },
    },
    {
      fullUrl: "http://example.com/Patient/2",
      resource: { resourceType: "Patient", id: "2", name: "Bob" },
    },
    {
      fullUrl: "http://example.com/Patient/3",
      // No resource
    },
  ];

  // Extract and flatten resources into a separate DataFrame
  const resources = entries
    .map((e) => e.resource)
    .filter((r): r is Resource => r !== undefined);

  const resourcesDF = createDataFrame(resources);

  expect(resourcesDF.nrows()).toBe(2);
  expect(resourcesDF.columns()).toEqual(["resourceType", "id", "name"]);
});

Deno.test("FHIR Pattern 3: Nested DataFrames for array fields (link arrays)", () => {
  type BundleLink = {
    relation: string;
    url: string;
  };

  type BundleWithLinks = {
    type: string;
    total: number;
    link?: BundleLink[]; // Array of links
  };

  const bundles: BundleWithLinks[] = [
    {
      type: "searchset",
      total: 100,
      link: [
        { relation: "self", url: "http://example.com/Patient?_count=10" },
        {
          relation: "next",
          url: "http://example.com/Patient?_count=10&page=2",
        },
      ],
    },
    {
      type: "searchset",
      total: 50,
      link: [
        { relation: "self", url: "http://example.com/Observation?_count=10" },
      ],
    },
    {
      type: "searchset",
      total: 0,
      // No links
    },
  ];

  // Convert array fields to nested DataFrames
  const df = createDataFrame(bundles)
    .mutate({
      link: (row) => row.link ? createDataFrame(row.link) : undefined,
    });

  expect(df.nrows()).toBe(3);
  expect(df.columns()).toEqual(["type", "total", "link"]);

  // Verify first row has a nested DataFrame
  const firstRow = df.at(0);
  expect(firstRow?.link).toBeDefined();
  expect(firstRow?.link?.nrows()).toBe(2);
});

Deno.test("FHIR Pattern 4: Complex nested with multiple array fields", () => {
  type Coding = {
    system: string;
    code: string;
    display?: string;
  };

  type CodeableConcept = {
    coding?: Coding[];
    text?: string;
  };

  type Observation = {
    resourceType: string;
    id: string;
    code: CodeableConcept;
    valueQuantity?: {
      value: number;
      unit: string;
    };
  };

  const observations: Observation[] = [
    {
      resourceType: "Observation",
      id: "1",
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "8480-6",
            display: "Systolic BP",
          },
          { system: "http://snomed.info", code: "271649006" },
        ],
        text: "Blood Pressure",
      },
      valueQuantity: { value: 120, unit: "mmHg" },
    },
    {
      resourceType: "Observation",
      id: "2",
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "8462-4",
            display: "Diastolic BP",
          },
        ],
        text: "Blood Pressure",
      },
      valueQuantity: { value: 80, unit: "mmHg" },
    },
  ];

  // Nested DataFrame for coding arrays
  const df = createDataFrame(observations)
    .mutate({
      codingDF: (row) =>
        row.code.coding ? createDataFrame(row.code.coding) : undefined,
    });

  expect(df.nrows()).toBe(2);

  const firstRow = df.at(0);
  expect(firstRow?.codingDF?.nrows()).toBe(2);

  const secondRow = df.at(1);
  expect(secondRow?.codingDF?.nrows()).toBe(1);
});
