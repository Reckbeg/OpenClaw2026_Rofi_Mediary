import type { CalendarMetrics, RiskBucket, ScoringResult } from "@/src/types/mediary";

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function getRiskBucket(score: number): RiskBucket {
  if (score >= 80) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function qualifyDriver(label: string, bucket: RiskBucket): string {
  if (bucket === "Low") {
    return `Mild signal: ${label.toLowerCase()}; monitor for trend changes.`;
  }
  if (bucket === "Medium") {
    return `Intervention recommended: ${label.toLowerCase()}.`;
  }
  return `Urgent workload strain: ${label.toLowerCase()}.`;
}

export function computeRiskScore(
  calendarMetrics: CalendarMetrics,
  selfAssessmentScore: number,
): ScoringResult {
  const drivers = [
    {
      label: "Meeting load is using a large share of the 40-hour week",
      score: clamp(calendarMetrics.meetingRatio * 150),
      weight: 0.38,
    },
    {
      label: "Back-to-back meeting days are eroding recovery time",
      score: clamp((calendarMetrics.backToBackDays / 5) * 100),
      weight: 0.24,
    },
    {
      label: "Focus hours are below a sustainable operating range",
      score: clamp(((24 - calendarMetrics.estimatedFocusHours) / 24) * 100),
      weight: 0.23,
    },
    {
      label: "After-hours meetings are extending the workday boundary",
      score: clamp((calendarMetrics.afterHoursMeetings / 3) * 100),
      weight: 0.15,
    },
  ];

  const calendarOverloadRisk = Math.round(
    drivers.reduce((sum, driver) => sum + driver.score * driver.weight, 0),
  );
  const overallRiskScore = Math.round(calendarOverloadRisk * 0.6 + selfAssessmentScore * 0.4);

  const riskBucket = getRiskBucket(overallRiskScore);
  const topDrivers = [
    ...drivers.map((driver) => ({
      label: driver.label,
      contribution: driver.score * driver.weight * 0.6,
    })),
    {
      label: "Self-assessment indicates elevated energy strain",
      contribution: selfAssessmentScore * 0.4,
    },
  ]
    .sort((a, b) => b.contribution - a.contribution)
    .map((driver) => qualifyDriver(driver.label, riskBucket))
    .slice(0, 3);

  return {
    overallRiskScore,
    riskBucket,
    topDrivers,
    calendarMetrics,
    selfAssessmentScore,
    calendarOverloadRisk,
  };
}
