# Project Research Summary

**Project:** Plantid — Plant Identification Mobile App
**Milestone:** v1.1 Enhanced Plant Detail
**Domain:** Plant Care Mobile App (React Native + Expo)
**Researched:** 2026-02-20
**Confidence:** HIGH

## Executive Summary

Plantid is a cross-platform plant identification app built with React Native and Expo that leverages the PlantNet API for species identification. The v1.0 milestone established core functionality: camera capture, API identification, basic care information display, plant collection management, and watering notifications. The app is fully offline-first with AsyncStorage persistence and requires no backend.

For v1.1, the focus shifts to enhancing the plant detail screen with a tabbed layout (Info | Care | History | Notes), multi-photo gallery for growth tracking, extended care information (seasonal temperatures, fertilization, pruning, pests), and advanced custom reminders beyond watering. Research across competitive plant care apps (PictureThis, Planta, Blossom, PlantIn, PlantParent) shows these features are **table stakes** — users expect comprehensive care tracking and multi-photo organization in modern plant care apps.

The recommended approach is **incremental enhancement** rather than wholesale changes. The existing architecture (Zustand stores + AsyncStorage + expo-notifications) supports all v1.1 features with minimal additions. Only 3 new libraries are needed: `react-native-tab-view` and `react-native-pager-view` for in-screen tabbed navigation, and `react-native-image-zoom-viewer` for gallery lightbox. The critical risk is **data model migration** — the multi-photo gallery requires changing `SavedPlant.photo: string` to `SavedPlant.photos: PlantPhoto[]`, which needs careful migration to avoid data loss for existing users.

## Key Findings

### Recommended Stack

**Core v1.1 additions (3 new libraries):**
- `react-native-tab-view` + `react-native-pager-view` — Tabbed navigation within plant detail screen
- `react-native-image-zoom-viewer` — Full-screen lightbox gallery with pinch-to-zoom

**Existing stack leveraged:**
- `expo-notifications` (already v0.32.16) — Custom reminders extend existing notification system
- `expo-image-picker` (already v17.0.10) — Photo selection from camera/gallery
- `expo-image-manipulator` (already v14.0.8) — Photo compression before storage
- `expo-file-system` (included in SDK 54) — Persistent photo storage in app-local directory
- Zustand stores (already v5.0.11) — State management for new data fields

**Why this approach:** Minimal dependencies, all libraries support React Native's New Architecture, no backend required, fully offline-capable.

### Expected Features

**Must have (table stakes — users expect these):**
- **Tabbed detail layout** — 4 tabs organize dense information without overwhelming scroll (Info, Care, History, Notes)
- **Multi-photo gallery** — Track growth over time with 3-10 photos per plant, swipeable carousel view
- **Extended care information** — Seasonal temperature ranges, fertilization schedules, pruning instructions, pest/disease identification
- **Custom reminders** — Multiple reminder types (fertilizing, repotting, pruning) beyond watering, custom scheduling

**Should have (competitive differentiators):**
- **Growth timeline visualization** — Visual timeline showing plant's growth through photos over time
- **Markdown notes** — Rich text formatting with bold, lists, headers for better organization

**Defer to v2+:**
- Social sharing of plants — Requires backend, privacy, moderation
- Community plant tips database — Server infrastructure needed
- AI-powered care adjustment — High complexity, requires seasonal data + heuristics/ML

**Feature dependencies:** Tabbed layout must come first (provides structure for all other features). Extended care info can be added incrementally (optional fields in PlantCareInfo). Multi-photo gallery requires data model migration (highest risk). Custom reminders build on existing expo-notifications system.

### Architecture Approach

**v1.1 maintains strict layered architecture:**
- **Routing layer** (Expo Router) — Unchanged, plant detail remains at `app/plant/[id].tsx`
- **Screen layer** — Plant detail screen now wraps content in TabView component
- **Services layer** — New `photoService.ts` for file system operations, extended `notificationService.ts` for custom reminders
- **Persistence layer** — AsyncStorage for photo metadata, expo-file-system for photo storage

**New components for v1.1:**
1. **TabView wrapper** — Orchestrates 4 tab scenes, handles swipe navigation
2. **InfoTab** — Displays plant identification data, scientific name, family
3. **CareTab** — Shows extended care info (fertilization, pruning, pests, seasonal temps)
4. **HistoryTab** — Watering history timeline, custom reminder history
5. **NotesTab** — Markdown-rendered notes field
6. **PhotoGallery** — Thumbnail grid with add photo button
7. **PhotoLightbox** — Full-screen zoom viewer with swipe between photos

