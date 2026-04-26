# AI Study Planner

AI Study Planner is a mobile-first student app prototype focused on one real problem: students often struggle to organize study time, reduce exam stress, and decide what to study first.

The app includes:

- Login and registration
- Email verification and forgot-password reset codes
- Onboarding for academic level, language, study goal, and daily hours
- Home dashboard with upcoming exams, task count, and progress
- Subject management with add, edit, and delete
- AI plan generation based on urgency, difficulty, priority, and available hours
- My Plan view with weekly schedule, today's tasks, tips, and motivation
- Progress tracking
- Profile statistics and logout

## Project Structure

Current top-level structure:

- `assets/`
- `data/`
- `docs/`
- `.env.example`
- `app.js`
- `database.js`
- `index.html`
- `package.json`
- `README.md`
- `server.js`
- `styles.css`

## Deployment-Ready Architecture Plan

- Keep local prototype storage available with `STORAGE_MODE=json` to continue using `data/app-data.json` for quick demos.
- Default storage stays `STORAGE_MODE=sqlite` for local backend realism with `data/studyspark.sqlite`.
- API keys and secrets must stay in `.env` only; never hardcode keys in `app.js`, `server.js`, or committed JSON files.
- Security controls are handled manually in `server.js` without framework middleware:
  - request body size limit via `MAX_REQUEST_BODY_BYTES`
  - origin allowlist via `ALLOWED_ORIGINS`
  - endpoint input validation helpers for email/password/string fields
  - generic 500 responses so raw server errors are not leaked to users
- TODO markers are included in `database.js` showing where `app-data.json` and snapshot writes should be replaced by PostgreSQL/Supabase repository logic.

## Run

Recommended:

```powershell
node server.js
```

