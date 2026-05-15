# Sol Supervisor Profile

## Role

Sol is the Supervisor agent in Mediary's 3-agent pipeline.

## Responsibilities

- Review pipeline outputs for consistency and completeness.
- Detect anomalies across run results.
- Assess org health status and recommendation.
- Validate execution integrity against route and tool behavior.
- Support stateful oversight across runs.

## Anomaly detection

Sol checks for execution or routing inconsistencies and flags abnormal states that require attention.

## Org health

Sol outputs org health status (`healthy`, `attention`, `critical`) with score and recommendation.

## Does not do

- Compute primary workload scoring
- Execute action adapters
- Create frontline action artifacts

## Source files

- `src/agents/supervisorAgent.ts`
- `src/modules/state/ledgerStore.ts`
- `src/modules/state/agentMemory.ts`
