import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'gym_track.db';
let db: SQLite.SQLiteDatabase | null = null;

// Query result caching
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const queryCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

/**
 * Check if cached data is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get from cache if valid
 */
function getFromCache(key: string): any | null {
  const entry = queryCache[key];
  if (entry && isCacheValid(entry)) {
    return entry.data;
  }
  delete queryCache[key];
  return null;
}

/**
 * Store in cache
 */
function setCache(key: string, data: any, ttl: number = CACHE_TTL): void {
  queryCache[key] = {
    data,
    timestamp: Date.now(),
    ttl,
  };
}

/**
 * Clear cache for specific pattern
 */
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
    
    // Create sessions table with indexes for performance
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
    
    // Create personal records table
    await db.execAsync(`DROP TABLE IF EXISTS personal_records;`);
    
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
    
    // Optimize database performance
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

// Session operations with pagination
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

/**
 * Load sessions with pagination for better performance on large datasets
 * @param limit Number of records per page
 * @param offset Starting position
 */
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

    setCache(cacheKey, parsed, 2 * 60 * 1000); // Cache for 2 minutes
    return parsed;
  } catch (e) {
    console.error('[Database] loadSessionsFromDB error:', e);
    return [];
  }
}

/**
 * Get total session count for pagination
 */
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
    setCache(cacheKey, count, 1 * 60 * 1000); // Cache for 1 minute
    return count;
  } catch (e) {
    console.error('[Database] getSessionCountFromDB error:', e);
    return 0;
  }
}

/**
 * Get all sessions without pagination (for reports/export)
 * Use with caution on large datasets
 */
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

    setCache(cacheKey, parsed, 5 * 60 * 1000); // Cache for 5 minutes
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

/**
 * Optimized bulk insert with transaction
 */
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

// Personal Records operations with caching
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

/**
 * Load all PRs with caching
 */
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

    setCache(cacheKey, prs, 5 * 60 * 1000); // Cache for 5 minutes
    return prs;
  } catch (e) {
    console.error('[Database] loadPRsFromDB error:', e);
    return {};
  }
}

/**
 * Get specific PR with caching
 */
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

    setCache(cacheKey, pr, 5 * 60 * 1000); // Cache for 5 minutes
    return pr;
  } catch (e) {
    console.error('[Database] getPRFromDB error:', e);
    return null;
  }
}

/**
 * Get database statistics for debugging
 */
export async function getDatabaseStats() {
  try {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    const sessionCount = await getSessionCountFromDB();
    const prResult: any = await database.getFirstAsync('SELECT COUNT(*) as count FROM personal_records');
    const prCount = prResult?.count || 0;

    return {
      sessionCount,
      prCount,
      cacheSize: Object.keys(queryCache).length,
      cacheTTL: CACHE_TTL,
    };
  } catch (e) {
    console.error('[Database] getDatabaseStats error:', e);
    return null;
  }
}

/**
 * Clear all caches manually
 */
export function clearAllCaches() {
  clearCache();
  console.log('[Database] All caches cleared');
}
