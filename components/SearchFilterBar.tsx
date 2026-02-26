import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';

export type WateringFilter = 'all' | 'needsWater' | 'waterOk';
export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  wateringFilter: WateringFilter;
  onWateringFilterChange: (filter: WateringFilter) => void;
  difficultyFilter: DifficultyFilter;
  onDifficultyFilterChange: (filter: DifficultyFilter) => void;
}

export default function SearchFilterBar({
  searchQuery,
  onSearchChange,
  wateringFilter,
  onWateringFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
}: Props) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = wateringFilter !== 'all' || difficultyFilter !== 'all';

  const handleClearFilters = useCallback(() => {
    onWateringFilterChange('all');
    onDifficultyFilterChange('all');
    onSearchChange('');
  }, [onWateringFilterChange, onDifficultyFilterChange, onSearchChange]);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
          accessibilityRole="button"
          accessibilityLabel={t('search.filters')}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? '#fff' : '#666'}
          />
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Watering status filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('search.wateringStatus')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {(['all', 'needsWater', 'waterOk'] as WateringFilter[]).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.chip, wateringFilter === filter && styles.chipActive]}
                    onPress={() => onWateringFilterChange(filter)}
                  >
                    <Text style={[styles.chipText, wateringFilter === filter && styles.chipTextActive]}>
                      {filter === 'all' ? t('search.all') :
                       filter === 'needsWater' ? t('search.needsWater') :
                       t('search.waterOk')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Difficulty filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('search.difficulty')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.chip, difficultyFilter === filter && styles.chipActive]}
                    onPress={() => onDifficultyFilterChange(filter)}
                  >
                    <Text style={[styles.chipText, difficultyFilter === filter && styles.chipTextActive]}>
                      {filter === 'all' ? t('search.all') : t(`search.${filter}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Clear filters */}
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
              <Ionicons name="close-circle-outline" size={16} color="#c62828" />
              <Text style={styles.clearText}>{t('search.clearFilters')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    color: '#1a1a1a',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2e7d32',
  },
  filtersPanel: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chipTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  clearText: {
    fontSize: 13,
    color: '#c62828',
    fontWeight: '500',
  },
});
