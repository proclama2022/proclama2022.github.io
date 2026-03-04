/**
 * Light Meter Types
 *
 * Type definitions for the light sensor feature including lux readings,
 * light categories, and sensor status tracking.
 */

/**
 * Source of the light reading
 */
export type LightReadingSource = 'sensor' | 'camera' | 'simulated';

/**
 * A single lux reading with metadata
 */
export interface LuxReading {
  /** Raw lux value (0+) */
  value: number;
  /** Timestamp when reading was taken (epoch ms) */
  timestamp: number;
  /** Source of the reading */
  source: LightReadingSource;
  /** Confidence level 0-1 based on source quality */
  confidence: number;
}

/**
 * Light category based on lux ranges
 * Ranges:
 * - LOW: 500 - 2,500 lux
 * - MEDIUM: 2,500 - 10,000 lux
 * - BRIGHT_INDIRECT: 10,000 - 20,000 lux
 * - DIRECT_SUN: 20,000+ lux
 */
export type LightCategory =
  | 'low'
  | 'medium'
  | 'bright_indirect'
  | 'direct_sun'
  | 'unknown';

/**
 * Sensor operational status
 */
export type LightSensorStatus =
  | 'checking'      // Initializing, checking availability
  | 'available'     // Sensor available but not active
  | 'unavailable'   // No sensor available on device
  | 'active'        // Currently reading
  | 'error';        // Error state

/**
 * Return type for useLightSensor hook
 */
export interface UseLightSensorReturn {
  /** Current smoothed lux reading or null if not available */
  lux: number | null;
  /** Categorized light level */
  category: LightCategory;
  /** Current sensor status */
  status: LightSensorStatus;
  /** Error object if something went wrong */
  error: Error | null;
  /** Whether sensor is available on this device */
  isAvailable: boolean;
  /** Start reading from sensor */
  start: () => void;
  /** Stop reading from sensor */
  stop: () => void;
}

/**
 * Options for useLightSensor hook
 */
export interface UseLightSensorOptions {
  /** Whether to start reading immediately */
  enabled?: boolean;
  /** Update interval in milliseconds (default: 100ms) */
  updateInterval?: number;
  /** Number of samples for moving average smoothing (default: 5) */
  smoothingSamples?: number;
}

/**
 * Configuration options for starting light readings
 */
export interface StartLightReadingOptions {
  /** Update interval in milliseconds (default: 100ms) */
  updateInterval?: number;
  /** Number of samples for moving average smoothing (default: 5) */
  smoothingSamples?: number;
}

/**
 * Get light category from lux value
 *
 * @param lux - Lux value to categorize
 * @returns LightCategory based on defined ranges
 */
export function getLightCategory(lux: number): LightCategory {
  if (lux < 500) {
    return 'unknown';
  } else if (lux < 2500) {
    return 'low';
  } else if (lux < 10000) {
    return 'medium';
  } else if (lux < 20000) {
    return 'bright_indirect';
  } else {
    return 'direct_sun';
  }
}

/**
 * Format lux value for display
 * - Values < 1000: show full number (e.g., "1,240")
 * - Values >= 1000: show with K suffix (e.g., "12.5K")
 *
 * @param lux - Lux value to format
 * @returns Formatted string
 */
export function formatLuxValue(lux: number): string {
  if (lux < 1000) {
    return Math.round(lux).toLocaleString();
  } else if (lux < 10000) {
    return `${(lux / 1000).toFixed(1)}K`;
  } else {
    return `${Math.round(lux / 1000)}K`;
  }
}

/**
 * Get human-readable label for light category
 *
 * @param category - Light category
 * @returns Display label
 */
export function getLightCategoryLabel(category: LightCategory): string {
  const labels: Record<LightCategory, string> = {
    low: 'Low Light',
    medium: 'Medium Light',
    bright_indirect: 'Bright Indirect',
    direct_sun: 'Direct Sun',
    unknown: 'Unknown',
  };
  return labels[category];
}

/**
 * Get recommended plants text for light category
 *
 * @param category - Light category
 * @returns Plant recommendation text
 */
export function getLightCategoryPlants(category: LightCategory): string {
  const plants: Record<LightCategory, string> = {
    low: 'Snake Plant, ZZ Plant, Pothos',
    medium: 'Monstera, Philodendron, Peace Lily',
    bright_indirect: 'Fiddle Leaf Fig, Bird of Paradise',
    direct_sun: 'Cacti, Succulents, Citrus',
    unknown: 'Check your plant care guide',
  };
  return plants[category];
}
