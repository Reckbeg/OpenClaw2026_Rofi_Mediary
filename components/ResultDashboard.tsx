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

export function ResultDashboard({ result, isLoading }: ResultDashboardProps) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Agent output</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-950">Workflow diplomacy</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Deterministic analyzer and diplomat agents produce operational, non-clinical interventions.
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
          <div className="rounded-2xl bg-stone-950 p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-stone-300">Overload risk score</p>
                <p className="mt-2 text-5xl font-semibold">{result.scoring.overallRiskScore}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${riskStyles[result.scoring.riskBucket]}`}>
                {result.scoring.riskBucket}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-300">{result.analyzer.summary}</p>
          </div>

          <MetricsCards scoring={result.scoring} />

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">Top drivers</h3>
            <div className="mt-3 space-y-2">
              {result.scoring.topDrivers.map((driver) => (
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
              {result.diplomat.interventions.map((intervention, index) => (
                <RecommendationCard key={intervention.title} intervention={intervention} index={index} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <h3 className="font-semibold text-stone-950">Diplomatic message draft</h3>
            <p className="mt-3 text-sm leading-6 text-stone-700">{result.diplomat.diplomaticMessageDraft}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
              Cleaned-up week preview
            </h3>
            <div className="mt-3 space-y-3">
              {result.diplomat.cleanedWeekPreview.map((day) => (
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
