/**
 * Plant Migration Service
 *
 * Handles migration of local plants from AsyncStorage to Supabase cloud storage.
 * Used for v1.x users who sign up and want to sync their existing plant collection.
 *
 * Features:
 * - Progress tracking with callbacks during migration
 * - Cancellable migrations (user can stop mid-process)
 * - Partial migration support (keep what was uploaded if cancelled)
 * - Photo compression before upload
 * - Migration flag storage for retry logic
 *
 * Data synced:
 * - Plants (species, names, metadata)
 * - Photos (compressed and uploaded to Supabase Storage)
 * - Watering history (care timeline)
 *
 * Data NOT synced (stays local):
 * - Reminders (notification IDs are device-specific)
 *
 * @module services/migrationService
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { SavedPlant } from '@/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Migration progress callback data
 *
 * Passed to onProgress callback during migration to update UI.
 */
export interface MigrationProgress {
  /** Total number of plants to migrate */
  total: number;
  /** Number of plants successfully migrated so far */
  completed: number;
  /** Name of the plant currently being migrated */
  currentPlantName: string;
  /** Whether migration has been cancelled by user */
  isCancelled: boolean;
  /** Number of plants that failed to migrate */
  failed: number;
}

/**
 * Migration result
 *
 * Returned by migratePlantsToSupabase when migration completes or is cancelled.
 */
export interface MigrationResult {
  /** Number of plants successfully migrated */
  success: number;
  /** Number of plants that failed to migrate */
  failed: number;
  /** Whether migration was cancelled by user */
  cancelled: boolean;
}

/**
 * Migration flag stored in AsyncStorage
 *
 * Tracks whether user has completed migration and when.
 */
export interface MigrationFlag {
  /** ISO timestamp of when migration was completed */
  timestamp: string;
  /** Number of plants that were migrated */
  plantCount: number;
}

// ============================================================================
// Constants
// ============================================================================

/** AsyncStorage key for migration flag */
const MIGRATION_FLAG_KEY = '@plantid_has_migrated';

/** Max dimension for compressed photos (width or height) */
const MAX_PHOTO_DIMENSION = 1200;

/** JPEG quality for compressed photos (0.0 - 1.0) */
const PHOTO_COMPRESS_QUALITY = 0.7;

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Migrate local plants to Supabase
 *
 * Uploads plants, photos, and watering history from local AsyncStorage
 * to Supabase database and storage. Shows progress via callback.
 *
 * Algorithm:
 * 1. Loop through plants with index tracking
 * 2. Check cancellation signal before each plant
 * 3. Call onProgress callback with current status
 * 4. Compress and upload plant photos to Supabase Storage
 * 5. Upload plant metadata to Supabase 'plants' table
 * 6. Upload watering history to Supabase 'watering_history' table
 * 7. Track success/failed counters
 * 8. Return result when complete or cancelled
 *
 * Note: Supabase tables ('plants', 'watering_history') and storage bucket
 * ('plant-photos') must be created first (Phase 12). This function includes
 * placeholder comments for table structure.
 *
 * @param plants - Array of plants to migrate
 * @param onProgress - Callback called with progress updates during migration
 * @param signal - Cancellation signal { cancelled: boolean } that's checked each iteration
 * @returns Promise<MigrationResult> with counts and cancellation status
 *
 * Example:
 *   const signal = { cancelled: false };
 *   const result = await migratePlantsToSupabase(
 *     plants,
 *     (progress) => console.log(`${progress.completed}/${progress.total}: ${progress.currentPlantName}`),
 *     signal
 *   );
 *   console.log(`Migrated ${result.success} plants, ${result.failed} failed`);
 */
