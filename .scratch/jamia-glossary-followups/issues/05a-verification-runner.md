# Verification runner for RPython reproductions

Status: ready-for-agent

## What to build

Build a script that runs every reproduction in `docs/JAMIA/comparisons/RPython/{TM,CDA}/` and records what *actually* happens today, against what the frontmatter *claims* happens. Output a status report that drives the migration in issue 05b.

For each `.py` / `.R` reproduction file:

1. Parse the frontmatter (ID, Language, Bug class, Runtime consequence, Reproduction status).
2. Execute the file in the appropriate runtime:
   - `.py` files → system `python3` (or `RPython/venv/bin/python3` for files needing sklearn). The venv exists.
   - `.R` files → system R (verify availability; if R is not installed locally, flag and skip with a clearly-marked status).
3. Capture: exit code, stderr, stdout, and any exception raised.
4. Classify the run outcome as one of the three `Reproduction status` values (see CONTEXT.md):
   - `Reproduces` — bug still triggers as recorded (Crash → process exited non-zero with traceback; DC/IF → process exited zero but produced documented wrong output).
   - `No longer reproduces` — process exited zero with no wrong output, contradicting the recorded consequence.
   - `Variant` — process triggered a different failure than recorded (e.g., recorded as Crash, but now silent DC). The file's docstring usually documents this; check whether docstring matches reality.

   **File health is recorded separately**, not as a fourth status value. If the reproduction file cannot run at all (import error from missing dependency, syntax error), record it under a distinct **`Verification status`** axis: `passed` (ran cleanly to completion) vs. `failed` (could not run). A `Verification status: failed` row has no meaningful `Reproduction status` — leave that field unset and surface the failure in the report. Bug status and file health are different questions and should not share an enum.

For each `.ts` reproduction file:

1. Run `deno check <file>`.
2. Capture: pass/fail, error messages.
3. Classify:
   - `passes` — `deno check` succeeds. If the file contains `@ts-expect-error`, the expected errors were actually raised (no `Unused '@ts-expect-error'` warnings).
   - `fails` — `deno check` errors.
   - `unused-expect-error` — passes but reports unused `@ts-expect-error` markers (indicates the type system no longer catches what was claimed).

**Output:** a `verification-report.md` (or `.json`) in `docs/JAMIA/comparisons/RPython/` listing, per ID:

- Frontmatter-claimed vs. actually-observed `Reproduction status` (where the file actually ran)
- `Verification status` per file (`passed` / `failed`)
- `.ts` check status (`passes` / `fails` / `unused-expect-error`)
- A flag column for any mismatches requiring author judgment

The report header carries the reproducibility metadata defined in CONTEXT.md: corpus vintage, pinned library versions (Python, R, pandas, etc.), evaluation date, runner script + commit.

Known issues from PROGRESS_LOG.md the runner should surface (don't pre-fix them — let the runner discover them so the process is honest):

- `TM/14023423` — `.ts` uses `s.sd()` which doesn't exist.
- `TM/33692532` — `.py` no longer reproduces on modern pandas. Duplicate file `33692532_str_accessor_with_nan.py` may exist.
- `TM/18401112` — `.py` no longer reproduces on modern sklearn.
- `TM/44616546` — bug morphed from Crash to DC on modern pandas.

This is the **credibility floor** for the RPython contribution. Until verification runs, every claim about reproduction status is unverified.

## Acceptance criteria

- [ ] Script runs locally with `deno run -A` (TypeScript) or appropriate Python invocation; documented in a README near the script.
- [ ] Every file under `RPython/TM/` is executed (or marked explicitly skipped with reason — e.g., R not installed locally). The three `RPython/CDA/` reproductions are included for completeness but flagged as illustrative-only per CONTEXT.md (not part of the inclusion-evaluation denominator).
- [ ] Output is `verification-report.{md,json}` showing per-ID: claimed status, observed status, `Verification status`, mismatch flag, `.ts` check status.
- [ ] Output is machine-readable so issue 05b can consume it.
- [ ] Report header includes reproducibility metadata (corpus vintage, pinned versions, evaluation date, runner commit) per CONTEXT.md.
- [ ] Failures and mismatches are surfaced, not silenced. The report does not need to be "all green" to be complete; it needs to be honest.
- [ ] The four known-issue files above appear in the report with appropriate mismatch flags.

## Blocked by

- Issue 03 (schema split must be defined so the runner knows which frontmatter fields to look for).

## Out of scope

- Fixing the mismatches the runner discovers. That's issue 05b.
- Generating any aggregate corroboration tables. That's issue 05c.
