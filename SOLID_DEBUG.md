# AffectSync --- SOLID_DEBUG.md

## Universal Production Validation & Self-Healing Specification

> **Purpose**
>
> This document is the **final quality gate** for AffectSync. It should
> be reusable after every feature, refactor, deployment, or model
> handoff. Treat it as an autonomous QA, debugging, hardening, and
> production-readiness checklist.

------------------------------------------------------------------------

# Core Rules

-   Never assume existing functionality still works after code changes.
-   Never stop at fixing one bug.
-   After fixing an issue, continue scanning the entire application for
    regressions.
-   If one fix introduces another issue, fix both before continuing.
-   Continue until every check passes.

------------------------------------------------------------------------

# Phase 1 --- Build & Dependency Validation

Verify:

-   Clean install succeeds.
-   No missing dependencies.
-   No duplicate packages.
-   No vulnerable or abandoned packages where reasonable.
-   Production build succeeds.
-   No TypeScript/ESLint/build warnings (if applicable).

------------------------------------------------------------------------

# Phase 2 --- Environment Validation

Verify every required variable:

-   MongoDB
-   Qdrant
-   Cloudinary
-   Weather API
-   Claude API
-   JWT Secret
-   Frontend URL
-   Backend URL

Validate: - Present - Non-empty - Reachable - Correct format

If missing: - Produce a meaningful startup error. - Never crash with an
obscure stack trace.

------------------------------------------------------------------------

# Phase 3 --- Service Health Checks

Ping and validate:

-   MongoDB
-   Qdrant
-   Cloudinary
-   Weather API

Verify: - Authentication - Latency - CRUD capability (where
applicable) - Recovery after temporary failure

Expose:

GET /health

GET /health/storage

GET /health/vector

GET /health/database

------------------------------------------------------------------------

# Phase 4 --- Browser QA

Open the application.

Test every page:

-   Login
-   Dashboard
-   Wardrobe
-   Mood
-   Outfits
-   Weather Stylist
-   Saved Outfits
-   Profile

Test every:

-   Button
-   Link
-   Modal
-   Dialog
-   Dropdown
-   Search
-   Filter
-   Form
-   Upload
-   Delete
-   Edit
-   Navigation
-   Infinite scroll (if present)

Every click must produce the intended action.

No dead UI.

------------------------------------------------------------------------

# Phase 5 --- API Validation

For every endpoint:

-   Success
-   Invalid request
-   Unauthorized request
-   Missing data
-   Timeout
-   Retry
-   Rate limiting (if applicable)

Verify consistent status codes and error messages.

------------------------------------------------------------------------

# Phase 6 --- Recommendation Validation

Verify:

-   Qdrant retrieval
-   Mongo fallback
-   Weather fallback
-   Color theory
-   Mood fusion
-   Diversity
-   History penalty
-   Footwear logic
-   Accessory rotation
-   Layer selection

Generate many outfits and confirm diversity.

------------------------------------------------------------------------

# Phase 7 --- Storage Validation

Upload images.

Verify:

-   Cloudinary upload
-   Local backup
-   MongoDB metadata
-   Qdrant synchronization

Simulate Cloudinary failure.

Confirm automatic fallback.

Reconnect.

Confirm automatic synchronization.

------------------------------------------------------------------------

# Phase 8 --- Security

Verify:

-   JWT
-   Authentication
-   Authorization
-   Input validation
-   File validation
-   CORS
-   Secrets not exposed
-   No API keys in client bundle
-   No stack traces returned to users

------------------------------------------------------------------------

# Phase 9 --- Performance

Measure:

-   Initial load
-   Outfit generation
-   Image loading
-   Weather loading
-   Recommendation latency

Remove duplicate renders, unnecessary requests, and inefficient queries.

------------------------------------------------------------------------

# Phase 10 --- Deployment

Validate deployment configuration for:

-   GitHub
-   Vercel
-   Render

No localhost assumptions.

Only environment variables differ between environments.

------------------------------------------------------------------------

# Phase 11 --- Recovery Tests

Intentionally simulate:

-   MongoDB offline
-   Qdrant offline
-   Cloudinary offline
-   Weather API offline
-   Slow internet
-   Invalid API key
-   Expired token
-   Browser refresh
-   Server restart

Application must degrade gracefully and recover automatically.

------------------------------------------------------------------------

# Phase 12 --- Logging

Verify useful logs exist for:

-   Login
-   Upload
-   Recommendation
-   Weather
-   Cloudinary
-   Qdrant
-   Errors
-   Background jobs

------------------------------------------------------------------------

# Automatic Bug Sweep

Search for:

-   TODO
-   FIXME
-   console.log
-   dead code
-   unused imports
-   unreachable code
-   duplicate logic
-   memory leaks
-   race conditions
-   broken async handling

Fix them where appropriate.

------------------------------------------------------------------------

# Regression Policy

After every fix:

1.  Rebuild
2.  Restart services
3.  Re-run browser tests
4.  Re-run API tests
5.  Re-run health checks

Repeat until clean.

------------------------------------------------------------------------

# Deliverables

Produce/update:

-   PROJECT_PROGRESS.md
-   CHANGELOG.md
-   DEPLOYMENT.md
-   PRE_DEPLOY_CHECKLIST.md

Include: - completed work - remaining work - known limitations -
deployment notes

------------------------------------------------------------------------

# Definition of Done

Do not stop until ALL are true:

-   Zero broken buttons
-   Zero dead links
-   Zero failed API requests
-   Zero console errors
-   Zero runtime crashes
-   Health endpoints green
-   Cloudinary healthy (or local fallback active)
-   Qdrant healthy (or Mongo fallback active)
-   Weather fallback verified
-   Recommendation engine validated
-   Saved Outfits validated
-   Browser QA passed
-   Production build passed
-   Deployment configuration verified

Only then declare the application production-ready.
