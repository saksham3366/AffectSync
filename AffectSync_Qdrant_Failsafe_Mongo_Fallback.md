# AffectSync - Qdrant Fail-Safe & Automatic MongoDB Fallback Specification

## Objective

Qdrant is the PRIMARY vector database for AffectSync.

MongoDB is the BACKUP data source.

The application must NEVER crash or become unusable because Qdrant is
unavailable.

------------------------------------------------------------------------

# Core Principle

The user should never notice whether the application is using Qdrant or
MongoDB.

All failures must be handled automatically.

------------------------------------------------------------------------

# Startup Procedure

1.  Load environment variables.
2.  Connect to MongoDB.
3.  Attempt to connect to Qdrant.
4.  Verify:
    -   API key
    -   URL
    -   Collection exists
    -   Search works
5.  If all checks pass:
    -   Enable Qdrant Mode.
6.  If any check fails:
    -   Log the reason.
    -   Switch automatically to MongoDB Fallback Mode.
    -   Continue running normally.

Never terminate the application because Qdrant is unavailable.

------------------------------------------------------------------------

# MongoDB Fallback Mode

When Qdrant is unavailable:

-   Use MongoDB as the recommendation source.
-   Read clothing metadata from MongoDB.
-   Assemble outfits using:
    -   colour harmony
    -   category
    -   occasion
    -   emotion
    -   silhouette
    -   history penalties
-   Continue generating outfits.
-   Continue accepting uploads.
-   Continue accepting edits and deletions.

The UI must behave exactly the same.

------------------------------------------------------------------------

# Synchronization Rules

Every clothing item should contain:

-   image URL
-   category
-   colour
-   occasion
-   CLIP embedding (or enough information to regenerate it)
-   sync status

Example sync status values:

-   synced
-   vector_pending
-   vector_failed

If Qdrant write fails:

-   Save the item in MongoDB.
-   Mark it as vector_pending.
-   Queue a background synchronization task.

------------------------------------------------------------------------

# Automatic Recovery

Every 60 seconds:

1.  Check Qdrant health.
2.  If healthy:
    -   reconnect automatically
    -   create missing collection if necessary
    -   regenerate missing embeddings if needed
    -   upload every vector_pending item
    -   mark successful items as synced
3.  Resume Qdrant Mode without restarting the application.

------------------------------------------------------------------------

# Health Endpoint

Expose:

GET /health/vector

Return:

-   current mode (Qdrant / MongoDB Fallback)
-   Qdrant connection status
-   latency
-   collection status
-   pending sync count
-   last successful synchronization

------------------------------------------------------------------------

# Error Handling

Never expose raw Qdrant errors to users.

Instead:

-   log detailed diagnostics
-   show friendly messages
-   keep all core features operational

------------------------------------------------------------------------

# Browser Behaviour

The browser must never freeze because of vector database failures.

Recommendation requests should transparently use whichever backend is
available.

------------------------------------------------------------------------

# Deployment Requirements

This behaviour must work on:

-   Local Development
-   GitHub
-   Vercel
-   Render
-   MongoDB Atlas
-   Qdrant Cloud

No manual intervention should be required after deployment.

------------------------------------------------------------------------

# Definition of Done

The implementation is complete only if:

-   Invalid API keys do not crash the application.
-   Expired Qdrant credentials do not crash the application.
-   Network outages automatically trigger MongoDB fallback.
-   Uploads continue while offline from Qdrant.
-   Background synchronization restores vectors after recovery.
-   No user data is lost.
-   Users experience uninterrupted service.
