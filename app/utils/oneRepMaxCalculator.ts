import type { PersonalRecord } from '@/app/types/workout';

/**
 * Calculate estimated 1RM (One-Rep Max) using Epley formula
 * Formula: 1RM = weight × (1 + reps/30)
 *
 * This is one of the most popular and accurate formulas for rep ranges 1-10
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  // Epley formula
  const oneRepMax = weight * (1 + reps / 30);

  // Round to nearest 0.5kg for practical use
  return Math.round(oneRepMax * 2) / 2;
}

/**
 * Calculate 1RM from personal record
 */
export function calculate1RMFromPR(pr: PersonalRecord | undefined): number {
  if (!pr || pr.maxWeight === 0) {
    return 0;
  }

  return calculateOneRepMax(pr.maxWeight, pr.maxReps);
}

/**
 * Get detailed 1RM data
 */
export interface EstimatedOneRepMax {
  estimatedMaxWeight: number;
  baseWeight: number;
  baseReps: number;
  formula: string;
}

export function getEstimated1RM(
  pr: PersonalRecord | undefined,
): EstimatedOneRepMax | null {
  if (!pr || pr.maxWeight === 0) {
    return null;
  }

  const estimated = calculateOneRepMax(pr.maxWeight, pr.maxReps);

  return {
    estimatedMaxWeight: estimated,
    baseWeight: pr.maxWeight,
    baseReps: pr.maxReps,
    formula: `${pr.maxWeight}kg × ${pr.maxReps} → ~${estimated}kg (1RM)`,
  };
}

/**
 * Format 1RM display for UI
 */
export function format1RMDisplay(oneRepMax: number): string {
  if (oneRepMax === 0) {
    return '';
  }
  return `💪 Est. 1RM: ~${oneRepMax}kg`;
}

/**
 * Get estimated reps at a different weight
 * Inverse of Epley: reps = 30 × ((1RM / weight) - 1)
 */
export function estimateRepsAtWeight(
  oneRepMax: number,
  targetWeight: number,
): number {
  if (oneRepMax === 0 || targetWeight === 0) {
    return 0;
  }

  const reps = 30 * ((oneRepMax / targetWeight) - 1);
  return Math.max(1, Math.round(reps)); // At least 1 rep
}

/**
 * Create a simple weight progression chart
 * Shows estimated reps at different weight percentages of 1RM
 */
export function getWeightProgressionChart(
  oneRepMax: number,
): Array<{ percentage: number; weight: number; estimatedReps: number }> {
  if (oneRepMax === 0) {
    return [];
  }

  const percentages = [50, 60, 70, 75, 80, 85, 90, 95];

  return percentages.map(percentage => {
    const weight = Math.round((oneRepMax * percentage / 100) * 2) / 2; // Round to 0.5kg
    const reps = estimateRepsAtWeight(oneRepMax, weight);

    return {
      percentage,
      weight,
      estimatedReps: reps,
    };
  });
}
