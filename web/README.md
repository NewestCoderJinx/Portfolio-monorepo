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

`VITE_*` settings are baked in at build time, so rebuild after changing them. `VITE_API_URL` is the only one needed for development. The rest are listed under [Link previews and SEO](../README.md#link-previews-and-seo).

## Pages

| Route | Page |
| --- | --- |
| `/` | Portfolio: profile, projects and case studies, experience, education, skills, testimonials, latest posts, contact form |
| `/resume` | Printable résumé |
| `/blog`, `/blog/:slug` | Post list with tag filter, and single posts rendered from Markdown |
| `/testimonial/:token` | Form behind a private testimonial request link |
| `/admin` | Sign-in, then the Admin tabs: Overview, Projects, Writing, Profile, Experience, Education, Skills, Testimonials, Inbox, Account |

Post bodies are rendered with `react-markdown` and `remark-gfm` (tables, task lists). Raw HTML in a post is shown as text, never run.

## Layout

```
src/
  api/         one file per API area (axios client in axios.ts)
  pages/       one component per route
  components/
    public/    sections and cards for the public pages
    admin/     editors and panels for the Admin tabs
  hooks/       data loading, page meta and structured data
  seo.ts       helpers for <title>, meta tags and JSON-LD
  theme.ts     Chakra theme and colour tokens (light and dark)
nginx.conf     production server: the app, /api and /uploads proxies, share links, crawler routing for blog posts
```
