# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN HUSKY=0 npm ci

COPY . .
# Relative on purpose: in every environment the web and the API share one host
# (the reverse proxy routes /api/* to the backend), so one image works everywhere.
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# The stage name `runtime` is used by the deploy workflow (target: runtime).
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=80 \
    HOSTNAME=0.0.0.0
# Port 80 is opened by the non-root user: Docker sets net.ipv4.ip_unprivileged_port_start=0
# inside the container, so no extra capability or sysctl is needed.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 80
CMD ["node", "server.js"]
