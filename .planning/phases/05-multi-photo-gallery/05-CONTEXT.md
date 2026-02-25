# Phase 5: Multi-Photo Gallery - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Display multiple photos per plant with thumbnail grid, full-screen lightbox view, ability to set primary photo and delete photos. Includes data migration from single photo to array-based storage. Custom reminders are Phase 6 — out of scope.

</domain>

<decisions>
## Implementation Decisions

### Thumbnail Grid Layout
- 3-column grid layout
- Square-cropped thumbnails (Instagram-like)
- Badge indicator (star/dot) on primary photo thumbnail
- Empty state: placeholder with "+" button to add first photo

### Lightbox Experience
- Swipe left/right gestures to navigate between photos
- Pinch-to-zoom enabled for zooming in
- Visible action bar with Set Primary + Delete icon buttons
- Close button in top-left corner (standard iOS/Android pattern)

### Add Photo Flow
- Both camera and gallery sources (action sheet to choose)
- Inline "Add photo" button in grid area, always visible
- Single photo per add action (no multi-select)
- New photo automatically becomes primary

### Primary & Delete UX
- Set primary: lightbox action bar when viewing the desired photo
- Delete: confirmation dialog with "Delete" and "Cancel" buttons
- Delete triggered from lightbox action bar
- Deleting the only photo: allowed with warning that this clears the primary

### Claude's Discretion
- Exact badge style for primary photo indicator
- Transition animations (grid to lightbox, between photos)
- Loading states for image display
- Exact confirmation dialog wording

</decisions>

<specifics>
## Specific Ideas

- No specific app references — standard photo gallery patterns expected
- Keep it simple, match existing app visual style

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-multi-photo-gallery*
*Context gathered: 2026-02-25*
