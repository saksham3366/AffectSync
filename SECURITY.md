# Security Policy

## Environment Variables and API Keys

This repository uses multiple external APIs and database connections to function properly. **Under no circumstances should any API keys, database connection strings, or environment secrets be committed to this repository.**

### Critical Rules
1. **Never commit `.env` files**: Your `.env` files contain active keys (Cloudinary, Gemini, Qdrant, Weather) and secure secrets (JWT, MongoDB passwords). These must remain local to your machine.
2. **Never hardcode API keys**: Do not write API keys directly into `.js`, `.py`, or `.html` files. Always use `process.env.VARIABLE_NAME`.
3. **Always use `.env.example`**: When adding a new API key dependency, add the *variable name* (without the secret value) to the `.env.example` file so other developers know it is required.

## Setting up a New Development Machine

To configure this project on a new machine securely:

1. Clone the repository.
2. Ensure you do not see a `.env` file in the tracked source files.
3. Copy the template:
   ```bash
   cp .env.example .env
   ```
4. Open your newly created `.env` file and securely paste your active credentials.
5. Do not check your `.env` into version control. (It is already ignored by `.gitignore`).

## Vulnerability Reporting

If you accidentally commit a secret or discover a vulnerability, **do not push further commits**. 
1. Revoke the exposed API key immediately from the provider's dashboard (e.g. Cloudinary or Google Gemini console).
2. Remove the secret from Git history (e.g., using `git filter-repo` or BFG Repo-Cleaner) before making the repository public.
3. Generate a new key and update your local `.env`.
