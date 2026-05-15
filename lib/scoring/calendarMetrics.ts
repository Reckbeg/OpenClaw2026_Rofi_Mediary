import type { CalendarMeeting, CalendarMetrics, Weekday } from "@/lib/types";

const WORK_WEEK_HOURS = 40;
const BACK_TO_BACK_GAP_MINUTES = 15;

export const weekdays: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getMeetingDurationHours(meeting: CalendarMeeting): number {
  return (timeToMinutes(meeting.end) - timeToMinutes(meeting.start)) / 60;
}

export function formatMeetingTime(meeting: CalendarMeeting): string {
  return `${meeting.start}-${meeting.end}`;
}

export function calculateCalendarMetrics(meetings: CalendarMeeting[]): CalendarMetrics {
  const weeklyMeetingHours = roundToHalfHour(
    meetings.reduce((total, meeting) => total + getMeetingDurationHours(meeting), 0),
  );

  const afterHoursMeetings = meetings.filter(
    (meeting) => timeToMinutes(meeting.start) >= 18 * 60 || timeToMinutes(meeting.end) > 18 * 60,
  ).length;

  const backToBackDays = weekdays.filter((day) => hasBackToBackMeetings(meetings, day)).length;
  const fragmentationPenalty = backToBackDays * 1.25 + afterHoursMeetings * 0.5;
  const estimatedFocusHours = Math.max(
    0,
    roundToHalfHour(WORK_WEEK_HOURS - weeklyMeetingHours - fragmentationPenalty),
  );

  return {
    weeklyMeetingHours,
    meetingRatio: roundToTwoDecimals(weeklyMeetingHours / WORK_WEEK_HOURS),
    backToBackDays,
    afterHoursMeetings,
    estimatedFocusHours,
  };
}

function hasBackToBackMeetings(meetings: CalendarMeeting[], day: Weekday): boolean {
  const sortedMeetings = meetings
    .filter((meeting) => meeting.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  return sortedMeetings.some((meeting, index) => {
    const nextMeeting = sortedMeetings[index + 1];
    if (!nextMeeting) {
      return false;
    }

    const gap = timeToMinutes(nextMeeting.start) - timeToMinutes(meeting.end);
    return gap >= 0 && gap <= BACK_TO_BACK_GAP_MINUTES;
  });
}

function roundToHalfHour(value: number): number {
  return Math.round(value * 2) / 2;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
