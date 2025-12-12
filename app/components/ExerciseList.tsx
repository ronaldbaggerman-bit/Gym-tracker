import type { Exercise, MuscleGroup } from '@/app/data/workoutData';
import { COLORS } from '@/app/styles/colors';
import { ThemedText } from '@/components/themed-text';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ExerciseListProps {
  muscleGroup: MuscleGroup;
  onSelectExercise: (exercise: Exercise) => void;
}

export function ExerciseList({ muscleGroup, onSelectExercise }: ExerciseListProps) {
  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => onSelectExercise(item)}
      activeOpacity={0.7}
    >
      <View style={styles.exerciseContent}>
        <ThemedText type="defaultSemiBold" style={styles.exerciseName}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.exerciseMet}>
          MET: {item.met}
        </ThemedText>
      </View>
      <View style={styles.addIcon}>
        <ThemedText style={styles.addIconText}>+</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.groupTitle}>
        {muscleGroup.name}
      </ThemedText>
      <FlatList
        data={muscleGroup.exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 5,
    color: COLORS.ACCENT,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    marginBottom: 3,
  },
  exerciseMet: {
    fontSize: 12,
    color: COLORS.MUTED,
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  addIconText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
