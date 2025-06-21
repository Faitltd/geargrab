# Use specific Node.js version for consistency and caching
FROM node:18.19.0-alpine as build

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies with npm ci for faster, deterministic builds
RUN npm config set fetch-timeout 180000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm ci --include=dev --no-audit --no-fund

# Copy source code (separate layer for better caching)
COPY . .

# Set production environment variables for build
ENV NODE_ENV=production
ENV VITE_USE_EMULATORS=false
ENV VITE_APP_URL=https://geargrab.co

# Firebase configuration (will be overridden by Cloud Run environment variables)
ENV VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs
ENV VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=geargrabco
ENV VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028
ENV VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009

# Stripe configuration (required at build time for client-side)
ENV VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RZXbxBfCDZxMJmHHUzHwNJq1gNdpcMjp4kAJK28n8d5kTXPhI4pnptDiLJmyHybfhJzY7vIVZOaNrzJClCkY3vS00tMlh4lyZ
ENV STRIPE_SECRET_KEY=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

# Build the application
RUN npm run build

# Production stage - use same Node version for consistency
FROM node:18.19.0-alpine

WORKDIR /app

# Copy package files and install only production dependencies with npm ci
COPY --from=build /app/package*.json ./
RUN npm config set fetch-timeout 120000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm ci --omit=dev --no-audit --no-fund

# Copy built application
COPY --from=build /app/build ./build

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080

CMD ["node", "build/index.js"]