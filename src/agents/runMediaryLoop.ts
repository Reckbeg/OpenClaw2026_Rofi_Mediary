import { runAnalystAgent } from "@/src/agents/analystAgent";
import { runAnalyzerAgent } from "@/src/agents/analyzerAgent";
import { runExecutorAgent } from "@/src/agents/executorAgent";
import { runSupervisorAgent } from "@/src/agents/supervisorAgent";
import { runWorkflowDiplomatAgent } from "@/src/agents/workflowDiplomatAgent";
import { defaultEmployeeId, getScenarioWeeklyHistory, sampleOrgDataset } from "@/src/data/sampleOrg";
import { calculateCalendarMetrics } from "@/src/modules/metrics/calendarMetrics";
import {
  calculateEnergyStrainScore,
  defaultSelfAssessmentAnswers,
} from "@/src/modules/scoring/selfAssessment";
import { computeRiskScore } from "@/src/modules/scoring/riskScore";
import type {
  ActionArtifact,
  DemoScenario,
  EmployeeLoopDetail,
  ExecutionTraceStep,
  FollowUpTask,
  InterventionQueueItem,
  InterventionRoute,
  MediaryLoopInput,
  MediaryLoopOutput,
  MonthlyTrendSummary,
  RiskBucket,
  RunLedger,
  SelfAssessmentAnswer,
  TeamHeatmapItem,
  ToolInvocation,
  WeeklyRiskSnapshot,
} from "@/src/types/mediary";

function buildExecutionTrace({
  scenario,
  totalEmployees,
  teamCount,
  queueCount,
  routeCounts,
}: {
  scenario: DemoScenario;
  totalEmployees: number;
  teamCount: number;
  queueCount: number;
  routeCounts: {
    hrOps: number;
    managerBrief: number;
    employeeNudges: number;
    monitorOnly: number;
  };
}): ExecutionTraceStep[] {
  return [
    {
      step: 1,
      phase: "observe",
      name: "Observe org dataset",
      status: "completed",
      output: `Loaded deterministic org dataset with ${totalEmployees} employees and weekly calendars using the "${scenario}" scenario profile.`,
    },
    {
      step: 2,
      phase: "reason",
      name: "Calculate employee metrics",
      status: "completed",
      output:
        "Computed weekly meeting load, meeting ratio, back-to-back days, after-hours meetings, focus estimate, and energy strain for each employee.",
    },
    {
      step: 3,
      phase: "reason",
      name: "Aggregate team risk",
      status: "completed",
      output: `Compared 8-week workload trend and detected sustained overload patterns, then aggregated team heatmap across ${teamCount} teams with risk buckets and average risk scores.`,
    },
    {
      step: 4,
      phase: "decide",
      name: "Route interventions",
      status: "completed",
      output: `Applied routing policy with evidence from current risk, previous-week context, and 8-week trend. Routes: HR Ops=${routeCounts.hrOps}, manager brief=${routeCounts.managerBrief}, employee nudges=${routeCounts.employeeNudges}, monitor-only=${routeCounts.monitorOnly}.`,
    },
    {
      step: 5,
      phase: "execute",
      name: "Generate stakeholder messages",
      status: "completed",
      output: "Executed internal action adapters and created stakeholder-specific action artifacts.",
    },
    {
      step: 6,
      phase: "follow-up",
      name: "Follow-up plan",
      status: "completed",
      output:
        "Queued follow-up tasks by route: 48-hour HR Ops review for sustained-high, 3-working-day manager review for high, 7-day employee follow-up for medium.",
    },
  ];
}

function resolveRoute(
  riskBucket: RiskBucket,
  isSustainedHigh: boolean,
): InterventionRoute {
  if (isSustainedHigh) {
    return "Sustained High: HR Ops queue";
  }
  if (riskBucket === "High") return "High: employee nudge + manager brief";
  if (riskBucket === "Medium") return "Medium: employee nudge";
  return "Low: no action or monitor";
}

