import type { SampleWeek, Weekday } from "@/lib/types";
import { getMeetingDurationHours, weekdays } from "@/lib/scoring/calendarMetrics";

type CalendarPanelProps = {
  week: SampleWeek;
};

export function CalendarPanel({ week }: CalendarPanelProps) {
  const meetingsByDay = weekdays.map((day) => ({
    day,
    meetings: week.meetings.filter((meeting) => meeting.day === day),
  }));

  return (
    <section className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Sample calendar</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-950">{week.employee.name}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {week.employee.role}, {week.employee.team}
        </p>
      </div>

      <div className="space-y-4">
        {meetingsByDay.map(({ day, meetings }) => (
          <DaySchedule key={day} day={day} meetings={meetings} />
        ))}
      </div>
    </section>
  );
}

function DaySchedule({
  day,
  meetings,
}: {
  day: Weekday;
  meetings: SampleWeek["meetings"];
}) {
  const meetingHours = meetings.reduce((total, meeting) => total + getMeetingDurationHours(meeting), 0);

  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-stone-900">{day}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-sm">
          {meetingHours}h meetings
        </span>
      </div>
      <div className="space-y-2">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-900">{meeting.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {meeting.owner} · {meeting.attendees.length} groups
                </p>
              </div>
              <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                {meeting.start}-{meeting.end}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
