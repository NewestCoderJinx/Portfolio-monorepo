# Stage 1: Build React static assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx web server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]