#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <prd-name> [iterations]"
  echo "Example: $0 react-query-migration 5"
  exit 1
fi

PRD_NAME="$1"
ITERATIONS="${2:-10}"

PRD_FILE="plans/${PRD_NAME}-prd.json"
PROGRESS_FILE="plans/${PRD_NAME}-progress.txt"

if [ ! -f "$PRD_FILE" ]; then
  echo "Error: PRD file not found: $PRD_FILE"
  echo "Create it first with: /prd [${PRD_NAME}] <feature description>"
  exit 1
fi

if [ ! -f "$PROGRESS_FILE" ]; then
  echo "Error: Progress file not found: $PROGRESS_FILE"
  exit 1
fi

# Parse PRD status (supports array, {meta, items} with meta, and {features:[]} formats)
get_prd_status() {
  local total passing
  # Try array format first, then object with .items (new format with meta), then .features
  if jq -e 'type == "array"' "$PRD_FILE" >/dev/null 2>&1; then
    total=$(jq 'length' "$PRD_FILE" 2>/dev/null || echo "?")
    passing=$(jq '[.[] | select(.passes == true or .status == "pass")] | length' "$PRD_FILE" 2>/dev/null || echo "?")
  elif jq -e '.items' "$PRD_FILE" >/dev/null 2>&1; then
    total=$(jq '.items | length' "$PRD_FILE" 2>/dev/null || echo "?")
    passing=$(jq '[.items[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "?")
  else
    total=$(jq '.features | length' "$PRD_FILE" 2>/dev/null || echo "?")
    passing=$(jq '[.features[] | select(.passes == true or .status == "pass")] | length' "$PRD_FILE" 2>/dev/null || echo "?")
  fi
  echo "${passing}/${total}"
}

# Format seconds as Xm Ys
format_duration() {
  local seconds=$1
  local mins=$((seconds / 60))
  local secs=$((seconds % 60))
  if [ $mins -gt 0 ]; then
    echo "${mins}m ${secs}s"
  else
    echo "${secs}s"
  fi
}

echo "═══════════════════════════════════════"
echo "PRD: $PRD_NAME"
echo "PRD Status: $(get_prd_status) items passing"
echo "Iterations: $ITERATIONS"
echo "═══════════════════════════════════════"

RUN_START=$(date +%s)

for ((i=1; i<=$ITERATIONS; i++)); do
  echo ""
  echo "▶ Iteration $i/$ITERATIONS"
  echo "----"

  ITER_START=$(date +%s)

  result=$(claude --permission-mode acceptEdits -p "@${PRD_FILE} @${PROGRESS_FILE}
1. Find the highest-priority feature to work on and work only on that feature.
This should be the one YOU decide has the highest priority - not necessarily the first in the list.
2. Check that the types check via pnpm typecheck and that the tests pass via pnpm test.
3. Update the PRD with the work that was done.
4. Append your progress to the ${PROGRESS_FILE} file.
Use this to leave a note for the next person working in the codebase.
5. Make a git commit of that feature. ONLY WORK ON A SINGLE FEATURE.
6. If the PRD is complete (all items pass), update plans/feature-list.md to mark the feature as completed, then output <promise>COMPLETE</promise>.
")

  echo "$result"

  ITER_END=$(date +%s)
  ITER_DURATION=$((ITER_END - ITER_START))
  TOTAL_DURATION=$((ITER_END - RUN_START))

  # Check for commit hash in output
  if [[ "$result" =~ ([0-9a-f]{7,}) ]] || [[ "$result" == *"commit"* ]]; then
    echo ""
    echo "✓ Iteration $i/$ITERATIONS completed in $(format_duration $ITER_DURATION) (total: $(format_duration $TOTAL_DURATION))"
    echo "  PRD Status: $(get_prd_status) items passing"
  else
    echo ""
    echo "⚠ Iteration $i/$ITERATIONS completed in $(format_duration $ITER_DURATION) - no commit detected"
    echo "  PRD Status: $(get_prd_status) items passing"
  fi

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "PRD COMPLETE"
    echo "Completed $i iteration(s) in $(format_duration $TOTAL_DURATION)"
    echo "PRD Status: $(get_prd_status) items passing"
    echo "═══════════════════════════════════════"
    exit 0
  fi
done

# End summary
echo ""
echo "═══════════════════════════════════════"
echo "Run finished (iteration limit reached)"
echo "Completed $ITERATIONS iterations in $(format_duration $TOTAL_DURATION)"
echo "PRD Status: $(get_prd_status) items passing"
echo "═══════════════════════════════════════"
