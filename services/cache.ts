import { LRUCache } from 'lru-cache';
import * as Crypto from 'expo-crypto';
import { PlantNetResponse } from '@/types';

// LRU cache configuration
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ENTRIES = 100;

// Create LRU cache instance
const cache = new LRUCache<string, PlantNetResponse>({
  max: MAX_CACHE_ENTRIES,
  ttl: CACHE_TTL_MS,
});

/**
 * Hash an image URI using SHA-256 for collision-resistant caching
 * @param imageUri - The URI of the image to hash
 * @returns SHA-256 hash of the image URI
 */
export async function hashImage(imageUri: string): Promise<string> {
  try {
    // Use SHA-256 for collision-resistant hashing
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      imageUri
    );
  } catch (error) {
    console.error('Error hashing image URI:', error);
    // Fallback to simple hash if crypto fails
    let hash = 0;
    for (let i = 0; i < imageUri.length; i++) {
      const char = imageUri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Get cached result for an image
 * @param imageUri - The URI of the image
 * @returns Cached PlantNet response or null if not found/expired
 */
export async function getCachedResult(imageUri: string): Promise<PlantNetResponse | null> {
  try {
    const hash = await hashImage(imageUri);
    const result = cache.get(hash);

    if (result) {
      console.log(`Cache HIT for ${imageUri.substring(0, 50)}...`);
    } else {
      console.log(`Cache MISS for ${imageUri.substring(0, 50)}...`);
    }

    return result || null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Save result to cache
 * @param imageUri - The URI of the image
 * @param result - The PlantNet response to cache
 */
export async function setCachedResult(imageUri: string, result: PlantNetResponse): Promise<void> {
  try {
    const hash = await hashImage(imageUri);
    cache.set(hash, result);
    console.log(`Cached result for ${imageUri.substring(0, 50)}... (size: ${cache.size})`);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Clear all cached results
 * Useful for testing or manual cache invalidation
 */
export function clearCache(): void {
  cache.clear();
  console.log('Cache cleared');
}

/**
 * Get current cache size (number of entries)
 * @returns Number of entries currently in cache
 */
export function getCacheSize(): number {
  return cache.size;
}

/**
 * Get cache statistics
 * @returns Object with cache size and max entries
 */
export function getCacheStats(): { size: number; max: number; ttl: number } {
  return {
    size: cache.size,
    max: MAX_CACHE_ENTRIES,
    ttl: CACHE_TTL_MS,
  };
}
