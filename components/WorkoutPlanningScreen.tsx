import { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { COLORS } from '@/app/styles/colors';
import { EXERCISE_GUIDES } from '@/app/data/exerciseGuides';
import type { Schema } from '@/app/data/workoutData';

interface WorkoutPlanEntry {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  notes: string;
}

interface WorkoutPlan {
  id: string;
  date: string;
  schemaId: string;
  schemaName: string;
  exercises: WorkoutPlanEntry[];
  notes: string;
  createdAt: string;
}

interface WorkoutPlanningScreenProps {
  schema: Schema;
  onStartWorkout: (plan: WorkoutPlan) => void;
  onCancel: () => void;
  previousSession?: any;
}

export function WorkoutPlanningScreen({
  schema,
  onStartWorkout,
  onCancel,
  previousSession,
}: WorkoutPlanningScreenProps) {
  const [planExercises, setPlanExercises] = useState<WorkoutPlanEntry[]>([]);
  const [planNotes, setPlanNotes] = useState('');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Get all exercises from schema
  const allExercises = useMemo(() => {
    return schema.muscleGroups.flatMap(mg =>
      mg.exercises.map(ex => ({ ...ex, muscleGroupName: mg.name }))
    );
  }, [schema]);

  // Initialize with all schema exercises on first render
  useMemo(() => {
    if (planExercises.length === 0) {
      const initialized = allExercises.map(ex => ({
        exerciseName: ex.name,
        targetSets: 3,
        targetReps: 12,
        targetWeight: previousSession
          ? previousSession.exercises.find((se: any) => se.name === ex.name)?.sets?.[0]?.weight || 0
          : 0,
        notes: '',
      }));
      setPlanExercises(initialized);
    }
  }, []);

  const handleAddExerciseToPlan = useCallback((exerciseName: string) => {
    if (!planExercises.find(p => p.exerciseName === exerciseName)) {
      setPlanExercises(prev => [
        ...prev,
        {
          exerciseName,
          targetSets: 3,
          targetReps: 12,
          targetWeight: 0,
          notes: '',
        },
      ]);
    }
  }, [planExercises]);

  const handleRemoveExerciseFromPlan = useCallback((exerciseName: string) => {
    setPlanExercises(prev => prev.filter(p => p.exerciseName !== exerciseName));
  }, []);

  const handleUpdatePlanEntry = useCallback(
    (exerciseName: string, updates: Partial<WorkoutPlanEntry>) => {
      setPlanExercises(prev =>
        prev.map(p =>
          p.exerciseName === exerciseName ? { ...p, ...updates } : p
        )
      );
    },
    []
  );

  const handleStartWorkout = () => {
    if (planExercises.length === 0) {
      Alert.alert('Geen oefeningen', 'Voeg oefeningen toe aan je plan voordat je start.');
      return;
    }

    const plan: WorkoutPlan = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      schemaId: schema.id,
      schemaName: schema.name,
      exercises: planExercises,
      notes: planNotes,
      createdAt: new Date().toISOString(),
    };

    onStartWorkout(plan);
  };

  const muscleGroupsInPlan = useMemo(() => {
    return new Set(
      planExercises
        .map(ex => allExercises.find(ae => ae.name === ex.exerciseName)?.muscleGroupName)
        .filter(Boolean)
    );
  }, [planExercises, allExercises]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Workout voorbereiding</ThemedText>
          <ThemedText style={styles.subtitle}>
            Plan je oefeningen en doelstellingen
          </ThemedText>
        </View>

        {/* Schema Info */}
        <View style={styles.schemaCard}>
          <ThemedText type="defaultSemiBold" style={styles.schemaName}>
            {schema.name}
          </ThemedText>
          <ThemedText style={styles.schemaDescription}>
            {schema.description}
          </ThemedText>
          <View style={styles.muscleGroupsTags}>
            {Array.from(muscleGroupsInPlan).map(mg => (
              <View key={mg} style={styles.muscleGroupTag}>
                <ThemedText style={styles.muscleGroupTagText}>{mg}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Plan Notes */}
        <View style={styles.notesCard}>
          <ThemedText type="defaultSemiBold" style={styles.notesLabel}>
            Workout notitie
          </ThemedText>
          <TextInput
            style={styles.notesInput}
            placeholder="Bijv. Focus op techniek, light day, volume focus..."
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={planNotes}
            onChangeText={setPlanNotes}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Planned Exercises */}
        {planExercises.length > 0 && (
          <View style={styles.planSection}>
            <View style={styles.planHeader}>
              <ThemedText type="defaultSemiBold" style={styles.planTitle}>
                Geplande oefeningen ({planExercises.length})
              </ThemedText>
              <ThemedText style={styles.planSummary}>
                {planExercises.reduce((sum, p) => sum + p.targetSets, 0)} sets totaal
              </ThemedText>
            </View>

            {planExercises.map((entry, idx) => {
              const isExpanded = expandedExerciseId === entry.exerciseName;
              const guide = EXERCISE_GUIDES[entry.exerciseName];
              return (
                <TouchableOpacity
                  key={entry.exerciseName}
                  style={styles.planCard}
                  onPress={() =>
                    setExpandedExerciseId(isExpanded ? null : entry.exerciseName)
                  }
                  activeOpacity={0.6}
                >
                  <View style={styles.planCardHeader}>
                    <View style={styles.planCardTitle}>
                      {guide?.icon && (
                        <ThemedText style={styles.exerciseIcon}>
                          {guide.icon}
                        </ThemedText>
                      )}
                      <ThemedText style={styles.planExerciseName}>
                        {entry.exerciseName}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.planCardMeta}>
                      {entry.targetSets}×{entry.targetReps} @ {entry.targetWeight} kg
                    </ThemedText>
                  </View>

                  {isExpanded && (
                    <View style={styles.planCardExpanded}>
                      <View style={styles.editRow}>
                        <View style={styles.editField}>
                          <ThemedText style={styles.editLabel}>Sets</ThemedText>
                          <View style={styles.editInputRow}>
                            <TouchableOpacity
                              onPress={() =>
                                handleUpdatePlanEntry(entry.exerciseName, {
                                  targetSets: Math.max(1, entry.targetSets - 1),
                                })
                              }
                            >
                              <ThemedText style={styles.editBtn}>−</ThemedText>
                            </TouchableOpacity>
                            <TextInput
                              style={styles.editInput}
                              value={String(entry.targetSets)}
                              keyboardType="number-pad"
                              onChangeText={v =>
                                handleUpdatePlanEntry(entry.exerciseName, {
                                  targetSets: parseInt(v) || 1,
                                })
                              }
                            />
                            <TouchableOpacity
                              onPress={() =>
                                handleUpdatePlanEntry(entry.exerciseName, {
                                  targetSets: entry.targetSets + 1,
                                })
                              }
                            >
                              <ThemedText style={styles.editBtn}>+</ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.editField}>
                          <ThemedText style={styles.editLabel}>Reps</ThemedText>
                          <View style={styles.editInputRow}>
                            <TouchableOpacity
                              onPress={() =>
                                handleUpdatePlanEntry(entry.exerciseName, {
                                  targetReps: Math.max(1, entry.targetReps - 1),
                                })
                              }
                            >
                              <ThemedText style={styles.editBtn}>−</ThemedText>
                            </TouchableOpacity>
                            <TextInput
                              style={styles.editInput}
                              value={String(entry.targetReps)}
                              keyboardType="number-pad"
                              onChangeText={v =>
                                handleUpdatePlanEntry(entry.exerciseName, {
                                  targetReps: parseInt(v) || 1,
                                })
                              }
                            />
                            <TouchableOpacity
                              onPress={() =>
                                handleUpdatePlanEntry(entry.exerciseName, {
                                  targetReps: entry.targetReps + 1,
                                })
                              }
                            >
                              <ThemedText style={styles.editBtn}>+</ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.editField}>
                          <ThemedText style={styles.editLabel}>Gewicht (kg)</ThemedText>
                          <TextInput
                            style={styles.editInputFull}
                            value={String(entry.targetWeight)}
                            keyboardType="decimal-pad"
                            onChangeText={v =>
                              handleUpdatePlanEntry(entry.exerciseName, {
                                targetWeight: parseFloat(v) || 0,
                              })
                            }
                          />
                        </View>
                      </View>

                      <View style={styles.expandedNotesSection}>
                        <ThemedText style={styles.editLabel}>Opmerkingen</ThemedText>
                        <TextInput
                          style={styles.expandedNotesInput}
                          placeholder="Bijv. Focus op diepe ROM, voorkomen schouderpijn..."
                          placeholderTextColor={COLORS.TEXT_SECONDARY}
                          value={entry.notes}
                          onChangeText={v =>
                            handleUpdatePlanEntry(entry.exerciseName, { notes: v })
                          }
                          multiline
                          numberOfLines={2}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() =>
                          handleRemoveExerciseFromPlan(entry.exerciseName)
                        }
                      >
                        <ThemedText style={styles.removeBtnText}>
                          Verwijder oefening
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Available Exercises to Add */}
        {allExercises.length > planExercises.length && (
          <View style={styles.availableSection}>
            <ThemedText type="defaultSemiBold" style={styles.availableTitle}>
              Beschikbare oefeningen
            </ThemedText>
            <View style={styles.availableGrid}>
              {allExercises
                .filter(ex => !planExercises.find(p => p.exerciseName === ex.name))
                .map(ex => (
                  <TouchableOpacity
                    key={ex.name}
                    style={styles.availableChip}
                    onPress={() => handleAddExerciseToPlan(ex.name)}
                  >
                    {EXERCISE_GUIDES[ex.name]?.icon && (
                      <ThemedText style={styles.chipIcon}>
                        {EXERCISE_GUIDES[ex.name].icon}
                      </ThemedText>
                    )}
                    <ThemedText style={styles.chipText}>{ex.name}</ThemedText>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <ThemedText style={styles.cancelButtonText}>Annuleer</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.startButtonText}>Start workout</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  schemaCard: {
    marginHorizontal: 12,
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: 8,
  },
  schemaName: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  schemaDescription: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  muscleGroupsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  muscleGroupTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  muscleGroupTagText: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  notesCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: 8,
  },
  notesLabel: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  notesInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    minHeight: 60,
  },
  planSection: {
    marginHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  planSummary: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  planCard: {
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseIcon: {
    fontSize: 18,
  },
  planExerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  planCardMeta: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  planCardExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    gap: 12,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editField: {
    flex: 1,
    gap: 6,
  },
  editLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtn: {
    fontSize: 18,
    color: COLORS.ACCENT,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  editInput: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    textAlign: 'center',
  },
  editInputFull: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
  },
  expandedNotesSection: {
    gap: 6,
  },
  expandedNotesInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
    minHeight: 50,
  },
  removeBtn: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
  availableSection: {
    marginHorizontal: 12,
    marginTop: 16,
    gap: 10,
  },
  availableTitle: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  availableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
  },
  startButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.ACCENT,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
