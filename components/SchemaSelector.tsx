import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { ThemedText } from '@/components/themed-text';
import type { Schema } from '@/app/data/workoutData';
import { useThemeColors } from '@/app/hooks/useThemeColors';
import { getColors } from '@/app/styles/colors';

interface SchemaSelectorProps {
  schemas: Schema[];
  selectedSchemaId: string;
  onSchemaSelect: (schemaId: string) => void;
}

export function SchemaSelector({ schemas, selectedSchemaId, onSchemaSelect }: SchemaSelectorProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.label}>
        Schema selecteren
      </ThemedText>
      <View style={styles.buttonGroup}>
        {schemas.map((schema) => {
          const isSelected = schema.id === selectedSchemaId;
          return (
            <TouchableOpacity
              key={schema.id}
              style={[
                styles.button,
                isSelected && styles.buttonSelected,
              ]}
              onPress={() => onSchemaSelect(schema.id)}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.buttonText,
                  isSelected && styles.buttonTextSelected,
                ]}
                type="defaultSemiBold"
              >
                {schema.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (COLORS: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    label: {
      fontSize: 17,
      marginBottom: 10,
      letterSpacing: 0.5,
      color: COLORS.TEXT_PRIMARY,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    button: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.BORDER,
      alignItems: 'center',
      backgroundColor: COLORS.SURFACE,
    },
    buttonSelected: {
      backgroundColor: COLORS.ACCENT,
      borderColor: COLORS.ACCENT,
    },
    buttonText: {
      fontSize: 14,
      color: COLORS.TEXT_PRIMARY,
    },
    buttonTextSelected: {
      color: COLORS.TEXT_PRIMARY,
    },
  });
