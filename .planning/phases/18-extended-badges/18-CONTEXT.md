# Phase 18: Extended Badges - Context

**Status:** Ready for planning
**Created:** 2026-03-09

## Phase Boundary

Implementare 8 nuovi badge (BADG-01..08) + visualizzazione progresso badge bloccati (BADG-09..10).

### Requirements Map

| Requirement | Badge | Trigger |
|-------------|-------|---------|
| BADG-01 | First Plant | `plant_added` (count = 1) |
| BADG-02 | Green Thumb | `watering_streak >= 7` |
| BADG-03 | Plant Parent | `plant_added` (count >= 10) |
| BADG-04 | Community Star | `likes_received` (total >= 50) |
| BADG-05 | Early Bird | Watering before 7am local time |
| BADG-06 | Weekend Warrior | All weekend care tasks completed |
| BADG-07 | Plant Doctor | `plant_identified` with disease (count >= 5) |
| BADG-08 | Social Butterfly | `followers_gained` (total >= 10) |
| BADG-09 | View earned badges | BadgeGrid (already implemented) |
| BADG-10 | View locked progress | NEW: progress indicator |

## Design Decisions

### 1. Badge Visual Design

**Decision:** Emoji semplici per tutti i badge.

| Badge Key | Emoji | Title IT | Description IT |
|-----------|-------|----------|----------------|
| `first_plant` | 🌱 | Prima Pianta | Hai identificato la tua prima pianta! |
| `green_thumb` | 🌿 | Pollice Verde | 7 giorni di fila di annaffiature |
| `plant_parent` | 👨‍🌾 | Genitore di Piante | Hai aggiunto 10 piante alla collezione |
| `community_star` | ⭐ | Stella della Community | Hai ricevuto 50 like totali |
| `early_bird` | 🌅 | Mattiniero | Hai annaffiato prima delle 7:00 |
| `weekend_warrior` | 🏋️ | Weekend Warrior | Hai completato tutte le cure nel weekend |
| `plant_doctor` | 🩺 | Dottore delle Piante | Hai identificato 5 piante malate |
| `social_butterfly` | 🦋 | Farfalla Sociale | Hai raggiunto 10 follower |

### 2. Badge Unlock Celebration

**Decision:** Animazione leggera con toast.

- Toast con fade-in + leggera scala (0.9 → 1.0)
- NO confetti (troppo pesante per badge frequenti)
- Emoji del badge visibile nel toast
- Messaggio: "Badge sbloccato: [Nome Badge]"

### 3. Locked Badge Progress

**Decision:** Progresso mostrato sulla card, formato testo, calcolo server-side.

**UI:**
- Badge bloccato mostra 🔒 + progresso "X/Y"
- Esempio: "3/10 piante" per Plant Parent
- BadgeGrid prop `badgeProgress: Record<string, { current: number; target: number }>`

**Server-side:**
- Estendere `getUserGamificationSummary()` per restituire progresso badge
- Nuova RPC o estendere query esistente

### 4. Badge Trigger Mechanism

**Decision:** Estendere `award_gamification_badges` RPC esistente.

**Pattern:**
1. Evento utente → `award_event` RPC → XP assegnato
2. `award_gamification_badges` chiamata internamente
3. RPC controlla tutti i badge conditions
4. Se soddisfatte, INSERT in `user_badges` + restituisce badge_keys assegnate

**New Event Types:**

| Event Type | Trigger Location | Metadata |
|------------|------------------|----------|
| `plant_identified` | PlantNet service | `{ plant_id, has_disease: boolean }` |
| `likes_received` | Post like hook | `{ post_id, like_count_delta }` |
| `followers_gained` | Follow service | `{ follower_id, total_followers }` |

**Existing Events Used:**

| Event Type | Badge |
|------------|-------|
| `plant_added` | First Plant, Plant Parent |
| `watering_completed` | Green Thumb, Early Bird, Weekend Warrior |

### 5. Badge Logic Details

**Green Thumb (7-day streak):**
- Già calcolato in `user_progress.watering_streak`
- Controllo in `award_gamification_badges`: `IF p_watering_streak >= 7`

**Early Bird (before 7am):**
- Passare `watering_time` nei metadata di `watering_completed`
- RPC controlla: `EXTRACT(HOUR FROM p_watering_time AT TIME ZONE user_timezone) < 7`
- Richiede timezone utente in `user_progress.timezone`

**Weekend Warrior:**
- Contare `watering_completed` eventi con `event_date` = Sabato O Domenica
- Check: tutte le piante attive hanno evento nel weekend corrente
- Complesso → potrebbe richiedere batch job dedicato (opzionale per v3.0)

**Plant Doctor:**
- Metadata `has_disease: true` in `plant_identified` event
- Contare eventi con metadata->>'has_disease' = 'true'

## Code Context

### Reusable Assets

| Asset | Path | Usage |
|-------|------|-------|
| BadgeGrid | `components/Gamification/BadgeGrid.tsx` | Estendere con progress prop |
| gamificationStore | `stores/gamificationStore.ts` | Toast queue esistente per badge |
| gamificationService | `services/gamificationService.ts` | Estendere con nuovi award functions |
| badges_catalog | Supabase table | INSERT nuovi 8 badge |
| award_gamification_badges | Supabase RPC | Estendere logica badge |
| user_badges | Supabase table | Già supporta progress tracking |

### Integration Points

| Location | Action |
|----------|--------|
| PlantNet identification | Call `awardPlantIdentifiedEvent()` |
| Post like (received) | Call `awardLikesReceivedEvent()` |
| Follow (gained) | Call `awardFollowersGainedEvent()` |
| BadgeGrid | Add `badgeProgress` prop |
| gamificationService | Add new award functions |

## Translations Required

**i18n/resources/en.json** and **i18n/resources/it.json**:

```json
{
  "gamification": {
    "badges": {
      "first_plant": {
        "title": "First Plant",
        "description": "You identified your first plant!"
      },
      "green_thumb": {
        "title": "Green Thumb",
        "description": "7 days of consecutive watering"
      },
      "plant_parent": {
        "title": "Plant Parent",
        "description": "You added 10 plants to your collection"
      },
      "community_star": {
        "title": "Community Star",
        "description": "You received 50 total likes"
      },
      "early_bird": {
        "title": "Early Bird",
        "description": "You watered before 7:00 AM"
      },
      "weekend_warrior": {
        "title": "Weekend Warrior",
        "description": "You completed all weekend care tasks"
      },
      "plant_doctor": {
        "title": "Plant Doctor",
        "description": "You identified 5 diseased plants"
      },
      "social_butterfly": {
        "title": "Social Butterfly",
        "description": "You gained 10 followers"
      }
    }
  }
}
```

## Deferred Ideas

- Badge tiers (Bronze/Silver/Gold per badge) → v3.1+
- Hidden/secret badges → v3.1+
- Seasonal badges → v3.1+
- Full-screen celebration modal → v3.1+
- Celebration sound effects → v3.1+

## Out of Scope

- Real-money/gambling mechanics
- Negative reinforcement
- Leaderboard manipulation
- Subscription-gated badges
