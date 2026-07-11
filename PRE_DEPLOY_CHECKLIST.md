# Pre-Deployment Checklist

Before deploying AffectSync to production, ensure that every item on this list is verified and passes. 

- [x] **All environment variables configured**
  - `.env` files in both root and `backend/` contain valid keys for Cloudinary, MongoDB, Qdrant, Gemini API, and JWT.

- [x] **Production build succeeds**
  - The frontend runs cleanly without missing dependencies, and the backend Express app serves the frontend statically without crashing.

- [x] **Health endpoints return OK**
  - `GET /api/health` returns `status: ok`
  - `GET /api/health/storage` confirms Dual Storage mode is active.
  - `GET /api/health/vector` confirms Qdrant vector engine connection.

- [x] **Images upload correctly**
  - Uploading a new item of clothing works seamlessly and displays immediately.

- [x] **Cloudinary fallback tested**
  - If the internet disconnects, images still upload to the local disk and enter a `pending` state for auto-recovery.

- [x] **MongoDB fallback tested**
  - If Qdrant goes offline, recommendations still function using the MongoDB fallback algorithms.

- [x] **Qdrant synchronization verified**
  - New clothing items are successfully embedded and upserted into the Qdrant `wardrobe_items` collection.

- [x] **Browser QA completed**
  - Testing of authentication, wardrobe viewing, outfit generation, deleting items, and profile updating has been successfully completed in the browser.

- [x] **No console errors**
  - No JavaScript or React hydration errors appear in the browser developer tools console.

- [x] **No failed network requests**
  - All API calls return `200 OK` or handle expected `404` errors gracefully.

---
*All checks passed. You are cleared for deployment.*
