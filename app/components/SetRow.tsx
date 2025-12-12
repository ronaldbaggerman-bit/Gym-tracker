import { useThemeColors } from '@/app/hooks/useThemeColors';
import { getColors } from '@/app/styles/colors';
import type { ExerciseSet } from '@/app/types/workout';
import { ThemedText } from '@/components/themed-text';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  isExpanded: boolean;
  isRunning: boolean;
  timerVal: number;
  weightValue: number;
  repsValue: number;
  onToggleExpand: (setNumber: number) => void;
  onMarkComplete: (index: number) => void;
  onUpdateReps: (index: number, reps: number) => void;
  onUpdateWeight: (index: number, weight: number) => void;
  onStartTimer: (setNumber: number) => void;
  onPauseTimer: (setNumber: number) => void;
  onResetTimer: (setNumber: number) => void;
}

export function SetRow({
  set,
  index,
  isExpanded,
  isRunning,
  timerVal,
  weightValue,
  repsValue,
  onToggleExpand,
  onMarkComplete,
  onUpdateReps,
  onUpdateWeight,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
}: SetRowProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);
  return (
    <TouchableOpacity
      style={[
        styles.setCard,
        set.completed && styles.setCardCompleted,
      ]}
      onPress={() => onToggleExpand(set.setNumber)}
      activeOpacity={0.7}
    >
      {/* Set header with checkbox */}
      <View style={styles.setHeaderRow}>
        <TouchableOpacity
          style={[styles.setCheckBox, set.completed && styles.setCheckBoxComplete]}
          onPress={() => onMarkComplete(index)}
        >
          {set.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
        </TouchableOpacity>
      </View>

      {/* Controls: Reps & Weight */}
      {!set.completed && (
        <View style={styles.controlsRow}>
          <View style={styles.controlColumn}>
            <ThemedText style={styles.controlLabel}>Reps</ThemedText>
            <View style={styles.controlInputRow}>
              <TouchableOpacity
                style={styles.miniBtn}
                onPress={() => onUpdateReps(index, Math.max(1, set.reps - 1))}
              >
                <ThemedText style={styles.miniBtnText}>−</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.miniInput}>{set.reps}</ThemedText>
              <TouchableOpacity
                style={styles.miniBtn}
                onPress={() => onUpdateReps(index, set.reps + 1)}
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
                onPress={() => onUpdateWeight(index, Math.max(0, +(set.weight - 1).toFixed(1)))}
              >
                <ThemedText style={styles.miniBtnText}>−</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.miniInput}>{set.weight}</ThemedText>
              <TouchableOpacity
                style={styles.miniBtn}
                onPress={() => onUpdateWeight(index, +(set.weight + 1).toFixed(1))}
              >
                <ThemedText style={styles.miniBtnText}>＋</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Timer Section */}
      {!set.completed && (
        <TouchableOpacity
          style={[styles.timerSection, isExpanded && styles.timerSectionExpanded]}
          onPress={() => onToggleExpand(set.setNumber)}
          activeOpacity={0.7}
        >
          <View style={styles.timerProgressContainer}>
            <View style={[styles.timerProgressBar, { width: `${(timerVal / 90) * 100}%` }]} />
          </View>

          {isExpanded && (
            <View style={styles.timerButtonRow}>
              {!isRunning ? (
                <TouchableOpacity style={[styles.timerBtn, styles.timerBtnStart]} onPress={() => onStartTimer(set.setNumber)}>
                  <ThemedText style={styles.timerBtnText}>▶ Start</ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.timerBtn, styles.timerBtnPause]} onPress={() => onPauseTimer(set.setNumber)}>
                  <ThemedText style={styles.timerBtnText}>⏸ Pause</ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.timerBtn, styles.timerBtnReset]} onPress={() => onResetTimer(set.setNumber)}>
                <ThemedText style={styles.timerBtnText}>↻ Reset</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (COLORS: ReturnType<typeof getColors>) =>
  StyleSheet.create({
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
    setHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: 12,
    },
    setCheckBox: {
      width: 44,
      height: 44,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: COLORS.BORDER,
      justifyContent: 'center',
      alignItems: 'center',
    },
    setCheckBoxComplete: {
      backgroundColor: '#34C759',
      borderColor: '#34C759',
    },
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
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: COLORS.SURFACE,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.BORDER,
    },
    miniBtnText: {
      color: COLORS.TEXT_PRIMARY,
      fontSize: 16,
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
    timerButtonRow: {
      flexDirection: 'row',
      gap: 8,
      width: '100%',
    },
    timerBtn: {
      flex: 1,
      paddingVertical: 12,
      minHeight: 44,
      borderRadius: 8,
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
    checkmark: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
