import type { PersonalRecord } from '@/app/types/workout';

export function calculateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  const oneRepMax = weight * (1 + reps / 30);
  return Math.round(oneRepMax * 2) / 2;
}

export function calculate1RMFromPR(pr: PersonalRecord | undefined): number {
  if (!pr || pr.maxWeight === 0) {
    return 0;
  }

  return calculateOneRepMax(pr.maxWeight, pr.maxReps);
}

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

export function format1RMDisplay(oneRepMax: number): string {
  if (oneRepMax === 0) {
    return '';
  }
  return `💪 Est. 1RM: ~${oneRepMax}kg`;
}

export function estimateRepsAtWeight(
  oneRepMax: number,
  targetWeight: number,
): number {
  if (oneRepMax === 0 || targetWeight === 0) {
    return 0;
  }

  const reps = 30 * ((oneRepMax / targetWeight) - 1);
  return Math.max(1, Math.round(reps));
}

export function getWeightProgressionChart(
  oneRepMax: number,
): Array<{ percentage: number; weight: number; estimatedReps: number }> {
  if (oneRepMax === 0) {
    return [];
  }

  const percentages = [50, 60, 70, 75, 80, 85, 90, 95];

  return percentages.map(percentage => {
    const weight = Math.round((oneRepMax * percentage / 100) * 2) / 2;
    const reps = estimateRepsAtWeight(oneRepMax, weight);

    return {
      percentage,
      weight,
      estimatedReps: reps,
    };
  });
}
