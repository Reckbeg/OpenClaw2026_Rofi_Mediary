export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export type CalendarMeeting = {
  id: string;
  title: string;
  day: Weekday;
  start: string;
  end: string;
  attendees: string[];
  owner: string;
  isRecurring: boolean;
  description: string;
};

export type SampleWeek = {
  employee: {
    name: string;
    role: string;
    team: string;
  };
  meetings: CalendarMeeting[];
};

export type CalendarMetrics = {
  weeklyMeetingHours: number;
  meetingRatio: number;
  backToBackDays: number;
  afterHoursMeetings: number;
  estimatedFocusHours: number;
};

export type SelfAssessmentQuestion = {
  id: string;
  prompt: string;
  isPositive: boolean;
};

export type SelfAssessmentAnswer = {
  questionId: string;
  score: number;
};

export type RiskBucket = "Low" | "Medium" | "High";

export type ScoringResult = {
  overallRiskScore: number;
  riskBucket: RiskBucket;
  topDrivers: string[];
  calendarMetrics: CalendarMetrics;
  selfAssessmentScore: number;
  calendarOverloadRisk: number;
};

export type MeetingCandidate = {
  meetingId: string;
  title: string;
  day: Weekday;
  currentTime: string;
  recommendedChange: "compress" | "async" | "reschedule";
  reason: string;
};

export type AnalyzerOutput = {
  summary: string;
  topDrivers: string[];
  suggestedActionCategories: string[];
  meetingCandidates: MeetingCandidate[];
};

export type Intervention = {
  title: string;
  category: string;
  owner: string;
  action: string;
  expectedImpact: string;
};

export type CleanedDayPreview = {
  day: Weekday;
  focusBlocks: string[];
  meetingAdjustments: string[];
};

export type WorkflowDiplomatOutput = {
  interventions: [Intervention, Intervention, Intervention];
  diplomaticMessageDraft: string;
  cleanedWeekPreview: CleanedDayPreview[];
};

export type AnalyzeResponse = {
  scoring: ScoringResult;
  analyzer: AnalyzerOutput;
  diplomat: WorkflowDiplomatOutput;
  executionTrace: ExecutionTraceStep[];
};

export type ExecutionStatus = "completed";

export type ExecutionTraceStep = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  name:
    | "Calendar Parser Tool"
    | "Metrics Engine Tool"
    | "Self-Assessment Tool"
    | "Risk Scoring Tool"
    | "Analyzer Agent"
    | "Workflow Diplomat Agent";
  status: ExecutionStatus;
  output: string;
};
