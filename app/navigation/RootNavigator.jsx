import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { COLORS } from '@/app/styles/colors';
import GrafiekenScreen from '../screens/GrafiekenScreen';
import HistorieScreen from '../screens/HistorieScreen';
import WorkoutScreen from '../screens/WorkoutScreen';

const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Workout') {
            iconName = focused ? 'dumbbell' : 'dumbbell-outline';
          } else if (route.name === 'Historie') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Grafieken') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.ACCENT,
        tabBarInactiveTintColor: COLORS.MUTED,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: COLORS.SURFACE,
          borderTopWidth: 1,
          borderTopColor: COLORS.BORDER,
          paddingBottom: 5,
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarLabel: 'Workout',
        }}
      />
      <Tab.Screen
        name="Historie"
        component={HistorieScreen}
        options={{
          tabBarLabel: 'Historie',
        }}
      />
      <Tab.Screen
        name="Grafieken"
        component={GrafiekenScreen}
        options={{
          tabBarLabel: 'Grafieken',
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
