// PlantNet API Types
export type OrganType = 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto';

export interface PlantNetResult {
  score: number; // Confidence 0-1
  species: PlantSpecies;
  images: PlantImage[];
  gbif?: GBIFInfo;
}

// PlantNet API returns these fields as objects, not strings
export interface PlantNetNameObject {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship: string;
  scientificName: string;
}

export interface PlantSpecies {
  scientificName: PlantNetNameObject | string;
  scientificNameWithoutAuthor?: string;
  scientificNameAuthorship?: string;
  genus: PlantNetNameObject | string;
  family: PlantNetNameObject | string;
  commonNames: string[];
}

export interface PlantImage {
  url: string;
  author?: string;
  license?: string;
  date?: string;
  organ?: OrganType;
}

export interface GBIFInfo {
  gbifId: string;
}

export interface PlantNetResponse {
  query: {
    project: string;
    images: string[];
    organs: string[];
    includeRelatedImages: boolean;
  };
  language: string;
  preferedReferential: string;
  bestMatch: PlantNetResult;
  results: PlantNetResult[];
  remainingIdentificationRequests: number;
  version: string;
}

// App Types
export interface SavedPlant {
  id: string;
  species: string;
  commonName?: string;
  scientificName?: string;
  nickname?: string;
  location?: string;
  photo: string;
  photos?: PlantPhoto[];
  addedDate: string;
  lastWatered?: string;
  nextWateringDate?: string;
  scheduledNotificationId?: string;
  waterHistory: WaterEvent[];
  reminders?: Reminder[];        // NEW: custom care reminders
  notes?: string;
  purchaseDate?: string;    // ISO date string or free text, user-entered
  purchasePrice?: string;   // Free text (e.g. "€12.50")
  purchaseOrigin?: string;  // Free text (e.g. "IKEA Milano")
  giftFrom?: string;        // Free text (e.g. "Grandma")
}

export interface WaterEvent {
  date: string;
  notes?: string;
}

export interface PlantPhoto {
  uri: string;              // File URI (not base64)
  addedDate: string;        // ISO timestamp
  isPrimary: boolean;       // true for main photo
}

export interface Reminder {
  id: string;                    // UUID for reminder
  type: 'fertilize' | 'repot' | 'prune' | 'custom';
  customLabel?: string;          // User-defined label when type='custom'
  date: string;                  // ISO date string for reminder date
  completed: boolean;            // true if marked as done
  notificationId?: string;       // expo-notifications ID for cancellation
}

export interface PlantCareInfo {
  id: string;
  commonName: string;
  scientificName: string;
  waterFrequencyDays: number;
  sunlight: 'full-sun' | 'partial-sun' | 'shade' | 'low-light';
  tempMin: number;
  tempMax: number;
  soil?: string;
  humidity?: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  toxicPets: boolean;
  tips: {
    it: string;
    en: string;
  };
  aliases?: string[];
  seasonalTemps?: SeasonalTemp[];
  fertilization?: FertilizationInfo;
  pruning?: PruningInfo;
  pests?: PestEntry[];
}

export interface SeasonalTemp {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  minTemp: number; // Celsius
  maxTemp: number; // Celsius
}

export interface FertilizationInfo {
  schedule: { it: string; en: string }; // e.g. "Every 2 weeks in spring/summer"
  type: { it: string; en: string };      // e.g. "Balanced liquid fertilizer"
}

export interface PruningInfo {
  when: { it: string; en: string };
  how: { it: string; en: string };
}

export interface PestEntry {
  name: { it: string; en: string };
  description: { it: string; en: string }; // Brief visible description
  remedy: { it: string; en: string };       // Revealed on expand
}

export interface CacheEntry {
  imageHash: string;
  result: PlantNetResponse;
  timestamp: number;
}

export interface RateLimitState {
  date: string;
  count: number;
}

export interface NotificationSchedule {
  plantId: string;
  notificationId: string;
  scheduledDate: string;
}

export interface ComplianceData {
  rate: number;
  watered: number;
  expected: number;
  streak: number;
}

// Pro/In-App Purchase Types
export interface ProStatus {
  isPro: boolean;
  lastVerified: string | null; // ISO timestamp of last RevenueCat verification
}

export type PurchaseError =
  | { type: 'user_cancelled' }
  | { type: 'network_error'; message: string }
  | { type: 'product_not_available' }
  | { type: 'verification_failed'; message: string }
  | { type: 'unknown'; message: string };

// Auth & Supabase Types
import { User, Session } from '@supabase/supabase-js';

/**
 * Storage adapter interface for Supabase session persistence
 * Used by Expo SecureStore adapter to encrypt auth tokens
 */
export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Auth state for Zustand auth store
 * Manages user authentication state across the app
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

/**
 * Auth error types for error handling
 */
export type AuthError =
  | 'network_error'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'session_expired'
  | 'unknown';

/**
 * Migration progress tracking data
 *
 * Passed to onProgress callback during plant migration to update UI.
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
 * Migration result data
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
 * Migration completion flag stored in AsyncStorage
 *
 * Tracks whether user has completed migration and when.
 */
export interface MigrationFlag {
  /** ISO timestamp of when migration was completed */
  timestamp: string;
  /** Number of plants that were migrated */
  plantCount: number;
}
