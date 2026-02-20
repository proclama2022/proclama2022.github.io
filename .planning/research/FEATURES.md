# Feature Landscape

**Domain:** Plant Care App — Enhanced Plant Detail Screen
**Researched:** 2026-02-20
**Mode:** Ecosystem Research

## Executive Summary

Research across plant care apps (PictureThis, Planta, Blossom, PlantIn, Plantico, WaterPlantly, PlantMind, PlantDaily, and others) reveals clear patterns for tabbed detail screens, multi-photo galleries, extended care information, and custom reminders. These features are **table stakes** for competitive plant care apps in 2026 — users expect comprehensive care tracking beyond basic watering.

**Key finding:** Leading apps organize plant detail screens into 4-5 tabs (Info, Care, Schedule/History, Journal/Notes, Photos), support multiple photos per plant for growth tracking, provide detailed seasonal care instructions (fertilization, pruning, pests), and offer granular custom reminders beyond watering.

---

## Table Stakes

Features users expect in competitive plant care apps. Missing these makes the product feel incomplete.

### 1. Tabbed Detail Layout

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **4-5 tab organization** | Organizes dense information without overwhelming scroll | Medium | Common tabs: Info, Care, Schedule/History, Journal/Notes, Photos |
| **Horizontal tab navigation** | Standard mobile pattern (bottom tabs or top tabs) | Low | Android Sunflower shows 42% perf improvement with flat layout |
| **Sticky headers** | Maintains context while scrolling | Low | Material You and iOS design patterns |
| **Visual indicators for urgent care** | Users need quick "what needs attention" scan | Medium | Badges, colors, icons for overdue tasks |
| **One-tap quick actions** | Reduce friction for common tasks (water, fertilize) | Low | Floating action buttons or inline action buttons |

**UX Patterns from Competitors:**
- **PlantIn/Leafify AI**: Tabbed navigation for Care Plans, Watering Calculator, Disease ID, Notifications
- **Pothos app**: "Growth Rings" visual system (daily/weekly/monthly care zones)
- **Planter**: Smart reminders, growth tracking, encyclopedia, care schedules

**Dependency on Existing Data Model:**
- Tabs can organize existing `SavedPlant` fields (nickname, location, notes, waterHistory)
- Care tab integrates with existing `PlantCareInfo` from careDB
- History tab uses existing `waterHistory: WaterEvent[]`

---

### 2. Multi-Photo Gallery

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multiple photos per plant** | Track growth over time (before/after, seasonal changes) | Medium | 3-10 photos typical per plant |
| **Add from camera or gallery** | Flexibility in photo sourcing | Low | Use `react-native-image-picker` or `expo-image-picker` |
| **Swipeable/carousel view** | Standard mobile gallery UX | Medium | FlatList with horizontal scroll |
| **Photo metadata display** | Date taken, growth stage captions | Low | Store date + optional caption per photo |
| **Set as primary photo** | Main photo appears in plant list/grid | Low | Boolean flag in photo array |
| **Delete photos** | Users need curation control | Low | Swipe-to-delete or edit mode |

**UX Patterns from Competitors:**
- **Blossom**: "Multisnap mode" for upload multiple photos of same plant for better ID accuracy; "My Garden" tracks growth with attached photos
- **PlantDaily**: Diary and photo recording features
- **Chinese apps (养花记, 养花时光)**: Photo recording for growth tracking

**Dependency on Existing Data Model:**
- **BREAKING CHANGE**: `SavedPlant` needs `photo` string → `photos: PlantPhoto[]`
- New type required:
  ```typescript
  interface PlantPhoto {
    uri: string;
    dateAdded: string; // ISO timestamp
    caption?: string;
    isPrimary: boolean;
  }
  ```
- Migration strategy: Existing `photo` string becomes first item in `photos` array with `isPrimary: true`

**React Native Libraries (2026):**
- `expo-image-picker` — Expo managed workflow, camera + gallery
- `react-native-image-crop-picker` — Advanced cropping, multiple selection
- `react-native-syan-image-picker` — Cross-platform, localization support

