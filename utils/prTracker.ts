import type { PersonalRecord, WorkoutExercise } from '@/app/types/workout';

interface PRCheckResult {
  newMaxWeight: boolean;
  newMaxReps: boolean;
  updatedPR: PersonalRecord;
}

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
    return null;
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

export function getPRDisplay(exercise: WorkoutExercise): string | null {
  if (!exercise.personalRecord) {
    return null;
  }

  const pr = exercise.personalRecord;
  return `💪 PR: ${pr.maxWeight}kg × ${pr.maxReps}`;
}
