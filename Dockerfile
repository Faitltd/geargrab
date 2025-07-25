# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built application and server
COPY dist ./dist
COPY server.js ./

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
