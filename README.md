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
- executes message generation, and
- produces a follow-up plan.

Workflow status phrase used in outputs:
**“Autonomous org-wide workload diplomacy loop completed”**

## 6) Autonomous Workflow

1. Observe org dataset  
2. Calculate employee metrics  
3. Aggregate team risk  
4. Route interventions  
5. Generate stakeholder messages  
6. Follow-up plan

## 7) Agent Architecture

Core agent source code:
- `src/agents/runMediaryLoop.ts`
- `src/agents/analyzerAgent.ts`
- `src/agents/workflowDiplomatAgent.ts`
- `src/modules/metrics/calendarMetrics.ts`
- `src/modules/scoring/riskScore.ts`
- `src/modules/routing/meetingRouter.ts`
- `src/modules/messaging/diplomaticMessage.ts`

Key components:
- **Calendar Parser Tool**: loads deterministic org-wide calendar events.
- **Metrics Engine Tool**: computes meeting and focus metrics.
- **Self-Assessment Tool**: computes workload strain from 5-question responses.
- **Risk Scoring Tool**: combines calendar and self-assessment signals.
- **Analyzer Agent**: identifies top workload strain drivers and candidate actions.
- **Workflow Diplomat Agent**: generates interventions, stakeholder messages, and follow-up-oriented week previews.

## Hermes Runtime Role

Mediary's core workload diplomacy loop is implemented in deterministic TypeScript modules for hackathon reliability and judge reproducibility. Hermes is used as the runtime orchestration layer to execute, validate, and stress-test the agent loop.

In the demo setup, Hermes runs Mediary with MiMo V2.5 Pro for execution review and multi-agent evaluation. The Hermes evaluation checks whether Mediary demonstrates:
- signal observation,
- risk reasoning,
- intervention routing,
- stakeholder message execution,
- follow-up planning, and
- scenario-sensitive behavior.

The deterministic in-repo loop remains the source of truth for scoring, routing, and output contracts.

## 8) Core Features

1. Org-wide autonomous agent loop  
2. Deterministic sample org dataset with 24 employees  
3. Normalized team structure with 5 teams:
   - Product & Engineering
   - Customer Operations
   - Design & Quality
   - People & Program Operations
   - Business Operations
4. Deterministic scoring engine  
5. Calendar workload metrics  
6. Self-assessment strain scoring  
7. Risk buckets: Low, Medium, High, Sustained High  
8. Intervention routing:
   - Low: monitor only
   - Medium: employee nudge
   - High: employee nudge + manager brief
   - Sustained High: HR Ops queue
9. Driver-aware next steps  
10. HR memo generation  
11. Team heatmap  
12. Intervention queue  
13. Selected employee detail (Maya Chen)  
14. Impact simulation (before/after projected org metrics)  
15. Execution trace (observe → reason → decide → execute → follow-up)  
16. CLI runner scenarios  
17. Minimal UI rendering the same agent output through app/API pipeline  
18. No auth, no database, no external integrations  
19. 4-week workload trend signal  
20. Monthly trend org summary  
21. Previous week risk context  
22. Manager coaching brief for high and sustained-high routes  
23. Projected meeting hours reduced  
24. Projected focus hours gained

## 9) Demo Scenarios

- **baseline**: normal org-wide workload scan.
- **sustained-high**: deterministic scenario that activates HR Ops queue for repeated high workload strain.

## 10) Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Deterministic in-repo data + scoring modules
- Hermes as orchestration/runtime layer
- MiMo V2.5 Pro as the reasoning model used through Hermes for execution review and multi-agent evaluation

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
npm run agent
npm run agent -- --scenario=sustained-high
npm run dev
npm run typecheck
npm run build
```

## 13) Repository Structure

- `app/` - Next.js routes and API endpoint
- `components/` - dashboard UI components
- `src/agents/` - autonomous loop + agent logic
- `src/modules/` - metrics, scoring, routing, messaging modules
- `src/data/` - deterministic sample org dataset
- `src/types/` - output contracts and shared types
- `scripts/` - CLI runner

## 14) Output Contract

The top-level agent output includes:
- `scenario`
- `orgSummary`
- `monthlyTrendOrgSummary`
- `monthlyTrendByEmployee`
- `teamHeatmap`
- `interventionQueue`
- `hrMemo`
- `impactSimulation`
  - `projectedMeetingHoursReduced`
  - `projectedFocusHoursGained`
- `selectedEmployeeDetail`
  - `monthlyTrend`
- `executionTrace`
- `workflowStatus`

The monthly trend fields allow Mediary to reason over sustained workload patterns instead of only a single-week snapshot.

This allows the UI and CLI to consume the same deterministic contract.

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
- Hermes for agent runtime orchestration, validation runs, and multi-agent evaluation.
- MiMo V2.5 Pro as the primary reasoning model used through Hermes for execution review and stress testing.
- Deterministic in-repo agent logic for stable MVP runtime behavior and judge reproducibility.

Mediary uses deterministic TypeScript modules for the core workload analysis loop, while Hermes + MiMo V2.5 Pro are used to orchestrate, inspect, and evaluate the autonomous agent workflow.

## 18) Submission Notes

- Positioning: Mediary is an **operational workload diplomacy** system, not a diagnosis tool.
- Mediary is not employee surveillance and not productivity policing.
- Language focus: workload strain, workload diplomacy, intervention routing, focus erosion, meeting fragmentation.
- Designed for judge reproducibility: deterministic outputs, explicit execution trace, and scenario-based CLI demos.
- Core runtime outputs remain deterministic and reproducible.
- Hermes + MiMo V2.5 Pro are used for orchestration, validation, and agentic evaluation.
- The 4-week trend layer supports sustained overload detection without relying only on a single-week snapshot.
