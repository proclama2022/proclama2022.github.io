# Phase 19: Level & Streak Enhancement - Context

**Status:** Ready for planning
**Created:** 2026-03-10

## Phase Boundary

Implementare Level Titles con 6 titoli + Streak Freeze system con 1 freeze/settimanale, auto-apply, timezone-aware.

### Requirements Map

| Requirement | Feature | Trigger |
|-------------|---------|---------|
| TITL-01 | Level displayed with title | Level badge ovunque |
| TITL-02 | Title in profile header | ProfileStats |
| TITL-03 | Title in leaderboard entries | Leaderboard.tsx |
| TITL-04 | Title change toast | Level-up event |
| STRK-01 | 1 streak freeze/week | Free feature |
| STRK-02 | Auto-apply freeze | Missed day |
| STRK-03 | Freeze count visible | GamificationStats, inline |
| STRK-04 | Weekly reset | Sunday 00:00 local time |
| STRK-05 | Local timezone | All streak logic |

## Design Decisions

### 1. Level Title Display Style

**Decision:** Badge + testo - Level X + titolo sotto.

Esempio in `LevelProgressCard`:
```
┌─────────────────────────────────────┐
│  Level 5                                │
│  Gardener                               │
└─────────────────────────────────────┘
```

**Esempio in `ProfileStats`:
```
┌───────────────────┐
│  🌱 Gardener      │
└───────────────────┘
```

**Esempio in `Leaderboard`:
```
┌─────────────────────────────────────────┐
│  🥇 Mario Rossi              │
│  Expert · 1250 XP                       │
└─────────────────────────────────────────┘
```

### 2. Level Title Ranges

**Decision:** Range ampi per titoli (maggior gratificazione a lungo termine)

| Level Range | Title IT | Title EN | Emoji |
|-------------|---------|----------|-------|
| 1-5 | Piantina | Seedling | 🌱 |
| 6-15 | Germoglio | Sprout | 🌿 |
| 16-30 | Giardiniere | Gardener | 👨‍🌾 |
| 31-50 | Esperto | Expert | 🎓 |
| 51-75 | Maestro | Master | 🏆 |
| 76+ | Leggenda | Legend | 👑 |

**Rationale:**
- Range ampi per non frustrare utenti che raggiung livelli lentamente
- Progressione naturale: Seedling → Sprout → Gardener → Expert → Master → Legend
- Ogni milestone di livello è un achievement significativo

### 3. Streak Freeze Indicator

**Decision:** Icona ❄️ + contatore inline con streak

**UI Pattern:**
```
🔥 7 giorni ❄️(1)     // Freeze disponibile
🔥 7 giorni ❄️(0)     // Freeze usato
🔥 3 giorni          // Senza indicatore (solo se >0)
```

**Dettagli:**
- Icona frost visibile solo se `streak_freeze_remaining > 0`
- Icona in piccolo (14px) dopo il numero di giorni
- Badge tondo per indicare count (1 o 0)
- In GamificationStats, mostrare widget dedicato con stato freeze

**GamificationStats Enhancement:**
```
┌──────────────────────────────────────┐
│  💧 Watering Streak                 │
│  🔥 7 giorni                         │
│  ❄️ 1 freeze disponibile             │
└──────────────────────────────────────┘
```

### 4. Title Change Celebration

**Decision:** Toast semplice senza confetti

