import Constants from 'expo-constants';
import { PlantNetResponse, OrganType } from '@/types';

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
    // Create form data for image upload
    const formData = new FormData();

    // Get the filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append the image
    formData.append('images', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    // Append organ if not auto
    if (organ !== 'auto') {
      formData.append('organs', organ);
    }

    // Build URL with query params
    // Note: Production proxy adds API key, so we don't include it here
    const url = new URL(PROXY_URL);
    url.searchParams.append('lang', lang);
    url.searchParams.append('includeRelatedImages', 'true');

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

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
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
