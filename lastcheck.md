create a PRE_DEPLOY_CHECKLIST.md in addition to DEPLOYMENT.md.

That checklist should contain simple pass/fail items such as:

All environment variables configured.
Production build succeeds.
Health endpoints return OK.
Images upload correctly.
Cloudinary fallback tested.
MongoDB fallback tested.
Qdrant synchronization verified.
Browser QA completed.
No console errors.
No failed network requests.