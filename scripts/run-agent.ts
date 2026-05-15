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

console.log(JSON.stringify(output, null, 2));
