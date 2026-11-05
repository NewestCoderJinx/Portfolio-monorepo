FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Baked into the bundle at build time; the browser calls this URL directly.
ARG VITE_API_URL=http://localhost:3000
ARG VITE_SITE_TITLE
ARG VITE_SITE_DESCRIPTION
ARG VITE_SITE_URL
ARG VITE_OG_IMAGE
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_TITLE=$VITE_SITE_TITLE \
    VITE_SITE_DESCRIPTION=$VITE_SITE_DESCRIPTION \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_OG_IMAGE=$VITE_OG_IMAGE
RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
