# Mediary

Autonomous HR/Ops workload diplomacy agent for small organizations under 50 employees.

## 1) Project Title

Mediary

## 2) One-Line Description

Mediary is an autonomous HR/Ops workload diplomacy agent that detects org-wide workload strain signals and routes practical interventions.

## 3) Problem Statement

Small organizations often miss early operational strain because workload issues appear as scattered scheduling patterns rather than explicit incidents. Teams experience meeting fragmentation, focus erosion, back-to-back load, after-hours pressure, and self-assessment strain before delivery quality drops. Most teams lack a structured, repeatable way to route the right intervention to the right stakeholder at the right time.

## 4) Solution Overview

Mediary runs an org-wide deterministic loop that:
- scans workload strain signals,
- computes employee and team risk,
- applies intervention routing,
- generates stakeholder-specific messages, and
- produces a follow-up plan for the next cycle.

This project is designed for hackathon reliability and clear inspection by judges.

## 5) Why This Is Agentic

Mediary does not only summarize data. It:
- observes workload signals,
- reasons over risk drivers,
- decides stakeholder-specific routing,
- executes message generation,
- produces a follow-up plan, and
- persists agent memory across runs to track org health over time.

Workflow status phrase used in outputs:
**"Autonomous org-wide workload diplomacy loop completed"**

## 6) Autonomous Workflow

1. Observe org dataset  
2. Calculate employee metrics  
3. Aggregate team risk  
4. Route interventions  
5. Generate stakeholder messages  
6. Follow-up plan

## 7) Agent Architecture

### 3-Agent Pipeline

Mediary uses a dedicated 3-agent pipeline where each agent owns specific responsibilities and explicitly does NOT do what the other agents do.

```
Org Data
   ↓
🧠 Aria (Analyst)    → scores, routes, simulates
   ↓
⚡ Ethan (Executor)   → invokes tools, creates artifacts, queues follow-ups
   ↓
🔍 Sol (Supervisor)   → validates, detects anomalies, assesses org health
   ↓
Final Output: Loop Report + Execution Trace
```

#### 🧠 Aria — The Analyst (Brain)

**Role:** Pure reasoning agent, no side effects.

- Computes composite risk scores from calendar metrics and self-assessment
- Detects sustained overload patterns across 8-week trends
- Aggregates team-level heatmaps with risk bucket classification
- Routes employees into intervention tiers with evidence-based rationale
- Drafts HR memos with org-wide summaries and trend context
- Simulates impact projections based on intervention adherence assumptions

**Does NOT:** invoke tools, create artifacts, or assess org health.

#### ⚡ Ethan — The Executor (Hands)

**Role:** Action-oriented agent, produces execution artifacts.

- Invokes internal action adapters (EMPLOYEE_NUDGE_TOOL, MANAGER_BRIEF_TOOL, HR_OPS_CASE_TOOL, FOCUS_BLOCK_PLANNER, FOLLOW_UP_SCHEDULER)
- Generates stakeholder-specific action artifacts with typed owners
- Queues follow-up tasks with route-based cadences (48h, 3-day, 7-day)
- Builds run ledgers that summarize autonomous execution
- Tracks tool invocation counts and artifact delivery status

**Does NOT:** score employees, decide routing, or assess org health.

#### 🔍 Sol — The Supervisor (Watchdog)

**Role:** Cross-cutting validation and org health monitoring.

- Detects pipeline anomalies (zero interventions, missing tools, employee worsening)
- Assesses org health with composite scoring (healthy/attention/critical)
- Builds execution traces that document the full agent pipeline
- Tracks cross-run trends in org health, anomalies, and agent performance
- Validates consistency between Analyst routing and Executor tool invocations
- Maintains escalation log for human-reviewed decisions

**Does NOT:** score employees, invoke tools, or create artifacts.

### Agent Identity System

Each agent has a defined identity with full persona documentation:

- [`src/agents/identities/analyst.md`](src/agents/identities/analyst.md) — 🧠 Aria, Workload Signal Analyst
- [`src/agents/identities/executor.md`](src/agents/identities/executor.md) — ⚡ Ethan, Action Artifact Executor
- [`src/agents/identities/supervisor.md`](src/agents/identities/supervisor.md) — 🔍 Sol, Pipeline Supervisor

Each identity file defines:
- **Name and title** — Aria, Ethan, Sol
- **Principles** — guiding rules for decision-making
- **Personality** — communication style and approach
- **Capabilities** — what the agent can do
- **Limitations** — what the agent explicitly cannot do

Runtime identity objects are in `src/agents/identity.ts`.

### Agent Memory System

Each agent persists memory across runs (`src/modules/state/agentMemory.ts`):
- **Analyst memory** — risk score history, detected patterns, run count
- **Executor memory** — tool invocation counts, delivery history, follow-up completion rates
- **Supervisor memory** — anomaly history, org health trend, escalation log

Memory files are stored at `.mediary/state/memory/{agent}-memory.json` and survive across runs, enabling the agents to reason over longitudinal trends.

### Loop Infrastructure

