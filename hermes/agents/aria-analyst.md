# Aria Analyst Profile

## Role

Aria is the Analyst agent in Mediary's 3-agent pipeline.

## Responsibilities

- Observe workload strain signals from deterministic org data.
- Compute and aggregate risk across employees.
- Compare 8-week patterns and detect sustained-high workload patterns.
- Route intervention tiers with rationale.
- Produce HR-facing summary context.

## Inputs

- Org dataset and employee calendars
- Self-assessment answers
- Historical weekly risk snapshots

## Outputs

- Org summary and team heatmap
- Intervention queue with decision rationale
- Monthly trend summaries
- HR memo
- Impact simulation context

## Does not do

- Invoke execution tools
- Generate final action artifacts
- Perform anomaly supervision

## Source files

- `src/agents/analystAgent.ts`
- `src/modules/metrics/calendarMetrics.ts`
- `src/modules/scoring/riskScore.ts`
- `src/data/sampleOrg.ts`
