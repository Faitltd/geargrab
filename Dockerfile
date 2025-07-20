# Multi-stage Dockerfile for SvelteKit SSR Application
# Optimized for production deployment on Cloud Run

# ================================
# Stage 1: Dependencies
# ================================
FROM node:18-alpine AS deps
LABEL stage=deps

# Install system dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with npm ci for faster, reliable builds
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# ================================
# Stage 2: Build
# ================================
FROM node:18-alpine AS builder
LABEL stage=builder

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ARG PUBLIC_FIREBASE_API_KEY
ARG PUBLIC_FIREBASE_AUTH_DOMAIN
ARG PUBLIC_FIREBASE_PROJECT_ID
ARG PUBLIC_FIREBASE_STORAGE_BUCKET
ARG PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG PUBLIC_FIREBASE_APP_ID
ARG PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG PUBLIC_APP_URL

ENV NODE_ENV=$NODE_ENV
ENV PUBLIC_FIREBASE_API_KEY=$PUBLIC_FIREBASE_API_KEY
ENV PUBLIC_FIREBASE_AUTH_DOMAIN=$PUBLIC_FIREBASE_AUTH_DOMAIN
ENV PUBLIC_FIREBASE_PROJECT_ID=$PUBLIC_FIREBASE_PROJECT_ID
ENV PUBLIC_FIREBASE_STORAGE_BUCKET=$PUBLIC_FIREBASE_STORAGE_BUCKET
ENV PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV PUBLIC_FIREBASE_APP_ID=$PUBLIC_FIREBASE_APP_ID
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=$PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV PUBLIC_APP_URL=$PUBLIC_APP_URL

# Build the application
RUN npm run build

# Remove development dependencies to reduce image size
RUN npm prune --production

# ================================
# Stage 3: Runtime
# ================================
FROM node:18-alpine AS runtime
LABEL stage=runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Copy built application from builder stage
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./package.json

# Copy production dependencies from deps stage
COPY --from=deps --chown=sveltekit:nodejs /app/node_modules ./node_modules

# Copy static assets if they exist
COPY --from=builder --chown=sveltekit:nodejs /app/static ./static

# Copy any additional runtime files
COPY --from=builder --chown=sveltekit:nodejs /app/src/app.html ./src/app.html

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs && chown -R sveltekit:nodejs /app

# Switch to non-root user
USER sveltekit

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "build"]
