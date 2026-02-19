import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import PlantCard from './PlantCard';
import { SavedPlant } from '@/types';

type ViewMode = 'grid' | 'list';

interface Props {
  plants: SavedPlant[];
}

export default function PlantGrid({ plants }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { t } = useTranslation();

  // Sort newest first (by addedDate descending)
  const sorted = [...plants].sort(
    (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
  );

  return (
    <View style={styles.container}>
      {/* Header with plant count and view toggle */}
      <View style={styles.header}>
        <Text style={styles.countText}>
          {sorted.length} {sorted.length === 1 ? 'plant' : 'plants'}
        </Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'grid' && styles.toggleActive]}
            onPress={() => setViewMode('grid')}
            accessibilityRole="button"
            accessibilityLabel={t('collection.gridView')}
            accessibilityState={{ selected: viewMode === 'grid' }}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={viewMode === 'grid' ? '#2e7d32' : '#999'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel={t('collection.listView')}
            accessibilityState={{ selected: viewMode === 'list' }}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === 'list' ? '#2e7d32' : '#999'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Collection list/grid */}
      <FlatList
        data={sorted}
        key={viewMode} // Force remount when switching columns
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    padding: 5,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  // List content
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
});
