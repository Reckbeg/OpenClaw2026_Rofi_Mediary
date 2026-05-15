# Demo Output — Sustained-High Scenario

This folder contains the actual output artifacts from a Mediary sustained-high agent cycle.

## What's Here

### `deliverables/` — 21 Real Action Artifacts

These are the files Mediary generates for stakeholders:

- **HR Ops cases** (`hr-ops-case-*.md`) — Escalation packets for sustained-high employees
- **Manager briefs** (`manager-brief-*.md`) — Context and action items for managers
- **Employee nudges** (`employee-nudge-*.md`) — Actionable scheduling adjustments for employees
- **Focus block plans** (`focus-block-plan-*.md`) — Recommended deep-work windows
- **HR memo** (`hr-memo.md`) — Org-wide workload assessment summary
- **Follow-up checklist** (`follow-up-checklist.md`) — All follow-up tasks with due dates

### `state/` — Agent Run State

- **`sustained-high-run.json`** — Full agent output (all fields, all employees)
- **`run-ledger.json`** — Run metadata (employees analyzed, tools executed, artifacts created)
- **`org-health.json`** — Supervisor health assessment (status, score, anomalies)

## How This Was Generated

```bash
npm run agent -- --scenario=sustained-high
```

The deliverable writer writes these files to `~/.hermes/deliverables/` automatically.
This folder is a snapshot for judge inspection.

## Key Evidence

| Metric | Value |
|---|---|
| Employees analyzed | 24 |
| HR Ops routes | 2 (Alex Johnson, Olivia Clark) |
| Tools executed | 25 |
| Action artifacts | 23 |
| Follow-ups queued | 19 |
| Org health | attention (90/100) |
| Anomalies | 0 |
| Trend window | 8 weeks |
