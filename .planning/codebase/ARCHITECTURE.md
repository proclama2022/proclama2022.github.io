# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Expo Router-based multi-platform mobile application with service-oriented integration patterns

**Key Characteristics:**
- File-based routing with Expo Router v6
- Cross-platform support (iOS, Android, Web) via React Native and Expo
- Service-based abstractions for API integration, caching, and rate limiting
- Type-safe patterns with TypeScript strict mode
- Theme-aware component system with light/dark mode support

## Layers

**Presentation Layer (UI/Components):**
- Purpose: Render user interfaces with theme support and platform-specific adaptations
- Location: `app/`, `components/`
- Contains: Screen components, layout structures, themed UI components, navigation configuration
- Depends on: React Native, Expo Router, constants (Colors), hooks (useColorScheme, useClientOnlyValue)
- Used by: Entry points; orchestrates navigation and theme application

**Routing Layer:**
- Purpose: Define application navigation and screen hierarchy
- Location: `app/`, `app/(tabs)/`, `app/_layout.tsx`, `app/modal.tsx`
- Contains: Root layout, tab layout, screen routes, error boundaries
- Depends on: Expo Router, React Navigation, presentation components
- Used by: Expo runtime; initializes application structure

**Service Layer:**
- Purpose: Encapsulate external integrations and business logic
- Location: `services/`
- Contains: PlantNet API integration, result caching, rate limiting
- Depends on: AsyncStorage, external APIs (PlantNet), type definitions
- Used by: Screens and components for data operations

**Type/Data Layer:**
- Purpose: Define domain models and interfaces
- Location: `types/index.ts`
- Contains: PlantNet response types, plant data models, cache structures, rate limit state
- Depends on: Nothing (pure type definitions)
- Used by: Services, components, screens

**Constants Layer:**
- Purpose: Store application-wide configuration values
- Location: `constants/Colors.ts`
- Contains: Theme color palettes for light/dark modes
- Depends on: Nothing
- Used by: Theme components, layout configurations

## Data Flow

**Plant Identification Flow:**

1. User initiates identification from screen component (`app/(tabs)/index.tsx` or similar)
2. Screen calls `identifyPlant()` from `services/plantnet.ts`
3. Service checks rate limit via `services/rateLimiter.ts` -> `canIdentify()`
4. Service checks cache via `services/cache.ts` -> `getCachedResult(imageUri)`
5. If not cached and allowed, service makes API request to PlantNet API with image via fetch
6. Service saves result to cache via `setCachedResult(imageUri, result)`
7. Service increments rate limit counter via `incrementIdentificationCount()`
8. Screen receives response and updates local state, renders results to user

**State Management:**

- Local component state: React hooks manage UI state within screens
- Persistent state: AsyncStorage stores cache entries and rate limit state via services
- Theme state: Derived from system preferences via `useColorScheme()` hook
- Navigation state: Managed by Expo Router based on file structure

## Key Abstractions

**PlantNet API Service:**
- Purpose: Abstract all PlantNet API interactions and error handling
- Examples: `services/plantnet.ts`
- Pattern: Function-based exports (`identifyPlant()`, `getBestMatch()`, `isGoodConfidence()`, `formatScientificName()`)
- Returns typed result objects: `IdentifyPlantResult` with success/error handling

**Cache Service:**
- Purpose: Manage image identification result caching with expiry
- Examples: `services/cache.ts`
- Pattern: Hash-based key generation with timestamp-tracked entries
- Functions: `getCachedResult()`, `setCachedResult()`, `clearCache()`, `getCacheSize()`
- Expiry: 7 days (604,800,000 ms)

**Rate Limiter Service:**
- Purpose: Enforce daily identification limits (5 per day)
- Examples: `services/rateLimiter.ts`
- Pattern: Date-based state tracking with daily reset
- Functions: `canIdentify()`, `incrementIdentificationCount()`, `getRateLimitState()`
- Constants: `DAILY_LIMIT = 5`

**Themed Components:**
- Purpose: Provide UI components with automatic light/dark mode switching
- Examples: `components/Themed.tsx` (Text, View), `components/useColorScheme.ts`
- Pattern: Props-based color injection with theme-aware hooks
- Supports: Custom color props (lightColor, darkColor) that override theme defaults

## Entry Points

**Root Layout (`app/_layout.tsx`):**
- Location: `app/_layout.tsx`
- Triggers: Application startup via Expo Router
- Responsibilities: Font loading, splash screen management, theme provider setup, error boundary configuration

**Tab Layout (`app/(tabs)/_layout.tsx`):**
- Location: `app/(tabs)/_layout.tsx`
- Triggers: After root layout initializes (configured as initial route)
- Responsibilities: Tab bar configuration, screen registration, icon management

**Tab Screens:**
- Location: `app/(tabs)/index.tsx`, `app/(tabs)/two.tsx`
- Triggers: User navigation or initial load
- Responsibilities: Render tab-specific content

**Modal Screen (`app/modal.tsx`):**
- Location: `app/modal.tsx`
- Triggers: Navigation via Link or programmatic push
- Responsibilities: Present modal overlay with content

## Error Handling

**Strategy:** Result-based error handling with typed response objects

**Patterns:**

- **API Errors:** Services return `IdentifyPlantResult { success: boolean; data?: PlantNetResponse; error?: string }`
- **Missing Configuration:** PlantNet service validates API key and returns error if missing
- **Network Errors:** Caught as exceptions and returned as error messages
- **Cache/Storage Errors:** Logged to console, gracefully degrade (return null/0 defaults)
- **Parse Errors:** Try-catch blocks in JSON parsing; use defaults on failure

## Cross-Cutting Concerns

**Logging:** Console-based logging for cache and storage errors via `console.error()`

**Validation:**
- API key validation in `plantnet.ts` before API calls
- Image URI validation (filename extraction and MIME type detection)
- Response validation (confidence score thresholds checked via `isGoodConfidence()`)

**Authentication:**
- API key passed as query parameter to PlantNet API
- Key loaded from `Constants.expoConfig?.extra?.plantnetApiKey` or `process.env.EXPO_PUBLIC_PLANTNET_API_KEY`
- No user authentication (public API key based)

**Caching Strategy:**
- Automatic on API success
- 7-day expiry with timestamp tracking
- Hash-based keys prevent collisions
- Manual clear via `clearCache()` function

---

*Architecture analysis: 2026-02-19*