function isSustainedHighSignal({
  riskBucket,
  calendarOverloadRisk,
  afterHoursMeetings,
  backToBackDays,
  meetingRatio,
}: {
  riskBucket: RiskBucket;
  calendarOverloadRisk: number;
  afterHoursMeetings: number;
  backToBackDays: number;
  meetingRatio: number;
}): boolean {
  if (riskBucket !== "High") return false;
  return (
    calendarOverloadRisk >= 72 ||
    (afterHoursMeetings >= 2 && backToBackDays >= 4) ||
    (meetingRatio >= 0.5 && backToBackDays >= 4)
  );
}

function getMonthlyTrendSummary(
  employeeId: string,
  weeklyHistory: WeeklyRiskSnapshot[],
): MonthlyTrendSummary {
  if (weeklyHistory.length === 0) {
    return {
      employeeId,
      trendDirection: "stable",
      highRiskWeeks: 0,
      mediumOrHighWeeks: 0,
      riskDelta: 0,
      sustainedPatternDetected: false,
      summary: "No monthly workload history available yet.",
    };
  }

  const highRiskWeeks = weeklyHistory.filter((week) => week.riskBucket === "High").length;
  const mediumOrHighWeeks = weeklyHistory.filter((week) => week.riskBucket !== "Low").length;
  const firstRisk = weeklyHistory[0].riskScore;
  const lastRisk = weeklyHistory[weeklyHistory.length - 1].riskScore;
  const riskDelta = lastRisk - firstRisk;
  const trendDirection: MonthlyTrendSummary["trendDirection"] =
    riskDelta >= 6 ? "worsening" : riskDelta <= -6 ? "improving" : "stable";
  const sustainedPatternDetected =
    highRiskWeeks >= 2 || (mediumOrHighWeeks >= 4 && trendDirection === "worsening");

  const summary =
    trendDirection === "worsening"
      ? `Risk trend worsened by ${riskDelta} points over 8 weeks, with ${highRiskWeeks} high-risk week(s).`
      : trendDirection === "improving"
        ? `Risk trend improved by ${Math.abs(riskDelta)} points over 8 weeks, with ${highRiskWeeks} high-risk week(s).`
        : `Risk trend stayed stable over 8 weeks, with ${highRiskWeeks} high-risk week(s).`;

  return {
    employeeId,
    trendDirection,
    highRiskWeeks,
    mediumOrHighWeeks,
    riskDelta,
    sustainedPatternDetected,
    summary,
  };
}

function getAnswersForEmployee(index: number, providedAnswers?: SelfAssessmentAnswer[]): SelfAssessmentAnswer[] {
  if (providedAnswers?.length) return providedAnswers;
  const offset = (index % 3) - 1;
  return defaultSelfAssessmentAnswers.map((answer, answerIndex) => {
    const directionalShift = answerIndex % 2 === 0 ? offset : -offset;
    return {
      ...answer,
      score: Math.min(5, Math.max(1, answer.score + directionalShift)),
    };
  });
}

function getScenarioAdjustedAnswers({
  employeeId,
  baseAnswers,
  scenario,
}: {
  employeeId: string;
  baseAnswers: SelfAssessmentAnswer[];
  scenario: DemoScenario;
}): SelfAssessmentAnswer[] {
  if (scenario !== "sustained-high") {
    return baseAnswers;
  }

  const sustainedHighProfiles = new Set(["alex-johnson", "olivia-clark"]);
  if (!sustainedHighProfiles.has(employeeId)) {
    return baseAnswers;
  }

  return baseAnswers.map((answer) => {
    if (answer.questionId === "emotionally-drained" || answer.questionId === "meeting-overload") {
      return { ...answer, score: 5 };
    }
    if (answer.questionId === "personal-energy" || answer.questionId === "focus-capacity") {
      return { ...answer, score: 1 };
    }
    return { ...answer, score: 2 };
  });
}

