# Plantid — Plant Identifier App

## What This Is

Una app mobile cross-platform (iOS + Android) che identifica piante fotografate tramite PlantNet API, fornisce informazioni dettagliate sulla cura (incluse temperature stagionali, fertilizzazione, potatura, parassiti), e invia notifiche per l'annaffiatura. Completamente gratuita con monetizzazione via ads e unlock Pro opzionale (€4,99 una tantum). Plant detail screen con layout a tab (Info | Care | History | Notes) e note personali con auto-save.

**Shipped v1.2 Multi-Photo + Custom Reminders** — Photo gallery with lightbox, reminder system with notifications.
**Next:** Planning v1.3 (TBD).

## Core Value

Rendere accessibile e gratuita l'identificazione precisa di piante con cura personalizzata — senza abbonamenti, a differenza dei competitor (PictureThis €30/anno, Planta €36/anno).

## Requirements

### Validated

**Core Loop (v1.0):**
- ✓ User fotografa pianta via app camera — v1.0
- ✓ PlantNet API identifica specie (score confidenza) — v1.0
- ✓ App mostra nome scientifico, famiglia, nomi comuni — v1.0
- ✓ Database locale fornisce cure (frequenza annaffiatura, luce, temperatura, terreno) — v1.0
- ✓ User salva pianta identificata in locale — v1.0
- ✓ App invia notifiche annaffiatura schedulate — v1.0
- ✓ User può tracciare storico annaffiature — v1.0
- ✓ App adatta UI tra IT/EN (e future lingue) — v1.0

**Monetizzazione (v1.0):**
- ✓ Banner ads in basso (rimovibili con Pro) — v1.0
- ✓ In-app purchase Pro unlock (rimuovi ads + limiti aumentati) — v1.0
- ✓ Tracking identificazioni/giorno per tier gratuito (5/giorno) vs Pro (15/giorno) — v1.0

**UI Completa (v1.0):**
- ✓ Home: lista piante salvate + annaffiature oggi + FAB camera — v1.0
- ✓ Camera: preview + selezione organo pianta + scatta/da galleria — v1.0
- ✓ Risultati: identificazione con confidence score + altre ipotesi — v1.0
- ✓ Dettagli pianta: cura, storico annaffiature, prossima data, note — v1.0
- ✓ Impostazioni: lingua, orario notifiche, statistiche, Pro unlock, info — v1.0

**Plant Detail Enhancement (v1.1):**
- ✓ Tabbed layout con navigazione orizzontale (Info | Care | History | Notes) — v1.1
- ✓ Temperature stagionali (min/max per stagione) — v1.1
- ✓ Info fertilizzazione (quando, tipo, frequenza) — v1.1
- ✓ Info potatura (quando, come, tecniche) — v1.1
- ✓ Parassiti comuni (sintomi, rimedi espandibili) — v1.1
- ✓ Campo note espanso (1000 char, auto-save, flash conferma) — v1.1
- ✓ Metadati personalizzati (data acquisto, prezzo, origine, regalo) — v1.1

**Multi-Photo & Reminders (v1.2):**
- ✓ Multi-foto galleria per pianta con upload, thumbnail grid, lightbox — v1.2
- ✓ Set foto principale, elimina foto con conferma — v1.2
- ✓ Migrazione automatica da singola foto a array multi-foto — v1.2
- ✓ Reminder custom (rinvaso, fertilizzazione, potatura, custom) con notifica push — v1.2
- ✓ Lista reminder attivi/completati in tab History — v1.2

### Active

(No active requirements — planning next milestone)

### Out of Scope

- Real-time multiplayer/social features (v2+)
- Community plant tips database (v2+)
- Video identification (e mail processing cost, v2+)
- Export dati CSV (Pro feature v2+)
- Widget home screen (Pro feature v2+)
- On-device ML fallback (fino a >500 scan/giorno con plan commercial)
- Subscription model (explicitly rejected for MVP)

## Context

**Stack Tecnologico (Expo SDK 54):**
- React Native 0.81.5 + TypeScript
- Expo managed workflow with development build
- Expo Router for navigation
- Zustand + AsyncStorage for state persistence
- expo-notifications for local notifications
- PlantNet API (free tier 500 scan/giorno)
- RevenueCat for IAP
- react-native-google-mobile-ads for AdMob

