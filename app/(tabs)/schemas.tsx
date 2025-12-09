import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { COLORS } from '@/app/styles/colors';
import { WORKOUT_DATA, type Schema } from '@/app/data/workoutData';
import { addCustomSchema, deleteCustomSchema, loadCustomSchemas, upsertCustomSchema, applyOverrides, saveSchemaOverride, removeExerciseFromSchema } from '@/app/utils/schemaStorage';

export default function SchemasScreen() {
  const [customSchemas, setCustomSchemas] = useState<Schema[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#007AFF');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState('');
  const [newExercises, setNewExercises] = useState<{ id: number; name: string; met: number }[]>([]);
  const [newExerciseNameDraft, setNewExerciseNameDraft] = useState('');
  const [newExerciseMetDraft, setNewExerciseMetDraft] = useState('5.0');

  const [targetSchemaId, setTargetSchemaId] = useState<string>('');
  const [targetMuscleGroup, setTargetMuscleGroup] = useState<string>('');
  const [customTargetMuscleGroup, setCustomTargetMuscleGroup] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMet, setNewExerciseMet] = useState('5.0');

  const [defaultSchemas, setDefaultSchemas] = useState<Schema[]>(WORKOUT_DATA.schemas);
  const [moveExerciseId, setMoveExerciseId] = useState<number | null>(null);
  const [moveExerciseName, setMoveExerciseName] = useState('');
  const [moveExerciseMet, setMoveExerciseMet] = useState(5.0);
  const [moveFromSchemaId, setMoveFromSchemaId] = useState('');
  const [moveFromMuscleGroupId, setMoveFromMuscleGroupId] = useState('');

  const refresh = useCallback(async () => {
    const loaded = await loadCustomSchemas();
    setCustomSchemas(loaded);
    const withOverrides = await applyOverrides(WORKOUT_DATA.schemas);
    setDefaultSchemas(withOverrides);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const allSchemas = useMemo(() => [...defaultSchemas, ...customSchemas], [defaultSchemas, customSchemas]);

  const allMuscleGroups = useMemo(() => {
    const names = new Set<string>();
    allSchemas.forEach(schema => {
      schema.muscleGroups.forEach(mg => names.add(mg.name));
    });
    return Array.from(names);
  }, [allSchemas]);

  // ensure defaults
  useFocusEffect(
    useCallback(() => {
      refresh();
      if (!selectedMuscleGroup && allMuscleGroups.length > 0) {
        setSelectedMuscleGroup(allMuscleGroups[0]);
      }
      if (!targetSchemaId && allSchemas.length > 0) {
        setTargetSchemaId(allSchemas[0].id);
      }
    }, [refresh, selectedMuscleGroup, allMuscleGroups, targetSchemaId, allSchemas])
  );

  // Update defaults when lists change
  useEffect(() => {
    if (!selectedMuscleGroup && allMuscleGroups.length > 0) {
      setSelectedMuscleGroup(allMuscleGroups[0]);
    }
    if (!targetSchemaId && allSchemas.length > 0) {
      setTargetSchemaId(allSchemas[0].id);
    }
    if (!targetMuscleGroup && allMuscleGroups.length > 0) {
      setTargetMuscleGroup(allMuscleGroups[0]);
    }
  }, [allMuscleGroups, allSchemas, selectedMuscleGroup, targetSchemaId, targetMuscleGroup]);

  const handleCreateSchema = async () => {
    const muscleName = selectedMuscleGroup === '__new__'
      ? customMuscleGroup.trim()
      : selectedMuscleGroup.trim();

    if (!muscleName) {
      Alert.alert('Spiergroep ontbreekt', 'Kies een spiergroep of voeg een nieuwe toe.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Naam ontbreekt', 'Geef je schema een naam.');
      return;
    }

    const newSchema: Schema = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Aangepast schema',
      color: color || '#007AFF',
      muscleGroups: [
        {
          id: `mg-${Date.now()}`,
          name: muscleName,
          exercises: newExercises,
        },
      ],
    };

    await addCustomSchema(newSchema);
    await refresh();
    setName('');
    setDescription('');
    setColor('#007AFF');
    setSelectedMuscleGroup(allMuscleGroups[0] || '');
    setCustomMuscleGroup('');
    setNewExercises([]);
    setNewExerciseNameDraft('');
    setNewExerciseMetDraft('5.0');
  };

  const handleDelete = async (schemaId: string) => {
    await deleteCustomSchema(schemaId);
    await refresh();
  };

  const handleAddExerciseToSchema = async () => {
    // If we're moving an exercise, use the move handler instead
    if (moveExerciseId) {
      await handleMoveExercise();
      return;
    }

    const schema = allSchemas.find(s => s.id === targetSchemaId);
    if (!schema) {
      Alert.alert('Geen schema', 'Selecteer een schema.');
      return;
    }
    const muscleName = targetMuscleGroup === '__new__'
      ? customTargetMuscleGroup.trim()
      : targetMuscleGroup.trim();
    if (!muscleName) {
      Alert.alert('Spiergroep ontbreekt', 'Kies een spiergroep of voeg een nieuwe toe.');
      return;
    }
    const exerciseName = newExerciseName.trim();
    if (!exerciseName) {
      Alert.alert('Oefening ontbreekt', 'Geef de nieuwe oefening een naam.');
      return;
    }
    const metValue = Number(newExerciseMet) || 5.0;

    const exerciseId = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    const exercise = { id: exerciseId, name: exerciseName, met: metValue };

    const isCustom = customSchemas.some(s => s.id === schema.id);
    const isDefault = WORKOUT_DATA.schemas.some(s => s.id === schema.id);
    const baseMuscleGroups = schema.muscleGroups.map(mg => ({ ...mg, exercises: [...mg.exercises] }));

    const mgIndex = baseMuscleGroups.findIndex(mg => mg.name === muscleName);
    if (mgIndex >= 0) {
      baseMuscleGroups[mgIndex].exercises.push(exercise);
    } else {
      baseMuscleGroups.push({
        id: `mg-${Date.now()}`,
        name: muscleName,
        exercises: [exercise],
      });
    }

    const updatedSchema: Schema = { ...schema, muscleGroups: baseMuscleGroups };

    if (isDefault) {
      // Save as override for default schema
      await saveSchemaOverride(schema.id, updatedSchema);
    } else if (isCustom) {
      // Update existing custom schema
      await upsertCustomSchema(updatedSchema);
    }

    await refresh();
    setTargetSchemaId(schema.id);
    setTargetMuscleGroup(muscleName);
    setNewExerciseName('');
    setNewExerciseMet('5.0');
    setCustomTargetMuscleGroup('');
    Alert.alert('Toegevoegd', `Oefening toegevoegd aan ${schema.name}.`);
  };

  const handleAddExerciseToDraft = () => {
    const exerciseName = newExerciseNameDraft.trim();
    if (!exerciseName) return;
    const metValue = Number(newExerciseMetDraft) || 5.0;
    const exerciseId = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    setNewExercises(prev => [...prev, { id: exerciseId, name: exerciseName, met: metValue }]);
    setNewExerciseNameDraft('');
    setNewExerciseMetDraft('5.0');
  };

  const handleRemoveExerciseFromDraft = (id: number) => {
    setNewExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleRemoveExercise = async (schemaId: string, muscleGroupId: string, exerciseId: number, exerciseName: string, exerciseMet: number) => {
    Alert.alert(
      'Oefening verwijderen',
      `Wat wil je doen met "${exerciseName}"?`,
      [
        {
          text: 'Annuleren',
          style: 'cancel'
        },
        {
          text: 'Verplaatsen',
          onPress: () => {
            setMoveExerciseId(exerciseId);
            setMoveExerciseName(exerciseName);
            setMoveExerciseMet(exerciseMet);
            setMoveFromSchemaId(schemaId);
            setMoveFromMuscleGroupId(muscleGroupId);
            Alert.alert('Verplaatsen', `Selecteer een schema en spiergroep om "${exerciseName}" naartoe te verplaatsen, en druk op "Voeg toe".`);
          }
        },
        {
          text: 'Verwijderen uit schema',
          style: 'destructive',
          onPress: async () => {
            const isDefault = WORKOUT_DATA.schemas.some(s => s.id === schemaId);
            await removeExerciseFromSchema(schemaId, muscleGroupId, exerciseId, isDefault);
            await refresh();
            Alert.alert('Verwijderd', `"${exerciseName}" is verwijderd uit het schema.`);
          }
        }
      ]
    );
  };

  const handleMoveExercise = async () => {
    if (!moveExerciseId || !targetSchemaId) {
      Alert.alert('Fout', 'Geen oefening geselecteerd om te verplaatsen.');
      return;
    }

    const schema = allSchemas.find(s => s.id === targetSchemaId);
    if (!schema) {
      Alert.alert('Geen schema', 'Selecteer een schema.');
      return;
    }
    const muscleName = targetMuscleGroup === '__new__'
      ? customTargetMuscleGroup.trim()
      : targetMuscleGroup.trim();
    if (!muscleName) {
      Alert.alert('Spiergroep ontbreekt', 'Kies een spiergroep of voeg een nieuwe toe.');
      return;
    }

    const exercise = { id: moveExerciseId, name: moveExerciseName, met: moveExerciseMet };

    const isCustom = customSchemas.some(s => s.id === schema.id);
    const isDefault = WORKOUT_DATA.schemas.some(s => s.id === schema.id);
    const baseMuscleGroups = schema.muscleGroups.map(mg => ({ ...mg, exercises: [...mg.exercises] }));

    const mgIndex = baseMuscleGroups.findIndex(mg => mg.name === muscleName);
    if (mgIndex >= 0) {
      baseMuscleGroups[mgIndex].exercises.push(exercise);
    } else {
      baseMuscleGroups.push({
        id: `mg-${Date.now()}`,
        name: muscleName,
        exercises: [exercise],
      });
    }

    const updatedSchema: Schema = { ...schema, muscleGroups: baseMuscleGroups };

    if (isDefault) {
      await saveSchemaOverride(schema.id, updatedSchema);
    } else if (isCustom) {
      await upsertCustomSchema(updatedSchema);
    }

    // Remove from original location
    const isFromDefault = WORKOUT_DATA.schemas.some(s => s.id === moveFromSchemaId);
    await removeExerciseFromSchema(moveFromSchemaId, moveFromMuscleGroupId, moveExerciseId, isFromDefault);

    await refresh();
    setMoveExerciseId(null);
    setMoveExerciseName('');
    setMoveExerciseMet(5.0);
    setMoveFromSchemaId('');
    setMoveFromMuscleGroupId('');
    Alert.alert('Verplaatst', `"${moveExerciseName}" is verplaatst naar ${schema.name}.`);
  };

  const renderPills = (
    options: string[],
    value: string,
    onSelect: (v: string) => void,
    getLabel?: (v: string) => string,
  ) => (
    <View style={styles.pillRow}>
      {options.map(opt => {
        const isSelected = opt === value;
        const label = getLabel ? getLabel(opt) : opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.85}
          >
            <ThemedText style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {opt === '__new__' ? 'Nieuwe spiergroep' : label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSchemaCard = (schema: Schema, isCustom: boolean) => (
    <View key={schema.id} style={styles.schemaCard}>
      <View style={styles.schemaHeader}>
        <View>
          <ThemedText type="defaultSemiBold" style={styles.schemaName}>{schema.name}</ThemedText>
          <ThemedText style={styles.schemaDescription}>{schema.description}</ThemedText>
        </View>
        <View style={[styles.colorDot, { backgroundColor: schema.color }]} />
      </View>
      {schema.muscleGroups.map(mg => (
        <View key={mg.id} style={styles.muscleGroup}>
          <ThemedText type="defaultSemiBold" style={styles.muscleName}>{mg.name}</ThemedText>
          {mg.exercises.map(ex => (
            <View key={ex.id} style={styles.exerciseRow}>
              <ThemedText style={styles.exerciseText}>{ex.name} • MET {ex.met}</ThemedText>
              <TouchableOpacity 
                onPress={() => handleRemoveExercise(schema.id, mg.id, ex.id, ex.name, ex.met)}
                style={styles.exerciseDeleteButton}
              >
                <ThemedText style={styles.exerciseDeleteText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
      {isCustom && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(schema.id)}>
          <ThemedText style={styles.deleteButtonText}>Verwijder schema</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.title}>Schema Editor</ThemedText>
      <ThemedText style={styles.subtitle}>
        Maak je eigen schema's of beheer bestaande. Nieuwe schema's verschijnen direct in de Workout tab.
      </ThemedText>

      <View style={styles.form}>
        <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Nieuw schema</ThemedText>
        <TextInput
          placeholder="Naam"
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Omschrijving"
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
        <TextInput
          placeholder="Kleur (hex)"
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          value={color}
          onChangeText={setColor}
          style={styles.input}
        />

        <ThemedText style={styles.subLabel}>Oefeningen (optioneel)</ThemedText>
        <TextInput
          placeholder="Nieuwe oefening"
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          value={newExerciseNameDraft}
          onChangeText={setNewExerciseNameDraft}
          style={styles.input}
        />
          <TextInput
            placeholder="MET (optioneel, bv 5.0)"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={newExerciseMetDraft}
            onChangeText={setNewExerciseMetDraft}
            style={styles.input}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddExerciseToDraft} activeOpacity={0.85}>
            <ThemedText style={styles.secondaryButtonText}>Voeg oefening toe aan schema</ThemedText>
          </TouchableOpacity>

          {newExercises.length > 0 && (
            <View style={styles.exerciseListBox}>
              {newExercises.map(ex => (
                <View key={ex.id} style={styles.exerciseItemRow}>
                  <ThemedText style={styles.exerciseItemText}>{ex.name} • MET {ex.met}</ThemedText>
                  <TouchableOpacity onPress={() => handleRemoveExerciseFromDraft(ex.id)} style={styles.deleteChip}>
                    <ThemedText style={styles.deleteChipText}>Verwijder</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleCreateSchema}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.saveButtonText}>Opslaan</ThemedText>
          </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
          {moveExerciseId ? `Verplaats "${moveExerciseName}" naar:` : 'Oefening toevoegen aan schema'}
        </ThemedText>
        {moveExerciseId && (
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => {
              setMoveExerciseId(null);
              setMoveExerciseName('');
              setMoveExerciseMet(5.0);
            }}
          >
            <ThemedText style={styles.secondaryButtonText}>Annuleer verplaatsing</ThemedText>
          </TouchableOpacity>
        )}
        <ThemedText style={styles.subLabel}>Schema</ThemedText>
        {renderPills(
          allSchemas.map(s => s.id),
          targetSchemaId || (allSchemas[0]?.id || ''),
          (schemaId) => {
            setTargetSchemaId(schemaId);
            const schema = allSchemas.find(s => s.id === schemaId);
            const firstMg = schema?.muscleGroups[0]?.name || '';
            setTargetMuscleGroup(firstMg || '__new__');
          },
          (schemaId) => allSchemas.find(s => s.id === schemaId)?.name || schemaId
        )}
        <ThemedText style={styles.subLabel}>Spiergroep</ThemedText>
        {renderPills(['__new__', ...allMuscleGroups], targetMuscleGroup || allMuscleGroups[0] || '__new__', setTargetMuscleGroup)}
        {targetMuscleGroup === '__new__' && (
          <TextInput
            placeholder="Nieuwe spiergroep"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={customTargetMuscleGroup}
            onChangeText={setCustomTargetMuscleGroup}
            style={styles.input}
          />
        )}
        {!moveExerciseId && (
          <>
            <TextInput
              placeholder="Nieuwe oefening"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              style={styles.input}
            />
            <TextInput
              placeholder="MET (optioneel, bv 5.0)"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              value={newExerciseMet}
              onChangeText={setNewExerciseMet}
              style={styles.input}
              keyboardType="decimal-pad"
            />
          </>
        )}
        <TouchableOpacity style={styles.saveButton} onPress={handleAddExerciseToSchema} activeOpacity={0.85}>
          <ThemedText style={styles.saveButtonText}>Voeg toe</ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Jouw schema's</ThemedText>
      {customSchemas.length === 0 && (
        <ThemedText style={styles.emptyText}>Nog geen aangepaste schema's.</ThemedText>
      )}
      {customSchemas.map(schema => renderSchemaCard(schema, true))}

      <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>Standaard schema's</ThemedText>
      {defaultSchemas.map(schema => renderSchemaCard(schema, false))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
  },
  subLabel: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  form: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  pillSelected: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  pillText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
  },
  pillTextSelected: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 10,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.ACCENT,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
  },
  exerciseListBox: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseItemText: {
    color: COLORS.TEXT_PRIMARY,
  },
  deleteChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
  },
  deleteChipText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  schemaCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  schemaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  schemaName: {
    fontSize: 16,
  },
  schemaDescription: {
    color: COLORS.TEXT_SECONDARY,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  muscleGroup: {
    marginTop: 6,
  },
  muscleName: {
    marginBottom: 2,
  },
  exerciseList: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    marginTop: 4,
  },
  exerciseText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    flex: 1,
  },
  exerciseDeleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  exerciseDeleteText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '700',
  },
});
