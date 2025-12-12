import type { Schema } from '@/app/data/workoutData';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
