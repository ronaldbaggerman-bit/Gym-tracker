import { COLORS } from '@/app/styles/colors';
import {
    clearPendingData,
    formatLastOnlineTime,
    getOfflineStatus,
    getPendingData,
    subscribeToOfflineStatus,
    type OfflineStatus,
} from '@/utils/offlineManager';
import { ThemedText } from '@/components/themed-text';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export function OfflineIndicator() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOffline: false,
    lastOnlineTime: null,
    pendingDataCount: 0,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [pendingData, setPendingData] = useState<any[]>([]);

  useEffect(() => {
    // Load initial status
    getOfflineStatus().then(setStatus);

    // Subscribe to changes
    const unsubscribe = subscribeToOfflineStatus(setStatus);
    return () => unsubscribe();
  }, []);

  const handleShowDetails = async () => {
    const data = await getPendingData();
    setPendingData(data);
    setShowDetails(true);
  };

  const handleClearPending = () => {
    Alert.alert(
      'Clear Pending Data',
      'Are you sure? This will discard all pending changes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            await clearPendingData();
            const newStatus = await getOfflineStatus();
            setStatus(newStatus);
            setPendingData([]);
            Alert.alert('Done', 'Pending data cleared');
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Only show if offline or has pending data
  if (!status.isOffline && status.pendingDataCount === 0) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.indicator,
          status.isOffline ? styles.offlineMode : styles.syncingMode,
        ]}
        onPress={handleShowDetails}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.indicatorText}>
          {status.isOffline ? '⛔' : '🔄'} {status.isOffline ? 'Offline Mode' : `${status.pendingDataCount} pending`}
        </ThemedText>
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                {status.isOffline ? 'Offline Mode' : 'Sync Status'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Status Info */}
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Status</ThemedText>
                <View style={styles.statusRow}>
                  <ThemedText style={styles.statusLabel}>Current Mode:</ThemedText>
                  <ThemedText style={[styles.statusValue, status.isOffline && { color: '#FF3B30' }]}>
                    {status.isOffline ? 'Offline' : 'Online'}
                  </ThemedText>
                </View>
                <View style={styles.statusRow}>
                  <ThemedText style={styles.statusLabel}>Last Online:</ThemedText>
                  <ThemedText style={styles.statusValue}>
                    {formatLastOnlineTime(status.lastOnlineTime)}
                  </ThemedText>
                </View>
                <View style={styles.statusRow}>
                  <ThemedText style={styles.statusLabel}>Pending Changes:</ThemedText>
                  <ThemedText style={styles.statusValue}>{status.pendingDataCount}</ThemedText>
                </View>
              </View>

              {/* Pending Data */}
              {pendingData.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Pending Changes</ThemedText>
                  {pendingData.map((item, idx) => (
                    <View key={idx} style={styles.pendingItem}>
                      <ThemedText style={styles.pendingType}>{item.type}</ThemedText>
                      <ThemedText style={styles.pendingTime}>
                        {formatLastOnlineTime(item.timestamp)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Info */}
              <View style={styles.section}>
                <ThemedText style={styles.infoText}>
                  {status.isOffline
                    ? 'You are in offline mode. Your changes are being saved locally and will sync when you go back online.'
                    : `You have ${status.pendingDataCount} change(s) pending sync. They will be uploaded when connectivity is restored.`}
                </ThemedText>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              {status.pendingDataCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleClearPending}
                >
                  <ThemedText style={styles.deleteButtonText}>Clear Pending</ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.closeButtonStyle]}
                onPress={() => setShowDetails(false)}
              >
                <ThemedText style={styles.closeButtonStyleText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  indicator: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 12,
    marginVertical: 8,
    alignItems: 'center',
  },
  offlineMode: {
    backgroundColor: '#FF3B30',
  },
  syncingMode: {
    backgroundColor: '#FF9500',
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.darkCard,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 18,
    color: COLORS.gray,
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}40`,
  },
  statusLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  pendingItem: {
    backgroundColor: COLORS.darkBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingType: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  pendingTime: {
    fontSize: 11,
    color: COLORS.gray,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  closeButtonStyle: {
    backgroundColor: COLORS.accent,
  },
  closeButtonStyleText: {
    color: COLORS.darkBg,
    fontWeight: '600',
    fontSize: 14,
  },
});
