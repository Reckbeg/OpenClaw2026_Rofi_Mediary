import { NextResponse } from "next/server";
import { runMediaryLoop } from "@/src/agents/runMediaryLoop";
import { defaultEmployeeId } from "@/src/data/sampleOrg";
import { defaultSelfAssessmentAnswers } from "@/src/modules/scoring/selfAssessment";
import type { DemoScenario, MediaryLoopOutput, SelfAssessmentAnswer } from "@/src/types/mediary";

type AnalyzeRequest = {
  employeeId?: string;
  selfAssessmentAnswers?: SelfAssessmentAnswer[];
  scenario?: DemoScenario;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AnalyzeRequest;
  const selfAssessmentAnswers = body.selfAssessmentAnswers?.length
    ? body.selfAssessmentAnswers
    : defaultSelfAssessmentAnswers;
  const response: MediaryLoopOutput = runMediaryLoop({
    employeeId: body.employeeId ?? defaultEmployeeId,
    selfAssessmentAnswers,
    scenario: body.scenario ?? "baseline",
  });
  return NextResponse.json(response);
}
