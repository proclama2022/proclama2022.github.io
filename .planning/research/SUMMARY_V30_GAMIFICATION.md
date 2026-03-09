# Research Summary: Gamification 2.0 (v3.0)

**Project:** Plantid
**Domain:** Gamification enhancements for plant care app
**Researched:** 2026-03-09
**Confidence:** HIGH (existing codebase + npm verification)

---

## Executive Summary

L'infrastruttura gamification esistente e gia molto solida con XP/Livelli/Badge/Daily Challenges implementati. Per la milestone v3.0 servono **estensioni mirate**, non un rebuild. I gap principali sono: leaderboard settimanale, badge catalog esteso, level titles, e celebration animations.

L'approccio raccomandato e un **incremental enhancement** in 4 fasi: (1) Leaderboard settimanale con RLS corretto, (2) Extended badges con progress tracking, (3) Level titles come pure client-side helper, (4) Celebrations con `react-native-confetti-cannon`. Una sola nuova dipendenza npm, tutto il resto estende lo schema Supabase esistente.

I rischi principali sono: N+1 queries nella leaderboard (risolvere con view), race conditions nei challenge progress (usare `ON CONFLICT DO UPDATE`), e timezone bugs negli streak (passare user timezone). Tutti risolvibili nella fase 1-2.

---

## Key Findings

### Recommended Stack

L'infrastruttura esistente copre il 90% delle esigenze. Unica aggiunta necessaria:

**New dependency:**
- `react-native-confetti-cannon@1.5.2` — Celebration animations (pure JS, no native deps, compatible with Expo 54)

**Existing stack (no changes needed):**
- Zustand 5.0.11 — State management
- Supabase — Backend con schema gamification completo
- `react-native-reanimated` 4.1.1 — UI animations (already installed)
- `expo-haptics` 15.0.8 — Haptic feedback (already installed)

**Schema additions (migration 007):**
- `weekly_leaderboard` VIEW con aggregazione settimanale
- `get_weekly_leaderboard()` RPC
- Extended `badges_catalog` con 8 nuovi badge
- `get_achievement_progress()` RPC per progress tracking

### Table Stakes vs Differentiators

**Must have (table stakes):**
- Weekly leaderboard view — utenti si aspettano competizione settimanale tipo Duolingo
- Extended badge catalog — 4 badge base sono insufficienti, servono 10+
- Level titles — utenti vogliono vedere il proprio "rank" (Seedling, Sprout, Gardener...)
- Badge progress tracking — sapere quanto manca per sbloccare

**Should have (differentiators):**
- Celebration animations — confetti su level-up e badge unlock
- Weekly challenges — obiettivi mid-term (oltre ai daily)
- Achievement tiers — badge a 5 livelli tipo Duolingo

**Defer (v3.1+):**
- League cohorts con promotion/demotion — complesso, serve cohort management
- Streak freeze — monetizzazione feature
- Real-time leaderboard updates — non necessario a questa scala

### Architecture Approach

Architettura esistente e solida: server-side logic in Supabase RPC (`award_event`), client state in Zustand (`gamificationStore`), UI components modulari. Per v3.0: estendere, non sostituire.

**New components:**
1. `CelebrationOverlay.tsx` — Confetti + haptics per celebrare level-up/badge
2. `WeeklyLeaderboardTab.tsx` — Tab "This Week" nella leaderboard
3. `BadgeProgress.tsx` — Progress bar verso badge sbloccati
4. `LevelTitleBadge.tsx` — Display titolo + icona

**Store extensions:**
- `leaderboardCache` + `leaderboardFetchedAt` — Cache con TTL 5 minuti
- `celebrationType` — Stato per triggering animations
- `triggerCelebration()` / `clearCelebration()` — Actions

### Critical Pitfalls

1. **Leaderboard N+1 Query Problem** — Attuale implementazione conta badge client-side scaricando TUTTI i badge. Fix: creare `weekly_leaderboard` VIEW con aggregazione server-side.

2. **Missing RLS Policy** — RLS attuale permette solo `auth.uid() = user_id`, ma leaderboard deve leggere progresso di tutti. Fix: nuova policy o security-definer RPC.

3. **Streak Timezone Bug** — Calcolo streak in UTC rompe streak per utenti che annaffiano tardi la sera. Fix: passare timezone client e calcolare "local day".

4. **Challenge Race Condition** — `INSERT ... ON CONFLICT DO NOTHING` poi `SELECT ... FOR UPDATE` lascia window per race. Fix: usare `ON CONFLICT DO UPDATE` con no-op update per lockare.

5. **XP Sync Race** — Se app chiude prima che RPC ritorni, XP awarded on server ma non in cache locale. Fix: refresh sempre da Supabase su app launch (gia fatto), + optimistic updates con rollback.

---

## Recommended Build Order

### Phase 1: Weekly Leaderboard (1-2 days)
**Rationale:** Foundation per gamification competitiva. Risolve N+1 query problem e RLS issue prima di scalare utenti.
**Delivers:** Weekly leaderboard view, "This Week" tab, user's weekly rank display
**Addresses:** Table stakes - weekly leaderboard
**Avoids:** Pitfall 1 (N+1), Pitfall 5 (RLS)
**Complexity:** Low — view SQL + RPC + minor UI

