# Prepare Repository for GitHub (Do NOT Break Anything)

The project is ready to be version controlled.

Your task is to prepare the repository for GitHub using production best practices.

## IMPORTANT

Do NOT modify application logic.

Do NOT change APIs.

Do NOT refactor working code.

Do NOT remove any functionality.

Only prepare the repository for safe version control.

---

# 1. Configure .gitignore

Create or update the root `.gitignore`.

Ensure it ignores at least:

# Environment
.env
.env.*
backend/.env
frontend/.env

# Dependencies
node_modules/

# Build Output
dist/
build/
coverage/

# Python
__pycache__/
*.pyc
.venv/
venv/

# Logs
*.log
npm-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Local Uploads (if they are only emergency backups)
backend/uploads/

# Temporary Files
.cache/
tmp/
temp/

# Local Databases
*.db
*.sqlite

---

# 2. Verify Secrets

Search the entire repository.

Ensure NO secrets are committed.

Specifically check for:

- QDRANT_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_API_KEY
- GEMINI_API_KEY
- WEATHER_API_KEY
- JWT_SECRET
- MongoDB passwords

If any secret is inside tracked source files,
move it to `.env`.

Never hardcode secrets.

---

# 3. Create Example Environment Files

Create:

backend/.env.example

frontend/.env.example (if applicable)

Include variable names only.

Leave values blank.

Example:

MONGO_URI=
JWT_SECRET=
QDRANT_URL=
QDRANT_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
WEATHER_API_KEY=
GEMINI_API_KEY=

Do NOT copy real values.

---

# 4. Git Validation

Run Git status.

Verify:

- .env files are NOT tracked.
- node_modules are NOT tracked.
- uploads are ignored if intended.
- build artifacts are ignored.

If any secret is staged,
remove it from Git tracking before continuing.

---

# 5. Repository Hygiene

Remove:

- dead files
- temporary files
- editor backup files

Do NOT remove working project files.

---

# 6. Documentation

Create:

SECURITY.md

Explain:

- Never commit .env
- Never commit API keys
- Always use .env.example
- How to configure a new development machine

---

# 7. Final Verification

Before finishing, verify:

✓ No secrets tracked
✓ .gitignore working
✓ Project still builds
✓ Backend still runs
✓ Frontend still runs
✓ All existing functionality preserved

Do NOT commit or push anything automatically.

Stop and report exactly what changed.