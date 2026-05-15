# Mediary

AI workplace diplomat for invisible overload.

## Problem Statement

Teams often miss early signs of overload because calendars look "normal" while focus time erodes through meeting fragmentation, back-to-back scheduling, and after-hours spillover. This hidden overload can reduce workflow sustainability and execution quality before it becomes visible in delivery metrics.

## Solution Overview

Mediary analyzes one employee's weekly calendar plus a lightweight five-question self-assessment, computes overload risk, identifies top drivers, and produces diplomatic workflow interventions. The output is operational and action-oriented, not clinical.

## Autonomous Agent Workflow

1. Load one employee's weekly calendar events.
2. Calculate calendar overload metrics.
3. Score five self-assessment answers.
4. Combine calendar and self-assessment risk (60/40).
5. Identify top overload drivers and candidate meeting changes.
6. Generate exactly 3 interventions, 1 diplomatic message draft, and a cleaned-up week preview.

## Agent Architecture

- **Calendar Parser Tool**: Loads weekly sample events for the employee context.
- **Metrics Engine Tool**: Calculates `weeklyMeetingHours`, `meetingRatio`, `backToBackDays`, `afterHoursMeetings`, and `estimatedFocusHours`.
- **Self-Assessment Tool**: Scores 5 responses into an `energyStrainScore` (0-100) with reverse scoring for positive prompts.
- **Risk Scoring Tool**: Produces overall overload risk using 60% calendar risk + 40% self-assessment strain.
- **Analyzer Agent**: Identifies top drivers and meeting candidates for compression, async conversion, or rescheduling.
- **Workflow Diplomat Agent**: Generates exactly 3 interventions, 1 diplomatic message draft, and a cleaned-up week preview.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local sample JSON data (no database in MVP)
- API route execution pipeline (`app/api/analyze/route.ts`)

## How To Run Locally

```bash
npm install
npm run dev
```

Open either:
- [http://localhost:3000](http://localhost:3000)
- [http://127.0.0.1:3000](http://127.0.0.1:3000)

## How To Test The Core Agent Workflow

1. Open the app and keep the default sample calendar and self-assessment values.
2. Click **Analyze workload**.
3. Confirm the result dashboard shows:
   - overload risk score and drivers,
   - **Agent Execution Trace** with completed tool/agent steps,
   - exactly 3 interventions,
   - 1 diplomatic message draft,
   - cleaned-up week preview.
4. Optionally verify the API directly:
   - `POST /api/analyze` returns deterministic JSON including `executionTrace`.

## AI Tools / Models Used

- Cursor for development assistance.
- Deterministic agent logic for MVP (no real LLM dependency required).
- Hermes planned/optional runtime orchestration layer for future evolution.

## Important Note

Mediary is **not** a medical or mental-health diagnosis tool. It is an operational workload sustainability agent designed to improve workflow health through diplomatic, practical interventions.
