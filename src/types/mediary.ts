export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export type CalendarEvent = {
  id: string;
  title: string;
  day: Weekday;
  start: string;
  end: string;
  owner: string;
  attendees: string[];
  isRecurring: boolean;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  team: string;
  timezone: string;
  manager: string;
};

export type OrgDataset = {
  employees: Employee[];
  calendarsByEmployee: Record<string, CalendarEvent[]>;
  weeklyHistoryByEmployee: Record<string, WeeklyRiskSnapshot[]>;
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

export type CalendarMetrics = {
  weeklyMeetingHours: number;
  meetingRatio: number;
  backToBackDays: number;
  afterHoursMeetings: number;
  estimatedFocusHours: number;
};

export type RiskBucket = "Low" | "Medium" | "High";

export type WeeklyRiskSnapshot = {
  weekLabel: string;
  weeklyMeetingHours: number;
  meetingRatio: number;
  backToBackDays: number;
  afterHoursMeetings: number;
  estimatedFocusHours: number;
  selfAssessmentScore: number;
  riskScore: number;
  riskBucket: RiskBucket;
};

export type MonthlyTrendSummary = {
  employeeId: string;
  trendDirection: "improving" | "stable" | "worsening";
  highRiskWeeks: number;
  mediumOrHighWeeks: number;
  riskDelta: number;
  sustainedPatternDetected: boolean;
  summary: string;
};

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

export type ExecutionPhase = "observe" | "reason" | "decide" | "execute" | "follow-up" | "supervise";

export type AgentRole = "analyst" | "executor" | "supervisor";

export type AgentIdentity = {
  role: AgentRole;
  name: string;
  title: string;
  principles: string[];
  personality: string;
  capabilities: string[];
  limitations: string[];
};

export type AnalystMemory = {
  lastRunDate: string | null;
  runCount: number;
  employeeRiskHistory: Record<string, Array<{ date: string; score: number; bucket: RiskBucket }>>;
  thresholdAdjustments: Array<{ date: string; field: string; oldValue: number; newValue: number; reason: string }>;
  trendPatternsDetected: Array<{ employeeId: string; pattern: string; detectedDate: string; stillActive: boolean }>;
  scoringConfidence: number;
  notes: string[];
};

export type ExecutorMemory = {
  lastRunDate: string | null;
  runCount: number;
  toolsInvokedTotal: number;
  artifactsDeliveredTotal: number;
  followUpsCompleted: number;
  followUpsMissed: number;
  deliveryLog: Array<{ date: string; employeeId: string; artifactType: string; status: "delivered" | "failed" | "pending" }>;
  toolPerformance: Record<string, { invoked: number; successRate: number }>;
  notes: string[];
};

export type SupervisorMemory = {
  lastRunDate: string | null;
  runCount: number;
  anomaliesSeen: Array<{ date: string; code: string; severity: string; resolved: boolean }>;
  orgHealthTrend: Array<{ date: string; score: number; status: string }>;
  escalationLog: Array<{ date: string; employeeId: string; reason: string; outcome: string }>;
  agentPerformance: {
    analyst: { runs: number; avgConfidence: number };
    executor: { runs: number; deliveryRate: number };
  };
  notes: string[];
};

export type AgentMemoryMap = {
  analyst: AnalystMemory;
  executor: ExecutorMemory;
  supervisor: SupervisorMemory;
};

export type SupervisorAnomaly = {
  severity: "info" | "warning" | "critical";
  code: string;
  message: string;
  affectedEmployees: string[];
};

export type OrgHealthAssessment = {
  status: "healthy" | "attention" | "critical";
  score: number;
  anomalies: SupervisorAnomaly[];
  recommendation: string;
};

export type AnalystOutput = {
  identity: AgentIdentity;
  memory: AnalystMemory;
  employeeDetails: EmployeeLoopDetail[];
  orgSummary: OrgSummary;
  monthlyTrendOrgSummary: MediaryLoopOutput["monthlyTrendOrgSummary"];
  monthlyTrendByEmployee: MediaryLoopOutput["monthlyTrendByEmployee"];
  teamHeatmap: TeamHeatmapItem[];
  interventionQueue: InterventionQueueItem[];
  hrMemo: string;
  impactSimulation: MediaryLoopOutput["impactSimulation"];
};

export type ExecutorOutput = {
  identity: AgentIdentity;
  memory: ExecutorMemory;
  toolInvocations: ToolInvocation[];
  actionArtifacts: ActionArtifact[];
  followUpTasks: FollowUpTask[];
  runLedger: RunLedger;
};

export type SupervisorOutput = {
  identity: AgentIdentity;
  memory: SupervisorMemory;
  orgHealth: OrgHealthAssessment;
  executionTrace: ExecutionTraceStep[];
  loopReport: {
    analystSummary: string;
    executorSummary: string;
    supervisorSummary: string;
  };
};

export type ExecutionTraceStep = {
  step: number;
  phase: ExecutionPhase;
  name: string;
  status: "completed";
  output: string;
};

export type MediaryLoopInput = {
  employeeId?: string;
  selfAssessmentAnswers?: SelfAssessmentAnswer[];
  scenario?: DemoScenario;
};

export type DemoScenario = "baseline" | "sustained-high";

export type InterventionRoute =
  | "Low: no action or monitor"
  | "Medium: employee nudge"
  | "High: employee nudge + manager brief"
  | "Sustained High: HR Ops queue";

export type EmployeeLoopDetail = {
  employee: Employee;
  scoring: ScoringResult;
  monthlyTrend: MonthlyTrendSummary;
  analyzer: AnalyzerOutput;
  diplomat: WorkflowDiplomatOutput;
  route: InterventionRoute;
};

export type OrgSummary = {
  totalEmployees: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  sustainedHighCount: number;
  avgRiskScore: number;
};

export type TeamHeatmapItem = {
  team: string;
  avgRiskScore: number;
  riskBucket: RiskBucket;
  employeeCount: number;
  highRiskMembers: number;
};

export type InterventionQueueItem = {
  employeeId: string;
  employeeName: string;
  team: string;
  riskScore: number;
  riskBucket: RiskBucket;
  previousWeekRiskScore?: number;
  previousWeekRiskBucket?: RiskBucket;
  route: InterventionRoute;
  nextStep: string;
  decisionRationale: string;
  consideredAlternatives: string[];
  actionArtifact: string;
  followUpCadence: string;
};

export type ToolInvocation = {
  id: string;
  tool:
    | "EMPLOYEE_NUDGE_TOOL"
    | "MANAGER_BRIEF_TOOL"
    | "HR_OPS_CASE_TOOL"
    | "FOCUS_BLOCK_PLANNER"
    | "FOLLOW_UP_SCHEDULER";
  targetEmployeeId: string;
  targetEmployeeName: string;
  route: InterventionRoute;
  status: "executed";
  summary: string;
};

export type ActionArtifact = {
  id: string;
  type:
    | "employee_nudge"
    | "manager_brief"
    | "hr_ops_case"
    | "focus_block_plan";
  employeeId: string;
  employeeName: string;
  owner: "Employee" | "Manager" | "HR Ops";
  title: string;
  body: string;
};

export type FollowUpTask = {
  id: string;
  employeeId: string;
  employeeName: string;
  owner: "Employee" | "Manager" | "HR Ops";
  dueIn: "48 hours" | "3 working days" | "7 days";
  trigger: string;
  task: string;
  status: "queued";
};

export type RunLedger = {
  runId: string;
  scenario: DemoScenario;
  startedAt: string;
  completedAt: string;
  employeesAnalyzed: number;
  decisionsMade: number;
  toolsExecuted: number;
  actionArtifactsCreated: number;
  followUpsQueued: number;
};

export type MediaryLoopOutput = {
  scenario: DemoScenario;
  orgSummary: OrgSummary;
  monthlyTrendOrgSummary: {
    worseningCount: number;
    improvingCount: number;
    sustainedPatternCount: number;
  };
  monthlyTrendByEmployee: Record<string, MonthlyTrendSummary>;
  teamHeatmap: TeamHeatmapItem[];
  interventionQueue: InterventionQueueItem[];
  hrMemo: string;
  impactSimulation: {
    projectedMeetingHoursReduced: number;
    projectedFocusHoursGained: number;
    before: {
      avgRiskScore: number;
      highRiskCount: number;
      sustainedHighCount: number;
      interventionQueueCount: number;
    };
    after: {
      projectedAvgRiskScore: number;
      projectedHighRiskCount: number;
      projectedSustainedHighCount: number;
      projectedInterventionQueueCount: number;
    };
    assumptions: string[];
  };
  selectedEmployeeDetail: EmployeeLoopDetail;
  toolInvocations: ToolInvocation[];
  actionArtifacts: ActionArtifact[];
  followUpTasks: FollowUpTask[];
  runLedger: RunLedger;
  orgHealth: OrgHealthAssessment;
  executionTrace: ExecutionTraceStep[];
  workflowStatus: "Autonomous org-wide workload diplomacy loop completed";
};
