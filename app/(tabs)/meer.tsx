import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColors } from '@/app/hooks/useThemeColors';

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

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

function MenuItem({ icon, title, subtitle, onPress, colors }: MenuItemProps) {
  const styles = getStyles(colors);
  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuItemIcon, { backgroundColor: colors.SURFACE }]}>
        <IconSymbol name={icon as any} size={24} color={colors.ACCENT} />
      </View>
      <View style={styles.menuItemContent}>
        <ThemedText type="defaultSemiBold" style={[styles.menuItemTitle, { color: colors.TEXT_PRIMARY }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.menuItemSubtitle, { color: colors.TEXT_SECONDARY }]}>
          {subtitle}
        </ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.MUTED} />
    </TouchableOpacity>
  );
}

export default function MeerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const COLORS = useThemeColors();
  const styles = getStyles(COLORS);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 }
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="title">Meer</ThemedText>
        </View>

        {/* Main Menu Section */}
        <View style={[styles.section, { backgroundColor: COLORS.CARD, borderBottomColor: COLORS.BORDER }]}>
          <MenuItem
            icon="square.and.pencil"
            title="Schemas"
            subtitle="Beheer je workout schemas"
            onPress={() => router.push('/(tabs)/schemas')}
            colors={COLORS}
          />
          
          <MenuItem
            icon="gear"
            title="Instellingen"
            subtitle="App voorkeuren en instellingen"
            onPress={() => router.push('/(tabs)/instellingen')}
            colors={COLORS}
          />

          <MenuItem
            icon="externaldrive.badge.checkmark"
            title="Backup & Herstel"
            subtitle="Beheer back-ups van je data"
            onPress={() => router.push('/(tabs)/backup')}
            colors={COLORS}
          />

          <MenuItem
            icon="icloud"
            title="Cloud Sync"
            subtitle="Synchroniseer met cloud"
            onPress={() => router.push('/(tabs)/cloudsync')}
            colors={COLORS}
          />
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <ThemedText style={[styles.infoText, { color: COLORS.TEXT_SECONDARY }]}>Gym-Track v1.0</ThemedText>
          <ThemedText style={[styles.infoSubtext, { color: COLORS.MUTED }]}>
            Fitness tracking met workouts, statistieken en grafieken
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minHeight: 72,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
});
