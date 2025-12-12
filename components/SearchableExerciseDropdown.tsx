import { EXERCISE_GUIDES } from '@/app/data/exerciseGuides';
import type { MuscleGroup } from '@/app/data/workoutData';
import { COLORS } from '@/app/styles/colors';
import { ThemedText } from '@/components/themed-text';
import { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface SearchableExerciseDropdownProps {
  muscleGroups: MuscleGroup[];
  selectedExerciseName: string;
  onSelectExercise: (exerciseName: string) => void;
}

export function SearchableExerciseDropdown({
  muscleGroups,
  selectedExerciseName,
  onSelectExercise,
}: SearchableExerciseDropdownProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all exercises from muscle groups
  const allExercises = useMemo(() => {
    return muscleGroups.flatMap(mg =>
      mg.exercises.map(ex => ({ ...ex, muscleGroupName: mg.name }))
    );
  }, [muscleGroups]);

  // Filter and sort exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return allExercises;

    const query = searchQuery.toLowerCase();
    return allExercises
      .filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.muscleGroupName.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(query);
        const bStartsWith = b.name.toLowerCase().startsWith(query);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [searchQuery, allExercises]);

  const handleSelectExercise = useCallback((exerciseName: string) => {
    onSelectExercise(exerciseName);
    setVisible(false);
    setSearchQuery('');
  }, [onSelectExercise]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setSearchQuery('');
  }, []);

  const selectedExercise = allExercises.find(ex => ex.name === selectedExerciseName);

  return (
    <>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <View style={styles.buttonText}>
            {selectedExercise && EXERCISE_GUIDES[selectedExercise.name]?.icon && (
              <ThemedText style={styles.buttonIcon}>
                {EXERCISE_GUIDES[selectedExercise.name].icon}
              </ThemedText>
            )}
            <ThemedText style={styles.exerciseName}>{selectedExerciseName}</ThemedText>
            {selectedExercise && (
              <ThemedText style={styles.muscleGroupBadge}>
                {selectedExercise.muscleGroupName}
              </ThemedText>
            )}
          </View>
          <ThemedText style={styles.chevron}>▼</ThemedText>
        </View>
      </TouchableOpacity>

      {/* Modal Dropdown */}
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.modalContent}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Zoeken naar oefening..."
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <ThemedText style={styles.clearButtonText}>✕</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Exercise List */}
            {filteredExercises.length > 0 ? (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item, index) =>
                  `${item.id}-${item.muscleGroupName}-${index}`
                }
                renderItem={({ item }) => {
                  const isSelected = item.name === selectedExerciseName;
                  const guide = EXERCISE_GUIDES[item.name];
                  return (
                    <TouchableOpacity
                      style={[
                        styles.exerciseListItem,
                        isSelected && styles.exerciseListItemSelected,
                      ]}
                      onPress={() => handleSelectExercise(item.name)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.listItemContent}>
                        {guide?.icon && (
                          <ThemedText style={styles.listItemIcon}>
                            {guide.icon}
                          </ThemedText>
                        )}
                        <View style={styles.listItemText}>
                          <ThemedText
                            style={[
                              styles.listItemExerciseName,
                              isSelected && styles.selectedText,
                            ]}
                          >
                            {item.name}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.listItemMuscleGroup,
                              isSelected && styles.selectedMuscleText,
                            ]}
                          >
                            {item.muscleGroupName}
                          </ThemedText>
                        </View>
                      </View>
                      {isSelected && (
                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                      )}
                    </TouchableOpacity>
                  );
                }}
                scrollEnabled={true}
                maxHeight={Dimensions.get('window').height * 0.5}
              />
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  Geen oefeningen gevonden
                </ThemedText>
              </View>
            )}

            {/* Filter Info */}
            <View style={styles.filterInfo}>
              <ThemedText style={styles.filterInfoText}>
                {filteredExercises.length} oefeningen
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonIcon: {
    fontSize: 18,
  },
  exerciseName: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
  },
  muscleGroupBadge: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    width: '85%',
    maxHeight: Dimensions.get('window').height * 0.7,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
  },
  exerciseListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseListItemSelected: {
    backgroundColor: 'rgba(0, 191, 166, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ACCENT,
  },
  listItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listItemIcon: {
    fontSize: 20,
  },
  listItemText: {
    flex: 1,
  },
  listItemExerciseName: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedText: {
    color: COLORS.ACCENT,
  },
  listItemMuscleGroup: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  selectedMuscleText: {
    color: COLORS.ACCENT,
  },
  checkmark: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  filterInfo: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    alignItems: 'center',
  },
  filterInfoText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
});
