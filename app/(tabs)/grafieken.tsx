import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function GrafiekenScreen() {
  const [stats] = React.useState({
    weeklyWorkouts: 5,
    totalMinutes: 325,
    avgDuration: 65,
    streak: 7,
  });

  const renderBar = (value: number, maxValue: number, label: string) => {
    const height = (value / maxValue) * 100;
    return (
      <View key={label} style={styles.barContainer}>
        <View style={[styles.bar, { height: `${height}%` }]} />
        <ThemedText style={styles.barLabel}>{label}</ThemedText>
        <ThemedText style={styles.barValue}>{value}</ThemedText>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Grafieken</ThemedText>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <ThemedText type="defaultSemiBold" style={styles.statCardValue}>
            {stats.weeklyWorkouts}
          </ThemedText>
          <ThemedText style={styles.statCardLabel}>Workouts deze week</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText type="defaultSemiBold" style={styles.statCardValue}>
            {stats.totalMinutes}
          </ThemedText>
          <ThemedText style={styles.statCardLabel}>Totale minuten</ThemedText>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <ThemedText type="defaultSemiBold" style={styles.statCardValue}>
            {stats.avgDuration}
          </ThemedText>
          <ThemedText style={styles.statCardLabel}>Gem. duur (min)</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText type="defaultSemiBold" style={styles.statCardValue}>
            {stats.streak}
          </ThemedText>
          <ThemedText style={styles.statCardLabel}>Streak (dagen)</ThemedText>
        </View>
      </View>

      <View style={styles.chartSection}>
        <ThemedText type="defaultSemiBold" style={styles.chartTitle}>
          Workouts per dag (afgelopen week)
        </ThemedText>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 32,
    color: '#007AFF',
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartSection: {
    margin: 15,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chartTitle: {
    fontSize: 16,
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
    marginBottom: 5,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
  },
});
