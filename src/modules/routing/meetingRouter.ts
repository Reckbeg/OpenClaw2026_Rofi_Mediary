import type { CalendarEvent, MeetingCandidate } from "@/src/types/mediary";
import { timeToMinutes } from "@/src/modules/metrics/calendarMetrics";

function formatTime(event: CalendarEvent): string {
  return `${event.start}-${event.end}`;
}

function dedupe(candidates: MeetingCandidate[]): MeetingCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.meetingId)) return false;
    seen.add(candidate.meetingId);
    return true;
  });
}

export function routeMeetingCandidates(events: CalendarEvent[]): MeetingCandidate[] {
  const compressionCandidates = events
    .filter((event) => event.isRecurring && timeToMinutes(event.end) - timeToMinutes(event.start) >= 60)
    .slice(0, 3)
    .map<MeetingCandidate>((event) => ({
      meetingId: event.id,
      title: event.title,
      day: event.day,
      currentTime: formatTime(event),
      recommendedChange: "compress",
      reason: "Recurring coordination window can be tightened with agenda and explicit decision owner.",
    }));

  const asyncCandidates = events
    .filter((event) => /sync|review|update|triage/i.test(event.title))
    .slice(0, 3)
    .map<MeetingCandidate>((event) => ({
      meetingId: event.id,
      title: event.title,
      day: event.day,
      currentTime: formatTime(event),
      recommendedChange: "async",
      reason: "Status-heavy exchange can move to structured async updates with blocker escalation path.",
    }));

  const rescheduleCandidates = events
    .filter((event) => timeToMinutes(event.start) >= 18 * 60 || timeToMinutes(event.end) > 18 * 60)
    .map<MeetingCandidate>((event) => ({
      meetingId: event.id,
      title: event.title,
      day: event.day,
      currentTime: formatTime(event),
      recommendedChange: "reschedule",
      reason: "After-hours event can be shifted into core collaboration hours.",
    }));

  return dedupe([...compressionCandidates, ...asyncCandidates, ...rescheduleCandidates]).slice(0, 8);
}
