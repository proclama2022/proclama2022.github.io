# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `StyledText.tsx`, `ExternalLink.tsx`, `Themed.tsx`)
- Utilities and services: camelCase (e.g., `plantnet.ts`, `cache.ts`, `rateLimiter.ts`)
- Hooks: camelCase prefixed with `use` (e.g., `useColorScheme.ts`, `useClientOnlyValue.ts`)
- Platform-specific files: use `.web` and `.native` suffixes for platform variants (e.g., `useColorScheme.web.ts`, `useClientOnlyValue.web.ts`)
- Test files: Use `.test.` or adjacent `__tests__` directory with descriptive names (e.g., `components/__tests__/StyledText-test.js`)
- Directory names: kebab-case for route directories (e.g., `(tabs)`, `+html.tsx`)

**Functions:**
- Use camelCase consistently across all functions
- Export named functions for services and utilities
- Example patterns: `identifyPlant()`, `getCachedResult()`, `canIdentify()`, `incrementIdentificationCount()`

**Variables:**
- camelCase for all local variables and constants
- UPPER_SNAKE_CASE for module-level constants (e.g., `CACHE_PREFIX`, `DAILY_LIMIT`, `PLANTNET_API_URL`)
- Boolean variables often include prefixes like `loaded`, `allowed`, or `is` (e.g., `loaded`, `allowed`, `isGoodConfidence()`)

**Types:**
- PascalCase for all types and interfaces
- Suffix interfaces with descriptive names (e.g., `PlantNetResult`, `PlantSpecies`, `IdentifyPlantParams`)
- Type unions use PascalCase (e.g., `OrganType = 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto'`)

## Code Style

**Formatting:**
- No explicit Prettier configuration detected; standard formatting follows Expo/React Native defaults
- Consistent use of 2-space indentation throughout codebase
- Semicolons used throughout (TypeScript standard)
- Single quotes not enforced; files use single quotes where applicable

**Linting:**
- No ESLint configuration found in root directory
- TypeScript strict mode enabled in `tsconfig.json` with `"strict": true`
- Project uses `@/` path alias resolving to project root
- Type safety is prioritized - JSDoc and TSDoc comments used for public APIs

## Import Organization

**Order:**
1. External libraries (React, Expo, React Native)
2. Type imports and interfaces
3. Local absolute imports using `@/` alias
4. Relative imports (rare in this codebase)

**Examples from codebase:**
```typescript
// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

// services/plantnet.ts
import Constants from 'expo-constants';
import { PlantNetResponse, OrganType } from '@/types';
```

**Path Aliases:**
- `@/*` resolves to project root - used for all local absolute imports

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations and JSON parsing
- Error objects checked with `instanceof Error` pattern before accessing `message` property
- Fallback error messages provided when error is not an Error instance
- Services return structured success/error responses (e.g., `{ success: boolean; data?: T; error?: string }`)
- Errors logged to console using `console.error()` when caught in utility functions
- Network errors handled gracefully with user-friendly error messages

**Example pattern from `plantnet.ts`:**
```typescript
try {
  // operation
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
  };
}
```

## Logging

**Framework:** `console` module

**Patterns:**
- Errors logged with `console.error()` in catch blocks
- Used in cache (`cache.ts`) and rate limiter (`rateLimiter.ts`) for debugging
- No centralized logging service
- Logging kept to error cases and cache/storage operations

**Example usage:**
```typescript
catch (error) {
  console.error('Error reading cache:', error);
}
```

## Comments

**When to Comment:**
- JSDoc/TSDoc comments used for exported functions and interfaces
- Used extensively in public APIs and service functions
- Inline comments provided for complex logic or non-obvious intent
- Comments explain "why" rather than "what"

**JSDoc/TSDoc:**
- Applied to all exported service functions
- Parameter descriptions included
- Return type descriptions included
- Example from `plantnet.ts`:
```typescript
/**
 * Identify a plant using the PlantNet API
 * @param params - Image URI, organ type, and language
 * @returns PlantNet response with identification results
 */
export async function identifyPlant(params: IdentifyPlantParams): Promise<IdentifyPlantResult>
```

## Function Design

**Size:** Functions kept relatively small and focused; largest functions (like `identifyPlant()`) around 70-80 lines for complex operations

**Parameters:**
- Destructuring used heavily in parameter lists
- Complex parameters wrapped in interfaces (e.g., `IdentifyPlantParams`)
- Default values provided in destructuring (e.g., `{ imageUri, organ = 'auto', lang = 'en' }`)

**Return Values:**
- Explicit return types always specified in function signatures
- Void async functions used for operations without return value
- Promise types used for async operations (e.g., `Promise<IdentifyPlantResult>`)
- Multiple return values wrapped in objects/interfaces

## Module Design

**Exports:**
- Named exports preferred throughout
- Service modules export functions directly (no default exports in services)
- Example from `rateLimiter.ts`: `export async function getRateLimitState()`

**Barrel Files:**
- `types/index.ts` re-exports all type definitions
- No barrel exports found in `components/` or `services/` directories
- Each module exports its own functions directly

## React/Component Conventions

**Component Naming:**
- Functional components only (no class components)
- Component functions use PascalCase
- Props typed explicitly with interfaces extending component prop types
- Example from `Themed.tsx`:
```typescript
export type TextProps = ThemeProps & DefaultText['props'];
```

**Hooks:**
- Custom hooks prefixed with `use` and exported as named exports
- Hooks wrap platform-specific logic or external library hooks
- Example: `useThemeColor()`, `useColorScheme()`

**Styling:**
- React Native `StyleSheet.create()` used for component styles
- Styles defined inline after component function or in separate variable
- Style objects use camelCase property names (React Native convention)
- Theme colors accessed through constants and custom hooks

