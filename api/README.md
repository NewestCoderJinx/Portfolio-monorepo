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

On an empty database, the first account to register becomes the admin: open `/admin` on the web app and sign up. `npm run seed` fills in a sample profile and projects.

| Script | What it does |
| --- | --- |
| `npm run start:dev` | Run with reload on change |
| `npm run build` / `npm run start:prod` | Compile to `dist/` and run it |
| `npm test` | Unit tests (Vitest), no database needed |
| `npm run test:e2e` | Boots the whole app against the database in `.env` and checks it over HTTP |
| `npm run lint` | oxlint |
| `npm run seed` | Sample profile and projects |

GitHub Actions runs lint, both test suites (with a Postgres service) and the build on every push. See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Settings

Read from the environment, or from `api/.env` in development.

| Variable | Default | Meaning |
| --- | --- | --- |
| `POSTGRES_HOST` / `POSTGRES_PORT` | `localhost` / `5432` | Database address |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `portfolio_user` / `secret_password` / `portfolio_db` | Database login |
| `JWT_SECRET` | a dev-only value | Signs Admin logins. Always set a long random string in production. Logins last one day. |
| `PORT` | `3000` | HTTP port |
| `ALLOW_REGISTRATION` | `false` | Only the first account can register. Set to `true` for a moment to add another admin. |
| `DB_SYNCHRONIZE` | on outside production | Lets TypeORM create and update tables from the entities. There are no migrations yet. |
| `SITE_URL` | from the request | Public address of the site, used in share links and preview tags |
| `PUBLIC_API_URL` | from the request | Public address of the API, used in uploaded file URLs |
| `SMTP_*`, `MAIL_FROM`, `NOTIFY_EMAIL` | off | Email alerts. See [Email alerts](../README.md#email-alerts) in the root README. |

## Endpoints

🔒 needs an Admin login (`Authorization: Bearer <token>` from `POST /auth/login`). Every other route is public.

| Area | Public | Admin 🔒 |
| --- | --- | --- |
| Auth | `GET /auth/registration-status`, `POST /auth/register`, `POST /auth/login` | `GET /auth/me`, `PATCH /auth/password` |
| Profile | `GET /profile` | `PATCH /profile`, `POST /profile/resume` (PDF) |
| Projects | `GET /projects`, `GET /projects/:id`, `POST /projects/:id/view` | `GET /projects/manage`, `GET /projects/stats?days=30`, `POST /projects`, `PATCH /projects/reorder`, `PATCH /projects/:id`, `DELETE /projects/:id`, `POST /projects/upload` (image) |
| Blog posts | `GET /posts` (no bodies), `GET /posts/:slug` | `GET /posts/manage`, `POST /posts`, `PATCH /posts/:id`, `DELETE /posts/:id` |
| Skills | `GET /skills` | `POST /skills`, `PATCH /skills/reorder`, `PATCH /skills/:id`, `DELETE /skills/:id` |
| Experience | `GET /experience` | `POST`, `PATCH /:id`, `DELETE /:id` |
| Education & certifications | `GET /credentials` | `POST`, `PATCH /:id`, `DELETE /:id` |
| Testimonials | `GET /testimonials` | `GET /testimonials/manage`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Testimonial requests | `GET /testimonial-requests/:token`, `POST /testimonial-requests/:token` | `GET /testimonial-requests`, `POST /testimonial-requests`, `DELETE /testimonial-requests/:id` |
| Contact messages | `POST /messages` | `GET /messages`, `GET /messages/alerts`, `POST /messages/alerts/test`, `PATCH /messages/read-all`, `PATCH /messages/:id`, `DELETE /messages/:id` |
| Link previews | `GET /share/projects/:id`, `GET /share/projects/:id/image.png`, `GET /share/posts/:slug`, `GET /share/posts/:slug/image.png` | |

Drafts (unpublished projects and posts) are only returned on the Admin routes; the public ones answer 404, so their ids can't be guessed.

Public routes that can be abused are rate limited per visitor:
- Contact form: 5 messages an hour.
- Testimonial links: 30 lookups and 5 submissions an hour.
- Project views and share clicks: counted once per visitor every 30 minutes.

Uploaded images (up to 15 MB) are resized, stripped of metadata and saved as WebP under `uploads/`, served at `/uploads/...`.

## Layout

```
src/
  auth/          login, registration, JWT guard
  profile/       the single owner profile and résumé upload
  projects/      projects, ordering, views and daily stats
  posts/         blog posts and their URL slugs
  skills/  experience/  credentials/  testimonials/  messages/
  share/         link-preview pages and generated preview images
  mail/          SMTP alerts
  common/        uploads, image optimisation, rate limiter, error filter
test/            end-to-end tests
```
