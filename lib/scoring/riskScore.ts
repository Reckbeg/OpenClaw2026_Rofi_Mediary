import type { CalendarMetrics, RiskBucket, ScoringResult } from "@/lib/types";

export function computeRiskScore(
  calendarMetrics: CalendarMetrics,
  selfAssessmentScore: number,
): ScoringResult {
  const driverScores = [
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
    driverScores.reduce((total, driver) => total + driver.score * driver.weight, 0),
  );
  const overallRiskScore = Math.round(calendarOverloadRisk * 0.6 + selfAssessmentScore * 0.4);

  const topDrivers = [
    ...driverScores.map((driver) => ({
      label: driver.label,
      contribution: driver.score * driver.weight * 0.6,
    })),
    {
      label: "Self-assessment indicates elevated energy strain",
      contribution: selfAssessmentScore * 0.4,
    },
  ]
    .sort((a, b) => b.contribution - a.contribution)
    .map((driver) => driver.label);

  return {
    overallRiskScore,
    riskBucket: getRiskBucket(overallRiskScore),
    topDrivers: topDrivers.slice(0, 3),
    calendarMetrics,
    selfAssessmentScore,
    calendarOverloadRisk,
  };
}

function getRiskBucket(score: number): RiskBucket {
  if (score >= 70) {
    return "High";
  }

  if (score >= 40) {
    return "Medium";
  }

  return "Low";
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
