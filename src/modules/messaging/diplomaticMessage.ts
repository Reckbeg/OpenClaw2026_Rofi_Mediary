import type { Intervention } from "@/src/types/mediary";

export function generateDiplomaticMessage(interventions: [Intervention, Intervention, Intervention]): string {
  return `Hi team, I noticed this week has signs of focus erosion from meeting fragmentation. To protect workflow sustainability while keeping visibility high, could we try three adjustments: ${interventions[0].action} ${interventions[1].action} ${interventions[2].action} This should keep coordination quality high while creating clearer execution time.`;
}
