import { SUPERVISOR_IDENTITY } from "@/src/agents/identity";
import { loadLatestRun } from "@/src/modules/state/ledgerStore";
import { loadMemory, saveMemory, updateSupervisorMemory } from "@/src/modules/state/agentMemory";
import type {
  AnalystOutput,
  DemoScenario,
  ExecutionTraceStep,
  ExecutorOutput,
  OrgHealthAssessment,
  SupervisorAnomaly,
  SupervisorOutput,
} from "@/src/types/mediary";

function detectAnomalies(analyst: AnalystOutput, executor: ExecutorOutput, scenario: DemoScenario): SupervisorAnomaly[] {
  const anomalies: SupervisorAnomaly[] = [];

  // Anomaly: zero interventions in sustained-high scenario
  if (scenario === "sustained-high" && analyst.interventionQueue.length === 0) {
    anomalies.push({
      severity: "critical",
      code: "ZERO_INTERVENTIONS",
      message: "Sustained-high scenario produced zero interventions — routing logic may be broken.",
      affectedEmployees: [],
    });
  }

  // Anomaly: no high-risk employees detected in sustained-high
  if (scenario === "sustained-high" && analyst.orgSummary.highRiskCount === 0) {
    anomalies.push({
      severity: "warning",
      code: "NO_HIGH_RISK",
      message: "Sustained-high scenario detected zero high-risk employees — scoring thresholds may be misconfigured.",
      affectedEmployees: [],
    });
  }

  // Anomaly: all employees routed (no one is low-risk)
  if (analyst.orgSummary.lowRiskCount === 0 && analyst.orgSummary.totalEmployees > 0) {
    anomalies.push({
      severity: "warning",
      code: "ZERO_LOW_RISK",
      message: "All employees are Medium or higher — threshold calibration may be too aggressive.",
      affectedEmployees: [],
    });
  }

  // Anomaly: tool count doesn't match queue
  const expectedMinTools = analyst.interventionQueue.length; // at least 1 per queued employee
  if (executor.toolInvocations.length < expectedMinTools) {
    anomalies.push({
      severity: "warning",
      code: "TOOL_COUNT_MISMATCH",
      message: `Expected at least ${expectedMinTools} tool invocations for ${analyst.interventionQueue.length} queued employees, got ${executor.toolInvocations.length}.`,
      affectedEmployees: [],
    });
  }

  // Anomaly: artifact count doesn't match queue
  if (executor.actionArtifacts.length < analyst.interventionQueue.length) {
    anomalies.push({
      severity: "info",
      code: "ARTIFACT_COUNT_LOW",
      message: `Expected at least ${analyst.interventionQueue.length} artifacts, got ${executor.actionArtifacts.length}.`,
      affectedEmployees: [],
    });
  }

  // Anomaly: HR Ops employees not getting HR_OPS_CASE_TOOL
  const hrOpsEmployees = analyst.interventionQueue.filter((i) => i.route === "Sustained High: HR Ops queue");
  for (const emp of hrOpsEmployees) {
    const hasHrOpsTool = executor.toolInvocations.some((t) => t.targetEmployeeId === emp.employeeId && t.tool === "HR_OPS_CASE_TOOL");
    if (!hasHrOpsTool) {
      anomalies.push({
        severity: "critical",
        code: "MISSING_HR_OPS_TOOL",
        message: `${emp.employeeName} routed to HR Ops but no HR_OPS_CASE_TOOL was invoked.`,
        affectedEmployees: [emp.employeeId],
      });
    }
  }

  // Anomaly: worsened employees from previous run
  const previous = loadLatestRun(scenario);
  if (previous) {
    const prevQueue = previous.interventionQueue;
    for (const curr of analyst.interventionQueue) {
      const prev = prevQueue.find((p) => p.employeeId === curr.employeeId);
      if (prev && curr.riskScore > prev.riskScore + 10) {
        anomalies.push({
          severity: "warning",
          code: "EMPLOYEE_WORSENED",
          message: `${curr.employeeName} worsened by ${curr.riskScore - prev.riskScore} points since last run (${prev.riskScore} → ${curr.riskScore}).`,
          affectedEmployees: [curr.employeeId],
        });
      }
    }
  }

  return anomalies;
}

function assessOrgHealth(anomalies: SupervisorAnomaly[], analystOutput: AnalystOutput): OrgHealthAssessment {
  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const warningCount = anomalies.filter((a) => a.severity === "warning").length;

  let status: OrgHealthAssessment["status"] = "healthy";
  let score = 100;

  if (criticalCount > 0) {
    status = "critical";
    score -= criticalCount * 30;
  }
  if (warningCount > 0) {
    if (status !== "critical") status = "attention";
    score -= warningCount * 10;
  }

  // Adjust based on org metrics
  if (analystOutput.orgSummary.sustainedHighCount > 0) {
    score -= analystOutput.orgSummary.sustainedHighCount * 5;
    if (status === "healthy") status = "attention";
  }

  score = Math.max(0, Math.min(100, score));

  const recommendation =
    status === "critical"
      ? "Immediate review required — critical anomalies detected in agent pipeline."
      : status === "attention"
        ? anomalies.length > 0
          ? "Review recommended — anomalies detected that may need human oversight."
          : "Review recommended — sustained-high employees require manager attention."
        : "No action required — agent loop operating within expected parameters.";

  return { status, score, anomalies, recommendation };
}

