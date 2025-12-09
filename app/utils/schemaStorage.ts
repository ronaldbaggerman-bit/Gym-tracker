import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Schema } from '@/app/data/workoutData';

const CUSTOM_SCHEMAS_KEY = 'custom_schemas_v1';
const SCHEMA_OVERRIDES_KEY = 'schema_overrides_v1';

export async function loadCustomSchemas(): Promise<Schema[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_SCHEMAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('loadCustomSchemas error', error);
    return [];
  }
}

export async function saveCustomSchemas(schemas: Schema[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CUSTOM_SCHEMAS_KEY, JSON.stringify(schemas));
  } catch (error) {
    console.error('saveCustomSchemas error', error);
  }
}

export async function loadSchemaOverrides(): Promise<Record<string, Schema>> {
  try {
    const raw = await AsyncStorage.getItem(SCHEMA_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('loadSchemaOverrides error', error);
    return {};
  }
}

export async function saveSchemaOverride(schemaId: string, schema: Schema): Promise<void> {
  try {
    const overrides = await loadSchemaOverrides();
    overrides[schemaId] = schema;
    await AsyncStorage.setItem(SCHEMA_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('saveSchemaOverride error', error);
  }
}

export async function addCustomSchema(schema: Schema): Promise<void> {
  const current = await loadCustomSchemas();
  const updated = [schema, ...current];
  await saveCustomSchemas(updated);
}

export async function upsertCustomSchema(schema: Schema): Promise<void> {
  const current = await loadCustomSchemas();
  const idx = current.findIndex(s => s.id === schema.id);
  if (idx >= 0) {
    current[idx] = schema;
    await saveCustomSchemas(current);
  } else {
    await addCustomSchema(schema);
  }
}

export async function deleteCustomSchema(schemaId: string): Promise<void> {
  const current = await loadCustomSchemas();
  const filtered = current.filter(s => s.id !== schemaId);
  await saveCustomSchemas(filtered);
}

export function mergeSchemas(defaultSchemas: Schema[], customSchemas: Schema[]): Schema[] {
  return [...customSchemas, ...defaultSchemas];
}

export async function applyOverrides(schemas: Schema[]): Promise<Schema[]> {
  const overrides = await loadSchemaOverrides();
  return schemas.map(schema => overrides[schema.id] || schema);
}

export async function removeExerciseFromSchema(
  schemaId: string,
  muscleGroupId: string,
  exerciseId: number,
  isDefaultSchema: boolean
): Promise<void> {
  if (isDefaultSchema) {
    const overrides = await loadSchemaOverrides();
    const schema = overrides[schemaId];
    if (!schema) return;
    
    const updatedMuscleGroups = schema.muscleGroups.map(mg => {
      if (mg.id === muscleGroupId) {
        return {
          ...mg,
          exercises: mg.exercises.filter(ex => ex.id !== exerciseId)
        };
      }
      return mg;
    }).filter(mg => mg.exercises.length > 0);
    
    const updatedSchema = { ...schema, muscleGroups: updatedMuscleGroups };
    await saveSchemaOverride(schemaId, updatedSchema);
  } else {
    const customs = await loadCustomSchemas();
    const schema = customs.find(s => s.id === schemaId);
    if (!schema) return;
    
    const updatedMuscleGroups = schema.muscleGroups.map(mg => {
      if (mg.id === muscleGroupId) {
        return {
          ...mg,
          exercises: mg.exercises.filter(ex => ex.id !== exerciseId)
        };
      }
      return mg;
    }).filter(mg => mg.exercises.length > 0);
    
    const updatedSchema = { ...schema, muscleGroups: updatedMuscleGroups };
    await upsertCustomSchema(updatedSchema);
  }
}
