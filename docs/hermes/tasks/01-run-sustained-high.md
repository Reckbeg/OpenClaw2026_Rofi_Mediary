# Task Prompt: Run Mediary sustained-high workload diplomacy cycle

Use this prompt in Hermes:

```text
Run Mediary sustained-high workload diplomacy cycle.

Instructions:
1) Inspect repository scripts if needed.
2) Run:
   - npm run typecheck
   - npm run build
   - npm run agent -- --scenario=sustained-high
3) Summarize outputs using this structure:
   - Analyst summary (org workload strain, routing highlights, sustained-high workload pattern)
   - Executor summary (tools executed, action artifacts generated, follow-up queue size)
   - Supervisor summary (org health status/score, anomalies, recommendation)
4) Report:
   - HR Ops route count
   - tools executed count
   - action artifacts count
   - follow-up queue count
   - run ledger fields (runId, employees analyzed, decisions made)
5) Use safe language: workload strain, sustained-high workload pattern, HR Ops route.
6) Do not claim live external integrations.
```
