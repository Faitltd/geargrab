FROM node:18-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Clean install with legacy peer deps to avoid conflicts
RUN npm ci --include=dev --legacy-peer-deps

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV VITE_USE_EMULATORS=false
ENV VITE_APP_URL=https://geargrab.co

# Firebase configuration
ENV VITE_FIREBASE_API_KEY=AIzaSyANV1v2FhD2ktXxBUsfGrDm9442dGGCuYs
ENV VITE_FIREBASE_AUTH_DOMAIN=geargrabco.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=geargrabco
ENV VITE_FIREBASE_STORAGE_BUCKET=geargrabco.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=227444442028
ENV VITE_FIREBASE_APP_ID=1:227444442028:web:6eeaed1e136d07f5b73009

# Stripe configuration
ENV VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RZXbxBfCDZxMJmHHUzHwNJq1gNdpcMjp4kAJK28n8d5kTXPhI4pnptDiLJmyHybfhJzY7vIVZOaNrzJClCkY3vS00tMlh4lyZ

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy built application
COPY --from=build /app/build ./build

# Copy static files
COPY --from=build /app/static ./static

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001 && \
    chown -R sveltekit:nodejs /app

USER sveltekit

EXPOSE 8080

CMD ["node", "build/index.js"]