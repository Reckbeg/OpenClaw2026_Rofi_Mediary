import { runMediaryLoop } from "../src/agents/runMediaryLoop";
import { defaultSelfAssessmentAnswers } from "../src/modules/scoring/selfAssessment";
import type { MediaryLoopOutput, ToolInvocation } from "../src/types/mediary";

function parseScenarioArg(): "baseline" | "sustained-high" {
  const rawArg = process.argv.find((arg) => arg.startsWith("--scenario="));
  const scenario = rawArg?.split("=")[1];
  return scenario === "sustained-high" ? "sustained-high" : "baseline";
}

function formatToolExample(output: MediaryLoopOutput, tool: ToolInvocation["tool"]): string {
  const invocation = output.toolInvocations.find((item) => item.tool === tool);
  if (!invocation) {
    return `- ${tool}: no invocation in this run`;
  }
  return `- ${tool}: ${invocation.summary} (target ${invocation.targetEmployeeName})`;
}

function printOperatorDispatch(output: MediaryLoopOutput): void {
  const hrOpsRoutes = output.interventionQueue.filter(
    (item) => item.route === "Sustained High: HR Ops queue",
  ).length;

  const dispatch = [
    "=== OPERATOR DISPATCH :: AUTONOMOUS MULTI-AGENT RUN ===",
    `Scenario: ${output.scenario} workload strain monitoring`,
    "",
    "1) Analyst Agent",
    `- employees analyzed: ${output.runLedger.employeesAnalyzed}`,
    `- risk distribution: Low=${output.orgSummary.lowRiskCount}, Medium=${output.orgSummary.mediumRiskCount}, High=${output.orgSummary.highRiskCount}, sustained-high workload pattern=${output.orgSummary.sustainedHighCount}`,
    `- monthly trend findings: worsening=${output.monthlyTrendOrgSummary.worseningCount}, improving=${output.monthlyTrendOrgSummary.improvingCount}, sustained-high workload pattern signals=${output.monthlyTrendOrgSummary.sustainedPatternCount}`,
    `- HR Ops routes: ${hrOpsRoutes} routed through HR Ops route`,
    "",
    "2) Executor Agent",
    `- toolInvocations count: ${output.toolInvocations.length}`,
    `- actionArtifacts count: ${output.actionArtifacts.length}`,
    `- followUpTasks count: ${output.followUpTasks.length}`,
    "- tool examples:",
    formatToolExample(output, "HR_OPS_CASE_TOOL"),
    formatToolExample(output, "MANAGER_BRIEF_TOOL"),
    formatToolExample(output, "FOCUS_BLOCK_PLANNER"),
    formatToolExample(output, "FOLLOW_UP_SCHEDULER"),
    "",
    "3) Supervisor Agent",
    `- orgHealth status and score: ${output.orgHealth.status} (${output.orgHealth.score}/100)`,
    `- anomaly count: ${output.orgHealth.anomalies.length}`,
    `- supervisor recommendation: ${output.orgHealth.recommendation}`,
    "",
    "4) Final run ledger",
    `- runId: ${output.runLedger.runId}`,
    `- decisionsMade: ${output.runLedger.decisionsMade}`,
    `- toolsExecuted: ${output.runLedger.toolsExecuted}`,
    `- actionArtifactsCreated: ${output.runLedger.actionArtifactsCreated}`,
    `- followUpsQueued: ${output.runLedger.followUpsQueued}`,
    "=== END OPERATOR DISPATCH ===",
  ];

  console.log(dispatch.join("\n"));
}

const output = runMediaryLoop({
  scenario: parseScenarioArg(),
  selfAssessmentAnswers: defaultSelfAssessmentAnswers,
});

const summary = {
  workflowStatus: output.workflowStatus,
  orgSummary: output.orgSummary,
  interventionQueueCount: output.interventionQueue.length,
  toolInvocationsCount: output.toolInvocations.length,
  actionArtifactsCount: output.actionArtifacts.length,
  followUpTasksCount: output.followUpTasks.length,
  runLedger: output.runLedger,
};

if (output.scenario === "sustained-high") {
  printOperatorDispatch(output);
}

console.log(JSON.stringify({ summary, output }, null, 2));
