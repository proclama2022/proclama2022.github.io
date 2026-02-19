# Requirements: Plantid

**Defined:** 2026-02-19
**Core Value:** Rendere l'identificazione gratuita di piante accessibile con informazioni di cura — senza abbonamenti

## v1 Requirements

Sono i requisiti di MVP che devono essere contenuti nella prima release. Ogni requisito mappa a una fase del roadmap.

### Identification & Detection

- [ ] **ID-01**: User can open camera and take photo of plant part (leaf, flower, fruit, bark, auto)
- [ ] **ID-02**: User can select photo from gallery instead of camera
- [ ] **ID-03**: App sends image to PlantNet API and retrieves identification results
- [ ] **ID-04**: Results display species name (scientific + common), family, confidence score
- [x] **ID-05**: Results show alternative matches ranked by confidence (top 5)
- [x] **ID-06**: App caches identification results locally by image hash to avoid duplicate API calls
- [ ] **ID-07**: Confidence score visualized as percentage bar

### Plant Collection & Persistence

- [x] **COLL-01**: User can save identified plant to "My Plants" collection
- [x] **COLL-02**: Each saved plant stores: photo, species name, common name, date added, location nickname
- [ ] **COLL-03**: User can view list of all saved plants with thumbnail grid
- [ ] **COLL-04**: User can view detailed plant profile (species, family, photo, added date)
- [ ] **COLL-05**: User can delete plants from collection
- [x] **COLL-06**: Plant collection persists across app restarts (AsyncStorage)

### Care Information

- [ ] **CARE-01**: App shows care instructions for identified plant (water frequency, sunlight, temperature, soil)
- [ ] **CARE-02**: Care database includes 100 most common species for MVP (extensible to 500)
- [ ] **CARE-03**: If species not in care DB, app shows "Care info coming soon" fallback
- [ ] **CARE-04**: Care info includes: watering days, sunlight type, temp range, soil type, difficulty, pet toxicity
- [ ] **CARE-05**: Watering frequency stored as integer days (e.g., 7 = water every 7 days)

### Watering Reminders & Tracking

- [ ] **WATER-01**: User can mark plant as "watered today" with one tap
- [ ] **WATER-02**: App schedules local notification reminder for next watering date
- [ ] **WATER-03**: App sends daily notification at 08:00 listing all plants due for watering
- [ ] **WATER-04**: User can view watering history per plant (last 30 days)
- [ ] **WATER-05**: History shows completion rate (e.g., "5/7 watered on schedule this month")
- [ ] **WATER-06**: Notification persists if app uninstalled and reinstalled (stored in AsyncStorage)

### Rate Limiting & Usage Tracking

