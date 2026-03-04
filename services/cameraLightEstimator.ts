/**
 * Camera-based Light Estimator Service
 *
 * Provides lux estimation for iOS devices using camera frame brightness analysis.
 * iOS does not expose ambient light sensor to third-party apps, so we use
 * camera preview brightness as a proxy with calibration support.
 *
 * @module services/cameraLightEstimator
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LuxReading,
  LightCategory,
  getLightCategory,
} from '../types/lightMeter';

// Storage key for calibration data
const CALIBRATION_KEY = '@light_meter_calibration';

// Default update interval (2 FPS for battery efficiency)
const DEFAULT_UPDATE_INTERVAL = 500; // ms

// Maximum active time before auto-stop (30 seconds)
const MAX_ACTIVE_TIME = 30000; // ms

/**
 * Calibration data structure
 */
export interface CalibrationData {
  /** Multiplier offset applied to readings */
  offset: number;
  /** When calibration was performed */
  timestamp: number;
  /** Reference lux value used for calibration */
  referenceLux: number;
}

/**
 * Result from initializing the camera estimator
 */
export interface InitializeResult {
  /** Whether camera permission was granted */
  hasPermission: boolean;
  /** Current calibration data if available */
  calibration: CalibrationData | null;
  /** Error message if initialization failed */
  error?: string;
}

/**
 * Luminance calculation result
 */
interface LuminanceResult {
  /** Average luminance value (0-255) */
  averageLuminance: number;
  /** Sample size used for calculation */
  sampleSize: number;
}

/**
 * Load saved calibration from AsyncStorage
 *
 * @returns Calibration data or null if not found
 */
async function loadCalibration(): Promise<CalibrationData | null> {
  try {
    const stored = await AsyncStorage.getItem(CALIBRATION_KEY);
    if (stored) {
      return JSON.parse(stored) as CalibrationData;
    }
  } catch (error) {
    console.warn('[CameraLightEstimator] Failed to load calibration:', error);
  }
  return null;
}

/**
 * Save calibration data to AsyncStorage
 *
 * @param calibration - Calibration data to save
 */
async function saveCalibration(calibration: CalibrationData): Promise<void> {
  try {
    await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibration));
  } catch (error) {
    console.warn('[CameraLightEstimator] Failed to save calibration:', error);
    throw new Error('Failed to save calibration data');
  }
}

/**
 * Convert luminance to estimated lux using empirical mapping
 *
 * The mapping is non-linear based on research findings:
 * - Low light (<50): lux ≈ luminance * 2
 * - Medium light (50-150): lux ≈ luminance * 4
 * - Bright light (>150): lux ≈ luminance * 8
 *
 * @param luminance - Average luminance value (0-255)
 * @returns Estimated lux value
 */
function luminanceToLux(luminance: number): number {
  if (luminance < 50) {
    return luminance * 2;
  } else if (luminance < 150) {
    return luminance * 4;
  } else {
    return luminance * 8;
  }
}

/**
 * Calculate average luminance from pixel data
 *
 * Samples pixels at intervals for performance rather than processing every pixel.
 * Calculates average brightness using (R+G+B)/3 per pixel.
 *
 * @param pixelData - RGBA pixel data (Uint8Array)
 * @param sampleRate - Sample every Nth pixel (default: 100 for performance)
 * @returns Normalized luminance value (0-255) and sample size
 */
export function calculateAverageLuminance(
  pixelData: Uint8Array,
  sampleRate: number = 100
): LuminanceResult {
  let totalBrightness = 0;
  let sampleCount = 0;

  // Process every Nth pixel (RGBA = 4 bytes per pixel)
  for (let i = 0; i < pixelData.length; i += 4 * sampleRate) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];

    // Calculate perceived brightness (average of RGB)
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    sampleCount++;
  }

  const averageLuminance = sampleCount > 0 ? totalBrightness / sampleCount : 0;

  return {
    averageLuminance,
    sampleSize: sampleCount,
  };
}

