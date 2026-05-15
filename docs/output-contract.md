# Output Contract

Mediary uses a deterministic TypeScript output contract defined in `src/types/mediary.ts`.  
UI compatibility re-exports are in `lib/types.ts`.

## Top-Level Loop Output

Primary output type:

- `MediaryLoopOutput`

Key top-level fields:

- `scenario`
- `orgSummary`
- `monthlyTrendOrgSummary`
- `monthlyTrendByEmployee`
- `teamHeatmap`
- `interventionQueue`
- `hrMemo`
- `impactSimulation`
- `selectedEmployeeDetail`
- `toolInvocations`
- `actionArtifacts`
- `followUpTasks`
- `runLedger`
- `orgHealth`
- `executionTrace`
- `workflowStatus`

## Analyst Output

Primary type:

- `AnalystOutput`

Key fields:

- `identity`
- `memory`
- `employeeDetails`
- `orgSummary`
- `monthlyTrendOrgSummary`
- `monthlyTrendByEmployee`
- `teamHeatmap`
- `interventionQueue`
- `hrMemo`
- `impactSimulation`

## Executor Output

Primary type:

- `ExecutorOutput`

Key fields:

- `identity`
- `memory`
- `toolInvocations`
- `actionArtifacts`
- `followUpTasks`
- `runLedger`

## Supervisor Output

Primary type:

- `SupervisorOutput`

Key fields:

- `identity`
- `memory`
- `orgHealth`
- `executionTrace`
- `loopReport`

## SSE Streaming Event Contract

Web live-run endpoint:

- `GET /api/agent-stream?scenario=baseline|sustained-high`

Event type:

- `AgentStreamEvent`

Supported `type` values:

- `run.started`
- `analyst.started`
- `analyst.completed`
- `executor.started`
- `executor.tool_invoked`
- `executor.artifact_created`
- `executor.followup_queued`
- `executor.completed`
- `supervisor.started`
- `supervisor.completed`
- `run.completed`
- `run.failed`

Event shape:

- `type`
- `agent?` (`Aria Analyst`, `Ethan Executor`, `Sol Supervisor`)
- `title`
- `detail`
- `payload?`

SSE wire format:

- `data: ${JSON.stringify(event)}\n\n`

## Compatibility Note

- `POST /api/analyze` remains available as a compatibility/fallback endpoint.
- Main web demo controls are streamed with SSE via `/api/agent-stream`.
