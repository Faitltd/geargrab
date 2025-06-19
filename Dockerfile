FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean cache and ignore optional dependencies
RUN npm cache clean --force && \
    npm ci --only=production --ignore-scripts && \
    npm ci --ignore-scripts

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
ENV STRIPE_SECRET_KEY=sk_live_placeholder_will_be_overridden_by_cloud_run

# Build with error handling
RUN npm run build || (echo "Build failed, checking for missing dependencies..." && npm install --save-dev mini-svg-data-uri lodash.castarray && npm run build)

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "build/index.js"]