function getScenarioAdjustedMetrics({
  employeeId,
  metrics,
  scenario,
}: {
  employeeId: string;
  metrics: ReturnType<typeof calculateCalendarMetrics>;
  scenario: DemoScenario;
}) {
  if (scenario !== "sustained-high") {
    return metrics;
  }

  const sustainedHighProfiles = new Set(["alex-johnson", "olivia-clark"]);
  if (!sustainedHighProfiles.has(employeeId)) {
    return metrics;
  }

  return {
    weeklyMeetingHours: Math.max(metrics.weeklyMeetingHours, 27),
    meetingRatio: Math.max(metrics.meetingRatio, 0.68),
    backToBackDays: Math.max(metrics.backToBackDays, 5),
    afterHoursMeetings: Math.max(metrics.afterHoursMeetings, 3),
    estimatedFocusHours: Math.min(metrics.estimatedFocusHours, 7),
  };
}

function strongestDriverNextStep(detail: EmployeeLoopDetail): string {
  const strongestDriver = detail.scoring.topDrivers[0]?.toLowerCase() ?? "";
  const metrics = detail.scoring.calendarMetrics;
  const calendarSignals = [
    { key: "after-hours", score: metrics.afterHoursMeetings * 25 },
    { key: "meeting load", score: metrics.meetingRatio * 100 },
    { key: "back-to-back", score: (metrics.backToBackDays / 5) * 100 },
    { key: "focus", score: ((24 - metrics.estimatedFocusHours) / 24) * 100 },
  ].sort((a, b) => b.score - a.score);

  if (strongestDriver.includes("after-hours")) {
    return "Reset late-day meeting boundaries and move external coordination into core hours.";
  }
  if (strongestDriver.includes("back-to-back")) {
    return "Insert protected recovery/focus buffers between dense meeting blocks this week.";
  }
  if (strongestDriver.includes("focus")) {
    return "Block two deep-work windows and pause non-critical meeting requests during those windows.";
  }
  if (strongestDriver.includes("meeting load")) {
    return "Trim recurring meeting duration and convert one status sync into an async update.";
  }
  if (strongestDriver.includes("self-assessment")) {
    const strongestCalendar = calendarSignals[0]?.key;
    if (strongestCalendar === "after-hours") {
      return "Run an employee check-in and shift late-day work into core collaboration hours.";
    }
    if (strongestCalendar === "meeting load") {
      return "Run an employee check-in and trim recurring coordination load for the next cycle.";
    }
    if (strongestCalendar === "back-to-back") {
      return "Run an employee check-in and add recovery buffers between meetings this week.";
    }
    return "Run an employee check-in and protect deep-work focus blocks for the next cycle.";
  }
  return "Monitor trend and keep the current intervention plan in place.";
}

