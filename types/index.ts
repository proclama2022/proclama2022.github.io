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
  addedDate: string;
  lastWatered?: string;
  nextWateringDate?: string;
  scheduledNotificationId?: string;
  waterHistory: WaterEvent[];
  notes?: string;
}

export interface WaterEvent {
  date: string;
  notes?: string;
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
