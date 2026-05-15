import type {
  AnalyzerOutput,
  CleanedDayPreview,
  Intervention,
  MeetingCandidate,
  Weekday,
  WorkflowDiplomatOutput,
} from "@/lib/types";
import { weekdays } from "@/lib/scoring/calendarMetrics";

export function runWorkflowDiplomatAgent(analyzerOutput: AnalyzerOutput): WorkflowDiplomatOutput {
  const compressionCandidate = findCandidate(analyzerOutput.meetingCandidates, "compress");
  const asyncCandidate = findCandidate(analyzerOutput.meetingCandidates, "async");
  const rescheduleCandidate = findCandidate(analyzerOutput.meetingCandidates, "reschedule");

  const interventions: [Intervention, Intervention, Intervention] = [
    {
      title: "Compress recurring coordination",
      category: "meeting compression",
      owner: "Maya and meeting owners",
      action: compressionCandidate
        ? `Reduce "${compressionCandidate.title}" from ${compressionCandidate.currentTime} to a 30-minute agenda with decisions captured in writing.`
        : "Reduce one recurring coordination meeting to 30 minutes with a decision-first agenda.",
      expectedImpact: "Returns roughly 30-60 minutes and lowers meeting fragmentation early in the week.",
    },
    {
      title: "Move status work async",
      category: "async conversion",
      owner: "Team leads",
      action: asyncCandidate
        ? `Convert "${asyncCandidate.title}" into a written update with optional office hours for blockers.`
        : "Convert one status-heavy review into a written update with optional office hours.",
      expectedImpact: "Protects focus time without removing visibility for stakeholders.",
    },
    {
      title: "Protect late-day boundaries",
      category: "boundary-aware rescheduling",
      owner: "Maya and stakeholders",
      action: rescheduleCandidate
        ? `Move "${rescheduleCandidate.title}" out of the after-hours window or replace it with a next-day decision note.`
        : "Move late-day stakeholder work into core hours or a next-day decision note.",
      expectedImpact: "Reduces spillover and makes the week more sustainable without escalating the tone.",
    },
  ];

  return {
    interventions,
    diplomaticMessageDraft: buildDiplomaticMessage(interventions),
    cleanedWeekPreview: buildCleanedWeekPreview(analyzerOutput.meetingCandidates),
  };
}

function findCandidate(
  candidates: MeetingCandidate[],
  recommendedChange: MeetingCandidate["recommendedChange"],
): MeetingCandidate | undefined {
  return candidates.find((candidate) => candidate.recommendedChange === recommendedChange);
}

function buildDiplomaticMessage(interventions: [Intervention, Intervention, Intervention]): string {
  return `Hi team, I noticed this week has several places where coordination is starting to crowd out focus time. To keep delivery steady, could we try three small workflow adjustments: ${interventions[0].action} ${interventions[1].action} ${interventions[2].action} This should preserve visibility while giving everyone a little more room for focused execution.`;
}

function buildCleanedWeekPreview(candidates: MeetingCandidate[]): CleanedDayPreview[] {
  const adjustmentsByDay = new Map<Weekday, string[]>();

  candidates.forEach((candidate) => {
    const adjustment =
      candidate.recommendedChange === "compress"
        ? `Compress ${candidate.title}`
        : candidate.recommendedChange === "async"
          ? `Move ${candidate.title} async`
          : `Reschedule ${candidate.title}`;

    adjustmentsByDay.set(candidate.day, [...(adjustmentsByDay.get(candidate.day) ?? []), adjustment]);
  });

  return weekdays.map((day) => ({
    day,
    focusBlocks: getFocusBlocks(day),
    meetingAdjustments: adjustmentsByDay.get(day)?.slice(0, 2) ?? ["No major meeting change needed"],
  }));
}

function getFocusBlocks(day: Weekday): string[] {
  const focusBlocksByDay: Record<Weekday, string[]> = {
    Monday: ["10:30-12:00 Focus block", "15:30-17:00 Delivery block"],
    Tuesday: ["10:30-12:00 Focus block", "15:00-16:30 Deep work"],
    Wednesday: ["11:00-12:30 Focus block", "16:00-17:30 Follow-through block"],
    Thursday: ["14:00-16:00 Deep work"],
    Friday: ["11:00-12:30 Planning and wrap-up"],
  };

  return focusBlocksByDay[day];
}