**Data model extensions:**
- `SavedPlant.photo` → `SavedPlant.photos: PlantPhoto[]` (breaking change, requires migration)
- `PlantCareInfo` gains optional `fertilization`, `pruning`, `pests`, `seasonalTemp` fields
- `SavedPlant` gains `customReminders?: CustomReminder[]` field

### Critical Pitfalls

**Top 5 pitfalls from research:**

1. **Data model migration breaks existing plants** — Changing `photo: string` to `photos: PlantPhoto[]` requires migration script that handles edge cases (null photos, corrupted URIs, missing directories). Without careful migration, existing users lose their plant photos.

2. **AsyncStorage cache grows without bound** — Photo metadata (array of 3-10 photos per plant × 50-100 plants) fills AsyncStorage. Cache eviction policy needed (LRU with max entry limit). **Mitigation:** Implement LRU eviction before v1.1 ships.

3. **Photo storage fills device filesystem** — Uncompressed photos can consume 50-500MB. **Mitigation:** Compress all photos on upload (max 1024px, JPEG 0.7 quality) using existing `expo-image-manipulator`.

4. **Client-side rate limiting bypassable** — Users can clear app data to reset daily scan limit, exhausting PlantNet's 500/day global quota. **Mitigation:** Add server-side device fingerprint tracking (already flagged for Phase 1, implement before v1.1 launch if not already done).

5. **Notification scheduling fails silently on Android** — Android 13+ requires explicit permission, exact alarm permission, battery optimization exclusion. **Mitigation:** Test on physical Samsung/Xiaomi/Huawei devices, prompt users to disable battery optimization, use exact alarms when possible.

**Additional v1.1-specific risks:**
- **TabView memory leaks** — All tab scenes mount by default, causing memory bloat with photo galleries. **Mitigation:** Use lazy loading with `SceneMap`, only mount active + adjacent tabs.
- **Photo URI invalidation** — URIs from `expo-image-picker` may become invalid if original gallery image is deleted. **Mitigation:** Copy all photos to app-local filesystem via `expo-file-system` immediately after selection.

## Implications for Roadmap

Based on research, v1.1 should be delivered in **4 sequential phases** to manage risk and dependencies:

### Phase 1: Tabbed Layout Foundation
**Rationale:** Tabbed layout is the foundation for all other v1.1 features. It reorganizes existing content without breaking changes, providing immediate UX improvement.

**Delivers:**
- TabView component with 4 tabs (Info, Care, History, Notes)
- Tab navigation UI (horizontal swipe + tap to switch)
- Content migration from existing single-scroll layout to tab-specific views

**Addresses:**
- FEATURES.md: "Tabbed Detail Layout" table stakes feature
- ARCHITECTURE.md: "Component Boundaries" — new TabView wrapper component

**Uses:**
- `react-native-tab-view` + `react-native-pager-view` (new libraries)
- Existing `SavedPlant` data (no migration required)

**Avoids:**
- PITFALLS.md #12: New Architecture compatibility (verify libraries support New Arch before install)

**Research flag:** None — standard React Native pattern, well-documented.

---

### Phase 2: Extended Care Information
**Rationale:** Pure data model extension (optional fields) + static UI. No migration required, can be populated incrementally. High value, low risk.

**Delivers:**
- Extended `PlantCareInfo` interface with `fertilization`, `pruning`, `pests`, `seasonalTemp`
- CareTab UI rendering extended care info
- Population of 100 species database with extended data (gradual backfill acceptable)

**Addresses:**
- FEATURES.md: "Extended Care Information" table stakes feature
- ARCHITECTURE.md: "Plant care DB as static import" pattern

**Uses:**
- Existing `careDB.ts` static database pattern
- No new libraries

**Avoids:**
- PITFALLS.md #7: Care DB coverage gap — prioritize by PlantNet frequency data, add genus-level fallback

**Research flag:** None — straightforward UI work, data model already designed.

---

### Phase 3: Multi-Photo Gallery
**Rationale:** Highest-risk feature due to data model migration. Deliver after tab structure is stable so photo gallery has a dedicated tab (InfoTab or standalone Photos tab).

**Delivers:**
- Data model migration: `photo: string` → `photos: PlantPhoto[]`
- `photoService.ts` for file system operations (save, delete, compress)
- PhotoGallery component (thumbnail grid + add button)
- PhotoLightbox (full-screen zoom viewer with swipe)

