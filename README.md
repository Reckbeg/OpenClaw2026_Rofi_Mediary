# Mediary

Mediary is an AI workplace assistant that detects invisible overload patterns before they become burnout.

## Project Overview

Mediary is built for HR and people teams in smaller organizations.  
It helps teams spot workload strain early, explain why risk is rising, and suggest practical next steps.

The demo shows a deterministic 3-agent workflow running on sample data, with live server-streamed progress in the web UI.

## Problem

Workload risk usually shows up gradually: too many meetings, low focus time, after-hours pressure, and repeated heavy weeks.  
Without a consistent process, teams notice issues late and interventions become reactive.

## Solution

Mediary analyzes these signals, groups people by risk level, and routes clear actions:

- monitor only
- employee nudge
- manager brief
- HR Ops route for sustained-high patterns

It also records action artifacts, follow-up tasks, and a supervisor review so each run is easy to inspect.

## How It Works

1. Read deterministic workload inputs (calendar + self-assessment + trend history)
2. Score risk and detect sustained-high patterns
3. Route interventions by policy
4. Generate execution artifacts and follow-up queue
5. Run supervisor checks and emit final output

## Agent Workflow

- **Aria Analyst**: scores risk and decides routing
- **Ethan Executor**: runs internal execution adapters and creates artifacts
- **Sol Supervisor**: checks anomalies, validates consistency, and reports org health

Detailed architecture: `docs/architecture.md`

## Why This Is Agentic

- Multi-step workflow with clear observe → decide → execute → review stages
- Different agents own different responsibilities
- Decisions are based on explicit risk signals and trend context
- Executor produces concrete action artifacts and follow-ups
- Supervisor checks run quality and consistency
- Web demo streams live backend events during a run

## Demo Scenarios

- `baseline`: normal workload mix
- `sustained-high`: deterministic high-strain scenario that triggers HR Ops routes

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Deterministic in-repo runtime logic (`src/`)

## How To Run Locally

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)
- [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Available Commands

```bash
npm run dev
npm run dev:host
npm run typecheck
npm run build
npm run agent
npm run agent -- --scenario=sustained-high
npm run loop
npm run loop -- --scenario=sustained-high
```

## Key Outputs

- Org summary and trend summary
- Intervention queue with route rationale
- Tool invocation log, action artifacts, and follow-up queue
- Run ledger, org health assessment, and execution trace

Full contract details: `docs/output-contract.md`

## Limitations

- Uses deterministic sample data for reproducibility
- Internal execution adapters are deterministic simulations
- No live external integrations (Slack, Calendar, HRIS, email)
- Not a diagnosis tool
- Hermes and MiMo are not required to run the local app

## AI Tools Used

- Cursor for development support
- Hermes + MiMo V2.5 Pro for external operation/evaluation during demo preparation
- Deterministic TypeScript runtime as the local source of truth

## Documentation

- Architecture details: `docs/architecture.md`
- Output contract and SSE events: `docs/output-contract.md`
- Submission wording notes: `docs/submission-notes.md`
- Hermes operating specs (public-safe): `hermes/README.md`
