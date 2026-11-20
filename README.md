# Portfolio Monorepo

A self-hosted developer portfolio with a private admin area, split into two apps:

| Folder | What it is |
| ------ | ---------- |
| [`api/`](api) | NestJS + TypeORM REST API backed by PostgreSQL. See [api/README.md](api/README.md) for its settings and endpoints. |
| [`web/`](web) | React + Vite + Chakra UI front end, served by nginx in production. See [web/README.md](web/README.md). |

## Features

- Public portfolio, printable résumé page and project case studies
- Blog: write posts in Markdown in Admin, with drafts, a preview, cover images and tags; readers can search posts and follow them by RSS (`/rss.xml`)
- Admin area: projects (with ordering), skills (drag to reorder), experience, education and certifications, profile
- Admin sign-in with optional two-step verification (authenticator app), a list of signed-in devices you can sign out, blocking after repeated failed logins, and an activity log of sign-ins and edits
- Contact inbox with optional email alerts over SMTP
- Testimonials, including private request links you can send to clients
- Shareable project links with click counts, and daily view charts
- Generated social preview images and per-page SEO tags
- Image uploads resized, stripped of metadata and converted to WebP

## Running locally

```bash
cp .env.example .env   # then fill in your own values
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:3000

Open http://localhost:5173/admin and register. Only the first account can sign up, and it becomes the admin.

To work on one app with live reload instead, see the README in `api/` or `web/`.

## Production

`docker-compose.prod.yml` runs the same three services in production mode. Only the web container (nginx) is published, on port 80 (`WEB_PORT` to change it). nginx serves the site and proxies `/api/`, `/uploads/`, share links and the RSS feed to the API. The API and database are only reachable inside the compose network.

Set these in the `.env` next to it:

- `JWT_SECRET` (at least 32 characters) and `POSTGRES_PASSWORD` (at least 12): long random values, e.g. from `openssl rand -base64 48`. Compose won't start without them, and the API refuses to start in production with missing, short or default values.
- `VITE_SITE_URL`: your public address, e.g. `https://yourname.dev`.
- `VITE_API_URL`: leave empty. The site then calls `/api` on its own address.
- `TRUST_PROXY`: defaults to `1` (nginx). Set it to `2` if another proxy, such as a TLS terminator on the host, sits in front of nginx. The API uses it to see each visitor's real IP for login limits, sessions and the Activity log.

Sign-up through the site is closed in production, even before any account exists, so nobody can claim a fresh deployment before you do. Create your Admin account on the server instead. It asks for the password without showing it:

```bash
docker compose -f docker-compose.prod.yml exec api node dist/create-admin you@example.com
```

