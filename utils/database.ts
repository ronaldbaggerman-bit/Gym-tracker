import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'gym_track.db';
let db: SQLite.SQLiteDatabase | null = null;

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const queryCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000;

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

function getFromCache(key: string): any | null {
  const entry = queryCache[key];
  if (entry && isCacheValid(entry)) {
    return entry.data;
  }
  delete queryCache[key];
  return null;
}

function setCache(key: string, data: any, ttl: number = CACHE_TTL): void {
  queryCache[key] = {
    data,
    timestamp: Date.now(),
    ttl,
  };
}

function clearCache(pattern?: string): void {
  if (!pattern) {
    Object.keys(queryCache).forEach(key => delete queryCache[key]);
  } else {
    Object.keys(queryCache).forEach(key => {
      if (key.includes(pattern)) {
        delete queryCache[key];
      }
    });
  }
}

export async function initDatabase() {
  try {
    if (db) return db;
    
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        schemaId TEXT NOT NULL,
        schemaName TEXT NOT NULL,
        exercises TEXT,
        startTime TEXT,
        endTime TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_date ON sessions(date);
      CREATE INDEX IF NOT EXISTS idx_schemaId ON sessions(schemaId);
      CREATE INDEX IF NOT EXISTS idx_updatedAt ON sessions(updatedAt DESC);
    `);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS personal_records (
        exerciseName TEXT PRIMARY KEY,
        maxWeight REAL NOT NULL,
        maxReps INTEGER NOT NULL,
        maxWeightDate TEXT NOT NULL,
        maxRepsDate TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pr_updatedAt ON personal_records(updatedAt DESC);
    `);
    
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = -64000;
      PRAGMA foreign_keys = ON;
    `);
    
    console.log('[Database] Initialized successfully with optimizations');
    return db;
  } catch (e) {
    console.error('[Database] Init error:', e);
    throw e;
  }
}

export async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

export async function saveSessionToDB(session: any) {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    const exercisesJson = session.exercises ? JSON.stringify(session.exercises) : null;
    const startTime = session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime;
    const endTime = session.endTime instanceof Date ? session.endTime.toISOString() : session.endTime;
    const now = new Date().toISOString();

    await database.runAsync(
      `INSERT OR REPLACE INTO sessions (id, date, schemaId, schemaName, exercises, startTime, endTime, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.id, session.date, session.schemaId, session.schemaName, exercisesJson, startTime, endTime, now]
    );
    
    clearCache('sessions');
    console.log('[Database] Session saved:', session.id);
    return true;
  } catch (e) {
    console.error('[Database] saveSessionToDB error:', e);
    return false;
  }
}