- [x] **RATE-01**: Free users limited to 5 identifications per calendar day
- [ ] **RATE-02**: Pro users (€4.99 unlock) limited to 15 identifications per calendar day
- [x] **RATE-03**: When limit reached, show friendly message "Limit reached. Return tomorrow or upgrade to Pro."
- [x] **RATE-04**: Usage counter persists across app restarts
- [x] **RATE-05**: Usage resets at midnight (user's local timezone)

### Monetization: Ads & Pro

- [ ] **AD-01**: AdMob banner ad displayed at bottom of Home screen
- [ ] **AD-02**: Ad-free experience requires Pro unlock (€4.99 one-time in-app purchase)
- [ ] **AD-03**: Pro status persists across reinstalls (tracked locally + via StoreKit)
- [ ] **PRO-01**: Pro unlock removes ads from all screens
- [ ] **PRO-02**: Pro unlock increases daily limits: 5 → 15 scans/day
- [ ] **PRO-03**: Pro unlock removes "save to collection" limit (free: 10 plants, Pro: unlimited)

### Multi-Language Support

- [x] **I18N-01**: App fully translated to Italian and English
- [x] **I18N-02**: Language selection in Settings persists across restarts
- [x] **I18N-03**: PlantNet results (common names) returned in selected language
- [x] **I18N-04**: Fallback to English if species has no translation for selected language

### User Interface & Navigation

- [ ] **UI-01**: Home screen shows "My Plants" grid + "Water Today" list + FAB camera button
- [ ] **UI-02**: Camera screen shows live preview + organ selector + take photo/gallery buttons
- [ ] **UI-03**: Result screen shows identified plant + confidence + care summary + "Add to Collection" button
- [ ] **UI-04**: Plant detail screen shows full care info + watering history + "Mark Watered" button
- [ ] **UI-05**: Settings screen shows language, notification time, stats, Pro unlock button, credits

### Attribution & Compliance

- [ ] **LEGAL-01**: "Powered by Pl@ntNet" logo displayed in app (Settings or Info screen)
- [ ] **LEGAL-02**: Privacy notice: "Your photos are not stored by PlantNet"
- [x] **LEGAL-03**: Rate limit compliance: max 500 API calls/day across all users via free tier

## v2 Requirements

Acknowledged but deferred to future releases. Not in current roadmap.

### Advanced Features

- **ADV-01**: Disease/pest identification for plants
- **ADV-02**: Community plant care tips (crowdsourced)
- **ADV-03**: Multi-photo identification (upload 3+ photos of same plant for improved accuracy)
- **ADV-04**: Export plant data to CSV (Pro feature)
- **ADV-05**: Home screen widget (Pro feature, iOS + Android)
- **ADV-06**: Plant growth photo timeline / before-after gallery
- **ADV-07**: Native social sharing (pre-composed message with plant photo)
- **ADV-08**: Soil moisture sensor integration
- **ADV-09**: Weather-based watering recommendations
- **ADV-10**: Subscription model (alternative to one-time Pro)

### Localization

- **LOC-01**: Spanish, French, German, Portuguese (ES, FR, DE, PT)
- **LOC-02**: Right-to-left language support (Arabic, Hebrew)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud sync / backup | Adds server cost + privacy complexity; v1 is local-only |
| Plant community/social feed | Out of scope for MVP; social features = significant UX/moderation work |
| Subscription billing | Contradicts marketing ("No subscriptions, ever"); one-time Pro is the model |
| On-device ML identification | PlantNet API sufficient for MVP; fallback to TFLite only if scale exceeds free tier |
| Real-time multiplayer garden | Extreme scope for MVP; deferred indefinitely |
| Apple Health / Google Fit integration | Out of scope; no fitness angle |
| Sensor data (soil moisture, light, humidity) | Out of scope; hardware requirements block MVP |
| VR / AR plant viewing | Out of scope; novelty feature, minimal retention impact |
| NFT / blockchain | Explicitly rejected |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ID-01 | Phase 1 | Pending |
| ID-02 | Phase 1 | Pending |
| ID-03 | Phase 1 | Pending |
| ID-04 | Phase 1 | Pending |
| ID-05 | Phase 1 | Complete |
| ID-06 | Phase 1 | Complete |
| ID-07 | Phase 1 | Pending |
| COLL-01 | Phase 1 | Pending |
| COLL-02 | Phase 1 | Pending |
| COLL-03 | Phase 1 | Pending |
| COLL-04 | Phase 1 | Pending |
| COLL-05 | Phase 1 | Pending |
| COLL-06 | Phase 1 | Pending |
| CARE-01 | Phase 1 | Pending |
| CARE-02 | Phase 1 | Pending |
| CARE-03 | Phase 1 | Pending |
| CARE-04 | Phase 1 | Pending |
| CARE-05 | Phase 1 | Pending |
| WATER-01 | Phase 2 | Pending |
| WATER-02 | Phase 2 | Pending |
| WATER-03 | Phase 2 | Pending |
| WATER-04 | Phase 2 | Pending |
| WATER-05 | Phase 2 | Pending |
| WATER-06 | Phase 2 | Pending |
| RATE-01 | Phase 1 | Complete |
| RATE-02 | Phase 3 | Pending |
| RATE-03 | Phase 1 | Complete |
| RATE-04 | Phase 1 | Complete |
| RATE-05 | Phase 1 | Complete |
| AD-01 | Phase 3 | Pending |
| AD-02 | Phase 3 | Pending |
| AD-03 | Phase 3 | Pending |
| PRO-01 | Phase 3 | Pending |
| PRO-02 | Phase 3 | Pending |
| PRO-03 | Phase 3 | Pending |
| I18N-01 | Phase 1 | Complete |
| I18N-02 | Phase 1 | Complete |
| I18N-03 | Phase 1 | Complete |
| I18N-04 | Phase 1 | Complete |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 1 | Pending |
| UI-04 | Phase 1 | Pending |
| UI-05 | Phase 1 | Pending |
| LEGAL-01 | Phase 1 | Pending |
| LEGAL-02 | Phase 1 | Pending |
| LEGAL-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

**Phase distribution:**
- Phase 1 (Foundation and Core Loop): 33 requirements
- Phase 2 (Care Features and Notifications): 6 requirements
- Phase 3 (Monetization): 7 requirements (RATE-02 + AD-01..03 + PRO-01..03)

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation*
