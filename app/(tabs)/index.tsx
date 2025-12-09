import { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/app/styles/colors';

import { ThemedText } from '@/components/themed-text';
import { SchemaSelector } from '@/components/SchemaSelector';
import { ExerciseDetail } from '@/components/ExerciseDetail';
import { WORKOUT_DATA } from '@/app/data/workoutData';
import type { WorkoutExercise, ExerciseSet, WorkoutSession } from '@/app/types/workout';
import { loadSessions, saveSession } from '@/app/utils/storage';

const createDefaultSets = (numberOfSets: number = 3): ExerciseSet[] => {
  return Array.from({ length: numberOfSets }, (_, i) => ({
    setNumber: i + 1,
    reps: 12,
    weight: 0,
    completed: false,
    difficulty: 'goed',
  }));
};

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>('schema1');
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);

  const selectedSchema = useMemo(
    () => WORKOUT_DATA.schemas.find(s => s.id === selectedSchemaId),
    [selectedSchemaId]
  );

  const exercises: WorkoutExercise[] = useMemo(() => {
    if (!selectedSchema) return [];
    return selectedSchema.muscleGroups.flatMap(mg =>
      mg.exercises.map(ex => ({
        exerciseId: ex.id,
        name: ex.name,
        muscleGroup: mg.name,
        met: ex.met,
        sets: createDefaultSets(3),
        completed: false,
      }))
    );
  }, [selectedSchema]);

  const handleUpdateExercise = (updatedExercise: WorkoutExercise) => {
    setWorkoutSession(prev => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map(ex =>
        ex.exerciseId === updatedExercise.exerciseId ? updatedExercise : ex
      );

      // If the exercise has been marked completed (or all sets completed), save a snapshot
      const isExerciseCompleted =
        updatedExercise.completed || updatedExercise.sets.every(s => s.completed);

      if (isExerciseCompleted) {
        const snapshot = {
          ...prev,
          exercises: updatedExercises,
          endTime: new Date(),
          completed: false,
        };
        // fire-and-forget save; don't block UI
        saveSession(snapshot).catch(e => console.error('autosave error', e));
      }

      return {
        ...prev,
        exercises: updatedExercises,
      };
    });
  };

  const handleToggleExerciseComplete = (exerciseId: number) => {
    setWorkoutSession(prev => {
      if (!prev) return null;
      const updated = prev.exercises.map(ex => {
        if (ex.exerciseId === exerciseId) {
          return { ...ex, completed: !ex.completed };
        }
        return ex;
      });

      // If the toggled exercise became completed, save a snapshot
      const toggled = updated.find(e => e.exerciseId === exerciseId);
      if (toggled && toggled.completed) {
        const snapshot = {
          ...prev,
          exercises: updated,
          endTime: new Date(),
          completed: false,
        };
        saveSession(snapshot).catch(e => console.error('autosave error', e));
      }

      return { ...prev, exercises: updated };
    });
  };

  const handleStartWorkout = async () => {
    if (!selectedSchema) return;

    // Try to load previous sessions to pre-fill weights per exercise
    const sessions = await loadSessions();

    const exercisesWithDefaults = exercises.map(ex => {
      // Find most recent session that contains this exercise
      const found = sessions.find((s: any) =>
        Array.isArray(s.exercises) && s.exercises.some((se: any) => se.exerciseId === ex.exerciseId)
      );

      let defaultWeight = 0;
      if (found) {
        const prevEx = found.exercises.find((se: any) => se.exerciseId === ex.exerciseId);
        if (prevEx && Array.isArray(prevEx.sets)) {
          // take last non-zero weight from previous sets if available
          for (let i = prevEx.sets.length - 1; i >= 0; i--) {
            const w = prevEx.sets[i].weight;
            if (w && w > 0) {
              defaultWeight = w;
              break;
            }
          }
        }
      }

      return {
        ...ex,
        sets: ex.sets.map(s => ({ ...s, weight: defaultWeight })),
      } as WorkoutExercise;
    });

    setWorkoutSession({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      schemaId: selectedSchema.id,
      schemaName: selectedSchema.name,
      exercises: exercisesWithDefaults,
      startTime: new Date(),
      endTime: null,
      completed: false,
    });
  };

  const handleBackToSelection = () => {
    setWorkoutSession(null);
  };

  const handleFinishWorkout = async () => {
    if (!workoutSession) return;
    const finished = {
      ...workoutSession,
      endTime: new Date(),
      completed: true,
    };
    try {
      await saveSession(finished);
      // go back to selection after saving
      setWorkoutSession(null);
    } catch (e) {
      console.error('Error saving session', e);
    }
  };

  const completedExercises = workoutSession
    ? workoutSession.exercises.filter(ex => ex.completed).length
    : 0;

  const totalExercises = exercises.length;
  const completionPercentage = totalExercises > 0
    ? Math.round((completedExercises / totalExercises) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {!workoutSession ? (
        /* Schema Selection View */
        <ScrollView style={styles.selectionView}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <ThemedText type="title">Workout van Vandaag</ThemedText>
            <ThemedText style={styles.subtitle}>
              Selecteer een trainingsschema
            </ThemedText>
          </View>

          <SchemaSelector
            schemas={WORKOUT_DATA.schemas}
            selectedSchemaId={selectedSchemaId}
            onSchemaSelect={setSelectedSchemaId}
          />

          {selectedSchema && (
            <View style={styles.schemaInfo}>
              <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
                {selectedSchema.name}
              </ThemedText>
              <ThemedText style={styles.infoDescription}>
                {selectedSchema.description}
              </ThemedText>

              <View style={styles.muscleGroupsList}>
                {selectedSchema.muscleGroups.map(mg => (
                  <View key={mg.id} style={styles.muscleGroupItem}>
                    <ThemedText style={styles.muscleGroupName}>
                      {mg.name}
                    </ThemedText>
                    <ThemedText style={styles.muscleGroupCount}>
                      {mg.exercises.length} oef.
                    </ThemedText>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartWorkout}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.startButtonText}>
                  Start Workout
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Workout Session View */
        <View style={styles.sessionView}>
          {/* Progress Header */}
          <View style={[styles.progressHeader, { paddingTop: insets.top + 12 }]}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${completionPercentage}%` },
                  ]}
                />
              </View>
              <ThemedText style={styles.progressText}>
                {completedExercises}/{totalExercises}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleBackToSelection}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.homeButtonText}></ThemedText>
            </TouchableOpacity>
          </View>

          {/* Exercises List */}
          <ScrollView style={styles.exercisesView}>
            <View style={styles.exerciseHeader}>
              <ThemedText type="title" style={styles.sessionTitle}>
                {workoutSession.schemaName}
              </ThemedText>
              <ThemedText style={styles.sessionDate}>
                {new Date(workoutSession.date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>

            {workoutSession.exercises.map(exercise => (
              <ExerciseDetail
                key={exercise.exerciseId}
                exercise={exercise}
                onUpdateExercise={handleUpdateExercise}
                onToggleComplete={() =>
                  handleToggleExerciseComplete(exercise.exerciseId)
                }
              />
            ))}

            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinishWorkout}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.finishButtonText}>Beëindig workout</ThemedText>
            </TouchableOpacity>

            <View style={styles.spacer} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  selectionView: {
    flex: 1,
  },
  sessionView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.SURFACE,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  schemaInfo: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#4B4B4B',
    marginBottom: 16,
    lineHeight: 20,
  },
  muscleGroupsList: {
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
    paddingVertical: 12,
    marginVertical: 16,
  },
  muscleGroupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D1D6',
  },
  muscleGroupName: {
    fontSize: 15,
  },
  muscleGroupCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  startButton: {
    marginTop: 16,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.ACCENT,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  finishButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  progressHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D1D6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 12,
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#D1D1D6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  progressText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'right',
  },
  exercisesView: {
    flex: 1,
    paddingVertical: 16,
  },
  exerciseHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sessionTitle: {
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  spacer: {
    height: 20,
  },
});


