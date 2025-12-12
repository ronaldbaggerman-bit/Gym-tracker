import { useThemeColors } from '@/app/hooks/useThemeColors';
import { ThemedText } from '@/components/themed-text';
import React, { useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

export interface UndoAction {
  label: string;
  onUndo: () => void | Promise<void>;
  onDismiss?: () => void;
}

interface UndoSnackbarProps {
  action?: UndoAction;
}

export function UndoSnackbar({ action }: UndoSnackbarProps) {
  const COLORS = useThemeColors();
  const [isVisible, setIsVisible] = useState(!!action);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (action) {
      setIsVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        dismissSnackbar();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [action, slideAnim]);

  const dismissSnackbar = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      action?.onDismiss?.();
    });
  };

  const handleUndo = async () => {
    try {
      await action?.onUndo();
      dismissSnackbar();
    } catch (error) {
      console.error('Undo failed:', error);
    }
  };

  if (!isVisible || !action) return null;

  const screenHeight = Dimensions.get('window').height;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: COLORS.CARD,
          borderTopColor: COLORS.BORDER,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [120, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText style={{ color: COLORS.TEXT_PRIMARY, flex: 1 }}>
          {action.label}
        </ThemedText>
        <ThemedText
          onPress={handleUndo}
          style={{
            color: COLORS.ACCENT,
            fontWeight: '700',
            marginLeft: 16,
          }}
        >
          UNDO
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
