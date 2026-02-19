# Feature Landscape: Plant Identification Apps

**Domain:** Plant identification + care tracking mobile app
**Researched:** 2026-02-19
**Confidence note:** Web/WebFetch tools unavailable in this session. Analysis is based on training knowledge (cutoff Aug 2025) of PictureThis, Planta, PlantNet, iNaturalist, Blossom, LeafSnap, PlantIn, and Greg. Confidence levels reflect source quality.

---

## Table Stakes

Features users expect in any plant identification app. Absence signals an incomplete, unfinished product and drives negative reviews. These must all ship in or before MVP.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Camera-based plant identification | Core purpose of the app category | Low | PlantNet API handles this; UX around it matters most |
| Gallery / photo upload identification | Users want to ID plants from existing photos | Low | Already in plan; required day one |
| Confidence score display | Users need to know how certain the ID is | Low | PlantNet returns this natively; show it clearly |
| Multiple result candidates | ID is often ambiguous; showing top 3 alternatives is standard | Low | PlantNet returns ranked list; display top 3 |
| Scientific + common name display | Both are expected; hobbyists want common names, enthusiasts want scientific | Low | PlantNet returns both in selected language |
| Basic care information | Watering frequency, light needs, temperature range | Medium | Local DB required; this is the non-PlantNet work |
| Save identified plant to a personal collection | Users build a garden/plant journal | Low | AsyncStorage, already in plan |
| Watering reminders (push notifications) | The #1 pain point in plant care apps; expected if care info is shown | Medium | Local scheduled notifications; already in plan |
| Watering history / tracking | Users want to confirm they did water and see patterns | Low-Medium | Companion to reminders; already in plan |
| Organ type selection (leaf / flower / fruit / bark) | PlantNet accuracy is significantly better with organ type specified; sophisticated users know this | Low | Already in plan; include "auto" fallback |
| Plant photo attached to saved plant | Users expect to see the photo they took, not just text | Low | Store image URI locally |
| Free tier with daily scan limit | Standard freemium gate for plant ID apps | Low | 5/day free, already in plan |

**MEDIUM confidence** — Based on training data; competitive review of App Store listings would increase confidence to HIGH.

---

## Differentiators

Features that create competitive advantage for this specific product. The project's positioning is "free forever, no subscription" vs PictureThis (€30/yr) and Planta (€36/yr). Differentiators should reinforce this or add genuine utility competitors do not.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| One-time Pro unlock (€4.99, no subscription) | Primary marketing angle — explicit anti-subscription positioning | Low | Already in plan; make it prominent in-app |
| "No subscription, ever" messaging in onboarding | Converts skeptical users who abandoned PictureThis/Planta over pricing | Low | Copy/UX work only; zero engineering |
| Offline-first architecture (local DB + cache) | Competitors require internet for care info; this app works offline after first ID | Medium | Local care DB + AsyncStorage cache already planned |
| Plant notes field | Competitors often gate this behind premium; a free notes field builds habit and daily active use | Low | Simple text field per plant |
| Per-plant nickname | Users name their plants emotionally ("Lavi"); nicknames drive retention by increasing attachment | Low | Already in the plan.md wireframe |
| Watering compliance statistics (% on-time) | Gamification-lite; shows users their streak/accuracy without building a full gamification system | Low | Pure calculation from history data |
| Privacy-first messaging (no images stored server-side) | PlantNet explicitly does not persist images; this is a genuine differentiator vs competitors that train on user photos | Low | Marketing/copy work; true by architecture |
| Multi-photo identification (up to 5 images per scan) | PlantNet supports 1-5 images in one request for higher accuracy; competitors rarely surface this | Low | UX addition to camera screen; same API cost |
| Customizable notification time | Users with different routines want to set their own reminder time | Low | Single time picker in settings; already in wireframe |

**MEDIUM confidence** — The offline-first and one-time pricing differentiators are validated by the project plan. The privacy messaging angle is confirmed by PlantNet's documented behavior.

---

## Anti-Features

Features to deliberately not build. These either create scope creep that derails MVP, replicate what free competitors already provide better, or introduce costs/complexity disproportionate to value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Social / community feed | Massive scope; network effects make this worthless at low user counts; PictureThis has this and it's rarely the reason users choose it | Build social sharing as a one-tap "share identification" deep link to native share sheet in Phase 2 |
| In-app plant disease diagnosis | High user expectation, high accuracy requirement, requires a separate trained model or paid API; PlantNet does not cover this | Add to PITFALLS.md as a v2+ feature requiring its own research phase |
| Subscription pricing | Direct contradiction of the core value proposition; once introduced it cannot be removed without backlash | One-time unlock only, forever |
| Cloud sync / account system | Server cost, auth complexity, GDPR obligations, and user friction in onboarding; kills "zero server" architecture | Full local storage; if sync is needed later, use iCloud/Google Drive backup as an opt-in native feature |
| Video identification | High API cost, not supported by PlantNet free tier, marginal accuracy improvement over multi-photo | Multi-photo (up to 5 frames) already gives most of the benefit |
| AR plant overlay | Technically impressive but adds months of development for marginal utility; no leading plant app has succeeded with this | Ship without AR; revisit only if category moves toward it |
| Marketplace (buy plants, tools) | Completely different business model, requires merchant relationships, out of scope | If monetization needs diversification, use affiliate deep links to Amazon/local nurseries (low effort, passive revenue) |
| "Ask an expert" / chat feature | Requires support staff or AI costs; PictureThis offers this but it's a premium feature with high churn risk | Static care tips in local DB; add AI-generated care tips (on-device or low-cost API) as a future differentiator |
| Real-time multiplayer plant ID challenges | Gimmick; no evidence of market demand | Ignore entirely |

