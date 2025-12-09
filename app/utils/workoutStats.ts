import type { WorkoutSession, WorkoutExercise } from '@/app/types/workout';

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number; // kg × reps total
  totalSets: number;
  totalReps: number;
  averageWorkoutDuration: number; // minutes
  currentStreak: number; // days in a row
  longestStreak: number;
  exerciseFrequency: Record<string, number>; // exercise name -> count
  volumeByWeek: Array<{ week: string; volume: number }>;
  workoutsByMonth: Record<string, number>; // YYYY-MM -> count
}

export interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  averageWeight: number;
  maxWeight: number;
  timesPerformed: number;
  lastPerformed: string;
}

/**
 * Calculate total volume (weight × reps) for an exercise
 */
export function calculateExerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets
    .filter(s => s.completed)
    .reduce((sum, set) => sum + (set.weight * set.reps), 0);
}

/**
 * Calculate workout duration in minutes
 */
export function calculateWorkoutDuration(session: WorkoutSession): number {
  if (!session.startTime || !session.endTime) return 0;
  const start = new Date(session.startTime).getTime();
  const end = new Date(session.endTime).getTime();
  return Math.round((end - start) / (1000 * 60)); // minutes
}

/**
 * Calculate current workout streak (consecutive days)
 */
export function calculateStreak(sessions: WorkoutSession[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  // Sort by date descending
  const sorted = [...sessions]
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  let lastDate = new Date(sorted[0].date);
  lastDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if last workout was today or yesterday
  const daysSinceLastWorkout = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastWorkout <= 1) {
    currentStreak = 1;
  }

  // Calculate streaks
  for (let i = 1; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i].date);
    currentDate.setHours(0, 0, 0, 0);
    const prevDate = new Date(sorted[i - 1].date);
    prevDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      tempStreak++;
      if (i === 1 && daysSinceLastWorkout <= 1) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  return { current: currentStreak, longest: longestStreak };
}

/**
 * Get exercise frequency (how many times each exercise was performed)
 */
export function getExerciseFrequency(sessions: WorkoutSession[]): Record<string, number> {
  const frequency: Record<string, number> = {};

  sessions.forEach(session => {
    session.exercises
      .filter(ex => ex.completed)
      .forEach(ex => {
        frequency[ex.name] = (frequency[ex.name] || 0) + 1;
      });
  });

  return frequency;
}

/**
 * Calculate volume by week (last 12 weeks)
 */
export function getVolumeByWeek(sessions: WorkoutSession[]): Array<{ week: string; volume: number }> {
  const weeklyVolume: Record<string, number> = {};

  sessions.forEach(session => {
    const date = new Date(session.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];

    const sessionVolume = session.exercises.reduce((sum, ex) => sum + calculateExerciseVolume(ex), 0);
    weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + sessionVolume;
  });

  // Convert to array and sort by date
  return Object.entries(weeklyVolume)
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12); // Last 12 weeks
}

/**
 * Get workouts by month
 */
export function getWorkoutsByMonth(sessions: WorkoutSession[]): Record<string, number> {
  const monthly: Record<string, number> = {};

  sessions
    .filter(s => s.completed)
    .forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[monthKey] = (monthly[monthKey] || 0) + 1;
    });

  return monthly;
}

/**
 * Get detailed stats for a specific exercise across all sessions
 */
export function getExerciseStats(sessions: WorkoutSession[], exerciseName: string): ExerciseStats | null {
  const exerciseData = sessions
    .flatMap(s => s.exercises)
    .filter(ex => ex.name === exerciseName && ex.completed);

  if (exerciseData.length === 0) return null;

  const totalSets = exerciseData.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
  const totalReps = exerciseData.reduce((sum, ex) => 
    sum + ex.sets.filter(s => s.completed).reduce((r, s) => r + s.reps, 0), 0
  );
  const totalVolume = exerciseData.reduce((sum, ex) => sum + calculateExerciseVolume(ex), 0);
  const weights = exerciseData.flatMap(ex => ex.sets.filter(s => s.completed).map(s => s.weight));
  const maxWeight = Math.max(...weights);
  const averageWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

  // Find last performed date
  const sessionsWithExercise = sessions.filter(s => 
    s.exercises.some(ex => ex.name === exerciseName && ex.completed)
  );
  const lastPerformed = sessionsWithExercise.length > 0
    ? new Date(Math.max(...sessionsWithExercise.map(s => new Date(s.date).getTime()))).toISOString()
    : '';

  return {
    name: exerciseName,
    totalSets,
    totalReps,
    totalVolume,
    averageWeight,
    maxWeight,
    timesPerformed: exerciseData.length,
    lastPerformed,
  };
}

/**
 * Calculate comprehensive workout statistics
 */
export function calculateWorkoutStats(sessions: WorkoutSession[]): WorkoutStats {
  const completedSessions = sessions.filter(s => s.completed);

  const totalVolume = completedSessions.reduce((sum, session) => {
    return sum + session.exercises.reduce((exSum, ex) => exSum + calculateExerciseVolume(ex), 0);
  }, 0);

  const totalSets = completedSessions.reduce((sum, session) => {
    return sum + session.exercises.reduce((exSum, ex) => 
      exSum + ex.sets.filter(s => s.completed).length, 0
    );
  }, 0);

  const totalReps = completedSessions.reduce((sum, session) => {
    return sum + session.exercises.reduce((exSum, ex) => 
      exSum + ex.sets.filter(s => s.completed).reduce((r, s) => r + s.reps, 0), 0
    );
  }, 0);

  const durations = completedSessions.map(s => calculateWorkoutDuration(s)).filter(d => d > 0);
  const averageWorkoutDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const { current, longest } = calculateStreak(sessions);

  return {
    totalWorkouts: completedSessions.length,
    totalVolume,
    totalSets,
    totalReps,
    averageWorkoutDuration,
    currentStreak: current,
    longestStreak: longest,
    exerciseFrequency: getExerciseFrequency(sessions),
    volumeByWeek: getVolumeByWeek(sessions),
    workoutsByMonth: getWorkoutsByMonth(sessions),
  };
}
