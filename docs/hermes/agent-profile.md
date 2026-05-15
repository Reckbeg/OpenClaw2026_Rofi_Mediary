# Mediary Agent Profile for Hermes

## System Identity

Mediary is a **stateful 3-agent workload diplomacy loop**:

1. Analyst
2. Executor
3. Supervisor

It is an **operational workload assistant**, not a diagnosis system.

## Safety and Framing

- No therapy framing
- No diagnosis framing
- No surveillance framing
- No productivity policing framing
- Use terms like workload strain, sustained-high workload pattern, HR Ops route, action artifacts, and follow-up queue

## Source of Truth

Core source-of-truth implementation lives in:
- `src/agents/`
- `src/modules/`

Hermes should treat deterministic TypeScript runtime outputs as authoritative.

## Expected Hermes Operator Behavior

- Inspect the repository before making claims.
- Prefer the `sustained-high` scenario for strongest demonstration.
- Report decisions, tools, action artifacts, follow-up queue, and supervisor health.
- Call out that integrations are deterministic internal adapters, not live external system writes.
- Avoid overclaiming real integrations or private infrastructure.
