import type { WorkoutExercise, PersonalRecord } from '@/app/types/workout';

interface ProgressiveOverloadSuggestion {
  suggestedWeight: number;
  suggestedReps: number;
  reason: string;
  progressType: 'weight' | 'reps' | 'both';
}

/**
 * Calculate progressive overload suggestions based on PR data
 * Strategy: If you hit max weight, suggest +1kg at same reps
 *           If you hit max reps, keep weight and maintain reps
 *           If both, increase weight by 1kg
 */
export function calculateProgressiveOverload(
  pr: PersonalRecord | undefined,
  currentWeight: number = 0,
  currentReps: number = 12,
): ProgressiveOverloadSuggestion | null {
  if (!pr) {
    return null;
  }

  const { maxWeight, maxReps } = pr;

  // No PR yet
  if (maxWeight === 0 && maxReps === 0) {
    return null;
  }

  // Strategy: Progress based on what you achieved last time
  if (maxWeight > 0) {
    // You have a max weight - suggest +1kg at a reasonable rep count
    const nextWeight = maxWeight + 1;
    const targetReps = Math.min(12, maxReps); // Target 12 reps as standard, or less if your max is lower

    return {
      suggestedWeight: nextWeight,
      suggestedReps: targetReps,
      reason: `Vorig max: ${maxWeight}kg × ${maxReps}. Volgende doel: +1kg progressie`,
      progressType: 'weight',
    };
  }

  return null;
}

/**
 * Format suggestion for UI display
 */
export function formatProgressiveSuggestion(suggestion: ProgressiveOverloadSuggestion): string {
  return `📈 Volgende: ${suggestion.suggestedWeight}kg × ${suggestion.suggestedReps}`;
}

/**
 * Get hint text explaining the suggestion
 */
export function getProgressiveOverloadHint(suggestion: ProgressiveOverloadSuggestion): string {
  return suggestion.reason;
}
