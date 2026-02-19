# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
plantid-temp/
├── app/                          # Expo Router application routes and layouts
│   ├── (tabs)/                   # Tab-based navigation group
│   │   ├── _layout.tsx          # Tab configuration and bar setup
│   │   ├── index.tsx            # Tab One screen
│   │   └── two.tsx              # Tab Two screen
│   ├── _layout.tsx              # Root layout, theme provider, splash screen
│   ├── modal.tsx                # Modal screen overlay
│   ├── +html.tsx                # Web HTML wrapper
│   └── +not-found.tsx           # 404 error boundary
├── components/                   # Reusable UI components and hooks
│   ├── Themed.tsx               # Theme-aware Text and View components
│   ├── EditScreenInfo.tsx        # Informational component
│   ├── ExternalLink.tsx          # Link component
│   ├── StyledText.tsx            # Styled text wrapper
│   ├── useColorScheme.ts         # Color scheme hook
│   ├── useColorScheme.web.ts     # Web-specific color scheme hook
│   ├── useClientOnlyValue.ts     # Client-only rendering hook
│   ├── useClientOnlyValue.web.ts # Web-specific client-only hook
│   └── __tests__/                # Component tests
├── services/                     # Business logic and API integration
│   ├── plantnet.ts              # PlantNet API client and helpers
│   ├── cache.ts                 # Result caching with AsyncStorage
│   └── rateLimiter.ts           # Daily identification rate limiting
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All type definitions for app
├── constants/                    # Application constants
│   └── Colors.ts                # Theme color palettes
├── hooks/                        # Custom React hooks (empty)
├── utils/                        # Utility functions (empty)
├── data/                         # Data files (empty)
├── assets/                       # Static assets
│   ├── fonts/                   # Custom fonts
│   └── images/                  # App icons and splash screens
├── .vscode/                      # VS Code workspace settings
├── .claude/                      # Claude Code configuration
├── .planning/                    # GSD planning directory
│   └── codebase/                # Architecture/structure documentation
├── app.json                      # Expo configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Node dependencies and scripts
└── package-lock.json            # Locked dependency versions
```

## Directory Purposes

**`app/`:**
- Purpose: Expo Router file-based routing and screen definitions
- Contains: Route files (*.tsx), layout configurations, navigation structure
- Key files: `_layout.tsx` (root setup), `(tabs)/` (tab navigation), `modal.tsx` (modal overlays)

**`components/`:**
- Purpose: Reusable UI components and React hooks
- Contains: Presentational components, custom hooks, test files
- Key files: `Themed.tsx` (theme-aware components), `useColorScheme.ts` (theme detection), hooks for client-only rendering

**`services/`:**
- Purpose: Service layer for business logic and external integrations
- Contains: API clients, data caching, rate limiting
- Key files: `plantnet.ts` (PlantNet API), `cache.ts` (AsyncStorage caching), `rateLimiter.ts` (daily limits)

**`types/`:**
- Purpose: Centralized TypeScript type and interface definitions
- Contains: Domain models, API response types, application data structures
- Key files: `index.ts` (all types: PlantNetResult, SavedPlant, PlantCareInfo, etc.)

**`constants/`:**
- Purpose: Application-wide configuration and constant values
- Contains: Theme colors, limits, API endpoints
- Key files: `Colors.ts` (light/dark theme palettes)

**`assets/`:**
- Purpose: Static resources (images, fonts)
- Contains: App icons, splash screens, custom fonts
- Subdirectories: `fonts/`, `images/`

**`hooks/`, `utils/`, `data/`:**
- Purpose: Placeholders for future custom hooks, utility functions, and data files
- Current state: Empty directories

**`.vscode/`, `.claude/`, `.planning/`:**
- Purpose: Development and planning tooling
- Contains: Editor settings, Claude Code configuration, architecture documentation

## Key File Locations

**Entry Points:**
- `app/_layout.tsx`: Root application layout and initialization (RootLayout component)
- `app/(tabs)/_layout.tsx`: Tab navigation configuration and routing
- `package.json`: Application metadata and script entry points

**Configuration:**
- `tsconfig.json`: TypeScript compiler options and path aliases (@/* → ./)
- `app.json`: Expo configuration (app name, icons, permissions, plugins)
- `package.json`: Dependencies, dev dependencies, scripts

**Core Logic:**
- `services/plantnet.ts`: Plant identification via PlantNet API
- `services/cache.ts`: Result caching with 7-day expiry
- `services/rateLimiter.ts`: Daily identification limit enforcement (5 per day)
- `types/index.ts`: All type definitions (PlantNetResponse, SavedPlant, PlantCareInfo, etc.)

**Testing:**
- `components/__tests__/`: Component test files
- `*.test.ts` or `*.spec.ts`: Test files (if present)

## Naming Conventions

**Files:**

- **Route files:** `_layout.tsx` for layout files, index file name without extension: `index.tsx`, other route files by name: `two.tsx`, `modal.tsx`
- **Components:** PascalCase: `Themed.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`
- **Hooks:** camelCase with `use` prefix: `useColorScheme.ts`, `useClientOnlyValue.ts`
- **Services:** camelCase descriptive names: `plantnet.ts`, `cache.ts`, `rateLimiter.ts`
- **Types:** `index.ts` for barrel exports, no separate type files
- **Platform-specific:** Web variants use `.web.ts` suffix: `useColorScheme.web.ts`, `useClientOnlyValue.web.ts`

**Directories:**

- **Route groups:** Parentheses for grouping (Expo Router syntax): `(tabs)/`
- **Feature directories:** camelCase: `components/`, `services/`, `constants/`, `assets/`
- **Special Expo:** Dot prefix for configuration: `_layout.tsx` (Expo Router convention), `+html.tsx`, `+not-found.tsx`

## Where to Add New Code

**New Feature (e.g., plant care tracker):**
- Primary code: `services/` directory for business logic (e.g., `services/plantCare.ts`)
- Type definitions: Add to `types/index.ts` (new interface like PlantCareService)
- Screen: Add new route file in `app/(tabs)/` or `app/` depending on navigation
- Tests: Create co-located test file in `components/__tests__/` or service directory

**New Component/Module:**
- Reusable component: `components/` directory with PascalCase name
- Custom hook: `components/` directory with camelCase `use*` prefix
- Service/business logic: `services/` directory with camelCase name
- Types for the component/service: Add to `types/index.ts`

**Utilities:**
- Shared helper functions: `utils/` directory (currently empty, ready to use)
- Format: camelCase filenames, export functions
- Import alias: `@/utils/yourUtility`

**Constants/Configuration:**
- Application constants: `constants/Colors.ts` (existing) or new `constants/*.ts` files
- Environment-based: Use `process.env.EXPO_PUBLIC_*` or `Constants.expoConfig?.extra`

## Special Directories

**`(tabs)/`:**
- Purpose: Grouping tab-related routes (Expo Router feature)
- Generated: No
- Committed: Yes
- Note: Parentheses indicate route group; doesn't appear in URL structure

**`.vscode/`:**
- Purpose: VS Code workspace settings and extension recommendations
- Generated: No
- Committed: Yes

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes
- Committed: No (ignored in .gitignore)

**`assets/`:**
- Purpose: Static images and fonts
- Generated: No (pre-built)
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: Architecture and structure documentation (GSD planning)
- Generated: Yes (by GSD tools)
- Committed: Yes

---

*Structure analysis: 2026-02-19*
