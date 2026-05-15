# Mediary Agentic Scorecard

Use this scorecard to evaluate agentic maturity from repository evidence and runtime outputs.

## 1) Observe

- **Evidence to look for:** signal intake from calendar + self-assessment + dataset.
- **Where it appears:** `src/modules/metrics/calendarMetrics.ts`, `src/modules/scoring/selfAssessment.ts`, run output summaries.
- **Current score estimate:** 9/10
- **Remaining gap:** no live external signal ingestion yet.

## 2) Reason

- **Evidence to look for:** deterministic risk composition and driver ranking.
- **Where it appears:** `src/modules/scoring/riskScore.ts`, selected employee scoring output.
- **Current score estimate:** 9/10
- **Remaining gap:** reasoning is deterministic and not policy-configurable at runtime.

## 3) Decide

- **Evidence to look for:** route assignment with rationale and alternatives.
- **Where it appears:** intervention queue fields (`route`, `decisionRationale`, `consideredAlternatives`), `src/agents/analystAgent.ts`.
- **Current score estimate:** 9/10
- **Remaining gap:** no external approval workflow integration.

## 4) Execute

- **Evidence to look for:** tool invocation log and action artifact generation.
- **Where it appears:** `toolInvocations`, `actionArtifacts`, `src/agents/executorAgent.ts`.
- **Current score estimate:** 8/10
- **Remaining gap:** execution adapters are simulated, not live connectors.

## 5) Follow-up

- **Evidence to look for:** queued follow-up tasks with route-specific cadence.
- **Where it appears:** `followUpTasks`, `src/modules/state/followUpConsumer.ts`, loop output follow-up processing.
- **Current score estimate:** 8/10
- **Remaining gap:** requires scheduled trigger/manual run to process queue each cycle.

## 6) Supervise

- **Evidence to look for:** anomalies, org health assessment, supervisor recommendation.
- **Where it appears:** `orgHealth`, `executionTrace`, `src/agents/supervisorAgent.ts`.
- **Current score estimate:** 8/10
- **Remaining gap:** anomaly taxonomy can be expanded for broader failure modes.

## 7) Memory/state

- **Evidence to look for:** persisted per-agent memory and run ledgers across runs.
- **Where it appears:** `.mediary/state/memory/*`, `src/modules/state/agentMemory.ts`, `src/modules/state/ledgerStore.ts`.
- **Current score estimate:** 9/10
- **Remaining gap:** state tooling is local-file based and not multi-tenant.

## 8) Scenario adaptivity

- **Evidence to look for:** differentiated behavior between `baseline` and `sustained-high`.
- **Where it appears:** scenario input in API/CLI, sustained-high route outcomes in run outputs.
- **Current score estimate:** 9/10
- **Remaining gap:** scenario set is intentionally narrow for deterministic demo control.

## 9) Safety/framing

- **Evidence to look for:** operational language, non-diagnostic framing, HR Ops route positioning.
- **Where it appears:** README framing, UI copy, intervention semantics.
- **Current score estimate:** 9/10
- **Remaining gap:** maintain strict wording discipline in future demos.

## 10) Reproducibility

- **Evidence to look for:** stable deterministic outputs and repeatable scripts.
- **Where it appears:** `npm run typecheck`, `npm run build`, `npm run agent`, `npm run loop`, deterministic `src/data/sampleOrg.ts`.
- **Current score estimate:** 10/10
- **Remaining gap:** none critical for hackathon scope.
