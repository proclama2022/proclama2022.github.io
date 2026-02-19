# External Integrations

**Analysis Date:** 2026-02-19

## APIs & External Services

**Plant Identification:**
- **PlantNet** - Primary service for plant species identification from images
  - SDK/Client: Custom HTTP client (fetch-based)
  - API Endpoint: `https://my-api.plantnet.org/v2/identify/all`
  - Auth: API key via `EXPO_PUBLIC_PLANTNET_API_KEY` environment variable
  - Implementation: `/Users/martha2022/Documents/Claude code/Plantid/services/plantnet.ts`
  - Usage:
    - `identifyPlant()` - Main function to identify plant from image URI
    - Supports organ-specific identification (leaf, flower, fruit, bark, auto)
    - Supports multiple languages via `lang` parameter (default: 'en')
    - Returns confidence scores, scientific names, related images, and GBIF data
    - Handles multipart/form-data uploads for image transmission

**GBIF Integration:**
- Indirect integration via PlantNet API
- Provides taxonomic data and species identifiers
- Data structure: `GBIFInfo` in response contains `gbifId`

## Data Storage

**Local Storage Only:**
- No backend database or server
- All data persisted locally on device via AsyncStorage

**In-Device Persistence:**
- **AsyncStorage** - React Native local storage
  - Cache storage: 7-day TTL for API responses
  - Rate limiting state: Daily identification count tracking
  - Plant collection storage: User's saved plants (implied by types)
  - Location: `/Users/martha2022/Documents/Claude code/Plantid/services/cache.ts` and `/Users/martha2022/Documents/Claude code/Plantid/services/rateLimiter.ts`

**Cache Implementation:**
- Simple hash-based key generation (`hashString()` function)
- Cache key format: `@plantid_cache_{hash}`
- Cache entries expire after 7 days (604,800,000 ms)
- Automatic cleanup of expired entries on access

**Rate Limiting Storage:**
- Key: `@plantid_rate_limit`
- Tracks daily identification count (limit: 5 per day)
- Resets automatically at midnight (date-based tracking)
- Implementation details in `/Users/martha2022/Documents/Claude code/Plantid/services/rateLimiter.ts`

## Authentication & Identity

**Auth Provider:**
- **None** - App currently has no user authentication
- Device-local operation only
- No user accounts or sign-in

## Device & Native Features

**Camera Integration:**
- **expo-camera** (17.0.10)
  - Provides access to device camera
  - Used for real-time plant photo capture

**Image Management:**
- **expo-image-picker** (17.0.10)
  - Allows users to select existing photos from device gallery
  - Alternative to real-time camera capture

**Device Storage:**
- Photo URI handling via image picker/camera APIs
- Images referenced by local URIs in plant collection

## Monitoring & Observability

**Error Tracking:**
- None detected - No integration with Sentry, Bugsnag, or similar

**Logging:**
- Console-based logging only
- Error logs via `console.error()` in service functions
- Location: Error logging in `/Users/martha2022/Documents/Claude code/Plantid/services/cache.ts`, `/Users/martha2022/Documents/Claude code/Plantid/services/rateLimiter.ts`, and `/Users/martha2022/Documents/Claude code/Plantid/services/plantnet.ts`

## CI/CD & Deployment

**Hosting:**
- **Expo** - Primary build and deployment platform
  - EAS (Expo Application Services) for native builds
  - Web output to static hosting (configured for `dist/` output)

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or equivalent

**Build Process:**
- Expo CLI commands:
  - `npm start` - Start development server
  - `npm run android` - Build and run on Android
  - `npm run ios` - Build and run on iOS
  - `npm run web` - Build for web platform

## Environment Configuration

**Required Environment Variables:**
- `EXPO_PUBLIC_PLANTNET_API_KEY` - PlantNet API authentication key
  - Loaded via `process.env.EXPO_PUBLIC_PLANTNET_API_KEY`
  - Can also be specified in `app.json` under `expo.extra.plantnetApiKey`
  - Must be set before plant identification features work
  - Validated in `/Users/martha2022/Documents/Claude code/Plantid/services/plantnet.ts` lines 26-33

**Secrets Location:**
- `.env` file (not committed to version control)
- Alternatively via `app.json` `extra` configuration
- Validated against placeholder value `'your_api_key_here'` to prevent accidental deployment

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected - App only makes one-directional HTTP requests to PlantNet API

## Data Structures & Response Format

**PlantNet API Response:**
- Structured in types at `/Users/martha2022/Documents/Claude code/Plantid/types/index.ts`
- Response includes:
  - Query parameters (project, images, organs)
  - Language preference
  - Best match result with confidence score
  - Full results array with ranked matches
  - Remaining API request quota for the day
  - Related images with attribution
  - GBIF taxonomic identifiers

**Rate Limiting Response:**
- API includes `remainingIdentificationRequests` field
- Client-side rate limit: 5 identifications per day
- Prevents excessive API calls

## Third-Party Services Summary

| Service | Type | Purpose | Required | Status |
|---------|------|---------|----------|--------|
| PlantNet API | REST API | Plant species identification | Yes | Active |
| GBIF | Data Provider | Taxonomic data (via PlantNet) | Indirect | Active |
| Expo | Platform | Build and deployment | Yes | Active |
| AsyncStorage | Storage | Local device storage | Yes | Active |

---

*Integration audit: 2026-02-19*
