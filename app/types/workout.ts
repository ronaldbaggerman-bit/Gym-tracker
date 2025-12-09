import type { ViewStyle, TextStyle } from 'react-native';

export type DifficultyRating = 'licht' | 'goed' | 'zwaar';

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number; // in kg
  completed: boolean;
  difficulty: DifficultyRating | null;
}

export interface PersonalRecord {
  maxWeight: number; // heaviest weight ever lifted
  maxReps: number; // most reps ever done
  maxWeightDate: string; // ISO date
  maxRepsDate: string; // ISO date
}

export interface WorkoutExercise {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  met: number;
  sets: ExerciseSet[];
  completed: boolean;
  personalRecord?: PersonalRecord; // optional PR data
}

export interface WorkoutSession {
  id: string;
  date: string;
  schemaId: string;
  schemaName: string;
  exercises: WorkoutExercise[];
  startTime: Date | null;
  endTime: Date | null;
  completed: boolean;
}

export const DIFFICULTY_OPTIONS: { label: string; value: DifficultyRating }[] = [
  { label: 'Licht', value: 'licht' },
  { label: 'Goed', value: 'goed' },
  { label: 'Zwaar', value: 'zwaar' },
];

export const DIFFICULTY_COLORS: Record<DifficultyRating, string> = {
  licht: '#FF9500',  // Orange
  goed: '#34C759',   // Green
  zwaar: '#FF3B30',  // Red
};

// Re-export React Native types
export type { ViewStyle, TextStyle };
