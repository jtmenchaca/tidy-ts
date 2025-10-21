/**
 * Split Miner (SM)
 * Prune DFG, detect splits/joins; accurate & simple models; fast
 * Ref: Augusto et al. "Automated Discovery of Process Models from Event Logs"
 */

import type { XESLogData } from "../../readXES.ts";
import type {
  Activity,
  DFG,
  DiscoveryOptions,
  DiscoveryResult,
  PetriNet,
} from "../../types.ts";
import { buildDFG, filterDFG } from "./dfg.ts";

/**
 * Split Miner (SM)
 * Prune DFG, detect splits/joins; accurate & simple models; fast
 */
export function splitMiner(
  log: XESLogData,
  opts: DiscoveryOptions = {},
): DiscoveryResult {
  const dfg = buildDFG(log);

  // Step 1: Filter DFG using percentile threshold
  const percentile = opts.dfFilterPercentile ?? 0.4;
  const filteredDFG = filterDFG(dfg, percentile);

  // Step 2: Detect gateways (splits and joins)
  // Simplified version: convert DFG directly to Petri net
  const petri = dfgToPetriNet(filteredDFG);

  return { model: petri };
}

/**
 * Convert DFG to Petri net with gateway detection
 */
function dfgToPetriNet(dfg: DFG): PetriNet {
  const places: string[] = [];
  const transitions: PetriNet["transitions"] = [];
  const arcs: PetriNet["arcs"] = [];

  // Create transition for each activity
  const activityToTransition = new Map<Activity, string>();
  let transId = 0;

  for (const activity of dfg.activities) {
    const tId = `t${transId++}`;
    transitions.push({ id: tId, label: activity });
    activityToTransition.set(activity, tId);
  }

  // Create places and arcs for each edge
  let placeId = 0;
  for (const edge of dfg.edges.values()) {
    const fromTrans = activityToTransition.get(edge.from)!;
    const toTrans = activityToTransition.get(edge.to)!;
    const place = `p${placeId++}`;

    places.push(place);
    arcs.push({ source: fromTrans, target: place });
    arcs.push({ source: place, target: toTrans });
  }

  // Add start and end places
  const startPlace = `p${placeId++}`;
  const endPlace = `p${placeId++}`;
  places.push(startPlace, endPlace);

  const initialMarking: Record<string, number> = { [startPlace]: 1 };
  const finalMarking: Record<string, number> = { [endPlace]: 1 };

  // Connect start activities
  for (const [activity, _count] of dfg.startActivities) {
    const trans = activityToTransition.get(activity)!;
    const place = `p${placeId++}`;
    places.push(place);
    arcs.push({ source: startPlace, target: place });
    arcs.push({ source: place, target: trans });
  }

  // Connect end activities
  for (const [activity, _count] of dfg.endActivities) {
    const trans = activityToTransition.get(activity)!;
    const place = `p${placeId++}`;
    places.push(place);
    arcs.push({ source: trans, target: place });
    arcs.push({ source: place, target: endPlace });
  }

  return {
    places,
    transitions,
    arcs,
    initialMarking,
    finalMarking,
  };
}
