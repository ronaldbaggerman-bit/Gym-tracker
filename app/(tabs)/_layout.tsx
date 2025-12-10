import { Tabs } from 'expo-router';
import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CARBON_SVG_URI } from '@/app/styles/carbonBackground';
import { COLORS } from '@/app/styles/colors';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ImageBackground
      source={{ uri: CARBON_SVG_URI }}
      style={styles.background}
      resizeMode="repeat"
    >
      <ErrorBoundary>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: COLORS.ACCENT,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: { backgroundColor: COLORS.SURFACE, borderTopColor: COLORS.BORDER },
          }}
        >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dumbbell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Historie',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progressie"
        options={{
          title: 'Progressie',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="grafieken"
        options={{
          title: 'Statistieken',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="meer"
        options={{
          title: 'Meer',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="ellipsis.circle.fill" color={color} />,
        }}
      />
      {/* Hidden screens - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="schemas"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="instellingen"
        options={{
          href: null,
        }}
      />
        </Tabs>
      </ErrorBoundary>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: COLORS.BACKGROUND },
});
