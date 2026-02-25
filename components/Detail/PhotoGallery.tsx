import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { usePlantsStore } from '@/stores/plantsStore';
import { PlantPhoto } from '@/types';
import { AddPhotoButton } from './AddPhotoButton';
import { PhotoLightbox } from './PhotoLightbox';

// ---------------------------------------------------------------------------
// PhotoGallery
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 16;
const GAP = 2;
const COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

interface PhotoGalleryProps {
  plantId?: string;
}

export function PhotoGallery({ plantId: plantIdProp }: PhotoGalleryProps) {
  const { t } = useTranslation();

  // Try expo-router params first; fall back to prop
  const params = useLocalSearchParams<{ id: string }>();
  const resolvedId = params.id ?? plantIdProp ?? '';

  const plant = usePlantsStore((s) => s.getPlant(resolvedId));

  // Lightbox state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ------------------------------------------------------------------
  // Backward compatibility: convert photo string to PlantPhoto array
  // ------------------------------------------------------------------

  let photos: PlantPhoto[] = [];

  if (plant?.photos && plant.photos.length > 0) {
    photos = plant.photos;
  } else if (plant?.photo) {
    // Fallback for plants not yet migrated
    photos = [{
      uri: plant.photo,
      addedDate: plant.addedDate,
      isPrimary: true,
    }];
  }

  // ------------------------------------------------------------------
  // Lightbox handlers
  // ------------------------------------------------------------------

  const handlePhotoPress = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxVisible(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxVisible(false);
  }, []);

  const handlePhotoAdded = useCallback(() => {
    // Plant data will refresh automatically from store
  }, []);

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const renderThumbnail = ({ item, index }: { item: PlantPhoto; index: number }) => (
    <TouchableOpacity
      style={styles.thumbnail}
      onPress={() => handlePhotoPress(index)}
      activeOpacity={0.9}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Photo ${index + 1}`}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      {item.isPrimary && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <AddPhotoButton plantId={resolvedId} onPhotoAdded={handlePhotoAdded} size={120} />
      <Text style={styles.emptyText}>{t('detail.gallery.emptyState')}</Text>
      <Text style={styles.emptyHint}>{t('detail.gallery.emptyHint')}</Text>
    </View>
  );

  const renderFooter = () => {
    if (photos.length === 0) return null;
    return (
      <AddPhotoButton plantId={resolvedId} onPhotoAdded={handlePhotoAdded} size={ITEM_SIZE} />
    );
  };

  // ------------------------------------------------------------------
  // Not found guard
  // ------------------------------------------------------------------

  if (!plant) {
    return (
      <View style={styles.centered}>
        <Ionicons name="leaf-outline" size={32} color="#aaa" />
        <Text style={styles.notFoundText}>Plant not found.</Text>
      </View>
    );
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (photos.length === 0) {
    return renderEmptyState();
  }

  return (
    <>
      <FlatList
        data={photos}
        keyExtractor={(item, index) => `${item.uri}-${index}`}
        renderItem={renderThumbnail}
        numColumns={COLUMNS}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.row}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />

      {/* Lightbox modal */}
      <PhotoLightbox
        visible={lightboxVisible}
        photos={photos}
        initialIndex={lightboxIndex}
        plantId={resolvedId}
        onClose={handleCloseLightbox}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  gridContent: {
    paddingHorizontal: PADDING,
    paddingTop: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'flex-start',
  },
  thumbnail: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: GAP,
    marginRight: GAP,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  notFoundText: {
    fontSize: 14,
    color: '#888',
  },
});