- **Run ledger** (`src/modules/state/ledgerStore.ts`) — persists run metadata across cycles
- **Week comparison** (`src/modules/state/weekComparison.ts`) — computes week-over-week deltas
- **Follow-up consumer** (`src/modules/state/followUpConsumer.ts`) — tracks follow-up task status and overdue items
- **Loop runner** (`scripts/run-loop.ts`) — executes the full 5-phase loop via `npm run loop`

Core agent source code:
- `src/agents/identity.ts` — agent persona definitions
- `src/agents/analystAgent.ts` — Aria: risk scoring, routing, HR memo
- `src/agents/executorAgent.ts` — Ethan: tool invocations, artifacts, follow-ups
- `src/agents/supervisorAgent.ts` — Sol: anomaly detection, org health, execution trace
- `src/agents/runMediaryLoop.ts` — orchestrator that calls the 3-agent pipeline
- `src/modules/state/agentMemory.ts` — per-agent memory persistence
- `src/modules/state/ledgerStore.ts` — run ledger persistence
- `src/modules/state/weekComparison.ts` — week-over-week delta analysis
- `src/modules/state/followUpConsumer.ts` — follow-up task consumption
- `src/modules/metrics/calendarMetrics.ts` — calendar workload metrics
- `src/modules/scoring/riskScore.ts` — risk scoring engine
- `src/modules/routing/meetingRouter.ts` — intervention routing
- `src/modules/messaging/diplomaticMessage.ts` — stakeholder messaging

Key components:
- **Calendar Parser Tool**: loads deterministic org-wide calendar events.
- **Metrics Engine Tool**: computes meeting and focus metrics.
- **Self-Assessment Tool**: computes workload strain from 5-question responses.
- **Risk Scoring Tool**: combines calendar and self-assessment signals.
- **Analyzer Agent**: identifies top workload strain drivers and candidate actions.
- **Workflow Diplomat Agent**: generates interventions, stakeholder messages, and follow-up-oriented week previews.

## Hermes Runtime Role

Mediary's core workload diplomacy loop is implemented in deterministic TypeScript modules for hackathon reliability and judge reproducibility. Hermes and MiMo V2.5 Pro were used externally during demo preparation to orchestrate, validate, and stress-test the agent loop.

In the demo setup, Hermes operated Mediary with MiMo V2.5 Pro for external execution review and multi-agent evaluation. The external evaluation checks whether Mediary demonstrates:
- signal observation,
- risk reasoning,
- intervention routing,
- stakeholder message execution,
- follow-up planning, and
- scenario-sensitive behavior.

The deterministic in-repo loop remains the source of truth for scoring, routing, and output contracts.
The submitted application runs locally without external model dependency for judge reproducibility.

## Hermes Operating Specs

Public-safe Hermes task prompts, runbooks, and agent profiles are available in `hermes/`.

These files document how Hermes can operate and evaluate Mediary without committing local Hermes runtime configuration, credentials, or private state.

## 8) Core Features

1. Org-wide autonomous agent loop  
2. **3-agent pipeline** (Analyst → Executor → Supervisor) with dedicated roles  
3. **Agent identity system** with named personas (Aria, Ethan, Sol)  
4. **Per-agent persistent memory** across runs  
5. Deterministic sample org dataset with 24 employees  
6. **8-week workload trend data** per employee for sustained pattern detection  
7. Normalized team structure with 5 teams:
   - Product & Engineering
   - Customer Operations
   - Design & Quality
   - People & Program Operations
   - Business Operations
8. Deterministic scoring engine  
9. Calendar workload metrics  
10. Self-assessment strain scoring  
11. Risk buckets: Low (0–39), Medium (40–79), High (≥80), Sustained High  
12. Intervention routing:
    - Low: monitor only
    - Medium: employee nudge
    - High: employee nudge + manager brief
    - Sustained High: HR Ops queue
13. Driver-aware next steps  
14. HR memo generation  
15. Team heatmap  
16. Intervention queue  
17. Selected employee detail (Maya Chen)  
18. Impact simulation (before/after projected org metrics)  
19. **7-phase execution trace** (observe → reason → reason → decide → execute → follow-up → supervise)  
20. CLI runner scenarios  
21. **Loop runner** (`npm run loop`) for persistent autonomous cycles  
22. Minimal UI rendering the same agent output through app/API pipeline  
23. No auth, no database, no external integrations  
24. Monthly trend org summary  
25. Previous week risk context  
26. Manager coaching brief for high and sustained-high routes  
27. Projected meeting hours reduced  
28. Projected focus hours gained  
29. Internal tool execution adapters (deterministic simulation)  
30. Stakeholder-specific action artifact generation  
31. Route-based follow-up task queue  
32. Run ledger for each autonomous cycle  
33. **Week-over-week comparison** with delta analysis  
34. **Follow-up task consumer** with overdue detection  
35. **Anomaly detection** across agent pipeline  
36. **Org health assessment** (healthy/attention/critical)

## 9) Demo Scenarios

- **baseline**: normal org-wide workload scan.
- **sustained-high**: deterministic scenario that activates HR Ops queue for repeated high workload strain.

