import { WORKOUT_DATA } from '@/app/data/workoutData';
import { COLORS } from '@/app/styles/colors';
import {
    calculateProgressionMetrics,
    getExerciseProgressionData,
    getExercisesWithProgress,
    getSchemasWithProgress
} from '@/app/utils/progressionData';
import { loadSettings, updateSetting } from '@/app/utils/settingsStorage';
import { loadSessions } from '@/app/utils/storage';
import { ProgressLineChart } from '@/components/ProgressLineChart';
import { ThemedText } from '@/components/themed-text';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

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
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<any[]>([]);
  const [progressDaysBack, setProgressDaysBack] = useState(180);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [prs, setPRs] = useState<Record<string, any>>({});

  const ranges = useMemo(() => ([
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: '180d', value: 180 },
    { label: '365d', value: 365 },
    { label: 'Alles', value: 0 },
  ]), []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRangeSelect = useCallback(async (value: number) => {
    setProgressDaysBack(value);
    try {
      await updateSetting('progressDaysBack', value);
    } catch (error) {
      console.error('Failed to save progress range:', error);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadData = async () => {
    try {
      const { loadPRs } = await import('@/app/utils/storage');
      const loadedSessions = await loadSessions();
      setSessions(loadedSessions || []);
      
      const settings = await loadSettings();
      setProgressDaysBack(settings.progressDaysBack || 180);
      
      const prData = await loadPRs();
      setPRs(prData || {});
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
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <ThemedText type="title">Progressie</ThemedText>
          <ThemedText style={styles.subtitle}>
            Volg je gewichtprogressie over tijd
          </ThemedText>
        </View>

        {/* Range Filter */}
        <View style={styles.rangeSection}>
          <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
            Periode
          </ThemedText>
          <View style={styles.rangeButtons}>
            {ranges.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.rangeButton,
                  progressDaysBack === r.value && styles.rangeButtonActive,
                ]}
                onPress={() => handleRangeSelect(r.value)}
              >
                <ThemedText style={[
                  styles.rangeButtonText,
                  progressDaysBack === r.value && styles.rangeButtonTextActive,
                ]}>
                  {r.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateIcon}>📈</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.emptyStateTitle}>
              Nog geen progressiedata
            </ThemedText>
            <ThemedText style={styles.emptyStateDescription}>
              Start je eerste workout om je gewichtprogressie te volgen
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
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setDropdownVisible(true)}
                >
                  <View style={styles.dropdownButtonContent}>
                    <ThemedText style={styles.dropdownButtonText}>
                      {selectedExercise ? `${selectedExercise}${prs[selectedExercise] ? ' 🏅' : ''}` : 'Selecteer een oefening...'}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.dropdownArrow}>▼</ThemedText>
                </TouchableOpacity>

                <Modal
                  visible={dropdownVisible}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setDropdownVisible(false)}
                >
                  <TouchableOpacity
                    style={styles.dropdownOverlay}
                    onPress={() => setDropdownVisible(false)}
                  >
                    <View style={[styles.dropdownList, { maxHeight: 300 }]}>
                      <FlatList
                        data={exercisesForSchema}
                        keyExtractor={(item) => item}
                        renderItem={({ item: exercise }) => (
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedExercise(exercise);
                              setDropdownVisible(false);
                            }}
                          >
                            <ThemedText style={styles.dropdownItemText}>
                              {exercise}
                            </ThemedText>
                            {prs[exercise] && (
                              <ThemedText style={styles.prBadge}>🏅 PR</ThemedText>
                            )}
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            )}

            {/* Metrics Display */}
            {selectedExercise && progressionData.length > 0 && (
              <View style={styles.metricsContainer}>
                <View style={styles.titleRow}>
                  <ThemedText type="defaultSemiBold" style={styles.metricsTitle}>
                    {selectedExercise}
                  </ThemedText>
                  {prs[selectedExercise] && (
                    <View style={styles.prIndicator}>
                      <ThemedText style={styles.prIndicatorText}>🏅 PR</ThemedText>
                    </View>
                  )}
                </View>

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
  rangeSection: {
    marginTop: 16,
    marginHorizontal: 12,
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
  rangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  rangeButtonActive: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  rangeButtonText: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
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
  dropdownButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownList: {
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    width: '80%',
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  prBadge: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '700',
    marginLeft: 8,
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
    color: COLORS.TEXT_PRIMARY,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  prIndicator: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prIndicatorText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
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
