import type { AnalyzerOutput, CalendarMeeting, MeetingCandidate, ScoringResult } from "@/lib/types";
import { formatMeetingTime, getMeetingDurationHours, timeToMinutes } from "@/lib/scoring/calendarMetrics";

export function runAnalyzerAgent(
  scoringResult: ScoringResult,
  meetings: CalendarMeeting[],
): AnalyzerOutput {
  const meetingCandidates = selectMeetingCandidates(meetings);
  const actionCategories = new Set<string>();

  if (scoringResult.calendarMetrics.meetingRatio >= 0.3) {
    actionCategories.add("meeting compression");
  }

  if (scoringResult.calendarMetrics.backToBackDays >= 2) {
    actionCategories.add("focus block protection");
  }

  if (scoringResult.calendarMetrics.afterHoursMeetings > 0) {
    actionCategories.add("boundary-aware rescheduling");
  }

  if (scoringResult.selfAssessmentScore >= 55) {
    actionCategories.add("manager alignment");
  }

  return {
    summary: buildSummary(scoringResult),
    topDrivers: scoringResult.topDrivers.slice(0, 3),
    suggestedActionCategories: Array.from(actionCategories).slice(0, 4),
    meetingCandidates,
  };
}

function selectMeetingCandidates(meetings: CalendarMeeting[]): MeetingCandidate[] {
  const compressionCandidates = meetings
    .filter((meeting) => meeting.isRecurring && getMeetingDurationHours(meeting) >= 1)
    .slice(0, 2)
    .map((meeting) => toCandidate(meeting, "compress", "Recurring meeting with enough duration to tighten agenda scope."));

  const asyncCandidates = meetings
    .filter((meeting) => /sync|update|review|queue/i.test(meeting.title))
    .slice(0, 2)
    .map((meeting) => toCandidate(meeting, "async", "Status-oriented meeting can likely move to written updates or office hours."));

  const rescheduleCandidates = meetings
    .filter((meeting) => timeToMinutes(meeting.start) >= 18 * 60 || timeToMinutes(meeting.end) > 18 * 60)
    .map((meeting) => toCandidate(meeting, "reschedule", "After-hours meeting is extending the operating day."));

  return dedupeCandidates([
    ...compressionCandidates,
    ...asyncCandidates,
    ...rescheduleCandidates,
  ]).slice(0, 6);
}

function toCandidate(
  meeting: CalendarMeeting,
  recommendedChange: MeetingCandidate["recommendedChange"],
  reason: string,
): MeetingCandidate {
  return {
    meetingId: meeting.id,
    title: meeting.title,
    day: meeting.day,
    currentTime: formatMeetingTime(meeting),
    recommendedChange,
    reason,
  };
}

function dedupeCandidates(candidates: MeetingCandidate[]): MeetingCandidate[] {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (seen.has(candidate.meetingId)) {
      return false;
    }

    seen.add(candidate.meetingId);
    return true;
  });
}

function buildSummary(scoringResult: ScoringResult): string {
  const { calendarMetrics, riskBucket, overallRiskScore } = scoringResult;

  return `Mediary detected ${riskBucket.toLowerCase()} overload risk at ${overallRiskScore}/100. The week shows ${calendarMetrics.weeklyMeetingHours} meeting hours, ${calendarMetrics.backToBackDays} back-to-back days, and ${calendarMetrics.estimatedFocusHours} estimated focus hours, suggesting focus erosion from meeting fragmentation.`;
}
