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
import type { AnalyzeResponse, ExecutionTraceStep, SelfAssessmentAnswer } from "@/lib/types";

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
  const executionTrace = buildExecutionTrace({
    answers,
    selfAssessmentScore,
    scoring,
    analyzer,
    diplomat,
  });

  const response: AnalyzeResponse = {
    scoring,
    analyzer,
    diplomat,
    executionTrace,
  };

  return NextResponse.json(response);
}

function buildExecutionTrace({
  answers,
  selfAssessmentScore,
  scoring,
  analyzer,
  diplomat,
}: {
  answers: SelfAssessmentAnswer[];
  selfAssessmentScore: number;
  scoring: AnalyzeResponse["scoring"];
  analyzer: AnalyzeResponse["analyzer"];
  diplomat: AnalyzeResponse["diplomat"];
}): ExecutionTraceStep[] {
  const metricSummary = [
    `weeklyMeetingHours=${scoring.calendarMetrics.weeklyMeetingHours}h`,
    `meetingRatio=${Math.round(scoring.calendarMetrics.meetingRatio * 100)}%`,
    `backToBackDays=${scoring.calendarMetrics.backToBackDays}`,
    `afterHoursMeetings=${scoring.calendarMetrics.afterHoursMeetings}`,
    `estimatedFocusHours=${scoring.calendarMetrics.estimatedFocusHours}h`,
  ].join(", ");

  const candidateSummary = analyzer.meetingCandidates
    .slice(0, 3)
    .map((candidate) => `${candidate.title} (${candidate.recommendedChange})`)
    .join("; ");

  return [
    {
      step: 1,
      name: "Calendar Parser Tool",
      status: "completed",
      output: `Loaded ${sampleWeek.meetings.length} weekly calendar events for ${sampleWeek.employee.name}.`,
    },
    {
      step: 2,
      name: "Metrics Engine Tool",
      status: "completed",
      output: `Calculated ${metricSummary}.`,
    },
    {
      step: 3,
      name: "Self-Assessment Tool",
      status: "completed",
      output: `Processed ${answers.length} self-assessment answers and computed energyStrainScore=${selfAssessmentScore}/100.`,
    },
    {
      step: 4,
      name: "Risk Scoring Tool",
      status: "completed",
      output: `Combined 60% calendar risk (${scoring.calendarOverloadRisk}) and 40% energy strain (${selfAssessmentScore}) to produce overallRiskScore=${scoring.overallRiskScore} (${scoring.riskBucket}).`,
    },
    {
      step: 5,
      name: "Analyzer Agent",
      status: "completed",
      output: `Identified top drivers: ${analyzer.topDrivers.join("; ")}. Selected candidates: ${candidateSummary || "No candidate meetings selected"}.`,
    },
    {
      step: 6,
      name: "Workflow Diplomat Agent",
      status: "completed",
      output: `Generated exactly ${diplomat.interventions.length} interventions, 1 diplomatic message draft, and ${diplomat.cleanedWeekPreview.length}-day cleaned-up week preview.`,
    },
  ];
}
