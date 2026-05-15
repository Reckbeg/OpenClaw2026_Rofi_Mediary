import type { ScoringResult } from "@/lib/types";

type MetricsCardsProps = {
  scoring: ScoringResult;
};

export function MetricsCards({ scoring }: MetricsCardsProps) {
  const metrics = [
    {
      label: "Overall risk",
      value: `${scoring.overallRiskScore}/100`,
      helper: scoring.riskBucket,
    },
    {
      label: "Meeting load",
      value: `${scoring.calendarMetrics.weeklyMeetingHours}h`,
      helper: `${Math.round(scoring.calendarMetrics.meetingRatio * 100)}% of week`,
    },
    {
      label: "Focus estimate",
      value: `${scoring.calendarMetrics.estimatedFocusHours}h`,
      helper: "after fragmentation",
    },
    {
      label: "Energy strain",
      value: `${scoring.selfAssessmentScore}/100`,
      helper: "self-assessment",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{metric.value}</p>
          <p className="mt-1 text-xs text-stone-500">{metric.helper}</p>
        </div>
      ))}
    </div>
  );
}
