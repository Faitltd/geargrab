FROM node:20-slim

WORKDIR /app

# Copy only what we need
COPY server.js .

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]