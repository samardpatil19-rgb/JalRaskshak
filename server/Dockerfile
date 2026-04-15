# Backend
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy server files
COPY server/ ./server/

# Seed database on first run
RUN node server/seed.js

EXPOSE 3001

CMD ["node", "server/server.js"]
