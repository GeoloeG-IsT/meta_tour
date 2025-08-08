# syntax=docker/dockerfile:1

# Use Node 18 on Alpine for a small image
FROM node:22-alpine AS base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install system deps needed by Next.js sharp on Alpine
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
RUN ls -la
# Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN pwd
RUN ls -la
RUN npm run build

# Production runtime image
FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

WORKDIR /app

# Copy only what we need to run
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080

# Start Next.js server; Cloud Run will set PORT env var
CMD ["npm", "run", "start", "--", "-p", "8080"]


