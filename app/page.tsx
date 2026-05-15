"use client";

import { useState } from "react";
import { CalendarPanel } from "@/components/CalendarPanel";
import { ResultDashboard } from "@/components/ResultDashboard";
import { SelfAssessmentPanel } from "@/components/SelfAssessmentPanel";
import { defaultEmployeeId, sampleOrgDataset } from "@/src/data/sampleOrg";
import { defaultSelfAssessmentAnswers } from "@/src/modules/scoring/selfAssessment";
import type { AnalyzeResponse, SelfAssessmentAnswer } from "@/lib/types";

export default function Home() {
  const [answers, setAnswers] = useState<SelfAssessmentAnswer[]>(defaultSelfAssessmentAnswers);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedEmployee =
    sampleOrgDataset.employees.find((employee) => employee.id === defaultEmployeeId) ??
    sampleOrgDataset.employees[0];
  const selectedMeetings = sampleOrgDataset.calendarsByEmployee[selectedEmployee.id] ?? [];

  function handleAnswerChange(questionId: string, score: number) {
    setAnswers((currentAnswers) =>
      currentAnswers.map((answer) =>
        answer.questionId === questionId ? { ...answer, score } : answer,
      ),
    );
  }

  async function analyzeWorkload() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: defaultEmployeeId,
          selfAssessmentAnswers: answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const data = (await response.json()) as AnalyzeResponse;
      setResult(data);
    } catch {
      setError("Mediary could not complete the workload analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              OpenClaw Agenthon 2026
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              Mediary
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
              An AI workplace diplomat that detects overload risk from calendar patterns and a lightweight
              self-assessment, then proposes diplomatic workflow interventions.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
            Autonomous workflow: observe → reason → decide → execute → follow-up.
          </div>
        </div>
      </header>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-700 shadow-sm">
        Org-wide run analyzes all {sampleOrgDataset.employees.length} employees first, then displays selected employee detail for {selectedEmployee.name}.
      </div>
      <p className="mb-6 text-sm text-stone-500">
        Operational workload assistant, not a medical diagnosis tool.
      </p>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr_1.2fr]">
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
          onAnalyze={analyzeWorkload}
          isLoading={isLoading}
        />
        <ResultDashboard result={result} isLoading={isLoading} />
      </div>
    </main>
  );
}
