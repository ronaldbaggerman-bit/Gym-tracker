import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '@/app/styles/colors';

export default function HistorieScreen() {
  const [history] = React.useState([
    { id: '1', date: '2025-12-08', workouts: 1, totalTime: '60 min' },
    { id: '2', date: '2025-12-07', workouts: 1, totalTime: '45 min' },
    { id: '3', date: '2025-12-06', workouts: 2, totalTime: '120 min' },
    { id: '4', date: '2025-12-05', workouts: 1, totalTime: '50 min' },
    { id: '5', date: '2025-12-04', workouts: 0, totalTime: '0 min' },
  ]);

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.dateSection}>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Workouts</Text>
          <Text style={styles.statValue}>{item.workouts}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Totale tijd</Text>
          <Text style={styles.statValue}>{item.totalTime}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historie</Text>
      </View>
      
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
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
  listContainer: {
    padding: 15,
  },
  historyCard: {
    backgroundColor: COLORS.CARD,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  dateSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.MUTED,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.ACCENT,
  },
});