**Pattern:**
- Toast message: "Nuovo titolo: Gardener!"
- Emoji del titolo nel toast (🌱🌿👨‍🌾🎓🏆👑)
- NO confetti (riservato per badge easter egg,- NO haptic (troppo invasivo per titolo)
- Same duration as regular toast (2.5s)

**Toast Kind:** `title` (nuovo tipo in gamificationStore)

### 5. Timezone Handling

**Decision:** Auto-detect da device, fallback a UTC

**Implementation:**
- Let `expo-localization` or `Intl.DateTimeFormat().resolvedOptions().timeZone` for timezone
- Fallback a UTC se detection fails
- Salvare in `user_progress.timezone` (già esistente per Phase 17)
- Aggiornare all'accesso utente se timezone cambiata
- NO settings UI - completamente automatico

**Streak Calculation:**
```typescript
// Streak break detection with timezone
const userTimezone = userProgress.timezone || 'UTC';
const today = new Date();
const todayInUserTz = formatDateInTimezone(today, userTimezone);

// Check if yesterday (in user's TZ) was a watering day
const yesterday = subtractDays(todayInUserTz, 1);
const lastWateringDate = formatDateInTimezone(progress.last_watering_date, userTimezone);

if (!isSameDay(yesterday, lastWateringDate)) {
  // Check for streak freeze
  if (progress.streak_freeze_remaining > 0) {
    // Auto-apply freeze
    progress.streak_freeze_remaining--;
  } else {
    // Break streak
    progress.watering_streak = 0;
  }
}
```

### 6. Weekly Streak Freeze Reset

**Decision:** Reset ogni domenica 00:00 local time

**Implementation:**
- Estendere `pg_cron` job esistente per league promotion
- Nuova RPC `reset_weekly_streak_freeze()`
- Eseguita insieme a `process_weekly_promotion()` (same cron job)
- Reset a 1 per tutti gli utenti
- Does NOT accumulate (sempre max 1)

**Cron Schedule:** `0 0 * * 0` (Sunday midnight UTC)

**Nota:** Il reset avviene in UTC ma il calcolo streak usa local timezone

### 7. Leaderboard Title Display

**Decision:** Titolo inline dopo il nome

**Pattern:**
```
🥇 Mario Rossi
   Expert · 1250 XP
```

**Dettagli:**
- Titolo in piccolo (12px) sotto il nome
- Colore del titolo: tinta color (es. Expert = gold)
- Non mostrare in Bronze league (troppo rumore)

## Code Context

### Reusable Assets

| Asset | Path | Usage |
|------|------|-------|
| GamificationStats | `components/Gamification/GamificationStats.tsx` | Estendere con freeze indicator |
| LevelProgressCard | `components/Gamification/LevelProgressCard.tsx` | Aggiungere titolo sotto badge |
| Leaderboard | `components/Gamification/Leaderboard.tsx` | Aggiungere titolo dopo nome |
| ProfileStats | `components/ProfileStats.tsx` | Aggiungere level title |
| gamificationStore | `stores/gamificationStore.ts` | Estendere con `kind: 'title'` toast |
| user_progress | Supabase table | Ha già timezone (Phase 17) |
| pg_cron | Supabase extension | Riutilizzare per reset settimanale |

### Integration Points

| Location | Action |
|----------|--------|
| LevelProgressCard | Aggiungere titolo sotto badge |
| GamificationStats | Aggiungere freeze indicator |
| Leaderboard | Aggiungere titolo dopo nome |
| ProfileStats | Aggiungere level title |
| gamificationStore | Aggiungere `enqueueTitleChange()` |
| supabase/migrations | Migration 009 per level titles + streak freeze |
| services/wateringService | Estendere con timezone + freeze logic |

## Translations Required

**i18n/resources/en.json** and **i18n/resources/it.json**:

```json
{
  "gamification": {
    "titles": {
      "seedling": {
        "title": "Seedling",
        "title": "Piantina"
      },
      "sprout": {
        "title": "Sprout",
        "title": "Germoglio"
      },
      "gardener": {
        "title": "Gardener",
        "title": "Giardiniere"
      },
      "expert": {
        "title": "Expert",
        "title": "Esperto"
      },
      "master": {
        "title": "Master",
        "title": "Maestro"
      },
      "legend": {
        "title": "Legend",
        "title": "Leggenda"
      }
    },
    "streak": {
      "freezeAvailable": "{{count}} freeze available",
      "freezeAvailable_one": "1 freeze available",
      "freezeUsed": "Freeze used",
      "titleChangeToast": "New title: {{title}}!"
    }
  }
}
```

## Deferred Ideas

- Badge tiers (Bronze/Silver/Gold per badge) → v3.1+
- Hidden/secret badges → v3.1+
- Streak freeze accumulation (2+/week) → Pro-only feature,- Streak freeze purchase → v3.1+
- Title-based achievements → v3.1+

## Out of Scope

- Subscription-gated streak freeze
- Negative reinforcement for title changes
- Manual timezone selection (settings UI)
- Title-based leaderboards (separate from XP)

## Claude's Discretion

- Empty state per "freeze remaining" se non ancora caricato
- Animazione transizione titolo in LevelProgressCard
- Color mapping per title (es. Gardener = green)
- Long-press su freeze indicator per info tooltip
