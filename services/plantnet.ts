import Constants from 'expo-constants';
import * as ImageManipulator from 'expo-image-manipulator';
import { PlantNetResponse, OrganType } from '@/types';
import { awardPlantIdentifiedEvent } from './gamificationService';

// Cloudflare Workers proxy URL for production (hides API key from client bundle)
// Development still uses direct API with EXPO_PUBLIC_PLANTNET_API_KEY
const PROXY_URL = __DEV__
  ? process.env.EXPO_PUBLIC_PLANTNET_API_URL || 'https://my-api.plantnet.org/v2/identify/all'
  : 'https://plantid-api-proxy.YOUR_SUBDOMAIN.workers.dev';

/*
 * CLOUDFLARE WORKERS SETUP REQUIRED FOR PRODUCTION:
 *
 * Before deploying to production, you must deploy a Cloudflare Workers proxy:
 *
 * 1. Install Wrangler CLI:
 *    npm install -g wrangler
 *
 * 2. Create a new worker:
 *    mkdir plantid-api-proxy && cd plantid-api-proxy
 *    wrangler init
 *
 * 3. Create worker.js with proxy logic:
 *
 *    export default {
 *      async fetch(request, env, ctx) {
 *        // Only allow POST requests
 *        if (request.method !== 'POST') {
 *          return new Response('Method not allowed', { status: 405 });
 *        }
 *
 *        // Get API key from environment variable
 *        const apiKey = env.PLANTNET_API_KEY;
 *        if (!apiKey) {
 *          return new Response('API key not configured', { status: 500 });
 *        }
 *
 *        // Forward request to PlantNet API
 *        const url = new URL(request.url);
 *        const plantNetUrl = `https://my-api.plantnet.org/v2/identify/all`;
 *
 *        // Build PlantNet URL with API key
 *        const targetUrl = new URL(plantNetUrl);
 *        targetUrl.searchParams.append('api-key', apiKey);
 *        targetUrl.searchParams.append('lang', url.searchParams.get('lang') || 'en');
 *        targetUrl.searchParams.append('includeRelatedImages', 'true');
 *
 *        // Clone request and forward body
 *        const modifiedRequest = new Request(targetUrl, {
 *          method: 'POST',
 *          headers: request.headers,
 *          body: request.body,
 *        });
 *
 *        // Forward response
 *        return fetch(modifiedRequest);
 *      },
 *    };
 *
 * 4. Add to wrangler.toml:
 *    [vars]
 *    PLANTNET_API_KEY = "your-actual-api-key"
 *
 * 5. Deploy worker:
 *    wrangler deploy
 *
 * 6. Update PROXY_URL above with your deployed worker URL
 */

export interface IdentifyPlantParams {
  imageUri: string;
  organ?: OrganType;
  lang?: string;
}

export interface IdentifyPlantResult {
  success: boolean;
  data?: PlantNetResponse;
  error?: string;
  /** Unique ID for this identification, can be used for gamification */
  identificationId?: string;
}

/**
 * Identify a plant using the PlantNet API
 *
 * SECURITY NOTE:
 * - Development: Uses EXPO_PUBLIC_PLANTNET_API_KEY from .env (direct API call)
 * - Production: Uses Cloudflare Workers proxy (API key hidden on server)
 *
 * The proxy prevents API key exposure in the client bundle (APK/IPA).
 *
 * @param params - Image URI, organ type, and language
 * @returns PlantNet response with identification results
 */
