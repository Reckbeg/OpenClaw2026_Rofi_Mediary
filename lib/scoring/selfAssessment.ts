import type { SelfAssessmentAnswer, SelfAssessmentQuestion } from "@/lib/types";

export const selfAssessmentQuestions: SelfAssessmentQuestion[] = [
  {
    id: "emotionally-drained",
    prompt: "I feel emotionally drained by my work.",
    isPositive: false,
  },
  {
    id: "personal-energy",
    prompt: "After work, I still have enough energy for personal life.",
    isPositive: true,
  },
  {
    id: "meeting-overload",
    prompt: "I feel overloaded by meetings and interruptions.",
    isPositive: false,
  },
  {
    id: "focus-capacity",
    prompt: "I can focus on important work without constant disruption.",
    isPositive: true,
  },
  {
    id: "team-support",
    prompt: "I feel supported by my team or manager.",
    isPositive: true,
  },
];

export const defaultSelfAssessmentAnswers: SelfAssessmentAnswer[] = selfAssessmentQuestions.map(
  (question) => ({
    questionId: question.id,
    score: question.isPositive ? 3 : 4,
  }),
);

export function calculateEnergyStrainScore(answers: SelfAssessmentAnswer[]): number {
  const scoreByQuestion = new Map(answers.map((answer) => [answer.questionId, clampScale(answer.score)]));
  const normalizedScores = selfAssessmentQuestions.map((question) => {
    const rawScore = scoreByQuestion.get(question.id) ?? 3;
    const strainScore = question.isPositive ? 6 - rawScore : rawScore;

    return ((strainScore - 1) / 4) * 100;
  });

  const average =
    normalizedScores.reduce((total, score) => total + score, 0) / normalizedScores.length;

  return Math.round(average);
}

function clampScale(score: number): number {
  return Math.min(5, Math.max(1, Math.round(score)));
}