## 10) Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Deterministic in-repo TypeScript agent loop for reproducible runtime behavior
- Hermes + MiMo V2.5 Pro used externally for orchestration, validation, stress testing, and multi-agent evaluation during demo preparation

## 11) How To Run Locally

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Then open:
- [http://localhost:3000](http://localhost:3000)
- [http://127.0.0.1:3000](http://127.0.0.1:3000)

## 12) Available Commands

```bash
npm install
npm run agent                                    # Run single agent cycle (baseline)
npm run agent -- --scenario=sustained-high       # Run sustained-high scenario
npm run loop                                     # Run full 5-phase loop
npm run loop -- --scenario=sustained-high        # Run loop with sustained-high scenario
npm run dev                                      # Start Next.js dev server
npm run typecheck                                # Type check
npm run build                                    # Build
```

## 13) Repository Structure

- `app/` — Next.js routes and API endpoint
- `components/` — dashboard UI components
- `src/agents/` — 3-agent pipeline (analyst, executor, supervisor) + orchestrator
- `src/agents/identity.ts` — agent persona definitions
- `src/modules/` — metrics, scoring, routing, messaging modules
- `src/modules/state/` — agent memory, run ledger, week comparison, follow-up consumer
- `src/data/` — deterministic sample org dataset (8 weeks per employee)
- `src/types/` — output contracts and shared types
- `lib/` — optional UI compatibility re-exports only (`src/` remains source of truth)
- `scripts/` — CLI runner and loop runner
- `.mediary/state/` — runtime state (ledgers, memory) — gitignored

## 14) Output Contract

The top-level agent output includes:

**Analyst Output:**
- `identity` — Aria's persona and capabilities
- `memory` — analyst's persistent memory across runs
- `orgSummary` — org-wide risk distribution
- `monthlyTrendOrgSummary` — trend summary across all employees
- `monthlyTrendByEmployee` — per-employee 8-week trend data
- `teamHeatmap` — team-level risk aggregation
- `interventionQueue` — routed employees with rationale
- `hrMemo` — HR-facing org summary
- `impactSimulation` — projected intervention outcomes

**Executor Output:**
- `identity` — Ethan's persona and capabilities
- `memory` — executor's persistent memory across runs
- `toolInvocations` — internal tool execution log
- `actionArtifacts` — stakeholder-specific deliverables
- `followUpTasks` — queued follow-up tasks with cadences
- `runLedger` — run metadata and execution summary

**Supervisor Output:**
- `identity` — Sol's persona and capabilities
- `memory` — supervisor's persistent memory across runs
- `orgHealth` — composite org health assessment (healthy/attention/critical)
- `executionTrace` — 7-phase pipeline execution log
- `loopReport` — summaries from all three agents

The monthly trend fields allow Mediary to reason over sustained workload patterns instead of only a single-week snapshot.

This allows the UI and CLI to consume the same deterministic contract.
The execution adapters are deterministic internal simulations, not live external system integrations.

## 15) Limitations

- Uses deterministic sample data for hackathon reliability.
- Does not integrate with real Google Calendar yet.
- Does not diagnose burnout or mental health conditions.
- Does not send real messages yet.
- HR escalation is represented as an HR Ops queue, not automatic employee surveillance.

## 16) Future Development

- Expand Hermes orchestration from demo/runtime validation into configurable production agent tasks.
- Add real calendar connectors (Google/Microsoft) behind explicit consent flows.
- Add configurable organization policies for intervention routing thresholds.
- Add message delivery integrations (email/chat) as optional execution adapters.
- Expand longitudinal trend views across weekly runs.

## 17) AI Tools / Models Used

- Cursor for development assistance.
- Hermes for external demo orchestration, validation runs, and multi-agent evaluation.
- MiMo V2.5 Pro as the reasoning model used through Hermes during external execution review and stress testing.
- Deterministic in-repo agent logic for stable MVP runtime behavior and judge reproducibility.

The submitted application does not require Hermes or MiMo to run locally. They were used to operate and evaluate the agent loop during demo preparation.

## 18) Submission Notes

- Positioning: Mediary is an **operational workload diplomacy** system, not a diagnosis tool.
- Mediary is not employee surveillance and not productivity policing.
- Language focus: workload strain, workload diplomacy, intervention routing, focus erosion, meeting fragmentation.
- Designed for judge reproducibility: deterministic outputs, explicit execution trace, and scenario-based CLI demos.
- Core runtime outputs remain deterministic and reproducible.
- Hermes + MiMo V2.5 Pro are used for orchestration, validation, and agentic evaluation.
- The **8-week trend layer** supports sustained overload detection without relying only on a single-week snapshot.
- The **3-agent pipeline** with dedicated roles (Analyst, Executor, Supervisor) demonstrates clear separation of concerns.
- **Agent memory** persists across runs, enabling longitudinal reasoning and pattern detection.
- **Anomaly detection** and **org health assessment** provide self-monitoring capabilities.
- Mediary is now a **persistent autonomous agent loop** with state, memory, and cross-run continuity.
- No external calendar, HR, or messaging systems are modified.
