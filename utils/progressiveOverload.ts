import type { PersonalRecord } from '@/app/types/workout';

interface ProgressiveOverloadSuggestion {
  suggestedWeight: number;
  suggestedReps: number;
  reason: string;
  progressType: 'weight' | 'reps' | 'both';
}

export function calculateProgressiveOverload(
  pr: PersonalRecord | undefined,
  currentWeight: number = 0,
  currentReps: number = 12,
): ProgressiveOverloadSuggestion | null {
  if (!pr) {
    return null;
  }

  const { maxWeight, maxReps } = pr;

  if (maxWeight === 0 && maxReps === 0) {
    return null;
  }

  if (maxWeight > 0) {
    const nextWeight = maxWeight + 1;
    const targetReps = Math.min(12, maxReps);

    return {
      suggestedWeight: nextWeight,
      suggestedReps: targetReps,
      reason: `Vorig max: ${maxWeight}kg × ${maxReps}. Volgende doel: +1kg progressie`,
      progressType: 'weight',
    };
  }

  return null;
}

export function formatProgressiveSuggestion(suggestion: ProgressiveOverloadSuggestion): string {
  return `📈 Volgende: ${suggestion.suggestedWeight}kg × ${suggestion.suggestedReps}`;
}

export function getProgressiveOverloadHint(suggestion: ProgressiveOverloadSuggestion): string {
  return suggestion.reason;
}
