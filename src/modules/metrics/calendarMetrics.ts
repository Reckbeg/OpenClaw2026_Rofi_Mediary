import type { CalendarEvent, CalendarMetrics, Weekday } from "@/src/types/mediary";

const WORK_WEEK_HOURS = 40;
const BACK_TO_BACK_GAP_MINUTES = 15;
export const weekdays: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function getMeetingDurationHours(event: CalendarEvent): number {
  return (timeToMinutes(event.end) - timeToMinutes(event.start)) / 60;
}

export function formatMeetingTime(event: CalendarEvent): string {
  return `${event.start}-${event.end}`;
}

function roundToHalfHour(value: number): number {
  return Math.round(value * 2) / 2;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function hasBackToBack(events: CalendarEvent[], day: Weekday): boolean {
  const sorted = events
    .filter((event) => event.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  return sorted.some((event, index) => {
    const next = sorted[index + 1];
    if (!next) return false;
    const gap = timeToMinutes(next.start) - timeToMinutes(event.end);
    return gap >= 0 && gap <= BACK_TO_BACK_GAP_MINUTES;
  });
}

export function calculateCalendarMetrics(events: CalendarEvent[]): CalendarMetrics {
  const weeklyMeetingHours = roundToHalfHour(
    events.reduce((sum, event) => sum + getMeetingDurationHours(event), 0),
  );
  const meetingRatio = roundToTwoDecimals(weeklyMeetingHours / WORK_WEEK_HOURS);
  const backToBackDays = weekdays.filter((day) => hasBackToBack(events, day)).length;
  const afterHoursMeetings = events.filter(
    (event) => timeToMinutes(event.start) >= 18 * 60 || timeToMinutes(event.end) > 18 * 60,
  ).length;
  const fragmentationPenalty = backToBackDays * 1.25 + afterHoursMeetings * 0.5;
  const estimatedFocusHours = Math.max(0, roundToHalfHour(WORK_WEEK_HOURS - weeklyMeetingHours - fragmentationPenalty));

  return {
    weeklyMeetingHours,
    meetingRatio,
    backToBackDays,
    afterHoursMeetings,
    estimatedFocusHours,
  };
}