function toQueueItem(detail: EmployeeLoopDetail): InterventionQueueItem {
  const previousWeekRiskScore = getPreviousWeekRiskScore(detail);
  const previousWeekRiskBucket = getRiskBucket(previousWeekRiskScore);
  const previousWeekContext =
    detail.route === "Sustained High: HR Ops queue"
      ? ` Previous week context: ${previousWeekRiskScore}/100 ${previousWeekRiskBucket}.`
      : "";
  const nextStep =
    detail.route === "Sustained High: HR Ops queue"
      ? `${strongestDriverNextStep(detail)} Escalate to HR Ops case handling with manager brief in this cycle.${previousWeekContext}`
      : detail.route === "High: employee nudge + manager brief"
        ? `${strongestDriverNextStep(detail)} Send employee nudge and manager summary this week.`
        : detail.route === "Medium: employee nudge"
          ? `${strongestDriverNextStep(detail)} Send employee nudge with focused plan this week.`
          : "Monitor next run unless trend worsens.";
  const decisionRationale =
    detail.route === "Sustained High: HR Ops queue"
      ? `Current risk is ${detail.scoring.overallRiskScore}/100 High, previous week context is ${previousWeekRiskScore}/100 ${previousWeekRiskBucket}, and the 8-week trend is ${detail.monthlyTrend.trendDirection} with sustained overload signals.`
      : detail.route === "High: employee nudge + manager brief"
        ? `Current risk remains high at ${detail.scoring.overallRiskScore}/100, with elevated weekly load signals and trend pressure requiring manager alignment this cycle.`
        : detail.route === "Medium: employee nudge"
          ? `Current risk is medium at ${detail.scoring.overallRiskScore}/100 with manageable strain signals, so employee-level operational adjustments are prioritized first.`
          : `Current risk is low and stable, so monitor-only handling is appropriate for this cycle.`;
  const consideredAlternatives =
    detail.route === "Sustained High: HR Ops queue"
      ? [
          "High: employee nudge + manager brief",
          "Medium: employee nudge",
          "Low: no action or monitor",
        ]
      : detail.route === "High: employee nudge + manager brief"
        ? [
            "Sustained High: HR Ops queue",
            "Medium: employee nudge",
            "Low: no action or monitor",
          ]
        : detail.route === "Medium: employee nudge"
          ? [
              "High: employee nudge + manager brief",
              "Low: no action or monitor",
              "Sustained High: HR Ops queue",
            ]
          : [
              "Medium: employee nudge",
              "High: employee nudge + manager brief",
              "Sustained High: HR Ops queue",
            ];
  const actionArtifact =
    detail.route === "Sustained High: HR Ops queue"
      ? "HR Ops escalation packet with manager brief, workload trend snapshot, and action checklist."
      : detail.route === "High: employee nudge + manager brief"
        ? "Manager alignment packet with employee nudge, meeting-load adjustments, and progress checklist."
        : detail.route === "Medium: employee nudge"
          ? "Employee nudge packet with focused scheduling actions and one-week checkpoint."
          : "Monitor memo with weekly trend watchlist.";
  const followUpCadence =
    detail.route === "Sustained High: HR Ops queue"
      ? "48-hour follow-up, then weekly until risk returns below sustained-high threshold."
      : detail.route === "High: employee nudge + manager brief"
        ? "3 business-day manager checkpoint, then weekly follow-up."
        : detail.route === "Medium: employee nudge"
          ? "7-day follow-up in next cycle."
          : "Weekly monitor cadence.";

  return {
    employeeId: detail.employee.id,
    employeeName: detail.employee.name,
    team: detail.employee.team,
    riskScore: detail.scoring.overallRiskScore,
    riskBucket: detail.scoring.riskBucket,
    previousWeekRiskScore,
    previousWeekRiskBucket,
    route: detail.route,
    nextStep,
    decisionRationale,
    consideredAlternatives,
    actionArtifact,
    followUpCadence,
  };
}

function buildToolInvocations(queue: InterventionQueueItem[]): ToolInvocation[] {
  const invocations: ToolInvocation[] = [];
  queue.forEach((item) => {
    const pushTool = (tool: ToolInvocation["tool"], summary: string) => {
      invocations.push({
        id: `tool-${invocations.length + 1}`,
        tool,
        targetEmployeeId: item.employeeId,
        targetEmployeeName: item.employeeName,
        route: item.route,
        status: "executed",
        summary,
      });
    };

    if (item.route === "Medium: employee nudge") {
      pushTool("EMPLOYEE_NUDGE_TOOL", "Prepared employee nudge action draft and execution checklist.");
      return;
    }
    if (item.route === "High: employee nudge + manager brief") {
      pushTool("EMPLOYEE_NUDGE_TOOL", "Prepared employee nudge action draft and execution checklist.");
      pushTool("MANAGER_BRIEF_TOOL", "Prepared manager brief with route rationale and next-step expectations.");
      pushTool("FOCUS_BLOCK_PLANNER", "Prepared focus-block plan for meeting density reduction.");
      return;
    }
    if (item.route === "Sustained High: HR Ops queue") {
      pushTool("HR_OPS_CASE_TOOL", "Prepared HR Ops case packet with sustained-load evidence.");
      pushTool("MANAGER_BRIEF_TOOL", "Prepared manager brief with sustained-load route rationale.");
      pushTool("FOCUS_BLOCK_PLANNER", "Prepared focus-block plan for recovery and workload stabilization.");
      pushTool("FOLLOW_UP_SCHEDULER", "Prepared deterministic follow-up schedule for HR Ops review.");
      return;
    }
    pushTool("FOLLOW_UP_SCHEDULER", "Prepared monitor-only weekly review task.");
  });

  return invocations;
}

