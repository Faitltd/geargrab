FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the SvelteKit app
RUN npm run build

# Production stage
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "build/index.js"]
