import { NextResponse } from "next/server";
import { runAnalyzerAgent } from "@/lib/agents/analyzerAgent";
import { runWorkflowDiplomatAgent } from "@/lib/agents/workflowDiplomatAgent";
import { sampleWeek } from "@/lib/data/sampleWeek";
import { calculateCalendarMetrics } from "@/lib/scoring/calendarMetrics";
import {
  calculateEnergyStrainScore,
  defaultSelfAssessmentAnswers,
} from "@/lib/scoring/selfAssessment";
import { computeRiskScore } from "@/lib/scoring/riskScore";
import type { AnalyzeResponse, SelfAssessmentAnswer } from "@/lib/types";

type AnalyzeRequest = {
  selfAssessmentAnswers?: SelfAssessmentAnswer[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AnalyzeRequest;
  const answers = body.selfAssessmentAnswers?.length
    ? body.selfAssessmentAnswers
    : defaultSelfAssessmentAnswers;

  const calendarMetrics = calculateCalendarMetrics(sampleWeek.meetings);
  const selfAssessmentScore = calculateEnergyStrainScore(answers);
  const scoring = computeRiskScore(calendarMetrics, selfAssessmentScore);
  const analyzer = runAnalyzerAgent(scoring, sampleWeek.meetings);
  const diplomat = runWorkflowDiplomatAgent(analyzer);

  const response: AnalyzeResponse = {
    scoring,
    analyzer,
    diplomat,
  };

  return NextResponse.json(response);
}