function buildActionArtifacts(queue: InterventionQueueItem[]): ActionArtifact[] {
  const artifacts: ActionArtifact[] = [];
  const pushArtifact = (
    item: InterventionQueueItem,
    type: ActionArtifact["type"],
    owner: ActionArtifact["owner"],
    title: string,
    body: string,
  ) => {
    artifacts.push({
      id: `artifact-${artifacts.length + 1}`,
      type,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      owner,
      title,
      body,
    });
  };

  queue.forEach((item) => {
    if (item.route === "Medium: employee nudge") {
      pushArtifact(
        item,
        "employee_nudge",
        "Employee",
        `Employee nudge for ${item.employeeName}`,
        item.nextStep,
      );
      return;
    }
    if (item.route === "High: employee nudge + manager brief") {
      pushArtifact(
        item,
        "employee_nudge",
        "Employee",
        `Employee nudge for ${item.employeeName}`,
        item.nextStep,
      );
      pushArtifact(
        item,
        "manager_brief",
        "Manager",
        `Manager brief for ${item.employeeName}`,
        `${item.decisionRationale} Follow-up cadence: ${item.followUpCadence}`,
      );
      pushArtifact(
        item,
        "focus_block_plan",
        "Manager",
        `Focus block plan for ${item.employeeName}`,
        "Protect two deterministic deep-work windows and reduce dense meeting clusters this cycle.",
      );
      return;
    }
    if (item.route === "Sustained High: HR Ops queue") {
      pushArtifact(
        item,
        "hr_ops_case",
        "HR Ops",
        `HR Ops case for ${item.employeeName}`,
        `${item.decisionRationale} ${item.nextStep}`,
      );
      pushArtifact(
        item,
        "manager_brief",
        "Manager",
        `Manager brief for ${item.employeeName}`,
        `${item.decisionRationale} Follow-up cadence: ${item.followUpCadence}`,
      );
      pushArtifact(
        item,
        "focus_block_plan",
        "HR Ops",
        `Focus block plan for ${item.employeeName}`,
        "Protect deterministic recovery and focus blocks while reducing recurring meeting pressure.",
      );
      return;
    }
    pushArtifact(
      item,
      "employee_nudge",
      "Employee",
      `Monitor memo for ${item.employeeName}`,
      "Maintain current operating pattern and reassess at next cycle.",
    );
  });

  return artifacts;
}

function buildFollowUpTasks(queue: InterventionQueueItem[]): FollowUpTask[] {
  return queue.map((item, index) => {
    if (item.route === "Sustained High: HR Ops queue") {
      return {
        id: `follow-up-${index + 1}`,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        owner: "HR Ops",
        dueIn: "48 hours",
        trigger: "Sustained high route with multi-week overload evidence.",
        task: "Review HR Ops case packet, confirm manager alignment, and validate focus-block execution.",
        status: "queued",
      };
    }
    if (item.route === "High: employee nudge + manager brief") {
      return {
        id: `follow-up-${index + 1}`,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        owner: "Manager",
        dueIn: "3 working days",
        trigger: "High route requiring manager brief and execution check.",
        task: "Check action artifact adoption and confirm meeting-load reduction progress.",
        status: "queued",
      };
    }
    return {
      id: `follow-up-${index + 1}`,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      owner: "Employee",
      dueIn: "7 days",
      trigger: "Medium route employee nudge checkpoint.",
      task: "Review nudge actions and report next-cycle coordination and focus improvements.",
      status: "queued",
    };
  });
}

