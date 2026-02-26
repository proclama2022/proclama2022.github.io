import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const colors = useThemeColors();
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = wateringFilter !== 'all' || difficultyFilter !== 'all';

  const handleClearFilters = useCallback(() => {
    onWateringFilterChange('all');
    onDifficultyFilterChange('all');
    onSearchChange('');
  }, [onWateringFilterChange, onDifficultyFilterChange, onSearchChange]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.searchRow}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.searchBg }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: hasActiveFilters ? colors.tint : colors.searchBg }]}
          onPress={() => setShowFilters(!showFilters)}
          accessibilityRole="button"
          accessibilityLabel={t('search.filters')}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? '#fff' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>{t('search.wateringStatus')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {(['all', 'needsWater', 'waterOk'] as WateringFilter[]).map((filter) => {
                  const active = wateringFilter === filter;
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.chip,
                        { backgroundColor: active ? colors.chipActiveBg : colors.chipBg, borderColor: active ? colors.tint : colors.chipBorder },
                      ]}
                      onPress={() => onWateringFilterChange(filter)}
                    >
                      <Text style={[styles.chipText, { color: active ? colors.chipActiveText : colors.textSecondary }]}>
                        {filter === 'all' ? t('search.all') :
                         filter === 'needsWater' ? t('search.needsWater') :
                         t('search.waterOk')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textMuted }]}>{t('search.difficulty')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map((filter) => {
                  const active = difficultyFilter === filter;
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.chip,
                        { backgroundColor: active ? colors.chipActiveBg : colors.chipBg, borderColor: active ? colors.tint : colors.chipBorder },
                      ]}
                      onPress={() => onDifficultyFilterChange(filter)}
                    >
                      <Text style={[styles.chipText, { color: active ? colors.chipActiveText : colors.textSecondary }]}>
                        {filter === 'all' ? t('search.all') : t(`search.${filter}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.clearText, { color: colors.danger }]}>{t('search.clearFilters')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 4 },
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
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersPanel: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterSection: { marginBottom: 8 },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
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
    fontWeight: '500',
  },
});
