import { COLORS } from '@/app/styles/colors';
import { ThemedText } from '@/components/themed-text';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface PRCelebrationProps {
  visible: boolean;
  prType: 'weight' | 'reps' | 'both';
  maxWeight?: number;
  maxReps?: number;
  exerciseName: string;
  onDismiss: () => void;
}

const Confetti = () => {
  const pieces = Array.from({ length: 12 }, (_, i) => {
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(1);
    const translateXAnim = new Animated.Value(0);
    const translateYAnim = new Animated.Value(0);

    useEffect(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(translateYAnim, {
            toValue: -150,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(translateXAnim, {
            toValue: (Math.random() - 0.5) * 200,
            duration: 1200,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }, []);

    const randomX = Math.random() * 120 - 60;
    const randomRotation = Math.random() * 360;

    return (
      <Animated.View
        key={i}
        style={[
          {
            position: 'absolute',
            transform: [
              { translateX: translateXAnim },
              { translateY: translateYAnim },
              { rotate: `${randomRotation}deg` },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <ThemedText style={{ fontSize: 28 }}>🎉</ThemedText>
      </Animated.View>
    );
  });

  return <View style={styles.confettiContainer}>{pieces}</View>;
};

export function PRCelebration({
  visible,
  prType,
  maxWeight,
  maxReps,
  exerciseName,
  onDismiss,
}: PRCelebrationProps) {
  const [animatedScale] = useState(new Animated.Value(0));
  const [animatedOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Trigger haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

      // Animate in
      Animated.sequence([
        Animated.parallel([
          Animated.spring(animatedScale, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.delay(2500),
        Animated.parallel([
          Animated.timing(animatedScale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        onDismiss();
      });
    }
  }, [visible]);

  const getPRMessage = () => {
    if (prType === 'both') {
      return `New Personal Record!\n${maxWeight}kg × ${maxReps} reps`;
    } else if (prType === 'weight') {
      return `New Max Weight!\n${maxWeight}kg`;
    } else {
      return `New Max Reps!\n${maxReps} reps`;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              transform: [{ scale: animatedScale }],
              opacity: animatedOpacity,
            },
          ]}
        >
          <Confetti />

          <View style={styles.contentBox}>
            <ThemedText style={styles.emoji}>🏆</ThemedText>
            <ThemedText style={styles.title}>Personal Record!</ThemedText>
            <ThemedText style={styles.exerciseName}>{exerciseName}</ThemedText>
            <ThemedText style={styles.message}>{getPRMessage()}</ThemedText>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.buttonText}>Awesome! 💪</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContainer: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -100,
    left: -50,
  },
  contentBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 18,
    color: COLORS.gray,
    marginBottom: 15,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 15,
  },
  buttonText: {
    color: COLORS.darkBg,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
