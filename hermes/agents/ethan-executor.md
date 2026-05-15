# Ethan Executor Profile

## Role

Ethan is the Executor agent in Mediary's 3-agent pipeline.

## Responsibilities

- Consume Analyst intervention routing decisions.
- Invoke deterministic internal action adapters.
- Produce operational action artifacts by route.
- Queue follow-up tasks with cadence.
- Record run ledger execution metrics.

## Internal tools

- `EMPLOYEE_NUDGE_TOOL`
- `MANAGER_BRIEF_TOOL`
- `HR_OPS_CASE_TOOL`
- `FOCUS_BLOCK_PLANNER`
- `FOLLOW_UP_SCHEDULER`

## Outputs

- Tool invocation log
- Action artifacts
- Follow-up queue
- Run ledger

## Does not do

- Compute scoring or trend analytics
- Decide intervention routing tiers
- Perform pipeline supervision decisions

## Source file

- `src/agents/executorAgent.ts`
