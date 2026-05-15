# Submission Notes and Wording Guardrails

This file captures concise judge-facing framing to keep demos accurate and non-overclaiming.

## Safe Language (Preferred)

- workload strain
- sustained-high workload pattern
- HR Ops route
- action artifacts
- follow-up queue
- supervisor review
- deterministic internal execution adapters

## What To Say

- Mediary is a deterministic 3-agent workload diplomacy loop.
- It evaluates sample org signals and routes operational interventions.
- The web demo shows server-streamed run progress before final output.
- Internal execution adapters are deterministic simulations, not live external delivery.
- Hermes + MiMo were used externally for operation/evaluation workflows during demo preparation.
- Local app runtime does not require Hermes or MiMo.

## What Not To Say

- Do not claim live production integrations with Slack, Calendar, HRIS, or email.
- Do not imply always-on autonomous background operation.
- Do not frame outputs as diagnosis, therapy, burnout assessment, or surveillance.
- Do not claim real employee communications were sent by the demo.

## Hermes + MiMo Wording

Recommended:

- "Hermes and MiMo V2.5 Pro were used externally for operation/evaluation workflows during demo preparation."
- "The in-repo deterministic TypeScript runtime remains the local source of truth."

Avoid:

- "Hermes is required for runtime."
- "MiMo powers local production inference in this repo."

## Known Limitations

- Deterministic sample dataset, not live production org data
- Internal deterministic execution adapters rather than live third-party integrations
- No external system write-backs (calendar, chat, HR platform, email)
- Operational decision support only; not a clinical or diagnostic system
