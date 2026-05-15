# Architecture Details

This document contains detailed architecture and implementation notes moved out of the root README.

## Full 3-Agent Role Descriptions

### Aria Analyst (Reasoning Layer)

Role scope:

- Computes composite workload risk scores from calendar metrics and self-assessment signals
- Detects sustained-high workload pattern using current signals plus 8-week trend context
- Builds team heatmap and org summary views
- Produces intervention routing decisions with rationale
- Drafts HR memo and impact simulation

Explicit non-scope:

- Does not invoke execution adapters
- Does not create action artifacts
- Does not assess pipeline/org health status

### Ethan Executor (Execution Layer)

Role scope:

- Invokes deterministic internal execution adapters
- Builds tool invocation log
- Produces stakeholder action artifacts
- Queues follow-up tasks based on selected route cadence
- Produces run ledger execution summary

Explicit non-scope:

- Does not score workload risk
- Does not choose intervention routing policy
- Does not perform supervisor anomaly evaluation

### Sol Supervisor (Supervision Layer)

Role scope:

- Runs cross-agent anomaly checks
- Evaluates org health status and score
- Produces execution trace and supervisor summary
- Validates consistency between routing and execution

Explicit non-scope:

- Does not compute risk scores
- Does not invoke execution adapters
- Does not create action artifacts

## Agent Identity System

Identity/persona files define each agent's name, title, principles, capabilities, and limitations:

- `src/agents/identities/analyst.md`
- `src/agents/identities/executor.md`
- `src/agents/identities/supervisor.md`

Runtime identity objects are defined in:

- `src/agents/identity.ts`

## Agent Memory System

Each agent persists local memory across repeated runs:

- Analyst memory: risk history, trend patterns, scoring confidence
- Executor memory: tool performance and artifact delivery summaries
- Supervisor memory: anomaly history, health trend, escalation log

State module:

- `src/modules/state/agentMemory.ts`

Memory files are written under:

- `.mediary/state/memory/`

## Loop Infrastructure

- Run ledger persistence: `src/modules/state/ledgerStore.ts`
- Week-over-week comparison: `src/modules/state/weekComparison.ts`
- Follow-up queue consumer: `src/modules/state/followUpConsumer.ts`
- Loop runner script: `scripts/run-loop.ts`

## Core Source File List

- `src/agents/analystAgent.ts`
- `src/agents/executorAgent.ts`
- `src/agents/supervisorAgent.ts`
- `src/agents/runMediaryLoop.ts`
- `src/modules/metrics/calendarMetrics.ts`
- `src/modules/scoring/riskScore.ts`
- `src/modules/scoring/selfAssessment.ts`
- `src/modules/routing/meetingRouter.ts`
- `src/modules/messaging/diplomaticMessage.ts`
- `src/types/mediary.ts`
- `app/api/analyze/route.ts`
- `app/api/agent-stream/route.ts`

## Core Feature Inventory (Compact Replacement for Prior 36-item List)

1. Deterministic org-wide workload evaluation over sample dataset
2. 3-agent pipeline with strict role boundaries
3. Agent identity and local memory persistence
4. 8-week trend reasoning and sustained-high detection
5. Route-based intervention queue with rationale
6. Internal execution adapters, action artifacts, and follow-up queue
7. Supervisor anomaly checks, org health scoring, and execution trace
8. CLI and web demo surfaces using shared output contract
9. SSE progress stream for live run visualization in the web demo
