import type { CalendarEvent } from "@/src/types/mediary";

// Compatibility shim. Source of truth lives in src/.
export type {
  AnalyzerOutput,
  CalendarEvent as CalendarMeeting,
  CalendarMetrics,
  CleanedDayPreview,
  DemoScenario,
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
