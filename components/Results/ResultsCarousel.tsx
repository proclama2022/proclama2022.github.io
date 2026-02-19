import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ViewToken,
} from 'react-native';

import { PlantNetResult, SavedPlant } from '@/types';
import { ResultCard } from './ResultCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResultsCarouselProps {
  results: PlantNetResult[];
  imageUri: string;
  onAddToCollection?: (plant: SavedPlant) => void;
}

// ---------------------------------------------------------------------------
// Pagination dots
// ---------------------------------------------------------------------------

interface DotsProps {
  count: number;
  activeIndex: number;
}

function PaginationDots({ count, activeIndex }: DotsProps) {
  if (count <= 1) return null;

  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ResultsCarousel — FlatList with pagingEnabled
//
// Deviation note: plan specified react-native-snap-carousel but npm resolves
// it to v3.9.1 (2019) which is incompatible with React Native New Architecture
// (Fabric/JSI). Replaced with built-in FlatList + pagingEnabled, matching the
// same approach used for the onboarding carousel (STATE.md decision Phase 01-06).
// ---------------------------------------------------------------------------

export function ResultsCarousel({ results, imageUri, onAddToCollection }: ResultsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width: screenWidth } = Dimensions.get('window');

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(_, index) => `result-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={({ item }) => (
          <ResultCard
            result={item}
            imageUri={imageUri}
            onAddToCollection={onAddToCollection}
            width={screenWidth}
          />
        )}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      <PaginationDots count={results.length} activeIndex={activeIndex} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    // FlatList items each take full screen width
  },

  // Pagination
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ccc',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#2e7d32',
    borderRadius: 3.5,
  },
});

export default ResultsCarousel;
