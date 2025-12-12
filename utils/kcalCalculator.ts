import type { WorkoutExercise, WorkoutSession } from '@/app/types/workout';

export interface KcalStats {
  totalKcal: number;
  durationMinutes: number;
  durationHours: number;
  perMinute: number;
}

export const calculateSessionKcal = (
  bodyWeightKg: number,
  durationMinutes: number,
  metValue: number = 5
): KcalStats => {
  if (bodyWeightKg <= 0 || durationMinutes <= 0) {
    return {
      totalKcal: 0,
      durationMinutes: 0,
      durationHours: 0,
      perMinute: 0,
    };
  }

  const durationHours = durationMinutes / 60;
  const totalKcal = Math.round(metValue * bodyWeightKg * durationHours);
  const perMinute = Math.round(totalKcal / durationMinutes);

  return {
    totalKcal,
    durationMinutes,
    durationHours: parseFloat(durationHours.toFixed(2)),
    perMinute,
  };
};

export const calculateExerciseKcal = (
  exercise: WorkoutExercise,
  bodyWeightKg: number,
  metValue: number = 5
): number => {
  if (!exercise.sets || exercise.sets.length === 0 || bodyWeightKg <= 0) {
    return 0;
  }

  const avgReps = exercise.sets.reduce((sum, s) => sum + s.reps, 0) / exercise.sets.length;
  const repsTime = avgReps * 3;
  const restTime = 90;
  const estimatedSecPerSet = repsTime + restTime;
  const totalSeconds = estimatedSecPerSet * exercise.sets.length;
  const durationHours = totalSeconds / 3600;

  return Math.round(metValue * bodyWeightKg * durationHours);
};

export const formatKcalDisplay = (kcal: number): string => {
  return `${Math.round(kcal)} kcal`;
};

export const getMetAdjustment = (
  difficulty: string | null | undefined,
  baseMET: number = 5
): number => {
  switch (difficulty) {
    case 'licht':
      return baseMET * 0.8;
    case 'goed':
      return baseMET;
    case 'zwaar':
      return baseMET * 1.3;
    default:
      return baseMET;
  }
};

export const calculateTotalSessionKcal = (
  session: WorkoutSession,
  bodyWeightKg: number,
  defaultMET: number = 5
): number => {
  if (!session.startTime || !session.endTime) {
    if (!session.exercises || session.exercises.length === 0) return 0;
    
    return session.exercises.reduce((total, exercise) => {
      return total + calculateExerciseKcal(exercise, bodyWeightKg, defaultMET);
    }, 0);
  }

  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  return Math.round(calculateSessionKcal(bodyWeightKg, durationMinutes, defaultMET).totalKcal);
};
