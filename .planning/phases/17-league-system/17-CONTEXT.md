# Phase 17: League System - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Sistema di leghe stile Duolingo con promozione/retrocessione settimanale basata su XP. Utenti vengono assegnati a leghe (Bronze → Diamond), competono in leaderboard settimanali top 30, e top 10 promuovono / bottom 5 retrocedono ogni Domenica a mezzanotte (timezone locale).

Scope: Database schema per leghe, assegnazione lega, leaderboard service, cron job settimanale, UI tab leghe, badge lega visibili ovunque.

**Out of scope:** League chat, custom league names, league competitions (v3.2+).

</domain>

<decisions>
## Implementation Decisions

### League Hub Location
- Hub integrato nel Gamification Hub esistente (`app/gamification.tsx`)
- Layout a tab interno: Badge | Leghe | Sfide
- Entry point dalla Home con pulsante dedicato
- Mini-widget in Home che mostra lega attuale + posizione classifica (tap per espandere)

### Leaderboard Layout
- Lista compatta: riga per utente con avatar 32px, nome, icona lega, XP
- Info per utente: avatar, nome, livello/titolo, XP attuale (essenziali)
- Riga utente corrente sempre visibile (sticky in fondo alla lista)
- Zone evidenziate con colori sfondo:
  - Top 10: verde (zona promozione)
  - Bottom 5: rosso (zona retrocessione)
- ~8 utenti visibili prima di scroll

### Promotion Feedback
- **Promozione:** Toast animato + confetti (react-native-confetti-cannon)
- **Retrocessione:** Toast sottile senza celebrazione (informativo, non demotivante)
- **Anticipazione:** Banner countdown nel gamification hub (es. "Promozione tra 3 giorni")
- **Haptic:** Vibrazione leggera solo su promozione

### League Badge Display
- Icona accanto al nome utente (16-20px) con colore/simbolo lega
- Simboli: Bronze=🥉, Silver=🥈, Gold=🥇, Platinum=💎, Diamond=💠
- Mostrare ovunque: feed community, profili, leaderboard
- Colori classic:
  - Bronze: #CD7F32
  - Silver: #C0C0C0
  - Gold: #FFD700
  - Platinum: #E5E4E2
  - Diamond: #B9F2FF
- Display titolo: "Lvl 5 - Gardener" + badge lega se non Bronze (es. "+ Silver Member")

### Claude's Discretion
- Empty state per utenti senza lega (nuovi utenti prima dell'assegnazione)
- Animazioni transizione tra tab nel gamification hub
- Esatto posizionamento mini-widget nella Home
- Copy per toast di promozione/retrocessione (localizzato IT/EN)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`gamificationStore.ts`**: Gestisce toast queue per XP/level/badge — estendere per league events
- **`user_progress` table**: Ha già level, XP, watering_streak — aggiungere `league_tier` column
- **`award_event()` RPC**: Centralizza logica XP — estendere per triggerare promozioni
- **`badges_catalog` + `user_badges`**: Pattern per badge — aggiungere league badges (Bronze Member, Silver Member, etc.)
- **`app/gamification.tsx`**: Schermata gamification esistente — aggiungere tab interno per Leghe
- **`react-native-confetti-cannon`**: Già in dependencies — usare per celebrazione promozione
- **`expo-haptics`**: Disponibile per feedback aptico

### Established Patterns
- **Zustand stores** per stato locale (gamificationStore pattern)
- **Supabase RPC** per logica server-side (award_event pattern)
- **RLS policies** per sicurezza row-level
- **Toast queue** per eventi gamification non bloccanti
- **Tab navigation** con MaterialTopTabNavigator (già in plant detail)

### Integration Points
- **`app/(tabs)/index.tsx`**: Home — aggiungere mini-widget leghe + entry point
- **`app/gamification.tsx`**: Gamification hub — aggiungere tab Leghe
- **`components/community/PostCard.tsx`**: Feed — mostrare badge lega accanto al nome
- **`components/ProfileStats.tsx`**: Profilo — mostrare lega utente
- **`supabase/migrations/004_gamification_system.sql`**: Estendere con tabelle leghe

</code_context>

<specifics>
## Specific Ideas

- "Stile Duolingo" per leghe con 5 tier e promozione settimanale
- Leaderboard top 30 utenti per lega (come Duolingo)
- Confetti per celebrazione promozione (già in dependencies)
- Haptic feedback per rinforzare momento positivo
- Mini-widget in Home per engagement quotidiano senza aprire hub

</specifics>

<deferred>
## Deferred Ideas

- League chat/messaging — v3.2+
- League competitions/challenges — v3.2+
- Custom league names — v3.2+
- Seasonal/limited-time leagues — future consideration

</deferred>

---

*Phase: 17-league-system*
*Context gathered: 2026-03-09*
