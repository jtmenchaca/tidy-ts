/**
 * Demo Resample 2 - Healthcare Topic Completion Rate Over Time
 *
 * This demo shows how to use time series functionalities to track healthcare
 * topic completion rates over time. Topics can cycle through statuses:
 * "Due Soon" -> "Overdue" -> "Not Due" -> "Due Soon" (e.g., breast cancer screening)
 */

import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

const formatMonthYear = (value: unknown) => {
  const date = value instanceof Date
    ? value
    : typeof value === "string"
    ? new Date(value)
    : typeof value === "number"
    ? new Date(value)
    : null;

  if (!date || Number.isNaN(date.getTime())) {
    return String(value ?? "");
  }

  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const formatPercent = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) {
    return String(value ?? "");
  }
  return `${(numeric * 100).toFixed(0)}%`;
};

// ============================================================================
// Step 1: Create Sample Healthcare History Data
// ============================================================================

type HealthcareHistoryRow = {
  pat_id: string;
  snapshot_date: Date;
  topic_id: number;
  topic_name: string;
  topic_status: "Due Soon" | "Overdue" | "Not Due";
};

/**
 * Generate realistic healthcare history data for 5 patients with multiple topics.
 * Each row represents a status change for a topic.
 */
function generateHealthcareHistory(): DataFrame<HealthcareHistoryRow> {
  const data: HealthcareHistoryRow[] = [];

  const scenarios = [
    {
      pat_id: "P001",
      topics: [
        {
          topic_id: 1,
          topic_name: "Breast Cancer Screening",
          history: [
            ["2024-01-05", "Due Soon"],
            ["2024-02-18", "Overdue"],
            ["2024-03-05", "Not Due"],
            ["2024-06-10", "Due Soon"],
          ],
        },
        {
          topic_id: 2,
          topic_name: "Colonoscopy",
          history: [
            ["2024-01-10", "Due Soon"],
            ["2024-03-01", "Overdue"],
            ["2024-03-20", "Not Due"],
            ["2024-06-25", "Due Soon"],
          ],
        },
      ],
    },
    {
      pat_id: "P002",
      topics: [
        {
          topic_id: 1,
          topic_name: "Breast Cancer Screening",
          history: [
            ["2024-01-20", "Due Soon"],
            ["2024-02-25", "Overdue"],
            ["2024-04-02", "Not Due"],
            ["2024-07-01", "Due Soon"],
          ],
        },
        {
          topic_id: 2,
          topic_name: "Colonoscopy",
          history: [
            ["2024-01-15", "Due Soon"],
            ["2024-04-05", "Overdue"],
            ["2024-04-18", "Not Due"],
            ["2024-07-05", "Due Soon"],
          ],
        },
      ],
    },
  ] as const;

  for (const scenario of scenarios) {
    for (const topic of scenario.topics) {
      for (const [date, status] of topic.history) {
        data.push({
          pat_id: scenario.pat_id,
          snapshot_date: new Date(`${date}T00:00:00Z`),
          topic_id: topic.topic_id,
          topic_name: topic.topic_name,
          topic_status: status,
        });
      }
    }
  }

  data.sort((a, b) => a.snapshot_date.getTime() - b.snapshot_date.getTime());
  return createDataFrame(data);
}

// ============================================================================
// Step 2: Calculate Completion Rate Over Time
// ============================================================================

