import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SavedPlant } from '@/types';
import PlantCard from './PlantCard';

type ViewMode = 'grid' | 'list';

interface Props {
  plants: SavedPlant[];
}

export default function PlantGrid({ plants }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { t } = useTranslation();
  const colors = useThemeColors();

  const handleSetViewMode = useCallback((mode: ViewMode) => {
    if (mode !== viewMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setViewMode(mode);
    }
  }, [viewMode]);

  const sorted = [...plants].sort(
    (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.countText, { color: colors.textMuted }]}>
          {sorted.length} {sorted.length === 1 ? 'plant' : 'plants'}
        </Text>
        <View style={[styles.toggleGroup, { backgroundColor: colors.chipBg }]}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'grid' && [styles.toggleActive, { backgroundColor: colors.surface }]]}
            onPress={() => handleSetViewMode('grid')}
            accessibilityRole="button"
            accessibilityLabel={t('collection.gridView')}
            accessibilityState={{ selected: viewMode === 'grid' }}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={viewMode === 'grid' ? colors.tint : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && [styles.toggleActive, { backgroundColor: colors.surface }]]}
            onPress={() => handleSetViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel={t('collection.listView')}
            accessibilityState={{ selected: viewMode === 'list' }}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === 'list' ? colors.tint : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sorted}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlantCard plant={item} isGrid={viewMode === 'grid'} />
        )}
        contentContainerStyle={[
          styles.listContent,
          viewMode === 'grid' && styles.gridContent,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    padding: 5,
    borderRadius: 6,
  },
  toggleActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  listContent: { paddingBottom: 100 },
  gridContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
});
