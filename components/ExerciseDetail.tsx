import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { DIFFICULTY_COLORS } from '@/app/types/workout';
import { COLORS } from '@/app/styles/colors';
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

  useEffect(() => {
    setSetsCount(exercise.sets.length);
    setWeightValue(exercise.sets?.[0]?.weight ?? 0);
    setRepsValue(exercise.sets?.[0]?.reps ?? 12);
  }, [exercise]);

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

  const completedSets = exercise.sets.filter(s => s.completed).length;
  const currentDifficulty = exercise.sets?.[0]?.difficulty;

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

      {/* Single Exercise Frame */}
      {!exercise.completed && (
        <View style={styles.setsContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.setCard,
              {
                borderColor: currentDifficulty ? DIFFICULTY_COLORS[currentDifficulty] : COLORS.BORDER,
                borderWidth: currentDifficulty ? 2.5 : 1,
              },
            ]}
            onPress={cycleRating}
          >
            {/* Row 1: Sets | Reps */}
            <View style={styles.topRow}>
              <View style={styles.controlGroup}>
                <ThemedText style={styles.label}>Sets</ThemedText>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => updateSetsCount(Math.max(1, setsCount - 1))}
                  >
                    <ThemedText style={styles.btnText}>−</ThemedText>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.numberInput}
                    value={String(setsCount)}
                    keyboardType="number-pad"
                    onChangeText={(t) => {
                      const v = parseInt(t) || 1;
                      updateSetsCount(v);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => updateSetsCount(setsCount + 1)}
                  >
                    <ThemedText style={styles.btnText}>＋</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.controlGroup}>
                <ThemedText style={styles.label}>Reps</ThemedText>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => updateAllReps(Math.max(1, repsValue - 1))}
                  >
                    <ThemedText style={styles.btnText}>−</ThemedText>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.numberInput}
                    value={String(repsValue)}
                    keyboardType="number-pad"
                    onChangeText={(t) => {
                      const v = parseInt(t) || 0;
                      updateAllReps(v);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => updateAllReps(repsValue + 1)}
                  >
                    <ThemedText style={styles.btnText}>＋</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Row 2: Gewicht */}
            <View style={styles.bottomRow}>
              <View style={styles.controlGroupFull}>
                <ThemedText style={styles.label}>Gewicht (kg)</ThemedText>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => updateAllWeights(Math.max(0, +(weightValue - 1).toFixed(1)))}
                  >
                    <ThemedText style={styles.btnText}>−</ThemedText>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.numberInput}
                    value={String(weightValue)}
                    keyboardType="decimal-pad"
                    onChangeText={(t) => {
                      const v = parseFloat(t) || 0;
                      updateAllWeights(v);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => updateAllWeights(+(weightValue + 1).toFixed(1))}
                  >
                    <ThemedText style={styles.btnText}>＋</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Hint text */}
            <ThemedText style={styles.hint}>
              Tik kader: oranje (1) → groen (2) → rood (3) → geen rating (4)
            </ThemedText>
          </TouchableOpacity>
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
  setCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
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
  // Legacy styles kept for compatibility
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
