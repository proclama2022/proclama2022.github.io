/**
 * Profile State Management with Zustand
 *
 * Centralized profile state following Plantid's existing store pattern.
 * Manages current user's profile data, loading states, and edit mode.
 *
 * No persist middleware — profile data is fetched fresh from Supabase
 * on app launch or when user signs in.
 *
 * Usage:
 *   import { useProfileStore } from '@/stores/profileStore';
 *
 *   const { currentProfile, isLoading, error } = useProfileStore();
 *   const { fetchCurrentProfile, updateProfile, clearProfile } = useProfileStore();
 *
 * @module stores/profileStore
 */
import { create } from 'zustand';
import type { ProfileState, ProfileWithStats } from '@/types/profile';

/**
 * Profile store hook
 *
 * Provides reactive profile state and actions for profile management.
 * Components using this hook will re-render when profile state changes.
 *
 * State:
 *   currentProfile: Current user's profile with stats (null if not loaded)
 *   isEditing: Whether profile edit mode is active
 *   isLoading: Loading state for async profile operations
 *   error: User-friendly error message (null if no error)
 *
 * Actions:
 *   setCurrentProfile: Update profile state (typically used internally)
 *   setIsEditing: Toggle edit mode for profile screen
 *   setLoading: Set loading state for async operations
 *   setError: Set error message for display in UI
 *   clearProfile: Reset all profile state (used on sign out)
 *   fetchCurrentProfile: Fetch profile from Supabase (with stats)
 *   updateProfile: Update profile fields in Supabase
 *   uploadAvatar: Upload avatar image to Supabase Storage
 *   refreshStats: Re-fetch profile to update statistics
 */
export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state — no profile loaded
  currentProfile: null,
  isEditing: false,
  isLoading: false,
  error: null,

  /**
   * Set the current profile
   *
   * Updates profile state with fetched profile data.
   * Typically called internally by fetchCurrentProfile.
   *
   * @param profile - ProfileWithStats object or null to clear
   */
  setCurrentProfile: (profile: ProfileWithStats | null) =>
    set({ currentProfile: profile }),

  /**
   * Set edit mode state
   *
   * Toggles profile edit mode for UI state management.
   * Used in profile screen to switch between view/edit modes.
   *
   * @param isEditing - Whether edit mode is active
   */
  setIsEditing: (isEditing: boolean) =>
    set({ isEditing }),

  /**
   * Set loading state
   *
   * Set to true before calling profile service (fetch, update, etc.).
   * Set to false after operation completes (success or failure).
   *
   * @param isLoading - Loading state (true during async operations)
   */
  setLoading: (isLoading: boolean) =>
    set({ isLoading }),

  /**
   * Set error message
   *
   * Call this when profile operation fails. Error should be user-friendly.
   *
   * @param error - Error message string or null to clear error
   */
  setError: (error: string | null) =>
    set({ error }),

  /**
   * Clear all profile state
   *
   * Resets currentProfile, isEditing, and error to null.
   * Called on sign out to remove profile data.
   */
  clearProfile: () =>
    set({
      currentProfile: null,
      isEditing: false,
      error: null,
    }),

  /**
   * Fetch current user's profile from Supabase
   *
   * Loads profile with aggregated statistics (plants, followers, following).
   * Updates currentProfile state with fetched data.
   *
   * Algorithm:
   * 1. Set loading state
   * 2. Clear previous errors
   * 3. Call profileService to fetch profile with stats
   * 4. Update currentProfile with result
   * 5. Handle errors gracefully
   *
   * @param userId - User ID to fetch profile for (from auth.user.id)
   *
   * Example:
   *   const { fetchCurrentProfile } = useProfileStore();
   *   await fetchCurrentProfile('user-123');
   */
  fetchCurrentProfile: async (userId: string) => {
    const { setError, setLoading, setCurrentProfile } = get();

    try {
      setLoading(true);
      setError(null);

      // Import profileService dynamically to avoid circular dependency
      const { getProfileWithStats } = await import('@/lib/supabase/profiles');

      const profile = await getProfileWithStats(userId);

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Transform to ProfileWithStats format (stats nested)
      const profileWithStats: ProfileWithStats = {
        id: profile.id,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        stats: {
          plants_identified: profile.plants_identified,
          followers_count: profile.followers_count,
          following_count: profile.following_count,
        },
      };

      setCurrentProfile(profileWithStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  },

  /**
   * Update profile fields
   *
   * Updates display_name and/or bio in Supabase.
   * Refreshes currentProfile after successful update.
   *
   * Algorithm:
   * 1. Set loading state
   * 2. Clear previous errors
   * 3. Call profileService to update profile
   * 4. Re-fetch profile to get updated data
   * 5. Handle errors gracefully
   *
   * @param updates - Fields to update (display_name, bio)
   *
   * Example:
   *   const { updateProfile } = useProfileStore();
   *   await updateProfile({ display_name: 'Plant Parent' });
   */
  updateProfile: async (updates: { display_name?: string; bio?: string }) => {
    const { setError, setLoading, currentProfile } = get();

    if (!currentProfile) {
      setError('No profile loaded');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Import profileService dynamically
      const { updateProfile: updateProfileService } = await import('@/lib/supabase/profiles');

      await updateProfileService(currentProfile.id, updates);

      // Re-fetch profile to get updated data
      await get().fetchCurrentProfile(currentProfile.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  },

  /**
   * Upload avatar from gallery or camera
   *
   * Launches image picker, uploads to Supabase Storage,
   * and updates profile.avatar_url with new URL.
   *
   * Algorithm:
   * 1. Set loading state
   * 2. Clear previous errors
   * 3. Launch image picker (gallery or camera)
   * 4. Compress and upload image to Supabase Storage
   * 5. Update profile.avatar_url with public URL
   * 6. Refresh profile data
   * 7. Handle errors gracefully
   *
   * Note: This is a placeholder for Phase 13 (Profile UI).
   * The actual implementation will use expo-image-picker.
   *
   * @param source - Avatar source ('gallery' or 'camera')
   *
   * Example:
   *   const { uploadAvatar } = useProfileStore();
   *   await uploadAvatar('gallery');
   */
  uploadAvatar: async (source: 'gallery' | 'camera') => {
    const { setError, setLoading, currentProfile } = get();

    if (!currentProfile) {
      setError('No profile loaded');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Phase 13 - Implement avatar upload with expo-image-picker
      // 1. Launch image picker (ImagePicker.launchImageLibraryAsync or launchCameraAsync)
      // 2. Compress image with ImageManipulator
      // 3. Upload to Supabase Storage (avatars bucket)
      // 4. Update profile.avatar_url
      // 5. Refresh profile data

      throw new Error('Avatar upload not yet implemented - coming in Phase 13');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMessage);
      console.error('Avatar upload error:', err);
    } finally {
      setLoading(false);
    }
  },

  /**
   * Refresh profile statistics
   *
   * Re-fetches profile to update stats (plants, followers, following).
   * Useful after follow/unfollow actions or plant collection changes.
   *
   * Simply calls fetchCurrentProfile with current user ID.
   *
   * Example:
   *   const { refreshStats } = useProfileStore();
   *   await refreshStats(); // Updates follower/following counts
   */
  refreshStats: async () => {
    const { currentProfile } = get();

    if (!currentProfile) {
      console.warn('Cannot refresh stats: no profile loaded');
      return;
    }

    await get().fetchCurrentProfile(currentProfile.id);
  },
}));
