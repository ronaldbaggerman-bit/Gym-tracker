import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonalRecord } from '@/app/types/workout';

const SESSIONS_KEY = 'workout_sessions_v1';
const PRS_KEY = 'personal_records_v1'; // Format: { exerciseName: PersonalRecord }

export async function saveSession(session: any) {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    // If a session with the same id exists, replace it. Otherwise add to the front.
    const existingIndex = sessions.findIndex((s: any) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session); // newest first
    }
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (e) {
    console.error('saveSession error', e);
    return false;
  }
}

export async function loadSessions() {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    return sessions;
  } catch (e) {
    console.error('loadSessions error', e);
    return [];
  }
}

export async function clearSessions() {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
    return true;
  } catch (e) {
    console.error('clearSessions error', e);
    return false;
  }
}

export async function removeSession(sessionId: string) {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    const filtered = sessions.filter((s: any) => s.id !== sessionId);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('removeSession error', e);
    return false;
  }
}

// Personal Records storage
export async function savePR(exerciseName: string, pr: PersonalRecord) {
  try {
    const raw = await AsyncStorage.getItem(PRS_KEY);
    const prs: Record<string, PersonalRecord> = raw ? JSON.parse(raw) : {};
    prs[exerciseName] = pr;
    await AsyncStorage.setItem(PRS_KEY, JSON.stringify(prs));
    return true;
  } catch (e) {
    console.error('savePR error', e);
    return false;
  }
}

export async function loadPRs(): Promise<Record<string, PersonalRecord>> {
  try {
    const raw = await AsyncStorage.getItem(PRS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('loadPRs error', e);
    return {};
  }
}

export async function getPR(exerciseName: string): Promise<PersonalRecord | null> {
  try {
    const prs = await loadPRs();
    return prs[exerciseName] || null;
  } catch (e) {
    console.error('getPR error', e);
    return null;
  }
}