Then open [http://localhost:3000](http://localhost:3000).

Important:

- Do not open `index.html` directly for normal use.
- Login, signup, subjects, plans, and AI chat all require the local backend.
- Always run the app through `http://localhost:3000`.

You can also use:

```powershell
npm start
```

No package installation is required for the SQLite foundation because the app uses Node's built-in `node:sqlite` module.

Prototype JSON mode:

```powershell
$env:STORAGE_MODE="json"
npm start
```

This keeps local data in `data/app-data.json` for rapid prototyping.

## Real AI Setup

To enable real OpenAI-powered planning and chat:

1. Copy [.env.example](C:\Users\Adam\Documents\Codex\2026-04-25\build-a-complete-mobile-first-ai\.env.example) to `.env`
2. Add your `OPENAI_API_KEY`
3. Run:

```powershell
node server.js
```

The browser app will call the local backend, and the backend will call the OpenAI Responses API. Your API key stays on the server side and is never exposed in browser code.

If `OPENAI_API_KEY` is not configured, the app can also use Puter.js as a live AI fallback in the browser for plan generation and coach chat. This fallback depends on loading Puter's browser SDK and may prompt the user to authenticate with Puter when needed.

Default model settings are:

- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENAI_CHAT_MODEL=gpt-5.4-mini`

These defaults were chosen as a practical cost/latency option for a student app. OpenAI's current model docs indicate that if you're unsure where to start, `gpt-5.5` is the flagship model, while smaller variants like `gpt-5.4-mini` are better when optimizing for latency and cost: [Models](https://developers.openai.com/api/docs/models).

## Foundation Upgrade

The project now includes a local backend foundation in [server.js](C:\Users\Adam\Documents\Codex\2026-04-25\build-a-complete-mobile-first-ai\server.js) with:

- Static file serving for the app
- SQLite storage in `data/studyspark.sqlite`
- Migration from the old JSON prototype data when possible
- Session token hashing and expiration
- Authentication endpoints
- Onboarding and subject CRUD endpoints
- Environment-variable support through `.env`

This is the backend layer used by the real OpenAI chat and plan generation flow.

## Security And Auth

The server now includes:

- Prepared SQLite statements with placeholders for user data
- Unique user emails
- Scrypt password hashing with per-password salts
- Minimum password strength checks
- Generic login errors
- Hashed session tokens stored in SQLite
- Email verification codes that expire after 10 minutes
- Forgot-password reset codes that expire after 10 minutes
- Auth and AI rate limiting
- Basic security headers, body-size limits, and same-origin CORS
- Authorization checks so private data is filtered by the logged-in user

For real email delivery, copy `.env.example` to `.env` and set:

```powershell
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

If SMTP is not configured during local development, verification and reset codes are logged in the server console. For production, configure SMTP and install `nodemailer` if your Node environment does not already include it.

## Production Deployment Notes

Render/Railway quick steps:

1. Push this project to a Git repository.
2. Create a new Web Service on Render or Railway.
3. Set start command to `npm start`.
4. Set all required environment variables in the platform dashboard (do not commit `.env`).
5. Set `ALLOWED_ORIGINS` to your deployed frontend URL(s), comma-separated.
6. Keep `STORAGE_MODE=sqlite` only for short-lived demos; use managed PostgreSQL/Supabase for real deployments.

Environment variables for deployment:

- `OPENAI_API_KEY`
- `PORT` (platform may override this automatically)
- `OPENAI_MODEL`
- `OPENAI_CHAT_MODEL`
- `ALLOWED_ORIGINS`
- `MAX_REQUEST_BODY_BYTES`
- `STORAGE_MODE`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Why replace `app-data.json` in production:

- JSON file storage is not safe for concurrent writes across multiple instances.
- It is difficult to query/report efficiently as user data grows.
- Backups, access controls, and recovery are weaker than managed databases.

Recommended production database:

- PostgreSQL (managed on Render, Railway, Neon, etc.)
- Supabase (PostgreSQL + managed auth/storage tooling)

## Vercel + Render Deployment

### STEP 1 — Push to GitHub

```powershell
git add .
git commit -m "deploy"
git push
```

### STEP 2 — Render (backend)

1. Open [Render Dashboard](https://dashboard.render.com/) and click **New +**.
2. Click **Web Service** and connect your GitHub repo.
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. In **Environment** add:
   - `PORT=10000`
   - `CLIENT_URL=<your-vercel-url>`
   - Optional (recommended): `ALLOWED_ORIGINS=<your-vercel-url>`
5. Click **Create Web Service**.
6. Copy your backend URL (example: `https://studyspark-api.onrender.com`).

### STEP 3 — Vercel (frontend)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import the same GitHub repo.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `.`.
5. In project **Settings** -> **Environment Variables**, add:
   - `VITE_API_BASE=<your-render-url>`
6. Deploy the project and copy your frontend URL.

### Final Public URL flow

- Users open your Vercel URL.
- Frontend calls `${window.__APP_CONFIG__?.VITE_API_BASE || ""}/api/...`.
- Render serves backend APIs and returns data to the public frontend.

## Step 2 Upgrade

The app now includes:

- server-backed auth and session flow
- backend-powered subject CRUD
- AI plan generation endpoint
- task completion syncing
- AI Coach chat endpoint
- frontend integration with the local backend
- fallback behavior when `OPENAI_API_KEY` is not configured

## Data Model

SQLite tables are initialized on server start in [database.js](C:\Users\Adam\Documents\Codex\2026-04-25\build-a-complete-mobile-first-ai\database.js):

- `users`
- `sessions`
- `subjects`
- `plans`
- `tasks`
- `calendar_blocks`
- `friends`
- `friend_messages`
- `reward_history`
- `chat_history`
- `password_reset_codes`
- `email_verification_codes`

## Database Mode (Local vs Deploy)

- **Local development (default):** uses SQLite at `data/studyspark.sqlite`.
- **Prototype mode:** set `STORAGE_MODE=json` to use `data/app-data.json`.
- **Hosted deployment:** set `DATABASE_URL` for Postgres-ready mode detection.

Current deployment status:

- `DATABASE_URL` is now detected in `database.js`.
- A database adapter layer exists for core entities (`users`, `sessions`, `subjects`, `plans`, `tasks`, `calendar blocks`).
- Email normalization is applied in adapter save/find methods.
- Full Postgres table migration is marked as TODO and SQLite fallback remains active to keep the demo stable and avoid breaking auth/plans/calendar flows.

## AI Logic

The planner uses:

- Subject exam dates
- Difficulty
- Priority
- Subject-level daily hours
- User academic level
- User study goal
- User daily available hours

It creates a balanced weekly plan by ranking subjects with a weighted urgency model and then fitting study blocks into the user's available daily time without overloading the schedule.

## Prompt Scaffolding

The requested AI prompt structure is included in [app.js](C:\Users\Adam\Documents\Codex\2026-04-25\build-a-complete-mobile-first-ai\app.js) as:

- `plannerPrompts.system`
- `plannerPrompts.userTemplate(...)`

The current build uses a local planner engine so the app works immediately offline, while preserving the prompt structure needed for a future API-based AI upgrade.

When you are ready to enable real OpenAI features, create `.env` from [.env.example](C:\Users\Adam\Documents\Codex\2026-04-25\build-a-complete-mobile-first-ai\.env.example) and add `OPENAI_API_KEY`.