/**
 * Initialize the camera-based light estimator
 *
 * Loads any saved calibration data and returns initialization status.
 * Note: Camera permissions are handled by the CameraPreview component.
 *
 * @returns Initialization result with permission status and calibration
 */
export async function initializeCameraEstimator(): Promise<InitializeResult> {
  try {
    const calibration = await loadCalibration();

    return {
      hasPermission: true, // Actual permission check done in CameraPreview
      calibration,
    };
  } catch (error) {
    console.error('[CameraLightEstimator] Initialization error:', error);
    return {
      hasPermission: false,
      calibration: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Estimate lux from camera frame data
 *
 * Calculates luminance from pixel data, applies calibration offset if available,
 * and returns a LuxReading with appropriate confidence level.
 *
 * @param frameData - RGBA pixel data from camera frame
 * @param calibration - Optional calibration data to apply
 * @returns LuxReading with source='camera' and confidence=0.7
 */
export function estimateLuxFromFrame(
  frameData: Uint8Array,
  calibration: CalibrationData | null = null
): LuxReading {
  const { averageLuminance } = calculateAverageLuminance(frameData);

  // Convert luminance to base lux estimate
  const baseLux = luminanceToLux(averageLuminance);

  // Apply calibration offset if available
  const finalLux = calibration ? baseLux * calibration.offset : baseLux;

  return {
    value: Math.round(finalLux),
    timestamp: Date.now(),
    source: 'camera',
    confidence: 0.7, // Camera estimates have ±30% accuracy
  };
}

/**
 * Calibrate the camera estimator with a known reference point
 *
 * User places white paper in view and provides the actual lux value
 * for the current environment. Calculates and stores the offset multiplier.
 *
 * @param measuredLuminance - Current luminance reading from camera
 * @param actualLux - Known/reference lux value for this environment
 * @returns Success status and calculated offset
 */
export async function calibrateWithReference(
  measuredLuminance: number,
  actualLux: number
): Promise<{ success: boolean; offset: number; error?: string }> {
  try {
    if (measuredLuminance <= 0) {
      return {
        success: false,
        offset: 1,
        error: 'Invalid luminance reading (must be > 0)',
      };
    }

    if (actualLux <= 0) {
      return {
        success: false,
        offset: 1,
        error: 'Invalid reference lux value (must be > 0)',
      };
    }

    // Calculate what the uncalibrated estimate would be
    const estimatedLux = luminanceToLux(measuredLuminance);

    // Calculate offset: how much we need to multiply estimates by
    const offset = actualLux / estimatedLux;

    // Store calibration data
    const calibration: CalibrationData = {
      offset,
      timestamp: Date.now(),
      referenceLux: actualLux,
    };

    await saveCalibration(calibration);

    return {
      success: true,
      offset,
    };
  } catch (error) {
    console.error('[CameraLightEstimator] Calibration error:', error);
    return {
      success: false,
      offset: 1,
      error: error instanceof Error ? error.message : 'Calibration failed',
    };
  }
}

/**
 * Reset calibration data
 *
 * Removes saved calibration from AsyncStorage.
 *
 * @returns Success status
 */
export async function resetCalibration(): Promise<{ success: boolean; error?: string }> {
  try {
    await AsyncStorage.removeItem(CALIBRATION_KEY);
    return { success: true };
  } catch (error) {
    console.warn('[CameraLightEstimator] Failed to reset calibration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset calibration',
    };
  }
}

/**
 * Get current calibration status
 *
 * @returns Current calibration data or null
 */
export async function getCalibrationStatus(): Promise<CalibrationData | null> {
  return loadCalibration();
}

/**
 * Check if device has been calibrated
 *
 * @returns True if calibration data exists
 */
export async function isCalibrated(): Promise<boolean> {
  const calibration = await loadCalibration();
  return calibration !== null;
}

// Export constants for external use
export { CALIBRATION_KEY, DEFAULT_UPDATE_INTERVAL, MAX_ACTIVE_TIME };
