# Full-Stack Engineer Portfolio Application

A production-ready portfolio web application built using a modern TypeScript stack, containerized with Docker, and architected with a full administrative CRUD workflow.

## 🚀 Key Features

* **Public Showcase**: Responsive project grid featuring title search, tag-based dynamic filtering, and direct links to live demos and GitHub repositories.
* **Admin Dashboard**: Secure control panel for managing portfolio entries with real-time image upload previews.
* **JWT Authentication**: Password-protected admin routing with persistent session tokens.
* **Static File Management**: Multi-part image upload handling with volume-backed disk storage.
* **Container Orchestration**: Multi-stage Docker builds configured for both development hot-reloading and Nginx production reverse proxying.

## 🛠️ Tech Stack

* **Frontend**: React, TypeScript, Vite, Chakra UI
* **Backend**: NestJS, TypeScript, TypeORM
* **Database**: PostgreSQL
* **Infrastructure**: Docker, Docker Compose, Nginx

---

## ⚡ Quick Start (Local Development)

### Prerequisites
* Docker & Docker Compose installed
* Node.js (v18+) & Yarn


---

## 🔎 SEO & Link Previews

Set these before building the `web` image (e.g. in a `.env` next to `docker-compose.yml`):

| Variable | Used for |
| --- | --- |
| `VITE_SITE_URL` | The public address, e.g. `https://yourname.dev`. Enables `sitemap.xml`, canonical/`og:url` tags and the `Sitemap:` line in `robots.txt`. The API uses it for share links too (override with `SITE_URL`). |
| `VITE_SITE_TITLE` / `VITE_SITE_DESCRIPTION` | Title and description baked into `index.html`, for crawlers that don't run JavaScript. |
| `VITE_OG_IMAGE` | Default preview image, absolute or relative to `VITE_SITE_URL`. |

How it fits together:

* **Home page**: the build-time tags above, updated at runtime from the live profile (Google runs JavaScript; LinkedIn, WhatsApp, Slack and X don't). A schema.org `Person` block describes the owner, their links and skills.
* **Case studies**: the Share button copies `/p/<project id>`. nginx forwards that to the API, which returns the project's own title, description and cover image as preview tags, then sends visitors on to `/#project-<id>`. Drafts and unknown ids redirect home.
* **Crawling**: `robots.txt` keeps `/admin` out of search results; `sitemap.xml` lists `/` and `/resume`.

Check a preview with [LinkedIn's Post Inspector](https://www.linkedin.com/post-inspector/) or [opengraph.xyz](https://www.opengraph.xyz/) once deployed.
