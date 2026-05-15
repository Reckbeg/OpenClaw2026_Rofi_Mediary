import { runMediaryLoop } from "../src/agents/runMediaryLoop";
import { defaultSelfAssessmentAnswers } from "../src/modules/scoring/selfAssessment";

function parseScenarioArg(): "baseline" | "sustained-high" {
  const rawArg = process.argv.find((arg) => arg.startsWith("--scenario="));
  const scenario = rawArg?.split("=")[1];
  return scenario === "sustained-high" ? "sustained-high" : "baseline";
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

console.log(JSON.stringify({ summary, output }, null, 2));
