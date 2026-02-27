/**
 * Expo SecureStore adapter for Supabase session persistence
 *
 * Provides encrypted storage for Supabase auth tokens using Expo SecureStore.
 * On iOS: Uses iOS Keychain for encrypted storage
 * On Android: Uses Android Keystore for encrypted storage
 *
 * This ensures session tokens (JWT) are stored securely and persist across app restarts.
 */
import * as SecureStore from 'expo-secure-store';

export const secureAdapter = {
  /**
   * Retrieve a value from SecureStore
   * @param key - The storage key
   * @returns Promise resolving to the stored value or null if not found
   */
  getItem: (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key);
  },

  /**
   * Store a value in SecureStore
   * @param key - The storage key
   * @param value - The value to store (will be converted to string)
   */
  setItem: (key: string, value: string): Promise<void> => {
    return SecureStore.setItemAsync(key, value);
  },

  /**
   * Remove a value from SecureStore
   * @param key - The storage key to remove
   */
  removeItem: (key: string): Promise<void> => {
    return SecureStore.deleteItemAsync(key);
  },
};
