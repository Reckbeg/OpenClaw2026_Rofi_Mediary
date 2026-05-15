import { selfAssessmentQuestions } from "@/src/modules/scoring/selfAssessment";
import type { SelfAssessmentAnswer } from "@/lib/types";

type SelfAssessmentPanelProps = {
  answers: SelfAssessmentAnswer[];
  onAnswerChange: (questionId: string, score: number) => void;
  onAnalyze?: () => void;
  isLoading: boolean;
  showAnalyzeButton?: boolean;
};

const scaleLabels = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

export function SelfAssessmentPanel({
  answers,
  onAnswerChange,
  onAnalyze,
  isLoading,
  showAnalyzeButton = true,
}: SelfAssessmentPanelProps) {
  const scoreByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.score]));

  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Self-assessment</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-950">Five quick signals</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Calibrate calendar patterns with a lightweight check-in. This is operational context, not a
          diagnosis.
        </p>
      </div>

      <div className="space-y-5">
        {selfAssessmentQuestions.map((question) => (
          <fieldset key={question.id} className="rounded-2xl border border-stone-100 bg-stone-50/70 p-4">
            <legend className="text-sm font-medium leading-6 text-stone-900">{question.prompt}</legend>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className={`cursor-pointer rounded-xl border px-2 py-3 text-center text-sm transition ${
                    scoreByQuestion.get(question.id) === score
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-stone-200 bg-white text-stone-600 hover:border-emerald-200"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name={question.id}
                    value={score}
                    checked={scoreByQuestion.get(question.id) === score}
                    onChange={() => onAnswerChange(question.id, score)}
                  />
                  {score}
                </label>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-stone-500">
              <span>{scaleLabels[0]}</span>
              <span>{scaleLabels[4]}</span>
            </div>
          </fieldset>
        ))}
      </div>

      {showAnalyzeButton && onAnalyze && (
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="mt-6 w-full rounded-2xl bg-stone-950 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isLoading ? "Analyzing workload..." : "Analyze workload"}
        </button>
      )}
    </section>
  );
}
