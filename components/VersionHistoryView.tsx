import { COLORS } from '@/app/styles/colors';
import { saveSession } from '@/utils/storage';
import {
    deleteSessionVersion,
    formatVersionTime,
    getSessionVersions,
    type SessionVersion
} from '@/utils/versionHistory';
import { ThemedText } from '@/components/themed-text';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

type ExerciseSet = {
  weight?: number;
  reps?: number;
  completed?: boolean;
};

type ExerciseItem = {
  name: string;
  sets?: ExerciseSet[];
  completed?: boolean;
};

type SessionData = {
  exercises?: ExerciseItem[];
  [key: string]: any;
};

interface VersionHistoryViewProps {
  sessionId: string;
  onRestore?: (session: SessionData) => void;
}

export function VersionHistoryView({ sessionId, onRestore }: VersionHistoryViewProps) {
  const [versions, setVersions] = useState<SessionVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<SessionVersion | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [sessionId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const versionList = await getSessionVersions(sessionId);
      setVersions([...versionList].reverse()); // Most recent first (immutable)
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: SessionVersion) => {
    Alert.alert(
      'Restore Version',
      `Restore session to version from ${formatVersionTime(version.timestamp)}?\n\n${version.changeDescription || 'No description'}`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await saveSession(version.data);
              if (onRestore) {
                onRestore(version.data);
              }
              Alert.alert('Success', 'Session restored');
              await loadVersions();
            } catch (error) {
              Alert.alert('Error', 'Failed to restore version');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDelete = (version: SessionVersion) => {
    Alert.alert(
      'Delete Version',
      `Delete version from ${formatVersionTime(version.timestamp)}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteSessionVersion(version.versionId);
              Alert.alert('Success', 'Version deleted');
              await loadVersions();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete version');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (versions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No version history available</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={versions}
        keyExtractor={item => item.versionId}
        renderItem={({ item, index }) => (
          <View style={styles.versionItem}>
            <View style={styles.versionInfo}>
              <ThemedText style={styles.versionTime}>
                {formatVersionTime(item.timestamp)}
              </ThemedText>
              <ThemedText style={styles.versionDescription}>
                {item.changeDescription || 'Version update'}
              </ThemedText>
              <ThemedText style={styles.versionExercises}>
                {item.data.exercises?.length || 0} exercises
              </ThemedText>
            </View>

            <View style={styles.versionActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedVersion(item);
                  setShowComparison(true);
                }}
              >
                <ThemedText style={styles.actionButtonText}>📊</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.restoreButton]}
                onPress={() => handleRestore(item)}
              >
                <ThemedText style={styles.actionButtonText}>↻</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item)}
              >
                <ThemedText style={styles.deleteButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Comparison Modal */}
      {selectedVersion && (
        <Modal
          visible={showComparison}
          transparent
          animationType="fade"
          onRequestClose={() => setShowComparison(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Version Details</ThemedText>
                <TouchableOpacity onPress={() => setShowComparison(false)}>
                  <ThemedText style={styles.closeButton}>✕</ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <ThemedText style={styles.detailLabel}>
                  Created: {formatVersionTime(selectedVersion.timestamp)}
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {new Date(selectedVersion.timestamp).toLocaleString('nl-NL')}
                </ThemedText>

                <ThemedText style={[styles.detailLabel, { marginTop: 16 }]}>
                  Description
                </ThemedText>
                <ThemedText style={styles.detailValue}>y
                  {selectedVersion.changeDescription || 'No description'}
                </ThemedText>

                <ThemedText style={[styles.detailLabel, { marginTop: 16 }]}>
                  Exercises
                </ThemedText>
                {selectedVersion.data.exercises?.map((exercise: ExerciseItem, idx: number) => (
                  <View key={idx} style={styles.exerciseItem}>
                    <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                    <ThemedText style={styles.exerciseMeta}>
                      {exercise.sets?.length || 0} sets
                      {exercise.completed ? ' ✓' : ''}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  handleRestore(selectedVersion);
                  setShowComparison(false);
                }}
              >
                <ThemedText style={styles.modalButtonText}>Restore This Version</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  versionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkCard,
  },
  versionInfo: {
    flex: 1,
  },
  versionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  versionDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  versionExercises: {
    fontSize: 11,
    color: COLORS.gray,
  },
  versionActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.darkCard,
    borderRadius: 6,
    marginLeft: 8,
  },
  restoreButton: {
    backgroundColor: COLORS.accent,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 18,
    color: COLORS.gray,
  },
  modalScroll: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  exerciseItem: {
    backgroundColor: COLORS.darkBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 12,
    color: COLORS.gray,
  },
  modalButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: COLORS.darkBg,
    fontWeight: '600',
  },
});
