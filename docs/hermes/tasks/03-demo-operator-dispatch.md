# Task Prompt: Demo operator dispatch

Use this prompt in Hermes:

```text
Do not answer as a chatbot. Operate Mediary and produce an operator dispatch.

Run:
- npm run typecheck
- npm run build
- npm run agent -- --scenario=sustained-high

Output sections (exact order):
1) Situation
2) Analyst findings
3) Executor actions
4) Supervisor review
5) Follow-up queue
6) Run ledger
7) Next cycle intent
8) Remaining limitation

Use language:
- workload strain
- sustained-high workload pattern
- HR Ops route
- action artifacts
- follow-up queue

Avoid language:
- burnout diagnosis
- therapy
- surveillance
- productivity policing
- claims of real external integrations
```
