import type { Intervention } from "@/lib/types";

type RecommendationCardProps = {
  intervention: Intervention;
  index: number;
};

export function RecommendationCard({ intervention, index }: RecommendationCardProps) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
          {index + 1}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
            {intervention.category}
          </p>
          <h3 className="mt-1 font-semibold text-stone-950">{intervention.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-700">{intervention.action}</p>
          <p className="mt-3 text-xs font-medium text-stone-500">Owner: {intervention.owner}</p>
          <p className="mt-1 text-xs text-stone-500">{intervention.expectedImpact}</p>
        </div>
      </div>
    </article>
  );
}
