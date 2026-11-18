# Portfolio API

The NestJS + TypeORM + PostgreSQL backend for the portfolio. It serves the public site's data and the Admin area, and builds the link previews for shared projects and blog posts.

See the [root README](../README.md) for running the whole stack with Docker.

## Running it on its own

You need Node.js 22 and a PostgreSQL database.

```bash
cp ../.env.example .env   # then set the database login and JWT_SECRET
npm ci
npm run start:dev         # http://localhost:3000, reloads on change
```

On an empty database, the first account to register becomes the admin: open `/admin` on the web app and sign up. With `NODE_ENV=production`, sign-up stays closed; use `create-admin` instead. `npm run seed` fills in a sample profile and projects.

| Script | What it does |
| --- | --- |
| `npm run start:dev` | Run with reload on change |
| `npm run build` / `npm run start:prod` | Compile to `dist/` and run it |
| `npm test` | Unit tests (Vitest), no database needed |
| `npm run test:e2e` | Boots the whole app against the database in `.env` and checks it over HTTP |
| `npm run lint` | oxlint |
| `npm run seed` | Sample profile and projects |
| `npm run build && npm run create-admin -- you@example.com` | Create an Admin account from the command line (the only way in production) |
| `npm run migration:generate -- src/migrations/Name` | Write a migration for your entity changes (see below) |
| `npm run migration:show` / `migration:run` / `migration:revert` | List, apply or undo migrations by hand |

GitHub Actions runs lint, both test suites (with a Postgres service) and the build on every push. See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Settings

Read from the environment, or from `api/.env` in development.

