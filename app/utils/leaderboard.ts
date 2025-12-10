import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonalRecord } from '@/app/types/workout';

const ACHIEVEMENTS_KEY = 'user_achievements';
const LEADERBOARD_KEY = 'leaderboard_data';

interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'strength' | 'endurance' | 'consistency' | 'milestone';
  progress?: number;
}

interface LeaderboardEntry {
  rank: number;
  userName: string;
  userId: string;
  score: number;
  achievements: number;
  totalVolume: number;
  exercisesTracked: number;
  lastUpdated: string;
}

const ACHIEVEMENT_DEFINITIONS: UserAchievement[] = [
  {
    id: 'first_workout',
    title: 'First Step',
    description: 'Complete your first workout',
    icon: '🎯',
    unlockedAt: '',
    category: 'milestone',
  },
  {
    id: 'ten_workouts',
    title: 'Building Momentum',
    description: 'Complete 10 workouts',
    icon: '💪',
    unlockedAt: '',
    category: 'consistency',
  },
  {
    id: 'century_volume',
    title: 'Heavy Lifter',
    description: 'Achieve 100+ kg total volume in one workout',
    icon: '⚡',
    unlockedAt: '',
    category: 'strength',
  },
  {
    id: 'hundred_workouts',
    title: 'Iron Will',
    description: 'Complete 100 workouts',
    icon: '🏆',
    unlockedAt: '',
    category: 'consistency',
  },
  {
    id: 'max_weight_pr',
    title: 'Personal Record Hunter',
    description: 'Set 5 new weight personal records',
    icon: '🔝',
    unlockedAt: '',
    category: 'strength',
  },
  {
    id: 'seven_day_streak',
    title: 'Week Warrior',
    description: 'Work out 7 days in a row',
    icon: '🔥',
    unlockedAt: '',
    category: 'consistency',
  },
];

/**
 * Get user achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load achievements:', error);
    return [];
  }
}

/**
 * Unlock an achievement
 */
export async function unlockAchievement(achievementId: string): Promise<UserAchievement | null> {
  try {
    const achievements = await getUserAchievements();
    const definition = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);

    if (!definition) return null;

    const existing = achievements.find(a => a.id === achievementId);
    if (existing) return existing; // Already unlocked

    const achievement: UserAchievement = {
      ...definition,
      unlockedAt: new Date().toISOString(),
    };

    achievements.push(achievement);
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));

    return achievement;
  } catch (error) {
    console.error('Failed to unlock achievement:', error);
    return null;
  }
}

/**
 * Get leaderboard entries
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load leaderboard:', error);
    return [];
  }
}

/**
 * Update leaderboard entry (local)
 */
export async function updateLeaderboardEntry(entry: Omit<LeaderboardEntry, 'rank'>): Promise<void> {
  try {
    const leaderboard = await getLeaderboard();
    const existingIndex = leaderboard.findIndex(e => e.userId === entry.userId);

    const newEntry = {
      ...entry,
      rank: 1,
    };

    if (existingIndex >= 0) {
      leaderboard[existingIndex] = newEntry;
    } else {
      leaderboard.push(newEntry);
    }

    // Sort by score and assign ranks
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
  }
}

/**
 * Calculate user score based on PRs
 */
export function calculateUserScore(prs: Record<string, PersonalRecord>): number {
  if (!prs || Object.keys(prs).length === 0) return 0;

  let score = 0;
  for (const pr of Object.values(prs)) {
    // Weight score: 1 point per kg
    score += pr.maxWeight || 0;
    // Reps score: 10 points per rep
    score += (pr.maxReps || 0) * 10;
  }

  return Math.round(score);
}

/**
 * Format leaderboard rank display
 */
export function formatRank(rank: number): string {
  if (rank === 1) return '🥇 1st';
  if (rank === 2) return '🥈 2nd';
  if (rank === 3) return '🥉 3rd';
  return `#${rank}`;
}

/**
 * Share achievement
 */
export function getAchievementShareText(achievement: UserAchievement): string {
  return `🎉 I just unlocked "${achievement.title}" on Gym-Track!\n${achievement.icon} ${achievement.description}\n\nJoin me and track your fitness journey!`;
}

/**
 * Check and award achievements based on PRs
 */
export async function checkAndAwardAchievements(
  prs: Record<string, PersonalRecord>,
  totalWorkouts: number,
  totalVolume: number
): Promise<UserAchievement[]> {
  const unlockedAchievements: UserAchievement[] = [];

  // Check first workout
  if (totalWorkouts === 1) {
    const unlocked = await unlockAchievement('first_workout');
    if (unlocked) unlockedAchievements.push(unlocked);
  }

  // Check ten workouts
  if (totalWorkouts === 10) {
    const unlocked = await unlockAchievement('ten_workouts');
    if (unlocked) unlockedAchievements.push(unlocked);
  }

  // Check hundred workouts
  if (totalWorkouts === 100) {
    const unlocked = await unlockAchievement('hundred_workouts');
    if (unlocked) unlockedAchievements.push(unlocked);
  }

  // Check century volume
  if (totalVolume >= 100) {
    const unlocked = await unlockAchievement('century_volume');
    if (unlocked) unlockedAchievements.push(unlocked);
  }

  // Check max weight PRs (5 total)
  if (Object.keys(prs).length >= 5) {
    const unlocked = await unlockAchievement('max_weight_pr');
    if (unlocked) unlockedAchievements.push(unlocked);
  }

  return unlockedAchievements;
}
