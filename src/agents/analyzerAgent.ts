import type { AnalyzerOutput, CalendarEvent, ScoringResult } from "@/src/types/mediary";
import { routeMeetingCandidates } from "@/src/modules/routing/meetingRouter";

export function runAnalyzerAgent(scoring: ScoringResult, events: CalendarEvent[]): AnalyzerOutput {
  const meetingCandidates = routeMeetingCandidates(events);
  const categories = new Set<string>();

  if (scoring.calendarMetrics.meetingRatio >= 0.3) categories.add("meeting compression");
  if (scoring.calendarMetrics.backToBackDays >= 2) categories.add("focus block protection");
  if (scoring.calendarMetrics.afterHoursMeetings > 0) categories.add("boundary-aware rescheduling");
  if (scoring.selfAssessmentScore >= 55) categories.add("manager alignment");

  return {
    summary: `Mediary detected ${scoring.riskBucket.toLowerCase()} overload risk at ${scoring.overallRiskScore}/100 with ${scoring.calendarMetrics.weeklyMeetingHours} meeting hours and ${scoring.calendarMetrics.estimatedFocusHours} estimated focus hours.`,
    topDrivers: scoring.topDrivers.slice(0, 3),
    suggestedActionCategories: Array.from(categories).slice(0, 4),
    meetingCandidates,
  };
}
