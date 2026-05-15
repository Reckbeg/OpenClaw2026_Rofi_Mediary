import { runAnalyzerAgent } from "@/src/agents/analyzerAgent";
import { runWorkflowDiplomatAgent } from "@/src/agents/workflowDiplomatAgent";
import { defaultEmployeeId, sampleOrgDataset } from "@/src/data/sampleOrg";
import { calculateCalendarMetrics } from "@/src/modules/metrics/calendarMetrics";
import {
  calculateEnergyStrainScore,
  defaultSelfAssessmentAnswers,
} from "@/src/modules/scoring/selfAssessment";
import { computeRiskScore } from "@/src/modules/scoring/riskScore";
import type {
  DemoScenario,
  EmployeeLoopDetail,
  ExecutionTraceStep,
  InterventionQueueItem,
  InterventionRoute,
  MediaryLoopInput,
  MediaryLoopOutput,
  RiskBucket,
  SelfAssessmentAnswer,
  TeamHeatmapItem,
} from "@/src/types/mediary";

function buildExecutionTrace({
  scenario,
  totalEmployees,
  teamCount,
  queueCount,
}: {
  scenario: DemoScenario;
  totalEmployees: number;
  teamCount: number;
  queueCount: number;
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
      output: `Aggregated team heatmap across ${teamCount} teams with risk buckets and average risk scores.`,
    },
    {
      step: 4,
      phase: "decide",
      name: "Route interventions",
      status: "completed",
      output:
        "Applied routing policy: Low=monitor, Medium=employee nudge, High=employee nudge + manager brief, Sustained High=HR Ops queue.",
    },
    {
      step: 5,
      phase: "execute",
      name: "Generate stakeholder messages",
      status: "completed",
      output: `Generated diplomatic messages and intervention queue entries for ${queueCount} routed employees.`,
    },
    {
      step: 6,
      phase: "follow-up",
      name: "Follow-up plan",
      status: "completed",
      output:
        "Scheduled deterministic weekly reassessment and trend comparison for all employees in the org dataset.",
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
  const nextStep =
    detail.route === "Sustained High: HR Ops queue"
      ? `${strongestDriverNextStep(detail)} Escalate to HR Ops case handling with manager brief in this cycle.`
      : detail.route === "High: employee nudge + manager brief"
        ? `${strongestDriverNextStep(detail)} Send employee nudge and manager summary this week.`
        : detail.route === "Medium: employee nudge"
          ? `${strongestDriverNextStep(detail)} Send employee nudge with focused plan this week.`
          : "Monitor next run unless trend worsens.";

  return {
    employeeId: detail.employee.id,
    employeeName: detail.employee.name,
    team: detail.employee.team,
    riskScore: detail.scoring.overallRiskScore,
    riskBucket: detail.scoring.riskBucket,
    route: detail.route,
    nextStep,
  };
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

function buildHrMemo(summary: MediaryLoopOutput["orgSummary"], queue: InterventionQueueItem[]): string {
  const urgentCount = queue.filter((item) => item.route === "Sustained High: HR Ops queue").length;
  const followThroughLine =
    summary.highRiskCount > 0
      ? "Continue weekly monitoring with manager follow-through on medium and high routes."
      : "Continue weekly monitoring with employee nudges on medium routes.";
  return `Org-wide run completed for ${summary.totalEmployees} employees. Current mix: ${summary.lowRiskCount} low, ${summary.mediumRiskCount} medium, ${summary.highRiskCount} high, with ${summary.sustainedHighCount} sustained-high profiles. ${urgentCount > 0 ? `${urgentCount} employees are routed directly to HR Ops queue.` : "No employees currently require HR Ops escalation."} ${followThroughLine}`;
}

function buildImpactSimulation({
  summary,
  queue,
}: {
  summary: MediaryLoopOutput["orgSummary"];
  queue: InterventionQueueItem[];
}): MediaryLoopOutput["impactSimulation"] {
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
  const employeeDetails: EmployeeLoopDetail[] = sampleOrgDataset.employees.map((employee, index) => {
    const events = sampleOrgDataset.calendarsByEmployee[employee.id] ?? [];
    const baselineAnswers = getAnswersForEmployee(index, input.selfAssessmentAnswers);
    const answers = getScenarioAdjustedAnswers({
      employeeId: employee.id,
      baseAnswers: baselineAnswers,
      scenario,
    });
    const baselineMetrics = calculateCalendarMetrics(events);
    const metrics = getScenarioAdjustedMetrics({
      employeeId: employee.id,
      metrics: baselineMetrics,
      scenario,
    });
    const selfAssessmentScore = calculateEnergyStrainScore(answers);
    const scoring = computeRiskScore(metrics, selfAssessmentScore);
    const analyzer = runAnalyzerAgent(scoring, events);
    const diplomat = runWorkflowDiplomatAgent(analyzer, scoring);
    const sustainedHigh = isSustainedHighSignal({
      riskBucket: scoring.riskBucket,
      calendarOverloadRisk: scoring.calendarOverloadRisk,
      afterHoursMeetings: scoring.calendarMetrics.afterHoursMeetings,
      backToBackDays: scoring.calendarMetrics.backToBackDays,
      meetingRatio: scoring.calendarMetrics.meetingRatio,
    });
    const route = resolveRoute(scoring.riskBucket, sustainedHigh);

    return { employee, scoring, analyzer, diplomat, route };
  });

  const selectedEmployeeDetail =
    employeeDetails.find((detail) => detail.employee.id === defaultEmployeeId) ?? employeeDetails[0];

  const lowRiskCount = employeeDetails.filter((detail) => detail.scoring.riskBucket === "Low").length;
  const mediumRiskCount = employeeDetails.filter((detail) => detail.scoring.riskBucket === "Medium").length;
  const highRiskCount = employeeDetails.filter((detail) => detail.scoring.riskBucket === "High").length;
  const sustainedHighCount = employeeDetails.filter(
    (detail) => detail.route === "Sustained High: HR Ops queue",
  ).length;

  const orgSummary: MediaryLoopOutput["orgSummary"] = {
    totalEmployees: employeeDetails.length,
    lowRiskCount,
    mediumRiskCount,
    highRiskCount,
    sustainedHighCount,
    avgRiskScore: Math.round(
      employeeDetails.reduce((sum, detail) => sum + detail.scoring.overallRiskScore, 0) /
        employeeDetails.length,
    ),
  };

  const teamHeatmap = toHeatmap(employeeDetails);
  const interventionQueue = employeeDetails
    .filter((detail) => detail.route !== "Low: no action or monitor")
    .map(toQueueItem)
    .sort((a, b) => b.riskScore - a.riskScore);
  const impactSimulation = buildImpactSimulation({
    summary: orgSummary,
    queue: interventionQueue,
  });

  return {
    scenario,
    orgSummary,
    teamHeatmap,
    interventionQueue,
    hrMemo: buildHrMemo(orgSummary, interventionQueue),
    impactSimulation,
    selectedEmployeeDetail,
    executionTrace: buildExecutionTrace({
      scenario,
      totalEmployees: employeeDetails.length,
      teamCount: teamHeatmap.length,
      queueCount: interventionQueue.length,
    }),
    workflowStatus: "Autonomous org-wide workload diplomacy loop completed",
  };
}

export function runMediaryLoop(input: MediaryLoopInput = {}): MediaryLoopOutput {
  return runOrgMediaryLoop(input);
}
