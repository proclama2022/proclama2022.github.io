import { usePlantsStore } from '@/stores/plantsStore';
import { getCareInfo } from './careDB';
import { SavedPlant, ComplianceData, WaterEvent } from '@/types';

/**
 * Mark a plant as watered
 * @param plantId - ID of the plant to mark as watered
 * @param notes - Optional notes for this watering event
 * @returns The water event that was created
 */
export async function markAsWatered(plantId: string, notes?: string): Promise<WaterEvent> {
  const plant = usePlantsStore.getState().getPlant(plantId);

  if (!plant) {
    throw new Error(`Plant with ID ${plantId} not found`);
  }

  const waterEvent: WaterEvent = {
    date: new Date().toISOString(),
    notes,
  };

  // Update plant with new water event
  usePlantsStore.getState().updatePlant(plantId, {
    lastWatered: waterEvent.date,
    waterHistory: [...plant.waterHistory, waterEvent],
  });

  return waterEvent;
}

/**
 * Calculate the next watering date for a plant
 * @param plantId - ID of the plant
 * @returns Date object for next watering, or null if no care info available
 */
export function getNextWateringDate(plantId: string): Date | null {
  const plant = usePlantsStore.getState().getPlant(plantId);

  if (!plant || !plant.scientificName) {
    return null;
  }

  const care = getCareInfo(plant.scientificName);

  if (!care) {
    return null;
  }

  // Calculate next date using local timezone
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + care.waterFrequencyDays);

  return nextDate;
}

/**
 * Calculate watering compliance rate over a period
 * @param plantId - ID of the plant
 * @param days - Number of days to look back (default: 7)
 * @returns Compliance data with rate, counts, and streak
 */
export function getComplianceRate(plantId: string, days: number = 7): ComplianceData {
  const plant = usePlantsStore.getState().getPlant(plantId);

  if (!plant || !plant.scientificName) {
    return { rate: 0, watered: 0, expected: 0, streak: 0 };
  }

  const care = getCareInfo(plant.scientificName);

  if (!care) {
    return { rate: 0, watered: 0, expected: 0, streak: 0 };
  }

  // Calculate expected waterings
  const expectedWaterings = Math.floor(days / care.waterFrequencyDays);

  if (expectedWaterings === 0) {
    return { rate: 100, watered: 0, expected: 0, streak: 0 };
  }

  // Count actual waterings in the last N days (local timezone)
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const actualWaterings = plant.waterHistory.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= cutoffDate && eventDate <= now;
  }).length;

  // Calculate compliance rate (capped at 100%)
  const rate = Math.min(100, Math.round((actualWaterings / expectedWaterings) * 100));

  // Get streak (calculated separately)
  const streak = getWateringStreak(plantId);

  return {
    rate,
    watered: actualWaterings,
    expected: expectedWaterings,
    streak,
  };
}

/**
 * Calculate current watering streak
 * @param plantId - ID of the plant
 * @returns Number of consecutive days in the watering streak
 */
export function getWateringStreak(plantId: string): number {
  const plant = usePlantsStore.getState().getPlant(plantId);

  if (!plant || !plant.scientificName || plant.waterHistory.length === 0) {
    return 0;
  }

  const care = getCareInfo(plant.scientificName);

  if (!care) {
    return 0;
  }

  // Sort water history by date descending (most recent first)
  const sortedHistory = [...plant.waterHistory].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  let streak = 0;
  const maxAllowedGap = care.waterFrequencyDays * 1.5; // 50% margin per research

  // Iterate from most recent, counting consecutive events within allowed gap
  for (let i = 0; i < sortedHistory.length; i++) {
    const currentDate = new Date(sortedHistory[i].date);

    if (i === 0) {
      streak = 1;
      continue;
    }

    const prevDate = new Date(sortedHistory[i - 1].date);
    const daysDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff <= maxAllowedGap) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Generate marked dates for calendar visualization
 * @param plant - The plant object
 * @returns Object with date strings as keys and dot colors as values
 */
export function generateMarkedDates(plant: SavedPlant): Record<string, any> {
  const markedDates: Record<string, any> = {};
  const today = new Date();

  // Generate last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if there's a water event for this date
    const waterEvent = plant.waterHistory.find((event) => {
      const eventDate = new Date(event.date);
      return eventDate.toISOString().split('T')[0] === dateStr;
    });

    if (waterEvent) {
      // Watered - green dot
      markedDates[dateStr] = {
        dots: [{ color: '#2e7d32' }],
      };
    } else if (date <= today) {
      // Past date, no water - red dot (missed)
      markedDates[dateStr] = {
        dots: [{ color: '#c62828' }],
      };
    } else {
      // Future date - gray dot
      markedDates[dateStr] = {
        dots: [{ color: '#e0e0e0' }],
      };
    }
  }

  // Highlight current day with light green background
  const todayStr = today.toISOString().split('T')[0];
  if (markedDates[todayStr]) {
    markedDates[todayStr] = {
      ...markedDates[todayStr],
      selected: true,
      selectedColor: '#e8f5e9',
    };
  } else {
    markedDates[todayStr] = {
      selected: true,
      selectedColor: '#e8f5e9',
      dots: [{ color: '#e0e0e0' }],
    };
  }

  return markedDates;
}
