import { useThemeColors } from '@/app/hooks/useThemeColors';
import { ThemedText } from '@/components/themed-text';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface WeeklyVolume {
  week: string;
  volume: number;
  sessions: number;
}

interface ProgressStats {
  weeklyData: WeeklyVolume[];
  bestWeek: WeeklyVolume | null;
  avgVolume: number;
}

function calculateWeeklyVolume(sessions: any[]): ProgressStats {
  const weeklyMap = new Map<string, { volume: number; sessions: number }>();

  sessions.forEach((session) => {
    const date = new Date(session.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    const volume = session.exercises?.reduce((sum: number, ex: any) => {
      return (
        sum +
        (ex.sets?.reduce((s: number, set: any) => s + (set.weight * set.reps || 0), 0) || 0)
      );
    }, 0) || 0;

    const current = weeklyMap.get(weekKey) || { volume: 0, sessions: 0 };
    weeklyMap.set(weekKey, {
      volume: current.volume + volume,
      sessions: current.sessions + 1,
    });
  });

  const weeklyData = Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      week: new Date(week).toLocaleDateString('nl-NL', {
        month: 'short',
        day: 'numeric',
      }),
      volume: Math.round(data.volume / 1000), // Convert to metric tons
      sessions: data.sessions,
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8); // Last 8 weeks

  const bestWeek =
    weeklyData.length > 0
      ? weeklyData.reduce((best, w) => (w.volume > best.volume ? w : best))
      : null;

  const avgVolume =
    weeklyData.length > 0
      ? Math.round(weeklyData.reduce((sum, w) => sum + w.volume, 0) / weeklyData.length)
      : 0;

  return { weeklyData, bestWeek, avgVolume };
}

interface WeeklyVolumeChartProps {
  sessions: any[];
}

export function WeeklyVolumeChart({ sessions }: WeeklyVolumeChartProps) {
  const COLORS = useThemeColors();
  const stats = useMemo(() => calculateWeeklyVolume(sessions), [sessions]);

  if (stats.weeklyData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.CARD }]}>
        <ThemedText style={{ color: COLORS.TEXT_SECONDARY, textAlign: 'center' }}>
          Geen data beschikbaar. Log workouts om grafieken te zien.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.CARD, borderColor: COLORS.BORDER }]}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={{ color: COLORS.TEXT_PRIMARY }}>
          📊 Wekelijks Volume
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER }]}>
          <ThemedText style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
            Gem. per week
          </ThemedText>
          <ThemedText style={{ color: COLORS.ACCENT, fontSize: 20, fontWeight: '700', marginTop: 4 }}>
            {stats.avgVolume}
          </ThemedText>
          <ThemedText style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11 }}>
            ton
          </ThemedText>
        </View>

        {stats.bestWeek && (
          <View style={[styles.statBox, { backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER }]}>
            <ThemedText style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
              Beste week
            </ThemedText>
            <ThemedText style={{ color: COLORS.PRIMARY, fontSize: 20, fontWeight: '700', marginTop: 4 }}>
              {stats.bestWeek.volume}
            </ThemedText>
            <ThemedText style={{ color: COLORS.TEXT_SECONDARY, fontSize: 11 }}>
              {stats.bestWeek.sessions} sessies
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.barChart}>
            {stats.weeklyData.map((week, idx) => {
              const maxVol = Math.max(...stats.weeklyData.map((w) => w.volume));
              const height = (week.volume / maxVol) * 120;
              return (
                <View key={idx} style={styles.barItem}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: COLORS.ACCENT,
                      },
                    ]}
                  />
                  <ThemedText style={[styles.barLabel, { color: COLORS.TEXT_SECONDARY }]}>
                    {week.week}
                  </ThemedText>
                  <ThemedText style={[styles.barValue, { color: COLORS.TEXT_PRIMARY }]}>
                    {week.volume}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={[styles.legend, { borderTopColor: COLORS.BORDER }]}>
        <ThemedText style={{ color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
          📈 Volume = totaal gewicht × reps per week
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 12,
    marginVertical: 12,
  },
  header: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  chartContainer: {
    marginBottom: 12,
    maxHeight: 200,
  },
  barChart: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
  },
  barItem: {
    alignItems: 'center',
    width: 50,
  },
  bar: {
    width: 32,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    marginTop: 6,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  legend: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