---

## Feature Dependencies

```
Camera access permission → Plant identification (camera)
Plant identification → Save plant to collection
Save plant to collection → Watering reminders
Save plant to collection → Watering history tracking
Watering history tracking → Compliance statistics
Local care DB (species data) → Care information display
Local care DB → Watering frequency (used by reminders)
Rate limiter (daily scan count) → Free tier enforcement
Rate limiter → Pro unlock paywall trigger
In-app purchase (IAP) setup → Pro unlock
Push notification permission → Watering reminders
```

Critical path: **Camera permission → PlantNet API → Local care DB → Save plant → Notifications**

Everything else is either parallel work or dependent on the core loop completing.

---

## MVP Recommendation

Ship these in Phase 1 (2-3 weeks):

1. Camera + gallery identification via PlantNet API
2. Confidence score + top 3 candidates display
3. Care info from local DB (start with 100-150 species; expand in Phase 2)
4. Save identified plant to local collection (with photo, nickname, notes)
5. Basic watering reminders (one daily push notification listing due plants)
6. Free tier rate limiting (5 scans/day, gated message at limit)
7. "Powered by Pl@ntNet" attribution (required by API terms)

Phase 2 (weeks 4-5):

8. Watering history + compliance statistics
9. Customizable notification time
10. Expand care DB to 300-500 species
11. Gallery upload with multi-photo flow (2-5 images for better accuracy)
12. Plant notes field

Phase 3 (week 6):

13. AdMob banner integration
14. Pro in-app purchase (€4.99 one-time)
15. Pro unlock: remove ads + raise scan limit to 15/day + unlimited saved plants

Defer explicitly:

- Social sharing: Phase 4 (native share sheet, 1 day of work, fine to delay)
- Export CSV: Phase 4 Pro feature (low priority, low usage)
- Widget: Phase 4 Pro feature (Expo requires bare workflow or third-party lib; assess feasibility separately)
- Disease diagnosis: Requires dedicated research; do not estimate until researched
- Additional languages (ES, FR, DE): Phase 4+; PlantNet returns names in target language automatically, so marginal effort once i18n scaffolding exists

---

## Competitive Context

| Feature | PictureThis | Planta | PlantNet (free) | This App |
|---------|------------|--------|-----------------|----------|
| Plant identification | HIGH accuracy, proprietary model | Moderate | MEDIUM-HIGH, open science | PlantNet (same engine) |
| Care information | Extensive, AI-generated | Extensive, specialist-reviewed | None | Local DB (controllable quality) |
| Watering reminders | Yes (paid) | Yes (core feature) | No | Yes (free tier) |
| Offline | Partial (cached results) | No | No | Yes (local DB + image cache) |
| Price | €30/year | €36/year | Free (limited features) | Free + €4.99 one-time |
| Disease diagnosis | Yes (paid) | Limited | No | No (explicitly excluded) |
| Social community | Yes | No | Yes (iNaturalist integration) | No (Phase 4+) |
| No subscription | No | No | Yes but no care features | **Yes — core differentiator** |

**Confidence:** MEDIUM. Based on training data through Aug 2025. Pricing and feature sets of competitors shift; verify current App Store listings before making marketing claims.

---

## What Makes or Breaks This App

### Makes it

- The local care DB quality. PlantNet gives accurate species IDs. What users stay for is "now tell me how to keep it alive." The depth and accuracy of the local care database is the product. Generic "water once a week" data is a 1-star review; species-specific, seasonally-aware data is a 5-star review. Invest here.
- Notification reliability. If watering reminders don't fire, users churn. Expo's local notification system is generally reliable but has known edge cases on Android (battery optimization, exact alarm permissions on Android 12+). Test this explicitly before launch.
- Scan limit UX. The "you've hit your limit" message is the highest-stakes moment in the free user experience. It must not feel like a wall — it must feel like a natural invitation to Pro. Poor copy here = uninstall.

### Breaks it

- Care data for uncommon species showing nothing (just "care info coming soon"). If the API identifies an unusual plant but the app has no care data, the user experience collapses at the exact moment of success. Build the fallback gracefully (show PlantNet reference images + Wikipedia link) and invest in broader DB coverage.
- Android notification permission friction (Android 13+ requires explicit runtime permission request). Handle this in onboarding flow, not lazily on first plant save.
- Ambiguous confidence scores. A 48% PlantNet match shown without context ("48% — this is a guess, consider taking a clearer photo of a single leaf") causes confusion. Provide qualitative labels (High / Medium / Low / Uncertain) alongside raw scores.

---

## Sources

- Training data: PictureThis (App Store listing, web, help center), Planta (App Store), PlantNet (my-api.plantnet.org documentation), iNaturalist (web), Blossom, LeafSnap, Greg — knowledge cutoff Aug 2025. **MEDIUM confidence overall.**
- Project plan: `/Users/martha2022/Documents/Claude code/Plantid/plan.md` — details on PlantNet API behavior, monetization model, wireframes. **HIGH confidence** (primary source).
- Project context: `.planning/PROJECT.md` — validated requirements, constraints, stack decisions. **HIGH confidence** (primary source).
- Note: WebSearch and WebFetch were unavailable during this research session. App Store competitive feature listings should be manually verified before finalizing marketing copy.