export const migratePlantsToSupabase = async (
  plants: SavedPlant[],
  onProgress: (progress: MigrationProgress) => void,
  signal: { cancelled: boolean }
): Promise<MigrationResult> => {
  const supabase = getSupabaseClient();
  let success = 0;
  let failed = 0;

  // Get current user for ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Migration failed: No authenticated user');
    return { success: 0, failed: 0, cancelled: false };
  }

  const userId = user.id;

  for (let i = 0; i < plants.length; i++) {
    // Check for cancellation
    if (signal.cancelled) {
      console.log('Migration cancelled by user');
      onProgress({
        total: plants.length,
        completed: i,
        currentPlantName: '',
        isCancelled: true,
        failed,
      });
      break;
    }

    const plant = plants[i];
    const plantName = plant.nickname || plant.commonName || plant.species;

    // Report progress
    onProgress({
      total: plants.length,
      completed: i,
      currentPlantName: plantName,
      isCancelled: false,
      failed,
    });

    try {
      // Upload photos to Supabase Storage
      const photoUrls: string[] = [];

      if (plant.photos && plant.photos.length > 0) {
        for (const photo of plant.photos) {
          try {
            const publicUrl = await uploadPhoto(userId, plant.id, photo.uri);
            photoUrls.push(publicUrl);
          } catch (photoError) {
            console.warn(`Failed to upload photo for plant ${plant.id}:`, photoError);
            // Continue with other photos even if one fails
          }
        }
      } else if (plant.photo) {
        // Legacy single photo field
        try {
          const publicUrl = await uploadPhoto(userId, plant.id, plant.photo);
          photoUrls.push(publicUrl);
        } catch (photoError) {
          console.warn(`Failed to upload photo for plant ${plant.id}:`, photoError);
        }
      }

      // Insert plant data into Supabase 'plants' table
      // TODO: Phase 12 - Create 'plants' table with RLS policies
      // Table structure:
      // - id: UUID (primary key)
      // - user_id: UUID (foreign key to auth.users, RLS filter)
      // - species: text
      // - common_name: text?
      // - scientific_name: text?
      // - nickname: text?
      // - location: text?
      // - photo_urls: text[] (array of Supabase Storage public URLs)
      // - added_date: timestamptz
      // - notes: text?
      // - purchase_date: text?
      // - purchase_price: text?
      // - purchase_origin: text?
      // - gift_from: text?
      // - created_at: timestamptz (default now())
      // - updated_at: timestamptz (default now())

      const { error: plantError } = await supabase
        .from('plants')
        .insert({
          id: plant.id,
          user_id: userId,
          species: plant.species,
          common_name: plant.commonName || null,
          scientific_name: plant.scientificName || null,
          nickname: plant.nickname || null,
          location: plant.location || null,
          photo_urls: photoUrls,
          added_date: plant.addedDate,
          notes: plant.notes || null,
          purchase_date: plant.purchaseDate || null,
          purchase_price: plant.purchasePrice || null,
          purchase_origin: plant.purchaseOrigin || null,
          gift_from: plant.giftFrom || null,
        });

      if (plantError) {
        throw plantError;
      }

      // Insert watering history into Supabase 'watering_history' table
      // TODO: Phase 12 - Create 'watering_history' table with RLS policies
      // Table structure:
      // - id: UUID (primary key)
      // - user_id: UUID (foreign key to auth.users, RLS filter)
      // - plant_id: UUID (foreign key to plants.id, RLS filter)
      // - watered_date: timestamptz
      // - notes: text?
      // - created_at: timestamptz (default now())

      if (plant.waterHistory && plant.waterHistory.length > 0) {
        const wateringRecords = plant.waterHistory.map((event) => ({
          user_id: userId,
          plant_id: plant.id,
          watered_date: event.date,
          notes: event.notes || null,
        }));

        const { error: historyError } = await supabase
          .from('watering_history')
          .insert(wateringRecords);

        if (historyError) {
          console.warn(`Failed to migrate watering history for plant ${plant.id}:`, historyError);
          // Don't fail the entire plant migration if history fails
        }
      }

      // Success!
      success++;
    } catch (err) {
      console.error(`Failed to migrate plant ${plant.id}:`, err);
      failed++;
    }
  }

  return { success, failed, cancelled: signal.cancelled };
};