export async function identifyPlant(params: IdentifyPlantParams): Promise<IdentifyPlantResult> {
  const { imageUri, organ = 'auto', lang = 'en' } = params;

  if (!__DEV__ && PROXY_URL.includes('YOUR_SUBDOMAIN')) {
    return {
      success: false,
      error: 'Plant identification service is not configured for production.',
    };
  }

  // In development, check for API key
  // In production, proxy handles the API key
  if (__DEV__) {
    const apiKey = Constants.expoConfig?.extra?.plantnetApiKey || process.env.EXPO_PUBLIC_PLANTNET_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      return {
        success: false,
        error: 'API key not configured. Please set EXPO_PUBLIC_PLANTNET_API_KEY in .env',
      };
    }
  }

  try {
    // Convert to JPEG — PlantNet only accepts JPEG (simulator returns PNG, iPhone may return HEIC)
    const converted = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );

    const formData = new FormData();
    formData.append('images', {
      uri: converted.uri,
      name: 'plant.jpg',
      type: 'image/jpeg',
    } as any);

    // Append organ if not auto
    if (organ !== 'auto') {
      formData.append('organs', organ);
    }

    // Build URL with query params
    const url = new URL(PROXY_URL);
    url.searchParams.append('lang', lang);
    // includeRelatedImages not available on free tier

    // In development, add API key directly (production proxy handles this server-side)
    if (__DEV__) {
      const apiKey = Constants.expoConfig?.extra?.plantnetApiKey || process.env.EXPO_PUBLIC_PLANTNET_API_KEY;
      if (apiKey) url.searchParams.append('api-key', apiKey);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // Use default error message
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: PlantNetResponse = await response.json();

    // Generate unique identification ID for gamification tracking
    const identificationId = `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Trigger gamification event (fire-and-forget)
    // Only trigger if there are actual results (successful identification)
    if (data.results && data.results.length > 0) {
      triggerIdentificationGamification(identificationId, data);
    }

    return {
      success: true,
      data,
      identificationId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extract string from PlantNet name field (API returns objects, not strings)
 */
export function extractName(field: { scientificNameWithoutAuthor?: string; scientificName?: string } | string | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.scientificNameWithoutAuthor || field.scientificName || '';
}

/**
 * Get the best match from PlantNet response
 */
export function getBestMatch(response: PlantNetResponse) {
  return response.bestMatch || response.results?.[0] || null;
}

/**
 * Check if the identification has good confidence
 */
export function isGoodConfidence(score: number, threshold = 0.5): boolean {
  return score >= threshold;
}

/**
 * Format scientific name with author
 */
export function formatScientificName(result: {
  species: { scientificName: string; scientificNameAuthorship?: string };
}): string {
  const { scientificName, scientificNameAuthorship } = result.species;
  return scientificNameAuthorship
    ? `${scientificName} ${scientificNameAuthorship}`
    : scientificName;
}

/**
 * Check if the PlantNet result indicates a diseased plant
 * Looks for health-related keywords in common names and metadata
 */
function detectDisease(result: any): boolean {
  if (!result) return false;

  const diseaseKeywords = [
    'disease', 'diseased', 'fungal', 'bacterial', 'virus', 'viral',
    'pest', 'infected', 'blight', 'rot', 'mildew', 'rust',
    'leaf spot', 'canker', 'wilt', 'mosaic', 'scab'
  ];

  // Check common names
  const commonNames = result.species?.commonNames || [];
  for (const name of commonNames) {
    const nameStr = String(name).toLowerCase();
    if (diseaseKeywords.some(keyword => nameStr.includes(keyword))) {
      return true;
    }
  }

  // Check remaining results for disease indicators
  if (Array.isArray(result.results)) {
    for (const res of result.results) {
      const names = res.species?.commonNames || [];
      for (const name of names) {
        const nameStr = String(name).toLowerCase();
        if (diseaseKeywords.some(keyword => nameStr.includes(keyword))) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Trigger gamification event for plant identification
 * Fire-and-forget - does not block the identification flow
 */
export function triggerIdentificationGamification(
  plantId: string,
  plantNetResponse: PlantNetResponse
): void {
  // Don't await - gamification is secondary to the identification
  const hasDisease = detectDisease(plantNetResponse);
  awardPlantIdentifiedEvent(plantId, hasDisease).catch((err) => {
    console.warn('[plantnet] Failed to award plant identification event:', err);
  });
}
