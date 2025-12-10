import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { loadSessions } from '@/app/utils/storage';
import { calculateWorkoutStats, getExerciseStats, type WorkoutStats, type ExerciseStats } from '@/app/utils/workoutStats';
import { EXERCISE_GUIDES } from '@/app/data/exerciseGuides';
import { WeeklyVolumeChart } from '@/components/WeeklyVolumeChart';
import { ScreenTransition } from '@/components/ScreenTransition';
import type { WorkoutSession } from '@/app/types/workout';

const { width, height } = Dimensions.get('window');

// Carbon-fiber SVG background
const CarbonFiberSVG = () => (
  <Svg width={width} height={height} style={{ position: 'absolute' }}>
    <Defs>
      <Pattern id="carbon" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <Rect x="0" y="0" width="6" height="6" fill="#0A0A0C" />
        <Circle cx="1" cy="1" r="0.8" fill="#141416" />
        <Circle cx="4" cy="4" r="0.8" fill="#141416" />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#carbon)" />
  </Svg>
);

const COLORS = {
  BACKGROUND: '#0E0E10',
  SURFACE: '#141416',
  CARD: '#1C1C1E',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#8E8E93',
  ACCENT: '#007AFF',
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
};

export default function GrafiekenScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats | null>(null);
  const [topExercises, setTopExercises] = useState<ExerciseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadData = async () => {
    try {
      const loadedSessions = await loadSessions();
      setSessions(loadedSessions);

      const workoutStats = calculateWorkoutStats(loadedSessions);
      setStats(workoutStats);

      // Get top 5 exercises by frequency
      const exerciseNames = Object.entries(workoutStats.exerciseFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const exerciseStatsArray = exerciseNames
        .map(name => getExerciseStats(loadedSessions, name))
        .filter((s): s is ExerciseStats => s !== null);

      setTopExercises(exerciseStatsArray);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CarbonFiberSVG />
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <CarbonFiberSVG />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>Nog geen statistieken</Text>
          <Text style={styles.emptyStateDescription}>
            Voltooi workouts om je voortgang en statistieken te bekijken
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenTransition direction="up" duration={400}>
      <View style={styles.container}>
        <CarbonFiberSVG />
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.ACCENT}
              colors={[COLORS.ACCENT]}
            />
          }
        >
          <Text style={[styles.header, { paddingTop: insets.top + 16 }]}>Jouw Statistieken</Text>

          {/* Weekly Volume Chart */}
          <WeeklyVolumeChart sessions={sessions} />

          {/* Overview Cards Row 1 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats.totalVolume).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Totaal Volume (kg)</Text>
            </View>
          </View>

          {/* Overview Cards Row 2 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalReps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Reps</Text>
            </View>
          </View>

        {/* Streak Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔥 Workout Streak</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={[styles.statValue, { color: COLORS.SUCCESS }]}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Huidige Reeks</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={[styles.statValue, { color: COLORS.WARNING }]}>{stats.longestStreak}</Text>
              <Text style={styles.statLabel}>Langste Reeks</Text>
            </View>
          </View>
        </View>

        {/* Average Duration */}
        {stats.averageWorkoutDuration > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>⏱️ Gemiddelde Duur</Text>
            <Text style={styles.durationValue}>{stats.averageWorkoutDuration} minuten</Text>
          </View>
        )}

        {/* Top Exercises */}
        {topExercises.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💪 Top Oefeningen</Text>
            {topExercises.map((ex, idx) => (
              <View key={ex.name} style={styles.exerciseRow}>
                <View style={styles.exerciseRank}>
                  <Text style={styles.rankText}>{idx + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>
                    {EXERCISE_GUIDES[ex.name]?.icon && (
                      <Text style={styles.exerciseIcon}>{EXERCISE_GUIDES[ex.name].icon} </Text>
                    )}
                    {ex.name}
                  </Text>
                  <Text style={styles.exerciseDetails}>
                    {ex.timesPerformed}x uitgevoerd • {Math.round(ex.totalVolume).toLocaleString()} kg volume
                  </Text>
                  <Text style={styles.exerciseDetails}>
                    Max: {ex.maxWeight} kg • Gem: {ex.averageWeight.toFixed(1)} kg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Volume by Week */}
        {stats.volumeByWeek.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📊 Volume per Week (laatste 12 weken)</Text>
            {stats.volumeByWeek.slice(-8).map((item, idx) => {
              const maxVolume = Math.max(...stats.volumeByWeek.map(v => v.volume));
              const percentage = (item.volume / maxVolume) * 100;
              const weekDate = new Date(item.week);
              const weekLabel = `Week ${weekDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`;

              return (
                <View key={idx} style={styles.volumeRow}>
                  <Text style={styles.volumeLabel}>{weekLabel}</Text>
                  <View style={styles.volumeBarContainer}>
                    <View style={[styles.volumeBar, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.volumeValue}>{Math.round(item.volume).toLocaleString()}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Monthly Activity */}
        {Object.keys(stats.workoutsByMonth).length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📅 Workouts per Maand</Text>
            {Object.entries(stats.workoutsByMonth)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 6)
              .map(([month, count]) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

                return (
                  <View key={month} style={styles.monthRow}>
                    <Text style={styles.monthLabel}>{monthName}</Text>
                    <View style={styles.monthDots}>
                      {Array.from({ length: Math.min(count, 20) }).map((_, i) => (
                        <View key={i} style={styles.dot} />
                      ))}
                      {count > 20 && <Text style={styles.dotOverflow}>+{count - 20}</Text>}
                    </View>
                    <Text style={styles.monthCount}>{count}</Text>
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>
    </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.ACCENT,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.ACCENT,
    textAlign: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  exerciseRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  exerciseIcon: {
    fontSize: 18,
    marginRight: 2,
  },
  exerciseDetails: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  volumeLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    width: 80,
  },
  volumeBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  volumeBar: {
    height: '100%',
    backgroundColor: COLORS.ACCENT,
    borderRadius: 10,
  },
  volumeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    width: 70,
    textAlign: 'right',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    width: 140,
  },
  monthDots: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ACCENT,
  },
  dotOverflow: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
  },
  monthCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    width: 40,
    textAlign: 'right',
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
});
