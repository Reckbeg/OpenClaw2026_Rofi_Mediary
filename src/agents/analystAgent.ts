import { runAnalyzerAgent } from "@/src/agents/analyzerAgent";
import { ANALYST_IDENTITY } from "@/src/agents/identity";
import { runWorkflowDiplomatAgent } from "@/src/agents/workflowDiplomatAgent";
import { defaultEmployeeId, getScenarioWeeklyHistory, sampleOrgDataset } from "@/src/data/sampleOrg";
import { calculateCalendarMetrics } from "@/src/modules/metrics/calendarMetrics";
import {
  calculateEnergyStrainScore,
  defaultSelfAssessmentAnswers,
} from "@/src/modules/scoring/selfAssessment";
import { computeRiskScore } from "@/src/modules/scoring/riskScore";
import { loadMemory, saveMemory, updateAnalystMemory } from "@/src/modules/state/agentMemory";
import type {
  AnalystOutput,
  DemoScenario,
  EmployeeLoopDetail,
  InterventionQueueItem,
  InterventionRoute,
  MediaryLoopInput,
  MonthlyTrendSummary,
  RiskBucket,
  SelfAssessmentAnswer,
  TeamHeatmapItem,
  WeeklyRiskSnapshot,
} from "@/src/types/mediary";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function getRiskBucket(score: number): RiskBucket {
  if (score >= 80) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function resolveRoute(riskBucket: RiskBucket, isSustainedHigh: boolean): InterventionRoute {
  if (isSustainedHigh) return "Sustained High: HR Ops queue";
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

function getMonthlyTrendSummary(employeeId: string, history: WeeklyRiskSnapshot[]): MonthlyTrendSummary {
  const highRiskWeeks = history.filter((w) => w.riskBucket === "High").length;
  const mediumOrHighWeeks = history.filter((w) => w.riskBucket !== "Low").length;
  const riskDelta = history.length >= 2 ? history[history.length - 1].riskScore - history[0].riskScore : 0;
  const trendDirection: MonthlyTrendSummary["trendDirection"] =
    riskDelta >= 6 ? "worsening" : riskDelta <= -6 ? "improving" : "stable";
  const sustainedPatternDetected = highRiskWeeks >= 2 || (mediumOrHighWeeks >= 4 && trendDirection === "worsening");

  return {
    employeeId,
    trendDirection,
    highRiskWeeks,
    mediumOrHighWeeks,
    riskDelta,
    sustainedPatternDetected,
    summary: sustainedPatternDetected
      ? `Sustained overload: ${highRiskWeeks} high-risk weeks, trend ${trendDirection} by ${riskDelta} points.`
      : `Trend ${trendDirection}: ${highRiskWeeks} high-risk weeks over ${history.length} weeks.`,
  };
}

function getAnswersForEmployee(index: number, providedAnswers?: SelfAssessmentAnswer[]): SelfAssessmentAnswer[] {
  if (providedAnswers?.length) return providedAnswers;
  const offset = (index % 3) - 1;
  return defaultSelfAssessmentAnswers.map((answer, answerIndex) => {
    const directionalShift = answerIndex % 2 === 0 ? offset : -offset;
    return { ...answer, score: Math.min(5, Math.max(1, answer.score + directionalShift)) };
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
  if (scenario !== "sustained-high") return baseAnswers;
  const sustainedHighProfiles = new Set(["alex-johnson", "olivia-clark"]);
  if (!sustainedHighProfiles.has(employeeId)) return baseAnswers;
  return baseAnswers.map((answer) => {
    if (answer.questionId === "emotionally-drained" || answer.questionId === "meeting-overload") return { ...answer, score: 5 };
    if (answer.questionId === "personal-energy" || answer.questionId === "focus-capacity") return { ...answer, score: 1 };
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
  if (scenario !== "sustained-high") return metrics;
  const sustainedHighProfiles = new Set(["alex-johnson", "olivia-clark"]);
  if (!sustainedHighProfiles.has(employeeId)) return metrics;
  return {
    weeklyMeetingHours: Math.max(metrics.weeklyMeetingHours, 27),
    meetingRatio: Math.max(metrics.meetingRatio, 0.68),
    backToBackDays: Math.max(metrics.backToBackDays, 5),
    afterHoursMeetings: Math.max(metrics.afterHoursMeetings, 3),
    estimatedFocusHours: Math.min(metrics.estimatedFocusHours, 7),
  };
}

function getPreviousWeekRiskScore(detail: EmployeeLoopDetail): number {
  if (detail.route === "Sustained High: HR Ops queue") return Math.max(80, detail.scoring.overallRiskScore - 5);
  if (detail.scoring.riskBucket === "Medium") {
    const offset = detail.employee.id.length % 2 === 0 ? 1 : -2;
    return clampScore(detail.scoring.overallRiskScore + offset);
  }
  if (detail.scoring.riskBucket === "High") return clampScore(detail.scoring.overallRiskScore - 3);
  return clampScore(detail.scoring.overallRiskScore - 1);
}

function strongestDriverNextStep(detail: EmployeeLoopDetail): string {
  const metrics = detail.scoring.calendarMetrics;
  const calendarSignals = [
    { key: "after-hours", score: metrics.afterHoursMeetings * 25 },
    { key: "meeting load", score: metrics.meetingRatio * 100 },
    { key: "back-to-back", score: (metrics.backToBackDays / 5) * 100 },
    { key: "focus", score: ((24 - metrics.estimatedFocusHours) / 24) * 100 },
  ].sort((a, b) => b.score - a.score);

  const strongestDriver = detail.scoring.topDrivers[0]?.toLowerCase() ?? "";
  if (strongestDriver.includes("after-hours")) return "Reset late-day meeting boundaries and move external coordination into core hours.";
  if (strongestDriver.includes("back-to-back")) return "Insert protected recovery/focus buffers between dense meeting blocks this week.";
  if (strongestDriver.includes("focus")) return "Block two deep-work windows and pause non-critical meeting requests during those windows.";
  if (strongestDriver.includes("meeting load")) return "Trim recurring meeting duration and convert one status sync into an async update.";
  if (strongestDriver.includes("self-assessment")) {
    const strongestCalendar = calendarSignals[0]?.key;
    if (strongestCalendar === "after-hours") return "Run an employee check-in and shift late-day work into core collaboration hours.";
    if (strongestCalendar === "meeting load") return "Run an employee check-in and trim recurring coordination load for the next cycle.";
    if (strongestCalendar === "back-to-back") return "Run an employee check-in and add recovery buffers between meetings this week.";
    return "Run an employee check-in and protect deep-work focus blocks for the next cycle.";
  }
  return "Monitor trend and keep the current intervention plan in place.";
}

function toQueueItem(detail: EmployeeLoopDetail): InterventionQueueItem {
  const decisionRationale =
    detail.route === "Sustained High: HR Ops queue"
      ? `Current risk is ${detail.scoring.overallRiskScore}/100 ${detail.scoring.riskBucket}, previous week context is ${getPreviousWeekRiskScore(detail)}/100, and the 4-week trend is ${detail.monthlyTrend.trendDirection} with sustained overload signals.`
      : detail.route === "High: employee nudge + manager brief"
        ? `Current risk is ${detail.scoring.overallRiskScore}/100 ${detail.scoring.riskBucket} with active strain signals requiring manager awareness.`
        : `Current risk is ${detail.scoring.overallRiskScore}/100 ${detail.scoring.riskBucket} with manageable strain signals.`;

  const consideredAlternatives = [
    "Low: no action or monitor",
    "Medium: employee nudge",
    "High: employee nudge + manager brief",
    "Sustained High: HR Ops queue",
  ].filter((r) => r !== detail.route);

  const actionArtifact =
    detail.route === "Sustained High: HR Ops queue"
      ? "HR Ops escalation packet with manager brief, workload trend snapshot, and action checklist."
      : detail.route === "High: employee nudge + manager brief"
        ? "Manager summary with route rationale, employee nudge draft, and focus-block recommendation."
        : "Employee nudge packet with focused scheduling actions and one-week checkpoint.";

  const followUpCadence =
    detail.route === "Sustained High: HR Ops queue"
      ? "48-hour follow-up, then weekly until risk returns below sustained-high threshold."
      : detail.route === "High: employee nudge + manager brief"
        ? "3 business-day manager checkpoint, then weekly follow-up."
        : "7-day follow-up in next cycle.";

  const nextStep =
    detail.route === "Sustained High: HR Ops queue"
      ? `${strongestDriverNextStep(detail)} Escalate to HR Ops case handling with manager brief in this cycle.`
      : detail.route === "High: employee nudge + manager brief"
        ? `${strongestDriverNextStep(detail)} Send employee nudge and manager summary this week.`
        : `${strongestDriverNextStep(detail)} Send employee nudge with focused plan this week.`;

  return {
    employeeId: detail.employee.id,
    employeeName: detail.employee.name,
    team: detail.employee.team,
    riskScore: detail.scoring.overallRiskScore,
    riskBucket: detail.scoring.riskBucket,
    previousWeekRiskScore: getPreviousWeekRiskScore(detail),
    previousWeekRiskBucket: getRiskBucket(getPreviousWeekRiskScore(detail)),
    route: detail.route,
    nextStep,
    decisionRationale,
    consideredAlternatives,
    actionArtifact,
    followUpCadence,
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
      return { team, avgRiskScore, riskBucket, employeeCount: teamMembers.length, highRiskMembers };
    })
    .sort((a, b) => b.avgRiskScore - a.avgRiskScore);
}

function buildHrMemo(
  summary: AnalystOutput["orgSummary"],
  queue: InterventionQueueItem[],
  monthlyTrendOrgSummary: AnalystOutput["monthlyTrendOrgSummary"],
): string {
  const urgentCount = queue.filter((item) => item.route === "Sustained High: HR Ops queue").length;
  const sustainedTrendLine =
    monthlyTrendOrgSummary.sustainedPatternCount > 0
      ? `${monthlyTrendOrgSummary.sustainedPatternCount} employees show sustained overload across the 4-week trend and are routed to HR Ops.`
      : "No employees show sustained overload across the 4-week trend.";
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
  summary: AnalystOutput["orgSummary"];
  queue: InterventionQueueItem[];
}): AnalystOutput["impactSimulation"] {
  const projectedMeetingHoursReduced = Math.round(queue.length * 0.4 + summary.sustainedHighCount * 1.5);
  const projectedFocusHoursGained = Math.round(projectedMeetingHoursReduced * 0.8);
  const riskReductionPoints = Math.round(queue.length * 0.8 + summary.sustainedHighCount * 2);
  const projectedAvgRiskScore = Math.max(0, summary.avgRiskScore - riskReductionPoints);
  const projectedHighRiskCount = Math.max(0, summary.highRiskCount - Math.ceil(summary.highRiskCount * 0.4));
  const projectedSustainedHighCount = Math.max(0, summary.sustainedHighCount - Math.ceil(summary.sustainedHighCount * 0.5));
  const projectedInterventionQueueCount = Math.max(0, queue.length - Math.ceil(queue.length * 0.35));

  return {
    projectedMeetingHoursReduced,
    projectedFocusHoursGained,
    before: { avgRiskScore: summary.avgRiskScore, highRiskCount: summary.highRiskCount, sustainedHighCount: summary.sustainedHighCount, interventionQueueCount: queue.length },
    after: { projectedAvgRiskScore, projectedHighRiskCount, projectedSustainedHighCount, projectedInterventionQueueCount },
    assumptions: [
      "One-week projection assumes intervention adherence for routed employees.",
      "Medium route lowers projected risk by operational nudges and meeting hygiene.",
      "High and sustained-high routes include manager briefing and tighter follow-up cadence.",
    ],
  };
}

/**
 * ANALYST AGENT
 *
 * Owns: risk scoring, trend detection, routing recommendations, team heatmap, HR memo, impact simulation
 * Does NOT: invoke tools, create artifacts, manage follow-up state
 * Pure reasoning — no side effects
 */
export function runAnalystAgent(input: MediaryLoopInput = {}): AnalystOutput {
  const scenario: DemoScenario = input.scenario ?? "baseline";

  const employeeDetails: EmployeeLoopDetail[] = sampleOrgDataset.employees.map((employee, index) => {
    const events = sampleOrgDataset.calendarsByEmployee[employee.id] ?? [];
    const baselineAnswers = getAnswersForEmployee(index, input.selfAssessmentAnswers);
    const answers = getScenarioAdjustedAnswers({ employeeId: employee.id, baseAnswers: baselineAnswers, scenario });
    const baselineMetrics = calculateCalendarMetrics(events);
    const metrics = getScenarioAdjustedMetrics({ employeeId: employee.id, metrics: baselineMetrics, scenario });
    const selfAssessmentScore = calculateEnergyStrainScore(answers);
    const scoring = computeRiskScore(metrics, selfAssessmentScore);
    const weeklyHistory = getScenarioWeeklyHistory(employee.id, scenario);
    const monthlyTrend = getMonthlyTrendSummary(employee.id, weeklyHistory);
    const analyzer = runAnalyzerAgent(scoring, events);
    const diplomat = runWorkflowDiplomatAgent(analyzer, scoring);
    const sustainedHighByCurrentWeek = isSustainedHighSignal({
      riskBucket: scoring.riskBucket,
      calendarOverloadRisk: scoring.calendarOverloadRisk,
      afterHoursMeetings: scoring.calendarMetrics.afterHoursMeetings,
      backToBackDays: scoring.calendarMetrics.backToBackDays,
      meetingRatio: scoring.calendarMetrics.meetingRatio,
    });
    const sustainedHigh = scoring.riskBucket === "High" && (monthlyTrend.sustainedPatternDetected || sustainedHighByCurrentWeek);
    const route = resolveRoute(scoring.riskBucket, sustainedHigh);

    return { employee, scoring, monthlyTrend, analyzer, diplomat, route };
  });

  const lowRiskCount = employeeDetails.filter((d) => d.scoring.riskBucket === "Low").length;
  const mediumRiskCount = employeeDetails.filter((d) => d.scoring.riskBucket === "Medium").length;
  const highRiskCount = employeeDetails.filter((d) => d.scoring.riskBucket === "High").length;
  const sustainedHighCount = employeeDetails.filter((d) => d.route === "Sustained High: HR Ops queue").length;

  const orgSummary: AnalystOutput["orgSummary"] = {
    totalEmployees: employeeDetails.length,
    lowRiskCount,
    mediumRiskCount,
    highRiskCount,
    sustainedHighCount,
    avgRiskScore: Math.round(employeeDetails.reduce((sum, d) => sum + d.scoring.overallRiskScore, 0) / employeeDetails.length),
  };

  const monthlyTrendByEmployee = Object.fromEntries(employeeDetails.map((d) => [d.employee.id, d.monthlyTrend]));
  const monthlyTrendOrgSummary = {
    worseningCount: employeeDetails.filter((d) => d.monthlyTrend.trendDirection === "worsening").length,
    improvingCount: employeeDetails.filter((d) => d.monthlyTrend.trendDirection === "improving").length,
    sustainedPatternCount: employeeDetails.filter((d) => d.monthlyTrend.sustainedPatternDetected).length,
  };

  const teamHeatmap = toHeatmap(employeeDetails);
  const interventionQueue = employeeDetails
    .filter((d) => d.route !== "Low: no action or monitor")
    .map(toQueueItem)
    .sort((a, b) => b.riskScore - a.riskScore);

  const hrMemo = buildHrMemo(orgSummary, interventionQueue, monthlyTrendOrgSummary);
  const impactSimulation = buildImpactSimulation({ summary: orgSummary, queue: interventionQueue });

  // ── Memory: load, update, persist ──
  const prevMemory = loadMemory("analyst");
  const now = new Date().toISOString();
  const newPatterns = employeeDetails
    .filter((d) => d.monthlyTrend.sustainedPatternDetected)
    .map((d) => ({ employeeId: d.employee.id, pattern: d.monthlyTrend.summary, detectedDate: now, stillActive: true }));
  const updatedMemory = updateAnalystMemory(prevMemory, {
    date: now,
    employeeScores: employeeDetails.map((d) => ({ employeeId: d.employee.id, score: d.scoring.overallRiskScore, bucket: d.scoring.riskBucket })),
    newPatterns,
    note: `Run ${prevMemory.runCount + 1}: ${orgSummary.totalEmployees} employees, ${orgSummary.sustainedHighCount} sustained-high`,
  });
  saveMemory("analyst", updatedMemory);

  return { identity: ANALYST_IDENTITY, memory: updatedMemory, employeeDetails, orgSummary, monthlyTrendOrgSummary, monthlyTrendByEmployee, teamHeatmap, interventionQueue, hrMemo, impactSimulation };
}
