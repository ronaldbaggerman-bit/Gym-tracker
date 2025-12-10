import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { loadSessions, removeSession, saveSessionsList } from '@/app/utils/storage';
import { importCsvSessions, clearImportedSessions } from '@/app/utils/csvImport';
import { WORKOUT_DATA } from '@/app/data/workoutData';
import { loadSettings } from '@/app/utils/settingsStorage';
import { calculateTotalSessionKcal, formatKcalDisplay } from '@/app/utils/kcalCalculator';
import { EXERCISE_GUIDES } from '@/app/data/exerciseGuides';
import { COLORS } from '@/app/styles/colors';

export default function HistorieScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [jsonImporting, setJsonImporting] = useState(false);
  const [importResult, setImportResult] = useState<string>('');
  const [csvImportEnabled, setCsvImportEnabled] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [bodyWeightKg, setBodyWeightKg] = useState(75);
  const [defaultMET, setDefaultMET] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  const reloadSessions = async () => {
    const s = await loadSessions();
    setSessions(s || []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reloadSessions();
    const s = await loadSettings();
    setCsvImportEnabled(s.csvImportEnabled);
    setBodyWeightKg(s.bodyWeightKg || 75);
    setDefaultMET(s.defaultMET || 5);
    setRefreshing(false);
  };

  useEffect(() => {
    reloadSessions();
    loadSettings().then(s => {
      setCsvImportEnabled(s.csvImportEnabled);
      setBodyWeightKg(s.bodyWeightKg || 75);
      setDefaultMET(s.defaultMET || 5);
    });
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await removeSession(id);
    if (ok) await reloadSessions();
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      Alert.alert('Geen data', 'Plak eerst CSV data uit Google Sheets.');
      return;
    }
    setImporting(true);
    try {
      const res = await importCsvSessions(csvText);
      setImportResult(`Geïmporteerd: ${res.imported} sessies`);
      setCsvText('');
      await reloadSessions();
    } catch (e) {
      console.error('Import error', e);
      Alert.alert('Import mislukt', 'Controleer je CSV kolommen: date, schema, exercise, musclegroup, sets, reps, weight, durationMinutes.');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const s = await loadSessions();
      const payload = JSON.stringify(s, null, 2);
      const fileUri = `${FileSystem.documentDirectory}workout-export-${Date.now()}.json`;

      await FileSystem.writeAsStringAsync(fileUri, payload);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Workout export',
          mimeType: 'application/json',
          UTI: 'public.json',
        });
      } else {
        await Share.share({ title: 'Workout export', url: fileUri, message: payload });
      }
    } catch (e) {
      console.error('Export error', e);
      Alert.alert('Export mislukt', 'Kon sessies niet exporteren.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearImported = async () => {
    setImporting(true);
    try {
      await clearImportedSessions();
      await reloadSessions();
      setImportResult('Geïmporteerde sessies verwijderd.');
    } catch (e) {
      Alert.alert('Fout', 'Kon geïmporteerde sessies niet verwijderen.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportJson = async () => {
    setJsonImporting(true);
    try {
      // Allow common JSON/text UTIs so iCloud/Files can pick saved exports
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain', 'public.json', 'public.text', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) {
        Alert.alert('Geen bestand', 'Kon het geselecteerde bestand niet openen.');
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.uri);
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        Alert.alert('Onverwacht formaat', 'De JSON backup moet een array van sessies zijn.');
        return;
      }

      const normalized = parsed.map((s: any, idx: number) => ({
        ...s,
        id: s.id || `import-${idx}-${Date.now()}`,
        startTime: s.startTime ? new Date(s.startTime).toISOString() : null,
        endTime: s.endTime ? new Date(s.endTime).toISOString() : null,
      }));

      await saveSessionsList(normalized);
      setImportResult(`Geïmporteerd vanuit JSON: ${normalized.length} sessies`);
      await reloadSessions();
    } catch (e) {
      console.error('JSON import error', e);
      Alert.alert('Import mislukt', 'Kon JSON backup niet importeren. Controleer of je het juiste exportbestand hebt gekozen.');
    } finally {
      setJsonImporting(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    const isExpanded = expandedSessionId === item.id;
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
      <TouchableOpacity 
        onPress={() => setExpandedSessionId(isExpanded ? null : item.id)}
        style={styles.historyCard}
      >
        <View style={styles.dateSection}>
          <ThemedText type="defaultSemiBold" style={styles.dateText}>
            {item.date}
          </ThemedText>
        </View>

        <View style={styles.sessionRow}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <View style={styles.sessionInfo}>
            <ThemedText style={styles.sessionSchema}>{item.schemaName}</ThemedText>
            <ThemedText style={styles.sessionMeta}>
              {item.exercises?.length || 0} oefeningen • {duration} • {formatKcalDisplay(calculateTotalSessionKcal(item, bodyWeightKg, defaultMET))}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <ThemedText style={styles.deleteText}>Verwijder</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Expanded view with exercises */}
        {isExpanded && item.exercises && item.exercises.length > 0 && (
          <View style={styles.expandedSection}>
            <ThemedText type="defaultSemiBold" style={styles.expandedTitle}>Uitgevoerde oefeningen:</ThemedText>
            {item.exercises.map((exercise: any, idx: number) => (
              <View key={idx} style={styles.exerciseItem}>
                <ThemedText style={styles.exerciseName}>
                  {EXERCISE_GUIDES[exercise.name]?.icon && (
                    <ThemedText style={styles.exerciseIcon}>{EXERCISE_GUIDES[exercise.name].icon} </ThemedText>
                  )}
                  {exercise.name}
                </ThemedText>
                {exercise.sets && (
                  <ThemedText style={styles.exerciseSets}>
                    {exercise.sets.length} × {exercise.sets[0]?.reps || 0} @ {exercise.sets[0]?.weight || 0} kg
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderImportHeader = () => (
    <>
      <View style={styles.header}>
        <ThemedText type="title">Historie</ThemedText>
      </View>

      {/* CSV import - only show if enabled */}
      {csvImportEnabled && (
      <View style={styles.importCard}>
        <ThemedText type="defaultSemiBold" style={styles.importTitle}>Importeer vanaf Google Sheets (CSV)</ThemedText>
        <ThemedText style={styles.importHint}>
          Exporteer je sheet als CSV en plak hier. Kolommen: date, schema, exercise, musclegroup, sets, reps, weight, durationMinutes.
          Sets/weight/reps kunnen ook pipe-gescheiden zijn (bijv. 12|10|8).
        </ThemedText>
        <TextInput
          multiline
          placeholder="date,schema,exercise,musclegroup,sets,reps,weight,durationMinutes\n2025-01-05,Schema 1,Chest Press,Borst,3,12|10|8,40|40|35,45"
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          value={csvText}
          onChangeText={setCsvText}
          style={styles.csvInput}
        />
        <View style={styles.importButtonsRow}>
          <TouchableOpacity style={[styles.importButton, importing && styles.importButtonDisabled]} onPress={handleImport} disabled={importing}>
            <ThemedText style={styles.importButtonText}>{importing ? 'Bezig...' : 'Importeer CSV'}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearImported} disabled={importing}>
            <ThemedText style={styles.clearButtonText}>Verwijder imports</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.importButtonsRow}>
          <TouchableOpacity style={[styles.exportButton, exporting && styles.importButtonDisabled]} onPress={handleExport} disabled={exporting}>
            <ThemedText style={styles.exportButtonText}>{exporting ? 'Exporteren...' : 'Exporteer JSON'}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.jsonImportButton, jsonImporting && styles.importButtonDisabled]} onPress={handleImportJson} disabled={jsonImporting}>
            <ThemedText style={styles.jsonImportButtonText}>{jsonImporting ? 'Bezig...' : 'Importeer JSON'}</ThemedText>
          </TouchableOpacity>
        </View>
        {!!importResult && (
          <ThemedText style={styles.importResult}>{importResult}</ThemedText>
        )}
      </View>
      )}

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
              const isSelected = selectedDate === dateKey;
              
              // Get unique schema colors for this day
              const schemaColors = [...new Set(
                daySessions
                  .map(s => WORKOUT_DATA.schemas.find(schema => schema.id === s.schemaId)?.color || '#007AFF')
              )];
              
              return (
                <TouchableOpacity key={idx} style={[styles.dayCell, isSelected && styles.dayCellSelected]} onPress={() => setSelectedDate(dateKey)}>
                  <ThemedText style={styles.dayNumber}>{day}</ThemedText>
                  {schemaColors.length > 0 && (
                    <View style={styles.dayDotsContainer}>
                      {schemaColors.slice(0, 2).map((color, colorIdx) => (
                        <View 
                          key={colorIdx} 
                          style={[
                            styles.dayDot, 
                            { backgroundColor: color },
                            schemaColors.length > 1 && { width: 5, height: 5 }
                          ]} 
                        />
                      ))}
                      {schemaColors.length > 2 && (
                        <ThemedText style={styles.dayDotsMore}>+</ThemedText>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={selectedDate ? sessions.filter(s => s.date === selectedDate) : sessions}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderImportHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateIcon}>🏋️</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.emptyStateTitle}>
              Nog geen workout historie
            </ThemedText>
            <ThemedText style={styles.emptyStateDescription}>
              Voltooi je eerste workout om deze hier te zien verschijnen
            </ThemedText>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.ACCENT}
            colors={[COLORS.ACCENT]}
          />
        }
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
  importCard: {
    backgroundColor: COLORS.CARD,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: 8,
  },
  importTitle: {
    fontSize: 15,
  },
  importHint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 16,
  },
  csvInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 10,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
  },
  importButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  importButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  clearButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  exportButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  jsonImportButton: {
    flex: 1,
    backgroundColor: '#0A84FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  jsonImportButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  importResult: {
    color: '#34C759',
    fontWeight: '600',
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
  dayDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayDotsMore: {
    fontSize: 8,
    color: '#007AFF',
    fontWeight: '700',
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    padding: 12,
  },
  expandedTitle: {
    fontSize: 13,
    marginBottom: 10,
    color: COLORS.TEXT_PRIMARY,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  exerciseIcon: {
    fontSize: 14,
    marginRight: 2,
  },
  exerciseSets: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
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
