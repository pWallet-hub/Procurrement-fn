# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# --- serve ---
FROM nginx:1.27-alpine
# Runtime setting (see docker/10-upstream.envsh and nginx.conf): any reachable API, e.g. http://host.docker.internal:3100
ENV API_UPSTREAM=http://host.docker.internal:3000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/10-upstream.envsh /docker-entrypoint.d/10-upstream.envsh
RUN chmod +x /docker-entrypoint.d/10-upstream.envsh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
