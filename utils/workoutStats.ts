import type { WorkoutExercise, WorkoutSession } from '@/app/types/workout';

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  averageWorkoutDuration: number;
  currentStreak: number;
  longestStreak: number;
  exerciseFrequency: Record<string, number>;
  volumeByWeek: Array<{ week: string; volume: number }>;
  workoutsByMonth: Record<string, number>;
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

export interface ExerciseVolumeSummary {
  name: string;
  totalVolume: number;
  sessionsCount: number;
  bestSessionVolume: number;
  lastSessionVolume: number;
  lastPerformed: string;
  averageVolumePerSession: number;
}

export interface ExerciseVolumeEntry {
  date: string;
  volume: number;
}

export function calculateExerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets
    .filter(s => s.completed)
    .reduce((sum, set) => sum + (set.weight * set.reps), 0);
}

export function calculateWorkoutDuration(session: WorkoutSession): number {
  if (!session.startTime || !session.endTime) return 0;
  const start = new Date(session.startTime).getTime();
  const end = new Date(session.endTime).getTime();
  return Math.round((end - start) / (1000 * 60));
}

export function calculateStreak(sessions: WorkoutSession[]): { current: number; longest: number } {
  if (!sessions || sessions.length === 0) return { current: 0, longest: 0 };

  const sorted = [...sessions]
    .filter(s => s && s.date && (s.completed !== false))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) return { current: 0, longest: 0 };

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  const firstSession = sorted[0];
  if (!firstSession || !firstSession.date) return { current: 0, longest: 0 };
  
  let lastDate = new Date(firstSession.date);
  lastDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysSinceLastWorkout = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastWorkout <= 1) {
    currentStreak = 1;
  }

  for (let i = 1; i < sorted.length; i++) {
    const currentSession = sorted[i];
    if (!currentSession || !currentSession.date) continue;
    
    const currentDate = new Date(currentSession.date);
    currentDate.setHours(0, 0, 0, 0);
    const prevSession = sorted[i - 1];
    if (!prevSession || !prevSession.date) continue;
    
    const prevDate = new Date(prevSession.date);
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

export function getExerciseFrequency(sessions: WorkoutSession[]): Record<string, number> {
  const frequency: Record<string, number> = {};

  if (!sessions || !Array.isArray(sessions)) return frequency;

  sessions.forEach(session => {
    if (!session || !session.exercises || !Array.isArray(session.exercises)) return;
    if (session.completed === false) return;
    session.exercises
      .filter(ex => ex && (ex.completed !== false))
      .forEach(ex => {
        frequency[ex.name] = (frequency[ex.name] || 0) + 1;
      });
  });

  return frequency;
}

export function getVolumeByWeek(sessions: WorkoutSession[]): Array<{ week: string; volume: number }> {
  const weeklyVolume: Record<string, number> = {};

  if (!sessions || !Array.isArray(sessions)) return [];

  sessions.forEach(session => {
    if (!session || !session.date || !session.exercises || !Array.isArray(session.exercises)) return;
    const date = new Date(session.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    const sessionVolume = session.exercises.reduce((sum, ex) => sum + (ex ? calculateExerciseVolume(ex) : 0), 0);
    weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + sessionVolume;
  });

  return Object.entries(weeklyVolume)
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12);
}

export function getWorkoutsByMonth(sessions: WorkoutSession[]): Record<string, number> {
  const monthly: Record<string, number> = {};

  if (!sessions || !Array.isArray(sessions)) return monthly;

  sessions
    .filter(s => s && s.date && (s.completed !== false))
    .forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[monthKey] = (monthly[monthKey] || 0) + 1;
    });

  return monthly;
}

