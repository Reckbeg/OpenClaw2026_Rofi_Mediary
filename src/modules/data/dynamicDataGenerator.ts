import { sampleOrgDataset } from "@/src/data/sampleOrg";
import type { OrgDataset, WeeklyRiskSnapshot } from "@/src/types/mediary";

const SUSTAINED_HIGH_IDS = new Set(["alex-johnson", "olivia-clark"]);

/**
 * Simple seeded PRNG (mulberry32).
 * Produces deterministic sequences so the same seed + week always yields
 * the same drift — useful for reproducible demos.
 */
function createRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Return a random integer in [min, max] inclusive using the provided rng. */
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Return a random float in [min, max] with one decimal using the provided rng. */
function randFloat(rng: () => number, min: number, max: number): number {
  return Math.round((rng() * (max - min) + min) * 10) / 10;
}

/** Return a random sign: -1 or +1. */
function randSign(rng: () => number): -1 | 1 {
  return rng() < 0.5 ? -1 : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRiskBucket(riskScore: number): "Low" | "Medium" | "High" {
  if (riskScore >= 80) return "High";
  if (riskScore >= 40) return "Medium";
  return "Low";
}

/**
 * Build a single additional week by drifting from the previous week's snapshot.
 *
 * Standard employees:
 *   - risk drift ±1–3
 *   - meeting hours drift ±0.5–2h
 *   - back-to-back days drift ±0–1
 *   - after-hours meetings drift ±0–1
 *
 * Sustained-high employees (alex-johnson, olivia-clark):
 *   - risk drift biased upward by +1–4
 *   - meeting hours biased upward by +0.5–2.5h
 *   - back-to-back days biased upward
 *   - after-hours meetings biased upward
 */
function driftSnapshot(
  prev: WeeklyRiskSnapshot,
  rng: () => number,
  isSustainedHigh: boolean,
): WeeklyRiskSnapshot {
  const riskSign = isSustainedHigh
    ? rng() < 0.75 ? 1 : -1   // 75% chance to drift upward
    : randSign(rng);

  const riskDelta = isSustainedHigh
    ? riskSign * randInt(rng, 1, 4)
    : riskSign * randInt(rng, 1, 3);

  const meetingSign = isSustainedHigh
    ? rng() < 0.7 ? 1 : -1
    : randSign(rng);

  const meetingDelta = isSustainedHigh
    ? meetingSign * randFloat(rng, 0.5, 2.5)
    : meetingSign * randFloat(rng, 0.5, 2);

  const b2bSign = isSustainedHigh ? (rng() < 0.7 ? 1 : -1) : randSign(rng);
  const b2bDelta = b2bSign * randInt(rng, 0, 1);

  const afterSign = isSustainedHigh ? (rng() < 0.7 ? 1 : -1) : randSign(rng);
  const afterDelta = afterSign * randInt(rng, 0, 1);

  const weeklyMeetingHours = Math.round(clamp(prev.weeklyMeetingHours + meetingDelta, 8, 35) * 10) / 10;
  const meetingRatio = Math.round((weeklyMeetingHours / 40) * 10) / 10;
  const backToBackDays = clamp(prev.backToBackDays + b2bDelta, 1, 5);
  const afterHoursMeetings = clamp(prev.afterHoursMeetings + afterDelta, 0, 5);
  const estimatedFocusHours = Math.round(
    clamp(40 - weeklyMeetingHours - backToBackDays * 1.2 - afterHoursMeetings * 0.5, 4, 28) * 10,
  ) / 10;
  const riskScore = clamp(prev.riskScore + riskDelta, 15, 99);
  const selfAssessmentScore = clamp(prev.selfAssessmentScore + riskDelta, 20, 99);

  return {
    weekLabel: "", // filled by caller
    weeklyMeetingHours,
    meetingRatio,
    backToBackDays,
    afterHoursMeetings,
    estimatedFocusHours,
    selfAssessmentScore,
    riskScore,
    riskBucket: toRiskBucket(riskScore),
  };
}

/**
 * Generate drifted org data by appending `weeks` of synthetic week-over-week
 * drift to every employee's existing weekly history.
 *
 * Returns a new OrgDataset — the original sampleOrgDataset is not mutated.
 */
export function generateDriftedData(weeks: number): OrgDataset {
  // Deep-clone employees (no mutation of source)
  const employees = sampleOrgDataset.employees.map((e) => ({ ...e }));

  // Deep-clone calendars
  const calendarsByEmployee: Record<string, typeof sampleOrgDataset.calendarsByEmployee[string]> = {};
  for (const [id, events] of Object.entries(sampleOrgDataset.calendarsByEmployee)) {
    calendarsByEmployee[id] = events.map((ev) => ({ ...ev }));
  }

  // Deep-clone weekly history and append drifted weeks
  const weeklyHistoryByEmployee: Record<string, WeeklyRiskSnapshot[]> = {};

  for (const [employeeId, history] of Object.entries(sampleOrgDataset.weeklyHistoryByEmployee)) {
    const cloned = history.map((snap) => ({ ...snap }));
    const isSustainedHigh = SUSTAINED_HIGH_IDS.has(employeeId);

    // Seed derived from employee id so drift is deterministic per employee
    let seedHash = 0;
    for (let i = 0; i < employeeId.length; i++) {
      seedHash = ((seedHash << 5) - seedHash + employeeId.charCodeAt(i)) | 0;
    }
    const rng = createRng(seedHash);

    let prev = cloned[cloned.length - 1];
    for (let w = 1; w <= weeks; w++) {
      const next = driftSnapshot(prev, rng, isSustainedHigh);
      const existingWeeks = cloned.length;
      const weekIndex = existingWeeks + w - 1;
      next.weekLabel = `Week ${weekIndex + 1}`;
      cloned.push(next);
      prev = next;
    }

    weeklyHistoryByEmployee[employeeId] = cloned;
  }

  return { employees, calendarsByEmployee, weeklyHistoryByEmployee };
}
