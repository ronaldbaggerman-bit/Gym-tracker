import { COLORS } from '@/app/styles/colors';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function GrafiekenScreen() {
  const [stats] = React.useState({
    weeklyWorkouts: 5,
    totalMinutes: 325,
    avgDuration: 65,
    streak: 7,
  });

  const renderBar = (value, maxValue, label) => {
    const height = (value / maxValue) * 100;
    return (
      <View key={label} style={styles.barContainer}>
        <View style={[styles.bar, { height: `${height}%` }]} />
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grafieken & Statistieken</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.weeklyWorkouts}</Text>
          <Text style={styles.statCardLabel}>Workouts deze week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.totalMinutes}</Text>
          <Text style={styles.statCardLabel}>Totale minuten</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.avgDuration}</Text>
          <Text style={styles.statCardLabel}>Gemiddelde duur (min)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.streak}</Text>
          <Text style={styles.statCardLabel}>Huidige streak (dagen)</Text>
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Workouts per dag (afgelopen week)</Text>
        <View style={styles.barChart}>
          {renderBar(3, 5, 'Ma')}
          {renderBar(2, 5, 'Di')}
          {renderBar(4, 5, 'Wo')}
          {renderBar(2, 5, 'Do')}
          {renderBar(1, 5, 'Vr')}
          {renderBar(3, 5, 'Za')}
          {renderBar(0, 5, 'Zo')}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.ACCENT,
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: COLORS.MUTED,
    textAlign: 'center',
  },
  chartSection: {
    backgroundColor: COLORS.CARD,
    margin: 15,
    padding: 20,
    borderRadius: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 15,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  bar: {
    width: '80%',
    backgroundColor: '#007AFF',
    borderRadius: 5,
    marginBottom: 10,
  },
  barLabel: {
    fontSize: 12,
    color: COLORS.MUTED,
    marginBottom: 5,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
});
