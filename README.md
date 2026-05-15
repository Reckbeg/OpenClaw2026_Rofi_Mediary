# Mediary

An AI workplace diplomat that detects invisible overload patterns before they become burnout.

## Problem

Small organizations often miss early workload strain signals because risk appears as distributed scheduling friction (meeting overload, focus erosion, after-hours pressure) rather than explicit incidents.

## Solution Overview

Mediary runs a deterministic 3-agent cycle over org workload signals:

1. Analyze risk and trends
2. Route interventions by policy
3. Execute internal action adapters and queue follow-ups
4. Supervise run health and trace consistency

The web demo includes live server-streamed progress, and the CLI returns the same core output contract.

## Why This Is Agentic

- Observes org-wide workload signals from deterministic calendar and self-assessment inputs
- Reasons over risk drivers and 8-week trend context
- Decides intervention routes (including HR Ops route for sustained-high workload pattern)
- Executes deterministic internal execution adapters to produce action artifacts
- Queues route-based follow-up tasks for next-cycle handling
- Supervises pipeline consistency with org health checks and execution trace

## Demo / Quick Start

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)
- [http://127.0.0.1:3000](http://127.0.0.1:3000)

Web demo:

- Primary CTA: `Run sustained-high agent cycle`
- Live progress: `GET /api/agent-stream?scenario=sustained-high` (SSE)
- Compatibility endpoint: `POST /api/analyze`

## Available Commands

```bash
npm run agent                              # Single baseline run
npm run agent -- --scenario=sustained-high # Single sustained-high run
npm run loop                               # Multi-phase loop runner
npm run loop -- --scenario=sustained-high  # Sustained-high loop run
npm run dev
npm run typecheck
npm run build
```

## 3-Agent Architecture (Short)

- **Aria Analyst**: risk/trend reasoning and route decisions
- **Ethan Executor**: internal tool execution adapters, action artifacts, follow-up queue, run ledger
- **Sol Supervisor**: anomaly checks, org health assessment, execution trace

Detailed architecture: `docs/architecture.md`

## Key Capabilities

- 3-agent pipeline: Analyst -> Executor -> Supervisor
- 8-week workload trend reasoning
- Risk routing and HR Ops escalation
- Internal tool execution adapters
- Action artifact generation
- Follow-up task queue
- Run ledger and local memory
- SSE web streaming for live agent run visualization

Mediary supports a stateful autonomous agent loop with local memory and cross-run continuity during repeated runs.

## Key Outputs

- Org summary and monthly trend org summary
- Intervention queue with routing rationale
- Tool invocation log, action artifacts, and follow-up tasks
- Run ledger, org health assessment, and execution trace

Full field-level contract: `docs/output-contract.md`

## Limitations

- Uses deterministic sample org data for reproducibility
- Internal execution adapters are deterministic simulations, not live external integrations
- No live Slack, Calendar, HRIS, or email delivery integrations
- Not a diagnosis tool; outputs focus on workload strain operations
- Hermes and MiMo are not required runtime dependencies for local app execution

## AI Tools Used

- Cursor for development assistance
- Hermes + MiMo V2.5 Pro for external operation/evaluation workflows during demo preparation
- Deterministic in-repo TypeScript agent logic for local runtime behavior

## Detailed Docs

- Architecture and component details: `docs/architecture.md`
- Output contract and SSE event schema: `docs/output-contract.md`
- Judge/submission framing and wording guardrails: `docs/submission-notes.md`
- Hermes operating specs (public-safe): `hermes/README.md`
