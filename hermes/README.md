# Hermes Operating Specs (Public-Safe)

This folder contains public-safe Hermes operating specs for Mediary.

It intentionally does **not** contain:
- Hermes credentials
- local Hermes runtime state
- tokens or API keys
- private machine configuration

These files are intended to help Hermes operate, inspect, validate, and evaluate Mediary safely from repository context.

Mediary itself runs locally without Hermes or MiMo as required runtime dependencies. Hermes + MiMo V2.5 Pro were used externally for orchestration, validation, stress testing, and multi-agent evaluation.

The deterministic TypeScript loop in `src/` remains the source of truth.

## Quick Commands

```bash
cd /home/ubuntu/OpenClaw2026_Rofi_Mediary
npm run typecheck
npm run build
npm run agent -- --scenario=sustained-high
npm run loop -- --scenario=sustained-high
```

## Included Specs

- `agent-profile.md` — operator profile for Mediary
- `runbook.md` — safe operating runbook
- `tasks/` — ready-to-paste Hermes task prompts
- `agents/` — per-agent operating profiles
- `eval/agentic-scorecard.md` — agentic maturity evaluation rubric