/**
 * Compress image before upload
 *
 * Resizes large photos to reduce bandwidth and storage usage.
 * Maintains aspect ratio while limiting max dimension.
 *
 * @param uri - Local file URI of photo to compress
 * @returns Promise<string> with URI of compressed image
 * @throws Error if compression fails
 *
 * Example:
 *   const compressedUri = await compressImage('file://.../photo.jpg');
 *   await uploadToSupabase(compressedUri);
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        // Resize to max dimension while preserving aspect ratio
        ImageManipulator.Action.resize({
          width: MAX_PHOTO_DIMENSION,
          height: MAX_PHOTO_DIMENSION,
        }),
      ],
      {
        compress: PHOTO_COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (err) {
    console.error('Image compression failed:', err);
    throw new Error('Failed to compress photo');
  }
};

/**
 * Upload photo to Supabase Storage
 *
 * Compresses photo and uploads to 'plant-photos' bucket.
 * File path: user_id/plant_id/timestamp.jpg
 *
 * @param userId - User ID from Supabase auth
 * @param plantId - Plant ID
 * @param uri - Local file URI of photo
 * @returns Promise<string> with public URL of uploaded photo
 * @throws Error if upload fails
 *
 * Example:
 *   const publicUrl = await uploadPhoto('user-123', 'plant-456', 'file://.../photo.jpg');
 *   // Returns: "https://xxx.supabase.co/storage/v1/object/public/plant-photos/user-123/plant-456/1234567890.jpg"
 */
const uploadPhoto = async (
  userId: string,
  plantId: string,
  uri: string
): Promise<string> => {
  const supabase = getSupabaseClient();

  try {
    // Compress image before upload
    const compressedUri = await compressImage(uri);

    // Read file as base64
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filePath = `${userId}/${plantId}/${timestamp}.jpg`;

    // Upload to Supabase Storage
    // TODO: Phase 12 - Create 'plant-photos' storage bucket with RLS policies
    // Bucket: plant-photos (public bucket)
    // RLS Policy: Authenticated users can read/write their own folders (user_id/*)

    const { data, error } = await supabase.storage
      .from('plant-photos')
      .upload(filePath, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('plant-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Photo upload failed:', err);
    throw new Error('Failed to upload photo');
  }
};

// ============================================================================
// Migration Flag Functions
// ============================================================================

/**
 * Set migration flag in AsyncStorage
 *
 * Stores migration completion timestamp and plant count.
 * Call this after successful migration to prevent re-showing prompt.
 *
 * @param plantCount - Number of plants that were migrated
 *
 * Example:
 *   await setMigrationFlag(42);
 *   // User won't be prompted to migrate again
 */
export const setMigrationFlag = async (plantCount: number): Promise<void> => {
  const flag: MigrationFlag = {
    timestamp: new Date().toISOString(),
    plantCount,
  };

  try {
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify(flag));
  } catch (err) {
    console.error('Failed to set migration flag:', err);
  }
};

/**
 * Get migration flag from AsyncStorage
 *
 * Checks if user has completed migration previously.
 * Use this to determine whether to show migration prompt.
 *
 * @returns MigrationFlag if previously migrated, null otherwise
 *
 * Example:
 *   const flag = await getMigrationFlag();
 *   if (flag) {
 *     console.log(`Migrated ${flag.plantCount} plants on ${flag.timestamp}`);
 *   } else {
 *     // Show migration prompt
 *   }
 */
export const getMigrationFlag = async (): Promise<MigrationFlag | null> => {
  try {
    const value = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (!value) {
      return null;
    }

    const flag = JSON.parse(value) as MigrationFlag;
    return flag;
  } catch (err) {
    console.error('Failed to get migration flag:', err);
    return null;
  }
};

/**
 * Clear migration flag from AsyncStorage
 *
 * Removes the migration completion flag.
 * Use this to allow user to retry migration (e.g., for testing or after failed migration).
 *
 * Example:
 *   await clearMigrationFlag();
 *   // Migration prompt will show again on next sign-in
 */
export const clearMigrationFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MIGRATION_FLAG_KEY);
  } catch (err) {
    console.error('Failed to clear migration flag:', err);
  }
};

/**
 * Check if user has completed migration
 *
 * Convenience wrapper around getMigrationFlag().
 * Returns true if migration flag exists.
 *
 * @returns true if previously migrated, false otherwise
 *
 * Example:
 *   if (await hasMigrated()) {
 *     console.log('Already migrated');
 *   } else {
 *     // Show migration prompt
 *   }
 */
export const hasMigrated = async (): Promise<boolean> => {
  const flag = await getMigrationFlag();
  return flag !== null;
};
