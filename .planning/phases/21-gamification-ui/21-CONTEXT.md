---
phase: 21
title: Gamification UI
created: 2026-03-11
requirements: [GMUI-01, GMUI-02, GMUI-03, GMUI-04, GMUI-05, GMUI-06]
---

# Phase 21: Gamification UI - Context

## Overview

Implementare l'hub gamification dedicato e integrare gli elementi UI nel profilo utente.

## Prior Decisions Applied

From 17-CONTEXT (League System):
- Tab layout: Badge | Leghe | Sfide
- Leaderboard: compact list con avatar 32px, sticky current user row
- League badge: emoji (🥉🥈🥇💎💠) + color per tier

From 18-CONTEXT (Extended Badges):
- Badge design: Simple emojis per tutti i badge
- Locked badge progress: 🔒 + "X/Y" format
- BadgeGrid accetta `badgeProgress: BadgeProgress[]`

From 19-CONTEXT (Level & Streak):
- Level title ranges: 1-5 Seedling, 6-15 Sprout, 16-30 Gardener, 31-50 Expert, 51-75 Master, 76+ Legend
- Streak freeze indicator: 🔥 7 giorni ❄️(1)
- Title display: Badge + text - "Level 5" + "Gardener" under

From 20-CONTEXT (Celebrations):
- Confetti events: badge, level, league_promotion only
- Cooldown: 3 seconds via `canTriggerCelebration()`
- Haptic: Success notification via expo-haptics

---

## Area 1: Hub Access (GMUI-01)

### Decision: Rotta dedicata `/gamification`

**Entry Point:**
- Bottone esistente "View Full Profile" nella gamification card del profilo
- Non aggiungere nuovo bottone icona nell'header

**Navigazione:**
- Route: `app/gamification.tsx`
- Transizione: Slide push (standard Expo Router)
- Header: Standard con freccia back + titolo "Gamification"

**Implementazione:**
```tsx
// profile.tsx (già esistente)
<TouchableOpacity onPress={() => router.push('/gamification')}>
  <Text>View Full Profile</Text>
  <Ionicons name="chevron-forward" />
</TouchableOpacity>
```

---

## Area 2: XP Progress Bar (GMUI-02)

### Decision: XP bar compatta nell'header profilo

**Posizione:**
- Header profilo, sopra/sotto l'avatar
- Sostituisce/anticipa la gamification card attuale

**Stile compatto:**
```
L5 🌱 Seedling
████████░░ 120/200 XP
```

- Livello badge: "L5" con colore brand
- Title emoji + testo: "🌱 Seedling"
- Bar: 4px height, brand color, rounded
- XP text: "120/200 XP" a destra

**Interazione:**
- Click sulla XP bar → apre hub gamification
- Touchable area include tutto il blocco

**Componente nuovo:**
- `components/Gamification/CompactLevelProgress.tsx`
- Props: `progress: UserProgress`, `onPress?: () => void`

**Implementazione:**
```tsx
// In profile.tsx header section
<TouchableOpacity onPress={() => router.push('/gamification')}>
  <CompactLevelProgress progress={gamificationSummary.progress} />
</TouchableOpacity>
```

---

## Area 3: Hub Layout (GMUI-03, GMUI-04)

### Decision: Hub con tab layout e Level card header

**Struttura schermata:**

```
┌─────────────────────────────┐
│ ← Gamification              │  <- Header standard
├─────────────────────────────┤
│  ┌─────────────────────┐    │  <- Level Card Header
│  │ L5 🌱 Seedling      │    │
│  │ ████████░░ 120/200  │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│ [Badge] [Leghe] [Sfide]     │  <- Tab bar
├─────────────────────────────┤
│                             │
│  Tab Content                │
│                             │
└─────────────────────────────┘
```

**Tab default:** Badge tab

