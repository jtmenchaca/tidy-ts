---
name: repo-portable
description: Make the repo portable. Drive out hidden local sources of truth so tracked docs and GitHub Issues are the only durable knowledge. Use when the user wants to audit the repo for drift between local-only knowledge and tracked state, reconcile issues with PRD/phase labels, close stale backlog, find secret/data risk, or fix ad hoc doc homes.
---

# Repo Portable

Keep the repo portable. No hidden local source of truth. Tracked docs and GitHub Issues are the durable truth; ignored folders only inform.

## What to do

Loop:

1. Read `AGENTS.md`, `CONTEXT-MAP.md`, the context docs it points to, and the issue docs (typically `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`).
2. Inspect tracked docs, ignored local docs, and open issues. Use `git ls-files` for tracked, `git status --ignored` for ignored, and `gh issue list` for open.
3. Find drift:
   - **Local-only knowledge** — useful content lives in an ignored folder with no tracked counterpart.
   - **Orphan issues** — non-root open issues missing `## Parent`.
   - **Bad PRD labels** — open `PRD` issues without exactly one of `prd:developed` / `prd:undeveloped`.
   - **Stale/backlog issues** — open issues that are really deferred work and should be closed `not planned`.
   - **Stale phase labels** — phase labels that don't match current state.
   - **Secret/data risk** — secrets in git history, in tracked files, or about to be committed.
   - **Ad hoc doc homes** — docs landing outside the locations `CONTEXT-MAP.md` prescribes.
4. **Propose the exact GitHub mutation batch before editing issues**, unless the user pre-approved it. Show the `gh` commands you'll run.
5. Apply a small batch.
6. Verify the drift is gone (re-run the relevant query).

Repeat until no drift remains, or until the user says stop.

## Invariants

- Tracked docs and GitHub Issues are durable truth.
- Ignored folders inform; accepted knowledge gets promoted to tracked docs before the ignored copy is referenced.
- Obey `CONTEXT-MAP.md`. The root `CONTEXT.md` (if present) may be an index only — content lives in the per-context glossaries it points to.
- Every non-root open issue has `## Parent` linking to its parent issue.
- Every open `PRD` issue has exactly one of: `prd:developed` or `prd:undeveloped`.
- Backlog / deferred work is **closed `not planned`**, not left open.
- Superseded work is closed `not planned` with a link to the replacement issue.
- Secrets never enter git.
- Private repos may track intentional non-secret business context — don't strip it.

## Checks (recipes)

Use repo-native tooling. Exact commands may already be documented in the repo; prefer those if they exist.

- **Tracked vs ignored docs:**
  - `git ls-files -- '*.md'`
  - `git status --ignored --short`
- **Open issues + labels:**
  - `gh issue list --state open --limit 200 --json number,title,labels,body`
  - For a single issue: `gh issue view <n> --json number,title,labels,body,state,stateReason`
- **Orphan check (non-root, missing `## Parent`):** scan issue bodies returned above for the literal `## Parent` heading.
- **PRD label check:** for each open issue with label `PRD`, confirm exactly one of `prd:developed` / `prd:undeveloped`.
- **Secret / data risk:**
  - `git diff --check` (whitespace + conflict markers on staged/unstaged)
  - Whatever secret-scan command the repo already uses (`gitleaks`, `trufflehog`, `detect-secrets`, etc.). If none is configured, flag that as drift.
- **Doc home check:** for any new or modified `.md`, confirm its directory is one of the homes named in `CONTEXT-MAP.md`.

## Output shape per iteration

Before mutating anything, post:

```
Drift found:
- <category>: <one-line summary> (refs: #12, #34, path/to/file)
- ...

Proposed batch:
- gh issue edit 34 --add-label prd:undeveloped --remove-label prd:developed
- gh issue close 51 --reason "not planned" --comment "Superseded by #88"
- mv .scratch/foo/notes.md docs/JAMIA/foo-notes.md
- ...

Apply? (or pre-approved)
```

After applying, re-run the relevant check and confirm the drift is gone before moving to the next batch.

## Rules

- Never mutate issues without showing the exact `gh` batch first, unless the user pre-approved the batch in the current session.
- Keep batches small — one drift category at a time when possible.
- Don't invent labels. Use the canonical names from `docs/agents/triage-labels.md`.
- Don't promote ignored content to tracked without confirming with the user — it might be intentionally ignored.
- Don't run destructive `git` operations (`reset --hard`, `clean -f`, history rewrites) to clean secrets — flag and ask.
- This skill is a maintenance loop, not an executor for unrelated requests. If the user asks for something off-loop (write a feature, fix a bug), hand off rather than expand scope.
