import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { ProgressLineChart } from '@/components/ProgressLineChart';
import { loadSessions } from '@/app/utils/storage';
import { loadSettings } from '@/app/utils/settingsStorage';
import { WORKOUT_DATA } from '@/app/data/workoutData';
import { 
  getExerciseProgressionData, 
  getExercisesWithProgress,
  getSchemasWithProgress,
  calculateProgressionMetrics,
  type ProgressionDataPoint 
} from '@/app/utils/progressionData';
import { COLORS } from '@/app/styles/colors';

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

export default function ProgressieScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [progressDaysBack, setProgressDaysBack] = useState(180);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadData = async () => {
    try {
      const loadedSessions = await loadSessions();
      setSessions(loadedSessions || []);
      
      const settings = await loadSettings();
      setProgressDaysBack(settings.progressDaysBack || 180);
    } catch (error) {
      console.error('Failed to load progression data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get available schemas with progression data
  const schemasWithData = useMemo(() => {
    const schemaIds = getSchemasWithProgress(sessions);
    console.log('[Progressie] Found schema IDs with data:', schemaIds);
    console.log('[Progressie] Total sessions:', sessions.length);
    
    // Always show all schemas, not just those with data
    // This allows users to see all available options
    const allSchemas = WORKOUT_DATA.schemas;
    
    // Sort so schemas with data come first
    const schemasWithDataSet = new Set(schemaIds);
    const sorted = [
      ...allSchemas.filter(s => schemasWithDataSet.has(s.id)),
      ...allSchemas.filter(s => !schemasWithDataSet.has(s.id))
    ];
    
    console.log('[Progressie] All schemas:', sorted.map(s => `${s.id}:${s.name}`));
    return sorted;
  }, [sessions]);

  // Get exercises for selected schema
  const exercisesForSchema = useMemo(() => {
    if (!selectedSchemaId && schemasWithData.length === 0) return [];
    
    const schemaId = selectedSchemaId || schemasWithData[0]?.id;
    if (!schemaId) return [];
    
    const exercises = getExercisesWithProgress(sessions, schemaId);
    console.log(`[Progressie] Exercises for schema "${schemaId}":`, exercises);
    return exercises;
  }, [sessions, selectedSchemaId, schemasWithData]);

  // Get progression data for selected exercise
  const progressionData = useMemo(() => {
    if (!selectedExercise) return [];
    return getExerciseProgressionData(sessions, selectedExercise, progressDaysBack);
  }, [sessions, selectedExercise, progressDaysBack]);

  // Calculate metrics
  const metrics = useMemo(() => {
    return calculateProgressionMetrics(progressionData);
  }, [progressionData]);

  // Auto-select first schema and exercise if not selected
  useEffect(() => {
    if (!selectedSchemaId && schemasWithData.length > 0) {
      setSelectedSchemaId(schemasWithData[0].id);
    }
  }, [schemasWithData, selectedSchemaId]);

  useEffect(() => {
    if (!selectedExercise && exercisesForSchema.length > 0) {
      setSelectedExercise(exercisesForSchema[0]);
    }
  }, [exercisesForSchema, selectedExercise]);

  if (loading) {
    return (
      <View style={styles.container}>
        <CarbonFiberSVG />
        <ThemedText>Laden...</ThemedText>
      </View>
    );
  }

  return (
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
        <View style={styles.header}>
          <ThemedText type="title">Progressie</ThemedText>
          <ThemedText style={styles.subtitle}>
            Volg je gewichtprogressie over tijd
          </ThemedText>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              Geen trainingsdata beschikbaar
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Schema Filter */}
            <View style={styles.filterSection}>
              <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
                Schema
              </ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                {schemasWithData.map(schema => (
                  <TouchableOpacity
                    key={schema.id}
                    style={[
                      styles.filterButton,
                      selectedSchemaId === schema.id && styles.filterButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedSchemaId(schema.id);
                      setSelectedExercise(null); // Reset exercise when schema changes
                    }}
                  >
                    <ThemedText style={[
                      styles.filterButtonText,
                      selectedSchemaId === schema.id && styles.filterButtonTextActive,
                    ]}>
                      {schema.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Exercise Dropdown */}
            {exercisesForSchema.length > 0 && (
              <View style={styles.filterSection}>
                <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
                  Oefening
                </ThemedText>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedExercise || ''}
                    onValueChange={(value: string) => setSelectedExercise(value || null)}
                    style={styles.picker}
                    dropdownIconColor={COLORS.TEXT_PRIMARY}
                  >
                    <Picker.Item label="Selecteer een oefening..." value="" />
                    {exercisesForSchema.map(exercise => (
                      <Picker.Item key={exercise} label={exercise} value={exercise} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Metrics Display */}
            {selectedExercise && progressionData.length > 0 && (
              <View style={styles.metricsContainer}>
                <ThemedText type="defaultSemiBold" style={styles.metricsTitle}>
                  {selectedExercise}
                </ThemedText>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricLabel}>Huidi gewicht</ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {metrics.currentWeight} kg
                    </ThemedText>
                  </View>

                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricLabel}>Startgewicht</ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {metrics.startWeight} kg
                    </ThemedText>
                  </View>

                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricLabel}>Vooruitgang</ThemedText>
                    <ThemedText style={[
                      styles.metricValue,
                      metrics.totalProgress > 0 ? styles.positiveMetric : styles.negativeMetric
                    ]}>
                      {metrics.totalProgress > 0 ? '+' : ''}{metrics.totalProgress} kg
                    </ThemedText>
                  </View>

                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricLabel}>Percentage</ThemedText>
                    <ThemedText style={[
                      styles.metricValue,
                      metrics.percentProgress > 0 ? styles.positiveMetric : styles.negativeMetric
                    ]}>
                      {metrics.percentProgress > 0 ? '+' : ''}{metrics.percentProgress}%
                    </ThemedText>
                  </View>

                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricLabel}>Workouts</ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {metrics.workoutCount}
                    </ThemedText>
                  </View>

                  <View style={styles.metricCard}>
                    <ThemedText style={styles.metricLabel}>Periode</ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {metrics.dateRange.start} tot {metrics.dateRange.end}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}

            {/* Chart */}
            <View style={styles.chartContainer}>
              <ThemedText type="defaultSemiBold" style={styles.chartTitle}>
                Gewichtprogressie
              </ThemedText>
              {selectedExercise && progressionData.length > 0 ? (
                <ProgressLineChart data={progressionData} height={300} width={width - 32} />
              ) : (
                <View style={styles.chartPlaceholder}>
                  <ThemedText style={styles.chartPlaceholderText}>
                    Selecteer een oefening om progressie weer te geven
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  filterSection: {
    marginTop: 20,
    marginHorizontal: 12,
  },
  filterLabel: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.SURFACE,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  filterButtonActive: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  pickerContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: 'transparent',
  },
  metricsContainer: {
    marginTop: 20,
    marginHorizontal: 12,
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  metricsTitle: {
    fontSize: 16,
    marginBottom: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  positiveMetric: {
    color: '#34C759',
  },
  negativeMetric: {
    color: '#FF3B30',
  },
  chartContainer: {
    marginTop: 20,
    marginHorizontal: 12,
    marginBottom: 20,
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 12,
    color: COLORS.TEXT_PRIMARY,
  },
  chartPlaceholder: {
    height: 300,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
});
