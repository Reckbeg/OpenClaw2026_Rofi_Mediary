import type {
  AnalyzerOutput,
  CleanedDayPreview,
  Intervention,
  MeetingCandidate,
  ScoringResult,
  Weekday,
  WorkflowDiplomatOutput,
} from "@/src/types/mediary";
import { generateDiplomaticMessage } from "@/src/modules/messaging/diplomaticMessage";

const weekdays: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function findCandidate(
  candidates: MeetingCandidate[],
  recommendedChange: MeetingCandidate["recommendedChange"],
): MeetingCandidate | undefined {
  return candidates.find((candidate) => candidate.recommendedChange === recommendedChange);
}

function focusBlocks(day: Weekday): string[] {
  const map: Record<Weekday, string[]> = {
    Monday: ["10:30-12:00 Focus block", "15:30-17:00 Delivery block"],
    Tuesday: ["10:30-12:00 Focus block", "15:00-16:30 Deep work"],
    Wednesday: ["11:00-12:30 Focus block", "16:00-17:30 Follow-through block"],
    Thursday: ["14:00-16:00 Deep work"],
    Friday: ["11:00-12:30 Planning and wrap-up"],
  };
  return map[day];
}

function buildWeekPreview(candidates: MeetingCandidate[]): CleanedDayPreview[] {
  const adjustmentsByDay = new Map<Weekday, string[]>();

  candidates.forEach((candidate) => {
    const label =
      candidate.recommendedChange === "compress"
        ? `Compress ${candidate.title}`
        : candidate.recommendedChange === "async"
          ? `Move ${candidate.title} async`
          : `Reschedule ${candidate.title}`;
    adjustmentsByDay.set(candidate.day, [...(adjustmentsByDay.get(candidate.day) ?? []), label]);
  });

  return weekdays.map((day) => ({
    day,
    focusBlocks: focusBlocks(day),
    meetingAdjustments: adjustmentsByDay.get(day)?.slice(0, 2) ?? ["No major meeting change needed"],
  }));
}

export function runWorkflowDiplomatAgent(
  analyzer: AnalyzerOutput,
  scoring: ScoringResult,
): WorkflowDiplomatOutput {
  const compression = findCandidate(analyzer.meetingCandidates, "compress");
  const asyncCandidate = findCandidate(analyzer.meetingCandidates, "async");
  const reschedule = findCandidate(analyzer.meetingCandidates, "reschedule");

  const interventions: [Intervention, Intervention, Intervention] = [
    {
      title: "Compress recurring coordination",
      category: "meeting compression",
      owner: "Employee and meeting owners",
      action: compression
        ? `Reduce "${compression.title}" from ${compression.currentTime} to a 30-minute decision-first agenda.`
        : "Reduce one recurring coordination meeting to a 30-minute decision-first agenda.",
      expectedImpact: "Returns predictable execution time and reduces fragmentation.",
    },
    {
      title: "Convert status traffic to async",
      category: "async conversion",
      owner: "Team leads",
      action: asyncCandidate
        ? `Move "${asyncCandidate.title}" to written updates plus optional office hours for blockers.`
        : "Move one status-heavy weekly sync to written updates plus optional office hours.",
      expectedImpact: "Improves focus continuity without reducing visibility.",
    },
    {
      title: reschedule ? "Reinforce day-boundary discipline" : "Protect weekly focus blocks",
      category: reschedule ? "boundary-aware rescheduling" : "focus block protection",
      owner: reschedule ? "Employee and stakeholders" : "Employee and manager",
      action: reschedule
        ? `Reschedule "${reschedule.title}" into core working hours or replace with a next-day decision note.`
        : scoring.calendarMetrics.backToBackDays >= 2
          ? "Reserve two 90-minute focus blocks on the most fragmented days and treat them as no-meeting windows."
          : "Add one protected deep-work block for strategic tasks before the weekly review cycle.",
      expectedImpact: reschedule
        ? "Improves workload sustainability and reduces spillover."
        : "Protects concentration capacity without reducing essential alignment.",
    },
  ];

  return {
    interventions,
    diplomaticMessageDraft: generateDiplomaticMessage(interventions),
    cleanedWeekPreview: buildWeekPreview(analyzer.meetingCandidates),
  };
}
