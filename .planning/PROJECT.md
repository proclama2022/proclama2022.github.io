# Plantid — Plant Identifier App

## What This Is

Una app mobile cross-platform (iOS + Android) che identifica piante fotografate tramite PlantNet API, fornisce informazioni sulla cura, e invia notifiche per l'annaffiatura. Completamente gratuita per l'utente finale con monetizzazione via ads non invasivi e unlock Pro opzionale (€4,99 una tantum).

## Core Value

Rendere accessibile e gratuita l'identificazione precisa di piante con cura personalizzata — senza abbonamenti, a differenza dei competitor (PictureThis €30/anno, Planta €36/anno).

## Requirements

### Validated

(Nessuno ancora — app in costruzione)

### Active

**Core Loop:**
- [ ] User fotografa pianta via app camera
- [ ] PlantNet API identifica specie (score confidenza)
- [ ] App mostra nome scientifico, famiglia, nomi comuni
- [ ] Database locale fornisce cure (frequenza annaffiatura, luce, temperatura, terreno)
- [ ] User salva pianta identificata in locale
- [ ] App invia notifiche annaffiatura schedulate
- [ ] User può tracciare storico annaffiature
- [ ] App adatta UI tra IT/EN (e future lingue)

**Monetizzazione:**
- [ ] Banner ads in basso (rimovibili con Pro)
- [ ] In-app purchase Pro unlock (rimuovi ads + limiti aumentati)
- [ ] Tracking identificazioni/giorno per tier gratuito (5/giorno) vs Pro (15/giorno)

**UI Completa:**
- [ ] Home: lista piante salvate + annaffiature oggi + FAB camera
- [ ] Camera: preview + selezione organo pianta + scatta/da galleria
- [ ] Risultati: identificazione con confidence score + altre ipotesi
- [ ] Dettagli pianta: cura, storico annaffiature, prossima data, note
- [ ] Impostazioni: lingua, orario notifiche, statistiche, Pro unlock, info

### Out of Scope

- Real-time multiplayer/social features (v2+)
- Community plant tips database (v2+)
- Video identification (e mail processing cost, v2+)
- Export dati CSV (Pro feature v2+)
- Widget home screen (Pro feature v2+)
- On-device ML fallback (fino a >500 scan/giorno con plan commercial)

## Context

**Stack Tecnologico (Expo):**
- React Native + TypeScript (greenfield scaffold già presente)
- Expo managed workflow
- AsyncStorage per persistence locale
- PlantNet API (free tier 500 scan/giorno)
- Notifiche locali schedulate
- AdMob per ads
- Navigation: Expo Router (già in use)

**Codebase Stato:**
- Services iniziati: `plantnet.ts` (API), `cache.ts`, `rateLimiter.ts`
- Types definiti completamente in `types/index.ts`
- Layout scaffold con tab navigation
- No screens implementate yet (solo boilerplate)

**Database Cure Piante:**
- Necessario: 300-500 piante comuni con cure di base
- Fonte: Wikipedia, RHS, USDA (generare con Claude AI)
- Formato: JSON locale in AsyncStorage
- Fallback: se specie non nel DB, mostra solo risultati PlantNet

**API Limits & Strategy:**
- 500 identificazioni/giorno con plan free PlantNet
- Rate limiter per utente (5/giorno gratuito)
- Cache aggressiva per hash immagini identificate
- Calcolo capacità: ~100 utenti attivi/giorno @ 5 scan = 500 totali
- Upgrade path se scala: plan commercial PlantNet (€1.000/anno) o modello TFLite on-device

## Constraints

- **API Free Tier**: Max 500 scan/giorno — obbligatorio logo "Powered by Pl@ntNet" in app
- **Privacy**: PlantNet non salva immagini, ottime per marketing
- **Storage**: Tutto on-device, zero server necessario
- **Monolingue MVP**: MVP in IT/EN, future v2+ altre lingue
- **Dependency**: Hardcoded su PlantNet API gratuita per MVP (Plan B: modello TF-Lite se API scale out)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PlantNet API (free tier) | 50.000+ specie, 50+ lingue, API semplice, zero server cost | — Pending |
| AsyncStorage + cache | Nessun server remoto, privacy, offline-first fallback | — Pending |
| Database cure locale (non API) | PlantNet non fornisce cure, soluzione semplice & controllata | — Pending |
| React Native + Expo | Cross-platform iOS/Android, development velocity, community support | — Pending |
| Monetizzazione ads + Pro uno-tanto | Competitive vs subscription (PictureThis/Planta), marketing angle "forever free" | — Pending |

---
*Last updated: 2026-02-19 after project initialization*
