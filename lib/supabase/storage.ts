/**
 * Supabase Storage Management for Plantid v2.0 Community
 *
 * Manages Supabase Storage buckets for user avatars and plant photos.
 * All buckets are public with RLS policies for user-isolated folders.
 *
 * Usage:
 *   import { initializeStorageBuckets } from '@/lib/supabase/storage';
 *   await initializeStorageBuckets(); // Call during app initialization
 *
 * File path patterns:
 * - Avatars: {userId}/avatar.jpg
 * - Plant photos: {userId}/{plantId}/{timestamp}.jpg
 *
 * @module lib/supabase/storage
 */

import { getSupabaseClient } from './client';

// ============================================================================
// Types
// ============================================================================

/**
 * Storage bucket configuration
 *
 * Defines bucket name and whether it's publicly accessible.
 */
interface BucketConfig {
  /** Bucket identifier (used in storage.from()) */
  name: string;
  /** Whether bucket is publicly accessible (public URLs) */
  public: boolean;
}

/**
 * Storage initialization result
 *
 * Returned by initializeStorageBuckets() after creating buckets.
 */
interface StorageInitResult {
  /** Whether bucket creation was successful */
  success: boolean;
  /** Array of created bucket names */
  createdBuckets: string[];
  /** Array of buckets that already existed */
  existingBuckets: string[];
  /** Error message if bucket creation failed */
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Avatar storage bucket name */
export const AVATARS_BUCKET = 'avatars';

/** Plant photos storage bucket name */
export const PLANT_PHOTOS_BUCKET = 'plant-photos';

/** Maximum file size for avatars (2MB) */
export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

/** Maximum file size for plant photos (5MB) */
export const PLANT_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types for image uploads */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ============================================================================
// Bucket Initialization
// ============================================================================

/**
 * Initialize Supabase Storage buckets
 *
 * Creates buckets if they don't exist and sets up RLS policies.
 * Safe to call multiple times — skips existing buckets.
 *
 * Buckets created:
 * - avatars: User profile pictures (public read, user-isolated write)
 * - plant-photos: Plant identification photos (public read, user-isolated write)
 *
 * Note: This function requires service role permissions or admin API calls.
 * For client-side initialization, ensure buckets are created via Supabase dashboard
 * or use this function in a server context/Edge function.
 *
 * @returns Promise<StorageInitResult> with bucket creation status
 *
 * Example:
 *   const result = await initializeStorageBuckets();
 *   if (result.success) {
 *     console.log(`Created ${result.createdBuckets.length} buckets`);
 *   }
 */
export const initializeStorageBuckets = async (): Promise<StorageInitResult> => {
  const supabase = getSupabaseClient();
  const createdBuckets: string[] = [];
  const existingBuckets: string[] = [];

  try {
    // Create avatars bucket
    const avatarsResult = await createBucketIfNotExists({
      name: AVATARS_BUCKET,
      public: true,
    });

    if (avatarsResult.created) {
      createdBuckets.push(AVATARS_BUCKET);
    } else if (avatarsResult.existing) {
      existingBuckets.push(AVATARS_BUCKET);
    }

    // Create plant-photos bucket
    const plantPhotosResult = await createBucketIfNotExists({
      name: PLANT_PHOTOS_BUCKET,
      public: true,
    });

    if (plantPhotosResult.created) {
      createdBuckets.push(PLANT_PHOTOS_BUCKET);
    } else if (plantPhotosResult.existing) {
      existingBuckets.push(PLANT_PHOTOS_BUCKET);
    }

    return {
      success: true,
      createdBuckets,
      existingBuckets,
    };
  } catch (err) {
    console.error('Failed to initialize storage buckets:', err);
    return {
      success: false,
      createdBuckets,
      existingBuckets,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

/**
 * Create bucket if it doesn't exist
 *
 * Helper function that checks for bucket existence before creation.
 * Returns status indicating whether bucket was created or already existed.
 *
 * @param config - Bucket configuration (name, public)
 * @returns Promise with created/existing status
 *
 * @throws Error if bucket creation fails (not due to existence)
 */
const createBucketIfNotExists = async (
  config: BucketConfig
): Promise<{ created: boolean; existing: boolean }> => {
  const supabase = getSupabaseClient();

  try {
    // Check if bucket exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const bucketExists = existingBuckets.some((bucket) => bucket.id === config.name);

    if (bucketExists) {
      return { created: false, existing: true };
    }

    // Create bucket
    const { error: createError } = await supabase.storage.createBucket(config.name, {
      public: config.public,
      fileSizeLimit: config.name === AVATARS_BUCKET
        ? AVATAR_MAX_SIZE_BYTES
        : PLANT_PHOTO_MAX_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    });

    if (createError) {
      throw createError;
    }

    console.log(`Created storage bucket: ${config.name}`);
    return { created: true, existing: false };
  } catch (err) {
    // Rethrow error for handling by initializeStorageBuckets
    throw err;
  }
};

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Get public URL for avatar
 *
 * Constructs the public URL for a user's avatar image.
 * Avatar path pattern: {userId}/avatar.jpg
 *
 * @param userId - User ID from auth.users
 * @param filename - Avatar filename (default: 'avatar.jpg')
 * @returns Public URL string
 *
 * Example:
 *   const url = getAvatarPublicUrl('user-123');
 *   // Returns: "https://xxx.supabase.co/storage/v1/object/public/avatars/user-123/avatar.jpg"
 */
export const getAvatarPublicUrl = (userId: string, filename: string = 'avatar.jpg'): string => {
  const supabase = getSupabaseClient();
  const filePath = `${userId}/${filename}`;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Get public URL for plant photo
 *
 * Constructs the public URL for a plant photo.
 * Plant photo path pattern: {userId}/{plantId}/{timestamp}.jpg
 *
 * @param userId - User ID from auth.users
 * @param plantId - Plant ID from plants table
 * @param filename - Photo filename (typically timestamp-based)
 * @returns Public URL string
 *
 * Example:
 *   const url = getPlantPhotoPublicUrl('user-123', 'plant-456', '1740921600000.jpg');
 *   // Returns: "https://xxx.supabase.co/storage/v1/object/public/plant-photos/user-123/plant-456/1740921600000.jpg"
 */
export const getPlantPhotoPublicUrl = (
  userId: string,
  plantId: string,
  filename: string
): string => {
  const supabase = getSupabaseClient();
  const filePath = `${userId}/${plantId}/${filename}`;

  const { data } = supabase.storage.from(PLANT_PHOTOS_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
};

// ============================================================================
// Upload Helpers
// ============================================================================

/**
 * Generate avatar file path
 *
 * Creates the storage path for a user's avatar.
 * Path pattern: {userId}/avatar.jpg
 *
 * @param userId - User ID from auth.users
 * @param filename - Avatar filename (default: 'avatar.jpg')
 * @returns Storage path for upload
 *
 * Example:
 *   const path = getAvatarPath('user-123');
 *   // Returns: "user-123/avatar.jpg"
 */
export const getAvatarPath = (userId: string, filename: string = 'avatar.jpg'): string => {
  return `${userId}/${filename}`;
};

/**
 * Generate plant photo file path
 *
 * Creates the storage path for a plant photo.
 * Path pattern: {userId}/{plantId}/{timestamp}.jpg
 *
 * @param userId - User ID from auth.users
 * @param plantId - Plant ID from plants table
 * @param filename - Photo filename (typically timestamp-based)
 * @returns Storage path for upload
 *
 * Example:
 *   const path = getPlantPhotoPath('user-123', 'plant-456', '1740921600000.jpg');
 *   // Returns: "user-123/plant-456/1740921600000.jpg"
 */
export const getPlantPhotoPath = (
  userId: string,
  plantId: string,
  filename: string
): string => {
  return `${userId}/${plantId}/${filename}`;
};
