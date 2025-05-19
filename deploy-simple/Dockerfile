FROM --platform=linux/amd64 node:18-slim

# Create app directory
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && apt-get clean

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY server.js ./

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:8080/ || exit 1

# Set non-root user for security
USER node

EXPOSE 8080

CMD ["node", "server.js"]