**Header Level Card:**
- Layout: orizzontale, compatta (48px height)
- Elementi: Level badge (L5) | Title emoji + text | XP bar sottile
- Non clickable (già nell'hub)

**Badge Grid:**
- Layout: 4 colonne con scroll verticale
- Badge size: 72x72 (icon 48px + label sotto)
- Padding: 12px tra celle
- Riutilizza `BadgeGrid.tsx` con `horizontal={false}`

**Empty State (no badge):**
```
🏆
"Complete your first challenge to unlock badges!"
```
- Messaggio motivazionale centrato
- Icona trofeo 48px
- Text: i18n key `gamification.badges.emptyState`

---

## Area 4: Streak Calendar (GMUI-05)

### Decision: Calendario 7 giorni nel tab Badge

**Posizione:**
- Tab Badge, sotto la badge grid
- Separato da 16px margin

**Layout:**
```
   L   M   M   G   V   S   D
  (●) (●) (●) [●] ○   ❄️  ○

  🔥 7 giorni   ❄️(1)
```

- 7 cerchi orizzontali
- Label giorno sopra ogni cerchio
- Row indicator sotto: streak count + freeze remaining

**Stati cerchio:**
- `(●)` = Giorno completato (filled, brand color)
- `[●]` = Giorno corrente (evidenziato con bordo doppio)
- `○` = Giorno futuro/vuoto (outlined, gray)
- `❄️` = Giorno coperto da freeze (icona al posto del cerchio)

**Giorno corrente:**
- Bordo evidenziato (2px brand color + 2px white)
- Cerchio vuoto se non ancora completato

**Freeze visivo:**
- Icona ❄️ al posto del cerchio
- Colore: azzurro (#81D4FA)
- Mantieni indicatore freeze count nella row sotto

**Componente nuovo:**
- `components/Gamification/WeeklyStreakCalendar.tsx`
- Props: `streak: number`, `freezeRemaining: number`, `weekData: DayStatus[]`

```tsx
interface DayStatus {
  day: 'L' | 'M' | 'M' | 'G' | 'V' | 'S' | 'D';
  status: 'completed' | 'current' | 'future' | 'freeze';
}
```

---

## Area 5: League Badge in Community (GMUI-06)

### Decision: Mini badge vicino al nome

**Posizione:**
- Community feed post header
- Dopo il display name, prima del timestamp
- Formato: `{name} {league_badge} · {time}`

**Stile:**
- Emoji lega (🥉🥈🥇💎💠)
- Size: 14px (stesso del text)
- Non interattivo (solo display)

**Implementazione:**
```tsx
// In community post header
<Text>
  {author.display_name} <Text style={styles.leagueBadge}>
    {getLeagueEmoji(author.league_tier)}
  </Text> · {timeAgo}
</Text>
```

**Fonte dati:**
- Join con `user_progress` per ottenere `league_tier`
- API posts include già `author.league_tier`

---

## Code Context

### File esistenti da riutilizzare:
- `components/Gamification/BadgeGrid.tsx` - Grid badge esistente (modificare per 4-col vertical)
- `components/Gamification/LevelProgressCard.tsx` - Card level completa (semplificare per compact)
- `components/Gamification/GamificationStats.tsx` - Stats con streak freeze
- `components/Gamification/Leaderboard.tsx` - Leaderboard per tab Leghe
- `components/Gamification/LeagueBadge.tsx` - Badge lega

### File nuovi da creare:
- `app/gamification.tsx` - Rotta hub gamification
- `components/Gamification/CompactLevelProgress.tsx` - XP bar compatta
- `components/Gamification/WeeklyStreakCalendar.tsx` - Calendario streak
- `components/Gamification/GamificationTabs.tsx` - Tab layout (Badge|Leghe|Sfide)

### Modifiche necessarie:
- `app/(tabs)/profile.tsx` - Aggiungere XP bar compatta nell'header
- `components/Gamification/BadgeGrid.tsx` - Supportare grid verticale 4-col

---

## Requirements Traceability

| ID | Requirement | Decision |
|----|-------------|----------|
| GMUI-01 | Access hub from profile | Rotta dedicata `/gamification`, bottone esistente |
| GMUI-02 | XP bar in profile header | CompactLevelProgress nell'header, click → hub |
| GMUI-03 | Level, title, XP in hub | Level card header compatta |
| GMUI-04 | Badge grid locked/unlocked | 4-col grid verticale, empty state motivazionale |
| GMUI-05 | Weekly streak calendar | 7 cerchi nel tab Badge, ❄️ per freeze |
| GMUI-06 | League badge in community | Emoji 14px dopo display name |
