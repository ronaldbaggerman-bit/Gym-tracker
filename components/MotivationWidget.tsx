import { useThemeColors } from '@/app/hooks/useThemeColors';
import {
  getAllTips,
  getDailyTip,
  getRandomQuote,
  getRandomTip,
  getTodayQuote
} from '@/utils/motivation';
import { ThemedText } from '@/components/themed-text';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface MotivationWidgetProps {
  compact?: boolean;
}

interface Quote {
  quote: string;
  author: string;
}

interface Tip {
  id?: string | number;
  icon?: string;
  title: string;
  description: string;
}

export function MotivationWidget({ compact = false }: MotivationWidgetProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [dailyQuote, dailyTip] = await Promise.all([getTodayQuote(), getDailyTip()]);
      setQuote(dailyQuote as Quote);
      setTip(dailyTip as Tip);
    } catch (error) {
      console.error('Failed to load motivation content:', error);
    }
  };

  const refreshQuote = () => {
    const newQuote = getRandomQuote() as Quote;
    setQuote(newQuote);
  };

  const refreshTip = () => {
    const newTip = getRandomTip() as Tip;
    setTip(newTip);
  };

  if (!quote || !tip) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => setShowDetails(true)}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.compactIcon}>💡</ThemedText>
        <View style={styles.compactContent}>
          <ThemedText style={styles.compactText} numberOfLines={2}>
            {quote.quote}
          </ThemedText>
          <ThemedText style={styles.compactAuthor}>— {quote.author}</ThemedText>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Quote Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>💪 Daily Quote</ThemedText>
            <TouchableOpacity onPress={refreshQuote}>
              <ThemedText style={styles.refreshButton}>⟳</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.quoteBox}>
            <ThemedText style={styles.quoteText}>"{quote.quote}"</ThemedText>
            <ThemedText style={styles.quoteAuthor}>— {quote.author}</ThemedText>
          </View>
        </View>

        {/* Tip Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>💡 Today's Tip</ThemedText>
            <TouchableOpacity onPress={refreshTip}>
              <ThemedText style={styles.refreshButton}>⟳</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.tipBox}>
            <ThemedText style={styles.tipEmoji}>{tip.icon}</ThemedText>
            <View style={styles.tipContent}>
              <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
              <ThemedText style={styles.tipDescription}>{tip.description}</ThemedText>
            </View>
          </View>
        </View>

        {/* View More Button */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowDetails(true)}
        >
          <ThemedText style={styles.moreButtonText}>View More Tips & Quotes</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <ThemedText style={styles.closeButton}>← Back</ThemedText>
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              Motivation Hub
            </ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* All Quotes */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>📚 All Quotes</ThemedText>
              {[quote].filter(Boolean).map((q, idx) => (
                <View key={idx} style={styles.quoteItem}>
                  <ThemedText style={styles.quoteItemText}>"{(q as Quote).quote}"</ThemedText>
                  <ThemedText style={styles.quoteItemAuthor}>— {(q as Quote).author}</ThemedText>
                </View>
              ))}
            </View>

            {/* All Tips */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>🎯 All Tips</ThemedText>
              {getAllTips().map((t: Tip, idx: number) => (
                <View key={t.id ?? idx} style={styles.tipItem}>
                  <ThemedText style={styles.tipItemEmoji}>{t.icon ?? '💡'}</ThemedText>
                  <View style={styles.tipItemContent}>
                    <ThemedText style={styles.tipItemTitle}>{t.title}</ThemedText>
                    <ThemedText style={styles.tipItemDesc}>{t.description}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (COLORS: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  refreshButton: {
    fontSize: 18,
    padding: 4,
  },
  quoteBox: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 12,
    color: COLORS.gray,
  },
  tipBox: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  tipDescription: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
  },
  moreButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  moreButtonText: {
    color: COLORS.darkBg,
    fontWeight: '600',
    fontSize: 14,
  },
  compactContainer: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginVertical: 8,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 16,
    marginBottom: 4,
  },
  compactAuthor: {
    fontSize: 10,
    color: COLORS.gray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  quoteItem: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  quoteItemText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  quoteItemAuthor: {
    fontSize: 11,
    color: COLORS.gray,
  },
  tipItem: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipItemEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  tipItemContent: {
    flex: 1,
  },
  tipItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  tipItemDesc: {
    fontSize: 11,
    color: COLORS.gray,
    lineHeight: 15,
  },
});
