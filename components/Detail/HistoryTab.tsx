import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';

// ---------------------------------------------------------------------------
// HistoryTab — placeholder "coming soon"
// ---------------------------------------------------------------------------

export function HistoryTab() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={48} color="#aaa" />
      <Text style={styles.title}>{t('detail.history.comingSoon')}</Text>
      <Text style={styles.detail}>{t('detail.history.comingSoonDetail')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
  },
  detail: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
});