---

### 3. Extended Care Information

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Seasonal temperature ranges** | Plants have different needs in summer vs winter | Medium | Min/max per season or growing/dormant phases |
| **Fertilization schedule** | Critical for plant health beyond watering | Low | Frequency, type, NPK ratios optional |
| **Pruning instructions** | Users often don't know when/how to prune | Medium | Timing, techniques, tools needed |
| **Pest & disease identification** | Early detection saves plants | High | Photo scanning ideal, text fallback MVP |
| **Toxicity warnings** | Pet/child safety is critical concern | Low | Already in `toxicPets` boolean |

**UX Patterns from Competitors:**
- **PlantIn**: "Thorough watering, fertilization, lighting, and pruning guidance"
- **Plant Parent**: "Smart care reminders for watering, fertilizing, pruning, propagation, repotting"; disease diagnosis with photo scanning
- **Plantico**: Set reminders for watering, fertilizing, and pruning
- **Plant Guru**: Diagnoses pests and diseases; care reminders for spraying, fertilization, rotating

**Dependency on Existing Data Model:**
- **BREAKING CHANGE**: `PlantCareInfo` interface needs extension
- Current fields: `waterFrequencyDays`, `sunlight`, `tempMin`, `tempMax`, `soil`, `humidity`, `difficulty`, `toxicPets`, `tips`
- New fields needed:
  ```typescript
  interface PlantCareInfo {
    // ...existing fields...
    // New extended fields:
    fertilization?: {
      frequency: string; // "Every 2 weeks in growing season"
      type?: string; // "Liquid balanced fertilizer"
      timing?: string; // "Spring through fall"
    };
    pruning?: {
      frequency: string; // "Annually in early spring"
      technique?: string; // "Remove dead leaves, trim leggy stems"
      tools?: string[]; // ["Clean shears", "Rubbing alcohol"]
    };
    pests?: {
      common: string[]; // ["Spider mites", "Mealybugs"]
      symptoms: string; // "Webbing, yellowing leaves"
      treatment: string; // "Wipe with neem oil, isolate plant"
    };
    seasonalTemp?: {
      growing: { min: number; max: number };
      dormant: { min: number; max: number };
      frostTolerance?: 'none' | 'light' | 'moderate' | 'hardy';
    };
  }
  ```
- **Data migration effort**: 100 species in careDB.ts need extended info population

---

### 4. Custom Reminders

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multiple reminder types** | Plants need more than watering (fertilize, repot, prune) | Medium | Beyond existing watering notifications |
| **Custom scheduling** | Users have unique routines and plant needs | Low | Daily/weekly/monthly or custom intervals |
| **One-time vs recurring** | Some tasks are periodic, others are one-off | Medium | Boolean flag `isRecurring` |
| **Snooze/postpone** | Users may not be ready to do the task when reminded | Low | "Remind me in 2 days" option |
| **Reminder history** | Track completion rates and compliance | Medium | Log when reminders are acknowledged/completed |
| **Quiet hours/respect user prefs** | 75% of millennials delete apps with too many notifications | Low | Settings toggle, time windows |

**UX Patterns from Competitors:**
- **WaterPlantly (v3.1.0)**: Watering and fertilizing notifications at specified frequencies; custom reminders for premium users (October 2025)
- **PlantPal**: Intelligent reminders for watering, fertilizing, repotting; tasks can be recurring or one-time; easy postpone option
- **养花记**: Personalized care reminder timing with customizable periods and time slots; comprehensive reminder dashboard
- **Plantasia**: Reminders for watering and fertilizing
- **Plantico**: Personalized care plans with watering, fertilizing, pruning reminders
- **Plantaid (v2.0, 2025)**: AI-powered care schedules, smart reminders auto-adjust based on plant profiles, pot size, seasonal factors

**Notification Best Practices (2025-2026 Research):**
- Personalization boosts 28-day retention 61-74% (vs 49% generic)
- First 90 days: frequent notifications can boost retention 3-10x
- BUT: 75% delete apps that send too many notifications
- Balance is key: value over volume, granular user control

