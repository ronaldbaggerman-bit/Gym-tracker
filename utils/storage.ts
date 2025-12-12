import type { PersonalRecord } from '@/app/types/workout';
import {
    bulkInsertSessionsToDB,
    deleteSessionFromDB,
    getPRFromDB,
    initDatabase,
    loadAllSessionsFromDB,
    loadPRsFromDB,
    loadSessionsFromDB,
    savePRToDB,
    saveSessionToDB,
} from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSIONS_KEY = 'workout_sessions_v1';
const PRS_KEY = 'personal_records_v1';
const DB_MIGRATED_KEY = 'db_migrated_v1';

async function migrateToDatabase() {
  try {
    const migrated = await AsyncStorage.getItem(DB_MIGRATED_KEY);
    if (migrated === 'true') return;

    console.log('[Storage] Starting migration from AsyncStorage to SQLite...');
    await initDatabase();

    const rawSessions = await AsyncStorage.getItem(SESSIONS_KEY);
    if (rawSessions) {
      const sessions = JSON.parse(rawSessions);
      if (Array.isArray(sessions) && sessions.length > 0) {
        await bulkInsertSessionsToDB(sessions);
        console.log('[Storage] Migrated', sessions.length, 'sessions to SQLite');
      }
    }

    const rawPRs = await AsyncStorage.getItem(PRS_KEY);
    if (rawPRs) {
      const prs = JSON.parse(rawPRs);
      for (const [exerciseName, pr] of Object.entries(prs)) {
        await savePRToDB(exerciseName, pr as PersonalRecord);
      }
      console.log('[Storage] Migrated personal records to SQLite');
    }

    await AsyncStorage.setItem(DB_MIGRATED_KEY, 'true');
    console.log('[Storage] Migration complete');
  } catch (e) {
    console.error('[Storage] Migration error:', e);
  }
}

export async function saveSession(session: any) {
  try {
    await migrateToDatabase();
    return await saveSessionToDB(session);
  } catch (e) {
    console.error('saveSession error', e);
    return false;
  }
}

export async function loadSessions(limit?: number, offset?: number) {
  try {
    await migrateToDatabase();
    if (limit !== undefined && offset !== undefined) {
      return await loadSessionsFromDB(limit, offset);
    }
    return await loadAllSessionsFromDB();
  } catch (e) {
    console.error('loadSessions error', e);
    return [];
  }
}

export async function saveSessionsList(sessions: any[]) {
  try {
    await migrateToDatabase();
    return await bulkInsertSessionsToDB(sessions);
  } catch (e) {
    console.error('saveSessionsList error', e);
    return false;
  }
}

export async function clearSessions() {
  try {
    await migrateToDatabase();
    await AsyncStorage.removeItem(SESSIONS_KEY);
    return true;
  } catch (e) {
    console.error('clearSessions error', e);
    return false;
  }
}

export async function removeSession(sessionId: string) {
  try {
    await migrateToDatabase();
    return await deleteSessionFromDB(sessionId);
  } catch (e) {
    console.error('removeSession error', e);
    return false;
  }
}

export async function savePR(exerciseName: string, pr: PersonalRecord) {
  try {
    await migrateToDatabase();
    return await savePRToDB(exerciseName, pr);
  } catch (e) {
    console.error('savePR error', e);
    return false;
  }
}

export async function loadPRs(): Promise<Record<string, PersonalRecord>> {
  try {
    await migrateToDatabase();
    return await loadPRsFromDB();
  } catch (e) {
    console.error('loadPRs error', e);
    return {};
  }
}

export async function getPR(exerciseName: string): Promise<PersonalRecord | null> {
  try {
    await migrateToDatabase();
    return await getPRFromDB(exerciseName);
  } catch (e) {
    console.error('getPR error', e);
    return null;
  }
}
