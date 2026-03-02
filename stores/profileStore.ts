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
   * 3. Call profileService.fetchProfile(userId)
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
      const { fetchProfile: fetchProfileService } = await import('@/services/profileService');

      const result = await fetchProfileService(userId);

      if (result.success && result.data) {
        setCurrentProfile(result.data);
      } else {
        setError(result.error || 'Failed to fetch profile');
      }
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
   * Merges updated data into currentProfile state.
   *
   * Algorithm:
   * 1. Set loading state
   * 2. Clear previous errors
   * 3. Call profileService.updateProfile(userId, updates)
   * 4. Merge updated data into currentProfile
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
      const { updateProfile: updateProfileService } = await import('@/services/profileService');

      const result = await updateProfileService(currentProfile.id, updates);

      if (result.success && result.data) {
        // Merge updated data into current profile
        setCurrentProfile({
          ...currentProfile,
          ...result.data,
          // Preserve stats which aren't returned by update
          stats: currentProfile.stats,
        });
      } else {
        setError(result.error || 'Failed to update profile');
      }
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
   * 3. Call profileService.uploadAvatarAndUpdateProfile(userId, source)
   * 4. Update currentProfile.avatar_url with new URL
   * 5. Handle errors gracefully
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

      // Import profileService dynamically
      const { uploadAvatarAndUpdateProfile } = await import('@/services/profileService');

      const result = await uploadAvatarAndUpdateProfile(currentProfile.id, source);

      if (result.success && result.data) {
        // Update avatar URL in current profile
        setCurrentProfile({
          ...currentProfile,
          avatar_url: result.data,
        });
      } else if (result.error) {
        setError(result.error);
      }
      // If result.data is empty string, user cancelled - no error
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
