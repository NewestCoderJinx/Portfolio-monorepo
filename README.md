# Portfolio Monorepo

A self-hosted developer portfolio with a private admin area, split into two apps:

| Folder | What it is |
| ------ | ---------- |
| [`api/`](api) | NestJS + TypeORM REST API backed by PostgreSQL |
| [`web/`](web) | React + Vite front end, served by nginx in production |

## Features

- Public portfolio, resume page and project case studies
- Admin area: projects (with ordering), skills (drag to reorder), experience, credentials and profile
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

For production, use `docker-compose.prod.yml`.

## License

See [LICENSE](LICENSE).