**Addresses:**
- FEATURES.md: "Multi-Photo Gallery" table stakes feature
- ARCHITECTURE.md: "Storing full image bytes in AsyncStorage" anti-pattern avoided

**Uses:**
- `react-native-image-zoom-viewer` (new library)
- `expo-image-picker` (existing)
- `expo-image-manipulator` (existing)
- `expo-file-system` (existing in SDK)

**Avoids:**
- PITFALLS.md #3: AsyncStorage cache unbounded growth — use LRU eviction
- PITFALLS.md #15: Image size not validated — compress on upload
- PITFALLS.md: Photo URI invalidation — copy to app-local filesystem

**Research flag:** **MEDIUM** — Data model migration has edge cases. Test migration script with:
- Existing plants with single photo string
- Plants with null/missing photo field
- Corrupted URIs (deleted original images)
- Large photo collections (10+ photos)

**Migration strategy:**
```typescript
// Version bump in store schema
const PLANT_STORE_VERSION = 2;

// Migration function
async migrateToV2(plants: SavedPlant[]): Promise<SavedPlant[]> {
  return plants.map(plant => ({
    ...plant,
    photos: plant.photo
      ? [{ uri: plant.photo, id: generateId(), timestamp: Date.now(), isPrimary: true }]
      : [],
    // Remove old field after successful migration
    photo: undefined,
  }));
}
```

---

### Phase 4: Custom Reminders
**Rationale:** Extends existing notification system. Can be delivered incrementally (start with 2 reminder types, expand in v1.2). Low risk, high user value.

**Delivers:**
- Extended `SavedPlant` with `customReminders?: CustomReminder[]`
- Reminder types enum (watering, fertilizing, repotting, pruning, custom)
- Notification categories for iOS grouping
- UI for adding/editing/deleting custom reminders
- Integration with existing `notificationService.ts`

**Addresses:**
- FEATURES.md: "Custom Reminders" table stakes feature
- ARCHITECTURE.md: "Notification IDs persisted alongside plants" pattern

**Uses:**
- `expo-notifications` (existing v0.32.16)
- Existing `scheduleDailyDigest` pattern

**Avoids:**
- PITFALLS.md #5: Notification scheduling fails silently on Android — test physical devices
- PITFALLS.md #11: Wrong library (react-native-push-notification) — use expo-notifications only

**Research flag:** None — extends existing working system.

---

### Phase 5: Polish & Advanced Features
**Rationale:** Quick wins after core v1.1 features are stable. Growth timeline and markdown notes are low-risk differentiators.

**Delivers:**
- Growth timeline visualization (uses multi-photo gallery data)
- Markdown notes rendering (`react-native-markdown-display`)
- Performance optimization (lazy tab loading, photo caching)
- Accessibility improvements

**Addresses:**
- FEATURES.md: "Growth Timeline Visualization" and "Markdown Notes" differentiators

**Uses:**
- `react-native-markdown-display` (new library, ~500KB)

**Research flag:** None — standard libraries, well-documented.

---

### Phase Ordering Rationale

**Why this order:**
1. **Tabs first** — Foundation for all other features. No breaking changes, immediate UX improvement.
2. **Care info second** — Data-only change, optional fields, enables gradual population. No UI complexity.
3. **Gallery third** — Highest risk due to migration. Deliver after tabs are stable so gallery has dedicated space.
4. **Reminders fourth** — Extends existing notification system, low risk, can be incremental.
5. **Polish last** — Differentiators that don't block core v1.1 value.

**How this avoids pitfalls:**
- **Phases 1-2** avoid data migration risk, establish stable structure
- **Phase 3** addresses migration when codebase is most stable (after tabs + care)
- **Phase 4** builds on existing working notification system
- **Phase 5** adds polish without risk to core features

**Parallel opportunities:**
- Care info population (data entry) can happen in parallel with Phase 1 implementation
- Extended care UI can be built in parallel with data population

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Multi-Photo Gallery):** Migration script edge cases. Test with existing user plants, corrupted URIs, large photo collections. May need `/gsd:research-phase` for migration testing strategy.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Tabbed Layout):** Well-documented, react-native-tab-view has extensive examples.
- **Phase 2 (Extended Care Info):** Static data + straightforward UI.
- **Phase 4 (Custom Reminders):** Extends existing expo-notifications integration.
- **Phase 5 (Polish):** Standard libraries (react-native-markdown-display).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified from official docs, React Native 0.81.5 compatibility confirmed. Only 3 new packages, all support New Architecture. |
| Features | HIGH | Competitive analysis across 10+ plant care apps. Table stakes features well-documented. API examples available for all proposed features. |
| Architecture | HIGH | Based on existing codebase audit (CONCERNS.md, ARCHITECTURE.md, INTEGRATIONS.md). Layered architecture already proven in v1.0. |
| Pitfalls | HIGH | 16 pitfalls identified from codebase analysis + known Expo/React Native patterns. Specific mitigations provided for each. |

