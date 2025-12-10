import React, { useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColors } from '@/app/hooks/useThemeColors';

interface ScreenTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down' | 'fade';
  duration?: number;
  delay?: number;
}

export function ScreenTransition({
  children,
  direction = 'up',
  duration = 500,
  delay = 0,
}: ScreenTransitionProps) {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, duration, delay]);

  const getTransform = () => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    switch (direction) {
      case 'left':
        return [
          {
            translateX: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [screenWidth, 0],
            }),
          },
        ];
      case 'right':
        return [
          {
            translateX: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-screenWidth, 0],
            }),
          },
        ];
      case 'up':
        return [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [screenHeight * 0.1, 0],
            }),
          },
        ];
      case 'down':
        return [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-screenHeight * 0.1, 0],
            }),
          },
        ];
      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: getTransform() as any,
      }}
    >
      {children}
    </Animated.View>
  );
}
