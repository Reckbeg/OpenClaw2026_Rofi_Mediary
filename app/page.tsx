"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPanel } from "@/components/CalendarPanel";
import { ResultDashboard } from "@/components/ResultDashboard";
import { SelfAssessmentPanel } from "@/components/SelfAssessmentPanel";
import { defaultEmployeeId, sampleOrgDataset } from "@/src/data/sampleOrg";
import { defaultSelfAssessmentAnswers } from "@/src/modules/scoring/selfAssessment";
import type { AnalyzeResponse, DemoScenario, SelfAssessmentAnswer } from "@/lib/types";

export default function Home() {
  const [answers, setAnswers] = useState<SelfAssessmentAnswer[]>(defaultSelfAssessmentAnswers);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Running Analyst → Executor → Supervisor loop...");
  const [lastScenario, setLastScenario] = useState<DemoScenario | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedEmployee =
    sampleOrgDataset.employees.find((employee) => employee.id === defaultEmployeeId) ??
    sampleOrgDataset.employees[0];
  const selectedMeetings = sampleOrgDataset.calendarsByEmployee[selectedEmployee.id] ?? [];

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, []);

  function handleAnswerChange(questionId: string, score: number) {
    setAnswers((currentAnswers) =>
      currentAnswers.map((answer) =>
        answer.questionId === questionId ? { ...answer, score } : answer,
      ),
    );
  }

  async function runAgentCycle(scenario: DemoScenario) {
    const loadingStages = [
      "Aria is reading workload signals...",
      "Ethan is preparing action artifacts...",
      "Sol is checking the run for anomalies...",
    ];

    setLoadingMessage(loadingStages[0]);
    setIsLoading(true);
    setError(null);
    setLastScenario(scenario);

    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
    }
    let stageIndex = 0;
    loadingTimerRef.current = setInterval(() => {
      stageIndex = (stageIndex + 1) % loadingStages.length;
      setLoadingMessage(loadingStages[stageIndex]);
    }, 1300);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: defaultEmployeeId,
          selfAssessmentAnswers: defaultSelfAssessmentAnswers,
          scenario,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const data = (await response.json()) as AnalyzeResponse;
      setResult(data);
    } catch {
      setError("Mediary could not complete the agent cycle. Please try again.");
    } finally {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
      setIsLoading(false);
      setLoadingMessage("Running Analyst → Executor → Supervisor loop...");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              OpenClaw Agenthon 2026
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              Mediary Agent Command Center
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
              A stateful 3-agent workload diplomacy loop for org-wide workload strain routing.
            </p>
            <p className="mt-3 text-sm text-stone-500">
              Operational workload assistant, not a medical diagnosis tool.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => runAgentCycle("sustained-high")}
              disabled={isLoading}
              className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              Run sustained-high agent cycle
            </button>
            <button
              type="button"
              onClick={() => runAgentCycle("baseline")}
              disabled={isLoading}
              className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400"
            >
              Run baseline cycle
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {!result && !isLoading && (
        <section className="mb-6 rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">3-agent pipeline preview</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
              <h3 className="font-semibold text-stone-900">Aria Analyst</h3>
              <p className="mt-2 text-sm text-stone-700">- scores workload strain</p>
              <p className="mt-1 text-sm text-stone-700">- compares 8-week trend</p>
              <p className="mt-1 text-sm text-stone-700">- routes intervention tier</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
              <h3 className="font-semibold text-stone-900">Ethan Executor</h3>
              <p className="mt-2 text-sm text-stone-700">- invokes internal action adapters</p>
              <p className="mt-1 text-sm text-stone-700">
                - creates HR Ops cases, manager briefs, focus plans
              </p>
              <p className="mt-1 text-sm text-stone-700">- queues follow-up tasks</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
              <h3 className="font-semibold text-stone-900">Sol Supervisor</h3>
              <p className="mt-2 text-sm text-stone-700">- checks anomalies</p>
              <p className="mt-1 text-sm text-stone-700">- assesses org health</p>
              <p className="mt-1 text-sm text-stone-700">- validates pipeline consistency</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-stone-600">
            Demo cycle scans all {sampleOrgDataset.employees.length} employees and shows selected employee detail for{" "}
            {selectedEmployee.name}.
          </p>
        </section>
      )}

      <ResultDashboard
        result={result}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        lastScenario={lastScenario}
      />

      <details className="mt-6 rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-semibold text-stone-950">Signals inspected</summary>
        <p className="mt-3 text-sm text-stone-600">
          Sample inputs used by the loop. These are supporting details, not the primary demo control.
        </p>
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <CalendarPanel
            week={{
              employee: {
                name: selectedEmployee.name,
                role: selectedEmployee.role,
                team: selectedEmployee.team,
              },
              meetings: selectedMeetings,
            }}
          />
          <SelfAssessmentPanel
            answers={answers}
            onAnswerChange={handleAnswerChange}
            isLoading={isLoading}
            showAnalyzeButton={false}
          />
        </div>
      </details>

      {result && (
        <p className="mt-4 text-xs text-stone-500">
          Last completed scenario: {result.scenario}. Use the command buttons above to run another cycle.
        </p>
      )}

      {!result && !isLoading && lastScenario && (
        <p className="mt-4 text-xs text-stone-500">
          Last run request: {lastScenario}. Start a new cycle to load fresh output.
        </p>
      )}
    </main>
  );
}
