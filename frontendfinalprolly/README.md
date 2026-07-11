# AffectSync Frontend

Run the dependency-free frontend:

```powershell
node server.js
```

Open `http://localhost:4173`.

## API integration

The frontend exposes `window.AffectSyncAPI` in `app.js` with these expected routes:

- `POST http://localhost:5000/predict` - Flask/OpenCV emotion detection. Accepts multipart field `image`.
- `GET /api/wardrobe` - Mongo wardrobe inventory.
- `POST /api/wardrobe` - Multer upload. Accepts multipart field `image`.
- `POST /api/outfits/generate` - outfit generation from `{ mood, wardrobeIds }`.
- `GET /api/history` - mood and outfit history.

Override service URLs before loading the site:

```js
localStorage.setItem("affectsync-ai-url", "http://localhost:5000");
localStorage.setItem("affectsync-api-url", "http://localhost:3000/api");
```

The UI uses local demo data whenever the backend is unavailable, so frontend work can continue independently.
