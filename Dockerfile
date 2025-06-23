FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm install --include=dev

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

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

# Copy built application and static files
COPY --from=build /app/build ./build
COPY --from=build /app/static ./static

# Also copy static files directly from source (in case build doesn't preserve them)
COPY static ./static

# Set environment variables (PORT is automatically set by Cloud Run)
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080

CMD ["node", "build/index.js"]