function buildExecutionTrace({
  scenario,
  analyst,
  executor,
  orgHealth,
}: {
  scenario: DemoScenario;
  analyst: AnalystOutput;
  executor: ExecutorOutput;
  orgHealth: OrgHealthAssessment;
}): ExecutionTraceStep[] {
  const routeCounts = {
    hrOps: analyst.interventionQueue.filter((i) => i.route === "Sustained High: HR Ops queue").length,
    managerBrief: analyst.interventionQueue.filter((i) => i.route === "High: employee nudge + manager brief" || i.route === "Sustained High: HR Ops queue").length,
    employeeNudges: analyst.interventionQueue.filter((i) => i.route === "Medium: employee nudge").length,
    monitorOnly: analyst.employeeDetails.filter((d) => d.route === "Low: no action or monitor").length,
  };

  return [
    {
      step: 1,
      phase: "observe",
      name: "Observe org dataset",
      status: "completed",
      output: `Loaded deterministic org dataset with ${analyst.orgSummary.totalEmployees} employees and weekly calendars using the "${scenario}" scenario profile.`,
    },
    {
      step: 2,
      phase: "reason",
      name: "Analyst: Calculate employee metrics",
      status: "completed",
      output: `Computed weekly meeting load, meeting ratio, back-to-back days, after-hours meetings, focus estimate, and energy strain for each employee.`,
    },
    {
      step: 3,
      phase: "reason",
      name: "Analyst: Aggregate team risk",
      status: "completed",
      output: `Compared 4-week workload trend and detected sustained overload patterns, then aggregated team heatmap across ${analyst.teamHeatmap.length} teams with risk buckets and average risk scores.`,
    },
    {
      step: 4,
      phase: "decide",
      name: "Analyst: Route interventions",
      status: "completed",
      output: `Applied routing policy with evidence from current risk, previous-week context, and 4-week trend. Routes: HR Ops=${routeCounts.hrOps}, manager brief=${routeCounts.managerBrief}, employee nudges=${routeCounts.employeeNudges}, monitor-only=${routeCounts.monitorOnly}.`,
    },
    {
      step: 5,
      phase: "execute",
      name: "Executor: Invoke tools and create artifacts",
      status: "completed",
      output: `Executed ${executor.toolInvocations.length} internal tool invocations across ${executor.actionArtifacts.length} stakeholder-specific action artifacts.`,
    },
    {
      step: 6,
      phase: "follow-up",
      name: "Executor: Queue follow-up tasks",
      status: "completed",
      output: `Queued ${executor.followUpTasks.length} follow-up tasks by route: 48-hour HR Ops review for sustained-high, 3-working-day manager review for high, 7-day employee follow-up for medium.`,
    },
    {
      step: 7,
      phase: "supervise",
      name: "Supervisor: Assess org health",
      status: "completed",
      output: `Org health: ${orgHealth.status} (score ${orgHealth.score}/100). ${orgHealth.anomalies.length} anomaly(s) detected. ${orgHealth.recommendation}`,
    },
  ];
}

/**
 * SUPERVISOR AGENT
 *
 * Owns: anomaly detection, cross-agent coordination, org health assessment, execution trace
 * Does NOT: score employees, invoke tools, create artifacts
 * Watches the pipeline — catches anomalies, validates consistency, owns the run ledger memory
 */
export function runSupervisorAgent(
  analyst: AnalystOutput,
  executor: ExecutorOutput,
  scenario: DemoScenario,
): SupervisorOutput {
  const anomalies = detectAnomalies(analyst, executor, scenario);
  const orgHealth = assessOrgHealth(anomalies, analyst);
  const executionTrace = buildExecutionTrace({ scenario, analyst, executor, orgHealth });

  const analystSummary = `Analyzed ${analyst.orgSummary.totalEmployees} employees: ${analyst.orgSummary.lowRiskCount} low, ${analyst.orgSummary.mediumRiskCount} medium, ${analyst.orgSummary.highRiskCount} high, ${analyst.orgSummary.sustainedHighCount} sustained-high. Avg risk: ${analyst.orgSummary.avgRiskScore}/100.`;
  const executorSummary = `Executed ${executor.toolInvocations.length} tool invocations, created ${executor.actionArtifacts.length} action artifacts, queued ${executor.followUpTasks.length} follow-up tasks.`;
  const supervisorSummary = `Org health: ${orgHealth.status} (${orgHealth.score}/100). ${anomalies.length} anomaly(s). ${orgHealth.recommendation}`;

  // ── Memory: load, update, persist ──
  const prevMemory = loadMemory("supervisor");
  const now = new Date().toISOString();
  const escalations = anomalies
    .filter((a) => a.severity === "critical")
    .map((a) => ({ date: now, employeeId: a.affectedEmployees[0] ?? "org", reason: a.message, outcome: "flagged" }));
  const updatedMemory = updateSupervisorMemory(prevMemory, {
    date: now,
    newAnomalies: anomalies.map((a) => ({ date: now, code: a.code, severity: a.severity, resolved: false })),
    healthScore: orgHealth.score,
    healthStatus: orgHealth.status,
    escalations,
    analystConfidence: analyst.memory.scoringConfidence,
    executorDeliveryRate: executor.actionArtifacts.length > 0 ? 1 : 0,
    note: `Run ${prevMemory.runCount + 1}: health ${orgHealth.status} (${orgHealth.score}/100), ${anomalies.length} anomalies`,
  });
  saveMemory("supervisor", updatedMemory);

  return {
    identity: SUPERVISOR_IDENTITY,
    memory: updatedMemory,
    orgHealth,
    executionTrace,
    loopReport: { analystSummary, executorSummary, supervisorSummary },
  };
}