| Variable | Default | Meaning |
| --- | --- | --- |
| `POSTGRES_HOST` / `POSTGRES_PORT` | `localhost` / `5432` | Database address |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `portfolio_user` / `secret_password` / `portfolio_db` | Database login |
| `JWT_SECRET` | a dev-only value | Signs Admin logins. Always set a long random string in production. Logins last one day. |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `production` (set by the Docker image) refuses to start with missing, short or default `JWT_SECRET`/`POSTGRES_PASSWORD`, and turns off CORS unless `CORS_ORIGINS` is set |
| `TRUST_PROXY` | off | How many proxies sit in front of the API (`1` for nginx), `true`, or a list of addresses. Lets it read the visitor's IP and https from `X-Forwarded-*`. Leave it off when the API is reached directly, or visitors could fake their IP. |
| `CORS_ORIGINS` | any (dev) / none (production) | Comma-separated sites allowed to call the API from the browser. Not needed when the site goes through nginx's `/api/`. |
| `ALLOW_REGISTRATION` | `false` | In development only the first account can register; in production nobody can (use `create-admin`, below). Set to `true` for a moment to open sign-up anyway. |
| `SITE_URL` | from the request | Public address of the site, used in share links and preview tags |
| `PUBLIC_API_URL` | from the request | Public address of the API, used in uploaded file URLs |
| `SMTP_*`, `MAIL_FROM`, `NOTIFY_EMAIL` | off | Email alerts. See [Email alerts](../README.md#email-alerts) in the root README. |

## Database migrations

Tables change only through migrations in `src/migrations/`. The app applies pending ones when it starts (`migrationsRun`), and records each in the `migrations` table. TypeORM's `synchronize` is off.

To change the schema:

1. Edit the entity (`*.entity.ts`).
2. With your database running and up to date, run `npm run migration:generate -- src/migrations/AddSomething`. It compares the entities with the database and writes the SQL.
3. Read the generated file. Column type and rename changes come out as drop-and-add, which deletes that column's data. Rewrite those with `ALTER COLUMN ... TYPE ... USING` or `RENAME COLUMN`, like `1794772308676-TimestampsWithTimeZone.ts`.
4. Add the class to `MIGRATIONS` in `src/config/database.config.ts`. Migrations are listed there explicitly, not loaded from a folder.
5. Restart the app, or run `npm run migration:run`.

The first migration, `InitialSchema`, only adds what's missing, so databases built by the older `synchronize` setup are taken over without losing data.

## Endpoints

🔒 needs an Admin login (`Authorization: Bearer <token>` from `POST /auth/login`). Every other route is public.

| Area | Public | Admin 🔒 |
| --- | --- | --- |
| Auth | `GET /auth/registration-status`, `POST /auth/register`, `POST /auth/login`, `POST /auth/login/2fa` (code step when 2FA is on) | `GET /auth/me`, `PATCH /auth/password`, `POST /auth/logout`, `GET /auth/sessions`, `DELETE /auth/sessions` (all but this one), `DELETE /auth/sessions/:id`, `POST /auth/2fa/setup`, `POST /auth/2fa/enable`, `POST /auth/2fa/disable`, `POST /auth/2fa/recovery-codes` |
| Profile | `GET /profile` | `PATCH /profile`, `POST /profile/resume` (PDF) |
| Projects | `GET /projects`, `GET /projects/:id`, `POST /projects/:id/view` | `GET /projects/manage`, `GET /projects/stats?days=30`, `POST /projects`, `PATCH /projects/reorder`, `PATCH /projects/:id`, `DELETE /projects/:id`, `POST /projects/upload` (image) |
| Blog posts | `GET /posts` (no bodies; `?q=` searches titles, excerpts, bodies and tags), `GET /posts/:slug` | `GET /posts/manage`, `POST /posts`, `PATCH /posts/:id`, `DELETE /posts/:id` |
| Skills | `GET /skills` | `POST /skills`, `PATCH /skills/reorder`, `PATCH /skills/:id`, `DELETE /skills/:id` |
| Experience | `GET /experience` | `POST`, `PATCH /:id`, `DELETE /:id` |
| Education & certifications | `GET /credentials` | `POST`, `PATCH /:id`, `DELETE /:id` |
| Testimonials | `GET /testimonials` | `GET /testimonials/manage`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Testimonial requests | `GET /testimonial-requests/:token`, `POST /testimonial-requests/:token` | `GET /testimonial-requests`, `POST /testimonial-requests`, `DELETE /testimonial-requests/:id` |
| Activity log | | `GET /audit?kind=all\|security\|content&before=<date>&limit=50` (newest first; kept 90 days) |
| Contact messages | `POST /messages` | `GET /messages`, `GET /messages/alerts`, `POST /messages/alerts/test`, `PATCH /messages/read-all`, `PATCH /messages/:id`, `DELETE /messages/:id` |
| Link previews | `GET /share/projects/:id`, `GET /share/projects/:id/image.png`, `GET /share/posts/:slug`, `GET /share/posts/:slug/image.png`, `GET /share/rss.xml` (served at `/rss.xml`) | |

Drafts (unpublished projects and posts) are only returned on the Admin routes; the public ones answer 404, so their ids can't be guessed.

Public routes that can be abused are rate limited per visitor:
- Contact form: 5 messages an hour.
- Testimonial links: 30 lookups and 5 submissions an hour.
- Project views and share clicks: counted once per visitor every 30 minutes.

Uploaded images (up to 15 MB) are resized, stripped of metadata and saved as WebP under `uploads/`, served at `/uploads/...`.

## Locked out of two-step verification

If the owner loses both their authenticator app and every recovery code, turn 2FA off straight in the database, then sign in with the password and set it up again:

```sql
UPDATE users SET "totpSecret" = NULL, "totpEnabledAt" = NULL, "totpLastUsedStep" = NULL, "totpRecoveryCodes" = NULL
WHERE email = 'owner@example.com';
```

## Layout

```
src/
  audit/         activity log: sign-in and security events, plus every signed-in write (via a global interceptor)
  auth/          login, registration, sessions, two-step verification (TOTP), JWT guard
  profile/       the single owner profile and résumé upload
  projects/      projects, ordering, views and daily stats
  posts/         blog posts and their URL slugs
  skills/  experience/  credentials/  testimonials/  messages/
  share/         link-preview pages and generated preview images
  mail/          SMTP alerts
  common/        uploads, image optimisation, rate limiter, error filter
test/            end-to-end tests
```