Deno.test("Demo: Healthcare Topic Completion Rate Over Time", async () => {
  // Generate the healthcare history data
  const hmHistory = generateHealthcareHistory();

  // Step 1: For each patient-topic combination, upsample to daily frequency
  // Group by patient and topic, then upsample each group to daily with forward fill
  const dailyStatus = hmHistory
    .groupBy("pat_id", "topic_id")
    .upsample({
      timeColumn: "snapshot_date",
      frequency: "1D",
      fillMethod: "forward",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-06-30T23:59:59Z"),
    });

  // Step 2: For each day, calculate completion rate
  // Completion rate = (Not Due + Due Soon) / Total topics
  // (Not Due = completed, Due Soon = not yet overdue, Overdue = not completed)
  const completionRateByDay = dailyStatus
    .mutate({
      completed_count: (row) =>
        row.topic_status === "Not Due" || row.topic_status === "Due Soon"
          ? 1
          : 0,
      overdue_count: (row) => row.topic_status === "Overdue" ? 1 : 0,
    })
    .groupBy("snapshot_date")
    .summarize({
      total_topics: (g) => g.nrows(),
      completed_count: (g) => stats.sum(g.completed_count),
      overdue_count: (g) => stats.sum(g.overdue_count),
    })
    .mutate({
      completion_rate: (row) => row.completed_count / row.total_topics,
      overdue_rate: (row) => row.overdue_count / row.total_topics,
    });

  // Step 3: Downsample to weekly for smoother visualization
  const weeklyCompletionRate = completionRateByDay
    .downsample({
      timeColumn: "snapshot_date",
      frequency: "1W",
      aggregations: {
        completion_rate: stats.last,
        overdue_rate: stats.last,
        total_topics: stats.last,
      },
    });

  // Step 4: Create a graph showing completion rate over time

  const chart = weeklyCompletionRate.graph({
    type: "line",
    mappings: {
      x: "snapshot_date",
      y: "completion_rate",
    },
    config: {
      layout: {
        title: "Healthcare Topic Completion Rate Over Time",
        description:
          "Completion rate = (Not Due + Due Soon) / Total Topics. Topics cycle through statuses (e.g., breast cancer screening).",
        width: 800,
        height: 400,
      },
      xAxis: {
        label: "Date",
        tickFormat: formatMonthYear,
      },
      yAxis: {
        label: "Completion Rate",
        domain: [0, 1],
        tickFormat: formatPercent,
      },
      grid: {
        show: true,
      },
    },
  });

  await chart.savePNG({
    filename: `./tests/new_features/time-series/output/completion-rate.png`,
  });
});

// ============================================================================
// Alternative: Show completion rate by topic type
// ============================================================================

Deno.test("Demo: Completion Rate by Topic Type Over Time", async () => {
  const hmHistory = generateHealthcareHistory();

  // Create daily status grid for each patient-topic using grouped upsample
  const startDate = new Date("2024-01-01T00:00:00Z");
  const endDate = new Date("2024-06-30T23:59:59Z");

  const dailyStatus = hmHistory
    .groupBy("pat_id", "topic_id", "topic_name")
    .upsample({
      timeColumn: "snapshot_date",
      frequency: "1D",
      fillMethod: "forward",
      startDate,
      endDate,
    });

  // Calculate completion rate by topic type and day
  const completionRateByTopic = dailyStatus
    .groupBy("snapshot_date", "topic_name")
    .summarize({
      total_patients: (g) => g.nrows(),
      completed_count: (g) =>
        g.filter((row) =>
          row.topic_status === "Not Due" || row.topic_status === "Due Soon"
        ).nrows(),
    })
    .mutate({
      completion_rate: (row) => row.completed_count / row.total_patients,
    })
    .arrange("snapshot_date", "topic_name");

  // Downsample to weekly by topic
  const weeklyByTopic = completionRateByTopic
    .groupBy("topic_name")
    .downsample({
      timeColumn: "snapshot_date",
      frequency: "1W",
      aggregations: {
        completion_rate: stats.last,
      },
    })
    .rename({
      completion_rate: "week_end_completion_rate",
    });

  // Create a multi-series line chart
  const chartByTopic = weeklyByTopic.graph({
    type: "line",
    mappings: {
      x: "snapshot_date",
      y: "week_end_completion_rate",
      series: "topic_name",
      color: "topic_name",
    },
    config: {
      layout: {
        title: "Completion Rate by Topic Type Over Time",
        description:
          "Each line represents a different healthcare topic (e.g., Breast Cancer Screening, Colonoscopy)",
        width: 900,
        height: 500,
      },
      xAxis: {
        label: "Date",
        tickFormat: formatMonthYear,
      },
      yAxis: {
        label: "Completion Rate",
        domain: [0, 1],
        tickFormat: formatPercent,
      },
      legend: {
        show: true,
        position: "right",
      },
      grid: {
        show: true,
      },
    },
  });

  const artifactsDir = "./tests/new_features/time-series/output";
  await Deno.mkdir(artifactsDir, { recursive: true });
  const topicChartPath = `${artifactsDir}/completion-rate-by-topic.png`;
  await chartByTopic.savePNG({ filename: topicChartPath });
});
