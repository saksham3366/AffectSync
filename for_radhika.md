# AffectSync Collaboration Setup

You are helping migrate my local AffectSync project into our shared production-ready cloud infrastructure.

The project already uses:

- MongoDB Atlas (shared)
- Qdrant Cloud (shared)
- Cloudinary (shared)

The goal is:

Merge my LOCAL database into the SHARED Atlas database without losing any existing records from my teammate.

------------------------------------------------------------

IMPORTANT

Do NOT overwrite existing Atlas data.

Do NOT delete any Atlas documents.

Do NOT recreate collections.

Only MERGE missing documents.

Preserve every _id, Cloudinary URL, timestamps, and metadata.

------------------------------------------------------------

## Step 1

Pull the latest repository.

Verify all files are up to date.

------------------------------------------------------------

## Step 2

Read backend/.env

It should contain:

LOCAL_MONGO_URI=mongodb://127.0.0.1:27017/affectsync

MONGO_URI=<Shared MongoDB Atlas URI>

QDRANT_URL=<Shared Qdrant URL>

QDRANT_API_KEY=<Shared Qdrant Key>

CLOUDINARY_CLOUD_NAME=...

CLOUDINARY_API_KEY=...

CLOUDINARY_API_SECRET=...

JWT_SECRET=...

Verify all environment variables load correctly.

------------------------------------------------------------

## Step 3

Inspect the backend.

Locate:

- MongoDB connection
- Mongoose models
- ClothingItem schema
- User schema
- Recommendation logic

Understand the current architecture before making changes.

------------------------------------------------------------

## Step 4

Run the migration script.

If scripts/migrate_to_atlas.js exists:

Execute it.

If it does not exist:

Create one.

The script must:

- Connect to LOCAL MongoDB.
- Connect to Atlas.
- Read every collection.
- Detect duplicate documents.
- Insert only missing records.
- Never overwrite existing Atlas documents.
- Preserve ObjectIds.
- Preserve Cloudinary URLs.
- Preserve timestamps.
- Preserve references.

------------------------------------------------------------

## Step 5

Verify migration.

Compare:

- Collection count
- Document count
- Sample documents

Generate a migration report.

------------------------------------------------------------

## Step 6

Run image diagnostics.

Verify:

- Every ClothingItem has a Cloudinary URL.
- No /uploads paths remain.
- Repair missing URLs if possible.
- Update Qdrant payloads if required.

------------------------------------------------------------

## Step 7

Verify Qdrant.

Check:

- Vector count
- Payload metadata
- Image URLs
- Categories
- Embeddings

Re-sync only items that are missing.

------------------------------------------------------------

## Step 8

Verify Cloudinary.

Every ClothingItem should reference a valid Cloudinary image.

Never replace working URLs.

------------------------------------------------------------

## Step 9

Run backend health checks.

Verify:

✓ Login

✓ Registration

✓ JWT Authentication

✓ Wardrobe

✓ Upload Clothing

✓ Delete Clothing

✓ Outfit Generation

✓ Accessories

✓ Footwear

✓ Layers

✓ Saved Outfits

✓ Recommendation Engine

✓ Weather (if enabled)

------------------------------------------------------------

## Step 10

Generate:

COLLABORATION_REPORT.md

Include:

Collections migrated

Documents added

Duplicates skipped

Qdrant vectors

Cloudinary validation

Errors

Warnings

PASS / FAIL

------------------------------------------------------------

After completion, both developers should be able to:

- Upload clothing.
- See each other's wardrobe.
- Generate outfits from the shared wardrobe.
- Share one MongoDB Atlas database.
- Share one Qdrant Cloud instance.
- Share one Cloudinary account.

Never delete local MongoDB.

Keep it as a backup until migration is confirmed successful.