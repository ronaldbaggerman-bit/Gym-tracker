import type { WorkoutSession } from '@/app/types/workout';

export interface ProgressionDataPoint {
  date: string;
  weight: number;
  reps: number;
  sets: number;
  timestamp: number; // milliseconds for sorting
}

export interface ExerciseProgressionData {
  exerciseName: string;
  dataPoints: ProgressionDataPoint[];
}

/**
 * Extract progression data for a specific exercise from workout sessions
 * @param sessions Workout sessions to analyze
 * @param exerciseName Name of the exercise to track
 * @param daysBack Number of days back to include (0 = all)
 * @returns Array of progression data points, sorted by date
 */
export const getExerciseProgressionData = (
  sessions: WorkoutSession[],
  exerciseName: string,
  daysBack: number = 180
): ProgressionDataPoint[] => {
  if (!sessions || sessions.length === 0) return [];

  const cutoffDate = daysBack > 0 
    ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    : new Date(0);

  const dataPoints: ProgressionDataPoint[] = [];

  sessions.forEach(session => {
    // Parse date - handle both string (YYYY-MM-DD) and Date formats
    let sessionDate: Date;
    if (typeof session.date === 'string') {
      const [year, month, day] = session.date.split('-').map(Number);
      sessionDate = new Date(year, month - 1, day); // Local timezone
    } else {
      sessionDate = new Date(session.date);
    }
    
    // Filter by date range
    if (sessionDate < cutoffDate) return;

    // Find exercises matching the name (case-insensitive)
    const matchingExercises = session.exercises.filter(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    matchingExercises.forEach(exercise => {
      if (!exercise.sets || exercise.sets.length === 0) return;

      // Find the maximum weight from sets with weight
      let maxWeight = 0;
      let totalReps = 0;
      let setsWithWeight = 0;

      exercise.sets.forEach(set => {
        // Accept any set with weight data (completed flag may be missing in old data)
        if (set.weight !== undefined && set.weight !== null && set.weight >= 0) {
          maxWeight = Math.max(maxWeight, set.weight);
          totalReps += set.reps || 0;
          setsWithWeight++;
        }
      });

      if (setsWithWeight > 0) {
        dataPoints.push({
          date: session.date,
          weight: maxWeight,
          reps: Math.round(totalReps / setsWithWeight), // Average reps
          sets: setsWithWeight,
          timestamp: sessionDate.getTime(),
        });
      }
    });
  });

  // Sort by date (ascending)
  dataPoints.sort((a, b) => a.timestamp - b.timestamp);

  // Remove duplicates - keep only the heaviest weight per day
  const uniqueByDate = new Map<string, ProgressionDataPoint>();
  dataPoints.forEach(point => {
    const existing = uniqueByDate.get(point.date);
    if (!existing || existing.weight < point.weight) {
      uniqueByDate.set(point.date, point);
    }
  });

  return Array.from(uniqueByDate.values()).sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Get all exercises that have progression data
 * @param sessions Workout sessions
 * @param schemaId Optional filter by schema
 * @returns Array of unique exercise names with progression data
 */
export const getExercisesWithProgress = (
  sessions: WorkoutSession[],
  schemaId?: string
): string[] => {
  const exerciseNames = new Set<string>();

  sessions.forEach(session => {
    // Filter by schema if specified
    // Handle both "schema1" and "schema-1" formats (normalize by removing hyphens)
    if (schemaId) {
      const normalizedSessionId = session.schemaId.replace(/-/g, '');
      const normalizedSchemaId = schemaId.replace(/-/g, '');
      if (normalizedSessionId !== normalizedSchemaId) return;
    }

    session.exercises.forEach(exercise => {
      // Accept exercises with any sets that have weight data (completed flag may be missing in old data)
      if (exercise.sets?.some(s => s.weight !== undefined && s.weight !== null)) {
        exerciseNames.add(exercise.name);
      }
    });
  });

  return Array.from(exerciseNames).sort();
};

/**
 * Get list of schemas that have any progression data
 * @param sessions Workout sessions
 * @returns Array of schema IDs with data
 */
export const getSchemasWithProgress = (sessions: WorkoutSession[]): string[] => {
  const schemaIds = new Set<string>();

  sessions.forEach(session => {
    // Accept any session with exercises that have sets with weight data
    if (session.exercises?.some(ex => ex.sets?.some(s => s.weight !== undefined && s.weight !== null))) {
      // Normalize schema IDs (remove hyphens to match both "schema1" and "schema-1")
      const normalizedId = session.schemaId.replace(/-/g, '');
      schemaIds.add(normalizedId);
    }
  });

  return Array.from(schemaIds);
};

/**
 * Calculate progression metrics for an exercise
 */
export const calculateProgressionMetrics = (dataPoints: ProgressionDataPoint[]) => {
  if (dataPoints.length === 0) {
    return {
      currentWeight: 0,
      startWeight: 0,
      totalProgress: 0,
      percentProgress: 0,
      workoutCount: 0,
      dateRange: { start: '', end: '' },
    };
  }

  const currentWeight = dataPoints[dataPoints.length - 1].weight;
  const startWeight = dataPoints[0].weight;
  const totalProgress = currentWeight - startWeight;
  const percentProgress = startWeight > 0 ? (totalProgress / startWeight) * 100 : 0;

  return {
    currentWeight,
    startWeight,
    totalProgress,
    percentProgress: Math.round(percentProgress * 100) / 100,
    workoutCount: dataPoints.length,
    dateRange: {
      start: dataPoints[0].date,
      end: dataPoints[dataPoints.length - 1].date,
    },
  };
};
