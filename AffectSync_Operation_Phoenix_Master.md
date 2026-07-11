# AffectSync --- Operation Phoenix

## Production Readiness Master Specification (Post-Audit)

> **Mission**
>
> Treat this repository as a commercial SaaS product. Your objective is
> to continue from the **current verified project state** and deliver a
> fully deployable, production-grade AI wardrobe platform. Never restart
> work already verified unless a regression is detected.

------------------------------------------------------------------------

# 0. Ground Rules

## Never

-   Re-test already verified features unless modified.
-   Replace working code with placeholders.
-   Silence errors without finding the root cause.
-   Skip browser validation after code changes.
-   Finish while any critical bug remains.

## Always

-   Keep an internal progress checklist.
-   Mark completed items.
-   Continue from the next unfinished task.
-   After every fix:
    1.  Build
    2.  Run
    3.  Browser-test
    4.  Check console
    5.  Check network requests
    6.  Commit only if no regressions

------------------------------------------------------------------------

# 1. Current Verified State

DO NOT repeat unless regression occurs.

-   Authentication works
-   Dashboard works
-   Wardrobe CRUD mostly functional
-   Recommendation endpoint works
-   Loading spinner works
-   New Outfit generates alternatives
-   Profile works
-   Mood detection flow works
-   No major browser console errors

------------------------------------------------------------------------

# 2. Critical Issues (Highest Priority)

1.  Fix renderOutfitCombo() so it renders:
    -   Top
    -   Bottom
    -   Accessories
    -   Footwear
    -   Optional Layer
2.  Add X Pieces badge.
3.  Fix wardrobe sidebar active-state highlighting.
4.  Fix toolbar CSS grid mismatch.
5.  Remove repetitive outfit combinations.

------------------------------------------------------------------------

# 3. Recommendation Engine

Implement weighted ranking using:

-   Emotion score
-   Colour harmony
-   Style compatibility
-   Occasion
-   Season
-   Silhouette balance
-   Recently worn penalty
-   Diversity bonus
-   Accessory compatibility
-   Footwear compatibility

Layers are optional. Accessories should always be considered if
available. Footwear should always be considered if available.

------------------------------------------------------------------------

# 4. Qdrant Reliability (Primary Engine)

Qdrant is the primary vector database.

## Startup

-   Automatically detect whether Qdrant is running.
-   If unreachable, attempt reconnect with exponential backoff.
-   If local instance fails, automatically switch to configured Qdrant
    Cloud endpoint.
-   Validate collection existence on startup.
-   Create missing collections automatically.
-   Verify vector dimension before inserts.

## Health Checks

Implement a /health/vector endpoint that checks: - Connectivity -
Collection existence - Vector count - Insert test - Search test -
Response latency

Log failures with actionable diagnostics.

## Synchronization

Every upload/update/delete must be transactional across: - MongoDB -
Cloudinary - Qdrant

If Qdrant write fails: - Queue the operation for retry. - Keep MongoDB
marked as "vector_pending". - Retry in the background until
synchronized.

## Retrieval

Optimize: - HNSW parameters - Top-K search - Metadata filters - Hybrid
reranking - Diversity reranking - History penalties

Never recommend the same combination repeatedly unless no alternatives
exist.

------------------------------------------------------------------------

# 5. Browser QA

Verify every: - Button - Modal - Form - Upload - Delete - Edit -
Navigation - Loading state - Error state

Every click must perform meaningful work.

------------------------------------------------------------------------

# 6. Performance

Target: - Outfit generation \< 2 seconds - Minimal duplicate API calls -
Lazy loaded images - Optimized React rendering - Efficient vector
queries

------------------------------------------------------------------------

# 7. Deployment

The project must deploy without code changes to: - GitHub - Vercel -
Render - MongoDB Atlas - Qdrant Cloud - Cloudinary

No localhost assumptions. No manual edits after deployment.

------------------------------------------------------------------------

# 8. Terminal Authority

If terminal access is available: - Diagnose and repair Qdrant
automatically. - Start missing services. - Verify environment
variables. - Install missing dependencies. - Repair broken migrations. -
Validate production builds. - Execute end-to-end browser testing after
fixes.

Do not require user intervention unless credentials or billing are
genuinely required.

------------------------------------------------------------------------

# Definition of Done

Do not stop until ALL are true:

-   Qdrant healthy
-   Vector sync verified
-   Outfit recommendations include accessories and footwear
-   Layers intelligently selected
-   Diverse recommendations
-   Zero broken buttons
-   Zero failed API requests
-   Zero runtime crashes
-   Responsive UI
-   Clean production build
-   Successful deployment configuration
-   Application suitable for public release
