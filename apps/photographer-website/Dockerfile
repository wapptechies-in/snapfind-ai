# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configuration and manifests
COPY package*.json ./
COPY apps/photographer-website/package*.json ./apps/photographer-website/

# Install dependencies
RUN npm ci

# Copy application source code
COPY apps/photographer-website/ ./apps/photographer-website/

# Build production bundle
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build:website

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/apps/photographer-website/dist /usr/share/nginx/html
COPY apps/photographer-website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
