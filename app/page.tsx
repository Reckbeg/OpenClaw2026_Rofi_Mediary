"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPanel } from "@/components/CalendarPanel";
import { ResultDashboard } from "@/components/ResultDashboard";
import { SelfAssessmentPanel } from "@/components/SelfAssessmentPanel";
import { defaultEmployeeId, sampleOrgDataset } from "@/src/data/sampleOrg";
import { defaultSelfAssessmentAnswers } from "@/src/modules/scoring/selfAssessment";
import type { AgentStreamEvent, AnalyzeResponse, DemoScenario, SelfAssessmentAnswer } from "@/lib/types";

const LIVE_STREAM_ERROR = "Live agent stream failed. You can still run the standard analysis endpoint.";

function getEventGroupLabel(event: AgentStreamEvent): string {
  if (event.agent) return event.agent;
  if (event.type.startsWith("run.")) return "Run";
  if (event.type.startsWith("analyst.")) return "Aria Analyst";
  if (event.type.startsWith("executor.")) return "Ethan Executor";
  if (event.type.startsWith("supervisor.")) return "Sol Supervisor";
  return "Run";
}

function getEventStatus(event: AgentStreamEvent, index: number, latestIndex: number, isStreaming: boolean): string {
  if (event.type === "run.completed") return "operator dispatch ready";
  if (event.type === "run.failed") return "failed";
  if (isStreaming && index === latestIndex) return "running";
  return "completed";
}

function getStatusClass(status: string): string {
  if (status === "running") return "bg-blue-100 text-blue-800";
  if (status === "operator dispatch ready") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-rose-100 text-rose-800";
  return "bg-stone-100 text-stone-700";
}

export default function Home() {
  const [answers, setAnswers] = useState<SelfAssessmentAnswer[]>(defaultSelfAssessmentAnswers);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [streamEvents, setStreamEvents] = useState<AgentStreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScenario, setLastScenario] = useState<DemoScenario | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  const streamCompletedRef = useRef(false);
  const selectedEmployee =
    sampleOrgDataset.employees.find((employee) => employee.id === defaultEmployeeId) ??
    sampleOrgDataset.employees[0];
  const selectedMeetings = sampleOrgDataset.calendarsByEmployee[selectedEmployee.id] ?? [];

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
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

  function closeStream() {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  }

  async function runFallbackAnalysis() {
    if (!lastScenario) return;

    setIsFallbackLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: defaultEmployeeId,
          selfAssessmentAnswers: defaultSelfAssessmentAnswers,
          scenario: lastScenario,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const data = (await response.json()) as AnalyzeResponse;
      setResult(data);
    } catch {
      setError("Fallback analysis failed. Please try again.");
    } finally {
      setIsFallbackLoading(false);
    }
  }

  function runAgentCycle(scenario: DemoScenario) {
    closeStream();
    streamCompletedRef.current = false;
    setResult(null);
    setStreamEvents([]);
    setError(null);
    setIsStreaming(true);
    setLastScenario(scenario);

    if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
      setError(LIVE_STREAM_ERROR);
      setIsStreaming(false);
      return;
    }

    const source = new EventSource(`/api/agent-stream?scenario=${scenario}`);
    streamRef.current = source;

    source.onmessage = (message) => {
      let event: AgentStreamEvent;
      try {
        event = JSON.parse(message.data) as AgentStreamEvent;
      } catch {
        return;
      }

      setStreamEvents((current) => [...current, event]);

      if (event.type === "run.completed") {
        streamCompletedRef.current = true;
        setResult(event.payload as AnalyzeResponse);
        setIsStreaming(false);
        closeStream();
      }

      if (event.type === "run.failed") {
        setError(LIVE_STREAM_ERROR);
        setIsStreaming(false);
        closeStream();
      }
    };

    source.onerror = () => {
      if (streamCompletedRef.current) {
        return;
      }
      setError(LIVE_STREAM_ERROR);
      setIsStreaming(false);
      closeStream();
    };
  }

  const isBusy = isStreaming || isFallbackLoading;
  const showLiveRunPanel = isStreaming || (!result && streamEvents.length > 0);
  const latestEventIndex = streamEvents.length - 1;

  return (
    <main className="mx-auto min-h-screen max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              OPENCLAW AGENTHON 2026
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              Mediary AI Workplace Diplomat
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
              Mediary detects invisible overload patterns before they turn into burnout, then routes the right
              workload intervention to the right team.
            </p>
            <p className="mt-3 text-sm text-stone-500">
              Built for HR and people teams to spot workload strain early, explain the risk, and coordinate practical
              next steps.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => runAgentCycle("sustained-high")}
              disabled={isBusy}
              className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              Simulate high overload
            </button>
            <button
              type="button"
              onClick={() => runAgentCycle("baseline")}
              disabled={isBusy}
              className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400"
            >
              Simulate normal workload
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p>{error}</p>
          <button
            type="button"
            onClick={runFallbackAnalysis}
            disabled={isBusy || !lastScenario}
            className="mt-3 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Run standard analysis endpoint fallback
          </button>
        </div>
      )}

      {!result && !isStreaming && streamEvents.length === 0 && (
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

      {showLiveRunPanel && (
        <section className="mb-6 rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Live agent run</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">Server-streamed Mediary cycle</h2>
          <p className="mt-2 text-sm text-stone-600">
            Live backend events from the Mediary agent run. Final output appears only after run.completed.
          </p>
          <div className="mt-4 space-y-3">
            {streamEvents.map((event, index) => {
              const status = getEventStatus(event, index, latestEventIndex, isStreaming);
              return (
                <article key={`${event.type}-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                      {getEventGroupLabel(event)}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                      {event.type}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
                      {status}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-stone-900">{event.title}</h3>
                  <p className="mt-1 text-sm text-stone-700">{event.detail}</p>
                </article>
              );
            })}
            {isStreaming && streamEvents.length === 0 && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-sm text-stone-600">
                Waiting for stream events...
              </div>
            )}
          </div>
        </section>
      )}

      {result && (
        <>
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            Operator dispatch ready. Full output rendered below.
          </div>
          <ResultDashboard result={result} lastScenario={lastScenario} />
        </>
      )}

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
            isLoading={isBusy}
            showAnalyzeButton={false}
          />
        </div>
      </details>

      {result && (
        <p className="mt-4 text-xs text-stone-500">
          Last completed scenario: {result.scenario}. Use the command buttons above to run another cycle.
        </p>
      )}

      {!result && !isBusy && lastScenario && (
        <p className="mt-4 text-xs text-stone-500">
          Last run request: {lastScenario}. Start a new cycle to load fresh output.
        </p>
      )}
    </main>
  );
}
