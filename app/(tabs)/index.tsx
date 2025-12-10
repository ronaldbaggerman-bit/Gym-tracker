import { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/app/styles/colors';
import { initDatabase } from '@/app/utils/database';

import { ThemedText } from '@/components/themed-text';
import { SchemaSelector } from '@/components/SchemaSelector';
import { ExerciseDetail } from '@/components/ExerciseDetail';
import { WorkoutPlanningScreen } from '@/components/WorkoutPlanningScreen';
import { PRCelebration } from '@/components/PRCelebration';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { WORKOUT_DATA, type Schema } from '@/app/data/workoutData';
import type { WorkoutExercise, ExerciseSet, WorkoutSession } from '@/app/types/workout';
import { loadSessions, saveSession, loadPRs, savePR } from '@/app/utils/storage';
import { loadSettings } from '@/app/utils/settingsStorage';
import { calculateSessionKcal, formatKcalDisplay } from '@/app/utils/kcalCalculator';
import { checkForNewPRs, formatPRMessage } from '@/app/utils/prTracker';
import { loadCustomSchemas, mergeSchemas, applyOverrides } from '@/app/utils/schemaStorage';

const createDefaultSets = (numberOfSets: number = 3): ExerciseSet[] => {
  return Array.from({ length: numberOfSets }, (_, i) => ({
    setNumber: i + 1,
    reps: 12,
    weight: 0,
    completed: false,
    difficulty: 'goed',
  }));
};

const formatWorkoutTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

function LoadingScreen({ insets }: { insets: { top: number } }) {
  return (
    <View style={[styles.loadingContainer, { paddingTop: insets.top + 32 }]}> 
      <View style={styles.loadingCard}>
        <ThemedText type="title" style={styles.loadingTitle}>
          Workout wordt klaargezet
        </ThemedText>
        <ThemedText style={styles.loadingSubtitle}>
          We laden schema's, vorige sessies en PR's...
        </ThemedText>
        <ActivityIndicator size="large" color={COLORS.ACCENT} style={styles.loadingSpinner} />
      </View>
    </View>
  );
}

const SkeletonCard = () => {
  const pulse = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulse }]}> 
      <View style={[styles.skeletonLine, { width: '40%' }]} />
      <View style={[styles.skeletonLine, { width: '70%' }]} />
      <View style={[styles.skeletonLine, { width: '55%' }]} />
      <View style={styles.skeletonPillRow}>
        <View style={[styles.skeletonPill, { width: '32%' }]} />
        <View style={[styles.skeletonPill, { width: '28%' }]} />
        <View style={[styles.skeletonPill, { width: '22%' }]} />
      </View>
    </Animated.View>
  );
};

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [schemas, setSchemas] = useState<Schema[]>(WORKOUT_DATA.schemas);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>(WORKOUT_DATA.schemas[0]?.id ?? 'schema1');
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [planningMode, setPlanningMode] = useState(false);
  const [prs, setPRs] = useState<Record<string, any>>({});
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [bodyWeightKg, setBodyWeightKg] = useState(75);
  const [defaultMET, setDefaultMET] = useState(5);
  const [previousSessions, setPreviousSessions] = useState<any[]>([]);
  const [prCelebration, setPRCelebration] = useState<{ visible: boolean; type: 'weight' | 'reps' | 'both'; exerciseName: string; maxWeight?: number; maxReps?: number } | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const heroAnim = useMemo(() => new Animated.Value(0), []);

  const refreshSchemas = useCallback(async () => {
    const custom = await loadCustomSchemas();
    const withOverrides = await applyOverrides(WORKOUT_DATA.schemas);
    const merged = mergeSchemas(withOverrides, custom);
    setSchemas(merged);
    if (!merged.find(s => s.id === selectedSchemaId) && merged.length > 0) {
      setSelectedSchemaId(merged[0].id);
    }
  }, [selectedSchemaId]);

  // Load PRs, settings, sessions on mount
  useEffect(() => {
    let isActive = true;

    const boot = async () => {
      setIsBooting(true);
      try {
        await initDatabase();
        const [prData, settings, sessions] = await Promise.all([
          loadPRs(),
          loadSettings(),
          loadSessions(),
        ]);

        if (!isActive) return;
        setPRs(prData || {});
        setBodyWeightKg(settings?.bodyWeightKg ?? 75);
        setDefaultMET(settings?.defaultMET ?? 5);
        setPreviousSessions(sessions || []);
      } catch (err) {
        console.warn('Boot load failed', err);
      } finally {
        if (isActive) {
          setIsBooting(false);
          setTimeout(() => setShowSkeleton(false), 600);
          Animated.timing(heroAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    boot();
    return () => {
      isActive = false;
    };
  }, []);

  // Workout timer - increments every second when workout is active
  useEffect(() => {
    if (!workoutSession) {
      setWorkoutSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setWorkoutSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutSession]);

  useFocusEffect(
    useCallback(() => {
      refreshSchemas();
    }, [refreshSchemas])
  );

  const selectedSchema = useMemo(
    () => schemas.find(s => s.id === selectedSchemaId),
    [selectedSchemaId, schemas]
  );

  const exercises: WorkoutExercise[] = useMemo(() => {
    if (!selectedSchema) return [];
    return selectedSchema.muscleGroups.flatMap(mg =>
      mg.exercises.map(ex => {
        const exerciseWithPR: WorkoutExercise = {
          exerciseId: ex.id,
          name: ex.name,
          muscleGroup: mg.name,
          met: ex.met,
          sets: createDefaultSets(3),
          completed: false,
          personalRecord: prs[ex.name], // Load PR if exists
        };
        return exerciseWithPR;
      })
    );
  }, [selectedSchema, prs]);

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
        // Check for PRs and save them
        const prResult = checkForNewPRs(updatedExercise);
        if (prResult) {
          savePR(updatedExercise.name, prResult.updatedPR).catch(err => console.error('Failed to save PR:', err));
          // Update local PRs state
          setPRs(prev => ({ ...prev, [updatedExercise.name]: prResult.updatedPR }));
          
          // Show celebration animation
          let prType: 'weight' | 'reps' | 'both' = 'both';
          if (prResult.newMaxWeight && !prResult.newMaxReps) {
            prType = 'weight';
          } else if (!prResult.newMaxWeight && prResult.newMaxReps) {
            prType = 'reps';
          }
          
          setPRCelebration({
            visible: true,
            type: prType,
            exerciseName: updatedExercise.name,
            maxWeight: prResult.updatedPR.maxWeight,
            maxReps: prResult.updatedPR.maxReps,
          });
        }

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

  const handleStartPlanningMode = () => {
    if (!selectedSchema) return;
    setPlanningMode(true);
  };

  const handleStartWorkoutFromPlan = (plan: any) => {
    if (!selectedSchema) return;

    // Map plan entries to workout exercises
    const exercisesFromPlan = plan.exercises.map(planEntry => {
      const exercise = exercises.find(ex => ex.name === planEntry.exerciseName);
      if (!exercise) return null;

      return {
        ...exercise,
        sets: Array.from({ length: planEntry.targetSets }, (_, i) => ({
          setNumber: i + 1,
          reps: planEntry.targetReps,
          weight: planEntry.targetWeight,
          completed: false,
          difficulty: 'goed' as const,
        })),
        notes: planEntry.notes,
      } as WorkoutExercise;
    }).filter(Boolean);

    setWorkoutSession({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      schemaId: selectedSchema.id,
      schemaName: selectedSchema.name,
      exercises: exercisesFromPlan,
      startTime: new Date(),
      endTime: null,
      completed: false,
    });
    setPlanningMode(false);
  };

  const handleCancelPlanning = () => {
    setPlanningMode(false);
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
      const success = await saveSession(finished);
      if (success) {
        setWorkoutSession(null);
        // Navigate to history tab
        router.push('/(tabs)/explore');
      } else {
        console.error('Failed to save session');
      }
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

  const lastSession = useMemo(
    () => (previousSessions.length > 0 ? previousSessions[previousSessions.length - 1] : null),
    [previousSessions]
  );

  const lastSessionDate = lastSession
    ? new Date(lastSession.date).toLocaleDateString('nl-NL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : null;

  const totalPRs = useMemo(() => Object.keys(prs || {}).length, [prs]);

  const todaysFocus = useMemo(() => {
    if (!selectedSchema) return 'Vrije keuze';
    const focus = selectedSchema.muscleGroups.slice(0, 2).map(mg => mg.name);
    return focus.join(' • ');
  }, [selectedSchema]);

  const heroSubtitle = lastSession
    ? `Laatste: ${lastSession.schemaName || 'Workout'} • ${lastSessionDate}`
    : 'Klaar voor een nieuwe sessie?';

  if (isBooting) {
    return <LoadingScreen insets={insets} />;
  }

  const heroAnimatedStyle = {
    opacity: heroAnim,
    transform: [
      {
        translateY: heroAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {planningMode && selectedSchema ? (
        /* Workout Planning View */
        <WorkoutPlanningScreen
          schema={selectedSchema}
          previousSession={previousSessions.length > 0 ? previousSessions[previousSessions.length - 1] : undefined}
          onStartWorkout={handleStartWorkoutFromPlan}
          onCancel={handleCancelPlanning}
        />
      ) : !workoutSession ? (
        /* Schema Selection View */
        <ScrollView style={styles.selectionView}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <ThemedText type="title">Workout van Vandaag</ThemedText>
            <ThemedText style={styles.subtitle}>{heroSubtitle}</ThemedText>
          </View>

          {showSkeleton ? (
            <View style={styles.skeletonWrap}>
              {[1, 2, 3].map(idx => (
                <SkeletonCard key={idx} />
              ))}
            </View>
          ) : (
            <Animated.View style={[styles.heroCard, heroAnimatedStyle]}>
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.heroEyebrow}>Vandaag</ThemedText>
                  <ThemedText type="title" style={styles.heroTitle}>
                    {selectedSchema?.name || 'Kies een schema'}
                  </ThemedText>
                  <ThemedText style={styles.heroFocus}>Focus: {todaysFocus}</ThemedText>
                </View>
                <View style={styles.heroBadge}>
                  <ThemedText style={styles.heroBadgeText}>Ready</ThemedText>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statLabel}>PR's</ThemedText>
                  <ThemedText style={styles.statValue}>{totalPRs}</ThemedText>
                  <ThemedText style={styles.statMeta}>Schouders omhoog!</ThemedText>
                </View>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statLabel}>Sessies</ThemedText>
                  <ThemedText style={styles.statValue}>{previousSessions.length}</ThemedText>
                  <ThemedText style={styles.statMeta}>
                    {lastSession ? `Laatst ${lastSessionDate}` : 'Nog geen sessies'}
                  </ThemedText>
                </View>
                <View style={styles.statCard}>
                  <ThemedText style={styles.statLabel}>Focus</ThemedText>
                  <ThemedText style={styles.statValueSmaller}>{todaysFocus}</ThemedText>
                  <ThemedText style={styles.statMeta}>Laatste schema</ThemedText>
                </View>
              </View>

              <View style={styles.actionStrip}>
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={handleStartPlanningMode}
                  activeOpacity={0.85}
                >
                  <ThemedText style={styles.actionPillText}>📋 Plan</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionPill, styles.actionPillAccent]}
                  onPress={() => {
                    if (!selectedSchema) return;
                    const exercisesWithDefaults = exercises.map(ex => {
                      const found = previousSessions.find((s: any) =>
                        Array.isArray(s.exercises) && s.exercises.some((se: any) => se.exerciseId === ex.exerciseId)
                      );
                      let defaultWeight = 0;
                      if (found) {
                        const prevEx = found.exercises.find((se: any) => se.exerciseId === ex.exerciseId);
                        if (prevEx && Array.isArray(prevEx.sets)) {
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
                  }}
                  activeOpacity={0.85}
                >
                  <ThemedText style={styles.actionPillTextAccent}>▶️ Start nu</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionPill}
                  onPress={() => router.push('/(tabs)/explore')}
                  activeOpacity={0.85}
                >
                  <ThemedText style={styles.actionPillText}>📜 Historie</ThemedText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <SchemaSelector
            schemas={schemas}
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

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.planButton}
                  onPress={handleStartPlanningMode}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.planButtonText}>
                    📋 Plan
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => {
                    // Quick start without planning
                    if (!selectedSchema) return;
                    const exercisesWithDefaults = exercises.map(ex => {
                      const found = previousSessions.find((s: any) =>
                        Array.isArray(s.exercises) && s.exercises.some((se: any) => se.exerciseId === ex.exerciseId)
                      );
                      let defaultWeight = 0;
                      if (found) {
                        const prevEx = found.exercises.find((se: any) => se.exerciseId === ex.exerciseId);
                        if (prevEx && Array.isArray(prevEx.sets)) {
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
                  }}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.startButtonText}>
                    Start
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
              <ThemedText style={styles.homeButtonText}>X</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Exercises List */}
          <ScrollView style={styles.exercisesView}>
            <View style={styles.exerciseHeader}>
              <View style={styles.headerTop}>
                <View>
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
              </View>

              {/* Timer & Calories Display */}
              <View style={styles.timerKcalContainer}>
                <View style={styles.timerCard}>
                    <ThemedText style={styles.timerLabel}>Tijd</ThemedText>
                  <ThemedText style={styles.timerValue}>{formatWorkoutTime(workoutSeconds)}</ThemedText>
                </View>
                <View style={styles.kcalCard}>
                    <ThemedText style={styles.kcalLabel}>Kcal</ThemedText>
                  <ThemedText style={styles.kcalValue}>
                    {formatKcalDisplay(calculateSessionKcal(bodyWeightKg, Math.floor(workoutSeconds / 60), defaultMET).totalKcal)}
                  </ThemedText>
                </View>
              </View>
            </View>

            {workoutSession.exercises.map(exercise => (
              <ExerciseDetail
                key={exercise.exerciseId}
                exercise={exercise}
                onUpdateExercise={handleUpdateExercise}
                onToggleComplete={() =>
                  handleToggleExerciseComplete(exercise.exerciseId)
                }
                bodyWeightKg={bodyWeightKg}
                defaultMET={defaultMET}
                schema={selectedSchema}
                onExerciseChange={(newName) => {
                  // Find the new exercise in the schema
                  const newExercise = selectedSchema?.muscleGroups
                    .flatMap(mg => mg.exercises)
                    .find(ex => ex.name === newName);
                  
                  if (newExercise) {
                    const updatedEx: WorkoutExercise = {
                      exerciseId: newExercise.id,
                      name: newExercise.name,
                      muscleGroup: selectedSchema!.muscleGroups.find(mg => 
                        mg.exercises.some(e => e.id === newExercise.id)
                      )?.name || exercise.muscleGroup,
                      met: newExercise.met,
                      sets: exercise.sets,
                      completed: false,
                      notes: exercise.notes,
                    };
                    handleUpdateExercise(updatedEx);
                  }
                }}
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

      {prCelebration && (
        <PRCelebration
          visible={prCelebration.visible}
          prType={prCelebration.type}
          maxWeight={prCelebration.maxWeight}
          maxReps={prCelebration.maxReps}
          exerciseName={prCelebration.exerciseName}
          onDismiss={() => setPRCelebration(null)}
        />
      )}

      <OfflineIndicator />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    width: '86%',
    backgroundColor: COLORS.CARD,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  loadingTitle: {
    marginBottom: 8,
  },
  loadingSubtitle: {
    color: COLORS.TEXT_SECONDARY,
  },
  loadingSpinner: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  skeletonWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 8,
    backgroundColor: COLORS.SURFACE,
    marginBottom: 10,
  },
  skeletonPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  skeletonPill: {
    height: 12,
    borderRadius: 12,
    backgroundColor: COLORS.SURFACE,
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
  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroEyebrow: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  heroTitle: {
    marginBottom: 6,
  },
  heroFocus: {
    color: COLORS.ACCENT,
    fontWeight: '600',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  statValueSmaller: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  statMeta: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  actionStrip: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionPill: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  actionPillAccent: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  actionPillText: {
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  actionPillTextAccent: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  manageButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: COLORS.CARD,
    borderColor: COLORS.ACCENT,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageButtonText: {
    color: COLORS.ACCENT,
    fontWeight: '700',
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
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
    lineHeight: 20,
  },
  muscleGroupsList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingVertical: 12,
    marginVertical: 16,
  },
  muscleGroupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  muscleGroupName: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  muscleGroupCount: {
    fontSize: 14,
    color: COLORS.ACCENT,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  planButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  planButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
  startButton: {
    flex: 1,
    backgroundColor: COLORS.ACCENT,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
  headerTop: {
    marginBottom: 12,
  },
  sessionTitle: {
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  timerKcalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timerCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
    fontFamily: 'Courier New',
  },
  kcalCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    alignItems: 'center',
  },
  kcalLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  kcalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
  },
  spacer: {
    height: 20,
  },
});


