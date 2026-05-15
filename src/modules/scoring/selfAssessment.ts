import type { SelfAssessmentAnswer, SelfAssessmentQuestion } from "@/src/types/mediary";

export const selfAssessmentQuestions: SelfAssessmentQuestion[] = [
  { id: "emotionally-drained", prompt: "I feel emotionally drained by my work.", isPositive: false },
  { id: "personal-energy", prompt: "After work, I still have enough energy for personal life.", isPositive: true },
  { id: "meeting-overload", prompt: "I feel overloaded by meetings and interruptions.", isPositive: false },
  { id: "focus-capacity", prompt: "I can focus on important work without constant disruption.", isPositive: true },
  { id: "team-support", prompt: "I feel supported by my team or manager.", isPositive: true },
];

export const defaultSelfAssessmentAnswers: SelfAssessmentAnswer[] = selfAssessmentQuestions.map((q) => ({
  questionId: q.id,
  score: q.isPositive ? 3 : 4,
}));

function clampScore(score: number): number {
  return Math.min(5, Math.max(1, Math.round(score)));
}

export function calculateEnergyStrainScore(answers: SelfAssessmentAnswer[]): number {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, clampScore(answer.score)]));
  const normalized = selfAssessmentQuestions.map((question) => {
    const raw = answerMap.get(question.id) ?? 3;
    const strain = question.isPositive ? 6 - raw : raw;
    return ((strain - 1) / 4) * 100;
  });
  return Math.round(normalized.reduce((sum, score) => sum + score, 0) / normalized.length);
}
