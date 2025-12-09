import { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ImageBackground } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DIFFICULTY_COLORS } from '@/app/types/workout';
import { COLORS } from '@/app/styles/colors';
import * as Haptics from 'expo-haptics';
import { getPRDisplay } from '@/app/utils/prTracker';
import { calculateProgressiveOverload, formatProgressiveSuggestion } from '@/app/utils/progressiveOverload';
import { calculate1RMFromPR, format1RMDisplay } from '@/app/utils/oneRepMaxCalculator';
import { loadSettings } from '@/app/utils/settingsStorage';
import { calculateExerciseKcal, formatKcalDisplay } from '@/app/utils/kcalCalculator';
import type { WorkoutExercise, DifficultyRating } from '@/app/types/workout';
import { EXERCISE_GUIDES } from '@/app/data/exerciseGuides';

interface ExerciseDetailProps {
  exercise: WorkoutExercise;
  onUpdateExercise: (updatedExercise: WorkoutExercise) => void;
  onToggleComplete: () => void;
  bodyWeightKg?: number;
  defaultMET?: number;
}

export function ExerciseDetail({ exercise, onUpdateExercise, onToggleComplete, bodyWeightKg = 75, defaultMET = 5 }: ExerciseDetailProps) {
  const [setsCount, setSetsCount] = useState<number>(exercise.sets.length);
  const [weightValue, setWeightValue] = useState<number>(exercise.sets?.[0]?.weight || 0);
  const [repsValue, setRepsValue] = useState<number>(exercise.sets?.[0]?.reps || 12);
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null);
  const [timerValues, setTimerValues] = useState<Record<number, number>>({});
  const [runningTimers, setRunningTimers] = useState<Set<number>>(new Set());
  const [notesText, setNotesText] = useState<string>(exercise.notes || '');
  const [showImages, setShowImages] = useState<boolean>(true);
  const guide = useMemo(() => {
    if (EXERCISE_GUIDES[exercise.name]) return EXERCISE_GUIDES[exercise.name];
    const normalized = exercise.name.trim().toLowerCase();
    const match = Object.entries(EXERCISE_GUIDES).find(([key]) => key.trim().toLowerCase() === normalized);
    return match ? match[1] : undefined;
  }, [exercise.name]);
  const timerIntervals = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    // Initialize timer values for all sets
    const initialTimers: Record<number, number> = {};
    exercise.sets.forEach(s => {
      initialTimers[s.setNumber] = 90; // 90 seconds rest between sets
    });
    setTimerValues(initialTimers);
    setNotesText(exercise.notes || ''); // Sync notes when exercise changes
    
    // Load settings
    loadSettings().then(s => setShowImages(s.showExerciseImages));
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
          <View style={styles.headerTextWrapper}>
            <View style={styles.headerText}>
              <ThemedText type="defaultSemiBold" style={styles.exerciseName}>
                {guide?.icon && <ThemedText style={styles.exerciseIcon}>{guide.icon} </ThemedText>}
                {exercise.name}
              </ThemedText>
              <ThemedText style={styles.muscleGroup}>
                {exercise.muscleGroup} • {completedSets}/{exercise.sets.length} sets
              </ThemedText>
            </View>
            {exercise.personalRecord && (
              <View style={styles.headerInfoBox}>
                <ThemedText style={styles.prDisplay}>
                  {getPRDisplay(exercise)}
                </ThemedText>
                {calculateProgressiveOverload(exercise.personalRecord) && (
                  <ThemedText style={styles.progressiveOverloadDisplay}>
                    {formatProgressiveSuggestion(calculateProgressiveOverload(exercise.personalRecord)!)}
                  </ThemedText>
                )}
                {calculate1RMFromPR(exercise.personalRecord) > 0 && (
                  <ThemedText style={styles.oneRepMaxDisplay}>
                    {format1RMDisplay(calculate1RMFromPR(exercise.personalRecord))}
                  </ThemedText>
                )}
              </View>
            )}
            <View style={styles.kcalInfoBox}>
              <ThemedText style={styles.kcalInfoLabel}>🔥</ThemedText>
              <ThemedText style={styles.kcalInfoValue}>
                {formatKcalDisplay(calculateExerciseKcal(exercise, bodyWeightKg, defaultMET))}
              </ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Guide card with dark overlay - only show if enabled */}
      {guide && showImages && (
        <View style={styles.guideCard}>
          <ImageBackground
            source={{ uri: guide.image }}
            style={styles.guideImage}
            imageStyle={styles.guideImageInner}
          >
            <View style={styles.guideOverlay}>
              <ThemedText type="defaultSemiBold" style={styles.guideTitle}>
                {guide.icon && <ThemedText style={styles.exerciseIcon}>{guide.icon} </ThemedText>}
                {exercise.name}
              </ThemedText>
              {guide.primaryMuscles && (
                <ThemedText style={styles.guideMeta}>{guide.primaryMuscles}</ThemedText>
              )}
              {guide.equipment && (
                <ThemedText style={styles.guideMeta}>{guide.equipment}</ThemedText>
              )}
            </View>
          </ImageBackground>
          <View style={styles.guideBody}>
            <ThemedText type="defaultSemiBold" style={styles.guideSectionTitle}>Instructies</ThemedText>
            {guide.cues.map((cue, idx) => (
              <ThemedText key={idx} style={styles.guideCueText}>{idx + 1}. {cue}</ThemedText>
            ))}
            {guide.tips && guide.tips.length > 0 && (
              <View style={styles.tipRow}>
                {guide.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipPill}>
                    <ThemedText style={styles.tipText}>{tip}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

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
                          onPress={() => {
                            const updatedSets = [...exercise.sets];
                            updatedSets[idx] = { ...updatedSets[idx], reps: Math.max(1, set.reps - 1) };
                            onUpdateExercise({ ...exercise, sets: updatedSets });
                          }}
                        >
                          <ThemedText style={styles.miniBtnText}>−</ThemedText>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.miniInput}
                          value={String(set.reps)}
                          keyboardType="number-pad"
                          onChangeText={(t) => {
                            const updatedSets = [...exercise.sets];
                            updatedSets[idx] = { ...updatedSets[idx], reps: parseInt(t) || 0 };
                            onUpdateExercise({ ...exercise, sets: updatedSets });
                          }}
                        />
                        <TouchableOpacity
                          style={styles.miniBtn}
                          onPress={() => {
                            const updatedSets = [...exercise.sets];
                            updatedSets[idx] = { ...updatedSets[idx], reps: set.reps + 1 };
                            onUpdateExercise({ ...exercise, sets: updatedSets });
                          }}
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
                          onPress={() => {
                            const updatedSets = [...exercise.sets];
                            updatedSets[idx] = { ...updatedSets[idx], weight: Math.max(0, +(set.weight - 1).toFixed(1)) };
                            onUpdateExercise({ ...exercise, sets: updatedSets });
                          }}
                        >
                          <ThemedText style={styles.miniBtnText}>−</ThemedText>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.miniInput}
                          value={String(set.weight)}
                          keyboardType="decimal-pad"
                          onChangeText={(t) => {
                            const updatedSets = [...exercise.sets];
                            updatedSets[idx] = { ...updatedSets[idx], weight: parseFloat(t) || 0 };
                            onUpdateExercise({ ...exercise, sets: updatedSets });
                          }}
                        />
                        <TouchableOpacity
                          style={styles.miniBtn}
                          onPress={() => {
                            const updatedSets = [...exercise.sets];
                            updatedSets[idx] = { ...updatedSets[idx], weight: +(set.weight + 1).toFixed(1) };
                            onUpdateExercise({ ...exercise, sets: updatedSets });
                          }}
                        >
                          <ThemedText style={styles.miniBtnText}>＋</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Timer Section - progress bar only */}
                {!set.completed && (
                  <TouchableOpacity
                    style={[styles.timerSection, isExpanded && styles.timerSectionExpanded]}
                    onPress={() => setExpandedSetId(isExpanded ? null : set.setNumber)}
                    activeOpacity={0.7}
                  >
                    {/* Timer Progress Bar */}
                    <View style={styles.timerProgressContainer}>
                      <View style={[styles.timerProgressBar, { width: `${(timerVal / 90) * 100}%` }]} />
                    </View>

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

      {/* Notes Section */}
      {!exercise.completed && (
        <View style={styles.notesSection}>
          <ThemedText style={styles.notesLabel}>Notitie</ThemedText>
          <TextInput
            style={styles.notesInput}
            placeholder="Pijn? Energy? Form opmerkingen?"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            multiline
            numberOfLines={3}
            value={notesText}
            onChangeText={text => {
              setNotesText(text);
              onUpdateExercise({ ...exercise, notes: text });
            }}
          />
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
  guideCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  guideImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.SURFACE,
  },
  guideImageInner: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  guideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    justifyContent: 'flex-end',
    gap: 4,
  },
  guideTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guideMeta: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  guideBody: {
    padding: 12,
    gap: 6,
    backgroundColor: COLORS.CARD,
  },
  guideSectionTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  guideCueText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tipPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  tipText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 11,
    fontWeight: '600',
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
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  headerTextWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerInfoBox: {
    gap: 2,
    alignItems: 'flex-end',
  },
  kcalInfoBox: {
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalInfoLabel: {
    fontSize: 14,
  },
  kcalInfoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
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
  exerciseIcon: {
    fontSize: 18,
    marginRight: 2,
  },
  muscleGroup: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  prDisplay: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 6,
    fontWeight: '600',
  },
  progressiveOverloadDisplay: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 4,
    fontStyle: 'italic',
  },
  oneRepMaxDisplay: {
    fontSize: 11,
    color: '#FF2D55',
    marginTop: 3,
    fontWeight: '500',
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
  timerProgressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  timerProgressBar: {
    height: '100%',
    backgroundColor: COLORS.ACCENT,
    borderRadius: 3,
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
  notesSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
    minHeight: 70,
  },
});
