import { StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { BackupManagement } from '@/components/BackupManagement';
import { useThemeColors } from '@/app/hooks/useThemeColors';

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: COLORS.BACKGROUND }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ThemedText type="title" style={{ color: COLORS.TEXT_PRIMARY }}>
          Backup & Herstel
        </ThemedText>
      </View>
      <BackupManagement />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
