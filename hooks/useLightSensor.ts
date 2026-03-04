/**
 * useLightSensor Hook
 *
 * React hook for consuming ambient light sensor data with auto-cleanup.
 * Abstracts the lightMeterService into a clean React interface with proper
 * lifecycle management, platform detection, and error handling.
 *
 * Features:
 * - Auto-checks sensor availability on mount
 * - Platform detection (skips sensor on iOS, sets status='unavailable')
 * - Auto-cleanup on unmount to prevent memory leaks
 * - Handles rapid start/stop with stable callback refs
 * - Exposes lux, category, status, error, isAvailable, start, stop
 *
 * @module hooks/useLightSensor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  checkLightSensorAvailability,
  startLightReading,
  stopLightReading,
} from '@/services/lightMeterService';
import {
  getLightCategory,
  type LuxReading,
  type LightCategory,
  type LightSensorStatus,
  type UseLightSensorReturn,
  type UseLightSensorOptions,
} from '@/types/lightMeter';

/**
 * React hook for ambient light sensor
 *
 * @param options - Optional configuration
 * @param options.enabled - Start reading immediately on mount (default: false)
 * @param options.updateInterval - Sensor polling interval in ms (default: 100)
 * @param options.smoothingSamples - Moving average window size (default: 5)
 * @returns UseLightSensorReturn with lux, category, status, error, isAvailable, start, stop
 *
 * @example
 * ```tsx
 * function LightMeter() {
 *   const { lux, category, status, start, stop, isAvailable } = useLightSensor();
 *
 *   if (!isAvailable) return <Text>Light sensor not available</Text>;
 *
 *   return (
 *     <View>
 *       <Text>{lux} lux — {category}</Text>
 *       <Button onPress={start} title="Start" />
 *       <Button onPress={stop} title="Stop" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useLightSensor(options?: UseLightSensorOptions): UseLightSensorReturn {
  const { enabled = false, updateInterval = 100, smoothingSamples = 5 } = options ?? {};

  // Core state
  const [lux, setLux] = useState<number | null>(null);
  const [category, setCategory] = useState<LightCategory>('unknown');
  const [status, setStatus] = useState<LightSensorStatus>('checking');
  const [error, setError] = useState<Error | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  // Ref to track if currently reading (avoids stale closure issues)
  const isReadingRef = useRef(false);

  // Ref to track cleanup function returned by startLightReading
  const cleanupRef = useRef<(() => void) | null>(null);

  // ============================================================================
  // Availability check on mount
  // ============================================================================

  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      // iOS has no native light sensor — skip check entirely
      if (Platform.OS !== 'android') {
        if (!cancelled) {
          setIsAvailable(false);
          setStatus('unavailable');
        }
        return;
      }

      try {
        setStatus('checking');
        const available = await checkLightSensorAvailability();

        if (!cancelled) {
          setIsAvailable(available);
          setStatus(available ? 'available' : 'unavailable');
        }
      } catch (err) {
        if (!cancelled) {
          setIsAvailable(false);
          setStatus('error');
          setError(err instanceof Error ? err : new Error('Failed to check sensor availability'));
        }
      }
    }

    checkAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================================
  // Auto-start when enabled option is true (after availability confirmed)
  // ============================================================================

  useEffect(() => {
    if (enabled && isAvailable && status === 'available') {
      startReading();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isAvailable, status]);

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      // On unmount: stop any active reading
      if (isReadingRef.current) {
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
        stopLightReading();
        isReadingRef.current = false;
      }
    };
  }, []);

  // ============================================================================
  // Reading callback — stable reference via useCallback
  // ============================================================================

  const handleReading = useCallback((reading: LuxReading) => {
    setLux(reading.value);
    setCategory(getLightCategory(reading.value));
  }, []);

  // ============================================================================
  // Public controls
  // ============================================================================

  /**
   * Start reading from sensor.
   * No-op if already reading or sensor unavailable.
   */
  const startReading = useCallback(() => {
    // Guard: skip if not available or already active
    if (!isAvailable || isReadingRef.current) return;

    // Guard: only supported on Android
    if (Platform.OS !== 'android') {
      setStatus('unavailable');
      return;
    }

    try {
      setError(null);
      setStatus('active');
      isReadingRef.current = true;

      const cleanup = startLightReading(handleReading, {
        updateInterval,
        smoothingSamples,
      });

      cleanupRef.current = cleanup;
    } catch (err) {
      isReadingRef.current = false;
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Failed to start light sensor'));
    }
  }, [isAvailable, handleReading, updateInterval, smoothingSamples]);

  /**
   * Stop reading from sensor.
   * No-op if not currently reading.
   */
  const stopReading = useCallback(() => {
    if (!isReadingRef.current) return;

    try {
      // Call the cleanup function returned by startLightReading
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // Also call stopLightReading directly as safety measure
      stopLightReading();

      isReadingRef.current = false;

      // Reset to available (not active)
      setStatus(isAvailable ? 'available' : 'unavailable');
    } catch (err) {
      isReadingRef.current = false;
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Failed to stop light sensor'));
    }
  }, [isAvailable]);

  return {
    lux,
    category,
    status,
    error,
    isAvailable,
    start: startReading,
    stop: stopReading,
  };
}
