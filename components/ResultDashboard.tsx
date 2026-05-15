import { MetricsCards } from "@/components/MetricsCards";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { AnalyzeResponse, RiskBucket } from "@/lib/types";

type ResultDashboardProps = {
  result: AnalyzeResponse | null;
  isLoading: boolean;
};

const riskStyles: Record<RiskBucket, string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-rose-100 text-rose-800",
};

function toManagerAction(nextStep: string): string {
  const firstSentence = nextStep.split(". ")[0]?.trim() ?? nextStep;
  return `Manager action: ${firstSentence.replace(/\.$/, "")}.`;
}

export function ResultDashboard({ result, isLoading }: ResultDashboardProps) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Agent output</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-stone-950">Workflow diplomacy</h2>
          {result && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800">
              {result.workflowStatus}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Deterministic analyzer and diplomat agents produce operational, non-clinical interventions.
          {result ? ` Scenario: ${result.scenario}.` : ""}
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5 text-sm text-stone-600">
          Loading calendar metrics, scoring self-assessment, and drafting diplomatic workflow actions.
        </div>
      )}

      {!isLoading && !result && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6 text-sm leading-6 text-stone-600">
          Run the analysis to see overload risk, top drivers, three interventions, a diplomatic message draft,
          and a cleaned-up week preview.
        </div>
      )}

      {!isLoading && result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="font-semibold text-emerald-900">Org summary</h3>
            <p className="mt-1 text-sm text-emerald-900/90">
              {result.orgSummary.totalEmployees} employees analyzed · avg risk {result.orgSummary.avgRiskScore}
            </p>
            <p className="mt-2 text-sm text-emerald-900/90">
              Low {result.orgSummary.lowRiskCount} · Medium {result.orgSummary.mediumRiskCount} · High {result.orgSummary.highRiskCount} · Sustained High {result.orgSummary.sustainedHighCount}
            </p>
            <p className="mt-2 text-sm text-emerald-900/90">
              4-week trend: worsening {result.monthlyTrendOrgSummary.worseningCount} · improving{" "}
              {result.monthlyTrendOrgSummary.improvingCount} · sustained pattern{" "}
              {result.monthlyTrendOrgSummary.sustainedPatternCount}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">HR memo</h3>
            <p className="mt-2 text-sm leading-6 text-stone-700">{result.hrMemo}</p>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Team heatmap</h3>
            <div className="mt-3 space-y-2">
              {result.teamHeatmap.slice(0, 6).map((teamItem) => (
                <div key={teamItem.team} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                  {teamItem.team}: {teamItem.avgRiskScore}/100 ({teamItem.riskBucket}) · {teamItem.employeeCount} members · {teamItem.highRiskMembers} high-risk
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Intervention queue</h3>
            <div className="mt-3 space-y-2">
              {result.interventionQueue.length === 0 && (
                <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
                  No queued interventions. Org remains in monitor state.
                </div>
              )}
              {result.interventionQueue.slice(0, 5).map((item) => (
                <div key={item.employeeId} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                  {item.employeeName} ({item.team}) · {item.riskScore}/100 {item.riskBucket} · {item.route}
                  {typeof item.previousWeekRiskScore === "number" && item.previousWeekRiskBucket && (
                    <p className="mt-1 text-xs text-stone-600">
                      Previous week: {item.previousWeekRiskScore}/100 {item.previousWeekRiskBucket}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-stone-600">Next step: {item.nextStep}</p>
                </div>
              ))}
            </div>
          </div>

          {result.interventionQueue.some(
            (item) =>
              item.route === "High: employee nudge + manager brief" ||
              item.route === "Sustained High: HR Ops queue",
          ) && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
              <h3 className="font-semibold text-stone-950">Manager coaching brief</h3>
              <div className="mt-3 space-y-2">
                {result.interventionQueue
                  .filter(
                    (item) =>
                      item.route === "High: employee nudge + manager brief" ||
                      item.route === "Sustained High: HR Ops queue",
                  )
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={`manager-brief-${item.employeeId}`}
                      className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
                    >
                      <p>
                        {item.employeeName} ({item.team}) · {item.route}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">{toManagerAction(item.nextStep)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Impact simulation</h3>
            <p className="mt-2 text-sm text-stone-700">
              Avg risk {result.impactSimulation.before.avgRiskScore} → {result.impactSimulation.after.projectedAvgRiskScore}
              {" · "}High-risk {result.impactSimulation.before.highRiskCount} → {result.impactSimulation.after.projectedHighRiskCount}
              {" · "}Sustained-high {result.impactSimulation.before.sustainedHighCount} → {result.impactSimulation.after.projectedSustainedHighCount}
            </p>
            <p className="mt-1 text-sm text-stone-700">
              Queue {result.impactSimulation.before.interventionQueueCount} → {result.impactSimulation.after.projectedInterventionQueueCount}
            </p>
            <p className="mt-1 text-sm text-stone-700">
              Projected meeting hours reduced: {result.impactSimulation.projectedMeetingHoursReduced}h
            </p>
            <p className="mt-1 text-sm text-stone-700">
              Projected focus hours gained: {result.impactSimulation.projectedFocusHoursGained}h
            </p>
            <div className="mt-3 space-y-1">
              {result.impactSimulation.assumptions.map((assumption) => (
                <p key={assumption} className="text-xs text-stone-600">
                  - {assumption}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-stone-950 p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-stone-300">{result.selectedEmployeeDetail.employee.name} overload risk score</p>
                <p className="mt-2 text-5xl font-semibold">{result.selectedEmployeeDetail.scoring.overallRiskScore}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${riskStyles[result.selectedEmployeeDetail.scoring.riskBucket]}`}>
                {result.selectedEmployeeDetail.scoring.riskBucket}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-300">{result.selectedEmployeeDetail.analyzer.summary}</p>
          </div>

          <MetricsCards scoring={result.selectedEmployeeDetail.scoring} />

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">4-week trend signal</h3>
            <div className="mt-2 grid gap-2 text-sm text-stone-700 md:grid-cols-2">
              <p>Trend direction: {result.selectedEmployeeDetail.monthlyTrend.trendDirection}</p>
              <p>High-risk weeks: {result.selectedEmployeeDetail.monthlyTrend.highRiskWeeks}</p>
              <p>Risk delta: {result.selectedEmployeeDetail.monthlyTrend.riskDelta}</p>
              <p>
                Sustained pattern detected:{" "}
                {result.selectedEmployeeDetail.monthlyTrend.sustainedPatternDetected ? "Yes" : "No"}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {result.selectedEmployeeDetail.monthlyTrend.summary}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Agent execution trace</h3>
            <p className="mt-1 text-sm text-stone-600">
              Deterministic step-by-step execution showing how Mediary observes, reasons, decides, and executes.
            </p>
            <div className="mt-4 space-y-3">
              {result.executionTrace.map((step, index) => (
                <div key={`${step.step}-${step.name}`} className="relative rounded-xl border border-stone-200 bg-white p-4">
                  {index !== result.executionTrace.length - 1 && (
                    <span className="absolute left-[1.1rem] top-11 h-[calc(100%-2.25rem)] w-px bg-stone-200" aria-hidden />
                  )}
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white">
                      {step.step}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-stone-900">{step.name}</p>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-800">
                          {step.status}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-800">
                          {step.phase}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-700">{step.output}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Top drivers</h3>
            <div className="mt-3 space-y-2">
              {result.selectedEmployeeDetail.scoring.topDrivers.map((driver) => (
                <div key={driver} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  {driver}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
              Three concrete interventions
            </h3>
            <div className="mt-3 space-y-3">
              {result.selectedEmployeeDetail.diplomat.interventions.map((intervention, index) => (
                <RecommendationCard key={intervention.title} intervention={intervention} index={index} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Diplomatic message draft</h3>
            <p className="mt-3 text-sm leading-6 text-stone-700">{result.selectedEmployeeDetail.diplomat.diplomaticMessageDraft}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
              Cleaned-up week preview
            </h3>
            <div className="mt-3 space-y-3">
              {result.selectedEmployeeDetail.diplomat.cleanedWeekPreview.map((day) => (
                <div key={day.day} className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
                  <p className="font-semibold text-stone-950">{day.day}</p>
                  <div className="mt-3 grid gap-2 text-sm text-stone-600">
                    {day.focusBlocks.map((block) => (
                      <span key={block} className="rounded-xl bg-blue-50 px-3 py-2 text-blue-900">
                        {block}
                      </span>
                    ))}
                    {day.meetingAdjustments.map((adjustment) => (
                      <span key={adjustment} className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
                        {adjustment}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
