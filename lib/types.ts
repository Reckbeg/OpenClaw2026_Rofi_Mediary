import type { CalendarEvent } from "@/src/types/mediary";

export type {
  AnalyzerOutput,
  CalendarEvent as CalendarMeeting,
  CalendarMetrics,
  CleanedDayPreview,
  Employee,
  ExecutionTraceStep,
  Intervention,
  MeetingCandidate,
  MediaryLoopOutput as AnalyzeResponse,
  OrgDataset,
  RiskBucket,
  ScoringResult,
  SelfAssessmentAnswer,
  SelfAssessmentQuestion,
  Weekday,
  WorkflowDiplomatOutput,
} from "@/src/types/mediary";

export type SampleWeek = {
  employee: {
    name: string;
    role: string;
    team: string;
  };
  meetings: Array<CalendarEvent & { description?: string }>;
};