**Codebase Stato (v1.2):**
- ~11,200 lines TypeScript/TSX (+1,364 from v1.1)
- 29 plans executed across 6 phases (phases 1–6)
- 5 main screens + 4 Detail tab components (InfoTab, CareTab, HistoryTab, NotesTab)
- Bilingual (IT/EN) with i18next
- Services: plantnet, cache, rateLimiter, watering, notification, purchase, careDB, reminderService
- Stores: plantsStore (extended: purchaseDate/Price/Origin/giftFrom, photos, reminders), settingsStore, proStore
- Tab navigation: MaterialTopTabNavigator inside NavigationIndependentTree (expo-router compat pattern)
- Photo system: PhotoGallery, PhotoLightbox, AddPhotoButton with expo-image-manipulator
- Reminder system: ReminderModal, ReminderFab, unified History timeline

**Database Cure Piante:**
- 100 species with care info (extensible to 500)
- JSON local database in services/careDB.ts
- Fallback: "Care info coming soon" if species not in DB

## Constraints

- **API Free Tier**: Max 500 scan/giorno — obbligatorio logo "Powered by Pl@ntNet" in app
- **Privacy**: PlantNet non salva immagini, ottime per marketing
- **Storage**: Tutto on-device, zero server necessario
- **Monolingue MVP**: MVP in IT/EN, future v2+ altre lingue
- **Dependency**: Hardcoded su PlantNet API gratuita per MVP (Plan B: modello TF-Lite se API scale out)
- **Dev Build Required**: IAP and AdMob require development build (not Expo Go)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PlantNet API (free tier) | 50.000+ specie, 50+ lingue, API semplice, zero server cost | ✓ Working — 500 scans/day limit manageable for MVP |
| AsyncStorage + cache | Nessun server remoto, privacy, offline-first fallback | ✓ Working — LRU cache with image hash |
| Database cure locale (non API) | PlantNet non fornisce cure, soluzione semplice & controllata | ✓ Working — 100 species in careDB.ts |
| React Native + Expo | Cross-platform iOS/Android, development velocity, community support | ✓ Working — Expo SDK 54, RN 0.81.5 |
| Monetizzazione ads + Pro uno-tanto | Competitive vs subscription (PictureThis/Planta), marketing angle "forever free" | ✓ Working — RevenueCat IAP, AdMob banners |
| RevenueCat over react-native-iap | react-native-iap deprecated, RevenueCat has official Expo plugin | ✓ Working — Server-side receipt validation |
| Manual notification opt-in | Less intrusive, better UX than auto-prompting | ✓ Working — Settings toggle, limit-based triggers |
| NavigationIndependentTree for tab navigator | expo-router uses its own NavigationContainer — nested navigators need isolation to avoid "navigator already registered" error | ✓ Working — `NavigationIndependentTree` from @react-navigation/native wraps MaterialTopTabNavigator in [id].tsx |
| CareSection always renders heading | Even when PlantNet data is absent, section heading + "Not available" is more honest than hiding the section | ✓ Working — CareSection component renders regardless of data presence |
| v1.1 shipped as Phase 4 only | Phases 5 (Multi-Photo) and 6 (Custom Reminders) not completed — shipped tabbed layout as standalone release | ⚠️ Deferred — Phases 5+6 move to v1.2 |
| Zustand onRehydrateStorage migration | Automatic data migration on app load, version tracking prevents re-runs | ✓ Working — photo array migration transparent to user |
| React Native Modal for bottom sheet | No external library needed for ReminderModal, native-feeling slide animation | ✓ Working — matches ProUpgradeModal pattern |
| CalendarTrigger for reminders | One-time notifications (not recurring), uses global Settings time | ✓ Working — extends Phase 2 notification infrastructure |
| Unified History timeline | Watering events + reminders in one chronological list | ✓ Working — tap-to-complete, long-press edit/delete |

---

*Last updated: 2026-02-25 after v1.2 milestone (Phases 5+6 — Multi-Photo Gallery + Custom Reminders)*