The API applies any pending database migrations when it starts, so deploying a new version updates the tables. Back up the database before deploying a version with new migrations. See [Database migrations](api/README.md#database-migrations).

### Backups

`scripts/backup.sh` saves the database (`backups/db-<time>.dump`) and the uploaded files (`backups/uploads-<time>.tar.gz`), and deletes backups older than 14 days (`BACKUP_KEEP_DAYS`). Run it nightly from cron on the server, and copy `backups/` somewhere off the server too:

```cron
15 3 * * * cd /path/to/portfolio-monorepo && ./scripts/backup.sh >> backups/backup.log 2>&1
```

To restore, stop the API so nothing writes meanwhile, load the dump, unpack the uploads and start it again:

```bash
docker compose -f docker-compose.prod.yml stop api
docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backups/db-<time>.dump
tar -xzf backups/uploads-<time>.tar.gz -C api
docker compose -f docker-compose.prod.yml start api
```

Container logs are capped at 3 × 10 MB per service. `docker compose -f docker-compose.prod.yml ps` shows whether the API is healthy.

Every push to `main` runs lint, tests and builds on GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Free hosting (Cloudflare Pages + Render + Neon + Cloudinary)

An alternative to `docker-compose.prod.yml` that costs nothing and needs no card: four free services, each doing one job. None of these needs code changes, only settings.

| Part | Service | Notes |
|---|---|---|
| Database | [Neon](https://neon.tech) | Free Postgres. Copy its connection string (with `?sslmode=require`). |
| Uploaded files | [Cloudinary](https://cloudinary.com) | Free plan. Copy the `CLOUDINARY_URL` from the dashboard. Turn on **Settings → Security → Allow delivery of PDF and ZIP files** so résumé PDFs open. |
| API | [Render](https://render.com) | Free web service built from `api/Dockerfile`. Sleeps after about 15 idle minutes; the next request wakes it in up to a minute. |
| Website | [Cloudflare Pages](https://pages.cloudflare.com) | Serves the built site. The Functions in `web/functions/` do nginx's other jobs: share links, `/rss.xml` and blog previews for link crawlers. `web/public/_headers` sets the security headers and caching. |

Render's disk is wiped on every restart, which is why uploads go to Cloudinary. The site calls the API directly at its Render address, so the API needs `CORS_ORIGINS`.

### 1. Database and files

Create a Neon project and a Cloudinary account, and keep the connection string and `CLOUDINARY_URL` for the next step.

### 2. API on Render

New → Web Service → connect this repository. Set **Language** to Docker, **Root Directory** to `api`, **Instance Type** to Free, and **Health Check Path** to `/`. Environment variables:

- `DATABASE_URL`: the Neon connection string.
- `JWT_SECRET`: a long random value, e.g. from `openssl rand -base64 48`.
- `CLOUDINARY_URL`: from Cloudinary.
- `SITE_URL`: the website's address, e.g. `https://yourname.pages.dev` (used in emails and share pages).
- `CORS_ORIGINS`: the same address, so the browser may call the API.
- `TRUST_PROXY`: Render sits behind its own proxies. Start with `1`, sign in, and check that Admin → Activity shows your real IP address; if it shows a Render address, try `2`, then `3`. Login limits and sessions use this IP.

The API runs the database migrations when it starts. Note the service's address, e.g. `https://portfolio-api.onrender.com`.

### 3. Website on Cloudflare Pages

Workers & Pages → Create → Pages → connect this repository. Set **Root directory** to `web`, **Build command** to `yarn build` and **Build output directory** to `dist`. Environment variables (used by both the build and the Functions):

- `VITE_API_URL`: the Render address from step 2.
- `VITE_SITE_URL`: the website's own address (for the sitemap and preview tags).
- Optionally `VITE_SITE_TITLE`, `VITE_SITE_DESCRIPTION`, `VITE_OG_IMAGE` (see [web/README.md](web/README.md)).

The site gets a free `https://<project>.pages.dev` address. A free subdomain such as [is-a.dev](https://is-a.dev) can point at it later (Custom domains in the Pages project); then update `SITE_URL`, `CORS_ORIGINS` and `VITE_SITE_URL` to match and redeploy both.

### 4. Your Admin account

Render's free plan has no shell, so create the account from your own computer, against the Neon database, after the API has started once:

```bash
cd api
npm ci && npm run build
DATABASE_URL='<the Neon connection string>' node dist/create-admin you@example.com
```

### Keeping it awake and backed up

- So visitors don't wait for Render to wake up, a free monitor such as [cron-job.org](https://cron-job.org) or UptimeRobot can request the API's address every 10 minutes. One always-on service fits in Render's free monthly hours.
- Neon keeps a short restore history on the free plan. For your own copies, run `pg_dump '<the Neon connection string>' -Fc -f portfolio.dump` now and then, with a `pg_dump` at least as new as the Neon database's Postgres version. Uploaded files stay in your Cloudinary media library.
- Email alerts: Render's free plan may block the usual SMTP ports (25, 465, 587). If messages don't send, use a provider that also listens on port 2525 (e.g. Brevo) and set `SMTP_PORT=2525`. See [Email alerts](#email-alerts).

## Link previews and SEO

Set these before building the `web` image:

| Variable | Used for |
| --- | --- |
| `VITE_SITE_URL` | The public address. Enables `sitemap.xml`, canonical and `og:url` tags and the `Sitemap:` line in `robots.txt`. The API uses it for share links too (override with `SITE_URL`). |
| `VITE_SITE_TITLE` / `VITE_SITE_DESCRIPTION` | Title and description baked into `index.html`, for crawlers that don't run JavaScript. |
| `VITE_OG_IMAGE` | Default preview image, absolute or relative to `VITE_SITE_URL`. |

How it fits together:

- **Home page.** Uses the build-time tags above, updated at runtime from the live profile. Google runs JavaScript; LinkedIn, WhatsApp, Slack and X don't. A schema.org `Person` block describes the owner, their links and skills.
- **Case studies.** The Share button copies `/p/<project id>`. nginx forwards that to the API, which returns the project's own title, description and image as preview tags, then sends visitors on to `/#project-<id>`. Drafts and unknown ids redirect home.
- **Blog posts.** Share the normal `/blog/<slug>` address. nginx sends link-preview crawlers (WhatsApp, LinkedIn, Slack, X, Discord and others) to the API for the post's preview tags. People and search engines get the real page, which carries a schema.org `BlogPosting` block. Posts without a cover image get a generated card.
- **Crawling.** `robots.txt` keeps `/admin` out of search results. `sitemap.xml` lists `/`, `/resume` and `/blog`, and search engines find posts through `/blog`.

Check a preview with [LinkedIn's Post Inspector](https://www.linkedin.com/post-inspector/) or [opengraph.xyz](https://www.opengraph.xyz/) once deployed.

## Email alerts

The API can email you whenever someone uses the contact form or submits a testimonial through a request link. Replying to a contact alert answers the visitor directly, because Reply-To is their address. Set these for the `api` service:

| Variable | Meaning |
| --- | --- |
| `SMTP_HOST` | Mail server, e.g. `smtp.gmail.com`, `smtp.resend.com`. Leave empty to turn alerts off. |
| `SMTP_PORT` | `587` (STARTTLS, default) or `465` (TLS). |
| `SMTP_SECURE` | Optional override: `true` for implicit TLS, `false` otherwise. Defaults from the port. |
| `SMTP_USER` / `SMTP_PASS` | Login. For Gmail use an [app password](https://support.google.com/accounts/answer/185833), not your normal password. |
| `MAIL_FROM` | Sender, e.g. `Portfolio <alerts@yourname.dev>`. Defaults to `SMTP_USER`. Many providers require a verified address. |
| `NOTIFY_EMAIL` | Where alerts go. Defaults to the email on your profile. |

The Admin **Inbox** shows whether alerts are on and has a **Send test email** button that reports any error from the mail server. Messages are always saved, so a mail problem never loses one.

## License

See [LICENSE](LICENSE).