function buildRunLedger({
  scenario,
  employeeDetails,
  queue,
  toolInvocations,
  actionArtifacts,
  followUpTasks,
}: {
  scenario: DemoScenario;
  employeeDetails: EmployeeLoopDetail[];
  queue: InterventionQueueItem[];
  toolInvocations: ToolInvocation[];
  actionArtifacts: ActionArtifact[];
  followUpTasks: FollowUpTask[];
}): RunLedger {
  return {
    runId: `run-${scenario}-${employeeDetails.length}-${queue.length}`,
    scenario,
    startedAt: "2026-05-15T09:00:00.000Z",
    completedAt: "2026-05-15T09:00:06.000Z",
    employeesAnalyzed: employeeDetails.length,
    decisionsMade: queue.length,
    toolsExecuted: toolInvocations.length,
    actionArtifactsCreated: actionArtifacts.length,
    followUpsQueued: followUpTasks.length,
  };
}

function getRiskBucket(score: number): RiskBucket {
  if (score >= 80) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function getPreviousWeekRiskScore(detail: EmployeeLoopDetail): number {
  if (detail.route === "Sustained High: HR Ops queue") {
    return Math.max(80, detail.scoring.overallRiskScore - 5);
  }
  if (detail.scoring.riskBucket === "Medium") {
    const offset = detail.employee.id.length % 2 === 0 ? 1 : -2;
    return clampScore(detail.scoring.overallRiskScore + offset);
  }
  if (detail.scoring.riskBucket === "High") {
    return clampScore(detail.scoring.overallRiskScore - 3);
  }
  return clampScore(detail.scoring.overallRiskScore - 1);
}

function toHeatmap(details: EmployeeLoopDetail[]): TeamHeatmapItem[] {
  const grouped = new Map<string, EmployeeLoopDetail[]>();
  details.forEach((detail) => {
    const list = grouped.get(detail.employee.team) ?? [];
    list.push(detail);
    grouped.set(detail.employee.team, list);
  });

  return Array.from(grouped.entries())
    .map(([team, teamMembers]) => {
      const avgRiskScore = Math.round(
        teamMembers.reduce((sum, member) => sum + member.scoring.overallRiskScore, 0) / teamMembers.length,
      );
      const highRiskMembers = teamMembers.filter((member) => member.scoring.riskBucket === "High").length;
      const riskBucket: RiskBucket = avgRiskScore >= 80 ? "High" : avgRiskScore >= 40 ? "Medium" : "Low";
      return {
        team,
        avgRiskScore,
        riskBucket,
        employeeCount: teamMembers.length,
        highRiskMembers,
      };
    })
    .sort((a, b) => b.avgRiskScore - a.avgRiskScore);
}

function buildHrMemo(
  summary: MediaryLoopOutput["orgSummary"],
  queue: InterventionQueueItem[],
  monthlyTrendOrgSummary: MediaryLoopOutput["monthlyTrendOrgSummary"],
): string {
  const urgentCount = queue.filter((item) => item.route === "Sustained High: HR Ops queue").length;
  const sustainedTrendLine =
    monthlyTrendOrgSummary.sustainedPatternCount > 0
      ? `${monthlyTrendOrgSummary.sustainedPatternCount} employees show sustained overload across the 8-week trend and are routed to HR Ops.`
      : "No employees show sustained overload across the 8-week trend.";
  const followThroughLine =
    summary.highRiskCount > 0
      ? "Continue weekly monitoring with manager follow-through on medium and high routes."
      : "Continue weekly monitoring with employee nudges on medium routes.";
  return `Org-wide run completed for ${summary.totalEmployees} employees. Current mix: ${summary.lowRiskCount} low, ${summary.mediumRiskCount} medium, ${summary.highRiskCount} high, with ${summary.sustainedHighCount} sustained-high profiles. ${urgentCount > 0 ? `${urgentCount} employees are routed directly to HR Ops queue.` : "No employees currently require HR Ops escalation."} ${sustainedTrendLine} ${followThroughLine}`;
}

function buildImpactSimulation({
  summary,
  queue,
}: {
  summary: MediaryLoopOutput["orgSummary"];
  queue: InterventionQueueItem[];
}): MediaryLoopOutput["impactSimulation"] {
  const projectedMeetingHoursReduced = Math.round(queue.length * 0.4 + summary.sustainedHighCount * 1.5);
  const projectedFocusHoursGained = Math.round(projectedMeetingHoursReduced * 0.8);
  const riskReductionPoints = Math.round(queue.length * 0.8 + summary.sustainedHighCount * 2);
  const projectedAvgRiskScore = Math.max(0, summary.avgRiskScore - riskReductionPoints);
  const projectedHighRiskCount = Math.max(0, summary.highRiskCount - Math.ceil(summary.highRiskCount * 0.4));
  const projectedSustainedHighCount = Math.max(
    0,
    summary.sustainedHighCount - Math.ceil(summary.sustainedHighCount * 0.5),
  );
  const projectedInterventionQueueCount = Math.max(
    0,
    queue.length - Math.ceil(queue.length * 0.35),
  );

  return {
    projectedMeetingHoursReduced,
    projectedFocusHoursGained,
    before: {
      avgRiskScore: summary.avgRiskScore,
      highRiskCount: summary.highRiskCount,
      sustainedHighCount: summary.sustainedHighCount,
      interventionQueueCount: queue.length,
    },
    after: {
      projectedAvgRiskScore,
      projectedHighRiskCount,
      projectedSustainedHighCount,
      projectedInterventionQueueCount,
    },
    assumptions: [
      "One-week projection assumes intervention adherence for routed employees.",
      "Medium route lowers projected risk by operational nudges and meeting hygiene.",
      "High and sustained-high routes include manager briefing and tighter follow-up cadence.",
    ],
  };
}

export function runOrgMediaryLoop(input: MediaryLoopInput = {}): MediaryLoopOutput {
  const scenario: DemoScenario = input.scenario ?? "baseline";

  // ── Agent 1: Analyst (pure reasoning, no side effects) ──
  const analyst = runAnalystAgent(input);

  // ── Agent 2: Executor (tool invocations, artifacts, follow-up tasks) ──
  const executor = runExecutorAgent(analyst, scenario);

  // ── Agent 3: Supervisor (anomaly detection, org health, execution trace) ──
  const supervisor = runSupervisorAgent(analyst, executor, scenario);

  const selectedEmployeeDetail =
    analyst.employeeDetails.find((detail) => detail.employee.id === defaultEmployeeId) ?? analyst.employeeDetails[0];

  return {
    scenario,
    orgSummary: analyst.orgSummary,
    monthlyTrendOrgSummary: analyst.monthlyTrendOrgSummary,
    monthlyTrendByEmployee: analyst.monthlyTrendByEmployee,
    teamHeatmap: analyst.teamHeatmap,
    interventionQueue: analyst.interventionQueue,
    hrMemo: analyst.hrMemo,
    impactSimulation: analyst.impactSimulation,
    selectedEmployeeDetail,
    toolInvocations: executor.toolInvocations,
    actionArtifacts: executor.actionArtifacts,
    followUpTasks: executor.followUpTasks,
    runLedger: executor.runLedger,
    orgHealth: supervisor.orgHealth,
    executionTrace: supervisor.executionTrace,
    workflowStatus: "Autonomous org-wide workload diplomacy loop completed",
  };
}

export function runMediaryLoop(input: MediaryLoopInput = {}): MediaryLoopOutput {
  return runOrgMediaryLoop(input);
}
