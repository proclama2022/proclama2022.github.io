# Phase 3: Monetization - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

The app displays banner ads on tab screens for free users, and offers a one-time €4.99 Pro unlock that removes all ads and raises daily scan limits (5→15) and plant collection limits (10→unlimited). Pro status persists across app restarts and reinstalls.

</domain>

<decisions>
## Implementation Decisions

### Ad Placement and Behavior
- **Position:** Fixed at bottom of screen, always visible when scrolling
- **Loading state:** Reserve space while ad loads (no layout shift)
- **Failure state:** Hide completely if ad fails to load (clean fallback, no placeholder)
- **Scope:** Ads appear on all tab screens (not just Home)

### Pro Upgrade UX
- **Trigger strategy:** Limit-based triggers — show upgrade prompt when user hits scan or plant limit
- **Upgrade screen:** Benefits-focused modal with Pro benefits list, price, and CTA
- **Messaging:** Benefits-first — focus on limits removed (15 scans, unlimited plants) rather than price breakdown
- **CTA button:** Value-focused: "Remove Ads & Unlock All — €4.99"
- **"No subscription" message:** Prominent in upgrade modal (per success criteria)

### Pro Status Verification
- **Verification timing:** Cache locally + periodic verify (weekly)
- **Offline handling:** Trust cached Pro status when offline
- **Restore purchases:** Settings button labeled "Restore Purchases"
- **Claude's Discretion:** Verification failure handling (server error, etc.)

### Limit Enforcement UX
- **Claude's Discretion:** Scan limit modal design (reuse existing rate limit modal or new dedicated modal)
- **Claude's Discretion:** Plant limit UX (toast + modal vs inline message)
- **Claude's Discretion:** Whether to show full benefits list or context-specific benefit when hitting limits

### Claude's Discretion
- Verification failure handling (grace period, retry strategy)
- Scan limit modal integration with existing rate limit UI
- Plant limit enforcement UX details
- Pro benefits presentation at limit triggers

</decisions>

<specifics>
## Specific Ideas

- "No subscription, ever" is a key differentiator from competitors (PictureThis €30/yr, Planta €36/yr)
- Emphasize one-time payment in upgrade messaging
- Limit triggers are natural upsell moments — don't be pushy elsewhere

</specifics>

<deferred>
## Deferred Ideas

- Subscription model (alternative to one-time) — explicitly rejected for MVP
- Tiered Pro levels — future consideration
- Promotional pricing / sales — out of scope
- Family sharing — platform-dependent, defer

</deferred>

---

*Phase: 03-monetization*
*Context gathered: 2026-02-20*
