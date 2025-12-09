import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DIFFICULTY_COLORS } from '@/app/types/workout';
import { COLORS } from '@/app/styles/colors';
import * as Haptics from 'expo-haptics';
import type { WorkoutExercise, DifficultyRating } from '@/app/types/workout';

interface ExerciseDetailProps {
  exercise: WorkoutExercise;
  onUpdateExercise: (updatedExercise: WorkoutExercise) => void;
  onToggleComplete: () => void;
}

export function ExerciseDetail({ exercise, onUpdateExercise, onToggleComplete }: ExerciseDetailProps) {
  const [setsCount, setSetsCount] = useState<number>(exercise.sets.length);
  const [weightValue, setWeightValue] = useState<number>(exercise.sets?.[0]?.weight || 0);
  const [repsValue, setRepsValue] = useState<number>(exercise.sets?.[0]?.reps || 12);
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null);
  const [timerValues, setTimerValues] = useState<Record<number, number>>({});
  const [runningTimers, setRunningTimers] = useState<Set<number>>(new Set());
  const timerIntervals = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    // Initialize timer values for all sets
    const initialTimers: Record<number, number> = {};
    exercise.sets.forEach(s => {
      initialTimers[s.setNumber] = 90; // 90 seconds rest between sets
    });
    setTimerValues(initialTimers);
  }, [exercise]);

  // Effect to handle timer completion haptic feedback
  useEffect(() => {
    Object.entries(timerValues).forEach(([setNumStr, timeLeft]) => {
      if (timeLeft === 0 && !runningTimers.has(Number(setNumStr))) {
        // Timer just finished - trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(err => console.warn('Haptic impact failed:', err));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(err => console.warn('Haptic notification failed:', err));
      }
    });
  }, [timerValues]);

  const updateSetsCount = (newCount: number) => {
    if (newCount < 1) return;
    const current = exercise.sets || [];
    const updatedSets = [] as typeof exercise.sets;
    for (let i = 0; i < newCount; i++) {
      if (i < current.length) {
        updatedSets.push({ ...current[i], setNumber: i + 1 });
      } else {
        updatedSets.push({
          setNumber: i + 1,
          reps: repsValue || 12,
          weight: weightValue || 0,
          completed: false,
          difficulty: 'goed',
        });
      }
    }
    setSetsCount(newCount);
    onUpdateExercise({ ...exercise, sets: updatedSets });
  };

  const updateAllWeights = (newWeight: number) => {
    const updatedSets = (exercise.sets || []).map(s => ({ ...s, weight: newWeight }));
    setWeightValue(newWeight);
    onUpdateExercise({ ...exercise, sets: updatedSets });
  };

  const cycleRating = () => {
    const order: Array<DifficultyRating | null> = [null, 'licht', 'goed', 'zwaar'];
    const current: DifficultyRating | null = (exercise.sets?.[0]?.difficulty as DifficultyRating) || null;
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];
    const updatedSets = (exercise.sets || []).map(s => ({ ...s, difficulty: next }));
    onUpdateExercise({ ...exercise, sets: updatedSets });
  };

  const updateAllReps = (newReps: number) => {
    const updatedSets = (exercise.sets || []).map(s => ({ ...s, reps: newReps }));
    setRepsValue(newReps);
    onUpdateExercise({ ...exercise, sets: updatedSets });
  };

  const startTimer = (setNumber: number) => {
    if (runningTimers.has(setNumber)) return; // already running
    const newRunning = new Set(runningTimers);
    newRunning.add(setNumber);
    setRunningTimers(newRunning);

    timerIntervals.current[setNumber] = setInterval(() => {
      setTimerValues(prev => {
        const newVal = Math.max(0, (prev[setNumber] || 0) - 1);
        if (newVal === 0) {
          // Timer finished, stop it
          clearInterval(timerIntervals.current[setNumber]);
          setRunningTimers(r => {
            const updated = new Set(r);
            updated.delete(setNumber);
            return updated;
          });
        }
        return { ...prev, [setNumber]: newVal };
      });
    }, 1000);
  };

  const pauseTimer = (setNumber: number) => {
    clearInterval(timerIntervals.current[setNumber]);
    setRunningTimers(r => {
      const updated = new Set(r);
      updated.delete(setNumber);
      return updated;
    });
  };

  const resetTimer = (setNumber: number) => {
    pauseTimer(setNumber);
    setTimerValues(prev => ({ ...prev, [setNumber]: 90 })); // Reset to 90 seconds
  };

  const markSetComplete = (setIndex: number) => {
    pauseTimer(exercise.sets[setIndex].setNumber);
    const updatedSets = [...exercise.sets];
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      completed: !updatedSets[setIndex].completed,
    };
    onUpdateExercise({ ...exercise, sets: updatedSets });
  };

  const completedSets = exercise.sets.filter(s => s.completed).length;
  const currentDifficulty = exercise.sets?.[0]?.difficulty;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={[
          styles.header,
          exercise.completed && styles.headerCompleted,
        ]}
        onPress={onToggleComplete}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={[styles.checkCircle, exercise.completed && styles.checkCircleCompleted]}>
            {exercise.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
          </View>
          <View style={styles.headerText}>
            <ThemedText type="defaultSemiBold" style={styles.exerciseName}>
              {exercise.name}
            </ThemedText>
            <ThemedText style={styles.muscleGroup}>
              {exercise.muscleGroup} • {completedSets}/{exercise.sets.length} sets
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      {/* Exercise Controls - only per-set timers/reps/weight */}
      {!exercise.completed && (
        <View style={styles.setsContainer}>
          {/* Per-Set Cards */}
          {exercise.sets.map((set, idx) => {
            const isExpanded = expandedSetId === set.setNumber;
            const isRunning = runningTimers.has(set.setNumber);
            const timerVal = timerValues[set.setNumber] ?? 90;

            return (
              <TouchableOpacity
                key={set.setNumber}
                style={[
                  styles.setCard,
                  set.completed && styles.setCardCompleted,
                  {
                    borderColor: set.difficulty ? DIFFICULTY_COLORS[set.difficulty] : COLORS.BORDER,
                    borderWidth: set.difficulty ? 2.5 : 1,
                  },
                ]}
                onPress={() => {
                  // Toggle difficulty on set tap
                  const order: Array<DifficultyRating | null> = [null, 'licht', 'goed', 'zwaar'];
                  const current: DifficultyRating | null = (set.difficulty as DifficultyRating) || null;
                  const idxOrder = order.indexOf(current);
                  const next = order[(idxOrder + 1) % order.length];
                  const updatedSets = [...exercise.sets];
                  updatedSets[idx] = { ...updatedSets[idx], difficulty: next };
                  onUpdateExercise({ ...exercise, sets: updatedSets });
                }}
                activeOpacity={0.7}
              >
                {/* Set Header Row - simplified */}
                <View style={styles.setHeaderRow}>
                  <TouchableOpacity
                    style={[styles.setCheckBox, set.completed && styles.setCheckBoxComplete]}
                    onPress={() => markSetComplete(idx)}
                  >
                    {set.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                  </TouchableOpacity>
                </View>

                {/* Controls Row: Reps | Gewicht */}
                {!set.completed && (
                  <View style={styles.controlsRow}>
                    <View style={styles.controlColumn}>
                      <ThemedText style={styles.controlLabel}>Reps</ThemedText>
                      <View style={styles.controlInputRow}>
                        <TouchableOpacity
                          style={styles.miniBtn}
                          onPress={() => updateAllReps(Math.max(1, repsValue - 1))}
                        >
                          <ThemedText style={styles.miniBtnText}>−</ThemedText>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.miniInput}
                          value={String(repsValue)}
                          keyboardType="number-pad"
                          onChangeText={(t) => updateAllReps(parseInt(t) || 0)}
                        />
                        <TouchableOpacity
                          style={styles.miniBtn}
                          onPress={() => updateAllReps(repsValue + 1)}
                        >
                          <ThemedText style={styles.miniBtnText}>＋</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.controlColumn}>
                      <ThemedText style={styles.controlLabel}>Gewicht (kg)</ThemedText>
                      <View style={styles.controlInputRow}>
                        <TouchableOpacity
                          style={styles.miniBtn}
                          onPress={() => updateAllWeights(Math.max(0, +(weightValue - 1).toFixed(1)))}
                        >
                          <ThemedText style={styles.miniBtnText}>−</ThemedText>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.miniInput}
                          value={String(weightValue)}
                          keyboardType="decimal-pad"
                          onChangeText={(t) => updateAllWeights(parseFloat(t) || 0)}
                        />
                        <TouchableOpacity
                          style={styles.miniBtn}
                          onPress={() => updateAllWeights(+(weightValue + 1).toFixed(1))}
                        >
                          <ThemedText style={styles.miniBtnText}>＋</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Timer Section - always visible when not completed */}
                {!set.completed && (
                  <TouchableOpacity
                    style={[styles.timerSection, isExpanded && styles.timerSectionExpanded]}
                    onPress={() => setExpandedSetId(isExpanded ? null : set.setNumber)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.timerDisplay}>{formatTime(timerVal)}</ThemedText>

                    {isExpanded && (
                      <View style={styles.timerButtonRow}>
                        {!isRunning ? (
                          <TouchableOpacity style={[styles.timerBtn, styles.timerBtnStart]} onPress={() => startTimer(set.setNumber)}>
                            <ThemedText style={styles.timerBtnText}>▶ Start</ThemedText>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={[styles.timerBtn, styles.timerBtnPause]} onPress={() => pauseTimer(set.setNumber)}>
                            <ThemedText style={styles.timerBtnText}>⏸ Pause</ThemedText>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.timerBtn, styles.timerBtnReset]} onPress={() => resetTimer(set.setNumber)}>
                          <ThemedText style={styles.timerBtnText}>↻ Reset</ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
  },
  headerCompleted: {
    backgroundColor: COLORS.CARD,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: '#34C759',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerText: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    marginBottom: 4,
    color: COLORS.TEXT_PRIMARY,
  },
  muscleGroup: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  setsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  // Minimal difficulty frame
  difficultyFrame: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  difficultyHint: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Per-set card
  setCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  setCardCompleted: {
    opacity: 0.5,
    borderColor: '#34C759',
  },
  setCardExpanded: {
    borderColor: COLORS.ACCENT,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  setNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  setNum: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
  setCheckBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setCheckBoxComplete: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  // Controls: Reps & Gewicht in row
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  controlColumn: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  controlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  miniBtnText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  miniInput: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontSize: 12,
  },
  // Timer section
  timerSection: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  timerSectionExpanded: {
    paddingVertical: 10,
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.ACCENT,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  timerButtonRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  timerBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBtnStart: {
    backgroundColor: '#34C759',
  },
  timerBtnPause: {
    backgroundColor: '#FF9500',
  },
  timerBtnReset: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  timerBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },

  // Legacy styles (kept for compatibility)
  controlFrame: {
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  controlGroup: {
    flex: 1,
  },
  controlGroupFull: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  btnText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  numberInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginBottom: 12,
  },
  hint: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  numberInputSingle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontSize: 14,
  },
  controlRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  controlInlineGroup: {
    flex: 1,
  },
  controlInlineGroupCenter: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  counterText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  counterInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontSize: 14,
  },
  underLineRow: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
