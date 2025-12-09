import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageBackground } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { COLORS } from '@/app/styles/colors';
import { CARBON_SVG_URI } from '@/app/styles/carbonBackground';
import { loadSessions, saveSession } from '@/app/utils/storage';
import type { WorkoutSession, WorkoutExercise } from '@/app/types/workout';
import { useFocusEffect } from '@react-navigation/native';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Load sessions when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSessions()
        .then(setSessions)
        .catch(err => console.warn('Failed to load sessions:', err));
    }, [])
  );

  const handleSaveNote = async (sessionId: string, exerciseId: number, notes: string) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          exercises: session.exercises.map(ex =>
            ex.exerciseId === exerciseId ? { ...ex, notes } : ex
          ),
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    const session = updatedSessions.find(s => s.id === sessionId);
    if (session) {
      await saveSession(session).catch(err => console.error('Failed to save note:', err));
    }
    setEditingNoteId(null);
    setNoteText('');
  };

  const openEditNote = (sessionId: string, exercise: WorkoutExercise) => {
    setEditingNoteId(`${sessionId}-${exercise.exerciseId}`);
    setNoteText(exercise.notes || '');
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('nl-NL', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderSessionNotes = (session: WorkoutSession) => {
    const isExpanded = expandedSessionId === session.id;

    return (
      <View key={session.id} style={styles.sessionCard}>
        <TouchableOpacity
          style={styles.sessionHeader}
          onPress={() => setExpandedSessionId(isExpanded ? null : session.id)}
          activeOpacity={0.7}
        >
          <View>
            <ThemedText type="defaultSemiBold" style={styles.sessionDate}>
              {formatDate(session.date)}
            </ThemedText>
            <ThemedText style={styles.sessionSchema}>
              {session.schemaName} • {session.exercises.filter(e => e.completed).length}/{session.exercises.length}
            </ThemedText>
          </View>
          <ThemedText style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</ThemedText>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sessionContent}>
            {session.exercises.map(exercise => {
              const isEditing = editingNoteId === `${session.id}-${exercise.exerciseId}`;
              const hasNote = !!exercise.notes;

              return (
                <TouchableOpacity
                  key={exercise.exerciseId}
                  style={[
                    styles.exerciseNoteCard,
                    hasNote && styles.exerciseNoteCardWithContent,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => openEditNote(session.id, exercise)}
                >
                  {!isEditing ? (
                    <>
                      <View style={styles.exerciseNoteHeader}>
                        <View style={styles.exerciseNoteTitle}>
                          <ThemedText type="defaultSemiBold" style={styles.exerciseName}>
                            {exercise.name}
                          </ThemedText>
                          {exercise.completed && (
                            <ThemedText style={styles.completedBadge}>✓</ThemedText>
                          )}
                        </View>
                        <ThemedText style={styles.editHint}>
                          {hasNote ? '📝' : '+ Notitie'}
                        </ThemedText>
                      </View>
                      {hasNote && (
                        <ThemedText style={styles.noteContent}>
                          {exercise.notes}
                        </ThemedText>
                      )}
                    </>
                  ) : (
                    <View style={styles.editingContainer}>
                      <ThemedText style={styles.editingTitle}>
                        {exercise.name}
                      </ThemedText>
                      <TextInput
                        style={styles.noteInput}
                        placeholder="Notitie toevoegen... (pijn, energy, form tips)"
                        placeholderTextColor={COLORS.TEXT_SECONDARY}
                        multiline
                        numberOfLines={4}
                        value={noteText}
                        onChangeText={setNoteText}
                        autoFocus
                      />
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[styles.button, styles.buttonCancel]}
                          onPress={() => {
                            setEditingNoteId(null);
                            setNoteText('');
                          }}
                        >
                          <ThemedText style={styles.buttonText}>Annuleer</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, styles.buttonSave]}
                          onPress={() => handleSaveNote(session.id, exercise.exerciseId, noteText)}
                        >
                          <ThemedText style={styles.buttonText}>Opslaan</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <ImageBackground source={{ uri: CARBON_SVG_URI }} style={styles.background} resizeMode="repeat">
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Notities
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Noteer opmerkingen per exercise (pijn, energie, form)
          </ThemedText>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {sessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {sessions.map(session => renderSessionNotes(session))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                Geen workouts gevonden. Start een workout om notities toe te voegen.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionDate: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  sessionSchema: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  sessionContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  exerciseNoteCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  exerciseNoteCardWithContent: {
    borderColor: '#FF9500',
    borderWidth: 1.5,
  },
  exerciseNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNoteTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  completedBadge: {
    fontSize: 12,
    color: '#34C759',
  },
  editHint: {
    fontSize: 13,
    color: COLORS.ACCENT,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  editingContainer: {
    gap: 10,
  },
  editingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  noteInput: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  buttonSave: {
    backgroundColor: COLORS.ACCENT,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
