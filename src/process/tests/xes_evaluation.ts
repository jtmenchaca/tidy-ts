/**
 * XES Evaluation - Demonstrate process mining functionality on 100 patients
 */

import { readXES } from "../readXES.ts";
import { formatDuration } from "../analysis/performance/format-duration.ts";

Deno.test("xesEvaluation", async () => {
  const filePath = "/Users/jtmenchaca/sources/mimicel/mimicel_100patients.xes";
  console.log("Process Mining Evaluation: 100 ED Patients\n");
  console.log("=".repeat(60));

  // Load XES file (returns XESLog directly)
  const log = await readXES(filePath);

  // 1. Basic Statistics
  console.log("\n1. BASIC STATISTICS");
  console.log("-".repeat(60));
  console.log(`Cases (ED Visits): ${log.ntraces().toLocaleString()}`);
  console.log(`Total Events: ${log.nevents().toLocaleString()}`);
  console.log(
    `Events per Case (avg): ${(log.nevents() / log.ntraces()).toFixed(1)}`,
  );
  const uniqueActivities = new Set<string>();
  for (const trace of log) {
    for (const event of trace.events) {
      const activity = event["concept:name"] || event.activity;
      if (typeof activity === "string") uniqueActivities.add(activity);
    }
  }
  console.log(`Unique Activities: ${uniqueActivities.size}`);

  // 2. Case Durations
  console.log("\n2. CASE DURATIONS");
  console.log("-".repeat(60));
  const durations = log.caseDurations();

  console.log(durations);
  const durationArray = Array.from(durations.values());
  if (durationArray.length > 0) {
    const avgDuration = durationArray.reduce((a, b) => a + b, 0) /
      durationArray.length;
    const minDuration = Math.min(...durationArray);
    const maxDuration = Math.max(...durationArray);
    console.log(`Average ED visit: ${formatDuration(avgDuration)}`);
    console.log(`Shortest visit: ${formatDuration(minDuration)}`);
    console.log(`Longest visit: ${formatDuration(maxDuration)}`);
  }

  // 3. Activity Statistics
  console.log("\n3. ACTIVITY STATISTICS (Top 10)");
  console.log("-".repeat(60));
  const activityStats = log.activityStats();
  activityStats.slice(0, 10).forEach((stat, i) => {
    const avg = stat.avgDuration ? formatDuration(stat.avgDuration) : "N/A";
    console.log(`${i + 1}. ${stat.activity}`);
    console.log(
      `   Frequency: ${stat.frequency.toLocaleString()}, Avg Duration: ${avg}`,
    );
  });

  // 4. Start and End Activities
  console.log("\n4. START & END ACTIVITIES");
  console.log("-".repeat(60));
  const { startActivities, endActivities } = log.startEndActivities();
  console.log("Start Activities:");
  Array.from(startActivities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([activity, count]) => {
      console.log(`  ${activity}: ${count} cases`);
    });
  console.log("\nEnd Activities:");
  Array.from(endActivities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([activity, count]) => {
      console.log(`  ${activity}: ${count} cases`);
    });

  // 5. Directly-Follows Graph (Top edges)
  console.log("\n5. DIRECTLY-FOLLOWS GRAPH (Top 10 Edges)");
  console.log("-".repeat(60));
  const dfg = log.dfg();
  const dfgArray = Array.from(dfg.edges.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
  dfgArray.forEach((edge, i) => {
    console.log(`${i + 1}. ${edge.from} → ${edge.to} (${edge.frequency}×)`);
  });

  // 6. Bottleneck Detection
  console.log("\n6. BOTTLENECK ANALYSIS (Top 5)");
  console.log("-".repeat(60));
  const bottlenecks = log.detectBottlenecks();
  bottlenecks.slice(0, 5).forEach((bn, i) => {
    console.log(`${i + 1}. ${bn.activity}`);
    console.log(
      `   Avg Wait: ${formatDuration(bn.avgWaitingTime)}, Max: ${
        formatDuration(bn.maxWaitingTime)
      }`,
    );
    console.log(`   Cases: ${bn.cases}`);
  });

  // 7. Variant Analysis
  console.log("\n7. PROCESS VARIANTS");
  console.log("-".repeat(60));
  const variants = log.variants();
  console.log(`Total Unique Variants: ${variants.size}`);
  const sortedVariants = Array.from(variants.entries())
    .sort((a, b) => b[1] - a[1]);
  const [mostCommonSeq, mostCommonCount] = sortedVariants[0];
  console.log(
    `Most Common Variant (${mostCommonCount} cases):`,
  );
  console.log(
    `  ${
      mostCommonSeq.length > 100
        ? mostCommonSeq.substring(0, 97) + "..."
        : mostCommonSeq
    }`,
  );
  console.log("\nVariant Coverage:");
  const totalTraces = log.ntraces();
  [1, 5, 10, 20, 50].forEach((top) => {
    const cumCount = sortedVariants.slice(0, top).reduce(
      (sum, [_, count]) => sum + count,
      0,
    );
    const coverage = (cumCount / totalTraces) * 100;
    console.log(`  Top ${top} variants: ${coverage.toFixed(1)}% of cases`);
  });

  // 8. Process Discovery
  console.log("\n8. PROCESS DISCOVERY");
  console.log("-".repeat(60));

  // Inductive Miner
  const imResult = log.inductiveMiner();
  console.log("Inductive Miner:");
  const tree = imResult.model;
  if (typeof tree === "object" && "op" in tree) {
    console.log(
      `  Process Tree: operator=${tree.op}, children=${
        tree.children?.length || 0
      }`,
    );
  } else if (typeof tree === "object" && "label" in tree) {
    console.log(`  Process Tree: leaf activity="${tree.label}"`);
  }
  if (imResult.toPetriNet) {
    console.log(
      `  Petri Net: ${imResult.toPetriNet.places.length} places, ${imResult.toPetriNet.transitions.length} transitions`,
    );
  }

  // Split Miner
  const smResult = log.splitMiner({ dfFilterPercentile: 0.4 });
  console.log("\nSplit Miner (40% filter):");
  if (
    smResult.model && typeof smResult.model === "object" &&
    "places" in smResult.model
  ) {
    console.log(
      `  Petri Net: ${smResult.model.places.length} places, ${smResult.model.transitions.length} transitions`,
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("Evaluation Complete\n");
});
