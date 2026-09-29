# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configuration and manifests
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/snapfind-web/package*.json ./apps/snapfind-web/

# Install dependencies across the monorepo workspace
RUN npm ci

# Copy application source code
COPY apps/snapfind-web/ ./apps/snapfind-web/

# Build production bundle
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build:web

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/apps/snapfind-web/dist /usr/share/nginx/html
COPY apps/snapfind-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