**Dependency on Existing Data Model:**
- **BREAKING CHANGE**: `SavedPlant` needs new reminder system
- Current: Only `waterHistory`, `lastWatered`, `nextWateringDate`, `scheduledNotificationId`
- New structure needed:
  ```typescript
  interface CustomReminder {
    id: string;
    type: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pest_control' | 'custom';
    title: string; // "Fertilize Monstera"
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    customDays?: number; // For custom intervals
    nextDueDate: string; // ISO timestamp
    lastCompletedDate?: string;
    isRecurring: boolean;
    notificationId?: string;
    notes?: string;
  }

  interface SavedPlant {
    // ...existing fields...
    customReminders?: CustomReminder[];
  }
  ```
- Existing `expo-notifications` service can be extended for new reminder types
- Existing `scheduleDailyDigest` pattern can be adapted for custom reminders

---

## Differentiators

Features that set product apart. Not expected, but valued.

### 1. AI-Powered Care Adjustment
**Value Proposition:** Reminders auto-adjust based on plant profiles, pot size, seasonal factors (like Plantaid v2.0)

| Complexity | Notes |
|------------|-------|
| High | Requires ML model or heuristic rules; seasonal temp data already in careDB |

**Why Differentiator:** Most apps use static schedules; dynamic adjustment based on real factors is rare outside premium apps.

**Dependency:** Uses `seasonalTemp` from extended care info; user's location (optional) for season detection.

---

### 2. Growth Timeline Visualization
**Value Proposition:** Visual timeline showing plant's growth through photos over time

| Complexity | Notes |
|------------|-------|
| Medium | Multi-photo gallery + date metadata enables this |

**Why Differentiator:** Few apps offer visual growth tracking; most just show photo grid. Timeline tells the plant's "story."

**Dependency:** Multi-photo gallery feature required.

---

### 3. Markdown Notes with Formatting
**Value Proposition:** Rich text notes with bold, lists, headers for better organization

| Complexity | Notes |
|------------|-------|
| Low | `react-native-markdown-display` library available |

**Why Differentiator:** Most apps have plain text notes. Markdown enables checklists, sectioned notes, knowledge base per plant.

**Dependency:** Existing `notes?: string` field — just render as markdown instead of plain text.

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Social sharing of plants** | Out of scope for v1.1; requires backend, privacy, moderation | Focus on personal tracking; consider v2+ |
| **Community plant tips database** | Requires server, user-generated content, moderation | Static care database already provides authoritative info |
| **Video identification** | Email processing cost; PlantNet free tier sufficient for MVP | Photo identification via PlantNet API |
| **Export to CSV/PDF** | Pro feature for later; not MVP differentiator | In-app tracking sufficient for v1.1 |
| **Plant identification from gallery photos** | Low urgency; camera-first flow is primary use case | Gallery upload via image picker is MVP |
| **Voice memos for notes** | Niche feature; complexity vs value poor | Text notes with markdown support |

---

## Feature Dependencies

```
Tabbed Layout
├── Info Tab → Uses existing SavedPlant fields
├── Care Tab → Uses existing PlantCareInfo + extended care info
├── History Tab → Uses existing waterHistory + reminder history
├── Notes Tab → Uses existing notes (add markdown rendering)
└── Photos Tab → Requires multi-photo gallery

Multi-Photo Gallery
├── Photo storage → Requires SavedPlant.photos array (migration)
├── Photo picker → Use expo-image-picker
└── Growth Timeline → Depends on gallery + date metadata

Extended Care Info
├── Seasonal temps → Requires PlantCareInfo.seasonalTemp
├── Fertilization → Requires PlantCareInfo.fertilization
├── Pruning → Requires PlantCareInfo.pruning
└── Pests → Requires PlantCareInfo.pests

Custom Reminders
├── Reminder types → Requires SavedPlant.customReminders
├── Notification system → Extend existing expo-notifications
└── Reminder history → Log completion events
```

---

## MVP Recommendation for v1.1

**Prioritize (in order):**

