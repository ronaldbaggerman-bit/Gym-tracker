import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import type { Schema } from '@/app/data/workoutData';
import { COLORS } from '@/app/styles/colors';

interface SchemaCardProps {
  schema: Schema;
  isSelected: boolean;
  onPress: () => void;
}

export function SchemaCard({ schema, isSelected, onPress }: SchemaCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {schema.name}
        </ThemedText>
        <ThemedText style={styles.description}>
          {schema.description}
        </ThemedText>
        <ThemedText style={styles.count}>
          {schema.muscleGroups.reduce((acc, mg) => acc + mg.exercises.length, 0)} oefeningen
        </ThemedText>
      </View>
      {isSelected && <View style={styles.checkmark} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.ACCENT,
    backgroundColor: COLORS.SURFACE,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 5,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
  },
  count: {
    fontSize: 12,
    color: COLORS.MUTED,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.ACCENT,
    marginLeft: 10,
  },
});
