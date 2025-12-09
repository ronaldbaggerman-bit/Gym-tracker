import type { WorkoutExercise, PersonalRecord, ExerciseSet } from '@/app/types/workout';

interface PRCheckResult {
  newMaxWeight: boolean;
  newMaxReps: boolean;
  updatedPR: PersonalRecord;
}

/**
 * Check if exercise sets contain new personal records
 * Compares completed sets against existing PR data
 */
export function checkForNewPRs(
  exercise: WorkoutExercise,
): PRCheckResult | null {
  if (!exercise.sets || exercise.sets.length === 0) {
    return null;
  }

  const completedSets = exercise.sets.filter(s => s.completed);
  if (completedSets.length === 0) {
    return null;
  }

  const currentPR = exercise.personalRecord || {
    maxWeight: 0,
    maxReps: 0,
    maxWeightDate: new Date().toISOString(),
    maxRepsDate: new Date().toISOString(),
  };

  const maxWeightInSets = Math.max(...completedSets.map(s => s.weight));
  const maxRepsInSets = Math.max(...completedSets.map(s => s.reps));

  const newMaxWeight = maxWeightInSets > currentPR.maxWeight;
  const newMaxReps = maxRepsInSets > currentPR.maxReps;

  if (!newMaxWeight && !newMaxReps) {
    return null; // No new PRs
  }

  const today = new Date().toISOString();
  const updatedPR: PersonalRecord = {
    maxWeight: newMaxWeight ? maxWeightInSets : currentPR.maxWeight,
    maxReps: newMaxReps ? maxRepsInSets : currentPR.maxReps,
    maxWeightDate: newMaxWeight ? today : currentPR.maxWeightDate,
    maxRepsDate: newMaxReps ? today : currentPR.maxRepsDate,
  };

  return {
    newMaxWeight,
    newMaxReps,
    updatedPR,
  };
}

/**
 * Apply PR data to exercise if new records are found
 */
export function applyPRToExercise(
  exercise: WorkoutExercise,
): WorkoutExercise {
  const prResult = checkForNewPRs(exercise);
  if (!prResult) {
    return exercise;
  }

  return {
    ...exercise,
    personalRecord: prResult.updatedPR,
  };
}

/**
 * Format PR display text
 */
export function formatPRMessage(result: PRCheckResult): string {
  const parts = [];
  if (result.newMaxWeight) {
    parts.push(`🔥 Nieuw max gewicht: ${result.updatedPR.maxWeight}kg`);
  }
  if (result.newMaxReps) {
    parts.push(`💪 Nieuw max reps: ${result.updatedPR.maxReps}`);
  }
  return parts.join('\n');
}

/**
 * Get PR display string for exercise
 */
export function getPRDisplay(exercise: WorkoutExercise): string | null {
  if (!exercise.personalRecord) {
    return null;
  }

  const pr = exercise.personalRecord;
  return `💪 PR: ${pr.maxWeight}kg × ${pr.maxReps}`;
}
