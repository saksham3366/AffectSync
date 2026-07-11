# AffectSync - Cloudinary + Local Backup Fail-Safe

## IMPORTANT

The `.env` file already contains valid Cloudinary credentials. Read them
automatically. Do not ask the user again.

## Goal

Implement a dual-storage system.

-   Primary: Cloudinary
-   Emergency Backup: backend/uploads

The application must never crash or lose uploads because Cloudinary is
unavailable.

## Upload Flow

1.  Save image to `backend/uploads`.
2.  Verify the file exists.
3.  Upload the same file to Cloudinary.
4.  If Cloudinary succeeds:
    -   Store Cloudinary URL and public_id in MongoDB.
    -   Mark `cloud_status=synced`.
    -   Keep the local file as a safety backup.
5.  If Cloudinary fails:
    -   Continue using the local file.
    -   Store the local path in MongoDB.
    -   Mark `cloud_status=pending`.
    -   Do not reject the upload.

## Image Display

If `cloud_status=synced`, serve the Cloudinary URL. Otherwise serve the
local backup automatically.

## Recovery Worker

Every 60 seconds: - Find pending uploads. - Retry Cloudinary upload. -
Update MongoDB when successful. - Continue retrying with exponential
backoff until synced.

## Startup

On every startup: - Read `.env`. - Verify Cloudinary credentials. - Test
connectivity. - If Cloudinary is unavailable, automatically enter LOCAL
STORAGE MODE.

## Delete Flow

Delete images from: - MongoDB - Qdrant - Cloudinary (if present) -
backend/uploads

## Demo Safety

If Cloudinary, internet, or its API fails: - Continue serving local
images. - Continue uploads locally. - Keep outfit generation working. -
Never crash.

## Health Endpoint

Implement `GET /health/storage` returning: - current mode - cloudinary
status - local storage status - pending uploads - last successful sync

## Final QA

Test: - Upload - Delete - Restart backend - Disconnect internet -
Reconnect internet - Verify automatic synchronization - Verify
production build

Do not finish until every scenario succeeds.
