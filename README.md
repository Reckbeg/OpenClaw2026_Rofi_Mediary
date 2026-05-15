# Mediary

Mediary is a 12-hour hackathon MVP for OpenClaw Agenthon 2026. It is an AI workplace diplomat that detects invisible workload overload from calendar patterns and a lightweight self-assessment, then generates diplomatic workflow interventions.

The product tone is calm, operational, and non-clinical. Mediary focuses on overload risk, focus erosion, meeting fragmentation, and workflow sustainability.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Agent Workflow

The app demonstrates an autonomous, deterministic agent workflow:

1. Load one employee's local sample weekly calendar from `lib/data/sampleWeek.ts`.
2. Calculate calendar overload metrics in `lib/scoring/calendarMetrics.ts`.
3. Read five self-assessment answers from the UI.
4. Compute combined risk in `lib/scoring/riskScore.ts`.
5. Identify top overload drivers.
6. Run the Analyzer agent in `lib/agents/analyzerAgent.ts`.
7. Run the Workflow Diplomat agent in `lib/agents/workflowDiplomatAgent.ts`.
8. Return exactly three interventions, one diplomatic message draft, and a cleaned-up week preview.

The workflow is exposed through `app/api/analyze/route.ts`, so the deterministic agent functions can later be replaced with real LLM calls without changing the UI contract.

## Current AI Tools and Models

No real LLM integration is required for the MVP. The current agents are deterministic TypeScript functions designed as placeholders for a future model-backed analyzer and workflow diplomat.

Suggested future placeholders:

- Analyzer agent: calendar reasoning and overload driver synthesis.
- Workflow Diplomat agent: diplomatic intervention drafting and stakeholder-safe message generation.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
```