export function getExerciseStats(sessions: WorkoutSession[], exerciseName: string): ExerciseStats | null {
  if (!sessions || !Array.isArray(sessions)) return null;

  const exerciseData = sessions
    .filter(s => s && s.exercises && Array.isArray(s.exercises) && (s.completed !== false))
    .flatMap(s => s.exercises)
    .filter(ex => ex && ex.name === exerciseName && (ex.completed !== false));

  if (exerciseData.length === 0) return null;

  const totalSets = exerciseData.reduce((sum, ex) => sum + (ex.sets ? ex.sets.filter(s => s && s.completed).length : 0), 0);
  const totalReps = exerciseData.reduce((sum, ex) => 
    sum + (ex.sets ? ex.sets.filter(s => s && s.completed).reduce((r, s) => r + s.reps, 0) : 0), 0
  );
  const totalVolume = exerciseData.reduce((sum, ex) => sum + calculateExerciseVolume(ex), 0);
  const weights = exerciseData.flatMap(ex => (ex.sets ? ex.sets.filter(s => s && s.completed).map(s => s.weight) : []));
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const averageWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

  const sessionsWithExercise = sessions.filter(s => 
    s && s.exercises && (s.completed !== false) && s.exercises.some(ex => ex && ex.name === exerciseName && (ex.completed !== false))
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

export function getExerciseVolumeSummary(sessions: WorkoutSession[]): ExerciseVolumeSummary[] {
  if (!sessions || !Array.isArray(sessions)) return [];

  const map: Record<string, ExerciseVolumeSummary> = {};

  sessions
    .filter(s => s && s.exercises && (s.completed !== false))
    .forEach(session => {
      const sessionDate = session.date;
      session.exercises
        .filter(ex => ex && (ex.completed !== false))
        .forEach(ex => {
          const volume = calculateExerciseVolume(ex);
          if (!map[ex.name]) {
            map[ex.name] = {
              name: ex.name,
              totalVolume: 0,
              sessionsCount: 0,
              bestSessionVolume: 0,
              lastSessionVolume: 0,
              lastPerformed: '',
              averageVolumePerSession: 0,
            };
          }

          const entry = map[ex.name];
          entry.totalVolume += volume;
          entry.sessionsCount += 1;
          entry.bestSessionVolume = Math.max(entry.bestSessionVolume, volume);
          const sessionTime = new Date(sessionDate).getTime();

          if (!entry.lastPerformed || sessionTime > new Date(entry.lastPerformed).getTime()) {
            entry.lastPerformed = sessionDate;
            entry.lastSessionVolume = volume;
          }
        });
    });

  return Object.values(map)
    .map(e => ({
      ...e,
      averageVolumePerSession: e.sessionsCount > 0 ? e.totalVolume / e.sessionsCount : 0,
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);
}

export function getExerciseVolumeHistory(sessions: WorkoutSession[], exerciseName: string): ExerciseVolumeEntry[] {
  if (!sessions || !Array.isArray(sessions) || !exerciseName) return [];

  const entries: ExerciseVolumeEntry[] = [];

  sessions
    .filter(s => s && s.exercises && (s.completed !== false))
    .forEach(session => {
      const volume = session.exercises
        .filter(ex => ex && ex.name === exerciseName && (ex.completed !== false))
        .reduce((sum, ex) => sum + calculateExerciseVolume(ex), 0);

      if (volume > 0) {
        entries.push({
          date: session.date,
          volume,
        });
      }
    });

  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function calculateWorkoutStats(sessions: WorkoutSession[]): WorkoutStats {
  if (!sessions || !Array.isArray(sessions)) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      averageWorkoutDuration: 0,
      currentStreak: 0,
      longestStreak: 0,
      exerciseFrequency: {},
      volumeByWeek: [],
      workoutsByMonth: {},
    };
  }

  const completedSessions = sessions.filter(s => s && (s.completed !== false));

  const totalVolume = completedSessions.reduce((sum, session) => {
    if (!session.exercises || !Array.isArray(session.exercises)) return sum;
    return sum + session.exercises.reduce((exSum, ex) => exSum + (ex ? calculateExerciseVolume(ex) : 0), 0);
  }, 0);

  const totalSets = completedSessions.reduce((sum, session) => {
    if (!session.exercises || !Array.isArray(session.exercises)) return sum;
    return sum + session.exercises.reduce((exSum, ex) => 
      exSum + (ex && ex.sets ? ex.sets.filter(s => s && s.completed).length : 0), 0
    );
  }, 0);

  const totalReps = completedSessions.reduce((sum, session) => {
    if (!session.exercises || !Array.isArray(session.exercises)) return sum;
    return sum + session.exercises.reduce((exSum, ex) => 
      exSum + (ex && ex.sets ? ex.sets.filter(s => s && s.completed).reduce((r, s) => r + (s.reps || 0), 0) : 0), 0
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
