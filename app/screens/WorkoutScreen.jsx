import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { COLORS } from '@/app/styles/colors';

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState([
    { id: '1', name: 'Borst dag', duration: '60 min', date: '2025-12-08' },
    { id: '2', name: 'Benen dag', duration: '45 min', date: '2025-12-07' },
  ]);

  const addWorkout = () => {
    Alert.alert('Nieuwe workout', 'Voeg hier een nieuwe workout toe');
  };

  const renderWorkout = ({ item }) => (
    <View style={styles.workoutCard}>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutName}>{item.name}</Text>
        <Text style={styles.workoutDetails}>{item.duration} • {item.date}</Text>
      </View>
      <TouchableOpacity style={styles.editBtn}>
        <Text style={styles.editBtnText}>Bewerk</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mijn Workouts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={addWorkout}>
          <Text style={styles.addBtnText}>+ Nieuw</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={workouts}
        renderItem={renderWorkout}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    backgroundColor: COLORS.ACCENT,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 15,
  },
  workoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  workoutDetails: {
    fontSize: 13,
    color: COLORS.MUTED,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ACCENT,
  },
});
