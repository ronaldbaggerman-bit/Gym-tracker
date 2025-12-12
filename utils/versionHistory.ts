import type { WorkoutSession } from '@/app/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERSION_HISTORY_KEY = 'session_version_history';
const MAX_VERSIONS_PER_SESSION = 10;

export interface SessionVersion {
  versionId: string;
  sessionId: string;
  timestamp: string;
  data: WorkoutSession;
  changeDescription?: string;
}

interface SessionVersionHistory {
  [sessionId: string]: SessionVersion[];
}

export async function getVersionHistory(): Promise<SessionVersionHistory> {
  try {
    const stored = await AsyncStorage.getItem(VERSION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load version history:', error);
    return {};
  }
}

export async function getSessionVersions(sessionId: string): Promise<SessionVersion[]> {
  try {
    const history = await getVersionHistory();
    return history[sessionId] || [];
  } catch (error) {
    console.warn('Failed to get session versions:', error);
    return [];
  }
}

export async function saveSessionVersion(
  session: WorkoutSession,
  changeDescription?: string
): Promise<SessionVersion> {
  try {
    const history = await getVersionHistory();
    const sessionId = session.id || `session_${Date.now()}`;
    
    const version: SessionVersion = {
      versionId: `v_${sessionId}_${Date.now()}`,
      sessionId,
      timestamp: new Date().toISOString(),
      data: session,
      changeDescription: changeDescription || 'Auto-saved version',
    };

    if (!history[sessionId]) {
      history[sessionId] = [];
    }

    history[sessionId].push(version);

    if (history[sessionId].length > MAX_VERSIONS_PER_SESSION) {
      history[sessionId] = history[sessionId].slice(-MAX_VERSIONS_PER_SESSION);
    }

    await AsyncStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(history));
    return version;
  } catch (error) {
    console.error('Failed to save session version:', error);
    throw error;
  }
}

export async function getSessionVersion(versionId: string): Promise<SessionVersion | null> {
  try {
    const history = await getVersionHistory();
    for (const versions of Object.values(history)) {
      const found = versions.find(v => v.versionId === versionId);
      if (found) return found;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get session version:', error);
    return null;
  }
}

export async function restoreSessionVersion(versionId: string): Promise<WorkoutSession | null> {
  try {
    const version = await getSessionVersion(versionId);
    if (!version) {
      throw new Error('Version not found');
    }
    return version.data;
  } catch (error) {
    console.error('Failed to restore session version:', error);
    throw error;
  }
}

export async function deleteSessionVersion(versionId: string): Promise<void> {
  try {
    const history = await getVersionHistory();
    
    for (const sessionId of Object.keys(history)) {
      history[sessionId] = history[sessionId].filter(v => v.versionId !== versionId);
      if (history[sessionId].length === 0) {
        delete history[sessionId];
      }
    }

    await AsyncStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to delete session version:', error);
    throw error;
  }
}

export async function clearSessionVersions(sessionId: string): Promise<void> {
  try {
    const history = await getVersionHistory();
    delete history[sessionId];
    await AsyncStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to clear session versions:', error);
    throw error;
  }
}

export function compareVersions(
  v1: WorkoutSession,
  v2: WorkoutSession
): {
  exercisesAdded: number;
  exercisesRemoved: number;
  setsChanged: number;
  description: string;
} {
  const e1Names = new Set(v1.exercises?.map(e => e.name) || []);
  const e2Names = new Set(v2.exercises?.map(e => e.name) || []);

  const added = [...e2Names].filter(n => !e1Names.has(n)).length;
  const removed = [...e1Names].filter(n => !e2Names.has(n)).length;

  let setsChanged = 0;
  for (const e2 of v2.exercises || []) {
    const e1 = v1.exercises?.find(e => e.name === e2.name);
    if (e1) {
      const s1Count = e1.sets?.length || 0;
      const s2Count = e2.sets?.length || 0;
      setsChanged += Math.abs(s1Count - s2Count);
    }
  }

  let description = [];
  if (added > 0) description.push(`+${added} oefeningen`);
  if (removed > 0) description.push(`-${removed} oefeningen`);
  if (setsChanged > 0) description.push(`${setsChanged} sets gewijzigd`);

  return {
    exercisesAdded: added,
    exercisesRemoved: removed,
    setsChanged,
    description: description.join(', ') || 'Geen wijzigingen',
  };
}

export function formatVersionTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Nu';
    if (diffMinutes < 60) return `${diffMinutes}m geleden`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}u geleden`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d geleden`;

    return date.toLocaleDateString('nl-NL');
  } catch {
    return isoString;
  }
}
