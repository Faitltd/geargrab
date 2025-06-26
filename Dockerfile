# Multi-stage build for reliable deployment
FROM node:18-alpine AS build

WORKDIR /app

# Install build dependencies including Python for native modules
RUN apk add --no-cache python3 make g++ git

# Copy package files first for better caching
COPY package*.json ./

# Use npm install instead of npm ci for better compatibility
# Clear npm cache first to avoid conflicts
RUN npm cache clean --force && \
    npm install --include=dev --no-audit --no-fund

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV VITE_USE_EMULATORS=false
ENV VITE_APP_URL=https://geargrab.co

# Firebase configuration (public keys safe to include)
ENV VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs
ENV VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=geargrabco
ENV VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028
ENV VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009

# Stripe configuration (public key safe to include)
ENV VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RZXbxBfCDZxMJmHHUzHwNJq1gNdpcMjp4kAJK28n8d5kTXPhI4pnptDiLJmyHybfhJzY7vIVZOaNrzJClCkY3vS00tMlh4lyZ

# Build the application with error handling
RUN npm run build || (echo "Build failed, checking logs..." && cat /app/build.log 2>/dev/null || echo "No build log found" && exit 1)

# Production stage - optimized for reliability
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies with better error handling
COPY --from=build /app/package*.json ./
RUN npm cache clean --force && \
    npm install --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# Copy built application and verify it exists
COPY --from=build /app/build ./build
RUN ls -la ./build && test -f ./build/index.js || (echo "Build files missing!" && exit 1)

# Copy static files
COPY --from=build /app/static ./static

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001 && \
    chown -R sveltekit:nodejs /app

# Switch to non-root user
USER sveltekit

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "build/index.js"]