1. **Tabbed Layout** — Foundation for all other features; organizes existing content better
2. **Extended Care Info** — High value, medium complexity; data model change but no new UI patterns
3. **Multi-Photo Gallery** — High user value, medium complexity; requires migration but enables growth tracking
4. **Custom Reminders** — High user value, extends existing notification system

**Defer:**
- **AI-Powered Care Adjustment** — High complexity; requires seasonal data + heuristics or ML
- **Growth Timeline Visualization** — Can be Phase 2 once gallery is stable
- **Markdown Notes** — Quick win, can add anytime; doesn't block other features

**Phase Ordering Rationale:**
1. Tabs first — provides structure for everything else
2. Care info second — data can be populated gradually; UI is static content
3. Gallery third — requires careful migration; UX complexity
4. Reminders last — builds on existing notification system; can extend incrementally

---

## Complexity Assessment

| Feature Category | Technical Complexity | Data Model Changes | Migration Required |
|------------------|---------------------|-------------------|-------------------|
| Tabbed Layout | Low | None | No |
| Multi-Photo Gallery | Medium | `photo: string` → `photos: PlantPhoto[]` | Yes (string to array) |
| Extended Care Info | Low | `PlantCareInfo` interface extension | No (optional fields) |
| Custom Reminders | Medium | `SavedPlant.customReminders?: CustomReminder[]` | No (optional field) |
| Markdown Notes | Low | None | No (rendering change only) |
| Growth Timeline | Medium | None (uses gallery data) | No |

**Migration Risk:** Multi-photo gallery is the only breaking change. Requires:
1. Database migration script (AsyncStorage migration)
2. Version bump in store schema
3. Fallback for old plants with single photo string

---

## Sources

### Web Search (LOW-MEDIUM confidence — verify with official docs)

**Tabbed Layout & UI Patterns:**
- Plant care apps with tabbed navigation: Leafify AI, PlantIn, Planter, Pothos — [Mobile App UI Research](https://github.com/topics/mobile-app-ui)
- Android Sunflower project best practices (42% performance improvement with flat layout) — [Android Sunflower GitHub](https://github.com/android/sunflower)

**Multi-Photo Gallery:**
- Blossom app Multisnap mode and My Garden photo tracking — [Blossm Plant App Features](https://apps.apple.com/us/app/blossm-plant-identification/id1535546400)
- React Native image picker libraries (2026): `expo-image-picker`, `react-native-image-crop-picker`, `react-native-syan-image-picker` — [React Native Image Picker Libraries](https://github.com/vivinkvk616/react-native-syan-image-picker)

**Extended Care Information:**
- PlantIn, Plant Parent, Plantico, Plant Guru care features (fertilization, pruning, pests) — [Plant Care App Comparison Articles](https://www.producthunt.com/posts/plant-identifier-care-app)

**Custom Reminders:**
- WaterPlantly v3.1.0, PlantPal, 养花记, Plantasia, Plantico, Plantaid v2.0 — [Plant Reminder App Features](https://www.producthunt.com/posts/plant-care-reminder-tracker)
- Mobile notification best practices 2025-2026 — [Notification Research 2025](https://clevertap.com/blog/push-notification-best-practices/)

**Confidence Levels:**
- Tabbed layout patterns: **HIGH** (standard mobile UX, verified by multiple sources)
- Multi-photo gallery libraries: **HIGH** (official GitHub repos)
- Competitor feature claims: **MEDIUM** (app store descriptions, marketing pages — may be exaggerated)
- Notification statistics: **LOW** (single source, not independently verified)
- Specific app implementations: **LOW** (no access to app internals; claims unverified)

**Gaps to Validate:**
- Actual competitor app implementations (need hands-on testing or verified reviews)
- Exact schema used by production plant care apps (proprietary, not public)
- Notification engagement statistics for plant care apps specifically
- User research on which tabs/features are most used

---

*Last updated: 2026-02-20*
*Researcher: GSD Project Research Agent*
*Mode: Ecosystem Research — Features for Enhanced Plant Detail*
