/**
 * Kilocalories (kcal) Calculator for Workout Sessions
 * 
 * Formula: kcal = MET × body weight (kg) × duration (hours)
 * 
 * MET (Metabolic Equivalent) values by exercise type:
 * - General strength training: 5-6 MET
 * - Intense strength training: 6-8 MET
 * - Moderate intensity: 4-5 MET
 * - Light intensity: 2-3 MET
 */

import type { WorkoutSession, WorkoutExercise } from '@/app/types/workout';

export interface KcalStats {
  totalKcal: number;
  durationMinutes: number;
  durationHours: number;
  perMinute: number;
}

/**
 * Calculate total kcal burned during a workout session
 * @param bodyWeightKg User's body weight in kilograms
 * @param durationMinutes Total workout duration in minutes
 * @param metValue Metabolic Equivalent value (default 5 for strength training)
 * @returns KcalStats with total kcal and breakdown
 */
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

/**
 * Calculate kcal per exercise based on sets and reps
 * Estimates duration: ~3-4 seconds per rep + rest between sets
 * @param exercise WorkoutExercise with sets and completed status
 * @param bodyWeightKg User's body weight
 * @param metValue MET value (can vary by exercise intensity)
 * @returns Estimated kcal burned for this exercise
 */
export const calculateExerciseKcal = (
  exercise: WorkoutExercise,
  bodyWeightKg: number,
  metValue: number = 5
): number => {
  if (!exercise.sets || exercise.sets.length === 0 || bodyWeightKg <= 0) {
    return 0;
  }

  // Estimate duration per set:
  // - Reps: ~3 seconds per rep
  // - Rest: ~90 seconds per set (except last)
  const avgReps = exercise.sets.reduce((sum, s) => sum + s.reps, 0) / exercise.sets.length;
  const repsTime = avgReps * 3; // seconds per rep
  const restTime = 90; // seconds between sets
  const estimatedSecPerSet = repsTime + restTime;
  const totalSeconds = estimatedSecPerSet * exercise.sets.length;
  const durationHours = totalSeconds / 3600;

  return Math.round(metValue * bodyWeightKg * durationHours);
};

/**
 * Format kcal display
 * @param kcal Kilocalories value
 * @returns Formatted string like "245 kcal"
 */
export const formatKcalDisplay = (kcal: number): string => {
  return `${Math.round(kcal)} kcal`;
};

/**
 * Get MET value adjustment based on exercise difficulty
 * @param difficulty Exercise difficulty rating ('licht', 'goed', 'zwaar')
 * @param baseMET Base MET value
 * @returns Adjusted MET value
 */
export const getMetAdjustment = (
  difficulty: string | null | undefined,
  baseMET: number = 5
): number => {
  switch (difficulty) {
    case 'licht':
      return baseMET * 0.8; // 20% lower for light difficulty
    case 'goed':
      return baseMET; // Standard
    case 'zwaar':
      return baseMET * 1.3; // 30% higher for heavy difficulty
    default:
      return baseMET;
  }
};

/**
 * Calculate total kcal for entire workout session
 * Takes into account session start/end times
 * @param session WorkoutSession
 * @param bodyWeightKg User's body weight
 * @param defaultMET Default MET value
 * @returns Total kcal burned
 */
export const calculateTotalSessionKcal = (
  session: WorkoutSession,
  bodyWeightKg: number,
  defaultMET: number = 5
): number => {
  if (!session.startTime || !session.endTime) {
    // Fallback to exercise-based calculation
    if (!session.exercises || session.exercises.length === 0) return 0;
    
    return session.exercises.reduce((total, exercise) => {
      return total + calculateExerciseKcal(exercise, bodyWeightKg, defaultMET);
    }, 0);
  }

  // Calculate from actual duration
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  return Math.round(calculateSessionKcal(bodyWeightKg, durationMinutes, defaultMET).totalKcal);
};
