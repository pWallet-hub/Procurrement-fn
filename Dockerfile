# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Fixed, not a build argument: the portal must call its own origin (/api/v1, proxied by nginx) so the SSO cookies stay
# on the portal's hostname. Coolify passes every env variable as a build arg, and a leftover absolute VITE_API_BASE
# (https://apipro...) was baked into the bundle and broke AFS sign-in with sso_error=expired.
ENV VITE_API_BASE=/api/v1
RUN npm run build

# --- serve ---
FROM nginx:1.27-alpine
RUN apk add --no-cache ca-certificates
# Runtime setting (see docker/10-upstream.envsh and nginx.conf). Default = the production API; docker-compose.yml overrides it for local use.
ENV API_UPSTREAM=https://apipro.afs-rwanda.org
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker/10-upstream.envsh /docker-entrypoint.d/10-upstream.envsh
RUN chmod +x /docker-entrypoint.d/10-upstream.envsh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
