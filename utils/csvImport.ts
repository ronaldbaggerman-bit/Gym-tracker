import type { DifficultyRating, WorkoutSession as Session, WorkoutExercise, WorkoutSession } from '@/app/types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'workout_sessions_v1';

async function loadSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('loadSessions error', e);
    return [];
  }
}

async function saveSessionsList(sessions: Session[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (e) {
    console.error('saveSessionsList error', e);
    return false;
  }
}

interface ParsedRow {
  date: string;
  schema: string;
  exercise: string;
  muscleGroup: string;
  sets?: string;
  reps?: string;
  weight?: string;
  durationMinutes?: string;
}

const splitCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.length > 0) result.push(current.trim());
  return result;
};

const parseNumberList = (value: string | undefined, count: number, fallback: number): number[] => {
  if (!value || value.trim() === '') return Array(count).fill(fallback);
  const parts = value.split(/\||;/).map(v => parseFloat(v.trim())).filter(v => !Number.isNaN(v));
  if (parts.length === 0) return Array(count).fill(fallback);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(parts[i] ?? parts[parts.length - 1] ?? fallback);
  }
  return out;
};

const toSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const parseDate = (dateStr: string): string => {
  const trimmed = dateStr.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }
  return trimmed;
};

export async function importCsvSessions(csv: string): Promise<{ imported: number }> {
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { imported: 0 };

  const headerCols = splitCsvLine(lines[0]).map(c => c.toLowerCase());
  const hasHeader = headerCols.includes('date') && headerCols.includes('schema');
  const rows = hasHeader ? lines.slice(1) : lines;
  const cols = hasHeader
    ? headerCols
    : ['date', 'schema', 'exercise', 'musclegroup', 'sets', 'reps', 'weight', 'durationminutes'];

  const parsed: ParsedRow[] = rows.map(line => {
    const values = splitCsvLine(line);
    const row: any = {};
    cols.forEach((c, idx) => {
      row[c] = values[idx] ?? '';
    });
    return row as ParsedRow;
  }).filter(r => r.date && r.schema && r.exercise);

  const grouped: Record<string, WorkoutSession> = {};
  let exerciseIdCounter = Date.now();

  for (const row of parsed) {
    const date = parseDate(row.date.trim());
    const schemaName = row.schema.trim();
    const key = `${date}__${schemaName}`;
    if (!grouped[key]) {
      const start = new Date(`${date}T08:00:00`);
      const duration = row.durationMinutes ? parseInt(row.durationMinutes, 10) : 0;
      const end = duration > 0 ? new Date(start.getTime() + duration * 60000) : null;
      grouped[key] = {
        id: `import-${key}`,
        date,
        schemaId: toSlug(schemaName) || 'imported',
        schemaName,
        exercises: [],
        startTime: start,
        endTime: end,
        completed: true,
      } as WorkoutSession;
    }

    const setsCount = row.sets ? parseInt(row.sets, 10) || 3 : 3;
    const repsArr = parseNumberList(row.reps, setsCount, 12);
    const weightArr = parseNumberList(row.weight, setsCount, 0);
    const sets = Array.from({ length: setsCount }, (_, i) => ({
      setNumber: i + 1,
      reps: repsArr[i],
      weight: weightArr[i],
      completed: true,
      difficulty: 'goed' as DifficultyRating,
    }));

    const exercise: WorkoutExercise = {
      exerciseId: exerciseIdCounter++,
      name: row.exercise.trim(),
      muscleGroup: row.muscleGroup?.trim() || 'Onbekend',
      met: 5,
      sets,
      completed: true,
    };

    grouped[key].exercises.push(exercise);
  }

  const importedSessions = Object.values(grouped).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const existing = await loadSessions();

  const map = new Map<string, WorkoutSession>();
  for (const s of importedSessions) map.set(s.id, s);
  for (const s of existing) if (!map.has(s.id)) map.set(s.id, s);

  const merged = Array.from(map.values());
  await saveSessionsList(merged);
  return { imported: importedSessions.length };
}

export async function clearImportedSessions() {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    const filtered = sessions.filter((s: any) => typeof s.id === 'string' && !s.id.startsWith('import-'));
    await saveSessionsList(filtered);
    return true;
  } catch (e) {
    console.error('clearImportedSessions error', e);
    return false;
  }
}