**Overall confidence:** HIGH

Research is based on:
- Existing codebase analysis (8,988 lines TypeScript/TSX, 19 plans executed)
- Official library documentation (react-native-tab-view, expo-notifications, expo-file-system)
- Competitive app analysis (10+ plant care apps, 2025-2026 feature landscape)
- Expo SDK 54 + React Native 0.81.5 verified compatibility

### Gaps to Address

**Minor gaps to validate during implementation:**

1. **Photo storage quota** — Research indicates AsyncStorage limit is 5-10MB total. With multi-photo gallery, photo metadata (URIs, timestamps, captions) may approach this limit. **Mitigation:** Monitor metadata size during Phase 3 testing. If >50% quota, migrate photo metadata to SQLite or JSON file in filesystem.

2. **TabView performance with photo galleries** — Research warns that mounting all tab scenes causes memory bloat. **Mitigation:** Use `lazy` prop in TabView with `SceneMap`, only mount active + adjacent tabs. Test with 50+ plants, 10 photos each.

3. **PlantNet API changes** — PITFALLS.md #6 warns API has no formal SLA. **Mitigation:** Add Zod schema validation on PlantNet responses (already planned for Phase 1), subscribe to PlantNet GitHub issues for change notices.

4. **Android notification Doze mode** — PITFALLS.md #5 warns Android battery optimizers kill background processes. **Mitigation:** Test Phase 4 on physical Samsung/Xiaomi/Huawei devices. Prompt users to disable battery optimization for the app.

5. **Care DB coverage** — Research identifies 50,000+ species in PlantNet vs 100-500 in care DB. **Mitigation:** Genus-level fallback logic covers ~80% of care needs. Track user-identified species not in DB, prioritize backfill.

**No blocking gaps** — all risks have clear mitigations. Research is sufficient to proceed with roadmap creation.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [react-native-tab-view GitHub](https://github.com/satya164/react-native-tab-view) — Verified latest version, peer dependencies, New Architecture support
- [react-native-pager-view npm](https://www.npmjs.com/package/react-native-pager-view) — Version compatibility confirmed
- [react-native-image-zoom-viewer GitHub](https://github.com/ascott0742/react-native-image-zoom-viewer) — Features, maintenance status, RN 0.81 compatibility
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/) — API, directory structure, persistence guarantees
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/) — Categories, triggers, Android permissions

**Codebase Analysis:**
- `/Users/martha2022/Documents/Claude code/Plantid/package.json` — Installed versions verified
- `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/ARCHITECTURE.md` — Layered architecture, data flow
- `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/CONCERNS.md` — Known issues, fragile areas
- `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/INTEGRATIONS.md` — External service integrations
- `/Users/martha2022/Documents/Claude code/Plantid/.planning/PROJECT.md` — Requirements, milestones, constraints

### Secondary (MEDIUM confidence)

**Competitive App Research:**
- Plant care app comparison (PictureThis, Planta, Blossom, PlantIn, PlantParent, Plantico, WaterPlantly, PlantPal, Plantasia, Plantaid) — Feature lists from app store descriptions, marketing pages
- Mobile app UI patterns (Leafify AI, Planter, Pothos) — Tabbed navigation, gallery patterns
- Android Sunflower project best practices — 42% performance improvement with flat layout

**React Native Ecosystem:**
- React Native image picker libraries comparison — expo-image-picker vs react-native-image-crop-picker vs react-native-syan-image-picker
- Notification best practices 2025-2026 — Personalization boosts retention 61-74%

### Tertiary (LOW confidence)

**Industry Statistics:**
- Notification engagement metrics (75% delete apps with too many notifications) — Single source, not independently verified
- Specific app implementation details (no access to app internals, claims unverified)

**Gaps to Validate:**
- Actual competitor app implementations (need hands-on testing or verified reviews)
- User research on which tabs/features are most used
- Exact schema used by production plant care apps (proprietary, not public)

---
*Research completed: 2026-02-20*
*Ready for roadmap: YES*
*Next step: /gsd:roadmap to create v1.1 roadmap based on this research*
