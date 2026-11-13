# Portfolio Monorepo

A self-hosted developer portfolio with a private admin area, split into two apps:

| Folder | What it is |
| ------ | ---------- |
| [`api/`](api) | NestJS + TypeORM REST API backed by PostgreSQL. See [api/README.md](api/README.md) for its settings and endpoints. |
| [`web/`](web) | React + Vite + Chakra UI front end, served by nginx in production. See [web/README.md](web/README.md). |

## Features

- Public portfolio, printable résumé page and project case studies
- Blog: write posts in Markdown in Admin, with drafts, a preview, cover images and tags
- Admin area: projects (with ordering), skills (drag to reorder), experience, education and certifications, profile
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

`docker-compose.prod.yml` runs the same three services. Before deploying, set these in the `.env` next to it:

- `JWT_SECRET` and `POSTGRES_PASSWORD`: long random values. The defaults are for local use only.
- `VITE_SITE_URL`: your public address, e.g. `https://yourname.dev`.
- `VITE_API_URL`: the address the browser should use for the API.

The database tables are created and updated automatically from the code (`DB_SYNCHRONIZE`). There are no migrations yet, so back up the database before deploying big changes.

Every push to `main` runs lint, tests and builds on GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

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
