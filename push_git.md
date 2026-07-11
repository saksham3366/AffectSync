# GITHUB INITIALIZATION & REPOSITORY OPTIMIZATION TASK

## IMPORTANT

This is the FIRST Git commit for this project.

Treat this as production repository initialization.

DO NOT blindly commit everything.

The current project folder contains generated files, caches, datasets, dependencies and temporary files that MUST NOT be uploaded.

Your job is to prepare a clean, production-ready Git repository.

---

# OBJECTIVE

Reduce repository size as much as possible while preserving a fully buildable project.

The final repository should contain only:

- Source Code
- Assets required for runtime
- Documentation
- Configuration Templates
- Build Configuration
- Package Managers
- Lock Files

Everything else should be reviewed.

---

# STEP 1

Analyze the entire repository.

Generate a size report.

Identify:

- Largest folders
- Largest files
- File count
- Total repository size

Produce a report before deleting or ignoring anything.

---

# STEP 2

Automatically identify folders that should NOT be committed.

Examples include:

node_modules

venv

.venv

__pycache__

dist

build

coverage

.cache

tmp

temp

logs

*.log

*.pyc

*.pyo

.idea

.vscode

.DS_Store

Thumbs.db

Any generated build output

Any local upload cache

Any temporary AI cache

Any model cache

---

# STEP 3

Find datasets.

DO NOT automatically commit datasets.

Instead:

Report

- Folder
- Size
- Number of files

Ask whether the dataset is:

1. Required for runtime

2. Training only

3. Sample data

If runtime does NOT require it,

exclude it.

If only a sample is required,

keep a very small sample.

Never upload multi-GB datasets.

---

# STEP 4

Search the entire repository for secrets.

Check for:

QDRANT_API_KEY

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

JWT_SECRET

MONGO_URI

GEMINI_API_KEY

WEATHER_API_KEY

PASSWORD

TOKEN

SECRET

PRIVATE_KEY

If found:

Move them to .env if necessary.

Never commit secrets.

---

# STEP 5

Create or improve .gitignore.

Ensure the repository ignores:

.env

.env.*

node_modules/

venv/

.venv/

dist/

build/

coverage/

__pycache__/

*.pyc

*.log

.cache/

tmp/

.idea/

.vscode/

backend/uploads/

datasets/

training_data/

models/

weights/

*.sqlite

*.db

---

# STEP 6

Create

backend/.env.example

frontend/.env.example

Populate ONLY variable names.

Leave values blank.

Never copy real secrets.

---

# STEP 7

Run Git status.

Verify:

No .env files

No API keys

No node_modules

No datasets

No build artifacts

No uploads

No temporary files

If anything suspicious is staged,

remove it.

---

# STEP 8

Initialize Git if necessary.

Create branches:

main

dev

Switch working branch to:

dev

Leave

main

clean and stable.

---

# STEP 9

Stage ONLY reviewed files.

Never use blind staging if it includes ignored or sensitive files.

Ensure every staged file is intentional.

---

# STEP 10

Create first commit.

Commit message:

Initial commit: AffectSync AI Wardrobe Intelligence

---

# STEP 11

Publish repository to GitHub only after all validations pass.

If GitHub authentication is required,

pause and prompt for authentication.

---

# STEP 12

After pushing,

verify:

Repository size

Number of committed files

No secrets

No datasets

No unnecessary binaries

No build output

---

# STEP 13

Generate:

REPOSITORY_REPORT.md

Include:

Repository Size

Committed File Count

Ignored File Count

Largest Ignored Folders

Largest Ignored Files

Datasets Excluded

Secrets Protected

Branches Created

Current Branch

Git Status

Repository Health

Suggestions for further optimization

---

# FINAL RULES

DO NOT commit secrets.

DO NOT commit datasets unless explicitly approved.

DO NOT commit generated files.

DO NOT commit caches.

DO NOT commit build outputs.

DO NOT commit local databases.

DO NOT commit uploads.

DO NOT commit virtual environments.

DO NOT commit node_modules.

DO NOT push until every validation passes.

If unsure whether a file belongs in Git,

exclude it first and report it.

Repository quality and security are more important than committing every file.

Stop after generating REPOSITORY_REPORT.md and completing the first push.

create a GITHUB_HEALTH_REPORT.md after the push.

That report should include:

Repository size after cleanup.
Number of tracked files.
Largest tracked files (top 20).
Largest ignored folders.
Secrets scan result (e.g., "No secrets detected in tracked files").
.gitignore validation result.
Branches (main, dev) and current branch.
Remote URL configured.
Whether the repository is ready for Vercel/Render deployment. 