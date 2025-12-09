import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { loadSessions, removeSession } from '@/app/utils/storage';
import { WORKOUT_DATA } from '@/app/data/workoutData';
import { COLORS } from '@/app/styles/colors';

export default function HistorieScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const reloadSessions = async () => {
    const s = await loadSessions();
    setSessions(s || []);
  };

  useEffect(() => {
    reloadSessions();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await removeSession(id);
    if (ok) await reloadSessions();
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    const start = item.startTime ? new Date(item.startTime) : null;
    const end = item.endTime ? new Date(item.endTime) : null;
    let duration = '—';
    if (start && end) {
      const mins = Math.round((end.getTime() - start.getTime()) / 60000);
      duration = `${mins} min`;
    }

    const schema = WORKOUT_DATA.schemas.find(s => s.id === item.schemaId);
    const color = schema ? schema.color : '#007AFF';

    return (
      <View style={styles.historyCard}>
        <View style={styles.dateSection}>
          <ThemedText type="defaultSemiBold" style={styles.dateText}>
            {item.date}
          </ThemedText>
        </View>

        <View style={styles.sessionRow}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <View style={styles.sessionInfo}>
            <ThemedText style={styles.sessionSchema}>{item.schemaName}</ThemedText>
            <ThemedText style={styles.sessionMeta}>{item.exercises?.length || 0} oefeningen • {duration}</ThemedText>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <ThemedText style={styles.deleteText}>Verwijder</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Historie</ThemedText>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => {
            const d = new Date(monthDate);
            d.setMonth(d.getMonth() - 1);
            setMonthDate(d);
            setSelectedDate(null);
          }}>
            <ThemedText style={styles.monthNavText}>{'‹'}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.monthText}>{monthDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}</ThemedText>
          <TouchableOpacity onPress={() => {
            const d = new Date(monthDate);
            d.setMonth(d.getMonth() + 1);
            setMonthDate(d);
            setSelectedDate(null);
          }}>
            <ThemedText style={styles.monthNavText}>{'›'}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          {['Ma','Di','Wo','Do','Vr','Za','Zo'].map(w => (
            <ThemedText key={w} style={styles.weekDay}>{w}</ThemedText>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {(() => {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const first = new Date(year, month, 1);
            // week starts Monday: (getDay()+6)%7
            const leading = (first.getDay() + 6) % 7;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells: (number | null)[] = [];
            for (let i = 0; i < leading; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            // render cells
            return cells.map((day, idx) => {
              if (day === null) return <View key={idx} style={styles.dayCell} />;
              const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const daySessions = sessions.filter(s => s.date === dateKey);
              const dotColor = daySessions.length ? (WORKOUT_DATA.schemas.find(s => s.id === daySessions[0].schemaId)?.color || '#007AFF') : null;
              const isSelected = selectedDate === dateKey;
              return (
                <TouchableOpacity key={idx} style={[styles.dayCell, isSelected && styles.dayCellSelected]} onPress={() => setSelectedDate(dateKey)}>
                  <ThemedText style={styles.dayNumber}>{day}</ThemedText>
                  {dotColor ? <View style={[styles.dayDot, { backgroundColor: dotColor }]} /> : null}
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>

      <FlatList
        data={selectedDate ? sessions.filter(s => s.date === selectedDate) : sessions}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <ThemedText type="defaultSemiBold">Nog geen opgeslagen workouts</ThemedText>
            <ThemedText style={styles.emptySub}>Maak een workout aan en druk op "Beëindig workout" of markeer oefeningen als voltooid.</ThemedText>
          </View>
        )}
      />
    </View>
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
  listContainer: {
    padding: 15,
  },
  historyCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 16,
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
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    color: '#007AFF',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSchema: {
    fontSize: 15,
    marginBottom: 4,
  },
  sessionMeta: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptySub: {
    marginTop: 8,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    maxWidth: 320,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  calendarContainer: {
    padding: 12,
    backgroundColor: COLORS.CARD,
    margin: 12,
    borderRadius: 10,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthNavText: {
    fontSize: 22,
    color: '#007AFF',
    paddingHorizontal: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  weekDay: {
    width: 36,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: 36,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    borderRadius: 6,
  },
  dayCellSelected: {
    backgroundColor: '#F5F5F7',
  },
  dayNumber: {
    fontSize: 13,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});
