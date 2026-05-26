---
name: whats-next-pocock
description: Recommend the next Matt Pocock-style skill from the current repo context. Use when the user asks which skill, flow, or next agent step should run, especially when they are learning how the skills compose.
---

# What's Next Pocock

Pick the next skill. Do not give the user a catalogue. Give them the next move, what it produces, and what it feeds. This is a router, not an executor: explore, recommend, then stop.

## Process

### 1. Gather context

Read the user's request and the repo-local instructions that are actually present. Do not bind this skill to a specific CLI, TUI, harness, or filename.

- Start with instruction files explicitly supplied by the current run.
- Then check common repo files such as `AGENTS.md` and `CLAUDE.md`.
- Treat files with `## Agent skills` or references to `docs/agents/*` as workflow context.
- If multiple files conflict, mention the conflict. Prefer an explicitly supplied file; otherwise do not pretend the conflict is resolved.

Check the per-repo setup these skills assume:

- A repo-local instruction file describes the agent skills.
- `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, and `docs/agents/domain.md` exist.

If setup is missing or inconsistent, recommend `setup-matt-pocock-skills` first. Do not guess the issue tracker, labels, or domain docs.

### 2. Read the current skills

- Prefer `~/.agents/skills/*/SKILL.md`.
- Use the visible session skill list as a fallback.
- Use current `name` and `description` values when naming skills.
- Notice new Pocock-style skills, but do not invent a new workflow from them.

This check is internal. Do not print a "catalog checked" field.

If a new skill clearly supersedes one of the flows below, recommend the new skill. If it might matter but its place in the workflow is unclear, list it under **Possibly relevant**.

### 3. Pick the flow

Prefer the happy path. The goal is to remove the user's guesswork, not enumerate every possible skill.

- **Vague idea:** `grill-me` or `grill-with-docs` → `to-prd` → `to-issues` → `tdd`
- **Feature already discussed:** `to-prd` → `to-issues` → `tdd`
- **PRD, plan, or spec already exists:** `to-issues` → `tdd`
- **Issue creation, labels, or AFK-agent prep:** `triage`
- **Bug, regression, exception, failing test, or performance problem:** `diagnose`
- **Unfamiliar code area:** `zoom-out`
- **Architecture friction, shallow modules, or testability problems:** `improve-codebase-architecture`
- **Interface design request:** use `design-an-interface` if it exists; otherwise use `grill-with-docs`.
- **General design grilling outside repo docs:** `grill-me`.

If the user already named a skill, check whether it fits. Suggest a different skill only when the mismatch is clear.

### 4. Answer

```
Next: `<skill-name>`
Why: <one or two sentences grounded in the repo/request>
Repo evidence: <what you saw>
What it produces: <artifact, decision, issue, test loop, or understanding>
What feeds the next step: <how this output is used next>
Possibly relevant: <new/related skills, or "None">
Open questions for the human: <questions, or "None">
Suggested prompt: <short prompt the user can send next>
```

If several steps are needed, show the sequence and mark the immediate next skill clearly.

Expand uncommon acronyms inline the first time if they matter to the recommendation.

## Rules

- Do not mutate files.
- Do not auto-handoff into the next skill.
- Do not duplicate target skill instructions.
- Do not answer with a generic menu.
- Keep the recommendation short and grounded in the repo/request evidence.
