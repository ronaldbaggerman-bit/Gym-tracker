import React, { memo, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { WorkoutExercise, DifficultyRating } from '@/app/types/workout';
import { EXERCISE_GUIDES } from '@/app/data/exerciseGuides';
import { getPRDisplay } from '@/app/utils/prTracker';
import { calculateProgressiveOverload, formatProgressiveSuggestion } from '@/app/utils/progressiveOverload';
import { calculate1RMFromPR, format1RMDisplay } from '@/app/utils/oneRepMaxCalculator';
import { calculateExerciseKcal, formatKcalDisplay } from '@/app/utils/kcalCalculator';
import { useThemeColors } from '@/app/hooks/useThemeColors';
import { getColors } from '@/app/styles/colors';

interface ExerciseHeaderProps {
  exercise: WorkoutExercise;
  completedSets: number;
  onToggleComplete: () => void;
  bodyWeightKg: number;
  defaultMET: number;
}

export const ExerciseHeader = memo(function ExerciseHeader({
  exercise,
  completedSets,
  onToggleComplete,
  bodyWeightKg,
  defaultMET,
}: ExerciseHeaderProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);
  const guide = EXERCISE_GUIDES[exercise.name];

  return (
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
          <View style={[styles.checkCircleInner, exercise.completed && styles.checkCircleInnerCompleted]}>
            {exercise.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
          </View>
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
  );
});

const getStyles = (COLORS: ReturnType<typeof getColors>) =>
  StyleSheet.create({
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
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircleCompleted: {
      backgroundColor: 'transparent',
    },
    checkCircleInner: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: COLORS.BORDER,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircleInnerCompleted: {
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
  });
