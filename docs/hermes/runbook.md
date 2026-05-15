# Hermes Operator Runbook

## First-time validation

1. Inspect `package.json` scripts and `README.md`.
2. Run:
   - `npm run typecheck`
   - `npm run build`
3. Confirm no required external model runtime is needed for core output generation.

## Sustained-high demo run

1. Execute: `npm run agent -- --scenario=sustained-high`
2. Capture:
   - org summary
   - HR Ops route count
   - tool invocations
   - action artifacts
   - follow-up queue
   - run ledger
   - supervisor org health

## Stateful loop run

1. Execute: `npm run loop -- --scenario=sustained-high`
2. Verify:
   - run ledger persistence
   - week-over-week comparison output
   - follow-up processing status

## Web demo run

1. Execute: `npm run dev`
2. Open the command-center UI.
3. Trigger sustained-high cycle from primary CTA.
4. Verify the result order:
   - Operator Dispatch Summary
   - 3-Agent Pipeline Results
   - Priority Decisions
   - Execution Layer
   - Supervisor Review
   - Follow-up queue and run ledger context

## What success looks like

- Deterministic run completes with workflow status.
- Analyst produces org-level signal and routing.
- Executor produces tool logs, action artifacts, and follow-up queue.
- Supervisor reports org health and anomaly check.
- Run ledger is present and scenario-specific.

## Known limitations

- Internal tools are deterministic execution adapters.
- Follow-up tasks are persisted but require manual/cron trigger to process each cycle.
- No live external calendar, HR, or messaging integrations are modified.

## Safe language

Use:
- workload strain
- sustained-high workload pattern
- HR Ops route
- action artifacts
- follow-up queue

Avoid:
- burnout diagnosis
- therapy recommendations
- surveillance claims
- productivity policing language
- claims of live external system writes
