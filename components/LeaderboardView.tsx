import { useThemeColors } from '@/app/hooks/useThemeColors';
import { ThemedText } from '@/components/themed-text';
import {
    formatRank,
    getAchievementShareText,
    getLeaderboard,
    getUserAchievements,
    type LeaderboardEntry,
    type UserAchievement,
} from '@/utils/leaderboard';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

interface LeaderboardViewProps {
  userId?: string;
  userName?: string;
}

export function LeaderboardView({ userId = 'local_user', userName = 'You' }: LeaderboardViewProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'achievements' | 'leaderboard'>('achievements');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ach, lb] = await Promise.all([getUserAchievements(), getLeaderboard()]);
      setAchievements(ach);
      setLeaderboard(lb);
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareAchievement = async (achievement: UserAchievement) => {
    try {
      await Share.share({
        message: getAchievementShareText(achievement),
        title: `Achievement: ${achievement.title}`,
      });
    } catch (error) {
      console.warn('Failed to share achievement:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const userRank = leaderboard.find(e => e.userId === userId);

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'achievements' && styles.tabActive]}
          onPress={() => setTab('achievements')}
        >
          <ThemedText style={[styles.tabText, tab === 'achievements' && styles.tabTextActive]}>
            🏆 Achievements ({achievements.length})
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'leaderboard' && styles.tabActive]}
          onPress={() => setTab('leaderboard')}
        >
          <ThemedText style={[styles.tabText, tab === 'leaderboard' && styles.tabTextActive]}>
            🏅 Leaderboard
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Achievements Tab */}
      {tab === 'achievements' && (
        <View style={styles.content}>
          {/* User Stats */}
          {userRank && (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{userName}</ThemedText>
                <ThemedText style={styles.userStat}>
                  {formatRank(userRank.rank)} • {userRank.score} points
                </ThemedText>
              </View>
              <ThemedText style={styles.userMilestone}>
                🎯 {achievements.length} Achievements
              </ThemedText>
            </View>
          )}

          {/* Achievements List */}
          {achievements.length > 0 ? (
            <FlatList
              data={achievements}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <ThemedText style={styles.icon}>{item.icon}</ThemedText>
                  </View>
                  <View style={styles.achievementInfo}>
                    <ThemedText style={styles.achievementTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.achievementDesc}>{item.description}</ThemedText>
                    <ThemedText style={styles.unlockedDate}>
                      Unlocked {new Date(item.unlockedAt).toLocaleDateString('nl-NL')}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleShareAchievement(item)}
                  >
                    <ThemedText style={styles.shareButtonText}>Share</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                No achievements yet. Keep training to unlock rewards!
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <View style={styles.content}>
          {leaderboard.length > 0 ? (
            <FlatList
              data={leaderboard}
              keyExtractor={item => item.userId}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.leaderboardItem, item.userId === userId && styles.leaderboardItemHighlight]}>
                  <View style={styles.leaderboardRank}>
                    <ThemedText style={styles.rankText}>{formatRank(item.rank)}</ThemedText>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <ThemedText style={styles.leaderboardName}>
                      {item.userName} {item.userId === userId ? '(You)' : ''}
                    </ThemedText>
                    <View style={styles.leaderboardStats}>
                      <ThemedText style={styles.leaderboardStat}>
                        💪 {item.totalVolume.toFixed(0)} kg
                      </ThemedText>
                      <ThemedText style={styles.leaderboardStat}>
                        🎯 {item.exercisesTracked} exercises
                      </ThemedText>
                      <ThemedText style={styles.leaderboardStat}>
                        🏆 {item.achievements} achievements
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.leaderboardScore}>
                    <ThemedText style={styles.scoreText}>{item.score}</ThemedText>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                Leaderboard is empty. Start tracking to see rankings!
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (COLORS: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.accent,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  userCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  userInfo: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userStat: {
    fontSize: 13,
    color: COLORS.gray,
  },
  userMilestone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  unlockedDate: {
    fontSize: 10,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  shareButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
  },
  shareButtonText: {
    color: COLORS.darkBg,
    fontSize: 11,
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  leaderboardItemHighlight: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  leaderboardRank: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  leaderboardStats: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  leaderboardStat: {
    fontSize: 11,
    color: COLORS.gray,
  },
  leaderboardScore: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
