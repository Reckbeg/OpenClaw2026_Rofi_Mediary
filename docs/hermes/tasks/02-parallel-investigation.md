# Task Prompt: Parallel multi-agent investigation

Use this prompt in Hermes:

```text
Run a parallel investigation of Mediary and return a single merged report.

Launch these roles in parallel:

1) Repository Scout
- Map key folders/files and identify source-of-truth runtime modules.
- Confirm where the 3-agent pipeline, memory/state, and run ledger are implemented.

2) Architecture Inspector
- Inspect Analyst → Executor → Supervisor flow and handoff boundaries.
- Verify where scoring, routing, messaging, memory, and supervision logic live.

3) Runtime Executor
- Run:
  - npm run typecheck
  - npm run build
  - npm run agent -- --scenario=sustained-high
  - npm run loop -- --scenario=sustained-high
- Extract key counts: routes, tools, artifacts, follow-ups, org health, run ledger.

4) Agentic Behaviour Judge
- Evaluate observe/reason/decide/execute/follow-up/supervise quality from outputs.
- Check if statefulness (memory + ledger + follow-up loop) is demonstrated.

5) Demo Story Critic
- Assess if demo narrative clearly shows:
  - workload strain signals
  - sustained-high workload pattern handling
  - HR Ops route behavior
  - action artifacts
  - follow-up queue
- Flag weak framing or overclaims.

Output format:
- Executive summary
- Evidence by role
- Agentic maturity verdict
- Risks and caveats
- Demo readiness recommendation

Constraints:
- Do not claim live external calendar/HR/messaging writes.
- Use safe framing (operational workload assistant, not diagnosis).
```
