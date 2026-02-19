import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/Themed';
import { SavedPlant } from '@/types';

interface Props {
  plant: SavedPlant;
  isGrid: boolean;
}

export default function PlantCard({ plant, isGrid }: Props) {
  const router = useRouter();

  const displayName = plant.nickname || plant.commonName || plant.scientificName || plant.species;

  return (
    <TouchableOpacity
      style={[styles.card, isGrid ? styles.gridCard : styles.listCard]}
      onPress={() => router.push(`/plant/${plant.id}` as const)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${displayName}`}
    >
      <Image
        source={{ uri: plant.photo }}
        style={isGrid ? styles.gridPhoto : styles.listPhoto}
        resizeMode="cover"
        accessibilityLabel={`Photo of ${displayName}`}
      />
      <View style={isGrid ? styles.gridInfo : styles.listInfo}>
        <Text style={styles.name} numberOfLines={isGrid ? 2 : 1}>
          {displayName}
        </Text>
        {plant.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color="#888" />
            <Text style={styles.location} numberOfLines={1}>
              {plant.location}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },

  // Grid card — square-ish, fills half the row width
  gridCard: {
    flex: 1,
    margin: 6,
  },
  gridPhoto: {
    width: '100%',
    aspectRatio: 1,
  },
  gridInfo: {
    padding: 10,
  },

  // List card — full width, horizontal layout
  listCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  listPhoto: {
    width: 72,
    height: 72,
  },
  listInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
});
