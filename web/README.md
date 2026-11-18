# Portfolio Web

The React front end: the public portfolio, the blog, and the Admin area. Built with Vite, TypeScript and Chakra UI, and served by nginx in production.

See the [root README](../README.md) for running the whole stack, and for the link-preview and SEO settings.

## Running it on its own

You need Node.js 22, Yarn, and the API running (see [api/README.md](../api/README.md)).

```bash
yarn install
echo "VITE_API_URL=http://localhost:3000" > .env
yarn dev                  # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `yarn dev` | Dev server with hot reload |
| `yarn build` | Type-check and build to `dist/`, including `robots.txt` and `sitemap.xml` |
| `yarn preview` | Serve the built `dist/` locally |
| `yarn lint` | oxlint |

`VITE_*` settings are baked in at build time, so rebuild after changing them. `VITE_API_URL` is the only one needed for development. Production builds default to `/api` on the site's own address. The rest are listed under [Link previews and SEO](../README.md#link-previews-and-seo).

## Pages

| Route | Page |
| --- | --- |
| `/` | Portfolio: profile, projects and case studies, experience, education, skills, testimonials, latest posts, contact form |
| `/resume` | Printable résumé |
| `/blog`, `/blog/:slug` | Post list with search and tag filter (kept in the URL as `?q=` and `?tag=`), an RSS link, and single posts rendered from Markdown |
| `/testimonial/:token` | Form behind a private testimonial request link |
| `/admin` | Sign-in, then the Admin tabs: Overview, Projects, Writing, Profile, Experience, Education, Skills, Testimonials, Inbox, Account, Activity |

Post bodies are rendered with `react-markdown` and `remark-gfm` (tables, task lists). Raw HTML in a post is shown as text, never run.

## Loading and caching

- Only the home page is in the first download. Every other page, including Admin and the Markdown renderer, loads the first time it's visited (`lazy()` in `App.tsx`).
- React, Chakra and the other core libraries are built into their own `vendor-<hash>.js`, which only changes when they are upgraded. A deploy of app changes leaves it cached.
- nginx gzips text, caches `/assets/` for a year (file names change with their content) and makes browsers recheck `index.html` every time, so a new build shows up immediately.

## Accessibility

Checked with [axe](https://github.com/dequelabs/axe-core) in light and dark mode at desktop and phone widths, plus keyboard use. Things to keep when changing the UI:

- Use the `fg.*` colour tokens for text. They all meet 4.5:1 contrast on `bg.canvas` and `bg.surface`.
- Each page has one `h1`, and heading levels don't skip.
- Smooth scrolling goes through `scrollBehavior()` in `src/motion.ts`, which respects the visitor's reduced-motion setting.
- The first Tab on any page shows a "Skip to content" link to `<main>`.

## Layout

```
src/
  api/         one file per API area (axios client in axios.ts)
  pages/       one component per route
  components/
    public/    sections and cards for the public pages
    admin/     editors and panels for the Admin tabs
  hooks/       data loading, page meta and structured data
  motion.ts    scroll behaviour that respects reduced motion
  seo.ts       helpers for <title>, meta tags and JSON-LD
  theme.ts     Chakra theme and colour tokens (light and dark)
nginx.conf     production server: the app, /api and /uploads proxies, share links, the RSS feed, crawler routing for blog posts
```