export async function loadSessionsFromDB(limit: number = 100, offset: number = 0) {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    const cacheKey = `sessions_${limit}_${offset}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('[Database] Sessions loaded from cache');
      return cached;
    }

    const result = await database.getAllAsync(
      'SELECT * FROM sessions ORDER BY date DESC, id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const parsed = result.map((row: any) => ({
      ...row,
      exercises: row.exercises ? JSON.parse(row.exercises) : [],
      startTime: row.startTime ? new Date(row.startTime) : null,
      endTime: row.endTime ? new Date(row.endTime) : null,
    }));

    setCache(cacheKey, parsed, 2 * 60 * 1000);
    return parsed;
  } catch (e) {
    console.error('[Database] loadSessionsFromDB error:', e);
    return [];
  }
}

export async function getSessionCountFromDB(): Promise<number> {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    const cacheKey = 'session_count';
    const cached = getFromCache(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result: any = await database.getFirstAsync(
      'SELECT COUNT(*) as count FROM sessions'
    );

    const count = result?.count || 0;
    setCache(cacheKey, count, 1 * 60 * 1000);
    return count;
  } catch (e) {
    console.error('[Database] getSessionCountFromDB error:', e);
    return 0;
  }
}

export async function loadAllSessionsFromDB() {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    const cacheKey = 'sessions_all';
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('[Database] All sessions loaded from cache');
      return cached;
    }

    const result = await database.getAllAsync(
      'SELECT * FROM sessions ORDER BY date DESC, id DESC'
    );

    const parsed = result.map((row: any) => ({
      ...row,
      exercises: row.exercises ? JSON.parse(row.exercises) : [],
      startTime: row.startTime ? new Date(row.startTime) : null,
      endTime: row.endTime ? new Date(row.endTime) : null,
    }));

    setCache(cacheKey, parsed, 5 * 60 * 1000);
    return parsed;
  } catch (e) {
    console.error('[Database] loadAllSessionsFromDB error:', e);
    return [];
  }
}

export async function deleteSessionFromDB(sessionId: string) {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    await database.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
    clearCache('sessions');
    console.log('[Database] Session deleted:', sessionId);
    return true;
  } catch (e) {
    console.error('[Database] deleteSessionFromDB error:', e);
    return false;
  }
}

export async function clearAllSessionsFromDB() {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    await database.runAsync('DELETE FROM sessions');
    clearCache('sessions');
    console.log('[Database] All sessions cleared');
    return true;
  } catch (e) {
    console.error('[Database] clearAllSessionsFromDB error:', e);
    return false;
  }
}

export async function bulkInsertSessionsToDB(sessions: any[]) {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    await database.withTransactionAsync(async () => {
      for (const session of sessions) {
        const exercisesJson = session.exercises ? JSON.stringify(session.exercises) : null;
        const startTime = session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime;
        const endTime = session.endTime instanceof Date ? session.endTime.toISOString() : session.endTime;

        await database.runAsync(
          `INSERT OR REPLACE INTO sessions (id, date, schemaId, schemaName, exercises, startTime, endTime)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [session.id, session.date, session.schemaId, session.schemaName, exercisesJson, startTime, endTime]
        );
      }
    });

    clearCache('sessions');
    console.log('[Database] Bulk inserted:', sessions.length, 'sessions');
    return true;
  } catch (e) {
    console.error('[Database] bulkInsertSessionsToDB error:', e);
    return false;
  }
}

export async function savePRToDB(exerciseName: string, pr: any) {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    if (!pr.maxWeight || !pr.maxReps) {
      console.warn('[Database] Skipping PR save - missing maxWeight or maxReps:', exerciseName, pr);
      return false;
    }

    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT OR REPLACE INTO personal_records (exerciseName, maxWeight, maxReps, maxWeightDate, maxRepsDate, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exerciseName, pr.maxWeight, pr.maxReps, pr.maxWeightDate || now, pr.maxRepsDate || now, now]
    );
    
    clearCache('pr');
    console.log('[Database] PR saved:', exerciseName);
    return true;
  } catch (e) {
    console.error('[Database] savePRToDB error:', e);
    return false;
  }
}

export async function loadPRsFromDB() {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    const cacheKey = 'prs_all';
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('[Database] PRs loaded from cache');
      return cached;
    }

    const result = await database.getAllAsync('SELECT * FROM personal_records');
    const prs: Record<string, any> = {};
    
    result.forEach((row: any) => {
      prs[row.exerciseName] = {
        maxWeight: row.maxWeight,
        maxReps: row.maxReps,
        maxWeightDate: row.maxWeightDate,
        maxRepsDate: row.maxRepsDate,
      };
    });

    setCache(cacheKey, prs, 5 * 60 * 1000);
    return prs;
  } catch (e) {
    console.error('[Database] loadPRsFromDB error:', e);
    return {};
  }
}

export async function getPRFromDB(exerciseName: string) {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    const cacheKey = `pr_${exerciseName}`;
    const cached = getFromCache(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result: any = await database.getFirstAsync(
      'SELECT * FROM personal_records WHERE exerciseName = ?',
      [exerciseName]
    );

    const pr = result ? {
      maxWeight: result.maxWeight,
      maxReps: result.maxReps,
      maxWeightDate: result.maxWeightDate,
      maxRepsDate: result.maxRepsDate,
    } : null;

    setCache(cacheKey, pr, 5 * 60 * 1000);
    return pr;
  } catch (e) {
    console.error('[Database] getPRFromDB error:', e);
    return null;
  }
}
