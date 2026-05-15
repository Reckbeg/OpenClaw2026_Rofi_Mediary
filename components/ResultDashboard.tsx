import { MetricsCards } from "@/components/MetricsCards";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { AnalyzeResponse, RiskBucket } from "@/lib/types";

type ResultDashboardProps = {
  result: AnalyzeResponse | null;
  lastScenario: AnalyzeResponse["scenario"] | null;
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

function healthTone(status: AnalyzeResponse["orgHealth"]["status"]): string {
  if (status === "healthy") return "text-emerald-700";
  if (status === "attention") return "text-amber-700";
  return "text-rose-700";
}

export function ResultDashboard({ result, lastScenario }: ResultDashboardProps) {
  if (!result) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Autonomous run output</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-950">Agent operations console</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Start a cycle to run the Analyst → Executor → Supervisor loop and generate workload strain routes,
          action artifacts, and a follow-up queue.
          {lastScenario ? ` Last requested scenario: ${lastScenario}.` : ""}
        </p>
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6 text-sm leading-6 text-stone-600">
          Run a cycle to view operator dispatch summary, 3-agent pipeline results, priority decisions, execution
          layer outputs, supervisor review, impact simulation, and execution trace.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Autonomous run output</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-stone-950">Agent operations console</h2>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800">
            {result.workflowStatus}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Scenario completed: {result.scenario}. Mediary completed a 3-agent workload diplomacy cycle: Analyst
          reasoned over risk, Executor created action artifacts, and Supervisor validated org health.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-semibold text-emerald-900">Operator Dispatch Summary</h3>
          <div className="mt-3 grid gap-2 text-sm text-emerald-900/90 md:grid-cols-2">
            <p>Workflow status: {result.workflowStatus}</p>
            <p>Scenario: {result.scenario}</p>
            <p className={healthTone(result.orgHealth.status)}>
              Org health: {result.orgHealth.status} ({result.orgHealth.score}/100)
            </p>
            <p>Run ID: {result.runLedger.runId}</p>
            <p>Employees analyzed: {result.runLedger.employeesAnalyzed}</p>
            <p>Decisions made: {result.runLedger.decisionsMade}</p>
            <p>Tools executed: {result.runLedger.toolsExecuted}</p>
            <p>Artifacts created: {result.runLedger.actionArtifactsCreated}</p>
            <p>Follow-ups queued: {result.runLedger.followUpsQueued}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-950">3-Agent Pipeline Results</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
              <p className="font-semibold text-stone-900">Aria Analyst</p>
              <p className="mt-2">
                Org summary: {result.orgSummary.lowRiskCount} low · {result.orgSummary.mediumRiskCount} medium ·{" "}
                {result.orgSummary.highRiskCount} high.
              </p>
              <p className="mt-1">
                Trend summary: {result.monthlyTrendOrgSummary.worseningCount} worsening ·{" "}
                {result.monthlyTrendOrgSummary.sustainedPatternCount} sustained-high workload pattern.
              </p>
              <p className="mt-1">HR Ops routes: {result.orgSummary.sustainedHighCount}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
              <p className="font-semibold text-stone-900">Ethan Executor</p>
              <p className="mt-2">Tool invocations: {result.toolInvocations.length}</p>
              <p className="mt-1">Action artifacts: {result.actionArtifacts.length}</p>
              <p className="mt-1">Follow-up queue: {result.followUpTasks.length}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
              <p className="font-semibold text-stone-900">Sol Supervisor</p>
              <p className="mt-2">
                Org health: {result.orgHealth.status} ({result.orgHealth.score}/100)
              </p>
              <p className="mt-1">Anomalies: {result.orgHealth.anomalies.length}</p>
              <p className="mt-1">Recommendation: {result.orgHealth.recommendation}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-950">Priority Decisions</h3>
          <div className="mt-3 space-y-2">
            {result.interventionQueue.slice(0, 3).map((item) => (
              <div key={item.employeeId} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                <p>
                  {item.employeeName} · {item.route}
                </p>
                <p className="mt-1 text-xs text-stone-600">Decision rationale: {item.decisionRationale}</p>
                <p className="mt-1 text-xs text-stone-600">
                  Considered alternatives: {item.consideredAlternatives.join(" · ")}
                </p>
                <p className="mt-1 text-xs text-stone-600">Action artifact: {item.actionArtifact}</p>
                <p className="mt-1 text-xs text-stone-600">Follow-up cadence: {item.followUpCadence}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-950">Execution Layer</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">Tool execution log</p>
              <div className="mt-2 space-y-2">
                {result.toolInvocations.slice(0, 6).map((toolRun) => (
                  <div key={toolRun.id} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                    <p>
                      {toolRun.tool} · {toolRun.targetEmployeeName} · {toolRun.status}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">{toolRun.summary}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Action artifacts</p>
              <div className="mt-2 space-y-2">
                {result.actionArtifacts.slice(0, 6).map((artifact) => (
                  <div key={artifact.id} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                    <p>
                      {artifact.type} · {artifact.owner} · {artifact.employeeName}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">{artifact.title}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Follow-up task queue</p>
              <div className="mt-2 space-y-2">
                {result.followUpTasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                    <p>
                      {task.employeeName} · {task.owner} · {task.dueIn} · {task.status}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">{task.task}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-950">Supervisor Review</h3>
          <p className={`mt-2 text-sm font-semibold ${healthTone(result.orgHealth.status)}`}>
            Org health: {result.orgHealth.status} ({result.orgHealth.score}/100)
          </p>
          <div className="mt-3 space-y-2">
            {result.orgHealth.anomalies.length === 0 && (
              <p className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
                No anomalies detected in this run.
              </p>
            )}
            {result.orgHealth.anomalies.map((anomaly) => (
              <div key={anomaly.code} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                <p>
                  {anomaly.code} · {anomaly.severity}
                </p>
                <p className="mt-1 text-xs text-stone-600">{anomaly.message}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-stone-700">Recommendation: {result.orgHealth.recommendation}</p>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-950">Impact Simulation</h3>
          <p className="mt-2 text-sm text-stone-700">
            Avg risk: {result.impactSimulation.before.avgRiskScore} → {result.impactSimulation.after.projectedAvgRiskScore}
          </p>
          <p className="mt-1 text-sm text-stone-700">
            Projected meeting hours reduced: {result.impactSimulation.projectedMeetingHoursReduced}h
          </p>
          <p className="mt-1 text-sm text-stone-700">
            Projected focus hours gained: {result.impactSimulation.projectedFocusHoursGained}h
          </p>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-950">Execution Trace</h3>
          <div className="mt-3 space-y-2">
            {result.executionTrace.map((step) => (
              <div key={`${step.step}-${step.name}`} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                <p>
                  {step.phase} · {step.name} · {step.status}
                </p>
                <p className="mt-1 text-xs text-stone-600">{step.output}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-950">Supporting Detail</h3>
          <div className="mt-4 rounded-2xl bg-stone-950 p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-stone-300">{result.selectedEmployeeDetail.employee.name} workload strain score</p>
                <p className="mt-2 text-5xl font-semibold">{result.selectedEmployeeDetail.scoring.overallRiskScore}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${riskStyles[result.selectedEmployeeDetail.scoring.riskBucket]}`}>
                {result.selectedEmployeeDetail.scoring.riskBucket}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-300">{result.selectedEmployeeDetail.analyzer.summary}</p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-stone-900">HR memo</p>
            <p className="mt-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
              {result.hrMemo}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-stone-900">Team heatmap</p>
            <div className="mt-2 space-y-2">
              {result.teamHeatmap.slice(0, 6).map((teamItem) => (
                <div key={teamItem.team} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                  {teamItem.team}: {teamItem.avgRiskScore}/100 ({teamItem.riskBucket}) · {teamItem.employeeCount} members · {teamItem.highRiskMembers} high-risk
                </div>
              ))}
            </div>
          </div>

          {result.interventionQueue.some(
            (item) =>
              item.route === "High: employee nudge + manager brief" ||
              item.route === "Sustained High: HR Ops queue",
          ) && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-900">Manager coaching brief</p>
              <div className="mt-2 space-y-2">
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

          <div className="mt-4">
            <MetricsCards scoring={result.selectedEmployeeDetail.scoring} />
          </div>

          <div className="mt-4 rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h4 className="font-semibold text-stone-950">8-week trend signal</h4>
            <div className="mt-2 grid gap-2 text-sm text-stone-700 md:grid-cols-2">
              <p>Trend direction: {result.selectedEmployeeDetail.monthlyTrend.trendDirection}</p>
              <p>High-risk weeks: {result.selectedEmployeeDetail.monthlyTrend.highRiskWeeks}</p>
              <p>Risk delta: {result.selectedEmployeeDetail.monthlyTrend.riskDelta}</p>
              <p>
                Sustained-high workload pattern:{" "}
                {result.selectedEmployeeDetail.monthlyTrend.sustainedPatternDetected ? "Yes" : "No"}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {result.selectedEmployeeDetail.monthlyTrend.summary}
            </p>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Top drivers</h4>
            <div className="mt-3 space-y-2">
              {result.selectedEmployeeDetail.scoring.topDrivers.map((driver) => (
                <div key={driver} className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  {driver}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
              Three concrete interventions
            </h4>
            <div className="mt-3 space-y-3">
              {result.selectedEmployeeDetail.diplomat.interventions.map((intervention, index) => (
                <RecommendationCard key={intervention.title} intervention={intervention} index={index} />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h4 className="font-semibold text-stone-950">Diplomatic message draft</h4>
            <p className="mt-3 text-sm leading-6 text-stone-700">{result.selectedEmployeeDetail.diplomat.diplomaticMessageDraft}</p>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
              Cleaned-up week preview
            </h4>
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
      </div>
    </section>
  );
}
