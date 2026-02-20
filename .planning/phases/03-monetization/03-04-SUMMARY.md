---
phase: 03-monetization
plan: 04
type: execute
wave: 3
depends_on: ["03-01", "03-03"]
autonomous: true
requirements: ["AD-02", "PRO-01", "PRO-02", "PRO-03"]
files_modified:
  - components/ProUpgradeModal.tsx
  - app/(tabs)/settings.tsx
  - i18n/en.ts
  - i18n/it.ts
  - app/(tabs)/camera.tsx
  - components/Results/ResultCard.tsx
  - hooks/useRateLimit.ts
---

# Phase 03 Plan 04: Pro Upgrade UI Summary

**One-liner:** Created Pro upgrade modal with benefits list, purchase flow, Settings integration, and limit-triggered upsell at scan/collection limits — one-time €4.99 pricing with prominent "No subscription" messaging.

**Tasks Completed:** 4/4
**Duration:** 376 seconds (6 minutes)
**Commits:** 5

## Overview

Implemented the complete Pro upgrade UI including modal component, Settings screen integration, bilingual translations, and automatic trigger points when users hit free tier limits. The modal emphasizes the one-time payment model (no subscription) as a key differentiator from competitors (PictureThis €30/yr, Planta €36/yr).

## Files Created

| File | Purpose |
|------|---------|
| `components/ProUpgradeModal.tsx` | Upgrade modal with benefits list, purchase button, loading state, error handling |

## Files Modified

| File | Changes |
|------|---------|
| `app/(tabs)/settings.tsx` | Added Pro status badge, upgrade/restore buttons, ProUpgradeModal integration |
| `i18n/resources/en.json` | Added 19 Pro translation keys (benefits, pricing, errors) |
| `i18n/resources/it.json` | Added 19 Italian Pro translation keys (formal Lei form) |
| `app/(tabs)/camera.tsx` | Integrated upgrade modal at scan limit (3 trigger points) |
| `components/Results/ResultCard.tsx` | Integrated upgrade modal at collection limit |

## Key Features Implemented

### ProUpgradeModal Component
- Benefits list with icons: 15 scans/day, unlimited plants, no ads, one-time purchase
- Prominent "No subscription, ever" message in green banner
- €4.99 one-time pricing display
- Purchase button with loading state and activity indicator
- Error handling with toast messages (network error, purchase failed)
- Trigger reason tracking: `scan_limit`, `collection_limit`, `manual`
- Closes automatically on successful purchase

### Settings Screen Integration
- **Pro status badge:** Gold "Pro" badge with diamond icon for Pro users, gray "Free" badge for free users
- **Upgrade CTA button:** Green "Upgrade to Pro" button for free users only
- **Thank you message:** "Thank you for being a Pro user!" with heart icon for Pro users
- **Restore purchases button:** Secondary button for all users (App Store requirement)
- Success/error alerts after restore attempt
- ProUpgradeModal integration with `triggerReason="manual"`

### Translation Keys
English and Italian translations for:
- Modal titles and subtitles
- Benefit descriptions (4 items)
- Pricing display
- CTA button text
- Success/error messages
- "No subscription, ever" messaging
- Terms note (App Store attribution)

### Limit Trigger Integration
**Camera screen (scan limit):**
- `takePicture`: Show modal before capture when `!allowed`
- `pickFromGallery`: Show modal before gallery open when `!allowed`
- `handleOrganSelect`: Show modal after `useScan()` returns false
- Trigger reason: `scan_limit`

**ResultCard component (collection limit):**
- `handleAdd`: Show modal when `addPlant()` returns `false`
- Trigger reason: `collection_limit`

## Deviations from Plan

**Auto-fixed Issues:**

**1. [Rule 1 - Bug] Fixed PurchaseError type checking**
- **Found during:** Task 4 verification (TypeScript compilation)
- **Issue:** ProUpgradeModal compared PurchaseError object to string literals
- **Fix:** Changed `result.error === 'user_cancelled'` to `result.error.type === 'user_cancelled'` to match discriminated union type definition
- **Files modified:** `components/ProUpgradeModal.tsx`
- **Commit:** d7f74e5

## Verification Results

- [x] TypeScript compiles without errors
- [x] ProUpgradeModal component exists with all required sections
- [x] Modal shows benefits, price, "No subscription" message
- [x] Purchase button works with loading state
- [x] Settings screen has Pro status badge
- [x] Settings has "Upgrade to Pro" button (free users only)
- [x] Settings has "Restore Purchases" button (all users)
- [x] Upgrade modal triggered at scan limit (camera.tsx, 3 points)
- [x] Upgrade modal triggered at collection limit (ResultCard.tsx)
- [x] All translations exist in both languages (EN/IT)

## Commits

| Hash | Type | Message |
|------|------|---------|
| 01fb352 | feat | create ProUpgradeModal component with benefits list |
| 6c9c832 | feat | add Pro translation keys for upgrade modal |
| ba64408 | feat | add Pro upgrade UI to Settings screen |
| 8a58eac | feat | integrate upgrade modal with limit triggers |
| d7f74e5 | fix | correct PurchaseError type checking in ProUpgradeModal |

## Dependencies Handled

- **03-01 (Pro Status Management):** Uses `useProStatus` hook and `useProStore` from plan 01
- **03-03 (Rate Limiting):** Integrates with `useRateLimit` hook's `allowed` boolean and `useScan()` function

## Integration Points

- `hooks/useProStatus.ts`: Purchase and restore functionality
- `stores/proStore.ts`: Pro status tracking (isPro boolean)
- `hooks/useRateLimit.ts`: Scan limit enforcement (allowed, remaining, limit)
- `stores/plantsStore.ts`: addPlant() returns boolean for collection limit check

## Next Steps

- **Plan 03-05:** Store listing and screenshots (Pro plan preparation)
- **Testing:** Verify purchase flow works with real RevenueCat sandbox
- **Analytics:** Track upgrade modal impressions and conversion rate
