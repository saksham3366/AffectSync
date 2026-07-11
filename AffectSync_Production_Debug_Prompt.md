# AffectSync Wardrobe Intelligence -- Complete End-to-End QA, Feature Completion & Production Readiness

You have full control over the browser, terminal, and development
environment. Your objective is **not just to fix individual bugs**, but
to transform this project into a **production-ready, fully deployable
SaaS application** that behaves like a professional commercial product.

## Login Credentials

-   **Username:** `radz`
-   **Password:** `2006`

Use this account for all testing because it already contains wardrobe
uploads.

## PHASES

1.  Understand the complete architecture (React, Express, FastAPI,
    MongoDB, Qdrant, Cloudinary, Claude API).
2.  Start and verify every service.
3.  Open the application in a browser and manually test every page.
4.  Verify every button, form, modal, navigation item, upload, delete,
    edit, and save action.
5.  Fix all non-functional buttons and broken event handlers.
6.  Improve outfit generation:
    -   Always recommend Top + Bottom.
    -   Include Accessories whenever available.
    -   Include Footwear when uploaded.
    -   Include Layer only when it improves the outfit.
7.  Optimize recommendation intelligence:
    -   Increase diversity.
    -   Prevent repetitive combinations.
    -   Use history penalties, outfit scoring, reranking, accessory
        variation, and footwear variation.
8.  Optimize Qdrant:
    -   Better ANN search.
    -   Better metadata filtering.
    -   Better Top-K retrieval.
    -   Lower latency.
    -   Higher quality combinations.
9.  Verify wardrobe CRUD and synchronization across MongoDB, Cloudinary,
    and Qdrant.
10. Validate the complete AI pipeline: Webcam → Emotion Detection →
    DeepFace → CLIP → Qdrant → Outfit Assembly → Claude API → Frontend.
11. Polish UI/UX: Responsive layouts, animations, spacing, loading
    states, dark mode, hover effects.
12. Optimize performance: API latency, bundle size, unnecessary renders,
    database queries, and vector search.
13. Prepare production deployment: GitHub, Vercel, Render, MongoDB
    Atlas, Cloudinary, and Qdrant Cloud.
14. Stress-test with uploads, recommendations, invalid inputs, API
    failures, and multiple sessions.
15. Perform a final end-to-end verification.

## Success Criteria

-   No broken buttons
-   No console errors
-   No failed API requests
-   No dead links
-   No runtime crashes
-   Stable recommendation engine
-   Proper accessory, footwear, and optional layer recommendations
-   Production-ready deployment quality
