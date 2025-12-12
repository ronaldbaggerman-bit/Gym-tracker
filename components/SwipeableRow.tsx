import { COLORS } from '@/app/styles/colors';
import { ThemedText } from '@/components/themed-text';
import { useEffect, useRef } from 'react';
import {
    Animated,
    PanResponder,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  actionWidth?: number;
  style?: ViewStyle;
}

export function SwipeableRow({
  children,
  onSwipeLeft,
  actionWidth = 80,
  style,
}: SwipeableRowProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow swiping left (negative dx)
        if (gestureState.dx < 0) {
          pan.x.setValue(Math.max(gestureState.dx, -actionWidth));
        } else {
          pan.x.setValue(0);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Snap to either fully open or fully closed
        const shouldOpen = gestureState.dx < -actionWidth / 2;

        if (shouldOpen && onSwipeLeft) {
          Animated.timing(pan.x, {
            toValue: -actionWidth,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(pan.x, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.timing(pan.x, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    // Optional: Auto-close when component unmounts
    return () => {
      pan.x.setValue(0);
    };
  }, [pan.x]);

  return (
    <View style={[styles.container, style]}>
      {/* Delete button background (visible when swiped) */}
      <Animated.View
        style={[
          styles.deleteButtonOverlay,
          {
            width: actionWidth,
            opacity: pan.x.interpolate({
              inputRange: [-actionWidth, 0],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <View style={styles.deleteButtonContent}>
          <ThemedText style={styles.deleteIconBox}>🗑️</ThemedText>
        </View>
      </Animated.View>

      {/* Content that slides over the background */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: COLORS.CARD,
  },
  deleteButtonOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  deleteButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBox: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
