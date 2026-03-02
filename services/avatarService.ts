/**
 * Avatar Upload Service
 *
 * Handles avatar image upload from gallery or camera with compression and validation.
 * Integrates with Supabase Storage for avatar persistence.
 *
 * Features:
 * - Gallery and camera image selection
 * - Square crop (1:1 aspect ratio)
 * - Image compression (max 1200px, quality 0.7)
 * - File size validation (max 2MB)
 * - Upsert to replace existing avatars
 * - Public URL with transformations
 *
 * @module services/avatarService
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Action } from 'expo-image-manipulator';

// ============================================================================
// Types
// ============================================================================

/**
 * Avatar upload result
 *
 * Returned after successful upload to Supabase Storage.
 */
export interface AvatarUploadResult {
  /** Public URL of uploaded avatar with transformations */
  publicUrl: string;
  /** Storage file path (e.g., user-123/avatar_1234567890.jpg) */
  filePath: string;
}

/**
 * Avatar source type
 *
 * Determines whether to launch gallery picker or camera.
 */
export type AvatarSource = 'gallery' | 'camera';

/**
 * Avatar upload options
 *
 * Configuration for avatar upload behavior.
 */
export interface AvatarUploadOptions {
  /** Source for avatar image (gallery or camera) */
  source: AvatarSource;
  /** Maximum file size in bytes (default: 2MB) */
  maxSize?: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Default max file size: 2MB */
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB in bytes

/** Max dimension for compressed avatar (width or height) */
const MAX_AVATAR_DIMENSION = 1200;

/** JPEG quality for compressed avatar (0.0 - 1.0) */
const AVATAR_COMPRESS_QUALITY = 0.7;

/** Supabase Storage bucket name for avatars */
const AVATAR_BUCKET = 'avatars';

/** Cache control duration for avatar files (1 hour) */
const CACHE_CONTROL = '3600';

// ============================================================================
// Error Messages
// ============================================================================

/** Error messages for avatar upload failures */
const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'Photo library permission required',
  FILE_TOO_LARGE: `Image exceeds 2MB limit`,
  UPLOAD_FAILED: 'Failed to upload avatar',
  PICKER_CANCELLED: 'Picker cancelled',
  COMPRESSION_FAILED: 'Failed to compress image',
} as const;

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Upload avatar from gallery or camera
 *
 * Algorithm:
 * 1. Request media library permissions
 * 2. Launch image picker or camera based on source
 * 3. Return null if user cancels
 * 4. Crop to square (1:1 aspect ratio)
 * 5. Compress image (max 1200px, quality 0.7, JPEG)
 * 6. Validate file size ≤ 2MB
 * 7. Upload to Supabase Storage 'avatars' bucket
 * 8. Return public URL with transformations (200x200)
 *
 * @param userId - User ID from Supabase auth
 * @param options - Upload options (source, maxSize)
 * @returns Promise<string | null> with public URL or null if cancelled
 * @throws Error if permission denied, file too large, or upload fails
 *
 * Example:
 *   const publicUrl = await uploadAvatar('user-123', { source: 'gallery' });
 *   // Returns: "https://xxx.supabase.co/storage/v1/object/public/avatars/user-123/avatar_1234567890.jpg"
 */
export const uploadAvatar = async (
  userId: string,
  options: AvatarUploadOptions
): Promise<string | null> => {
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;

  // Step 1: Request permissions
  const permissionResult = await requestPermissions(options.source);
  if (!permissionResult.granted) {
    throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
  }

  // Step 2: Launch picker or camera
  const pickerResult = await launchPicker(options.source);
  if (!pickerResult) {
    // User cancelled
    return null;
  }

  // Step 3: Compress and crop image
  const compressedUri = await compressAndCropImage(pickerResult.uri);

  // Step 4: Validate file size
  await validateFileSize(compressedUri, maxSize);

  // Step 5: Upload to Supabase Storage
  const uploadResult = await uploadToSupabase(userId, compressedUri);

  return uploadResult.publicUrl;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Request permissions for gallery or camera
 *
 * @param source - Avatar source (gallery or camera)
 * @returns Promise with granted status
 */
const requestPermissions = async (
  source: AvatarSource
): Promise<{ granted: boolean }> => {
  if (source === 'gallery') {
    return await ImagePicker.requestMediaLibraryPermissionsAsync();
  } else {
    return await ImagePicker.requestCameraPermissionsAsync();
  }
};

/**
 * Launch image picker or camera
 *
 * @param source - Avatar source (gallery or camera)
 * @returns Promise with ImagePicker result or null if cancelled
 */
const launchPicker = async (
  source: AvatarSource
): Promise<ImagePicker.ImagePickerAsset | null> => {
  let result: ImagePicker.ImagePickerResult;

  if (source === 'gallery') {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square crop
      quality: 1,
    });
  } else {
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square crop
      quality: 1,
    });
  }

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
};

/**
 * Compress and crop image to square
 *
 * Algorithm:
 * 1. Resize to max dimension (1200px) while preserving aspect ratio
 * 2. Compress with quality 0.7
 * 3. Convert to JPEG format
 *
 * @param uri - Local file URI of image
 * @returns Promise<string> with URI of compressed image
 * @throws Error if compression fails
 */
const compressAndCropImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        // Resize to max dimension while preserving aspect ratio
        {
          resize: {
            width: MAX_AVATAR_DIMENSION,
            height: MAX_AVATAR_DIMENSION,
          },
        } as Action,
      ],
      {
        compress: AVATAR_COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (err) {
    console.error('Image compression failed:', err);
    throw new Error(ERROR_MESSAGES.COMPRESSION_FAILED);
  }
};

/**
 * Validate file size
 *
 * Checks if compressed image file size ≤ maxSize.
 * Throws error if file exceeds limit.
 *
 * @param uri - Local file URI of compressed image
 * @param maxSize - Maximum file size in bytes
 * @throws Error if file exceeds maxSize
 */
const validateFileSize = async (uri: string, maxSize: number): Promise<void> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileSize = blob.size;

    if (fileSize > maxSize) {
      throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
    }
  } catch (err) {
    if (err instanceof Error && err.message === ERROR_MESSAGES.FILE_TOO_LARGE) {
      throw err;
    }
    console.error('File size validation failed:', err);
    throw new Error(ERROR_MESSAGES.COMPRESSION_FAILED);
  }
};

/**
 * Upload avatar to Supabase Storage
 *
 * Algorithm:
 * 1. Read file as blob from URI
 * 2. Generate unique file path: {userId}/avatar_{timestamp}.jpg
 * 3. Upload to 'avatars' bucket with upsert: true
 * 4. Get public URL with transformations (200x200)
 *
 * @param userId - User ID from Supabase auth
 * @param uri - Local file URI of compressed avatar
 * @returns Promise<AvatarUploadResult> with public URL and file path
 * @throws Error if upload fails
 */
const uploadToSupabase = async (
  userId: string,
  uri: string
): Promise<AvatarUploadResult> => {
  const supabase = getSupabaseClient();

  try {
    // Read file as blob
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filePath = `${userId}/avatar_${timestamp}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: CACHE_CONTROL,
        upsert: true, // Replace existing avatar
      });

    if (error) {
      throw error;
    }

    // Get public URL with transformations
    const { data: { publicUrl } } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath, {
        transform: {
          width: 200,
          height: 200,
          resize: 'cover',
        },
      });

    return {
      publicUrl,
      filePath,
    };
  } catch (err) {
    console.error('Avatar upload failed:', err);
    throw new Error(ERROR_MESSAGES.UPLOAD_FAILED);
  }
};