**Tasks:**
1. Migration 007: `weekly_leaderboard` VIEW + `get_weekly_leaderboard()` RPC
2. Aggiungere RLS policy per cross-user reads
3. Extend `gamificationService.ts` con `getWeeklyLeaderboard()`
4. Add "This Week" tab to `Leaderboard.tsx`
5. Add leaderboard cache to store con TTL

### Phase 2: Extended Badges (1 day)
**Rationale:** Piuttosto che badge base, dare agli utenti goal multipli da raggiungere.
**Delivers:** 8 nuovi badge, progress tracking UI, badge unlock logic esteso
**Addresses:** Table stakes - extended badge catalog
**Uses:** Migration 007 per badge definitions
**Complexity:** Low — INSERT migration + minor RPC extension

**Tasks:**
1. Migration 007: INSERT 8 nuovi badge in `badges_catalog`
2. Extend `award_gamification_badges_v2()` con nuovi check
3. Create `get_achievement_progress()` RPC
4. Update `BadgeGrid.tsx` per mostrare tutti i badge
5. Add `BadgeProgress.tsx` component per tracking

### Phase 3: Level Titles (0.5 days)
**Rationale:** Identity/status per utenti. Implementazione banale con pure client helper.
**Delivers:** Level titles (Seedling → Master Botanist) visualizzati ovunque
**Addresses:** Table stakes - level titles
**Complexity:** Very Low — client-side helper only

**Tasks:**
1. Create `utils/levelTitles.ts` con `getLevelTitle()` helper
2. Update `LevelProgressCard.tsx` per mostrare title + icon
3. Update profile screen per mostrare title
4. Add i18n strings per titoli

### Phase 4: Celebration Animations (1 day)
**Rationale:** Rendere i momenti di achievement memorabili. Ultimo fase perche dipende da tutto il resto.
**Delivers:** Confetti burst su level-up, modal su badge unlock, haptics
**Addresses:** Should have - celebrations
**New dep:** `react-native-confetti-cannon@1.5.2`
**Complexity:** Low — single component + store extension

**Tasks:**
1. `npm install react-native-confetti-cannon@1.5.2`
2. Create `CelebrationOverlay.tsx` component
3. Add `celebrationType` state to store
4. Integrate with `GamificationToastHost` per trigger su level-up
5. Test con haptics

### Phase 5: Polish & i18n (0.5 days)
**Rationale:** Finalizzazione prima del release.
**Delivers:** Traduzioni complete, dark mode verification, performance check

---

## Research Flags

**Needs research during implementation:**
- Phase 1: Performance test leaderboard con 100+ utenti simulati
- Phase 2: Validare badge unlock logic per edge cases (es. first_plant quando pianta eliminata)

**Standard patterns (skip research):**
- Phase 3: Level titles — client-side helper, no API calls
- Phase 4: Confetti — `react-native-confetti-cannon` API semplice e documentata
- Phase 5: i18n — pattern gia stabilito nel progetto

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Codebase verification + npm registry check |
| Features | HIGH | Competitor analysis (Duolingo, Strava) + existing gaps identified |
| Architecture | HIGH | Existing architecture verified, extensions clearly mapped |
| Pitfalls | HIGH | Direct codebase analysis identified specific issues |

**Overall confidence:** HIGH

### Gaps to Address

- **Timezone handling:** Testare streak calculation in multiple timezone (US, EU, Asia) prima di release
- **Badge progress UI:** Decidere design per badge "non-trackable" (es. weekly_champion) — mostrare locked o hidden?
- **Celebration cooldown:** Se utente level-up multiplo in rapida sequenza, come gestire? (Suggerimento: cooldown 3s)

---

## Open Questions for User

1. **League system:** Vuoi il sistema completo tipo Duolingo con promotion/demotion tra leghe? (Complesso, v3.1+) O basta weekly reset semplice per v3.0?

2. **Streak freeze:** Implementare streak freeze come feature Pro o free con limitazioni?

3. **Achievement tiers:** Preferisci badge singoli (es. "Streak 30 days") o tiered (es. Streak badge con 5 livelli: 7/14/30/90/365)?

4. **Celebration intensity:** Quanto "rumorose" le celebrazioni? Solo confetti o anche full-screen modal con dismiss manuale?

5. **Badge catalog size:** 12 badge totali (4 existing + 8 new) sufficienti per v3.0? O vuoi piu varieta?

---

## Sources

### HIGH Confidence (Codebase Verification)
- `stores/gamificationStore.ts` — Toast queue implementation verified
- `services/gamificationService.ts` — RPC integration verified
- `supabase/migrations/004_gamification_system.sql` — Full schema verified
- `supabase/migrations/005_gamification_community_hooks.sql` — Triggers verified
- `components/Gamification/*.tsx` — UI components verified
- `package.json` — Installed versions verified

### HIGH Confidence (npm Registry)
- `npm view react-native-confetti-cannon` — Version 1.5.2, pure JS, no peer deps

### MEDIUM Confidence (Competitor Analysis)
- Duolingo gamification patterns — Well-documented in wikis and public sources
- Strava gamification patterns — Documented in their engineering blog

### MEDIUM Confidence (PostgreSQL Patterns)
- Weekly leaderboard query pattern — Standard window functions
- RLS policy patterns — Supabase best practices

---

*Research completed: 2026-03-09*
*Ready for roadmap: yes*
